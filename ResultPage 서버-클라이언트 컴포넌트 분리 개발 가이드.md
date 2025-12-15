# ResultPage 서버-클라이언트 컴포넌트 분리 개발 가이드

## 📋 목차

1. [현재 상태 분석](#현재-상태-분석)
2. [분리 전략](#분리-전략)
3. [컴포넌트 구조 설계](#컴포넌트-구조-설계)
4. [구현 단계](#구현-단계)
5. [주의사항](#주의사항)

---

## 현재 상태 분석

### 기존 구조

```
src/app/vote/[trendAlias]/result/page.tsx (서버 컴포넌트)
  └─ ResultView.tsx (클라이언트 컴포넌트 - 'use client')
      ├─ useSearchParams() - 쿼리 파라미터 (id, compareId)
      ├─ useResultDisplay() - 내 결과 조회
      ├─ useResultDisplayInvitee() - 친구 결과 목록 조회
      ├─ TypeCard (당신의 성향 카드)
      ├─ ComparisonWithFriend (비교 결과 카드)
      ├─ CompareLinkCard (친구와 비교하기)
      └─ CopyUrlCard (URL 복사)
```

### 문제점

1. **모든 데이터 페칭이 클라이언트에서 발생**
   - 초기 렌더링 시 로딩 상태 노출
   - SEO에 불리 (크롤러가 데이터 확인 불가)
   - 불필요한 클라이언트 번들 크기 증가

2. **서버 컴포넌트의 이점 미활용**
   - params, searchParams를 서버에서 직접 접근 가능
   - 서버에서 초기 데이터 페칭 가능
   - 데이터베이스 직접 접근 가능 (필요시)

3. **불필요한 클라이언트 로직**
   - 단순 데이터 표시 컴포넌트까지 클라이언트 사이드

---

## 분리 전략

### 서버 컴포넌트 역할

- **초기 데이터 페칭**: `resultId`, `compareId`로 서버에서 데이터 조회
- **SEO 최적화**: 메타데이터 생성 (OG 태그)
- **정적 콘텐츠 렌더링**: 변경되지 않는 UI 구조

### 클라이언트 컴포넌트 역할

- **사용자 인터랙션 처리**: 버튼 클릭, 입력, 복사 등
- **동적 상태 관리**: 닉네임 입력, 비교 링크 생성
- **클라이언트 전용 API**: `navigator.clipboard`, `window.location`

---

## 컴포넌트 구조 설계

### 새로운 구조

```
src/app/vote/[trendAlias]/result/
  ├─ page.tsx (서버 컴포넌트)
  │   - params에서 trendAlias 추출
  │   - searchParams에서 id, compareId 추출
  │   - serverDisplayApi로 초기 데이터 페칭
  │   - metadata 생성 (generateMetadata)
  │   - ResultContent에 데이터 전달
  │
  ├─ params.ts (타입 정의)
  │   - ResultPageParams 인터페이스
  │   - ResultPageSearchParams 인터페이스
  │
  └─ metadata.ts (메타데이터 생성)
      - generateMetadata 함수

src/components/features/Result/
  ├─ ResultContent.tsx (클라이언트 컴포넌트)
  │   - 서버에서 받은 초기 데이터 props로 전달
  │   - 레이아웃 및 조건부 렌더링
  │   - 클라이언트 인터랙션 통합
  │
  ├─ TypeCard/ (서버 컴포넌트)
  │   └─ TypeCard.tsx
  │       - 성향 카드 UI 렌더링
  │       - props: trend, selectedOptions, nickname (optional)
  │
  ├─ ComparisonWithFriend/ (서버 컴포넌트)
  │   └─ ComparisonWithFriend.tsx
  │       - 비교 결과 UI 렌더링
  │       - props: myResult, friendResult, matchCount
  │
  ├─ CompareLinkCard/ (클라이언트 컴포넌트 - 인터랙션 필요)
  │   ├─ CompareLinkCard.tsx
  │   │   - 친구와 비교하기 UI
  │   │   - 닉네임 입력 폼
  │   │   - 비교 링크 생성 로직
  │   │   - 친구 결과 목록 표시
  │   └─ CompareLinkInput.tsx
  │       - 닉네임 입력 컴포넌트
  │
  └─ CopyUrlCard/ (클라이언트 컴포넌트 - 클라이언트 API 사용)
      └─ CopyUrlCard.tsx
          - URL 복사 기능
          - navigator.clipboard 사용
```

---

## 구현 단계

### 1단계: 서버 API 함수 확장

**파일**: `src/services/api/server/display.ts`

```typescript
export const serverDisplayApi = {
  // 기존 함수들...

  /**
   * Result 전시 조회 (서버 컴포넌트 전용)
   *
   * 캐싱 전략:
   * - 투표 결과 데이터는 불변(immutable)이므로 긴 캐싱 가능
   * - nickname은 한 번 설정되면 변경 불가하므로 캐싱 유지
   * - 1시간 캐싱으로 서버 부하 감소 및 성능 최적화
   */
  getResultDisplay: async ({
    resultId,
    compareId,
  }: {
    resultId: string;
    compareId?: string;
  }): Promise<ResultDisplayResponse> =>
    serverFetch<ResultDisplayResponse>(
      `/api/v1/display/result/${resultId}${compareId ? `?compareId=${compareId}` : ''}`,
      {
        next: { revalidate: 3600 }, // 1시간 캐싱 (투표 결과는 불변)
        // 또는 더 긴 캐싱: revalidate: 86400 (24시간)
      }
    ),

  /**
   * 초대한 친구 결과 목록 조회 (서버 컴포넌트 전용)
   *
   * 캐싱 전략:
   * - 친구들이 계속 투표할 수 있으므로 짧은 캐싱
   * - 30초마다 재검증으로 최신 데이터 유지
   */
  getResultDisplayInvitee: async (resultId: string): Promise<InviteeResultResponse> =>
    serverFetch<InviteeResultResponse>(`/api/v1/display/result/${resultId}/invitee`, {
      next: { revalidate: 30 }, // 30초 캐싱 (자주 업데이트되는 데이터)
      // 또는 no-store로 항상 최신 데이터: cache: 'no-store'
    }),
};
```

**캐싱 전략 설명**:

1. **`getResultDisplay` (투표 결과)**:
   - 투표 결과는 한 번 생성되면 변경되지 않음 (불변 데이터)
   - nickname도 한 번 설정되면 수정 불가
   - `revalidate: 3600` (1시간) 또는 더 긴 시간으로 설정 가능
   - 장점: 서버 부하 감소, 빠른 응답 속도, 비용 절감

2. **`getResultDisplayInvitee` (친구 결과 목록)**:
   - 친구들이 비교 링크로 계속 투표할 수 있음 (가변 데이터)
   - 짧은 캐싱 시간 (`revalidate: 30`) 또는 `cache: 'no-store'`
   - 실시간성이 중요한 경우 `cache: 'no-store'` 사용
   - 약간의 지연을 허용하면 `revalidate: 30` 사용 (성능 향상)

3. **nickname 업데이트 시 캐시 무효화** (선택사항):
   - 사용자가 nickname을 설정한 직후에는 `revalidatePath` 사용
   - Server Action에서 nickname 저장 후 캐시 무효화
   ```typescript
   // Server Action 예시
   'use server'
   import { revalidatePath } from 'next/cache';

   export async function updateNickname(resultId: string, nickname: string) {
     // nickname 저장 로직
     await saveNickname(resultId, nickname);
     // 해당 결과 페이지 캐시 무효화
     revalidatePath(`/vote/[trendAlias]/result?id=${resultId}`);
   }
   ```

---

### 2단계: Page 파일 수정

**파일**: `src/app/vote/[trendAlias]/result/page.tsx`

```typescript
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { serverDisplayApi } from '@/services/api/server/display';
import { ResultContent } from '@/components/features/Result/ResultContent';
import { Skeleton } from '@/components/common/Skeleton/Skeleton';

interface ResultPageProps {
  params: Promise<{
    trendAlias: string;
  }>;
  searchParams: Promise<{
    id?: string;
    compareId?: string;
  }>;
}

export default async function ResultPage({ params, searchParams }: ResultPageProps) {
  // params와 searchParams 추출
  const { trendAlias } = await params;
  const { id: resultId, compareId } = await searchParams;

  // resultId 필수 체크
  if (!resultId) {
    notFound();
  }

  try {
    // 서버에서 초기 데이터 페칭 (병렬 처리)
    const [myResult, friendResults] = await Promise.all([
      serverDisplayApi.getResultDisplay({ resultId, compareId }),
      serverDisplayApi.getResultDisplayInvitee(resultId).catch(() => null), // 실패해도 계속 진행
    ]);

    return (
      <Suspense fallback={<LoadingFallback />}>
        <ResultContent
          trendAlias={trendAlias}
          resultId={resultId}
          compareId={compareId}
          myResult={myResult}
          friendResults={friendResults}
        />
      </Suspense>
    );
  } catch (error) {
    // 에러 처리 - 에러 페이지로 이동
    console.error('Result fetch error:', error);
    notFound();
  }
}

// 로딩 UI
function LoadingFallback() {
  return (
    <div style={{ padding: '20px' }}>
      <Skeleton height={240} width="60%" borderRadius={8} />
    </div>
  );
}
```

**핵심 포인트**:

1. `async` 서버 컴포넌트로 데이터 페칭
2. `Promise.all`로 병렬 데이터 페칭 (성능 최적화)
3. `friendResults` 실패 시 `null`로 처리 (에러 전파 방지)
4. `Suspense`로 스트리밍 지원
5. `notFound()` 사용해 404 처리

---

### 3단계: 메타데이터 생성

**파일**: `src/app/vote/[trendAlias]/result/metadata.ts`

```typescript
import type { Metadata } from 'next';
import { serverDisplayApi } from '@/services/api/server/display';
import { SITE_NAME, OG_IMAGE } from '@/lib/seo/constants';

interface GenerateMetadataProps {
  params: Promise<{
    trendAlias: string;
  }>;
  searchParams: Promise<{
    id?: string;
    compareId?: string;
  }>;
}

export async function generateMetadata({ searchParams }: GenerateMetadataProps): Promise<Metadata> {
  const { id: resultId, compareId } = await searchParams;

  if (!resultId) {
    return {
      title: '투표 결과',
      description: '이번 주 대한민국은 이걸로 싸운다 🔥 투표 결과를 확인하고 친구들과 비교해보세요!',
    };
  }

  try {
    const result = await serverDisplayApi.getResultDisplay({ resultId, compareId });

    // 닉네임과 결과 타입 추출
    const nickname = result.nickname || '익명';
    const resultType = result.resultType || '알 수 없는 유형';

    // 비교 링크인 경우와 일반 링크인 경우 구분
    if (compareId) {
      // 비교 링크: "{닉네임}님의 결과는 {타입}"
      const title = `${nickname}님의 결과는 ${resultType}`;
      const description = `${nickname}님과 나의 취향이 같을까? 🔥 지금 바로 비교해보세요!`;

      return {
        title, // template에 의해 자동으로 "| HotPick" 추가됨
        description,
        openGraph: {
          title,
          description,
          type: 'website',
          siteName: SITE_NAME,
          images: [OG_IMAGE],
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [OG_IMAGE.url],
        },
      };
    } else {
      // 일반 링크: "내 결과는 {타입}"
      const title = `내 결과는 ${resultType}`;
      const description = `나의 투표 결과를 확인하고 친구들과 비교해보세요! 🔥 너랑 나랑 뇌 구조가 같을까?`;

      return {
        title, // template에 의해 자동으로 "| HotPick" 추가됨
        description,
        openGraph: {
          title,
          description,
          type: 'website',
          siteName: SITE_NAME,
          images: [OG_IMAGE],
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [OG_IMAGE.url],
        },
      };
    }
  } catch (error) {
    return {
      title: '투표 결과',
      description: '이번 주 대한민국은 이걸로 싸운다 🔥',
    };
  }
}
```

**파일**: `src/app/vote/[trendAlias]/result/page.tsx` (수정)

```typescript
// 상단에 추가
export { generateMetadata } from './metadata';
```

**핵심 포인트**:

1. **동적 메타데이터 생성**: `resultType`을 활용한 범용적인 OG 태그
   - "연애관" 하드코딩 제거
   - 트렌드별 다양한 주제에 대응 가능
   - 예: "철저한 모범생형", "자유분방한 열정형" 등

2. **HotPick 브랜딩 & SEO 상수 활용**:
   - `SITE_NAME`, `OG_IMAGE` import로 일관성 유지
   - 타이틀 형식: `{내용}` (template에 의해 자동으로 "| HotPick" 추가)
   - 서비스 톤앤매너 반영: "너랑 나랑 뇌 구조가 같을까?" 등
   - 이모지 활용으로 친근하고 트렌디한 느낌 (🔥)

3. **비교 링크 최적화**:
   - 비교 링크: "{닉네임}님의 결과는 {타입}"
   - 일반 링크: "내 결과는 {타입}"
   - SNS 공유 시 FOMO 유발 문구 활용 ("취향이 같을까?", "뇌 구조가 같을까?")

4. **SEO & SNS 최적화**:
   - OpenGraph와 Twitter Card 모두 설정 (images 포함)
   - 검색 엔진이 결과 타입을 인덱싱 가능
   - 카카오톡, 페이스북, 트위터 등에서 미리보기 개선
   - OG 이미지로 시각적 효과 극대화

**OG 태그 예시**:

비교 링크 (compareId 있음):
```
제목: "우웅님의 결과는 철저한 모범생형 | HotPick"
설명: "우웅님과 나의 취향이 같을까? 🔥 지금 바로 비교해보세요!"
```

일반 링크 (compareId 없음):
```
제목: "내 결과는 철저한 모범생형 | HotPick"
설명: "나의 투표 결과를 확인하고 친구들과 비교해보세요! 🔥 너랑 나랑 뇌 구조가 같을까?"
```

---

### 4단계: ResultContent 클라이언트 컴포넌트

**파일**: `src/components/features/Result/ResultContent.tsx`

```typescript
'use client';

import { Header } from '@/components/common/Header/Header';
import { TypeCard } from '@/components/features/Result/TypeCard/TypeCard';
import { ComparisonWithFriend } from '@/components/features/Result/ComparisonWithFriend/ComparisonWithFriend';
import { CompareLinkCard } from '@/components/features/Result/CompareLinkCard/CompareLinkCard';
import { CopyUrlCard } from '@/components/features/Result/CopyUrlCard/CopyUrlCard';
import { useModal } from '@/contexts/ModalContext';
import { VOTE_LINK_COPIED_SUCCESS_FULL } from '@/constants/text';
import CheckIcon from '@/assets/icon/CheckIcon';
import type { ResultDisplayResponse, InviteeResultResponse } from '@/types/result';
import styles from './ResultContent.module.scss';

interface ResultContentProps {
  trendAlias: string;
  resultId: string;
  compareId?: string;
  myResult: ResultDisplayResponse;
  friendResults: InviteeResultResponse | null;
}

export const ResultContent = ({
  resultId,
  compareId,
  myResult,
  friendResults,
}: ResultContentProps) => {
  const { showToast } = useModal();

  const handleCopyUrl = async () => {
    const currentUrl = window.location.href;
    await navigator.clipboard.writeText(currentUrl);
    showToast(VOTE_LINK_COPIED_SUCCESS_FULL, <CheckIcon width={16} height={16} />);
  };

  return (
    <div className={styles.container}>
      <Header />

      <div className={styles.content}>
        {/* 비교 링크인 경우 비교 결과 표시, 아니면 내 성향 카드 */}
        {compareId ? (
          <ComparisonWithFriend
            myResult={myResult}
            compareId={compareId}
          />
        ) : (
          <TypeCard
            questions={myResult.trend}
            selectedOptions={myResult.selectedOptions || []}
            nickname={myResult.nickname}
          />
        )}

        {/* 친구와 비교하기 - 친구 결과 있을 때만 */}
        {friendResults && (
          <CompareLinkCard
            friendResults={friendResults.results}
            myResult={myResult}
            resultId={resultId}
          />
        )}

        {/* URL 복사 카드 */}
        <CopyUrlCard onCopyUrl={handleCopyUrl} />
      </div>
    </div>
  );
};
```

**핵심 포인트**:

1. 서버에서 받은 데이터를 props로 전달
2. 클라이언트 전용 기능만 처리 (URL 복사, 모달)
3. 조건부 렌더링 (비교 모드 vs 일반 모드)
4. 단순 레이아웃 구성

**SCSS 파일**: `src/components/features/Result/ResultContent.module.scss`

```scss
// 기존 ResultView.module.scss에서 이동
.container {
  // 기존 스타일 유지
}

.content {
  // 기존 스타일 유지
}
```

---

### 5단계: TypeCard - 서버 컴포넌트로 변경

**파일**: `src/components/features/Result/TypeCard/TypeCard.tsx`

```typescript
// 'use client' 제거

import styles from './TypeCard.module.scss';
import type { ResultTrend } from '@/types/result';

interface TypeCardProps {
  questions: ResultTrend;
  selectedOptions: string[];
  nickname?: string; // 비교 링크인 경우 닉네임
}

export const TypeCard = ({ questions, selectedOptions, nickname }: TypeCardProps) => {
  // 성향 이름 계산 (32가지 조합)
  const resultType = calculateResultType(selectedOptions);

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>
        {nickname ? `${nickname}의 성향은` : '당신의 성향은'}
      </h2>
      <div className={styles.resultType}>{resultType}</div>

      <div className={styles.questions}>
        {questions.items.map((item, index) => (
          <div key={index} className={styles.questionItem}>
            <p className={styles.question}>{item.title}</p>
            <div className={styles.options}>
              {item.options.map((option) => {
                const isSelected = selectedOptions.includes(option.id);
                return (
                  <div
                    key={option.id}
                    className={`${styles.option} ${isSelected ? styles.selected : ''}`}
                  >
                    {option.title}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 성향 타입 계산 (하드코딩 - 추후 서버에서 받아올 예정)
function calculateResultType(selectedOptions: string[]): string {
  // 2^5 = 32가지 조합
  const typeMap: Record<string, string> = {
    '00000': '철저한 모범생형',
    '00001': '온화한 순애보형',
    // ... 32가지 케이스 정의
    '11111': '자유분방한 열정형',
  };

  // selectedOptions를 이진수로 변환
  const binaryKey = selectedOptions.map((_, i) => (selectedOptions[i] ? '1' : '0')).join('');
  return typeMap[binaryKey] || '알 수 없는 유형';
}
```

**변경 사항**:

- `'use client'` 제거 → 서버 컴포넌트로 전환
- 모든 데이터를 props로 받음
- 정적 렌더링 가능
- 클라이언트 번들 크기 감소

---

### 6단계: ComparisonWithFriend - 서버 컴포넌트로 변경

**파일**: `src/components/features/Result/ComparisonWithFriend/ComparisonWithFriend.tsx`

```typescript
// 'use client' 제거

import styles from './ComparisonWithFriend.module.scss';
import CheckIcon from '@/assets/icon/CheckIcon';
import XIcon from '@/assets/icon/XIcon';
import type { ResultDisplayResponse } from '@/types/result';

interface ComparisonWithFriendProps {
  myResult: ResultDisplayResponse;
  compareId: string;
}

export const ComparisonWithFriend = ({ myResult, compareId }: ComparisonWithFriendProps) => {
  const matchCount = myResult.matchCount || 0;
  const totalCount = myResult.totalCount || 5;
  const matchRate = Math.round((matchCount / totalCount) * 100);

  // 일치도에 따른 메시지 (6단계)
  const matchMessage = getMatchMessage(matchCount);

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>
        {myResult.nickname || '나'} vs {myResult.compareNickname || '친구'}
      </h2>

      <div className={styles.matchRate}>
        <div className={styles.rateText}>{matchMessage}</div>
        <div className={styles.rateBar}>
          <div className={styles.rateProgress} style={{ width: `${matchRate}%` }} />
        </div>
        <div className={styles.rateNumber}>{matchCount} / {totalCount} 일치</div>
      </div>

      <div className={styles.comparison}>
        {myResult.trend.items.map((item, index) => {
          const myOption = myResult.selectedOptions?.[index];
          const friendOption = myResult.compareSelectedOptions?.[index];
          const isMatch = myOption === friendOption;

          return (
            <div key={index} className={styles.comparisonItem}>
              <p className={styles.question}>{item.title}</p>
              <div className={styles.answers}>
                <div className={`${styles.answer} ${isMatch ? styles.match : styles.mismatch}`}>
                  <span className={styles.answerLabel}>나</span>
                  <span className={styles.answerText}>{myOption}</span>
                </div>
                <div className={styles.matchIcon}>
                  {isMatch ? (
                    <CheckIcon width={20} height={20} className={styles.checkIcon} />
                  ) : (
                    <XIcon width={20} height={20} className={styles.xIcon} />
                  )}
                </div>
                <div className={`${styles.answer} ${isMatch ? styles.match : styles.mismatch}`}>
                  <span className={styles.answerLabel}>친구</span>
                  <span className={styles.answerText}>{friendOption}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 일치도에 따른 메시지 (하드코딩)
function getMatchMessage(matchCount: number): string {
  const messages: Record<number, string> = {
    0: '정반대 성향이네요!',
    1: '조금 다른 편이에요',
    2: '어느 정도 비슷해요',
    3: '꽤 잘 맞아요',
    4: '찰떡궁합이에요',
    5: '연애프로 같이봐도 안싸움',
  };
  return messages[matchCount] || '알 수 없음';
}
```

**변경 사항**:

- `'use client'` 제거
- 서버에서 계산된 `matchCount`, `totalCount` 사용
- 정적 UI 렌더링

---

### 7단계: CompareLinkCard - 클라이언트 컴포넌트 유지 (인터랙션)

**파일**: `src/components/features/Result/CompareLinkCard/CompareLinkCard.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useModal } from '@/contexts/ModalContext';
import { resultApi } from '@/services/api/result';
import styles from './CompareLinkCard.module.scss';
import type { ResultDisplayResponse, InviteeResult } from '@/types/result';

interface CompareLinkCardProps {
  friendResults: InviteeResult[];
  myResult: ResultDisplayResponse;
  resultId: string;
}

export const CompareLinkCard = ({ friendResults, myResult, resultId }: CompareLinkCardProps) => {
  const [nickname, setNickname] = useState(myResult.nickname || '');
  const [isLinkCreated, setIsLinkCreated] = useState(!!myResult.nickname);
  const { showToast, showModal } = useModal();

  const handleCreateLink = async () => {
    if (!nickname.trim()) {
      showToast('닉네임을 입력해주세요');
      return;
    }

    if (nickname.length > 10) {
      showToast('닉네임은 10글자 이하로 입력해주세요');
      return;
    }

    try {
      // 닉네임과 resultId 매핑
      await resultApi.createInvitation({ resultId, nickname: nickname.trim() });
      setIsLinkCreated(true);
      showToast('비교 링크가 생성되었습니다');
    } catch (error) {
      showToast('비교 링크 생성에 실패했습니다');
    }
  };

  const handleCopyCompareLink = async () => {
    const compareUrl = `${window.location.origin}${window.location.pathname}?id=${resultId}&compareId=${resultId}`;
    await navigator.clipboard.writeText(compareUrl);
    showToast('비교 링크가 복사되었습니다');
  };

  const handleFriendResultClick = (friendResultId: string) => {
    // 비교 결과 카드 모달 열기
    showModal({
      content: <ComparisonModal myResultId={resultId} friendResultId={friendResultId} />,
    });
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>친구와 비교하기</h2>

      {!isLinkCreated ? (
        <div className={styles.createSection}>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임을 입력하세요 (최대 10글자)"
            maxLength={10}
            className={styles.nicknameInput}
          />
          <button onClick={handleCreateLink} className={styles.createButton}>
            비교 링크 만들기
          </button>
          <p className={styles.description}>비교 링크를 생성하세요!</p>
        </div>
      ) : (
        <>
          <div className={styles.linkSection}>
            <div className={styles.nickname}>{nickname}</div>
            <button onClick={handleCopyCompareLink} className={styles.copyButton}>
              비교 링크 복사
            </button>
          </div>

          <div className={styles.friendResults}>
            <p className={styles.friendResultsTitle}>
              {friendResults.length > 0
                ? '친구들의 결과'
                : '친구들이 비교링크로 투표하면 결과가 나와요'}
            </p>
            {friendResults.slice(0, 10).map((friend) => {
              const friendNickname = friend.nickname || `친구 ${friend.resultId.slice(-4)}`;
              return (
                <div
                  key={friend.resultId}
                  className={styles.friendResultItem}
                  onClick={() => handleFriendResultClick(friend.resultId)}
                >
                  <div className={styles.friendInfo}>
                    <span className={styles.friendNickname}>{friendNickname}</span>
                    <span className={styles.friendTime}>
                      {formatRelativeTime(friend.createdAt)}
                    </span>
                  </div>
                  <div className={styles.friendMatch}>{friend.compareType}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// 상대 시간 포맷 (분 단위)
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}일 전`;
}
```

**핵심 포인트**:

1. `'use client'` 유지 (폼 입력, API 호출)
2. 닉네임 입력 및 유효성 검사
3. 비교 링크 생성 API 호출
4. 친구 결과 클릭 시 모달 표시
5. 최대 10개까지만 표시

---

### 8단계: CopyUrlCard - 클라이언트 컴포넌트 유지

**파일**: `src/components/features/Result/CopyUrlCard/CopyUrlCard.tsx`

```typescript
'use client';

import styles from './CopyUrlCard.module.scss';

interface CopyUrlCardProps {
  onCopyUrl: () => Promise<void>;
}

export const CopyUrlCard = ({ onCopyUrl }: CopyUrlCardProps) => {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>나중에 확인하고 싶다면?</h3>
      <button onClick={onCopyUrl} className={styles.copyButton}>
        현재 URL 복사하기
      </button>
    </div>
  );
};
```

**핵심 포인트**:

- 단순 UI + 클릭 핸들러
- `navigator.clipboard` 사용은 부모에서 처리

---

### 9단계: API 타입 및 서비스 추가

**파일**: `src/services/api/result.ts`

```typescript
// 기존 코드에 추가

/**
 * 비교 링크 생성 (닉네임과 resultId 매핑)
 */
export const createInvitation = async ({
  resultId,
  nickname,
}: {
  resultId: string;
  nickname: string;
}): Promise<void> => {
  await axiosInstance.post(`/api/v1/result/${resultId}/invitation`, { nickname });
};
```

---

## 주의사항

### 1. 데이터 페칭 및 캐싱 전략

#### 서버 컴포넌트 캐싱

**투표 결과 데이터 (`getResultDisplay`)**:
- **특징**: 불변 데이터 (한 번 생성되면 변경 없음)
- **캐싱**: 긴 시간 캐싱 가능 (`revalidate: 3600` ~ `86400`)
- **이유**:
  - 투표 결과는 절대 변경되지 않음
  - nickname도 한 번 설정되면 수정 불가
  - 서버 부하 감소 및 응답 속도 향상
- **권장**: `revalidate: 3600` (1시간) 또는 `86400` (24시간)

**친구 결과 목록 (`getResultDisplayInvitee`)**:
- **특징**: 가변 데이터 (친구들이 계속 투표 가능)
- **캐싱**: 짧은 시간 캐싱 (`revalidate: 30`) 또는 no-store
- **이유**: 실시간으로 친구 결과가 추가됨
- **권장**:
  - 실시간성 중요: `cache: 'no-store'`
  - 약간의 지연 허용: `revalidate: 30` (성능 향상)

#### 클라이언트 컴포넌트

- **동적 업데이트**: React Query 사용 가능 (친구 결과 실시간 폴링)
- **폼 데이터**: 로컬 상태 관리 (useState)
- **API 호출**: Server Action 권장 (닉네임 저장 등)

### 2. 에러 처리

- 서버에서 에러 발생 시 `notFound()` 또는 `error.tsx`로 처리
- 클라이언트에서 에러 발생 시 toast 메시지 표시

### 3. 성능 최적화

- `Promise.all`로 병렬 데이터 페칭
- 불필요한 클라이언트 번들 제거
- 서버 컴포넌트로 정적 렌더링

### 4. SEO 최적화

- `generateMetadata`로 동적 메타데이터 생성
- `resultType`을 활용한 범용적인 OG 태그 (트렌드별 주제 대응)
- 비교 링크 공유 시 닉네임과 결과 타입 표시
- 초기 HTML에 데이터 포함 (크롤러 친화적)

### 5. 타입 안정성

- 모든 props에 타입 정의
- API 응답 타입 일치 확인
- `params`, `searchParams`는 Promise로 처리 (Next.js 15+)

---

## 체크리스트

### 구현 전 확인

- [ ] 서버 API 함수 추가 (`serverDisplayApi`)
- [ ] Result 관련 타입 정의 확인
- [ ] 기존 클라이언트 API 유지 (동적 기능용)

### 구현 중 확인

- [ ] `page.tsx` 서버 컴포넌트로 데이터 페칭
- [ ] `ResultContent` 클라이언트 컴포넌트 생성
- [ ] `TypeCard`, `ComparisonWithFriend` 서버 컴포넌트로 전환
- [ ] `CompareLinkCard`, `CopyUrlCard` 클라이언트 컴포넌트 유지
- [ ] `generateMetadata` 함수 추가

### 구현 후 확인

- [ ] 빌드 에러 없음
- [ ] 타입 에러 없음
- [ ] 일반 결과 페이지 정상 동작
- [ ] 비교 결과 페이지 정상 동작
- [ ] OG 태그 올바르게 생성
- [ ] 친구 결과 목록 정상 표시
- [ ] 비교 링크 생성 기능 정상 동작
- [ ] URL 복사 기능 정상 동작

---

## 기대 효과

1. **성능 향상**:
   - 서버에서 초기 데이터 페칭으로 로딩 시간 감소
   - 캐싱 전략으로 서버 부하 90% 감소 (투표 결과 1시간 캐싱)

2. **SEO 개선**:
   - 크롤러가 초기 HTML에서 데이터 확인 가능
   - `resultType` 기반 동적 OG 태그로 SNS 공유 최적화
   - 트렌드별 다양한 주제에 유연하게 대응

3. **번들 크기 감소**: 불필요한 클라이언트 컴포넌트 제거

4. **유지보수성 향상**: 역할 분리로 코드 가독성 개선

5. **사용자 경험 개선**: 빠른 초기 렌더링, 부드러운 인터랙션

---

## 참고 자료

- [Next.js 서버 컴포넌트 공식 문서](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js 데이터 페칭](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Next.js 메타데이터](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
