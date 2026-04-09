# 핫픽 제안 API 연동 및 어드민 관리 페이지 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SuggestPage의 localStorage 기반 목 로직을 서버 API로 교체하고, 어드민에서 제안을 조회/승인/거절하는 관리 페이지를 추가한다.

**Architecture:** 유저용 `useSuggestion.ts` 훅과 어드민용 `useAdmin.ts` 확장으로 API 계층을 구성. SuggestPage는 기존 UI를 유지하되 카테고리를 서버에서 로딩하고 제출을 API로 교체. 어드민은 기존 `AdminHotpickList` 패턴을 따라 목록+상세 두 페이지로 구성.

**Tech Stack:** Next.js 14 App Router, TypeScript, TanStack Query v5, SCSS Modules

---

## 파일 구조

### 신규 파일

| 파일                                                                                    | 역할                         |
| --------------------------------------------------------------------------------------- | ---------------------------- |
| `src/hooks/api/useSuggestion.ts`                                                        | 유저용 제안 제출 mutation 훅 |
| `src/app/admin/suggestion/page.tsx`                                                     | 어드민 제안 목록 라우트      |
| `src/app/admin/suggestion/[id]/page.tsx`                                                | 어드민 제안 상세 라우트      |
| `src/components/features/Admin/AdminSuggestionList/AdminSuggestionList.tsx`             | 목록 컴포넌트                |
| `src/components/features/Admin/AdminSuggestionList/AdminSuggestionList.module.scss`     | 목록 스타일                  |
| `src/components/features/Admin/AdminSuggestionDetail/AdminSuggestionDetail.tsx`         | 상세 컴포넌트                |
| `src/components/features/Admin/AdminSuggestionDetail/AdminSuggestionDetail.module.scss` | 상세 스타일                  |

### 수정 파일

| 파일                                                  | 변경 내용                                        |
| ----------------------------------------------------- | ------------------------------------------------ |
| `src/components/features/Suggest/SuggestPage.tsx`     | 카테고리 API 로딩, 제출 API 연동, 성공 화면 제거 |
| `src/hooks/api/useAdmin.ts`                           | 제안 관련 query keys + 4개 훅 추가               |
| `src/hooks/api/index.ts`                              | 신규 훅 export 추가                              |
| `src/components/features/Admin/AdminNav/AdminNav.tsx` | 제안 메뉴 추가                                   |

---

## Task 1: useSuggestion.ts — 유저용 제안 제출 훅

**Files:**

- Create: `src/hooks/api/useSuggestion.ts`
- Modify: `src/hooks/api/index.ts`

- [ ] **Step 1: useSuggestion.ts 훅 파일 생성**

```typescript
import { useMutation } from '@tanstack/react-query';

import { createSuggestion } from '@/generated/api/client/suggestion/suggestion';
import type { CreateSuggestionRequest } from '@/generated/models';

/**
 * 유저용: 핫픽 제안 제출 Hook
 */
export const useCreateSuggestion = () => {
  return useMutation({
    mutationFn: (data: CreateSuggestionRequest) => createSuggestion(data),
  });
};
```

- [ ] **Step 2: index.ts에 export 추가**

`src/hooks/api/index.ts` 파일 하단에 추가:

```typescript
// Suggestion Hooks
export { useCreateSuggestion } from '@/hooks/api/useSuggestion';
```

- [ ] **Step 3: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```
feat: 유저용 제안 제출 훅 추가 (useSuggestion)
```

---

## Task 2: SuggestPage API 연동

**Files:**

- Modify: `src/components/features/Suggest/SuggestPage.tsx`

- [ ] **Step 1: import 수정 및 CATEGORIES 하드코딩 제거**

기존 import에 추가하고 `CATEGORIES` 상수를 제거:

```typescript
'use client';

import { useState, useCallback, type FC } from 'react';

import { useRouter } from 'next/navigation';

import SparkleIcon from '@/assets/icon/SparkleIcon';
import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';
import styles from '@/components/features/Suggest/SuggestPage.module.scss';
import { useCategories } from '@/hooks/api/useDisplay';
import { useCreateSuggestion } from '@/hooks/api/useSuggestion';
import { useToast } from '@/hooks/useToast';
```

`Link` import와 `CATEGORIES` 상수는 제거한다. `SuggestFormData` 인터페이스는 유지.

- [ ] **Step 2: 컴포넌트 상단에 훅 연결**

`SuggestPage` 컴포넌트 내부 상단에 추가:

```typescript
export const SuggestPage: FC = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { data: categories, isLoading: isCategoriesLoading } = useCategories();
  const { mutate: submitSuggestion, isPending: isSubmitting } = useCreateSuggestion();
```

`isSubmitted` state는 제거한다.

- [ ] **Step 3: handleSubmit을 API 호출로 교체**

기존 localStorage 저장 로직과 `setIsSubmitted(true)` 전부 제거하고 교체:

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!validate() || isSubmitting) {
    return;
  }

  submitSuggestion(
    {
      title: formData.title.trim(),
      items: formData.options.filter((opt) => opt.trim()),
      categoryIds: formData.categoryIds,
    },
    {
      onSuccess: () => {
        showToast('제안이 접수되었어요!');
        router.push('/');
      },
      onError: () => {
        showToast('제안 제출에 실패했습니다. 다시 시도해주세요.');
      },
    }
  );
};
```

- [ ] **Step 4: 성공 화면(isSubmitted 분기) 제거**

`if (isSubmitted) { return (...) }` 블록 전체를 삭제한다. `isSubmitted` state도 삭제.

- [ ] **Step 5: 카테고리 영역을 서버 데이터 기반으로 교체**

카테고리 그리드 부분을 수정:

```tsx
{
  /* 카테고리 */
}
<div className={styles.field} data-field="categoryIds">
  <label className={styles.label}>
    카테고리 <span className={styles.required}>*</span>
  </label>
  <p className={styles.hint}>어울리는 카테고리를 선택해주세요 (복수 선택 가능)</p>
  <div className={styles.categoryGrid}>
    {isCategoriesLoading ? (
      <p className={styles.hint}>카테고리 로딩 중...</p>
    ) : (
      categories?.map((cat) => {
        const isSelected = formData.categoryIds.includes(cat.id!);
        return (
          <button
            key={cat.id}
            type="button"
            className={`${styles.categoryChip} ${isSelected ? styles.categoryChipActive : ''}`}
            onClick={() => {
              const updated = isSelected
                ? formData.categoryIds.filter((id) => id !== cat.id)
                : [...formData.categoryIds, cat.id!];
              updateField('categoryIds', updated);
            }}
          >
            {isSelected && <span className={styles.categoryCheck}>&#10003;</span>}
            {cat.name}
          </button>
        );
      })
    )}
  </div>
  {errors.categoryIds && <p className={styles.errorText}>{errors.categoryIds}</p>}
</div>;
```

- [ ] **Step 6: 제출 버튼에 로딩 상태 반영**

```tsx
<button type="submit" className={styles.submitButton} disabled={isSubmitting}>
  {isSubmitting ? '제출 중...' : '핫픽 제안하기'}
</button>
```

- [ ] **Step 7: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 8: 커밋**

```
feat: SuggestPage API 연동 — 카테고리 서버 로딩 + 제안 제출 API
```

---

## Task 3: useAdmin.ts — 어드민 제안 관련 훅 추가

**Files:**

- Modify: `src/hooks/api/useAdmin.ts`
- Modify: `src/hooks/api/index.ts`

- [ ] **Step 1: import 추가**

`src/hooks/api/useAdmin.ts` 상단 import에 추가:

```typescript
import {
  getSuggestions,
  getSuggestion,
  approveSuggestion,
  rejectSuggestion,
} from '@/generated/api/client/admin-suggestion/admin-suggestion';
import type {
  // ... 기존 타입들 유지
  SuggestionResponse,
  GetSuggestionsStatus,
  ReviewSuggestionRequest,
} from '@/generated/models';
```

- [ ] **Step 2: adminKeys에 제안 키 추가**

```typescript
export const adminKeys = {
  all: ['admin'] as const,
  hotpicks: () => [...adminKeys.all, 'hotpicks'] as const,
  hotpick: (id: number) => [...adminKeys.all, 'hotpick', id] as const,
  categories: () => [...adminKeys.all, 'categories'] as const,
  serverMetas: () => [...adminKeys.all, 'serverMetas'] as const,
  suggestions: (status?: GetSuggestionsStatus) =>
    [...adminKeys.all, 'suggestions', status] as const,
  suggestion: (id: number) => [...adminKeys.all, 'suggestion', id] as const,
};
```

- [ ] **Step 3: 제안 관련 훅 4개 추가**

파일 하단 (ServerMeta Hooks 섹션 아래)에 추가:

```typescript
// ──────────────────────────────────────────────────────────
// Suggestion Hooks
// ──────────────────────────────────────────────────────────

/**
 * Admin: 제안 목록 조회 Hook
 */
export const useSuggestions = (status?: GetSuggestionsStatus) =>
  useQuery({
    queryKey: adminKeys.suggestions(status),
    queryFn: () => getSuggestions(status ? { status } : undefined) as Promise<SuggestionResponse[]>,
  });

/**
 * Admin: 제안 상세 조회 Hook
 */
export const useAdminSuggestion = (id: number) =>
  useQuery({
    queryKey: adminKeys.suggestion(id),
    queryFn: () => getSuggestion(id) as Promise<SuggestionResponse>,
    enabled: !!id,
  });

/**
 * Admin: 제안 승인 Hook
 */
export const useApproveSuggestion = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReviewSuggestionRequest }) =>
      approveSuggestion(id, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.suggestions() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.suggestion(variables.id) });
      showToast('제안이 승인되었습니다. 핫픽이 자동 생성됩니다.');
    },
    onError: () => {
      showToast('제안 승인에 실패했습니다.');
    },
  });
};

/**
 * Admin: 제안 거절 Hook
 */
export const useRejectSuggestion = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReviewSuggestionRequest }) =>
      rejectSuggestion(id, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.suggestions() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.suggestion(variables.id) });
      showToast('제안이 거절되었습니다.');
    },
    onError: () => {
      showToast('제안 거절에 실패했습니다.');
    },
  });
};
```

- [ ] **Step 4: index.ts에 export 추가**

`src/hooks/api/index.ts`의 Admin Hooks export에 추가:

```typescript
// Admin Hooks
export {
  adminKeys,
  useHotpicks,
  useCreateHotpick,
  useUpdateHotpick,
  useDeleteHotpick,
  useGeneratePresignedUrl,
  useCheckHotpickAlias,
  useAdminCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useSuggestions,
  useAdminSuggestion,
  useApproveSuggestion,
  useRejectSuggestion,
} from '@/hooks/api/useAdmin';
```

- [ ] **Step 5: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 6: 커밋**

```
feat: 어드민 제안 관리 훅 추가 (목록/상세/승인/거절)
```

---

## Task 4: AdminNav에 제안 메뉴 추가

**Files:**

- Modify: `src/components/features/Admin/AdminNav/AdminNav.tsx`

- [ ] **Step 1: NAV_ITEMS에 제안 항목 추가**

```typescript
const NAV_ITEMS = [
  { href: '/admin/bundle', label: '번들' },
  { href: '/admin/hotpick', label: '핫픽' },
  { href: '/admin/suggestion', label: '제안' },
  { href: '/admin/category', label: '카테고리' },
  { href: '/admin/server-meta', label: '서버 메타' },
];
```

- [ ] **Step 2: 커밋**

```
feat: 어드민 네비게이션에 제안 메뉴 추가
```

---

## Task 5: 어드민 제안 목록 페이지

**Files:**

- Create: `src/app/admin/suggestion/page.tsx`
- Create: `src/components/features/Admin/AdminSuggestionList/AdminSuggestionList.tsx`
- Create: `src/components/features/Admin/AdminSuggestionList/AdminSuggestionList.module.scss`

- [ ] **Step 1: 라우트 파일 생성**

`src/app/admin/suggestion/page.tsx`:

```tsx
'use client';

import AdminSuggestionList from '@/components/features/Admin/AdminSuggestionList/AdminSuggestionList';

export default function AdminSuggestionListPage() {
  return <AdminSuggestionList />;
}
```

- [ ] **Step 2: 스타일 파일 생성**

`src/components/features/Admin/AdminSuggestionList/AdminSuggestionList.module.scss`:

```scss
@use '@/styles/variables' as *;

.container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  h1 {
    font-size: 2rem;
    font-weight: $font-weight-bold;
    color: $white;
    margin: 0;
  }
}

.totalCount {
  font-size: 0.875rem;
  color: $text-tertiary;
  margin-top: 4px;
  display: block;
}

.filterGroup {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.filterButton {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid $border-placeholder;
  background: transparent;
  color: $text-secondary;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: $bg-tertiary;
  }
}

.filterButtonActive {
  background: $bg-tertiary;
  color: $white;
  border-color: $text-tertiary;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  font-size: 1.125rem;
  color: $text-tertiary;
}

.tableWrapper {
  overflow-x: auto;
  background: $bg-secondary;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.table {
  width: 100%;
  border-collapse: collapse;

  thead {
    background: $bg-tertiary;
    border-bottom: 2px solid $border-placeholder;

    tr {
      th {
        padding: 1rem;
        text-align: left;
        font-size: 0.875rem;
        font-weight: $font-weight-semibold;
        color: $text-secondary;
        white-space: nowrap;

        &:first-child {
          padding-left: 1.5rem;
          width: 50px;
          text-align: center;
        }
      }
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid $border-placeholder;
      transition: background-color 0.2s;
      cursor: pointer;

      &:hover {
        background-color: $bg-tertiary;
      }

      &:last-child {
        border-bottom: none;
      }

      td {
        padding: 1rem;
        font-size: 0.875rem;
        color: $text-secondary;

        &:first-child {
          padding-left: 1.5rem;
          text-align: center;
          color: $text-tertiary;
        }
      }
    }
  }
}

.statusBadge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: $font-weight-semibold;
}

.statusPending {
  background: rgba(255, 199, 0, 0.15);
  color: $warning;
}

.statusApproved {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.statusRejected {
  background: rgba(255, 46, 46, 0.15);
  color: $error;
}

.categoryChip {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  background: $bg-tertiary;
  color: $text-tertiary;
  margin-right: 0.25rem;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: $bg-secondary;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);

  p {
    font-size: 1.125rem;
    color: $text-tertiary;
    margin: 0;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;

    h1 {
      font-size: 1.5rem;
    }
  }

  .table {
    min-width: 700px;
  }
}
```

- [ ] **Step 3: 목록 컴포넌트 생성**

`src/components/features/Admin/AdminSuggestionList/AdminSuggestionList.tsx`:

```tsx
'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import styles from '@/components/features/Admin/AdminSuggestionList/AdminSuggestionList.module.scss';
import { GetSuggestionsStatus } from '@/generated/models';
import { useSuggestions } from '@/hooks/api/useAdmin';

const STATUS_FILTERS = [
  { value: undefined, label: '전체' },
  { value: GetSuggestionsStatus.PENDING, label: '대기중' },
  { value: GetSuggestionsStatus.APPROVED, label: '승인' },
  { value: GetSuggestionsStatus.REJECTED, label: '거절' },
] as const;

const STATUS_LABEL: Record<string, string> = {
  PENDING: '대기중',
  APPROVED: '승인',
  REJECTED: '거절',
};

const getStatusClass = (status?: string) => {
  switch (status) {
    case 'PENDING':
      return styles.statusPending;
    case 'APPROVED':
      return styles.statusApproved;
    case 'REJECTED':
      return styles.statusRejected;
    default:
      return '';
  }
};

export default function AdminSuggestionList() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<GetSuggestionsStatus | undefined>(undefined);
  const { data: suggestions, isLoading } = useSuggestions(statusFilter);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>제안 목록</h1>
          {suggestions && suggestions.length > 0 && (
            <span className={styles.totalCount}>총 {suggestions.length}개</span>
          )}
        </div>
      </header>

      {/* 상태 필터 */}
      <div className={styles.filterGroup}>
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.label}
            type="button"
            className={`${styles.filterButton} ${statusFilter === filter.value ? styles.filterButtonActive : ''}`}
            onClick={() => setStatusFilter(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* 목록 테이블 */}
      {suggestions && suggestions.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>제목</th>
                <th>선택지</th>
                <th>카테고리</th>
                <th>상태</th>
                <th>제출일</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((suggestion, index) => (
                <tr
                  key={suggestion.id}
                  onClick={() => router.push(`/admin/suggestion/${suggestion.id}`)}
                >
                  <td>{suggestions.length - index}</td>
                  <td>{suggestion.title}</td>
                  <td>{suggestion.items?.map((item) => item.title).join(', ')}</td>
                  <td>
                    {suggestion.categories?.map((cat) => (
                      <span key={cat.id} className={styles.categoryChip}>
                        {cat.name}
                      </span>
                    ))}
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClass(suggestion.status)}`}>
                      {STATUS_LABEL[suggestion.status ?? ''] ?? suggestion.status}
                    </span>
                  </td>
                  <td>
                    {suggestion.createdAt
                      ? new Date(suggestion.createdAt).toLocaleDateString('ko-KR')
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.empty}>
          <p>제안이 없습니다.</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 5: 커밋**

```
feat: 어드민 제안 목록 페이지 추가
```

---

## Task 6: 어드민 제안 상세 페이지

**Files:**

- Create: `src/app/admin/suggestion/[id]/page.tsx`
- Create: `src/components/features/Admin/AdminSuggestionDetail/AdminSuggestionDetail.tsx`
- Create: `src/components/features/Admin/AdminSuggestionDetail/AdminSuggestionDetail.module.scss`

- [ ] **Step 1: 라우트 파일 생성**

`src/app/admin/suggestion/[id]/page.tsx`:

```tsx
'use client';

import { use } from 'react';

import AdminSuggestionDetail from '@/components/features/Admin/AdminSuggestionDetail/AdminSuggestionDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminSuggestionDetailPage({ params }: PageProps) {
  const { id } = use(params);

  return <AdminSuggestionDetail suggestionId={Number(id)} />;
}
```

- [ ] **Step 2: 스타일 파일 생성**

`src/components/features/Admin/AdminSuggestionDetail/AdminSuggestionDetail.module.scss`:

```scss
@use '@/styles/variables' as *;

.container {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.backButton {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: $text-tertiary;
  font-size: 0.875rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-bottom: 1.5rem;

  &:hover {
    color: $white;
  }
}

.card {
  background: $bg-secondary;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.titleRow {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.title {
  font-size: 1.5rem;
  font-weight: $font-weight-bold;
  color: $white;
  margin: 0;
}

.statusBadge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8125rem;
  font-weight: $font-weight-semibold;
  flex-shrink: 0;
}

.statusPending {
  background: rgba(255, 199, 0, 0.15);
  color: $warning;
}

.statusApproved {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.statusRejected {
  background: rgba(255, 46, 46, 0.15);
  color: $error;
}

.section {
  margin-bottom: 1.5rem;
}

.sectionLabel {
  font-size: 0.8125rem;
  font-weight: $font-weight-semibold;
  color: $text-tertiary;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
}

.itemList {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item {
  padding: 0.625rem 1rem;
  background: $bg-tertiary;
  border-radius: 6px;
  color: $text-secondary;
  font-size: 0.9375rem;
}

.categoryChips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.categoryChip {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8125rem;
  background: $bg-tertiary;
  color: $text-secondary;
}

.metaRow {
  display: flex;
  gap: 2rem;
  font-size: 0.8125rem;
  color: $text-tertiary;
}

.divider {
  border: none;
  border-top: 1px solid $border-placeholder;
  margin: 1.5rem 0;
}

// 어드민 메모 (기존 메모 표시용)
.memoDisplay {
  padding: 0.75rem 1rem;
  background: $bg-tertiary;
  border-radius: 6px;
  color: $text-secondary;
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre-line;
}

// 액션 영역 (PENDING 전용)
.actionSection {
  margin-top: 2rem;
}

.memoInput {
  width: 100%;
  min-height: 80px;
  padding: 0.75rem 1rem;
  background: $bg-tertiary;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  color: $white;
  font-size: 0.875rem;
  font-family: inherit;
  resize: vertical;
  margin-bottom: 1rem;

  &::placeholder {
    color: $text-tertiary;
  }

  &:focus {
    outline: none;
    border-color: $text-tertiary;
  }
}

.actionButtons {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.rejectButton {
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  border: 1px solid $border-placeholder;
  background: transparent;
  color: $text-secondary;
  font-size: 0.875rem;
  cursor: pointer;

  &:hover {
    background: $bg-tertiary;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.approveButton {
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  border: 1px solid $border-placeholder;
  background: $bg-tertiary;
  color: $white;
  font-size: 0.875rem;
  cursor: pointer;

  &:hover {
    background: lighten($bg-tertiary, 5%);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  font-size: 1.125rem;
  color: $text-tertiary;
}

// Confirm 모달
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: $bg-secondary;
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
  border: 1px solid #333;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.modalTitle {
  font-size: 1.25rem;
  font-weight: $font-weight-bold;
  color: $white;
  margin: 0 0 0.75rem 0;
}

.modalMessage {
  font-size: 0.875rem;
  color: $text-secondary;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
  white-space: pre-line;
}

.modalActions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.modalConfirmApprove {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid $border-placeholder;
  background: $bg-tertiary;
  color: $white;
  font-size: 0.875rem;
  cursor: pointer;
}

.modalConfirmReject {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  background: $error;
  color: $white;
  font-size: 0.875rem;
  cursor: pointer;
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }

  .card {
    padding: 1.25rem;
  }

  .title {
    font-size: 1.25rem;
  }

  .titleRow {
    flex-direction: column;
    gap: 0.75rem;
  }

  .metaRow {
    flex-direction: column;
    gap: 0.5rem;
  }
}
```

- [ ] **Step 3: 상세 컴포넌트 생성**

`src/components/features/Admin/AdminSuggestionDetail/AdminSuggestionDetail.tsx`:

```tsx
'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/common/Button/Button';
import styles from '@/components/features/Admin/AdminSuggestionDetail/AdminSuggestionDetail.module.scss';
import {
  useAdminSuggestion,
  useApproveSuggestion,
  useRejectSuggestion,
} from '@/hooks/api/useAdmin';
import { useConfirm } from '@/hooks/useConfirm';

interface AdminSuggestionDetailProps {
  suggestionId: number;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: '대기중',
  APPROVED: '승인',
  REJECTED: '거절',
};

const getStatusClass = (status?: string) => {
  switch (status) {
    case 'PENDING':
      return styles.statusPending;
    case 'APPROVED':
      return styles.statusApproved;
    case 'REJECTED':
      return styles.statusRejected;
    default:
      return '';
  }
};

export default function AdminSuggestionDetail({ suggestionId }: AdminSuggestionDetailProps) {
  const router = useRouter();
  const { data: suggestion, isLoading } = useAdminSuggestion(suggestionId);
  const { mutate: approve, isPending: isApproving } = useApproveSuggestion();
  const { mutate: reject, isPending: isRejecting } = useRejectSuggestion();
  const { showConfirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  const [adminMemo, setAdminMemo] = useState('');

  const isPending = suggestion?.status === 'PENDING';
  const isProcessing = isApproving || isRejecting;

  const handleApprove = () => {
    showConfirm('제안을 승인하시겠습니까?', {
      message: '승인하면 핫픽이 자동으로 생성됩니다.',
      confirmText: '승인',
      cancelText: '취소',
      onConfirm: () => {
        approve(
          { id: suggestionId, data: { adminMemo: adminMemo.trim() || undefined } },
          { onSuccess: () => router.push('/admin/suggestion') }
        );
      },
    });
  };

  const handleReject = () => {
    showConfirm('제안을 거절하시겠습니까?', {
      message: '거절된 제안은 되돌릴 수 없습니다.',
      confirmText: '거절',
      cancelText: '취소',
      onConfirm: () => {
        reject(
          { id: suggestionId, data: { adminMemo: adminMemo.trim() || undefined } },
          { onSuccess: () => router.push('/admin/suggestion') }
        );
      },
    });
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  if (!suggestion) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>제안을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.backButton}
        onClick={() => router.push('/admin/suggestion')}
      >
        &larr; 목록으로
      </button>

      <div className={styles.card}>
        {/* 제목 + 상태 */}
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{suggestion.title}</h1>
          <span className={`${styles.statusBadge} ${getStatusClass(suggestion.status)}`}>
            {STATUS_LABEL[suggestion.status ?? ''] ?? suggestion.status}
          </span>
        </div>

        {/* 선택지 */}
        <div className={styles.section}>
          <p className={styles.sectionLabel}>선택지</p>
          <ul className={styles.itemList}>
            {suggestion.items
              ?.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
              .map((item) => (
                <li key={item.id} className={styles.item}>
                  {item.title}
                </li>
              ))}
          </ul>
        </div>

        {/* 카테고리 */}
        <div className={styles.section}>
          <p className={styles.sectionLabel}>카테고리</p>
          <div className={styles.categoryChips}>
            {suggestion.categories?.map((cat) => (
              <span key={cat.id} className={styles.categoryChip}>
                {cat.name}
              </span>
            ))}
          </div>
        </div>

        {/* 날짜 정보 */}
        <div className={styles.section}>
          <div className={styles.metaRow}>
            <span>
              제출일:{' '}
              {suggestion.createdAt ? new Date(suggestion.createdAt).toLocaleString('ko-KR') : '-'}
            </span>
            {suggestion.reviewedAt && (
              <span>처리일: {new Date(suggestion.reviewedAt).toLocaleString('ko-KR')}</span>
            )}
          </div>
        </div>

        {/* 기존 어드민 메모 */}
        {suggestion.adminMemo && (
          <div className={styles.section}>
            <p className={styles.sectionLabel}>어드민 메모</p>
            <div className={styles.memoDisplay}>{suggestion.adminMemo}</div>
          </div>
        )}

        {/* 액션 영역: PENDING일 때만 */}
        {isPending && (
          <>
            <hr className={styles.divider} />
            <div className={styles.actionSection}>
              <p className={styles.sectionLabel}>어드민 메모 (선택)</p>
              <textarea
                className={styles.memoInput}
                value={adminMemo}
                onChange={(e) => setAdminMemo(e.target.value)}
                placeholder="승인/거절 사유를 남겨주세요 (선택사항)"
              />
              <div className={styles.actionButtons}>
                <button
                  type="button"
                  className={styles.rejectButton}
                  onClick={handleReject}
                  disabled={isProcessing}
                >
                  거절
                </button>
                <button
                  type="button"
                  className={styles.approveButton}
                  onClick={handleApprove}
                  disabled={isProcessing}
                >
                  승인
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confirm 모달 */}
      {confirmState.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>{confirmState.title}</h2>
            {confirmState.message && <p className={styles.modalMessage}>{confirmState.message}</p>}
            <div className={styles.modalActions}>
              <Button variant="outline" onClick={handleCancel}>
                {confirmState.cancelText}
              </Button>
              <button
                type="button"
                className={
                  confirmState.confirmText === '거절'
                    ? styles.modalConfirmReject
                    : styles.modalConfirmApprove
                }
                onClick={handleConfirm}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 5: 커밋**

```
feat: 어드민 제안 상세 페이지 추가 (승인/거절)
```

---

## Task 7: 최종 검증

- [ ] **Step 1: 전체 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 2: 린트 체크**

Run: `npx next lint`
Expected: 에러 없음

- [ ] **Step 3: 개발 서버에서 수동 확인**

확인 항목:

- `/suggest` 페이지: 카테고리 서버에서 로딩되는지, 제출 시 API 호출되는지, 성공 시 토스트 + 홈 이동
- `/admin/suggestion` 페이지: 목록 표시, 상태 필터 동작
- `/admin/suggestion/{id}` 페이지: 상세 정보 표시, 승인/거절 동작
- AdminNav에 제안 메뉴 노출
