# 번들 어드민 페이지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 번들 목록 조회 + 상세 대시보드(참여 현황, 비교 링크, 질문별 통계) 어드민 페이지 구현

**Architecture:** 2개 신규 페이지(`/admin/bundle`, `/admin/bundle/[slug]`). 기존 핫픽 어드민 패턴(테이블 목록 → 상세)을 따르되, 상세는 탭 기반 대시보드. BE API 미구현이므로 MSW mock으로 선개발. `customInstance`(`@/lib/axios-mutator`)로 API 호출, React Query v5 `queryOptions` 패턴 사용.

**Tech Stack:** Next.js 14 App Router, TypeScript, SCSS Modules, React Query v5, MSW

**API URL Convention:** 기존 어드민 API 패턴에 맞춰 `/admin/api/v1/bundles/...` 사용 (설계 문서의 `/api/v1/admin/bundles`와 다름 — 기존 코드베이스 컨벤션 우선)

---

## File Structure

### New Files (12)

| File                                                                                  | Responsibility                           |
| ------------------------------------------------------------------------------------- | ---------------------------------------- |
| `src/types/admin-bundle.ts`                                                           | 어드민 번들 API 요청/응답 타입           |
| `src/hooks/api/useAdminBundle.ts`                                                     | React Query 훅 + customInstance API 호출 |
| `src/mocks/data/adminBundles.ts`                                                      | MSW용 mock 데이터 생성 함수              |
| `src/app/admin/bundle/page.tsx`                                                       | 번들 목록 페이지 라우트                  |
| `src/app/admin/bundle/[slug]/page.tsx`                                                | 번들 상세 대시보드 라우트                |
| `src/components/features/Admin/AdminBundleList/AdminBundleList.tsx`                   | 목록 테이블 컴포넌트                     |
| `src/components/features/Admin/AdminBundleList/AdminBundleList.module.scss`           | 목록 스타일                              |
| `src/components/features/Admin/AdminBundleDashboard/AdminBundleDashboard.tsx`         | 대시보드 쉘 (헤더 + 탭)                  |
| `src/components/features/Admin/AdminBundleDashboard/AdminBundleDashboard.module.scss` | 대시보드 스타일                          |
| `src/components/features/Admin/AdminBundleDashboard/ParticipationTab.tsx`             | 참여 현황 탭                             |
| `src/components/features/Admin/AdminBundleDashboard/CompareLinksTab.tsx`              | 비교 링크 탭                             |
| `src/components/features/Admin/AdminBundleDashboard/QuestionStatsTab.tsx`             | 질문별 통계 탭                           |

### Modified Files (1)

| File                    | Change                          |
| ----------------------- | ------------------------------- |
| `src/mocks/handlers.ts` | 어드민 번들 MSW 핸들러 3개 추가 |

---

## Task 1: 타입 정의

**Files:**

- Create: `src/types/admin-bundle.ts`

- [ ] **Step 1: 타입 파일 생성**

```ts
// src/types/admin-bundle.ts
import type { CategoryCode } from '@/types/hotpick';

/** GET /admin/api/v1/bundles — 목록 아이템 */
export interface AdminBundleSummary {
  bundleId: number;
  hotpickId: number;
  slug: string;
  title: string;
  category: string;
  categoryCode: CategoryCode;
  questionCount: number;
  participantCount: number;
  compareLinkCount: number;
  status: 'ACTIVE' | 'CLOSED';
  createdAt: string;
}

/** 일별 참여 통계 */
export interface DailyStat {
  date: string;
  count: number;
}

/** 비교 링크 아이템 */
export interface AdminCompareLink {
  token: string;
  type: 'ONE_TO_ONE' | 'GROUP';
  creatorNickname: string;
  groupName: string | null;
  memberCount: number;
  isClosed: boolean;
  createdAt: string;
}

/** 질문별 통계 */
export interface AdminQuestionStat {
  electionId: string;
  title: string;
  optionA: string;
  optionB: string;
  optionACount: number;
  optionBCount: number;
  optionARate: number;
  optionBRate: number;
}

/** GET /admin/api/v1/bundles/{slug}/stats */
export interface AdminBundleStats {
  bundleId: number;
  slug: string;
  title: string;
  hotpickId: number;
  categoryCode: CategoryCode;
  status: 'ACTIVE' | 'CLOSED';
  participation: {
    totalParticipants: number;
    completionRate: number;
    dailyStats: DailyStat[];
  };
  compareLinks: {
    totalCount: number;
    oneToOneCount: number;
    groupCount: number;
    activeGroupCount: number;
    links: AdminCompareLink[];
  };
  questionStats: AdminQuestionStat[];
}

/** PATCH /admin/api/v1/bundles/{slug}/status — 요청 */
export interface UpdateBundleStatusRequest {
  status: 'ACTIVE' | 'CLOSED';
}

/** PATCH /admin/api/v1/bundles/{slug}/status — 응답 */
export interface UpdateBundleStatusResponse {
  slug: string;
  status: 'ACTIVE' | 'CLOSED';
}
```

- [ ] **Step 2: 타입 체크 확인**

Run: `npx tsc --noEmit --pretty 2>&1 | grep admin-bundle || echo "OK"`
Expected: OK 또는 관련 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/types/admin-bundle.ts
git commit -m "feat(admin-bundle): 어드민 번들 API 타입 정의"
```

---

## Task 2: React Query 훅 + API 호출

**Files:**

- Create: `src/hooks/api/useAdminBundle.ts`

`useBundle.ts`와 동일하게 `customInstance`를 직접 호출하는 패턴. 별도 API 파일 불필요.

- [ ] **Step 1: 훅 파일 생성**

```ts
// src/hooks/api/useAdminBundle.ts
import { queryOptions, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { customInstance } from '@/lib/axios-mutator';
import type {
  AdminBundleSummary,
  AdminBundleStats,
  UpdateBundleStatusRequest,
  UpdateBundleStatusResponse,
} from '@/types/admin-bundle';

export const adminBundleKeys = {
  all: ['admin', 'bundle'] as const,
  list: () => [...adminBundleKeys.all, 'list'] as const,
  stats: (slug: string) => [...adminBundleKeys.all, 'stats', slug] as const,
};

export const adminBundleQueries = {
  list: () =>
    queryOptions<AdminBundleSummary[]>({
      queryKey: adminBundleKeys.list(),
      queryFn: () =>
        customInstance<AdminBundleSummary[]>({
          url: '/admin/api/v1/bundles',
          method: 'GET',
        }),
    }),

  stats: (slug: string) =>
    queryOptions<AdminBundleStats>({
      queryKey: adminBundleKeys.stats(slug),
      queryFn: () =>
        customInstance<AdminBundleStats>({
          url: `/admin/api/v1/bundles/${slug}/stats`,
          method: 'GET',
        }),
      staleTime: 0,
    }),
};

export const useAdminBundleList = () => useQuery(adminBundleQueries.list());

export const useAdminBundleStats = (slug: string) =>
  useQuery({
    ...adminBundleQueries.stats(slug),
    enabled: !!slug,
  });

export const useUpdateBundleStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: UpdateBundleStatusRequest }) =>
      customInstance<UpdateBundleStatusResponse>({
        url: `/admin/api/v1/bundles/${slug}/status`,
        method: 'PATCH',
        data,
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminBundleKeys.list() });
      void queryClient.invalidateQueries({ queryKey: adminBundleKeys.stats(variables.slug) });
    },
  });
};
```

- [ ] **Step 2: 타입 체크 확인**

Run: `npx tsc --noEmit --pretty 2>&1 | grep useAdminBundle || echo "OK"`
Expected: OK

- [ ] **Step 3: 커밋**

```bash
git add src/hooks/api/useAdminBundle.ts
git commit -m "feat(admin-bundle): React Query 훅 + API 호출 함수"
```

---

## Task 3: MSW Mock 데이터 + 핸들러

**Files:**

- Create: `src/mocks/data/adminBundles.ts`
- Modify: `src/mocks/handlers.ts`

- [ ] **Step 1: Mock 데이터 파일 생성**

기존 `mockBundleDetails`, `mockBundleElections`, `bundleVoteStats`를 활용하여 어드민 응답을 생성하는 함수.

```ts
// src/mocks/data/adminBundles.ts
import type {
  AdminBundleSummary,
  AdminBundleStats,
  AdminCompareLink,
  AdminQuestionStat,
  DailyStat,
} from '@/types/admin-bundle';

import { mockBundleDetails, mockBundleElections, bundleVoteStats } from './bundles';
import { compareLinkStore } from './compare';

/** 번들 목록 생성 — mockBundleDetails에서 파생 */
export function getAdminBundleList(): AdminBundleSummary[] {
  return Object.values(mockBundleDetails)
    .filter((b) => b.categoryCode) // 등급 테스트용(categoryCode 없음) 제외
    .map((b) => {
      // compareLinkStore에서 해당 번들의 링크 수 집계
      let compareLinkCount = 0;
      compareLinkStore.forEach((link) => {
        if (link.bundleSlug === b.slug) {
          compareLinkCount++;
        }
      });

      return {
        bundleId: b.bundleId,
        hotpickId: b.bundleId + 100, // TODO: BE 구현 시 실제 hotpickId로 교체
        slug: b.slug,
        title: b.title,
        category: b.category,
        categoryCode: b.categoryCode!,
        questionCount: b.questionCount,
        participantCount: b.participantCount,
        compareLinkCount,
        status: b.status as 'ACTIVE' | 'CLOSED',
        createdAt: '2026-03-15T09:00:00Z',
      };
    });
}

/** 일별 참여 통계 mock 생성 (최근 14일) */
function generateDailyStats(): DailyStat[] {
  const stats: DailyStat[] = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    stats.push({
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 80) + 10,
    });
  }
  return stats;
}

/** 번들 상세 통계 생성 */
export function getAdminBundleStats(slug: string): AdminBundleStats | null {
  const bundle = mockBundleDetails[slug];
  if (!bundle || !bundle.categoryCode) return null;

  const elections = mockBundleElections[slug] ?? [];

  // 비교 링크 집계
  const links: AdminCompareLink[] = [];
  compareLinkStore.forEach((link) => {
    if (link.bundleSlug === slug) {
      links.push({
        token: link.token,
        type: link.type,
        creatorNickname: link.creatorNickname,
        groupName: link.groupName,
        memberCount: link.memberCount,
        isClosed: link.isClosed,
        createdAt: '2026-04-05T14:30:00Z',
      });
    }
  });

  const oneToOneCount = links.filter((l) => l.type === 'ONE_TO_ONE').length;
  const groupCount = links.filter((l) => l.type === 'GROUP').length;
  const activeGroupCount = links.filter((l) => l.type === 'GROUP' && !l.isClosed).length;

  // 질문별 통계
  const seedRatios = [62, 45, 71, 38, 55];
  const questionStats: AdminQuestionStat[] = elections.map((e, i) => {
    const stats = bundleVoteStats.get(e.electionId) ?? { optionACount: 0, optionBCount: 0 };
    const total = stats.optionACount + stats.optionBCount;
    const aCount = total > 0 ? stats.optionACount : (seedRatios[i] ?? 50);
    const bCount = total > 0 ? stats.optionBCount : 100 - (seedRatios[i] ?? 50);
    const sum = aCount + bCount;
    return {
      electionId: e.electionId,
      title: e.title,
      optionA: e.optionA,
      optionB: e.optionB,
      optionACount: aCount,
      optionBCount: bCount,
      optionARate: sum > 0 ? Math.round((aCount / sum) * 1000) / 10 : 50,
      optionBRate: sum > 0 ? Math.round((bCount / sum) * 1000) / 10 : 50,
    };
  });

  return {
    bundleId: bundle.bundleId,
    slug: bundle.slug,
    title: bundle.title,
    hotpickId: bundle.bundleId + 100,
    categoryCode: bundle.categoryCode!,
    status: bundle.status as 'ACTIVE' | 'CLOSED',
    participation: {
      totalParticipants: bundle.participantCount,
      completionRate: 92.3,
      dailyStats: generateDailyStats(),
    },
    compareLinks: {
      totalCount: links.length,
      oneToOneCount,
      groupCount,
      activeGroupCount,
      links,
    },
    questionStats,
  };
}
```

- [ ] **Step 2: MSW 핸들러 추가**

`src/mocks/handlers.ts` 상단에 import 추가, 배열 안에 핸들러 3개 추가.

파일 상단 import에 추가:

```ts
import { getAdminBundleList, getAdminBundleStats } from '@/mocks/data/adminBundles';
```

핸들러 배열 안 (admin category 핸들러 근처)에 추가:

```ts
// ──────────────── Admin Bundle ────────────────

// GET /admin/api/v1/bundles
http.get(`${baseURL}/admin/api/v1/bundles`, () => {
  return HttpResponse.json(wrapResponse(getAdminBundleList()));
}),

// GET /admin/api/v1/bundles/:slug/stats
http.get(`${baseURL}/admin/api/v1/bundles/:slug/stats`, ({ params }) => {
  const slug = params.slug as string;
  const stats = getAdminBundleStats(slug);
  if (!stats) {
    return HttpResponse.json(
      { code: 'NOT_FOUND', message: '번들을 찾을 수 없습니다.', data: null },
      { status: 404 }
    );
  }
  return HttpResponse.json(wrapResponse(stats));
}),

// PATCH /admin/api/v1/bundles/:slug/status
http.patch(`${baseURL}/admin/api/v1/bundles/:slug/status`, async ({ params, request }) => {
  const slug = params.slug as string;
  const body = (await request.json()) as { status: 'ACTIVE' | 'CLOSED' };
  const bundle = mockBundleDetails[slug];
  if (!bundle) {
    return HttpResponse.json(
      { code: 'NOT_FOUND', message: '번들을 찾을 수 없습니다.', data: null },
      { status: 404 }
    );
  }
  // mock 데이터 상태 변경
  bundle.status = body.status;
  return HttpResponse.json(wrapResponse({ slug, status: body.status }));
}),
```

- [ ] **Step 3: 타입 체크 확인**

Run: `npx tsc --noEmit --pretty 2>&1 | grep -E "(adminBundles|handlers)" || echo "OK"`
Expected: OK

- [ ] **Step 4: 커밋**

```bash
git add src/mocks/data/adminBundles.ts src/mocks/handlers.ts
git commit -m "feat(admin-bundle): MSW mock 데이터 + 핸들러"
```

---

## Task 4: 번들 목록 페이지

**Files:**

- Create: `src/components/features/Admin/AdminBundleList/AdminBundleList.tsx`
- Create: `src/components/features/Admin/AdminBundleList/AdminBundleList.module.scss`
- Create: `src/app/admin/bundle/page.tsx`

- [ ] **Step 1: 목록 컴포넌트 생성**

```tsx
// src/components/features/Admin/AdminBundleList/AdminBundleList.tsx
'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/common/Button/Button';
import { useAdminBundleList } from '@/hooks/api/useAdminBundle';

import styles from './AdminBundleList.module.scss';

export default function AdminBundleList() {
  const router = useRouter();
  const { data: bundles, isLoading } = useAdminBundleList();

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
          <h1>번들 관리</h1>
          {bundles && bundles.length > 0 && (
            <span className={styles.totalCount}>총 {bundles.length}개</span>
          )}
        </div>
        <Button variant="outline" onClick={() => router.push('/admin/hotpick/create?type=BUNDLE')}>
          + 번들 생성
        </Button>
      </header>

      {bundles && bundles.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>slug</th>
                <th>제목</th>
                <th>카테고리</th>
                <th>질문 수</th>
                <th>참여자</th>
                <th>비교 링크</th>
                <th>상태</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {bundles.map((bundle) => (
                <tr key={bundle.bundleId}>
                  <td>
                    <code className={styles.slug}>{bundle.slug}</code>
                  </td>
                  <td>{bundle.title}</td>
                  <td>
                    <span className={styles.categoryBadge}>{bundle.categoryCode}</span>
                  </td>
                  <td>{bundle.questionCount}</td>
                  <td>{bundle.participantCount.toLocaleString()}</td>
                  <td>{bundle.compareLinkCount}</td>
                  <td>
                    <span
                      className={
                        bundle.status === 'ACTIVE' ? styles.statusActive : styles.statusClosed
                      }
                    >
                      {bundle.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.detailButton}
                        onClick={() => router.push(`/admin/bundle/${bundle.slug}`)}
                      >
                        상세 →
                      </button>
                      <button
                        type="button"
                        className={styles.editButton}
                        onClick={() => router.push(`/admin/hotpick/edit/${bundle.hotpickId}`)}
                      >
                        수정
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.empty}>
          <p>등록된 번들이 없습니다.</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 목록 스타일 생성**

```scss
// src/components/features/Admin/AdminBundleList/AdminBundleList.module.scss
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

    tr th {
      padding: 1rem;
      text-align: left;
      font-size: 0.875rem;
      font-weight: $font-weight-semibold;
      color: $text-secondary;
      white-space: nowrap;
    }
  }

  tbody tr {
    border-bottom: 1px solid $border-placeholder;
    transition: background-color 0.2s;

    &:hover {
      background-color: $bg-tertiary;
    }

    &:last-child {
      border-bottom: none;
    }

    td {
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      color: $text-secondary;
    }
  }
}

.slug {
  font-family: monospace;
  font-size: 0.8rem;
  color: $text-tertiary;
}

.categoryBadge {
  display: inline-block;
  background: $bg-tertiary;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  color: $text-secondary;
}

.statusActive {
  color: #4ade80;
  font-weight: $font-weight-semibold;
}

.statusClosed {
  color: $text-tertiary;
}

.actions {
  display: flex;
  gap: 8px;
}

.detailButton,
.editButton {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.detailButton {
  color: #dfff00;

  &:hover {
    background: rgba(223, 255, 0, 0.1);
  }
}

.editButton {
  color: $text-secondary;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: $bg-secondary;
  border-radius: 8px;

  p {
    font-size: 1.125rem;
    color: $text-tertiary;
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
    min-width: 800px;
  }
}
```

- [ ] **Step 3: 페이지 라우트 생성**

```tsx
// src/app/admin/bundle/page.tsx
import AdminBundleList from '@/components/features/Admin/AdminBundleList/AdminBundleList';

export default function AdminBundlePage() {
  return <AdminBundleList />;
}
```

- [ ] **Step 4: 브라우저에서 확인**

Run: `npm run dev` (이미 실행 중이면 생략)
Navigate: `http://localhost:3000/admin/bundle`
Expected: 번들 목록 테이블 (love-values, marriage-values)이 표시됨

- [ ] **Step 5: 커밋**

```bash
git add src/components/features/Admin/AdminBundleList/ src/app/admin/bundle/page.tsx
git commit -m "feat(admin-bundle): 번들 목록 페이지"
```

---

## Task 5: 대시보드 쉘 (헤더 + 탭 관리)

**Files:**

- Create: `src/components/features/Admin/AdminBundleDashboard/AdminBundleDashboard.tsx`
- Create: `src/components/features/Admin/AdminBundleDashboard/AdminBundleDashboard.module.scss`
- Create: `src/app/admin/bundle/[slug]/page.tsx`

- [ ] **Step 1: 대시보드 컴포넌트 생성**

```tsx
// src/components/features/Admin/AdminBundleDashboard/AdminBundleDashboard.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/common/Button/Button';
import { useAdminBundleStats, useUpdateBundleStatus } from '@/hooks/api/useAdminBundle';

import CompareLinksTab from './CompareLinksTab';
import ParticipationTab from './ParticipationTab';
import QuestionStatsTab from './QuestionStatsTab';
import styles from './AdminBundleDashboard.module.scss';

type TabKey = 'participation' | 'compareLinks' | 'questionStats';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'participation', label: '참여 현황' },
  { key: 'compareLinks', label: '비교 링크' },
  { key: 'questionStats', label: '질문별 통계' },
];

interface AdminBundleDashboardProps {
  slug: string;
}

export default function AdminBundleDashboard({ slug }: AdminBundleDashboardProps) {
  const router = useRouter();
  const { data: stats, isLoading } = useAdminBundleStats(slug);
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateBundleStatus();
  const [activeTab, setActiveTab] = useState<TabKey>('participation');

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>번들을 찾을 수 없습니다.</div>
      </div>
    );
  }

  const handleToggleStatus = () => {
    const newStatus = stats.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    updateStatus({ slug, data: { status: newStatus } });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => router.push('/admin/bundle')}
          >
            ← 번들 목록
          </button>
          <h1>{stats.title}</h1>
          <span className={styles.slug}>{stats.slug}</span>
        </div>
        <div className={styles.headerRight}>
          <span className={stats.status === 'ACTIVE' ? styles.statusActive : styles.statusClosed}>
            {stats.status}
          </span>
          <Button variant="outline" size="small" onClick={handleToggleStatus} disabled={isUpdating}>
            {stats.status === 'ACTIVE' ? 'CLOSED로 변경' : 'ACTIVE로 변경'}
          </Button>
          <Button
            variant="outline"
            size="small"
            onClick={() => router.push(`/admin/hotpick/edit/${stats.hotpickId}`)}
          >
            수정
          </Button>
        </div>
      </header>

      <nav className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className={styles.tabContent}>
        {activeTab === 'participation' && (
          <ParticipationTab
            participation={stats.participation}
            compareLinkCount={stats.compareLinks.totalCount}
          />
        )}
        {activeTab === 'compareLinks' && <CompareLinksTab compareLinks={stats.compareLinks} />}
        {activeTab === 'questionStats' && <QuestionStatsTab questionStats={stats.questionStats} />}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 대시보드 스타일 생성**

```scss
// src/components/features/Admin/AdminBundleDashboard/AdminBundleDashboard.module.scss
@use '@/styles/variables' as *;

.container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  font-size: 1.125rem;
  color: $text-tertiary;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 16px;
}

.headerLeft {
  display: flex;
  flex-direction: column;
  gap: 4px;

  h1 {
    font-size: 1.75rem;
    font-weight: $font-weight-bold;
    color: $white;
    margin: 0;
  }
}

.backButton {
  background: none;
  border: none;
  color: $text-tertiary;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0;
  text-align: left;

  &:hover {
    color: $white;
  }
}

.slug {
  font-family: monospace;
  font-size: 0.8rem;
  color: $text-tertiary;
}

.headerRight {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.statusActive {
  color: #4ade80;
  font-weight: $font-weight-semibold;
  font-size: 0.875rem;
}

.statusClosed {
  color: $text-tertiary;
  font-weight: $font-weight-semibold;
  font-size: 0.875rem;
}

.tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid $border-placeholder;
  margin-bottom: 1.5rem;
}

.tab {
  background: none;
  border: none;
  padding: 8px 16px;
  font-size: 0.875rem;
  color: $text-tertiary;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;

  &:hover {
    color: $text-secondary;
  }
}

.tabActive {
  color: #121212;
  background: #dfff00;
  border-radius: 4px 4px 0 0;
  font-weight: $font-weight-semibold;
  border-bottom-color: #dfff00;
}

.tabContent {
  min-height: 400px;
}

// ── 공통 탭 내부 스타일 ──

:global(.statCards) {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 1.5rem;
}

:global(.statCard) {
  background: $bg-tertiary;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

:global(.statValue) {
  font-size: 1.75rem;
  font-weight: $font-weight-bold;
  color: $white;
}

:global(.statLabel) {
  font-size: 0.75rem;
  color: $text-tertiary;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }

  .header {
    flex-direction: column;
  }

  .headerLeft h1 {
    font-size: 1.25rem;
  }

  :global(.statCards) {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: 페이지 라우트 생성**

```tsx
// src/app/admin/bundle/[slug]/page.tsx
import AdminBundleDashboard from '@/components/features/Admin/AdminBundleDashboard/AdminBundleDashboard';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminBundleDetailPage({ params }: Props) {
  const { slug } = await params;
  return <AdminBundleDashboard slug={slug} />;
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/components/features/Admin/AdminBundleDashboard/AdminBundleDashboard.tsx \
        src/components/features/Admin/AdminBundleDashboard/AdminBundleDashboard.module.scss \
        src/app/admin/bundle/[slug]/page.tsx
git commit -m "feat(admin-bundle): 대시보드 쉘 (헤더 + 탭 관리)"
```

---

## Task 6: 참여 현황 탭

**Files:**

- Create: `src/components/features/Admin/AdminBundleDashboard/ParticipationTab.tsx`

- [ ] **Step 1: 컴포넌트 생성**

```tsx
// src/components/features/Admin/AdminBundleDashboard/ParticipationTab.tsx
import type { DailyStat } from '@/types/admin-bundle';

import styles from './AdminBundleDashboard.module.scss';

interface ParticipationTabProps {
  participation: {
    totalParticipants: number;
    completionRate: number;
    dailyStats: DailyStat[];
  };
  compareLinkCount: number;
}

export default function ParticipationTab({
  participation,
  compareLinkCount,
}: ParticipationTabProps) {
  const maxCount = Math.max(...participation.dailyStats.map((d) => d.count), 1);

  return (
    <div>
      <div className="statCards">
        <div className="statCard">
          <div className="statValue">{participation.totalParticipants.toLocaleString()}</div>
          <div className="statLabel">총 참여자</div>
        </div>
        <div className="statCard">
          <div className="statValue">{participation.completionRate}%</div>
          <div className="statLabel">완료율</div>
        </div>
        <div className="statCard">
          <div className="statValue">{compareLinkCount}</div>
          <div className="statLabel">비교 링크</div>
        </div>
      </div>

      <div className={styles.chartSection}>
        <div className={styles.chartTitle}>일별 참여자 추이 (최근 14일)</div>
        <div className={styles.barChart}>
          {participation.dailyStats.map((stat) => (
            <div key={stat.date} className={styles.barWrapper}>
              <div
                className={styles.bar}
                style={{ height: `${(stat.count / maxCount) * 100}%` }}
                title={`${stat.date}: ${stat.count}명`}
              />
            </div>
          ))}
        </div>
        <div className={styles.chartXAxis}>
          <span>{participation.dailyStats[0]?.date.slice(5)}</span>
          <span>
            {participation.dailyStats[participation.dailyStats.length - 1]?.date.slice(5)}
          </span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 차트 스타일 추가**

`AdminBundleDashboard.module.scss` 하단에 추가:

```scss
// ── 참여 현황 차트 ──

.chartSection {
  background: $bg-secondary;
  padding: 20px;
  border-radius: 8px;
}

.chartTitle {
  font-size: 0.8rem;
  color: $text-tertiary;
  margin-bottom: 16px;
}

.barChart {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 120px;
}

.barWrapper {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: flex-end;
}

.bar {
  width: 100%;
  background: linear-gradient(to top, #ff00ff, #ff4500);
  border-radius: 3px 3px 0 0;
  min-height: 4px;
  transition: height 0.3s ease;
}

.chartXAxis {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  color: $text-tertiary;
  margin-top: 6px;
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/features/Admin/AdminBundleDashboard/ParticipationTab.tsx \
        src/components/features/Admin/AdminBundleDashboard/AdminBundleDashboard.module.scss
git commit -m "feat(admin-bundle): 참여 현황 탭"
```

---

## Task 7: 비교 링크 탭

**Files:**

- Create: `src/components/features/Admin/AdminBundleDashboard/CompareLinksTab.tsx`

- [ ] **Step 1: 컴포넌트 생성**

```tsx
// src/components/features/Admin/AdminBundleDashboard/CompareLinksTab.tsx
import type { AdminCompareLink } from '@/types/admin-bundle';

import styles from './AdminBundleDashboard.module.scss';

interface CompareLinksTabProps {
  compareLinks: {
    totalCount: number;
    oneToOneCount: number;
    groupCount: number;
    activeGroupCount: number;
    links: AdminCompareLink[];
  };
}

function getLinkStatus(link: AdminCompareLink): { label: string; className: string } {
  if (link.type === 'ONE_TO_ONE') {
    return link.memberCount >= 2
      ? { label: '완료', className: styles.statusCompleted }
      : { label: '대기', className: styles.statusWaiting };
  }
  return link.isClosed
    ? { label: '닫힘', className: styles.statusClosed }
    : { label: '활성', className: styles.statusActive };
}

export default function CompareLinksTab({ compareLinks }: CompareLinksTabProps) {
  return (
    <div>
      <div className="statCards">
        <div className="statCard">
          <div className="statValue">{compareLinks.oneToOneCount}</div>
          <div className="statLabel">1:1 링크</div>
        </div>
        <div className="statCard">
          <div className="statValue">{compareLinks.groupCount}</div>
          <div className="statLabel">그룹 링크</div>
        </div>
        <div className="statCard">
          <div className="statValue">{compareLinks.activeGroupCount}</div>
          <div className="statLabel">활성 그룹</div>
        </div>
      </div>

      {compareLinks.links.length > 0 ? (
        <div className={styles.linkTableWrapper}>
          <table className={styles.linkTable}>
            <thead>
              <tr>
                <th>타입</th>
                <th>그룹명/생성자</th>
                <th>멤버</th>
                <th>상태</th>
                <th>생성일</th>
                <th>토큰</th>
              </tr>
            </thead>
            <tbody>
              {compareLinks.links.map((link) => {
                const status = getLinkStatus(link);
                return (
                  <tr key={link.token}>
                    <td>
                      <span
                        className={link.type === 'GROUP' ? styles.typeGroup : styles.typeOneToOne}
                      >
                        {link.type === 'GROUP' ? 'GROUP' : '1:1'}
                      </span>
                    </td>
                    <td>
                      {link.groupName ? (
                        <>
                          {link.groupName}{' '}
                          <span className={styles.creator}>({link.creatorNickname})</span>
                        </>
                      ) : (
                        link.creatorNickname
                      )}
                    </td>
                    <td>{link.memberCount}</td>
                    <td>
                      <span className={status.className}>{status.label}</span>
                    </td>
                    <td className={styles.dateCell}>
                      {new Date(link.createdAt).toLocaleDateString('ko-KR', {
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </td>
                    <td>
                      <code className={styles.tokenCell}>{link.token.slice(0, 8)}</code>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.emptyTab}>비교 링크가 없습니다.</div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 비교 링크 테이블 스타일 추가**

`AdminBundleDashboard.module.scss` 하단에 추가:

```scss
// ── 비교 링크 테이블 ──

.linkTableWrapper {
  overflow-x: auto;
  background: $bg-secondary;
  border-radius: 8px;
}

.linkTable {
  width: 100%;
  border-collapse: collapse;

  thead {
    background: $bg-tertiary;
    border-bottom: 1px solid $border-placeholder;

    th {
      padding: 8px 12px;
      text-align: left;
      font-size: 0.75rem;
      font-weight: $font-weight-semibold;
      color: $text-secondary;
    }
  }

  tbody tr {
    border-bottom: 1px solid $border-placeholder;

    &:last-child {
      border-bottom: none;
    }

    td {
      padding: 8px 12px;
      font-size: 0.8rem;
      color: $text-secondary;
    }
  }
}

.typeGroup {
  display: inline-block;
  background: #1e3a5f;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.65rem;
  color: #93c5fd;
}

.typeOneToOne {
  display: inline-block;
  background: #3a1e5f;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.65rem;
  color: #c4b5fd;
}

.creator {
  color: $text-tertiary;
  font-size: 0.75rem;
}

.statusCompleted {
  color: #4ade80;
}

.statusWaiting {
  color: #fbbf24;
}

// statusActive, statusClosed 는 헤더에 이미 정의됨

.dateCell {
  color: $text-tertiary;
}

.tokenCell {
  font-family: monospace;
  font-size: 0.65rem;
  color: $text-tertiary;
}

.emptyTab {
  text-align: center;
  padding: 3rem;
  color: $text-tertiary;
  font-size: 0.9rem;
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/features/Admin/AdminBundleDashboard/CompareLinksTab.tsx \
        src/components/features/Admin/AdminBundleDashboard/AdminBundleDashboard.module.scss
git commit -m "feat(admin-bundle): 비교 링크 탭"
```

---

## Task 8: 질문별 통계 탭

**Files:**

- Create: `src/components/features/Admin/AdminBundleDashboard/QuestionStatsTab.tsx`

- [ ] **Step 1: 컴포넌트 생성**

```tsx
// src/components/features/Admin/AdminBundleDashboard/QuestionStatsTab.tsx
import type { AdminQuestionStat } from '@/types/admin-bundle';

import styles from './AdminBundleDashboard.module.scss';

interface QuestionStatsTabProps {
  questionStats: AdminQuestionStat[];
}

export default function QuestionStatsTab({ questionStats }: QuestionStatsTabProps) {
  return (
    <div className={styles.questionList}>
      {questionStats.map((q, index) => {
        const isAWinning = q.optionARate > q.optionBRate;
        return (
          <div key={q.electionId} className={styles.questionCard}>
            <div className={styles.questionTitle}>
              <strong>Q{index + 1}.</strong> {q.title}
            </div>
            <div className={styles.optionRow}>
              <span className={styles.optionLabel}>{q.optionA}</span>
              <div className={styles.barTrack}>
                <div
                  className={`${styles.barFill} ${isAWinning ? styles.barWinning : ''}`}
                  style={{ width: `${q.optionARate}%` }}
                >
                  <span className={styles.barPercent}>{q.optionARate}%</span>
                </div>
              </div>
              <span className={styles.optionCount}>{q.optionACount}명</span>
            </div>
            <div className={styles.optionRow}>
              <span className={styles.optionLabel}>{q.optionB}</span>
              <div className={styles.barTrack}>
                <div
                  className={`${styles.barFill} ${!isAWinning ? styles.barWinning : ''}`}
                  style={{ width: `${q.optionBRate}%` }}
                >
                  <span className={styles.barPercent}>{q.optionBRate}%</span>
                </div>
              </div>
              <span className={styles.optionCount}>{q.optionBCount}명</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: 질문 통계 스타일 추가**

`AdminBundleDashboard.module.scss` 하단에 추가:

```scss
// ── 질문별 통계 ──

.questionList {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.questionCard {
  background: $bg-secondary;
  padding: 16px;
  border-radius: 8px;
}

.questionTitle {
  font-size: 0.875rem;
  color: $white;
  margin-bottom: 12px;
}

.optionRow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;

  &:last-child {
    margin-bottom: 0;
  }
}

.optionLabel {
  font-size: 0.8rem;
  color: $text-secondary;
  min-width: 80px;
  flex-shrink: 0;
}

.barTrack {
  flex: 1;
  height: 24px;
  background: #1a1a1a;
  border-radius: 4px;
  overflow: hidden;
}

.barFill {
  height: 100%;
  background: #444;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding-left: 8px;
  transition: width 0.3s ease;
}

.barWinning {
  background: linear-gradient(to right, #ff00ff, #ff4500);
}

.barPercent {
  font-size: 0.7rem;
  font-weight: $font-weight-semibold;
  color: $white;
  white-space: nowrap;
}

.optionCount {
  font-size: 0.7rem;
  color: $text-tertiary;
  min-width: 40px;
  text-align: right;
  flex-shrink: 0;
}
```

- [ ] **Step 3: 브라우저에서 전체 대시보드 확인**

Navigate: `http://localhost:3000/admin/bundle/love-values`
Expected:

- 헤더: "연애 가치관 테스트", slug, ACTIVE 상태, 상태 변경/수정 버튼
- 참여 현황 탭: 요약 카드 3개 + 일별 바 차트
- 비교 링크 탭: 요약 카드 + 링크 테이블
- 질문별 통계 탭: 5개 질문 카드 with A/B 바 차트

- [ ] **Step 4: 커밋**

```bash
git add src/components/features/Admin/AdminBundleDashboard/QuestionStatsTab.tsx \
        src/components/features/Admin/AdminBundleDashboard/AdminBundleDashboard.module.scss
git commit -m "feat(admin-bundle): 질문별 통계 탭"
```

---

## Task 9: 최종 검증 + 정리

- [ ] **Step 1: 타입 체크**

Run: `npx tsc --noEmit --pretty`
Expected: 에러 없음

- [ ] **Step 2: 린트 체크**

Run: `npx next lint`
Expected: 에러 없음 (경고는 허용)

- [ ] **Step 3: 빌드 확인**

Run: `npx next build`
Expected: 빌드 성공

- [ ] **Step 4: 전체 플로우 브라우저 테스트**

1. `http://localhost:3000/admin/bundle` → 목록 테이블 표시
2. "상세 →" 클릭 → `/admin/bundle/love-values` 대시보드
3. 3개 탭 전환 확인
4. "CLOSED로 변경" 버튼 클릭 → 상태 변경
5. "← 번들 목록" 클릭 → 목록 복귀
6. "번들 생성" 클릭 → `/admin/hotpick/create?type=BUNDLE` 이동
7. "수정" 클릭 → `/admin/hotpick/edit/{hotpickId}` 이동

- [ ] **Step 5: 최종 커밋 (필요 시)**

누락된 파일이 있으면 추가 커밋.
