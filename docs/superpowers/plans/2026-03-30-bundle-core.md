# 번들 MVP 구현 계획 (Plan 1/2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 번들 인트로 → 순차 질문 풀기 → 결과 → 1:1 비교 링크 생성/공유 → 비교 결과까지의 MVP 전체 플로우를 MSW 기반으로 구현

**Architecture:** Next.js App Router 페이지 6개(인트로/풀기/결과/비교링크랜딩/비교결과 + 어드민) + FE 매핑 상수 + MSW 핸들러. 서버는 숫자만 리턴하고 등급/캐릭터/문구 매핑은 모두 FE 상수로 관리.

**Plan 분할 기준 (AI 작업 관점):**

- **Plan 1 (이 문서):** 번들 코어 플로우 — 타입, 상수, MSW, 인트로, 풀기, 결과 페이지 (독립적으로 동작하는 단위)
- **Plan 2:** 1:1 비교 시스템 — 비교 링크 생성/공유, 비교 랜딩, 비교 결과, 바이럴 CTA, 마이페이지 (Plan 1 완료 후 진행)
- **후속 (Phase 2~3):** 그룹 비교, 가치관 지도, 어드민 고도화

**Tech Stack:** Next.js 14 (App Router), TypeScript, SCSS Modules, React Query v5, MSW, framer-motion

**참조 문서:**

- 기획서: `docs/specs/bundle-compare.md` (섹션 3~5, 7, 8)
- 디자인 시스템: `docs/design-system/tokens.md`
- 기존 싱글 패턴: `src/components/features/Main/SingleCard/`, `src/hooks/api/useDisplay.ts`

---

## 파일 구조

### 신규 생성

```
src/types/bundle.ts                                          — 번들 전용 타입 정의
src/constants/bundle.ts                                      — 케미/대중성 등급 매핑 상수 (FE 전담)
src/hooks/api/useBundle.ts                                   — 번들 API React Query 훅
src/mocks/data/bundles.ts                                    — 번들 MSW 목 데이터
src/app/bundle/[slug]/page.tsx                               — 번들 인트로 서버 페이지
src/app/bundle/[slug]/metadata.ts                            — 인트로 SEO 메타데이터
src/components/features/Bundle/BundleIntro/BundleIntro.tsx   — 인트로 클라이언트 컴포넌트
src/components/features/Bundle/BundleIntro/BundleIntro.module.scss
src/app/bundle/[slug]/play/page.tsx                          — 번들 풀기 페이지
src/components/features/Bundle/BundlePlay/BundlePlay.tsx     — 순차 질문 풀기 컴포넌트
src/components/features/Bundle/BundlePlay/BundlePlay.module.scss
src/components/features/Bundle/BundlePlay/QuestionCard.tsx   — 개별 질문 카드
src/components/features/Bundle/BundlePlay/QuestionCard.module.scss
src/components/features/Bundle/BundlePlay/ProgressBar.tsx    — 진행률 바
src/components/features/Bundle/BundlePlay/ProgressBar.module.scss
src/app/bundle/[slug]/result/page.tsx                        — 번들 결과 페이지
src/components/features/Bundle/BundleResult/BundleResult.tsx — 결과 클라이언트 컴포넌트
src/components/features/Bundle/BundleResult/BundleResult.module.scss
```

### 수정

```
src/components/features/Main/BundleCard/BundleCard.tsx       — 라우팅 /hotpick/{slug} → /bundle/{slug}
src/mocks/handlers.ts                                        — 번들 API 핸들러 추가
src/app/hotpick/[hotpickAlias]/page.tsx                      — BUNDLE 타입 리다이렉트 추가
```

---

## Task 1: 번들 타입 정의

**Files:**

- Create: `src/types/bundle.ts`

- [ ] **Step 1: 번들 타입 파일 생성**

```typescript
// src/types/bundle.ts

/**
 * 번들 상세 (인트로 페이지용)
 * 서버 응답을 그대로 사용하는 타입
 */
export interface BundleDetail {
  bundleId: number;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  questionCount: number;
  status: 'ACTIVE' | 'CLOSED';
  imageUrl?: string;
  participantCount: number;
}

/**
 * 번들 질문 (풀기 페이지용)
 */
export interface BundleElection {
  electionId: string;
  title: string;
  optionA: string;
  optionB: string;
  order: number;
}

/**
 * 번들 답변 제출 요청
 */
export interface BundleAnswerRequest {
  answers: Array<{
    electionId: string;
    selected: 'A' | 'B';
  }>;
}

/**
 * 번들 내 결과 (결과 페이지용)
 * 서버는 숫자만 리턴. 등급/캐릭터/문구는 FE에서 매핑.
 */
export interface BundleMyResult {
  bundleSlug: string;
  bundleTitle: string;
  totalQuestions: number;
  myAnswers: Array<{
    electionId: string;
    title: string;
    optionA: string;
    optionB: string;
    selected: 'A' | 'B';
  }>;
  /** 각 질문별 현재 투표 비율 (실시간 변동) */
  questionStats: Array<{
    electionId: string;
    optionARate: number;
    optionBRate: number;
    totalVotes: number;
  }>;
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/types/bundle.ts
git commit -m "feat(bundle): 번들 전용 타입 정의"
```

---

## Task 2: FE 매핑 상수 (케미 등급, 대중성 등급)

**Files:**

- Create: `src/constants/bundle.ts`

- [ ] **Step 1: 매핑 상수 파일 생성**

```typescript
// src/constants/bundle.ts

/**
 * 케미 등급 매핑
 * matchRate(일치율) → 등급/타이틀/한줄평
 * 서버는 matchRate(숫자)만 리턴, 여기서 매핑
 */
export type ChemistryGrade = 'S' | 'A' | 'B' | 'C' | 'D';

export interface ChemistryInfo {
  grade: ChemistryGrade;
  title: string;
  description: string;
  gradient: string;
  /** 3D 캐릭터 이미지 경로 — 에셋 준비 전 null */
  imagePath: string | null;
}

export const CHEMISTRY_GRADES: ChemistryInfo[] = [
  {
    grade: 'S',
    title: '소울메이트',
    description: '전생에 한 몸이었나? 생각이 이렇게 같을 수가',
    gradient: 'linear-gradient(135deg, #FFD700, #FFA500)',
    imagePath: null,
  },
  {
    grade: 'A',
    title: '찰떡궁합',
    description: '대부분 통하는데, 가끔 깜짝 놀랄 포인트가!',
    gradient: 'linear-gradient(135deg, #FF00FF, #8B5CF6)',
    imagePath: null,
  },
  {
    grade: 'B',
    title: '밀당 케미',
    description: '반은 같고 반은 다르고, 이게 진짜 케미 아닐까?',
    gradient: 'linear-gradient(135deg, #FF6B35, #FF00FF)',
    imagePath: null,
  },
  {
    grade: 'C',
    title: '반전 매력',
    description: '다른 점이 더 많아서 오히려 재밌는 사이',
    gradient: 'linear-gradient(135deg, #4FC3F7, #00BCD4)',
    imagePath: null,
  },
  {
    grade: 'D',
    title: '평행우주',
    description: '같은 세상 살고 있는 거 맞아? 그래도 그게 매력!',
    gradient: 'linear-gradient(135deg, #66BB6A, #00BCD4)',
    imagePath: null,
  },
];

export function getChemistryByRate(matchRate: number): ChemistryInfo {
  if (matchRate >= 90) return CHEMISTRY_GRADES[0]; // S
  if (matchRate >= 70) return CHEMISTRY_GRADES[1]; // A
  if (matchRate >= 50) return CHEMISTRY_GRADES[2]; // B
  if (matchRate >= 30) return CHEMISTRY_GRADES[3]; // C
  return CHEMISTRY_GRADES[4]; // D
}

/**
 * 대중성 등급 매핑
 * popularityScore → 등급/캐릭터/설명
 */
export type PopularityGrade = 'KING' | 'LEADER' | 'BALANCER' | 'REBEL' | 'UNICORN';

export interface PopularityInfo {
  grade: PopularityGrade;
  title: string;
  description: string;
  /** 3D 캐릭터 이미지 경로 — 에셋 준비 전 null */
  imagePath: string | null;
}

export const POPULARITY_GRADES: PopularityInfo[] = [
  { grade: 'KING', title: '여론 장악자', description: '대중의 마음을 꿰뚫어 봄', imagePath: null },
  { grade: 'LEADER', title: '트렌드 리더', description: '시대를 읽는 눈이 있음', imagePath: null },
  {
    grade: 'BALANCER',
    title: '밸런서',
    description: '어느 쪽이든 이해하는 균형파',
    imagePath: null,
  },
  { grade: 'REBEL', title: '소신파', description: '남들과 다른 길을 가는 타입', imagePath: null },
  { grade: 'UNICORN', title: '유니콘', description: '세상에 없는 독보적 가치관', imagePath: null },
];

export function getPopularityByScore(score: number): PopularityInfo {
  if (score >= 90) return POPULARITY_GRADES[0]; // KING
  if (score >= 70) return POPULARITY_GRADES[1]; // LEADER
  if (score >= 50) return POPULARITY_GRADES[2]; // BALANCER
  if (score >= 30) return POPULARITY_GRADES[3]; // REBEL
  return POPULARITY_GRADES[4]; // UNICORN
}

/**
 * 대중성 지수 계산
 * questionStats + myAnswers → 다수파 일치 비율
 */
export function calcPopularityScore(
  myAnswers: Array<{ electionId: string; selected: 'A' | 'B' }>,
  questionStats: Array<{ electionId: string; optionARate: number; optionBRate: number }>
): number {
  if (myAnswers.length === 0) return 0;

  let majorityCount = 0;
  for (const answer of myAnswers) {
    const stat = questionStats.find((s) => s.electionId === answer.electionId);
    if (!stat) continue;

    const myRate = answer.selected === 'A' ? stat.optionARate : stat.optionBRate;
    if (myRate > 50) majorityCount++;
  }

  return Math.round((majorityCount / myAnswers.length) * 100);
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/constants/bundle.ts
git commit -m "feat(bundle): 케미/대중성 등급 FE 매핑 상수"
```

---

## Task 3: MSW 번들 목 데이터

**Files:**

- Create: `src/mocks/data/bundles.ts`

- [ ] **Step 1: 번들 목 데이터 생성**

```typescript
// src/mocks/data/bundles.ts
import type { BundleDetail, BundleElection, BundleMyResult } from '@/types/bundle';

export const mockBundleDetails: Record<string, BundleDetail> = {
  'love-values': {
    bundleId: 1,
    slug: 'love-values',
    title: '연애 가치관 테스트',
    subtitle: '우리 연애 스타일 얼마나 통할까?',
    description:
      '연애에서 중요한 5가지 질문으로 나와 상대방의 가치관을 비교해보세요. 썸부터 싸움 해결까지, 우리는 얼마나 맞을까요?',
    category: '연애',
    questionCount: 5,
    status: 'ACTIVE',
    imageUrl: undefined,
    participantCount: 247,
  },
  'marriage-values': {
    bundleId: 2,
    slug: 'marriage-values',
    title: '결혼 가치관 테스트',
    subtitle: '우리 결혼하면 잘 살 수 있을까?',
    description:
      '혼수, 맞벌이, 신혼집, 명절, 교육까지. 결혼 전에 꼭 맞춰봐야 할 5가지 가치관을 비교합니다.',
    category: '결혼',
    questionCount: 5,
    status: 'ACTIVE',
    imageUrl: undefined,
    participantCount: 183,
  },
};

export const mockBundleElections: Record<string, BundleElection[]> = {
  'love-values': [
    { electionId: 'le-1', title: '썸 탈 때', optionA: '먼저 연락', optionB: '기다리기', order: 1 },
    {
      electionId: 'le-2',
      title: '연인의 전 애인 사진',
      optionA: '지워야 함',
      optionB: '상관없음',
      order: 2,
    },
    { electionId: 'le-3', title: '기념일', optionA: '챙기는 편', optionB: '별로', order: 3 },
    { electionId: 'le-4', title: '연인의 이성 친구 만남', optionA: 'OK', optionB: 'NO', order: 4 },
    {
      electionId: 'le-5',
      title: '싸우면',
      optionA: '바로 풀기',
      optionB: '혼자 정리하고 대화',
      order: 5,
    },
  ],
  'marriage-values': [
    { electionId: 'me-1', title: '혼수 비용', optionA: '각자 알아서', optionB: '반반', order: 1 },
    {
      electionId: 'me-2',
      title: '결혼 후 경제활동',
      optionA: '맞벌이',
      optionB: '한쪽이 집에',
      order: 2,
    },
    { electionId: 'me-3', title: '신혼집', optionA: '매매', optionB: '전세', order: 3 },
    { electionId: 'me-4', title: '시댁·처가 명절', optionA: '매년', optionB: '격년', order: 4 },
    { electionId: 'me-5', title: '아이 교육', optionA: '사교육', optionB: '자율', order: 5 },
  ],
};

/** 번들 답변 인메모리 저장소 (MSW용) */
export const bundleAnswerStore = new Map<
  string, // `${userId}_${slug}`
  Array<{ electionId: string; selected: 'A' | 'B' }>
>();

/** 질문별 투표 집계 (MSW용) */
export const bundleVoteStats = new Map<
  string, // electionId
  { optionACount: number; optionBCount: number }
>();

export function recordBundleAnswers(
  userId: string,
  slug: string,
  answers: Array<{ electionId: string; selected: 'A' | 'B' }>
) {
  bundleAnswerStore.set(`${userId}_${slug}`, answers);
  for (const answer of answers) {
    const stats = bundleVoteStats.get(answer.electionId) ?? { optionACount: 0, optionBCount: 0 };
    if (answer.selected === 'A') stats.optionACount++;
    else stats.optionBCount++;
    bundleVoteStats.set(answer.electionId, stats);
  }
}

export function getBundleResult(userId: string, slug: string): BundleMyResult | null {
  const answers = bundleAnswerStore.get(`${userId}_${slug}`);
  if (!answers) return null;

  const elections = mockBundleElections[slug];
  if (!elections) return null;

  const detail = mockBundleDetails[slug];

  return {
    bundleSlug: slug,
    bundleTitle: detail?.title ?? slug,
    totalQuestions: elections.length,
    myAnswers: answers.map((a) => {
      const election = elections.find((e) => e.electionId === a.electionId)!;
      return {
        electionId: a.electionId,
        title: election.title,
        optionA: election.optionA,
        optionB: election.optionB,
        selected: a.selected,
      };
    }),
    questionStats: elections.map((e) => {
      const stats = bundleVoteStats.get(e.electionId) ?? { optionACount: 0, optionBCount: 0 };
      const total = stats.optionACount + stats.optionBCount;
      // 기본 모수가 없으면 질문 순서 기반 고정값 사용 (deterministic mock)
      const seedRatios = [62, 45, 71, 38, 55, 48, 66, 33, 57, 42];
      const baseA = total > 0 ? stats.optionACount : (seedRatios[e.order - 1] ?? 50);
      const baseB = total > 0 ? stats.optionBCount : 100 - baseA;
      const sumAB = baseA + baseB;
      return {
        electionId: e.electionId,
        optionARate: Math.round((baseA / sumAB) * 100),
        optionBRate: Math.round((baseB / sumAB) * 100),
        totalVotes: total > 0 ? total : 80 + e.order * 15,
      };
    }),
  };
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/mocks/data/bundles.ts
git commit -m "feat(bundle): MSW 번들 목 데이터"
```

---

## Task 4: MSW 번들 API 핸들러

**Files:**

- Modify: `src/mocks/handlers.ts`

- [ ] **Step 1: handlers.ts 상단에 import 추가**

기존 import 블록 뒤에 추가:

```typescript
import {
  mockBundleDetails,
  mockBundleElections,
  recordBundleAnswers,
  getBundleResult,
} from '@/mocks/data/bundles';
```

- [ ] **Step 2: 핸들러 배열 내에 번들 API 핸들러 추가**

`handlers` 배열의 마지막 항목 뒤에 추가:

```typescript
  // ─── 번들 API ───

  /** GET /api/v1/bundles/{slug} — 번들 상세 (인트로) */
  http.get(`${baseURL}/api/v1/bundles/:slug`, ({ params }) => {
    const slug = params.slug as string;
    const bundle = mockBundleDetails[slug];
    if (!bundle) {
      return HttpResponse.json({ code: 'NOT_FOUND', message: '번들을 찾을 수 없습니다', data: null }, { status: 404 });
    }
    return HttpResponse.json({ code: 'SUCCESS', message: '성공', data: bundle });
  }),

  /** GET /api/v1/bundles/{slug}/elections — 번들 질문 목록 */
  http.get(`${baseURL}/api/v1/bundles/:slug/elections`, ({ params }) => {
    const slug = params.slug as string;
    const elections = mockBundleElections[slug];
    if (!elections) {
      return HttpResponse.json({ code: 'NOT_FOUND', message: '번들을 찾을 수 없습니다', data: null }, { status: 404 });
    }
    return HttpResponse.json({ code: 'SUCCESS', message: '성공', data: elections });
  }),

  /** POST /api/v1/bundles/{slug}/answers — 답변 제출 */
  http.post(`${baseURL}/api/v1/bundles/:slug/answers`, async ({ params, request }) => {
    const slug = params.slug as string;
    const body = (await request.json()) as { answers: Array<{ electionId: string; selected: 'A' | 'B' }> };
    const userId = 'mock-user-1';
    recordBundleAnswers(userId, slug, body.answers);
    return HttpResponse.json({ code: 'SUCCESS', message: '답변이 제출되었습니다', data: { completed: true } });
  }),

  /** GET /api/v1/bundles/{slug}/my-result — 내 결과 조회 */
  http.get(`${baseURL}/api/v1/bundles/:slug/my-result`, ({ params }) => {
    const slug = params.slug as string;
    const userId = 'mock-user-1';
    const result = getBundleResult(userId, slug);
    if (!result) {
      return HttpResponse.json({ code: 'NOT_FOUND', message: '결과를 찾을 수 없습니다', data: null }, { status: 404 });
    }
    return HttpResponse.json({ code: 'SUCCESS', message: '성공', data: result });
  }),
```

- [ ] **Step 3: 커밋**

```bash
git add src/mocks/handlers.ts
git commit -m "feat(bundle): MSW 번들 API 핸들러 추가"
```

---

## Task 5: 번들 React Query 훅

**Files:**

- Create: `src/hooks/api/useBundle.ts`

- [ ] **Step 1: 번들 훅 파일 생성**

```typescript
// src/hooks/api/useBundle.ts
import { queryOptions, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { customInstance } from '@/lib/axios-mutator';
import type {
  BundleDetail,
  BundleElection,
  BundleAnswerRequest,
  BundleMyResult,
} from '@/types/bundle';

/**
 * Bundle Query Keys
 */
export const bundleKeys = {
  all: ['bundle'] as const,
  detail: (slug: string) => [...bundleKeys.all, 'detail', slug] as const,
  elections: (slug: string) => [...bundleKeys.all, 'elections', slug] as const,
  myResult: (slug: string) => [...bundleKeys.all, 'myResult', slug] as const,
};

/**
 * Query Options
 */
export const bundleQueries = {
  detail: (slug: string) =>
    queryOptions<BundleDetail | null>({
      queryKey: bundleKeys.detail(slug),
      queryFn: () =>
        customInstance<BundleDetail>({
          url: `/api/v1/bundles/${slug}`,
          method: 'GET',
        }),
      staleTime: 60 * 1000,
    }),

  elections: (slug: string) =>
    queryOptions<BundleElection[] | null>({
      queryKey: bundleKeys.elections(slug),
      queryFn: () =>
        customInstance<BundleElection[]>({
          url: `/api/v1/bundles/${slug}/elections`,
          method: 'GET',
        }),
      staleTime: 60 * 1000,
    }),

  myResult: (slug: string) =>
    queryOptions<BundleMyResult | null>({
      queryKey: bundleKeys.myResult(slug),
      queryFn: () =>
        customInstance<BundleMyResult>({
          url: `/api/v1/bundles/${slug}/my-result`,
          method: 'GET',
        }),
      staleTime: 0,
    }),
};

/**
 * Hooks
 */
export const useBundleDetail = (slug: string) =>
  useQuery({
    ...bundleQueries.detail(slug),
    enabled: !!slug,
  });

export const useBundleElections = (slug: string) =>
  useQuery({
    ...bundleQueries.elections(slug),
    enabled: !!slug,
  });

export const useBundleMyResult = (slug: string) =>
  useQuery({
    ...bundleQueries.myResult(slug),
    enabled: !!slug,
    refetchOnMount: 'always',
  });

export const useSubmitBundleAnswers = (slug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BundleAnswerRequest) =>
      customInstance({
        url: `/api/v1/bundles/${slug}/answers`,
        method: 'POST',
        data,
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bundleKeys.myResult(slug) });
    },
  });
};
```

- [ ] **Step 2: 커밋**

```bash
git add src/hooks/api/useBundle.ts
git commit -m "feat(bundle): 번들 React Query 훅"
```

---

## Task 6: BundleCard 라우팅 수정

**Files:**

- Modify: `src/components/features/Main/BundleCard/BundleCard.tsx`

- [ ] **Step 1: 라우팅 경로 변경**

`BundleCard.tsx`에서 `router.push` 호출을 변경:

```typescript
// 변경 전
router.push(`/hotpick/${slug}`);

// 변경 후
router.push(`/bundle/${slug}`);
```

`handleClick` 내부에 `router.push`가 한 군데 있으며, CTA 버튼의 onClick도 `handleClick()`을 호출하므로 한 곳만 변경하면 된다.

- [ ] **Step 2: bundleBadge 텍스트에서 '투표' → '질문' 변경**

`<span className={styles.bundleBadge}>` 내부 텍스트 변경:

```typescript
// 변경 전
{
  electionCount ? `${electionCount}개 투표` : '투표 모음';
}

// 변경 후
{
  electionCount ? `${electionCount}개 질문` : '번들';
}
```

- [ ] **Step 3: hotpick/[slug] 페이지에서 BUNDLE 타입 리다이렉트 추가**

`src/app/hotpick/[hotpickAlias]/page.tsx`에서 기존 BUNDLE notFound() 분기를 리다이렉트로 변경:

```typescript
// 변경 전
if (hotpickData.hotpick.type !== 'SINGLE') {
  notFound();
}

// 변경 후
if (hotpickData.hotpick.type !== 'SINGLE') {
  redirect(`/bundle/${hotpickAlias}`);
}
```

`redirect`를 `next/navigation`에서 import 추가.

- [ ] **Step 4: 커밋**

```bash
git add src/components/features/Main/BundleCard/BundleCard.tsx src/app/hotpick/\[hotpickAlias\]/page.tsx
git commit -m "feat(bundle): BundleCard 라우팅을 /bundle/{slug}로 변경"
```

---

## Task 7: 번들 인트로 페이지

**Files:**

- Create: `src/app/bundle/[slug]/page.tsx`
- Create: `src/app/bundle/[slug]/metadata.ts`
- Create: `src/components/features/Bundle/BundleIntro/BundleIntro.tsx`
- Create: `src/components/features/Bundle/BundleIntro/BundleIntro.module.scss`

- [ ] **Step 1: 메타데이터 파일 생성**

```typescript
// src/app/bundle/[slug]/metadata.ts
import type { Metadata } from 'next';

import * as serverApi from '@/generated/api/server/hotpick/hotpick';

type MetadataProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const { slug } = await params;

  // 서버사이드에서 번들 데이터 fetch (MSW 환경에서도 동작)
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/v1/bundles/${slug}`,
      { next: { revalidate: 300 } }
    );
    const json = await response.json();
    const bundle = json?.data;

    if (bundle) {
      return {
        title: `${bundle.title} | HotPick`,
        description: bundle.subtitle ?? '우리 생각 얼마나 통할까? 가치관을 비교해보세요.',
        openGraph: {
          title: `${bundle.title} - 우리 생각 얼마나 통할까?`,
          description: bundle.subtitle ?? '가치관을 비교해보세요.',
          url: `https://hotpick.kr/bundle/${slug}`,
          images: bundle.imageUrl ? [{ url: bundle.imageUrl }] : undefined,
        },
      };
    }
  } catch {
    // fetch 실패 시 기본값 사용
  }

  return {
    title: '번들 | HotPick',
    description: '우리 생각 얼마나 통할까? 가치관을 비교해보세요.',
    openGraph: {
      title: '번들 | HotPick',
      description: '우리 생각 얼마나 통할까?',
      url: `https://hotpick.kr/bundle/${slug}`,
    },
  };
}
```

- [ ] **Step 2: 인트로 SCSS 생성**

```scss
// src/components/features/Bundle/BundleIntro/BundleIntro.module.scss
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;

.container {
  @include flex-column;
  min-height: 100dvh;
  padding: $spacing-24 $spacing-16;
  gap: 24px;
}

.header {
  @include flex-column;
  gap: 8px;
  text-align: center;
  padding-top: 40px;
}

.category {
  font-size: $font-size-14;
  color: $text-tertiary;
  font-weight: 500;
}

.title {
  font-size: $font-size-28;
  font-weight: 700;
  color: $white;
  line-height: 1.3;
}

.subtitle {
  font-size: $font-size-16;
  color: $text-secondary;
  margin-top: 4px;
}

.heroImage {
  @include flex-center;
  padding: $spacing-16 0;
}

.heroImg {
  border-radius: $border-radius-lg;
  object-fit: cover;
}

.description {
  font-size: $font-size-14;
  color: $text-tertiary;
  line-height: 1.6;
  text-align: center;
  padding: 0 $spacing-16;
}

.meta {
  @include flex-center;
  gap: 16px;
  font-size: $font-size-14;
  color: $text-tertiary;
}

.metaItem {
  @include flex-center;
  gap: 4px;
}

.ctaArea {
  @include flex-column;
  gap: 12px;
  margin-top: auto;
  padding-bottom: 24px;
}

.ctaButton {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: $border-radius-lg;
  background: $primary-gradient;
  color: $white;
  font-size: $font-size-18;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.loginNotice {
  font-size: $font-size-12;
  color: $text-tertiary;
  text-align: center;
}

.loading {
  @include flex-center;
  min-height: 100dvh;
  color: $text-tertiary;
}
```

- [ ] **Step 3: 인트로 컴포넌트 생성**

```tsx
// src/components/features/Bundle/BundleIntro/BundleIntro.tsx
'use client';

import type { FC } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useBundleDetail, useBundleMyResult } from '@/hooks/api/useBundle';
import { formatCount } from '@/lib/utils';

import styles from './BundleIntro.module.scss';

interface BundleIntroProps {
  slug: string;
}

export const BundleIntro: FC<BundleIntroProps> = ({ slug }) => {
  const { data: bundle, isLoading } = useBundleDetail(slug);
  const { data: existingResult } = useBundleMyResult(slug);
  const { isLoggedIn, requireLogin } = useAuth();
  const router = useRouter();

  const hasCompleted = !!existingResult;

  if (isLoading) {
    return (
      <FlexibleLayout>
        <div className={styles.loading}>불러오는 중...</div>
      </FlexibleLayout>
    );
  }

  if (!bundle) {
    return (
      <FlexibleLayout>
        <div className={styles.loading}>번들을 찾을 수 없습니다.</div>
      </FlexibleLayout>
    );
  }

  const handleStart = () => {
    if (!isLoggedIn) {
      requireLogin('default');
      return;
    }
    if (hasCompleted) {
      router.push(`/bundle/${slug}/result`);
    } else {
      router.push(`/bundle/${slug}/play`);
    }
  };

  const ctaText = () => {
    if (bundle.status === 'CLOSED') return '마감된 번들입니다';
    if (hasCompleted) return '결과 보기';
    return '시작하기';
  };

  return (
    <FlexibleLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.category}>{bundle.category}</span>
          <h1 className={styles.title}>{bundle.title}</h1>
          {bundle.subtitle && <p className={styles.subtitle}>{bundle.subtitle}</p>}
        </div>

        {/* 히어로 이미지 */}
        {bundle.imageUrl && (
          <div className={styles.heroImage}>
            <Image
              src={bundle.imageUrl}
              alt={bundle.title}
              width={280}
              height={280}
              className={styles.heroImg}
              priority
            />
          </div>
        )}

        <p className={styles.description}>{bundle.description}</p>

        <div className={styles.meta}>
          <span className={styles.metaItem}>{bundle.questionCount}개 질문</span>
          <span className={styles.metaItem}>{formatCount(bundle.participantCount)}명 참여</span>
        </div>

        <div className={styles.ctaArea}>
          <button
            type="button"
            className={styles.ctaButton}
            onClick={handleStart}
            disabled={bundle.status === 'CLOSED'}
          >
            {ctaText()}
          </button>
          {!isLoggedIn && <p className={styles.loginNotice}>참여하려면 로그인이 필요합니다</p>}
        </div>
      </div>
    </FlexibleLayout>
  );
};
```

- [ ] **Step 4: 인트로 페이지 생성**

```tsx
// src/app/bundle/[slug]/page.tsx
import { BundleIntro } from '@/components/features/Bundle/BundleIntro/BundleIntro';
import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';

export { generateMetadata } from './metadata';

type BundlePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BundlePage({ params }: BundlePageProps) {
  const { slug } = await params;

  return (
    <>
      <MainHeader />
      <BundleIntro slug={slug} />
    </>
  );
}
```

- [ ] **Step 5: 커밋**

```bash
git add src/app/bundle/ src/components/features/Bundle/BundleIntro/
git commit -m "feat(bundle): 번들 인트로 페이지"
```

---

## Task 8: 번들 풀기 페이지 — 프로그레스 바 + 질문 카드

**Files:**

- Create: `src/components/features/Bundle/BundlePlay/ProgressBar.tsx`
- Create: `src/components/features/Bundle/BundlePlay/ProgressBar.module.scss`
- Create: `src/components/features/Bundle/BundlePlay/QuestionCard.tsx`
- Create: `src/components/features/Bundle/BundlePlay/QuestionCard.module.scss`

- [ ] **Step 1: 프로그레스 바 SCSS**

```scss
// src/components/features/Bundle/BundlePlay/ProgressBar.module.scss
@use '@/styles/variables' as *;

.container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 $spacing-16;
}

.label {
  font-size: $font-size-14;
  color: $text-tertiary;
  text-align: center;
}

.track {
  width: 100%;
  height: 4px;
  background: $bg-tertiary;
  border-radius: 2px;
  overflow: hidden;
}

.fill {
  height: 100%;
  background: $primary-gradient;
  border-radius: 2px;
  transition: width 0.3s ease;
}
```

- [ ] **Step 2: 프로그레스 바 컴포넌트**

```tsx
// src/components/features/Bundle/BundlePlay/ProgressBar.tsx
import type { FC } from 'react';

import styles from './ProgressBar.module.scss';

interface ProgressBarProps {
  current: number;
  total: number;
}

export const ProgressBar: FC<ProgressBarProps> = ({ current, total }) => (
  <div className={styles.container}>
    <span className={styles.label}>
      {current} / {total}
    </span>
    <div className={styles.track}>
      <div className={styles.fill} style={{ width: `${(current / total) * 100}%` }} />
    </div>
  </div>
);
```

- [ ] **Step 3: 질문 카드 SCSS**

```scss
// src/components/features/Bundle/BundlePlay/QuestionCard.module.scss
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;

.container {
  @include flex-column;
  gap: 24px;
  padding: $spacing-24 $spacing-16;
  text-align: center;
}

.question {
  font-size: $font-size-20;
  font-weight: 600;
  color: $white;
  line-height: 1.4;
}

.options {
  @include flex-column;
  gap: 12px;
}

.optionButton {
  width: 100%;
  padding: 20px;
  border: 1px solid #3a3a3a;
  border-radius: $border-radius-lg;
  background: $bg-secondary;
  color: $white;
  font-size: $font-size-16;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: $text-tertiary;
    background: $bg-tertiary;
  }

  &.selected {
    border-color: transparent;
    background: $primary-gradient;
  }
}

.optionLabel {
  font-size: $font-size-12;
  color: $text-tertiary;
  margin-bottom: 4px;
}
```

- [ ] **Step 4: 질문 카드 컴포넌트**

```tsx
// src/components/features/Bundle/BundlePlay/QuestionCard.tsx
'use client';

import type { FC } from 'react';

import type { BundleElection } from '@/types/bundle';

import styles from './QuestionCard.module.scss';

interface QuestionCardProps {
  election: BundleElection;
  selected: 'A' | 'B' | null;
  onSelect: (choice: 'A' | 'B') => void;
}

export const QuestionCard: FC<QuestionCardProps> = ({ election, selected, onSelect }) => (
  <div className={styles.container}>
    <h2 className={styles.question}>{election.title}</h2>

    <div className={styles.options}>
      <button
        type="button"
        className={`${styles.optionButton} ${selected === 'A' ? styles.selected : ''}`}
        onClick={() => onSelect('A')}
      >
        <div className={styles.optionLabel}>A</div>
        {election.optionA}
      </button>

      <button
        type="button"
        className={`${styles.optionButton} ${selected === 'B' ? styles.selected : ''}`}
        onClick={() => onSelect('B')}
      >
        <div className={styles.optionLabel}>B</div>
        {election.optionB}
      </button>
    </div>
  </div>
);
```

- [ ] **Step 5: 커밋**

```bash
git add src/components/features/Bundle/BundlePlay/
git commit -m "feat(bundle): 프로그레스 바 + 질문 카드 컴포넌트"
```

---

## Task 9: 번들 풀기 페이지 — 메인 플로우

**Files:**

- Create: `src/components/features/Bundle/BundlePlay/BundlePlay.tsx`
- Create: `src/components/features/Bundle/BundlePlay/BundlePlay.module.scss`
- Create: `src/app/bundle/[slug]/play/page.tsx`

- [ ] **Step 1: BundlePlay SCSS**

```scss
// src/components/features/Bundle/BundlePlay/BundlePlay.module.scss
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;

.container {
  @include flex-column;
  min-height: 100dvh;
  padding-top: $spacing-16;
}

.navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-16;
}

.navButton {
  padding: 8px 16px;
  border: 1px solid #3a3a3a;
  border-radius: $border-radius-md;
  background: transparent;
  color: $text-secondary;
  font-size: $font-size-14;
  cursor: pointer;

  &:hover {
    background: $bg-tertiary;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

.submitButton {
  padding: 8px 16px;
  border: none;
  border-radius: $border-radius-md;
  background: $primary-gradient;
  color: $white;
  font-size: $font-size-14;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.loading {
  @include flex-center;
  min-height: 100dvh;
  color: $text-tertiary;
}
```

- [ ] **Step 2: BundlePlay 컴포넌트**

```tsx
// src/components/features/Bundle/BundlePlay/BundlePlay.tsx
'use client';

import { useState, useCallback, useRef, useEffect, type FC } from 'react';

import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';
import { useRouter } from 'next/navigation';

import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  useBundleElections,
  useBundleMyResult,
  useSubmitBundleAnswers,
} from '@/hooks/api/useBundle';

import { ProgressBar } from './ProgressBar';
import { QuestionCard } from './QuestionCard';
import styles from './BundlePlay.module.scss';

/** sessionStorage 키 */
const STORAGE_KEY = (slug: string) => `bundle_answers_${slug}`;

/** sessionStorage에서 답변 복원 */
function loadAnswers(slug: string): Map<string, 'A' | 'B'> {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY(slug));
    if (!stored) return new Map();
    return new Map(JSON.parse(stored));
  } catch {
    return new Map();
  }
}

/** sessionStorage에 답변 저장 */
function saveAnswers(slug: string, answers: Map<string, 'A' | 'B'>) {
  try {
    sessionStorage.setItem(STORAGE_KEY(slug), JSON.stringify([...answers]));
  } catch {
    // storage full — 무시
  }
}

/** 질문 전환 애니메이션 variants */
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
  }),
};

interface BundlePlayProps {
  slug: string;
}

export const BundlePlay: FC<BundlePlayProps> = ({ slug }) => {
  const { isLoggedIn } = useAuth();
  const { data: elections, isLoading } = useBundleElections(slug);
  const { data: existingResult } = useBundleMyResult(slug);
  const submitMutation = useSubmitBundleAnswers(slug);
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, 'A' | 'B'>>(() => loadAnswers(slug));
  const [direction, setDirection] = useState(1); // 1: 앞으로, -1: 뒤로
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auth guard
  useEffect(() => {
    if (!isLoggedIn) {
      router.replace(`/bundle/${slug}`);
    }
  }, [isLoggedIn, slug, router]);

  // 이미 완료한 번들이면 결과 페이지로 리다이렉트
  useEffect(() => {
    if (existingResult) {
      sessionStorage.removeItem(STORAGE_KEY(slug));
      router.replace(`/bundle/${slug}/result`);
    }
  }, [existingResult, slug, router]);

  const handleSelect = useCallback(
    (choice: 'A' | 'B') => {
      if (!elections) return;
      const election = elections[currentIndex];
      setAnswers((prev) => {
        const next = new Map(prev).set(election.electionId, choice);
        saveAnswers(slug, next);
        return next;
      });

      // 이전 auto-advance 취소 후 새로 예약
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      if (currentIndex < elections.length - 1) {
        autoAdvanceTimer.current = setTimeout(() => {
          setDirection(1);
          setCurrentIndex((i) => i + 1);
        }, 400);
      }
    },
    [elections, currentIndex, slug]
  );

  useEffect(
    () => () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    },
    []
  );

  const goTo = (nextIndex: number) => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    setDirection(nextIndex > currentIndex ? 1 : -1);
    setCurrentIndex(nextIndex);
  };

  const handleSubmit = async () => {
    if (!elections) return;

    const unanswered = elections.filter((e) => !answers.has(e.electionId));
    if (unanswered.length > 0) return;

    const answerData = elections.map((e) => ({
      electionId: e.electionId,
      selected: answers.get(e.electionId)!,
    }));

    try {
      await submitMutation.mutateAsync({ answers: answerData });
      sessionStorage.removeItem(STORAGE_KEY(slug));
      router.push(`/bundle/${slug}/result`);
    } catch {
      alert('제출에 실패했습니다. 다시 시도해주세요.');
    }
  };

  if (isLoading || !elections) {
    return (
      <FlexibleLayout>
        <div className={styles.loading}>질문을 불러오는 중...</div>
      </FlexibleLayout>
    );
  }

  const currentElection = elections[currentIndex];
  const currentAnswer = answers.get(currentElection.electionId) ?? null;
  const allAnswered = elections.every((e) => answers.has(e.electionId));
  const isLast = currentIndex === elections.length - 1;

  return (
    <FlexibleLayout>
      <div className={styles.container}>
        <ProgressBar current={currentIndex + 1} total={elections.length} />

        <LazyMotion features={domAnimation}>
          <AnimatePresence mode="wait" custom={direction}>
            <m.div
              key={currentElection.electionId}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <QuestionCard
                election={currentElection}
                selected={currentAnswer}
                onSelect={handleSelect}
              />
            </m.div>
          </AnimatePresence>
        </LazyMotion>

        <div className={styles.navigation}>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => goTo(currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            이전
          </button>

          {isLast ? (
            <button
              type="button"
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={!allAnswered || submitMutation.isPending}
            >
              {submitMutation.isPending ? '제출 중...' : '결과 보기'}
            </button>
          ) : (
            <button
              type="button"
              className={styles.navButton}
              onClick={() => goTo(currentIndex + 1)}
              disabled={!currentAnswer}
            >
              다음
            </button>
          )}
        </div>
      </div>
    </FlexibleLayout>
  );
};
```

- [ ] **Step 3: 풀기 페이지 생성**

```tsx
// src/app/bundle/[slug]/play/page.tsx
import type { Metadata } from 'next';

import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';
import { BundlePlay } from '@/components/features/Bundle/BundlePlay/BundlePlay';

export const metadata: Metadata = {
  title: '번들 풀기 | HotPick',
  robots: { index: false },
};

type PlayPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BundlePlayPage({ params }: PlayPageProps) {
  const { slug } = await params;

  return (
    <>
      <MainHeader />
      <BundlePlay slug={slug} />
    </>
  );
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/components/features/Bundle/BundlePlay/BundlePlay.tsx src/components/features/Bundle/BundlePlay/BundlePlay.module.scss src/app/bundle/\[slug\]/play/
git commit -m "feat(bundle): 번들 풀기 페이지 (순차 질문 + 답변 제출)"
```

---

## Task 10: 번들 결과 페이지

**Files:**

- Create: `src/components/features/Bundle/BundleResult/BundleResult.tsx`
- Create: `src/components/features/Bundle/BundleResult/BundleResult.module.scss`
- Create: `src/app/bundle/[slug]/result/page.tsx`

- [ ] **Step 1: 결과 SCSS**

```scss
// src/components/features/Bundle/BundleResult/BundleResult.module.scss
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;

.container {
  @include flex-column;
  padding: $spacing-24 $spacing-16;
  gap: 32px;
}

.popularityCard {
  @include flex-column;
  align-items: center;
  gap: 12px;
  padding: $spacing-24;
  background: $bg-secondary;
  border-radius: $border-radius-lg;
  border: 1px solid #333;
}

.popularityScore {
  font-size: $font-size-48;
  font-weight: 700;
  color: $white;
}

.popularityTitle {
  font-size: $font-size-20;
  font-weight: 600;
  color: $white;
}

.popularityDescription {
  font-size: $font-size-14;
  color: $text-secondary;
}

.characterPlaceholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-48;
  font-weight: 700;
  color: $white;
  margin-bottom: 8px;
}

.characterImage {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
}

.sectionTitle {
  font-size: $font-size-18;
  font-weight: 600;
  color: $white;
  margin-bottom: 12px;
}

.answerList {
  @include flex-column;
  gap: 12px;
}

.answerItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: $bg-secondary;
  border-radius: $border-radius-md;
  border: 1px solid #333;
}

.answerQuestion {
  font-size: $font-size-14;
  color: $text-secondary;
  flex: 1;
}

.answerChoice {
  font-size: $font-size-14;
  font-weight: 600;
  color: $white;
  margin-left: 12px;
}

.answerStat {
  font-size: $font-size-12;
  color: $text-tertiary;
  margin-left: 8px;
}

.majorityBadge {
  color: #66bb6a;
}

.minorityBadge {
  color: #ff6b35;
}

.ctaSection {
  @include flex-column;
  gap: 12px;
  padding-top: 16px;
}

.ctaButton {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: $border-radius-lg;
  background: $primary-gradient;
  color: $white;
  font-size: $font-size-16;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
}

.secondaryCta {
  width: 100%;
  padding: 16px;
  border: 1px solid #333;
  border-radius: $border-radius-lg;
  background: transparent;
  color: $text-secondary;
  font-size: $font-size-16;
  cursor: pointer;

  &:hover {
    background: $bg-tertiary;
  }
}

.loading {
  @include flex-center;
  min-height: 60dvh;
  color: $text-tertiary;
}
```

- [ ] **Step 2: 결과 컴포넌트**

```tsx
// src/components/features/Bundle/BundleResult/BundleResult.tsx
'use client';

import { useEffect, type FC } from 'react';

import { useRouter } from 'next/navigation';

import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import { calcPopularityScore, getPopularityByScore } from '@/constants/bundle';
import { useAuth } from '@/contexts/AuthContext';
import { useBundleMyResult } from '@/hooks/api/useBundle';

import styles from './BundleResult.module.scss';

interface BundleResultProps {
  slug: string;
}

export const BundleResult: FC<BundleResultProps> = ({ slug }) => {
  const { isLoggedIn } = useAuth();
  const { data: result, isLoading } = useBundleMyResult(slug);
  const router = useRouter();

  // Auth guard: 미로그인 시 인트로로 리다이렉트
  useEffect(() => {
    if (!isLoggedIn) {
      router.replace(`/bundle/${slug}`);
    }
  }, [isLoggedIn, slug, router]);

  if (isLoading) {
    return (
      <FlexibleLayout>
        <div className={styles.loading}>결과를 불러오는 중...</div>
      </FlexibleLayout>
    );
  }

  if (!result) {
    return (
      <FlexibleLayout>
        <div className={styles.loading}>
          아직 번들을 풀지 않았어요.
          <button
            type="button"
            className={styles.ctaButton}
            style={{ marginTop: 16, maxWidth: 200 }}
            onClick={() => router.push(`/bundle/${slug}/play`)}
          >
            풀러 가기
          </button>
        </div>
      </FlexibleLayout>
    );
  }

  const popularityScore = calcPopularityScore(result.myAnswers, result.questionStats);
  const popularity = getPopularityByScore(popularityScore);

  return (
    <FlexibleLayout>
      <div className={styles.container}>
        {/* 대중성 카드 */}
        <div className={styles.popularityCard}>
          {/* 3D 캐릭터 이미지 — 에셋 준비 전 등급 이니셜 placeholder */}
          {popularity.imagePath ? (
            <img
              src={popularity.imagePath}
              alt={popularity.title}
              className={styles.characterImage}
            />
          ) : (
            <div
              className={styles.characterPlaceholder}
              style={{ background: 'linear-gradient(135deg, #ff00ff, #ff4500)' }}
            >
              {popularity.grade[0]}
            </div>
          )}
          <div className={styles.popularityScore}>{popularityScore}%</div>
          <div className={styles.popularityTitle}>{popularity.title}</div>
          <div className={styles.popularityDescription}>{popularity.description}</div>
        </div>

        {/* 내 답변 요약 */}
        <div>
          <h3 className={styles.sectionTitle}>내 답변 ({result.totalQuestions}개)</h3>
          <div className={styles.answerList}>
            {result.myAnswers.map((answer) => {
              const stat = result.questionStats.find((s) => s.electionId === answer.electionId);
              const myRate =
                answer.selected === 'A' ? (stat?.optionARate ?? 50) : (stat?.optionBRate ?? 50);
              const isMajority = myRate >= 50;

              return (
                <div key={answer.electionId} className={styles.answerItem}>
                  <span className={styles.answerQuestion}>{answer.title}</span>
                  <span className={styles.answerChoice}>
                    {answer.selected === 'A' ? answer.optionA : answer.optionB}
                  </span>
                  <span
                    className={`${styles.answerStat} ${isMajority ? styles.majorityBadge : styles.minorityBadge}`}
                  >
                    {myRate}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA — 비교 버튼은 Plan 2에서 추가 */}
        <div className={styles.ctaSection}>
          <button type="button" className={styles.secondaryCta} onClick={() => router.push('/')}>
            메인으로 돌아가기
          </button>
        </div>
      </div>
    </FlexibleLayout>
  );
};
```

- [ ] **Step 3: 결과 페이지 생성**

```tsx
// src/app/bundle/[slug]/result/page.tsx
import type { Metadata } from 'next';

import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';
import { BundleResult } from '@/components/features/Bundle/BundleResult/BundleResult';

export const metadata: Metadata = {
  title: '번들 결과 | HotPick',
  robots: { index: false },
};

type ResultPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BundleResultPage({ params }: ResultPageProps) {
  const { slug } = await params;

  return (
    <>
      <MainHeader />
      <BundleResult slug={slug} />
    </>
  );
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/components/features/Bundle/BundleResult/ src/app/bundle/\[slug\]/result/
git commit -m "feat(bundle): 번들 결과 페이지 (대중성 지수 + 답변 요약)"
```

---

## Self-Review 결과

**1. Spec coverage:**

- 섹션 3.1~3.3 (번들 정의, 분리, 피드 노출) → Task 6 (BundleCard 라우팅)
- 섹션 4.1 (번들 풀기 플로우) → Task 8~9 (sessionStorage persist, 슬라이드 애니메이션 포함)
- 섹션 5.3 (대중성 포지션) → Task 2 + Task 10 (3D 캐릭터 placeholder 포함)
- 섹션 7.1~7.2 (서버-FE 역할 분리) → Task 2 (FE 매핑), Task 5 (훅)
- 섹션 8.1 (번들 API) → Task 3~4 (MSW), Task 5 (훅)
- 인트로 완료 유저 "결과 보기" CTA → Task 7
- 동적 SEO 메타데이터 → Task 7
- Auth guard (play/result 페이지) → Task 9, Task 10
- **Plan 2 범위**: 1:1 비교 링크 생성/공유, 비교 랜딩, 비교 결과, 바이럴 CTA, 마이페이지
- **후속 (Phase 2~3)**: 그룹 비교, 가치관 지도, 어드민 고도화

**2. Placeholder scan:** 없음. 3D 캐릭터 이미지는 `imagePath: null`로 placeholder 처리, 에셋 준비 시 경로만 업데이트

**3. Type consistency:**

- `BundleDetail`, `BundleElection`, `BundleMyResult` — Task 1에서 정의, Task 3~5에서 동일하게 사용
- `ChemistryInfo.gradient` / `PopularityInfo.imagePath` — Task 2에서 정의, Plan 2에서 사용 예정
- `calcPopularityScore`, `getPopularityByScore` — Task 2에서 정의, Task 10에서 사용
- `customInstance` — `@/lib/axios-mutator`에서 import, Task 5에서 사용
