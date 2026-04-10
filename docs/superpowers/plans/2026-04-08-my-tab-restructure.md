# 마이페이지 구조 개편 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 메인 My 탭에 [투표][비교][댓글][좋아요] 하위 4탭을 추가하고, 마이페이지(/my)를 설정 전용으로 축소한다.

**Architecture:** 메인 My 탭(`MainViewClient`)에 하위 탭 상태를 추가하고, 탭별로 기존 콘텐츠(투표), 신규 콘텐츠(비교 아코디언), 이동 콘텐츠(댓글/좋아요)를 렌더링한다. 마이페이지에서는 댓글/좋아요 탭과 리스트를 제거한다.

**Tech Stack:** Next.js 14+ App Router, TypeScript, SCSS Modules, TanStack Query v5, MSW

**스펙:** `docs/superpowers/specs/2026-04-08-my-tab-restructure-design.md`

---

## File Structure

### 신규 파일

| 파일                                                                   | 책임                                             |
| ---------------------------------------------------------------------- | ------------------------------------------------ |
| `src/components/features/Main/MySubTabs/MySubTabs.tsx`                 | My 하위 탭 UI ([투표][비교][댓글][좋아요])       |
| `src/components/features/Main/MySubTabs/MySubTabs.module.scss`         | 하위 탭 스타일                                   |
| `src/components/features/Main/MyBundleList/MyBundleList.tsx`           | 비교 탭 — 번들 아코디언 리스트                   |
| `src/components/features/Main/MyBundleList/MyBundleList.module.scss`   | 번들 아코디언 스타일                             |
| `src/components/features/Main/MyBundleList/BundleAccordion.tsx`        | 개별 번들 아코디언 (펼침/접힘 + 비교 링크 목록)  |
| `src/components/features/Main/MyLoginPrompt/MyLoginPrompt.tsx`         | 비로그인 유도 화면 (탭별 맞춤 문구)              |
| `src/components/features/Main/MyLoginPrompt/MyLoginPrompt.module.scss` | 로그인 유도 스타일                               |
| `src/hooks/api/useMyCompareLinks.ts`                                   | `GET /api/v1/bundles/{slug}/my-compare-links` 훅 |
| `src/types/my-compare.ts`                                              | 내 비교 링크 타입 정의                           |
| `docs/api/my-compare-links-api-spec.md`                                | 신규 API 문서                                    |

### 수정 파일

| 파일                                                    | 변경 내용                                  |
| ------------------------------------------------------- | ------------------------------------------ |
| `src/components/features/Main/MainViewClient.tsx`       | My 탭 선택 시 하위 탭 + 탭별 콘텐츠 렌더링 |
| `src/constants/contentTab.ts`                           | `MySubTabType` 타입 추가                   |
| `src/components/features/MyPage/MyPageView.tsx`         | 댓글/좋아요 탭 + 리스트 제거               |
| `src/components/features/MyPage/MyPageView.module.scss` | 탭/리스트 관련 스타일 제거                 |
| `src/mocks/handlers.ts`                                 | `my-compare-links` MSW 핸들러 추가         |
| `src/mocks/data/compare.ts`                             | `getMyCompareLinks` 함수 추가              |

---

## Task 1: 타입 & 상수 정의

**Files:**

- Modify: `src/constants/contentTab.ts`
- Create: `src/types/my-compare.ts`

- [ ] **Step 1: contentTab.ts에 MySubTabType 추가**

`src/constants/contentTab.ts` 파일 하단에 추가:

```typescript
/** My 탭 하위 탭 */
export type MySubTabType = 'vote' | 'compare' | 'comments' | 'likes';

export const MY_SUB_TABS: Array<{ type: MySubTabType; label: string }> = [
  { type: 'vote', label: '투표' },
  { type: 'compare', label: '비교' },
  { type: 'comments', label: '댓글' },
  { type: 'likes', label: '좋아요' },
];

/** 로그인 유저 기본 하위 탭 */
export const DEFAULT_MY_SUB_TAB_LOGGED_IN: MySubTabType = 'compare';
/** 비로그인 유저 기본 하위 탭 */
export const DEFAULT_MY_SUB_TAB_GUEST: MySubTabType = 'vote';
```

- [ ] **Step 2: my-compare.ts 타입 정의**

`src/types/my-compare.ts` 신규 생성:

```typescript
/** 내 비교 링크 (GET /api/v1/bundles/{slug}/my-compare-links 응답) */
export interface MyCompareLink {
  token: string;
  type: 'ONE_TO_ONE' | 'GROUP';
  status: 'WAITING' | 'COMPLETED';
  createdAt: string;
  /** 1:1 전용: 참여자 닉네임 (대기 중이면 null) */
  participantNickname: string | null;
  /** 그룹 전용: 그룹 이름 */
  groupName: string | null;
  /** 그룹 전용: 현재 멤버 수 */
  memberCount: number;
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/constants/contentTab.ts src/types/my-compare.ts
git commit -m "feat: My 하위 탭 타입 + 비교 링크 타입 정의"
```

---

## Task 2: MSW + API 훅

**Files:**

- Create: `src/hooks/api/useMyCompareLinks.ts`
- Modify: `src/mocks/data/compare.ts`
- Modify: `src/mocks/handlers.ts`

- [ ] **Step 1: compare.ts에 getMyCompareLinks 함수 추가**

`src/mocks/data/compare.ts`에서 `compareLinkStore`를 활용하여 특정 유저의 특정 번들에 대한 비교 링크를 반환하는 함수를 추가. 파일 하단, `export` 함수들 근처에 추가:

```typescript
/** 내 비교 링크 목록 조회 (특정 번들) */
export function getMyCompareLinks(
  slug: string,
  userId: string
): Array<{
  token: string;
  type: 'ONE_TO_ONE' | 'GROUP';
  status: 'WAITING' | 'COMPLETED';
  createdAt: string;
  participantNickname: string | null;
  groupName: string | null;
  memberCount: number;
}> {
  const links: Array<{
    token: string;
    type: 'ONE_TO_ONE' | 'GROUP';
    status: 'WAITING' | 'COMPLETED';
    createdAt: string;
    participantNickname: string | null;
    groupName: string | null;
    memberCount: number;
  }> = [];

  for (const [, link] of compareLinkStore) {
    if (link.bundleSlug !== slug) continue;
    // 내가 생성자이거나 참여자인 링크
    const isMyLink =
      link.creatorUserId === userId ||
      link.participantUserId === userId ||
      link.groupMembers.some((m) => m.userId === userId);
    if (!isMyLink) continue;

    links.push({
      token: link.token,
      type: link.type,
      status: link.status === 'CLOSED' ? 'COMPLETED' : link.status,
      createdAt: new Date().toISOString(), // mock
      participantNickname: link.participantNickname,
      groupName: link.groupName,
      memberCount: link.groupMembers.length,
    });
  }

  return links;
}
```

- [ ] **Step 2: MSW 핸들러 추가**

`src/mocks/handlers.ts`에서 `getMyCompareLinks`를 import하고 핸들러 추가. elections 핸들러 근처에 추가:

```typescript
/** GET /api/v1/bundles/{slug}/my-compare-links — 내 비교 링크 목록 */
http.get(`${baseURL}/api/v1/bundles/:slug/my-compare-links`, ({ params }) => {
  const slug = params.slug as string;
  const links = getMyCompareLinks(slug, 'mock-user-1');
  return HttpResponse.json({ code: 'SUCCESS', message: '성공', data: links });
}),
```

import에 `getMyCompareLinks` 추가:

```typescript
import {
  // ... 기존 imports
  getMyCompareLinks,
} from '@/mocks/data/compare';
```

- [ ] **Step 3: API 훅 생성**

`src/hooks/api/useMyCompareLinks.ts` 신규 생성:

```typescript
import { useQuery } from '@tanstack/react-query';

import { customInstance } from '@/lib/axios-mutator';
import type { MyCompareLink } from '@/types/my-compare';

export const useMyCompareLinks = (slug: string) =>
  useQuery({
    queryKey: ['myCompareLinks', slug],
    queryFn: () =>
      customInstance<MyCompareLink[]>({
        url: `/api/v1/bundles/${slug}/my-compare-links`,
        method: 'GET',
      }),
    enabled: !!slug,
    staleTime: 30 * 1000,
  });
```

- [ ] **Step 4: 타입 체크**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: 커밋**

```bash
git add src/mocks/data/compare.ts src/mocks/handlers.ts src/hooks/api/useMyCompareLinks.ts
git commit -m "feat: 내 비교 링크 API 훅 + MSW 핸들러"
```

---

## Task 3: 로그인 유도 컴포넌트

**Files:**

- Create: `src/components/features/Main/MyLoginPrompt/MyLoginPrompt.tsx`
- Create: `src/components/features/Main/MyLoginPrompt/MyLoginPrompt.module.scss`

- [ ] **Step 1: MyLoginPrompt 컴포넌트 생성**

`src/components/features/Main/MyLoginPrompt/MyLoginPrompt.tsx`:

```typescript
'use client';

import type { FC } from 'react';

import styles from '@/components/features/Main/MyLoginPrompt/MyLoginPrompt.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import type { MySubTabType } from '@/constants/contentTab';

const PROMPTS: Record<Exclude<MySubTabType, 'vote'>, string> = {
  compare: '로그인하면 비교 기록을 볼 수 있어요',
  comments: '로그인하면 내 댓글을 볼 수 있어요',
  likes: '로그인하면 좋아요한 핫픽을 볼 수 있어요',
};

interface MyLoginPromptProps {
  tab: Exclude<MySubTabType, 'vote'>;
}

export const MyLoginPrompt: FC<MyLoginPromptProps> = ({ tab }) => {
  const { requireLogin } = useAuth();

  return (
    <div className={styles.container}>
      <p className={styles.message}>{PROMPTS[tab]}</p>
      <button
        type="button"
        className={styles.loginButton}
        onClick={() => requireLogin('default')}
      >
        로그인하기
      </button>
    </div>
  );
};
```

- [ ] **Step 2: SCSS 생성**

`src/components/features/Main/MyLoginPrompt/MyLoginPrompt.module.scss`:

```scss
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;

.container {
  @include flex-column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px $spacing-16;
}

.message {
  font-size: $font-size-14;
  color: $text-tertiary;
  text-align: center;
}

.loginButton {
  padding: 10px 24px;
  border: 1px solid rgba(#fff, 0.1);
  border-radius: $border-rounded;
  background: rgba(#fff, 0.04);
  color: $text-secondary;
  font-size: $font-size-14;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: rgba(#fff, 0.08);
  }
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/features/Main/MyLoginPrompt/
git commit -m "feat: My 탭 비로그인 로그인 유도 컴포넌트"
```

---

## Task 4: My 하위 탭 UI

**Files:**

- Create: `src/components/features/Main/MySubTabs/MySubTabs.tsx`
- Create: `src/components/features/Main/MySubTabs/MySubTabs.module.scss`

- [ ] **Step 1: MySubTabs 컴포넌트 생성**

`src/components/features/Main/MySubTabs/MySubTabs.tsx`:

```typescript
'use client';

import type { FC } from 'react';

import styles from '@/components/features/Main/MySubTabs/MySubTabs.module.scss';
import { MY_SUB_TABS, type MySubTabType } from '@/constants/contentTab';

interface MySubTabsProps {
  activeTab: MySubTabType;
  onChange: (tab: MySubTabType) => void;
}

export const MySubTabs: FC<MySubTabsProps> = ({ activeTab, onChange }) => (
  <div className={styles.container}>
    {MY_SUB_TABS.map((tab) => (
      <button
        key={tab.type}
        type="button"
        className={`${styles.tab} ${activeTab === tab.type ? styles.active : ''}`}
        onClick={() => onChange(tab.type)}
      >
        {tab.label}
      </button>
    ))}
  </div>
);
```

- [ ] **Step 2: SCSS 생성**

`src/components/features/Main/MySubTabs/MySubTabs.module.scss` — 기존 MyPageView의 탭 스타일과 유사하되 메인 피드에 맞게 조정:

```scss
@use '@/styles/variables' as *;

.container {
  display: flex;
  gap: 0;
  padding: 0 $spacing-16;
  border-bottom: 1px solid rgba(#fff, 0.06);
}

.tab {
  flex: 1;
  padding: 12px 0;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: $text-tertiary;
  font-size: $font-size-14;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  transition:
    color 0.15s,
    border-color 0.15s;
}

.active {
  color: $white;
  border-bottom-color: $primary-start;
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/features/Main/MySubTabs/
git commit -m "feat: My 하위 탭 UI 컴포넌트"
```

---

## Task 5: 번들 아코디언 (비교 탭 핵심)

**Files:**

- Create: `src/components/features/Main/MyBundleList/MyBundleList.tsx`
- Create: `src/components/features/Main/MyBundleList/BundleAccordion.tsx`
- Create: `src/components/features/Main/MyBundleList/MyBundleList.module.scss`

- [ ] **Step 1: MyBundleList.module.scss 생성**

`src/components/features/Main/MyBundleList/MyBundleList.module.scss`:

```scss
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;

.container {
  @include flex-column;
  gap: 8px;
  padding: $spacing-16;
}

.emptyState {
  @include flex-column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px $spacing-16;
  color: $text-tertiary;
  font-size: $font-size-14;
  text-align: center;
}

// ─── 아코디언 ───
.accordion {
  background: rgba(#fff, 0.03);
  border-radius: 14px;
  border: 1px solid rgba(#fff, 0.06);
  overflow: hidden;
  transition: border-color 0.3s ease;
}

.accordionOpen {
  border-color: rgba(#fff, 0.12);
}

.accordionHeader {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 16px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
}

.accordionTitle {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: $white;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.accordionCount {
  font-size: $font-size-12;
  color: $text-tertiary;
  flex-shrink: 0;
}

.accordionArrow {
  font-size: $font-size-14;
  color: #555;
  flex-shrink: 0;
  transition: transform 0.3s ease;
  transform: rotate(0deg);
}

.accordionArrowOpen {
  transform: rotate(90deg);
}

// ─── 펼침 콘텐츠 ───
.accordionContent {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition:
    max-height 0.35s ease,
    opacity 0.3s ease;
}

.accordionContentOpen {
  max-height: 1000px;
  opacity: 1;
}

.linkList {
  @include flex-column;
  gap: 0;
  padding: 0 16px 12px;
}

.linkItem {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(#fff, 0.04);

  &:last-child {
    border-bottom: none;
  }
}

.linkType {
  font-size: 11px;
  font-weight: 600;
  color: $text-tertiary;
  width: 28px;
  flex-shrink: 0;
}

.linkInfo {
  flex: 1;
  min-width: 0;
}

.linkName {
  font-size: $font-size-14;
  color: $white;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.linkStatus {
  font-size: $font-size-12;
  color: $text-tertiary;
}

.linkStatusWaiting {
  color: $attention;
}

.linkAction {
  flex-shrink: 0;
  padding: 6px 12px;
  border: 1px solid rgba(#fff, 0.1);
  border-radius: $border-rounded;
  background: rgba(#fff, 0.04);
  color: $text-secondary;
  font-size: $font-size-12;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: rgba(#fff, 0.08);
  }
}

.newCompareButton {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 12px;
  margin-top: 4px;
  border: 1px dashed rgba(#fff, 0.1);
  border-radius: $border-radius-md;
  background: none;
  color: $text-tertiary;
  font-size: 13px;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;

  &:hover {
    background: rgba(#fff, 0.04);
    color: $text-secondary;
  }
}
```

- [ ] **Step 2: BundleAccordion 컴포넌트 생성**

`src/components/features/Main/MyBundleList/BundleAccordion.tsx`:

```typescript
'use client';

import { useState, type FC } from 'react';

import { useRouter } from 'next/navigation';

import styles from '@/components/features/Main/MyBundleList/MyBundleList.module.scss';
import { useMyCompareLinks } from '@/hooks/api/useMyCompareLinks';
import { useToast } from '@/hooks/useToast';
import type { MyCompareLink } from '@/types/my-compare';

interface BundleAccordionProps {
  slug: string;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  onNewCompare: () => void;
}

/** 비교 링크 정렬: 대기 → 완료, 각 그룹 내 최신순 */
function sortLinks(links: MyCompareLink[]): MyCompareLink[] {
  return [...links].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'WAITING' ? -1 : 1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export const BundleAccordion: FC<BundleAccordionProps> = ({
  slug,
  title,
  isOpen,
  onToggle,
  onNewCompare,
}) => {
  const { data: links } = useMyCompareLinks(slug);
  const router = useRouter();
  const { showToast } = useToast();
  const sorted = links ? sortLinks(links) : [];

  const handleAction = async (link: MyCompareLink) => {
    if (link.status === 'WAITING') {
      const url =
        link.type === 'GROUP'
          ? `${window.location.origin}/compare/group/${link.token}`
          : `${window.location.origin}/compare/${link.token}`;
      try {
        await navigator.clipboard.writeText(url);
        showToast('링크가 복사되었어요');
      } catch {
        showToast('복사에 실패했습니다');
      }
      return;
    }
    if (link.type === 'GROUP') {
      router.push(`/compare/group/${link.token}`);
    } else {
      router.push(`/compare/match/${link.token}`);
    }
  };

  const getLinkLabel = (link: MyCompareLink) => {
    if (link.type === 'ONE_TO_ONE') {
      return link.participantNickname ? `vs ${link.participantNickname}` : 'vs ???';
    }
    return `${link.groupName ?? '그룹'} (${link.memberCount}명)`;
  };

  return (
    <div className={`${styles.accordion} ${isOpen ? styles.accordionOpen : ''}`}>
      <button type="button" className={styles.accordionHeader} onClick={onToggle}>
        <span className={styles.accordionTitle}>{title}</span>
        <span className={styles.accordionCount}>{sorted.length}건</span>
        <span className={`${styles.accordionArrow} ${isOpen ? styles.accordionArrowOpen : ''}`}>
          ›
        </span>
      </button>

      <div className={`${styles.accordionContent} ${isOpen ? styles.accordionContentOpen : ''}`}>
        <div className={styles.linkList}>
          {sorted.map((link) => (
            <div key={link.token} className={styles.linkItem}>
              <span className={styles.linkType}>
                {link.type === 'ONE_TO_ONE' ? '1:1' : '그룹'}
              </span>
              <div className={styles.linkInfo}>
                <span className={styles.linkName}>{getLinkLabel(link)}</span>
              </div>
              <span
                className={`${styles.linkStatus} ${link.status === 'WAITING' ? styles.linkStatusWaiting : ''}`}
              >
                {link.status === 'WAITING' ? '대기' : '완료'}
              </span>
              <button
                type="button"
                className={styles.linkAction}
                onClick={() => handleAction(link)}
              >
                {link.status === 'WAITING' ? '링크 복사' : '결과 보기'}
              </button>
            </div>
          ))}
          <button type="button" className={styles.newCompareButton} onClick={onNewCompare}>
            + 새 비교 만들기
          </button>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: MyBundleList 컴포넌트 생성**

`src/components/features/Main/MyBundleList/MyBundleList.tsx`:

```typescript
'use client';

import { useState, type FC } from 'react';

import { Toast } from '@/components/common/Toast/Toast';
import { CreateCompareLink } from '@/components/features/Bundle/BundleResult/CreateCompareLink';
import { CreateGroupLink } from '@/components/features/Bundle/BundleResult/CreateGroupLink';
import { BundleAccordion } from '@/components/features/Main/MyBundleList/BundleAccordion';
import styles from '@/components/features/Main/MyBundleList/MyBundleList.module.scss';
import { useToast } from '@/hooks/useToast';
import type { BundleDetail } from '@/types/bundle';

interface MyBundleListProps {
  bundles: BundleDetail[];
}

export const MyBundleList: FC<MyBundleListProps> = ({ bundles }) => {
  const [openSlug, setOpenSlug] = useState<string | null>(bundles[0]?.slug ?? null);
  const [compareSlug, setCompareSlug] = useState<string | null>(null);
  const [groupSlug, setGroupSlug] = useState<string | null>(null);
  const { toast } = useToast();

  if (bundles.length === 0) {
    return (
      <div className={styles.emptyState}>
        아직 참여한 테스트가 없어요
      </div>
    );
  }

  // TODO: 번들 목록 API 추가 시 최근 활동순 정렬 적용
  return (
    <div className={styles.container}>
      {bundles.map((bundle) => (
        <BundleAccordion
          key={bundle.slug}
          slug={bundle.slug}
          title={bundle.title}
          isOpen={openSlug === bundle.slug}
          onToggle={() => setOpenSlug((prev) => (prev === bundle.slug ? null : bundle.slug))}
          onNewCompare={() => {
            // TODO: 1:1/그룹 선택 UI — 우선 1:1 모달 표시
            setCompareSlug(bundle.slug);
          }}
        />
      ))}

      {compareSlug && (
        <CreateCompareLink
          slug={compareSlug}
          bundleTitle={bundles.find((b) => b.slug === compareSlug)?.title}
          onClose={() => setCompareSlug(null)}
        />
      )}
      {groupSlug && (
        <CreateGroupLink
          slug={groupSlug}
          bundleTitle={bundles.find((b) => b.slug === groupSlug)?.title}
          onClose={() => setGroupSlug(null)}
        />
      )}
      <Toast message={toast.message} isVisible={toast.isVisible} />
    </div>
  );
};
```

- [ ] **Step 4: 타입 체크**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: 커밋**

```bash
git add src/components/features/Main/MyBundleList/
git commit -m "feat: 비교 탭 번들 아코디언 UI"
```

---

## Task 6: MainViewClient에 My 하위 탭 통합

**Files:**

- Modify: `src/components/features/Main/MainViewClient.tsx`

- [ ] **Step 1: import 추가**

`MainViewClient.tsx` 상단 import에 추가:

```typescript
import { MyBundleList } from '@/components/features/Main/MyBundleList/MyBundleList';
import { MyLoginPrompt } from '@/components/features/Main/MyLoginPrompt/MyLoginPrompt';
import { MySubTabs } from '@/components/features/Main/MySubTabs/MySubTabs';
import MyCommentList from '@/components/features/MyPage/MyCommentList';
import LikedHotpickList from '@/components/features/MyPage/LikedHotpickList';
import {
  DEFAULT_MY_SUB_TAB_GUEST,
  DEFAULT_MY_SUB_TAB_LOGGED_IN,
  type MySubTabType,
} from '@/constants/contentTab';
import { useAuth } from '@/contexts/AuthContext';
```

- [ ] **Step 2: 상태 추가**

컴포넌트 내부 상태에 추가 (기존 `topPeriod` state 근처):

```typescript
const { isLoggedIn } = useAuth();
const [mySubTab, setMySubTab] = useState<MySubTabType>(
  isLoggedIn ? DEFAULT_MY_SUB_TAB_LOGGED_IN : DEFAULT_MY_SUB_TAB_GUEST
);
```

`isMyTab` 변수 추가 (기존 `isTopTab` 근처):

```typescript
const isMyTab = selectedTab.kind === 'filter' && selectedTab.type === 'my';
```

- [ ] **Step 3: 렌더링 분기 추가**

기존 렌더 영역에서, `isTopTab` 분기와 CardList 사이에 `isMyTab` 분기를 추가.

기존 코드 (대략적 구조):

```tsx
{isTopTab ? (
  <TopRankingList ... />
) : (
  <CardList ... />
)}
```

변경:

```tsx
{isTopTab ? (
  <TopRankingList ... />
) : isMyTab ? (
  <>
    <MySubTabs activeTab={mySubTab} onChange={setMySubTab} />
    {mySubTab === 'vote' && <CardList ... />}
    {mySubTab === 'compare' && (
      isLoggedIn ? (
        <MyBundleList bundles={[]} /> {/* TODO: 번들 목록 API 연동 시 교체 */}
      ) : (
        <MyLoginPrompt tab="compare" />
      )
    )}
    {mySubTab === 'comments' && (
      isLoggedIn ? <MyCommentList /> : <MyLoginPrompt tab="comments" />
    )}
    {mySubTab === 'likes' && (
      isLoggedIn ? <LikedHotpickList /> : <MyLoginPrompt tab="likes" />
    )}
  </>
) : (
  <CardList ... />
)}
```

참고: 투표(vote) 탭에서는 기존 `CardList`를 그대로 렌더링. 투표 탭은 비로그인도 접근 가능하므로 로그인 체크 불필요 (기존 동작 유지).

- [ ] **Step 4: 타입 체크**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: 커밋**

```bash
git add src/components/features/Main/MainViewClient.tsx
git commit -m "feat: MainViewClient에 My 하위 탭 통합"
```

---

## Task 7: 마이페이지 댓글/좋아요 제거

**Files:**

- Modify: `src/components/features/MyPage/MyPageView.tsx`
- Modify: `src/components/features/MyPage/MyPageView.module.scss`

- [ ] **Step 1: MyPageView에서 탭/리스트 코드 제거**

`MyPageView.tsx`에서 제거할 항목:

1. `useState<Tab>('comments')` state 제거
2. `type Tab = 'comments' | 'likes'` import/정의 제거
3. `MyCommentList`, `LikedHotpickList` import 제거
4. `CardListSkeleton` import 제거 (프로필 스켈레톤만 유지)
5. 탭 버튼 JSX 제거 (`.tabs` div 전체)
6. 탭 콘텐츠 조건부 렌더링 제거 (`activeTab === 'comments' ? ...`)
7. 탭과 콘텐츠 사이 구분선 제거

남는 구조:

```tsx
<div className={styles.container}>
  <button className={styles.backButton}>...</button>
  <div className={styles.profileSection}>...</div>
  <div className={styles.actionButtons}>...</div>
  <div className={styles.divider} />
  <div className={styles.accountSection}>...</div>
  {/* 모달들 */}
</div>
```

- [ ] **Step 2: SCSS에서 탭/리스트 스타일 제거**

`MyPageView.module.scss`에서 제거:

- `.tabs` 클래스
- `.tab` 클래스 (`.active` 포함)
- `.listContainer` 클래스
- `.card`, `.cardTitle`, `.cardSub`, `.cardDate` 클래스
- `.emptyState` 클래스
- `.loadMoreButton` 클래스

유지:

- `.container`, `.backButton`, `.profileSection`, `.profileName`, `.profileSuffix`
- `.actionButtons`, `.actionButton`
- `.divider`, `.accountSection`, `.logoutButton`, `.withdrawButton`

- [ ] **Step 3: 스켈레톤 업데이트**

`MyPageView.tsx`의 로딩 상태(`!user`)에서 탭 스켈레톤과 `CardListSkeleton`을 제거. 프로필 스켈레톤만 남김.

- [ ] **Step 4: 타입 체크**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: 커밋**

```bash
git add src/components/features/MyPage/MyPageView.tsx src/components/features/MyPage/MyPageView.module.scss
git commit -m "refactor: 마이페이지 댓글/좋아요 제거 — 설정 전용으로 축소"
```

---

## Task 8: API 문서 작성

**Files:**

- Create: `docs/api/my-compare-links-api-spec.md`

- [ ] **Step 1: API 문서 작성**

`docs/api/my-compare-links-api-spec.md`:

```markdown
# 내 비교 링크 목록 API

> 작성일: 2026-04-08
> 상태: BE 구현 요청
> 관련 스펙: docs/superpowers/specs/2026-04-08-my-tab-restructure-design.md

---

## GET /api/v1/bundles/{slug}/my-compare-links

| 항목      | 내용                                         |
| --------- | -------------------------------------------- |
| Method    | GET                                          |
| URL       | /api/v1/bundles/{slug}/my-compare-links      |
| 인증      | 로그인 필수                                  |
| 호출 시점 | 메인 My 탭 → 비교 탭 → 번들 아코디언 펼침 시 |
| 캐싱      | FE에서 staleTime 30초                        |

**Response data:**

\`\`\`typescript
Array<{
token: string;
type: 'ONE_TO_ONE' | 'GROUP';
status: 'WAITING' | 'COMPLETED';
createdAt: string; // ISO 8601
participantNickname: string | null; // 1:1 전용
groupName: string | null; // 그룹 전용
memberCount: number; // 그룹 전용
}>
\`\`\`

**참고:**

- 현재 로그인 유저가 생성자이거나 참여자인 비교 링크만 반환
- 페이지네이션 불필요 (한 유저가 한 번들에 수백 개 링크를 만들 일 없음)
- FE에서 상태별 정렬 (대기 → 완료, 최신순)

**FE 하드코딩 위치 (이 API로 대체 예정):**

- 현재 MSW mock으로 동작 중 (`src/mocks/handlers.ts`, `src/mocks/data/compare.ts`)
```

- [ ] **Step 2: 커밋**

```bash
git add docs/api/my-compare-links-api-spec.md
git commit -m "docs: 내 비교 링크 목록 API 스펙"
```

---

## 작업 순서 요약

| Task | 내용                 | 의존성       |
| ---- | -------------------- | ------------ |
| 1    | 타입 & 상수 정의     | 없음         |
| 2    | MSW + API 훅         | Task 1       |
| 3    | 로그인 유도 컴포넌트 | 없음         |
| 4    | My 하위 탭 UI        | Task 1       |
| 5    | 번들 아코디언        | Task 1, 2    |
| 6    | MainViewClient 통합  | Task 3, 4, 5 |
| 7    | 마이페이지 축소      | 없음 (독립)  |
| 8    | API 문서             | 없음 (독립)  |

Task 1-5는 독립적으로 병렬 진행 가능. Task 6은 모든 컴포넌트가 준비된 후. Task 7, 8은 언제든 독립 진행.
