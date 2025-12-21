# 어드민 페이지 개발 가이드

> **프로젝트**: Trend Web Admin 페이지 개발
> **작성일**: 2025-12-20
> **대상**: 트렌드 목록 페이지 및 트렌드 수정 페이지

---

## 📋 목차

1. [개요](#-개요)
2. [기존 구조 분석](#-기존-구조-분석)
3. [개발 범위](#-개발-범위)
4. [페이지별 상세 스펙](#-페이지별-상세-스펙)
5. [공통 컴포넌트 설계](#-공통-컴포넌트-설계)
6. [API 연동](#-api-연동)
7. [라우팅 구조](#-라우팅-구조)
8. [구현 체크리스트](#-구현-체크리스트)
9. [추가 고려사항](#-추가-고려사항)

---

## 🎯 개요

### 개발 목표

Trend 데이터를 효율적으로 관리할 수 있는 어드민 페이지 구축:

- 트렌드 목록 조회 (전체 목록 표시)
- 트렌드 상세 조회 (별도 페이지)
- 트렌드 수정 (기존 데이터 수정 및 삭제)

### 페이지 URL 구조

```
✅ /admin/trend/create          - 트렌드 생성 (개발 완료)
🆕 /admin/trend                  - 트렌드 목록 (요약 정보)
🆕 /admin/trend/{trendId}        - 트렌드 상세 (전체 정보)
🆕 /admin/trend/edit/{trendId}   - 트렌드 수정 및 삭제
```

---

## 🔍 기존 구조 분석

### 1. 파일 구조

```
src/
├── app/
│   └── admin/
│       ├── layout.tsx                    # Admin 레이아웃
│       └── trend/
│           ├── create/
│           │   └── page.tsx              # ✅ 생성 페이지
│           ├── page.tsx                  # 🆕 목록 페이지 (신규)
│           ├── [trendId]/
│           │   └── page.tsx              # 🆕 상세 페이지 (신규)
│           └── edit/
│               └── [trendId]/
│                   └── page.tsx          # 🆕 수정 페이지 (신규)
│
├── components/
│   └── features/
│       └── Admin/
│           ├── AdminTrendForm/           # ✅ 기존 폼 컴포넌트
│           │   ├── AdminTrendForm.tsx
│           │   ├── BasicInfoSection.tsx
│           │   ├── ElectionListSection.tsx
│           │   ├── ResultLabelSection.tsx
│           │   ├── ResultTypeSection.tsx
│           │   └── AnswerTypeSection.tsx
│           ├── AdminTrendList/           # 🆕 목록 컴포넌트 (신규)
│           │   ├── AdminTrendList.tsx
│           │   └── TrendListItem.tsx
│           ├── AdminTrendDetail/         # 🆕 상세 컴포넌트 (신규)
│           │   ├── AdminTrendDetail.tsx
│           │   ├── TrendInfoSection.tsx
│           │   ├── TrendElectionSection.tsx
│           │   └── TrendMetaSection.tsx
│           └── AdminTrendEdit/           # 🆕 수정 컴포넌트 (신규)
│               └── AdminTrendEdit.tsx
│
├── services/
│   ├── api/
│   │   └── admin.ts                      # ✅ Admin API 서비스
│   └── hooks/
│       └── useAdmin.ts                   # ✅ Admin React Query 훅
│
└── types/
    └── trend.ts                          # ✅ Trend 타입 정의
```

### 2. 기존 기술 스택

| 카테고리            | 기술                             | 용도                 |
| ------------------- | -------------------------------- | -------------------- |
| **프레임워크**      | Next.js 16.0.10, React 19.2.3    | 풀스택 프레임워크    |
| **폼 관리**         | react-hook-form 7.68.0           | 폼 상태 및 검증      |
| **서버 상태**       | @tanstack/react-query 5.90.9     | API 상태 관리        |
| **HTTP 클라이언트** | axios 1.13.2                     | API 통신             |
| **드래그 앤 드롭**  | @dnd-kit/core, @dnd-kit/sortable | 정렬 기능            |
| **스타일링**        | SCSS 모듈                        | 컴포넌트 스타일 격리 |

### 3. API 엔드포인트 (이미 구현됨)

```typescript
// ✅ 생성 페이지에서 사용 중
POST   /admin/api/v1/trend                    // Trend 생성
GET    /admin/api/v1/trend/check?alias={alias} // Alias 중복 확인
GET    /admin/api/v1/item/{itemId}            // 선거 상세 조회
GET    /admin/api/v1/storage/presigned        // S3 Pre-signed URL

// 🆕 신규 페이지에서 사용할 API
GET    /admin/api/v1/trend                    // Trend 목록 조회
PUT    /admin/api/v1/trend/{trendId}          // Trend 수정
DELETE /admin/api/v1/trend/{trendId}          // Trend 삭제
```

### 4. 데이터 타입 구조

```typescript
// ✅ 이미 정의됨 (src/types/trend.ts)
interface AdminTrendResponse {
  id: number;
  alias: string;
  title: string;
  label?: string;
  imageUrl?: string;
  electionIds: string[];
  meta?: TrendMeta;
  visible: boolean;
  createdAt: string;
}

interface UpdateTrendRequest {
  title?: string;
  label?: string;
  imageUrl?: string;
  electionIds?: string[];
  meta?: TrendMetaRequest;
  visible?: boolean;
}
```

---

## 📦 개발 범위

### Phase 1: 트렌드 목록 페이지 (`/admin/trend`)

#### 핵심 기능

- ✅ 전체 트렌드 목록 조회 (API에서 받은 데이터 그대로 표시)
- ✅ 트렌드 간략 정보 리스트 형태로 표시
- ✅ 각 항목 클릭 시 상세 페이지로 이동
- ✅ 트렌드 생성 페이지 이동 버튼

#### UI/UX 요구사항

**레이아웃**: 테이블 형태 리스트 (반응형 - 모바일에서는 카드 형태)

**목록에 표시할 정보** (간략 정보만):

- 썸네일 이미지 (작은 사이즈, 40x40px)
- 제목
- Alias
- 공개 상태 배지 (공개/비공개)
- 생성일 (YYYY.MM.DD 형식)
- 액션 버튼 (상세 보기, 수정)

**테이블 헤더**:

```
| 썸네일 | 제목 | Alias | 상태 | 생성일 | 액션 |
```

**빈 상태**: 트렌드가 없을 때 안내 메시지 + 생성 버튼

**주의**: 검색, 필터, 정렬 기능은 구현하지 않음 (API 미지원)

---

### Phase 2: 트렌드 상세 페이지 (`/admin/trend/{trendId}`)

#### 핵심 기능

- ✅ 트렌드 전체 상세 정보 표시 (읽기 전용)
- ✅ 수정 페이지로 이동 버튼
- ✅ 목록으로 돌아가기 버튼

#### UI/UX 요구사항

**레이아웃**: 섹션별로 구분된 읽기 전용 뷰

**표시할 정보** (전체 상세 정보):

1. **기본 정보 섹션**
   - 썸네일 이미지 (큰 사이즈, 400x400px)
   - Trend ID (숫자)
   - Alias (문자열)
   - 제목
   - 부제
   - 공개 상태 (공개/비공개)
   - 생성일

2. **선거 목록 섹션**
   - 연결된 선거 ID 목록 (`electionIds` 배열)
   - 각 선거 ID 표시
   - 총 선거 개수

3. **메타 정보 섹션** (meta가 있는 경우)
   - 결과 라벨 (`resultLabel`)
   - 결과 타입 목록 (`resultTypes`)
     - key, label 쌍으로 표시
   - 비교 타입 목록 (`compareTypes`)
     - label 리스트 표시

**액션 버튼**:

- [수정하기] → `/admin/trend/edit/{trendId}`
- [목록으로] → `/admin/trend`

---

### Phase 3: 트렌드 수정 페이지 (`/admin/trend/edit/{trendId}`)

#### 핵심 기능

- ✅ 기존 트렌드 데이터 로드
- ✅ 기존 생성 폼 재사용 (AdminTrendForm 컴포넌트)
- ✅ Alias는 수정 불가 (읽기 전용)
- ✅ 제목, 부제, 이미지, 선거 목록, 메타 정보 수정 가능
- ✅ 공개/비공개 토글
- ✅ 수정 사항 저장
- ✅ **트렌드 삭제 기능** (삭제 버튼 추가)
- ✅ 취소 시 확인 모달 (변경 사항이 있는 경우)

#### UI/UX 요구사항

**레이아웃**: 생성 페이지와 동일한 구조

**폼 필드**: AdminTrendForm 재사용

**차이점**:

- 페이지 타이틀: "트렌드 수정"
- Alias 필드: 읽기 전용 (회색 배경 + disabled)
- 공개 상태 토글 추가
- 버튼 구성:
  - [수정 완료] (Primary 버튼)
  - [취소] (Secondary 버튼)
  - [삭제] (Danger 버튼 - 우측 하단 또는 별도 위치)

**삭제 기능**:

- 삭제 버튼 클릭 시 확인 모달 표시
  - "정말 이 트렌드를 삭제하시겠습니까?"
  - 트렌드 제목 표시
  - [취소] / [삭제] 버튼
- 삭제 확인 시 DELETE API 호출
- 성공 시 목록 페이지로 이동 + Toast 알림

**로딩 상태**: 데이터 로드 중 스켈레톤 UI

---

## 📄 페이지별 상세 스펙

### 1. 트렌드 목록 페이지 (`/admin/trend`)

#### 컴포넌트 구조

```tsx
// src/app/admin/trend/page.tsx
'use client';

export default function AdminTrendListPage() {
  return <AdminTrendList />;
}

// src/components/features/Admin/AdminTrendList/AdminTrendList.tsx
export default function AdminTrendList() {
  const router = useRouter();
  const { data: trends, isLoading } = useGetTrends();

  if (isLoading) return <div>로딩 중...</div>;

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <header className={styles.header}>
        <h1>트렌드 목록</h1>
        <Button onClick={() => router.push('/admin/trend/create')} variant="primary">
          + 트렌드 생성
        </Button>
      </header>

      {/* 목록 테이블 */}
      {trends && trends.length > 0 ? (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>썸네일</th>
              <th>제목</th>
              <th>Alias</th>
              <th>상태</th>
              <th>생성일</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            {trends.map((trend) => (
              <TrendListItem
                key={trend.id}
                trend={trend}
                onView={(id) => router.push(`/admin/trend/${id}`)}
                onEdit={(id) => router.push(`/admin/trend/edit/${id}`)}
              />
            ))}
          </tbody>
        </table>
      ) : (
        <div className={styles.empty}>
          <p>등록된 트렌드가 없습니다.</p>
          <Button onClick={() => router.push('/admin/trend/create')}>트렌드 생성하기</Button>
        </div>
      )}
    </div>
  );
}
```

#### TrendListItem 컴포넌트

```tsx
// src/components/features/Admin/AdminTrendList/TrendListItem.tsx
interface TrendListItemProps {
  trend: AdminTrendResponse;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
}

export default function TrendListItem({ trend, onView, onEdit }: TrendListItemProps) {
  return (
    <tr className={styles.row}>
      {/* 썸네일 */}
      <td>
        <div className={styles.thumbnail}>
          <Image
            src={trend.imageUrl || '/images/default-trend.png'}
            alt={trend.title}
            width={40}
            height={40}
            style={{ objectFit: 'cover', borderRadius: '4px' }}
          />
        </div>
      </td>

      {/* 제목 */}
      <td>
        <span className={styles.title}>{trend.title}</span>
      </td>

      {/* Alias */}
      <td>
        <code className={styles.alias}>@{trend.alias}</code>
      </td>

      {/* 상태 */}
      <td>
        <span className={`${styles.badge} ${trend.visible ? styles.visible : styles.hidden}`}>
          {trend.visible ? '공개' : '비공개'}
        </span>
      </td>

      {/* 생성일 */}
      <td>
        <span className={styles.date}>
          {new Date(trend.createdAt)
            .toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            })
            .replace(/\. /g, '.')
            .replace(/\.$/, '')}
        </span>
      </td>

      {/* 액션 */}
      <td>
        <div className={styles.actions}>
          <Button variant="outline" size="small" onClick={() => onView(trend.id)}>
            상세
          </Button>
          <Button variant="primary" size="small" onClick={() => onEdit(trend.id)}>
            수정
          </Button>
        </div>
      </td>
    </tr>
  );
}
```

#### 상태 관리 (React Query 훅)

```typescript
// src/services/hooks/useAdmin.ts에 추가
export const useGetTrends = () => {
  return useQuery({
    queryKey: ['admin', 'trends'],
    queryFn: () => adminApi.getTrends(),
    staleTime: 1000 * 60 * 5, // 5분
  });
};
```

---

### 2. 트렌드 상세 페이지 (`/admin/trend/{trendId}`)

#### 컴포넌트 구조

```tsx
// src/app/admin/trend/[trendId]/page.tsx
'use client';

import { use } from 'react';

interface PageProps {
  params: Promise<{ trendId: string }>;
}

export default function AdminTrendDetailPage({ params }: PageProps) {
  const { trendId } = use(params);

  return <AdminTrendDetail trendId={Number(trendId)} />;
}

// src/components/features/Admin/AdminTrendDetail/AdminTrendDetail.tsx
export default function AdminTrendDetail({ trendId }: { trendId: number }) {
  const router = useRouter();
  const { data: trend, isLoading } = useGetTrendDetail(trendId);

  if (isLoading) return <div>로딩 중...</div>;
  if (!trend) return <div>트렌드를 찾을 수 없습니다.</div>;

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <header className={styles.header}>
        <h1>트렌드 상세</h1>
        <div className={styles.actions}>
          <Button variant="outline" onClick={() => router.push('/admin/trend')}>
            목록으로
          </Button>
          <Button variant="primary" onClick={() => router.push(`/admin/trend/edit/${trendId}`)}>
            수정하기
          </Button>
        </div>
      </header>

      {/* 기본 정보 섹션 */}
      <TrendInfoSection trend={trend} />

      {/* 선거 목록 섹션 */}
      <TrendElectionSection electionIds={trend.electionIds} />

      {/* 메타 정보 섹션 */}
      {trend.meta && <TrendMetaSection meta={trend.meta} />}
    </div>
  );
}
```

#### TrendInfoSection 컴포넌트

```tsx
// src/components/features/Admin/AdminTrendDetail/TrendInfoSection.tsx
interface TrendInfoSectionProps {
  trend: AdminTrendResponse;
}

export default function TrendInfoSection({ trend }: TrendInfoSectionProps) {
  return (
    <section className={styles.section}>
      <h2>기본 정보</h2>

      <div className={styles.grid}>
        {/* 썸네일 */}
        <div className={styles.imageWrapper}>
          <Image
            src={trend.imageUrl || '/images/default-trend.png'}
            alt={trend.title}
            width={400}
            height={400}
            style={{ objectFit: 'cover', borderRadius: '8px' }}
          />
        </div>

        {/* 정보 */}
        <div className={styles.info}>
          <div className={styles.field}>
            <label>Trend ID</label>
            <span>{trend.id}</span>
          </div>

          <div className={styles.field}>
            <label>Alias</label>
            <code>@{trend.alias}</code>
          </div>

          <div className={styles.field}>
            <label>제목</label>
            <span>{trend.title}</span>
          </div>

          {trend.label && (
            <div className={styles.field}>
              <label>부제</label>
              <span>{trend.label}</span>
            </div>
          )}

          <div className={styles.field}>
            <label>공개 상태</label>
            <span className={`${styles.badge} ${trend.visible ? styles.visible : styles.hidden}`}>
              {trend.visible ? '공개' : '비공개'}
            </span>
          </div>

          <div className={styles.field}>
            <label>생성일</label>
            <span>{new Date(trend.createdAt).toLocaleString('ko-KR')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
```

#### TrendElectionSection 컴포넌트

```tsx
// src/components/features/Admin/AdminTrendDetail/TrendElectionSection.tsx
interface TrendElectionSectionProps {
  electionIds: string[];
}

export default function TrendElectionSection({ electionIds }: TrendElectionSectionProps) {
  return (
    <section className={styles.section}>
      <h2>연결된 선거</h2>
      <p className={styles.count}>총 {electionIds.length}개</p>

      <ul className={styles.electionList}>
        {electionIds.map((id, index) => (
          <li key={id} className={styles.electionItem}>
            <span className={styles.index}>{index + 1}</span>
            <code className={styles.electionId}>{id}</code>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

#### TrendMetaSection 컴포넌트

```tsx
// src/components/features/Admin/AdminTrendDetail/TrendMetaSection.tsx
interface TrendMetaSectionProps {
  meta: TrendMeta;
}

export default function TrendMetaSection({ meta }: TrendMetaSectionProps) {
  return (
    <section className={styles.section}>
      <h2>메타 정보</h2>

      {/* 결과 라벨 */}
      {meta.resultLabel && (
        <div className={styles.field}>
          <label>결과 라벨</label>
          <span>{meta.resultLabel}</span>
        </div>
      )}

      {/* 결과 타입 */}
      {meta.resultTypes && meta.resultTypes.length > 0 && (
        <div className={styles.field}>
          <label>결과 타입 ({meta.resultTypes.length}개)</label>
          <ul className={styles.metaList}>
            {meta.resultTypes.map((rt) => (
              <li key={rt.key} className={styles.metaItem}>
                <code>{rt.key}</code> → <span>{rt.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 비교 타입 */}
      {meta.compareTypes && meta.compareTypes.length > 0 && (
        <div className={styles.field}>
          <label>비교 타입 ({meta.compareTypes.length}개)</label>
          <ul className={styles.metaList}>
            {meta.compareTypes.map((ct, index) => (
              <li key={index} className={styles.metaItem}>
                <span>{ct.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
```

#### 상태 관리 (React Query 훅)

```typescript
// src/services/hooks/useAdmin.ts에 추가
export const useGetTrendDetail = (trendId: number) => {
  return useQuery({
    queryKey: ['admin', 'trend', trendId],
    queryFn: async () => {
      const trends = await adminApi.getTrends();
      const trend = trends.find((t) => t.id === trendId);
      if (!trend) throw new Error('Trend not found');
      return trend;
    },
    enabled: !!trendId,
    staleTime: 1000 * 60 * 5, // 5분
  });
};
```

---

### 3. 트렌드 수정 페이지 (`/admin/trend/edit/{trendId}`)

#### 컴포넌트 구조

```tsx
// src/app/admin/trend/edit/[trendId]/page.tsx
'use client';

import { use } from 'react';

interface PageProps {
  params: Promise<{ trendId: string }>;
}

export default function AdminTrendEditPage({ params }: PageProps) {
  const { trendId } = use(params);

  return <AdminTrendEdit trendId={Number(trendId)} />;
}

// src/components/features/Admin/AdminTrendEdit/AdminTrendEdit.tsx
export default function AdminTrendEdit({ trendId }: { trendId: number }) {
  const router = useRouter();
  const { openConfirm } = useModal();
  const { data: trend, isLoading } = useGetTrendDetail(trendId);
  const { mutate: updateTrend, isPending: isUpdating } = useUpdateTrend();
  const { mutate: deleteTrend, isPending: isDeleting } = useDeleteTrend();

  if (isLoading) return <div>로딩 중...</div>;
  if (!trend) return <div>트렌드를 찾을 수 없습니다.</div>;

  const handleDelete = () => {
    openConfirm({
      title: '트렌드 삭제',
      message: `정말 "${trend.title}" 트렌드를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      confirmText: '삭제',
      cancelText: '취소',
      onConfirm: () => {
        deleteTrend(trendId);
      },
    });
  };

  return (
    <div className={styles.container}>
      <AdminTrendForm
        mode="edit"
        initialData={trend}
        onSubmit={(data) => updateTrend({ trendId, data })}
        isSubmitting={isUpdating}
      />

      {/* 삭제 버튼 (별도 영역) */}
      <div className={styles.dangerZone}>
        <h3>위험 영역</h3>
        <p>이 트렌드를 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.</p>
        <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? '삭제 중...' : '트렌드 삭제'}
        </Button>
      </div>
    </div>
  );
}
```

#### AdminTrendForm 수정 (모드 추가)

```tsx
// src/components/features/Admin/AdminTrendForm/AdminTrendForm.tsx
interface AdminTrendFormProps {
  mode?: 'create' | 'edit';
  initialData?: AdminTrendResponse;
  onSubmit: (data: TFormData) => void;
}

export default function AdminTrendForm({
  mode = 'create',
  initialData,
  onSubmit,
}: AdminTrendFormProps) {
  const { register, handleSubmit, setValue, watch } = useForm<TFormData>({
    defaultValues: initialData ? convertToFormData(initialData) : defaultValues,
  });

  // Alias 필드 수정 (edit 모드에서는 disabled)
  const isAliasDisabled = mode === 'edit';

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h1>{mode === 'create' ? '트렌드 생성' : '트렌드 수정'}</h1>

      <BasicInfoSection
        register={register}
        setValue={setValue}
        watch={watch}
        isAliasDisabled={isAliasDisabled}
      />

      {mode === 'edit' && (
        <VisibilityToggle
          value={watch('visible')}
          onChange={(value) => setValue('visible', value)}
        />
      )}

      {/* 나머지 섹션들... */}

      <Button type="submit" variant="primary">
        {mode === 'create' ? '트렌드 생성' : '수정 완료'}
      </Button>
    </form>
  );
}
```

#### 데이터 변환 함수

```typescript
// src/lib/trendDataConverter.ts
export function convertToFormData(trend: AdminTrendResponse): TFormData {
  return {
    alias: trend.alias,
    title: trend.title,
    label: trend.label || '',
    imageUrl: trend.imageUrl || '',
    electionIdList: trend.electionIds,
    electionDetailMap: {}, // 선거 상세는 별도 로드 필요
    resultLabel: trend.meta?.resultLabel || '당신의 성향은',
    resultType: convertResultTypeToMap(trend.meta?.resultType || []),
    answerType: trend.meta?.answerType || [],
    visible: trend.visible,
  };
}

function convertResultTypeToMap(resultTypes: ResultTypeResponse[]): Record<string, string> {
  return resultTypes.reduce(
    (acc, rt) => {
      acc[rt.key] = rt.label;
      return acc;
    },
    {} as Record<string, string>
  );
}
```

#### 상태 관리 (React Query 훅)

```typescript
// src/services/hooks/useAdmin.ts에 추가

// 트렌드 수정 훅
export const useUpdateTrend = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { openToast } = useModal();

  return useMutation({
    mutationFn: ({ trendId, data }: { trendId: number; data: UpdateTrendRequest }) =>
      adminApi.updateTrend(trendId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'trends'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'trend', variables.trendId] });
      openToast({ message: '트렌드가 수정되었습니다.' });
      router.push('/admin/trend');
    },
    onError: () => {
      openToast({ message: '트렌드 수정에 실패했습니다.', type: 'error' });
    },
  });
};

// 트렌드 삭제 훅
export const useDeleteTrend = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { openToast } = useModal();

  return useMutation({
    mutationFn: (trendId: number) => adminApi.deleteTrend(trendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'trends'] });
      openToast({ message: '트렌드가 삭제되었습니다.' });
      router.push('/admin/trend');
    },
    onError: () => {
      openToast({ message: '트렌드 삭제에 실패했습니다.', type: 'error' });
    },
  });
};
```

---

## 🧩 공통 컴포넌트 설계

### 1. VisibilityToggle (공개/비공개 토글)

```tsx
// src/components/common/VisibilityToggle/VisibilityToggle.tsx
interface VisibilityToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export default function VisibilityToggle({ value, onChange, disabled }: VisibilityToggleProps) {
  return (
    <div className={styles.container}>
      <label className={styles.label}>공개 상태</label>
      <button
        type="button"
        className={`${styles.toggle} ${value ? styles.active : ''}`}
        onClick={() => onChange(!value)}
        disabled={disabled}
      >
        <span className={styles.slider} />
        <span className={styles.text}>{value ? '공개' : '비공개'}</span>
      </button>
    </div>
  );
}
```

**참고**: 검색, 필터, 정렬 기능은 API에서 지원하지 않으므로 구현하지 않습니다.

---

## 🔌 API 연동

### API 서비스 추가 필요

```typescript
// src/services/api/admin.ts에 추가
✅ getTrends(): Promise<AdminTrendResponse[]>          // 목록 조회 (이미 구현됨)
✅ updateTrend(trendId, data): Promise<AdminTrendResponse>  // 수정 (이미 구현됨)
✅ deleteTrend(trendId): Promise<void>                 // 삭제 (이미 구현됨)
🆕 setPinnedTrend(trendId): Promise<void>              // 상단 고정 설정 (신규)
```

**상단 고정 API 구현 예시**:

```typescript
// src/services/api/admin.ts에 추가
setPinnedTrend: async (trendId: number | null): Promise<void> => {
  // trendId가 null이면 모든 고정 해제, 숫자면 해당 트렌드 고정
  await axiosInstance.put('/admin/api/v1/trend/pinned', {
    trendId: trendId,
  });
};
```

**참고**:

- API 엔드포인트는 백엔드 구현에 따라 다를 수 있습니다.
- `PUT /admin/api/v1/trend/pinned` 또는 `PUT /admin/api/v1/trend/{trendId}/pin` 형태일 수 있습니다.

### React Query 훅 추가 필요

```typescript
// src/services/hooks/useAdmin.ts에 추가
🆕 useGetTrends()                  // 목록 조회 훅
🆕 useGetTrendDetail(trendId)      // 상세 조회 훅 (목록에서 find)
🆕 useUpdateTrend()                // 수정 훅
🆕 useDeleteTrend()                // 삭제 훅
🆕 useSetPinnedTrend()             // 상단 고정 설정 훅
```

**참고**: API는 검색, 필터, 정렬 파라미터를 지원하지 않습니다. 모든 데이터를 클라이언트에서 받아 표시합니다.

---

## 🗺️ 라우팅 구조

```
/admin
  └── /trend
       ├── /                     → 목록 페이지 (page.tsx)
       ├── /create               → 생성 페이지 (✅ 개발 완료)
       ├── /[trendId]            → 상세 페이지 (page.tsx)
       └── /edit/[trendId]       → 수정 페이지 (page.tsx)
```

### 네비게이션 플로우

```
목록 페이지 (/admin/trend)
  ├─ [+ 트렌드 생성] → /admin/trend/create
  ├─ [상세 보기] → /admin/trend/{trendId}
  └─ [수정] → /admin/trend/edit/{trendId}

상세 페이지 (/admin/trend/{trendId})
  ├─ [목록으로] → /admin/trend
  └─ [수정하기] → /admin/trend/edit/{trendId}

수정 페이지 (/admin/trend/edit/{trendId})
  ├─ [수정 완료] → Toast 알림 → /admin/trend
  ├─ [취소] → 변경 확인 모달 → /admin/trend
  └─ [삭제] → 확인 모달 → 삭제 → Toast 알림 → /admin/trend
```

---

## ✅ 구현 체크리스트

### Phase 1: 트렌드 목록 페이지

#### 파일 생성

- [ ] `/src/app/admin/trend/page.tsx` - 목록 페이지
- [ ] `/src/components/features/Admin/AdminTrendList/AdminTrendList.tsx` - 메인 컴포넌트
- [ ] `/src/components/features/Admin/AdminTrendList/TrendListItem.tsx` - 테이블 행 컴포넌트
- [ ] `/src/components/features/Admin/AdminTrendList/AdminTrendList.module.scss` - 스타일
- [ ] `/src/components/features/Admin/AdminTrendList/TrendListItem.module.scss` - 행 스타일

#### 기능 구현

- [ ] 트렌드 목록 API 연동 (`useGetTrends` 훅 추가)
- [ ] 테이블 UI (고정, 썸네일, 제목, Alias, 상태 배지, 생성일)
- [ ] **상단 고정 기능**
  - [ ] 상단 고정 토글 버튼 (📌 / ○)
  - [ ] 고정된 트렌드 시각적 강조 (배경색, 좌측 선)
  - [ ] 고정된 트렌드 최상단 정렬
  - [ ] 상단 고정 API 연동 (`useSetPinnedTrend` 훅 추가)
  - [ ] 상단 고정 설정 API 구현 (`setPinnedTrend` in admin.ts)
- [ ] 상세 보기 버튼 → 상세 페이지 이동
- [ ] 수정 버튼 → 수정 페이지 이동
- [ ] 빈 상태 UI (트렌드 없을 때)
- [ ] 로딩 상태 UI
- [ ] 에러 핸들링

---

### Phase 2: 트렌드 상세 페이지

#### 파일 생성

- [ ] `/src/app/admin/trend/[trendId]/page.tsx` - 상세 페이지
- [ ] `/src/components/features/Admin/AdminTrendDetail/AdminTrendDetail.tsx` - 메인 컴포넌트
- [ ] `/src/components/features/Admin/AdminTrendDetail/TrendInfoSection.tsx` - 기본 정보 섹션
- [ ] `/src/components/features/Admin/AdminTrendDetail/TrendElectionSection.tsx` - 선거 목록 섹션
- [ ] `/src/components/features/Admin/AdminTrendDetail/TrendMetaSection.tsx` - 메타 정보 섹션
- [ ] `/src/components/features/Admin/AdminTrendDetail/AdminTrendDetail.module.scss` - 스타일

#### 기능 구현

- [ ] 트렌드 상세 조회 (`useGetTrendDetail` 훅 추가)
- [ ] 기본 정보 섹션 표시 (ID, Alias, 제목, 부제, 상태, 생성일, 썸네일)
- [ ] 선거 목록 섹션 표시 (electionIds 배열)
- [ ] 메타 정보 섹션 표시 (resultLabel, resultTypes, compareTypes)
- [ ] 수정하기 버튼 → 수정 페이지 이동
- [ ] 목록으로 버튼 → 목록 페이지 이동
- [ ] 로딩 상태 UI
- [ ] 404 에러 처리 (트렌드 없음)

---

### Phase 3: 트렌드 수정 페이지

#### 파일 생성

- [ ] `/src/app/admin/trend/edit/[trendId]/page.tsx` - 수정 페이지
- [ ] `/src/components/features/Admin/AdminTrendEdit/AdminTrendEdit.tsx` - 메인 컴포넌트
- [ ] `/src/components/common/VisibilityToggle/VisibilityToggle.tsx` - 공개 상태 토글
- [ ] `/src/lib/trendDataConverter.ts` - 데이터 변환 유틸
- [ ] `/src/components/features/Admin/AdminTrendEdit/AdminTrendEdit.module.scss` - 스타일

#### 기능 구현

- [ ] 트렌드 상세 조회 (기존 `useGetTrendDetail` 훅 사용)
- [ ] AdminTrendForm에 mode prop 추가 ('create' | 'edit')
- [ ] AdminTrendForm에 isSubmitting prop 추가
- [ ] Alias 필드 읽기 전용 처리 (edit 모드)
- [ ] 공개 상태 토글 추가 (VisibilityToggle 컴포넌트)
- [ ] 초기 데이터 폼에 바인딩 (convertToFormData 함수)
- [ ] 수정 API 연동 (`useUpdateTrend` 훅 추가)
- [ ] 삭제 버튼 및 확인 모달 구현
- [ ] 삭제 API 연동 (`useDeleteTrend` 훅 추가)
- [ ] 수정/삭제 완료 후 목록 페이지로 이동
- [ ] Toast 알림 (성공/실패)
- [ ] 로딩 상태 UI
- [ ] 에러 핸들링

---

### Phase 4: React Query 훅 추가

#### `/src/services/hooks/useAdmin.ts`에 추가

- [ ] `useGetTrends()` - 목록 조회
- [ ] `useGetTrendDetail(trendId)` - 상세 조회 (목록에서 find)
- [ ] `useUpdateTrend()` - 수정 (Toast 알림 포함)
- [ ] `useDeleteTrend()` - 삭제 (Toast 알림 포함)
- [ ] `useSetPinnedTrend()` - 상단 고정 설정 (Toast 알림 포함)

---

### Phase 5: 타입 및 유틸 추가

#### 타입 확인/추가 (`/src/types/trend.ts`)

- [ ] `UpdateTrendRequest` 타입 확인 (✅ 이미 존재)
- [ ] `AdminTrendResponse` 타입 확인 및 **`isPinned: boolean` 필드 추가** 필요
- [ ] `TrendMeta` 타입 확인 (✅ 이미 존재)

**AdminTrendResponse 타입 수정 필요**:

```typescript
// src/types/trend.ts
export interface AdminTrendResponse {
  id: number;
  alias: string;
  title: string;
  label?: string;
  imageUrl?: string;
  electionIds: string[];
  meta?: TrendMeta;
  visible: boolean;
  isPinned: boolean; // 🆕 추가 필요
  createdAt: string;
}
```

#### 유틸 함수 (`/src/lib/trendDataConverter.ts`)

- [ ] `convertToFormData(trend)` - AdminTrendResponse → TFormData 변환
- [ ] `convertResultTypeToMap(resultTypes)` - ResultType[] → Record<string, string> 변환

---

### Phase 6: 테스트 & 개선

- [ ] 목록 페이지 반응형 테스트 (모바일, 태블릿, 데스크톱)
- [ ] **상단 고정 기능 테스트**
  - [ ] 고정 버튼 클릭 시 정상 동작
  - [ ] 다른 트렌드 고정 시 기존 고정 해제
  - [ ] 고정된 트렌드 최상단 정렬 확인
  - [ ] 고정 배지 표시 확인
  - [ ] Toast 알림 확인
- [ ] 상세 페이지 데이터 표시 테스트
- [ ] 수정 페이지 폼 동작 테스트
- [ ] 삭제 기능 및 확인 모달 테스트
- [ ] 에러 케이스 테스트 (네트워크 오류, 404 등)
- [ ] Toast/Modal 알림 테스트
- [ ] 성능 최적화 (useMemo, useCallback)
- [ ] 접근성 개선 (키보드 네비게이션, ARIA 레이블)

---

## 🎨 디자인 가이드라인

### 색상 (기존 스타일 참고)

```scss
// 기존 AdminTrendForm에서 사용하는 색상 체계 유지
$primary: #4caf50;
$secondary: #757575;
$border: #e0e0e0;
$background: #f5f5f5;
$text: #212121;
$text-secondary: #757575;
```

### 간격 (기존 스타일 참고)

```scss
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;
```

### 반응형 브레이크포인트

```scss
$breakpoint-mobile: 768px;
$breakpoint-tablet: 1024px;
$breakpoint-desktop: 1280px;
```

---

## 📝 추가 고려사항

### 1. 보안

- [ ] 관리자 인증 미들웨어 추가 (현재 미구현)
- [ ] CSRF 토큰 검증
- [ ] XSS 방지 (입력값 sanitization)

### 2. 성능

- [ ] 이미지 최적화 (Next.js Image 컴포넌트 사용)
- [ ] React Query 캐싱 전략 최적화 (staleTime 설정)
- [ ] 컴포넌트 메모이제이션 (React.memo, useMemo, useCallback)

### 3. UX 개선 (선택 사항 - 향후 개선)

- [ ] 트렌드 복제 기능
- [ ] 일괄 작업 기능 (일괄 공개/비공개 전환)
- [ ] 드래그로 순서 변경 (우선순위 관리)
- [ ] 상세 페이지에서 바로 수정 가능한 인라인 편집

### 4. 에러 처리

- [ ] 전역 에러 바운더리
- [ ] API 에러 메시지 Toast로 표시
- [ ] 네트워크 오프라인 감지

---

## 🚀 개발 순서 제안

### 추천 개발 순서 (단계별)

1. **1단계**: React Query 훅 및 API 추가
   - `useGetTrends` 훅 구현
   - `useGetTrendDetail` 훅 구현
   - `useSetPinnedTrend` 훅 구현
   - `setPinnedTrend` API 함수 추가 (admin.ts)
   - `AdminTrendResponse` 타입에 `isPinned` 필드 추가

2. **2단계**: 트렌드 목록 페이지 구현
   - 목록 페이지 컴포넌트 생성
   - 테이블 UI 구현 (TrendListItem)
   - **상단 고정 기능 구현**
     - 고정 토글 버튼 추가
     - 고정된 트렌드 시각적 강조
     - 고정 정렬 로직
   - 빈 상태 및 로딩 UI

3. **3단계**: 트렌드 상세 페이지 구현
   - 상세 페이지 컴포넌트 생성
   - 기본 정보, 선거 목록, 메타 정보 섹션 구현
   - 네비게이션 버튼 추가

4. **4단계**: AdminTrendForm 수정 모드 대응
   - mode prop 추가 ('create' | 'edit')
   - isSubmitting prop 추가
   - Alias 읽기 전용 처리
   - 공개 상태 토글 추가 (VisibilityToggle 컴포넌트)

5. **5단계**: 트렌드 수정 페이지 구현
   - 수정 페이지 컴포넌트 생성
   - 데이터 변환 유틸 (convertToFormData) 구현
   - `useUpdateTrend` 훅 구현

6. **6단계**: 삭제 기능 추가
   - `useDeleteTrend` 훅 구현
   - 삭제 버튼 및 확인 모달 구현
   - Danger Zone UI 구현

7. **7단계**: 전체 테스트 및 버그 수정
   - 각 페이지 기능 테스트
   - 에러 케이스 테스트
   - Toast/Modal 알림 테스트

8. **8단계**: 스타일 개선 및 반응형 최적화
   - 반응형 디자인 적용 (모바일 대응)
   - 접근성 개선
   - 성능 최적화

---

## 📚 참고 자료

- [React Hook Form 공식 문서](https://react-hook-form.com/)
- [TanStack Query 공식 문서](https://tanstack.com/query/latest)
- [Next.js App Router 가이드](https://nextjs.org/docs/app)
- [dnd-kit 공식 문서](https://docs.dndkit.com/)

---

**작성 완료**
이 가이드를 기반으로 Claude Code Agent가 단계별로 개발을 진행합니다.
