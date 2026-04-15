# Bundle (케미) Main Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add bundle (케미) entry points to the main feed — NEW 탭에 싱글 사이 삽입, TOP 탭에 케미 유형 필터, BundleCard 리디자인, deprecated 코드 정리.

**Architecture:** `GET /v1/bundles`를 별도 호출하여 클라이언트에서 싱글 피드에 머지. 순수 함수 `mergeBundlesIntoFeed()`로 배치 규칙 적용. TOP 탭은 유형 필터 추가 후 번들을 `participantCount` 기준 FE 정렬.

**Tech Stack:** Next.js 14 App Router, TypeScript, TanStack Query v5, SCSS Modules

---

## File Structure

| File                                                                 | Action | Responsibility                                                                            |
| -------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------- |
| `src/lib/mappers/cardMapper.ts`                                      | Modify | `toBundleCardModel()` 제거, `toCardModel()` 단순화, `toBundleCardModelFromSummary()` 추가 |
| `src/lib/mergeFeed.ts`                                               | Create | `mergeBundlesIntoFeed()` 순수 함수                                                        |
| `src/hooks/api/useBundle.ts`                                         | Modify | `bundleKeys.list`, `bundleQueries.list`, `useBundleList()` 추가                           |
| `src/constants/contentTab.ts`                                        | Modify | `TopContentType` 타입 및 상수 추가                                                        |
| `src/components/features/Main/TopSubFilter/TopSubFilter.tsx`         | Modify | 유형 필터(핫픽/케미) UI 추가                                                              |
| `src/components/features/Main/TopSubFilter/TopSubFilter.module.scss` | Modify | 유형 필터 스타일                                                                          |
| `src/components/features/Main/TopRankingList/TopRankingList.tsx`     | Modify | 링크 분기 (`/hotpick/` vs `/bundle/`)                                                     |
| `src/components/features/Main/BundleCard/BundleCard.tsx`             | Modify | 리디자인 (이미지 제거, 비교 뱃지, gradient CTA)                                           |
| `src/components/features/Main/BundleCard/BundleCard.module.scss`     | Modify | 리디자인 스타일                                                                           |
| `src/components/features/Main/MainViewClient.tsx`                    | Modify | 번들 데이터 호출 + 머지 + TOP 유형 상태                                                   |
| `docs/api/bundle-sort-request.md`                                    | Create | BE 요청: `sort=popular` 파라미터                                                          |

---

### Task 1: deprecated 코드 제거 — cardMapper.ts

`GET /v1/display/main`에서 번들이 오지 않으므로 `toBundleCardModel()` 함수와 `toCardModel()`의 BUNDLE 분기를 제거한다.

**Files:**

- Modify: `src/lib/mappers/cardMapper.ts:37-61`

- [ ] **Step 1: `toBundleCardModel()` 함수 삭제**

`cardMapper.ts`에서 37~54행의 `toBundleCardModel` 함수 전체를 삭제한다.

```ts
// 삭제 대상 (37~54행):
export function toBundleCardModel(hotpick: HotpickCardResponse): BundleCardModel {
  const { slug = '', expiredAt } = hotpick;
  const categories = (hotpick.categories ?? []).map((c) => c.category ?? '');

  return {
    slug,
    expiredAt,
    title: hotpick.election?.title ?? '',
    totalVoteCount: hotpick.election?.totalVoteCount ?? 0,
    categories,
    categoryCode: categoryNameToCode(categories[0]),
    status: hotpick.isExpired ? 'CLOSED' : 'OPEN',
    imageUrls: hotpick.imageUrl ? [hotpick.imageUrl] : undefined,
    participated: false,
  };
}
```

- [ ] **Step 2: `toCardModel()` 단순화**

기존 `toCardModel()` (56~61행)을 BUNDLE 분기 없이 항상 SINGLE을 반환하도록 변경한다.

기존:

```ts
export function toCardModel(hotpick: HotpickCardResponse): CardModel {
  if (hotpick.type === 'SINGLE' && hotpick.election) {
    return { type: 'SINGLE', data: toSingleCardModel(hotpick) };
  }
  return { type: 'BUNDLE', data: toBundleCardModel(hotpick) };
}
```

변경:

```ts
export function toCardModel(hotpick: HotpickCardResponse): CardModel {
  return { type: 'SINGLE', data: toSingleCardModel(hotpick) };
}
```

- [ ] **Step 3: 미사용 import 정리**

`cardMapper.ts` 상단에서 `BundleCardModel` import를 제거한다. `categoryNameToCode`는 새 매퍼에서 사용하므로 유지.

기존 import:

```ts
import type {
  CardModel,
  SingleCardModel,
  BundleCardModel,
  DetailVoteOption,
  SingleDetailModel,
} from '@/types/card';
```

변경:

```ts
import type { CardModel, SingleCardModel, DetailVoteOption, SingleDetailModel } from '@/types/card';
```

- [ ] **Step 4: 타입 체크**

Run: `npx tsc --noEmit`
Expected: PASS (BundleCardModel import 제거 외 다른 파일에서 toBundleCardModel을 참조하는 곳이 없어야 함)

- [ ] **Step 5: Commit**

```bash
git add src/lib/mappers/cardMapper.ts
git commit -m "refactor: remove deprecated toBundleCardModel from cardMapper

display/main API no longer returns BUNDLE type cards.
toCardModel() now always returns SINGLE."
```

---

### Task 2: `toBundleCardModelFromSummary()` 매퍼 추가

`BundleSummaryResponse` (FE alias `BundleDetail`) → `BundleCardModel` 변환 함수를 추가한다.

**Files:**

- Modify: `src/lib/mappers/cardMapper.ts`

- [ ] **Step 1: BundleCardModel import 복원 및 BundleDetail import 추가**

```ts
import { categoryNameToCode } from '@/constants/categoryTheme';
import type { HotpickCardResponse, HotpickDetailResponse } from '@/generated/models';
import type {
  CardModel,
  SingleCardModel,
  BundleCardModel,
  DetailVoteOption,
  SingleDetailModel,
} from '@/types/card';
import type { BundleDetail } from '@/types/bundle';
import type { CategoryCode } from '@/types/hotpick';
import { electionToSingleVoteData } from '@/types/singleVote';
```

- [ ] **Step 2: `toBundleCardModelFromSummary()` 함수 작성**

`toSingleCardModel()` 함수 바로 아래, `toCardModel()` 바로 위에 추가한다.

```ts
export function toBundleCardModelFromSummary(bundle: BundleDetail): BundleCardModel {
  const category = bundle.category ?? '';

  return {
    slug: bundle.slug ?? '',
    title: bundle.title ?? '',
    subtitle: bundle.subtitle,
    categories: category ? [category] : [],
    categoryCode: (bundle.categoryCode as CategoryCode) ?? categoryNameToCode(category),
    totalVoteCount: bundle.participantCount ?? 0,
    electionCount: bundle.questionCount,
    imageUrls: bundle.imageUrl ? [bundle.imageUrl] : undefined,
    status: bundle.status === 'CLOSED' ? 'CLOSED' : 'OPEN',
    participated: bundle.completed ?? false,
  };
}
```

- [ ] **Step 3: 타입 체크**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/mappers/cardMapper.ts
git commit -m "feat: add toBundleCardModelFromSummary mapper

Converts BundleSummaryResponse (BundleDetail) to BundleCardModel
for use with GET /v1/bundles endpoint."
```

---

### Task 3: `useBundleList()` 훅 추가

`useBundle.ts`에 번들 전체 목록을 가져오는 훅을 추가한다.

**Files:**

- Modify: `src/hooks/api/useBundle.ts`

- [ ] **Step 1: `list` import 추가**

`useBundle.ts` 상단 import에 `list`를 추가한다.

기존:

```ts
import {
  getDetail1,
  getElections,
  getMyResult,
  submitAnswers,
} from '@/generated/api/client/bundle/bundle';
```

변경:

```ts
import {
  list,
  getDetail1,
  getElections,
  getMyResult,
  submitAnswers,
} from '@/generated/api/client/bundle/bundle';
```

- [ ] **Step 2: `bundleKeys`에 `list` 추가**

기존:

```ts
export const bundleKeys = {
  all: ['bundle'] as const,
  detail: (slug: string) => [...bundleKeys.all, 'detail', slug] as const,
  elections: (slug: string) => [...bundleKeys.all, 'elections', slug] as const,
  myResult: (slug: string) => [...bundleKeys.all, 'myResult', slug] as const,
};
```

변경:

```ts
export const bundleKeys = {
  all: ['bundle'] as const,
  list: () => [...bundleKeys.all, 'list'] as const,
  detail: (slug: string) => [...bundleKeys.all, 'detail', slug] as const,
  elections: (slug: string) => [...bundleKeys.all, 'elections', slug] as const,
  myResult: (slug: string) => [...bundleKeys.all, 'myResult', slug] as const,
};
```

- [ ] **Step 3: `bundleQueries`에 `list` 추가**

`bundleQueries` 객체의 첫 번째 항목으로 추가한다.

```ts
export const bundleQueries = {
  list: () =>
    queryOptions<BundleDetail[] | undefined>({
      queryKey: bundleKeys.list(),
      queryFn: () => list() as Promise<BundleDetail[] | undefined>,
      staleTime: 60 * 1000,
    }),

  detail: (slug: string) =>
    // ... 기존 코드 유지
```

- [ ] **Step 4: `useBundleList()` 훅 작성**

`useBundleDetail` 위에 추가한다.

```ts
export const useBundleList = (enabled: boolean) =>
  useQuery({
    ...bundleQueries.list(),
    enabled,
  });
```

- [ ] **Step 5: 타입 체크**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/hooks/api/useBundle.ts
git commit -m "feat: add useBundleList hook

Fetches all bundles via GET /v1/bundles for main feed integration."
```

---

### Task 4: `mergeBundlesIntoFeed()` 순수 함수

싱글 카드 배열에 번들 카드를 규칙적으로 삽입하는 순수 함수를 작성한다.

**Files:**

- Create: `src/lib/mergeFeed.ts`

- [ ] **Step 1: `mergeBundlesIntoFeed()` 작성**

```ts
import type { BundleCardModel, CardModel } from '@/types/card';

/**
 * 싱글 카드 배열에 번들 카드를 규칙적으로 삽입한다.
 *
 * 배치 규칙:
 * - 첫 번째 번들: 싱글 index 1 (2번째 위치)
 * - 이후 번들: 싱글 6개 간격 (삽입 위치 기준 index 1, 8, 15, 22, ...)
 * - 번들이 부족하면 있는 만큼만 삽입
 */
export function mergeBundlesIntoFeed(
  singles: CardModel[],
  bundles: BundleCardModel[]
): CardModel[] {
  if (bundles.length === 0) {
    return singles;
  }

  const result: CardModel[] = [];
  let bundleIndex = 0;
  const FIRST_INSERT = 1; // 2번째 위치
  const INTERVAL = 7; // 이후 간격 (6 singles + 1 bundle slot)

  for (let i = 0; i < singles.length; i++) {
    // 현재 result 길이가 삽입 위치와 일치하면 번들 삽입
    if (
      bundleIndex < bundles.length &&
      result.length === (bundleIndex === 0 ? FIRST_INSERT : FIRST_INSERT + bundleIndex * INTERVAL)
    ) {
      result.push({ type: 'BUNDLE', data: bundles[bundleIndex] });
      bundleIndex++;
    }
    result.push(singles[i]);
  }

  return result;
}
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/mergeFeed.ts
git commit -m "feat: add mergeBundlesIntoFeed utility

Inserts bundle cards into single card feed at index 1,
then every 7 positions (6 singles apart)."
```

---

### Task 5: BundleCard 리디자인

이미지 제거, 1:1 비교 / 그룹 비교 뱃지 추가, CTA gradient 적용.

**Files:**

- Modify: `src/components/features/Main/BundleCard/BundleCard.tsx`
- Modify: `src/components/features/Main/BundleCard/BundleCard.module.scss`

- [ ] **Step 1: BundleCard.tsx 리디자인**

기존 파일을 아래 내용으로 교체한다.

```tsx
'use client';

import { memo, useState } from 'react';

import { useRouter } from 'next/navigation';

import ShareIcon from '@/assets/icon/ShareIcon';
import StartArrowIcon from '@/assets/icon/StartArrowIcon';
import { DeadlineBadge } from '@/components/common/DeadlineBadge';
import styles from '@/components/features/Main/BundleCard/BundleCard.module.scss';
import { getCategoryThemeVars } from '@/constants/categoryTheme';
import { useCardActions } from '@/contexts/CardActionsContext';
import { formatCount } from '@/lib/utils';
import type { BundleCardModel } from '@/types/card';

const EMPTY_CATEGORIES: string[] = [];

interface BundleCardProps {
  data: BundleCardModel;
}

// eslint-disable-next-line react/display-name
export const BundleCard = memo<BundleCardProps>(({ data }) => {
  const {
    slug,
    title,
    subtitle,
    categories = EMPTY_CATEGORIES,
    categoryCode,
    totalVoteCount,
    electionCount,
    expiredAt,
    status,
    participated,
  } = data;

  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const actions = useCardActions();

  const isClosed = status === 'CLOSED';
  const themeVars = getCategoryThemeVars(categoryCode);

  const handleClick = () => {
    if (isClosed) {
      return;
    }
    setIsNavigating(true);
    router.push(`/bundle/${slug}`);
  };

  return (
    <div
      className={`${styles.card} ${isClosed ? styles.closed : ''}`}
      data-testid="bundle-card"
      style={themeVars}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleClick();
        }
      }}
    >
      <div className={styles.accentBorder} />

      <div className={styles.content}>
        {/* 상단: 카테고리 + 케미 뱃지 + 공유 */}
        <div className={styles.topRow}>
          <div className={styles.categoryRow}>
            {categories.map((cat, i) => (
              <span key={cat}>
                {i > 0 && <span className={styles.categorySeparator}>·</span>}
                <span className={styles.categoryTag}>{cat}</span>
              </span>
            ))}
            {categories.length > 0 && <span className={styles.categorySeparator}>·</span>}
            <span className={styles.chemiBadge}>케미</span>
          </div>
          <button
            type="button"
            className={styles.shareButton}
            onClick={(e) => {
              e.stopPropagation();
              actions.share(slug);
            }}
            aria-label="공유"
          >
            <ShareIcon />
          </button>
        </div>

        {/* 제목 */}
        <div className={styles.titleGroup}>
          <h3 className={styles.title}>{title}</h3>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>

        {/* 메타 */}
        <div className={styles.metaRow}>
          {electionCount && <span className={styles.metaText}>{electionCount}개 질문</span>}
          {electionCount && <span className={styles.dot} />}
          <span className={styles.metaText}>{formatCount(totalVoteCount)}명 참여</span>
        </div>

        {/* 비교 어필 뱃지 */}
        <div className={styles.compareBadges}>
          <span className={styles.compareBadge}>1:1 비교</span>
          <span className={styles.compareBadge}>그룹 비교</span>
        </div>

        {/* CTA 버튼 */}
        <button
          type="button"
          className={`${styles.ctaButton} ${participated ? styles.participated : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          disabled={isNavigating || isClosed}
        >
          {isNavigating ? (
            <span className={styles.loading}>...</span>
          ) : participated ? (
            <>
              결과 보기 <StartArrowIcon width={16} height={16} />
            </>
          ) : (
            <>
              시작하기 <StartArrowIcon width={16} height={16} />
            </>
          )}
        </button>

        {/* 마감 뱃지 */}
        <div className={styles.bottomRow}>
          {expiredAt && <DeadlineBadge deadline={expiredAt} compact />}
          {isClosed && (
            <span className={styles.closedBadge} data-testid="closed-badge">
              마감
            </span>
          )}
          {participated && <span className={styles.participatedBadge}>참여 완료</span>}
        </div>
      </div>
    </div>
  );
});
```

- [ ] **Step 2: BundleCard.module.scss 리디자인**

기존 파일을 아래 내용으로 교체한다.

```scss
@use '@/styles/variables' as *;

.card {
  position: relative;
  width: 100%;
  border-radius: $border-radius-lg;
  background: $bg-secondary;
  border: 1px solid $border-placeholder;
  overflow: hidden;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  content-visibility: auto;
  contain-intrinsic-size: 0 220px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-md;
  }

  &:active {
    transform: translateY(0);
  }

  &.closed {
    opacity: 0.6;
    cursor: default;

    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
}

// 좌측 그라데이션 보더
.accentBorder {
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--primary-gradient);
  border-radius: $border-radius-lg 0 0 $border-radius-lg;
}

.content {
  padding: 16px 16px 16px 20px;
}

// -- 상단: 카테고리 + 공유 --
.topRow {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 10px;
}

.categoryRow {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}

.categorySeparator {
  color: $text-tertiary;
  font-size: $font-size-12;
  margin: 0 4px;
}

.categoryTag {
  color: $text-tertiary;
  font-size: $font-size-12;
  font-weight: $font-weight-regular;
  white-space: nowrap;
  line-height: 1.4;
}

.chemiBadge {
  font-size: $font-size-12;
  font-weight: $font-weight-bold;
  color: var(--primary-start);
  white-space: nowrap;
  line-height: 1.4;
}

.shareButton {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: $text-tertiary;
  cursor: pointer;
  flex-shrink: 0;
  margin-left: 8px;
  transition:
    background 0.15s ease,
    color 0.15s ease;

  &:hover {
    background: rgba($white, 0.08);
    color: $white;
  }

  &:active {
    transform: scale(0.92);
  }
}

// -- 제목 --
.titleGroup {
  margin-bottom: 8px;
}

.title {
  font-size: $font-size-16;
  font-weight: $font-weight-bold;
  color: $white;
  line-height: 1.4;
  word-break: keep-all;
}

.card:hover .title {
  text-decoration: underline;
}

.subtitle {
  font-size: $font-size-14;
  color: $text-secondary;
  line-height: 1.4;
  margin-top: 2px;
}

// -- 메타 --
.metaRow {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

.metaText {
  font-size: $font-size-12;
  color: $text-tertiary;
}

.dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: $border-placeholder;
  flex-shrink: 0;
}

// -- 비교 어필 뱃지 --
.compareBadges {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.compareBadge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: $border-radius-md;
  background: $bg-tertiary;
  border: 1px solid #3a3a3a;
  color: $text-secondary;
  font-size: $font-size-12;
  font-weight: $font-weight-medium;
}

// -- CTA 버튼 --
.ctaButton {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  padding: 10px 16px;
  border-radius: $border-radius-md;
  border: none;
  background: var(--primary-gradient);
  color: $white;
  font-size: $font-size-14;
  font-weight: $font-weight-bold;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    opacity 0.15s ease;

  svg {
    transition: transform 0.2s ease;
  }

  &:hover {
    opacity: 0.9;

    svg {
      transform: translateX(3px);
    }
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;

    &:hover {
      opacity: 0.5;
      transform: none;
    }
  }

  &.participated {
    background: transparent;
    border: 1.5px solid $text-tertiary;
    color: $text-secondary;

    &:hover {
      opacity: 0.8;
    }
  }
}

.loading {
  letter-spacing: 2px;
}

// -- 하단: 마감 + 참여완료 뱃지 --
.bottomRow {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 10px;

  &:empty {
    display: none;
  }
}

.closedBadge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: $border-rounded;
  background: rgba($neutral-500, 0.2);
  color: $text-tertiary;
  font-size: $font-size-12;
  font-weight: $font-weight-bold;
}

.participatedBadge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  border-radius: $border-radius-sm;
  background: rgba($white, 0.1);
  color: $text-secondary;
  font-size: $font-size-12;
  font-weight: $font-weight-semibold;
}
```

- [ ] **Step 3: 타입 체크**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/features/Main/BundleCard/BundleCard.tsx src/components/features/Main/BundleCard/BundleCard.module.scss
git commit -m "feat: redesign BundleCard for chemi concept

Remove image thumbnail, add 1:1/group compare badges,
move electionCount to meta row, gradient CTA button."
```

---

### Task 6: TOP 탭 유형 필터 — constants + TopSubFilter

**Files:**

- Modify: `src/constants/contentTab.ts`
- Modify: `src/components/features/Main/TopSubFilter/TopSubFilter.tsx`
- Modify: `src/components/features/Main/TopSubFilter/TopSubFilter.module.scss`

- [ ] **Step 1: `TopContentType` 타입 추가**

`contentTab.ts`의 `TopPeriod` 관련 코드 아래에 추가한다.

`DEFAULT_TOP_PERIOD` 행 다음에:

```ts
/** TOP 탭 콘텐츠 유형 필터 */
export type TopContentType = 'single' | 'bundle';

export const TOP_CONTENT_TYPES: Array<{ value: TopContentType; label: string }> = [
  { value: 'single', label: '핫픽' },
  { value: 'bundle', label: '케미' },
];

export const DEFAULT_TOP_CONTENT_TYPE: TopContentType = 'single';
```

- [ ] **Step 2: TopSubFilter에 유형 필터 props 추가**

`TopSubFilter.tsx`를 수정한다.

```tsx
'use client';

import type { FC } from 'react';

import styles from '@/components/features/Main/TopSubFilter/TopSubFilter.module.scss';
import type { CategoryFilterItem } from '@/constants/category';
import {
  TOP_PERIODS,
  TOP_CONTENT_TYPES,
  type TopPeriod,
  type TopContentType,
} from '@/constants/contentTab';

interface TopSubFilterProps {
  selectedPeriod: TopPeriod;
  onPeriodChange: (period: TopPeriod) => void;
  selectedCategory: string | null;
  onCategoryChange: (slug: string | null) => void;
  categories?: CategoryFilterItem[];
  selectedContentType: TopContentType;
  onContentTypeChange: (type: TopContentType) => void;
}

export const TopSubFilter: FC<TopSubFilterProps> = ({
  selectedPeriod,
  onPeriodChange,
  selectedCategory,
  onCategoryChange,
  categories,
  selectedContentType,
  onContentTypeChange,
}) => {
  const isBundleMode = selectedContentType === 'bundle';

  return (
    <div className={styles.container} data-testid="top-sub-filter">
      <div className={styles.selectRow}>
        {/* 유형 SelectBox */}
        <select
          className={styles.select}
          value={selectedContentType}
          onChange={(e) => onContentTypeChange(e.target.value as TopContentType)}
          data-testid="top-content-type-select"
        >
          {TOP_CONTENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {/* 기간 SelectBox — 케미 모드에서 숨김 */}
        {!isBundleMode && (
          <select
            className={styles.select}
            value={selectedPeriod}
            onChange={(e) => onPeriodChange(e.target.value as TopPeriod)}
            data-testid="top-period-select"
          >
            {TOP_PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        )}

        {/* 카테고리 SelectBox — 케미 모드에서 숨김 */}
        {!isBundleMode && (
          <select
            className={styles.select}
            value={selectedCategory ?? 'all'}
            onChange={(e) => {
              const val = e.target.value;
              onCategoryChange(val === 'all' ? null : val);
            }}
            data-testid="top-category-select"
          >
            <option value="all">전체 카테고리</option>
            {categories?.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: 타입 체크**

Run: `npx tsc --noEmit`
Expected: FAIL — `MainViewClient`에서 `TopSubFilter`에 새 props를 아직 전달하지 않아서 에러가 날 수 있음. Task 8에서 수정하므로 여기서는 해당 에러만 확인하고 진행.

- [ ] **Step 4: Commit**

```bash
git add src/constants/contentTab.ts src/components/features/Main/TopSubFilter/TopSubFilter.tsx
git commit -m "feat: add content type filter (핫픽/케미) to TopSubFilter

Adds TopContentType type, hides period/category selects in bundle mode."
```

---

### Task 7: TopRankingList 링크 분기

**Files:**

- Modify: `src/components/features/Main/TopRankingList/TopRankingList.tsx:14-15, 54, 152, 199`

- [ ] **Step 1: `getHref` 헬퍼 함수 추가**

`TopRankingList.tsx`의 기존 헬퍼 함수들 (`getSlug`, `getTitle` 등) 아래에 추가한다.

`getImageUrl` 함수 바로 아래에:

```ts
function getHref(card: CardModel): string {
  return card.type === 'BUNDLE' ? `/bundle/${card.data.slug}` : `/hotpick/${card.data.slug}`;
}
```

- [ ] **Step 2: `FirstPlaceCard`의 Link href 교체**

기존 (54행):

```tsx
<Link href={`/hotpick/${getSlug(card)}`} className={styles.firstPlace}>
```

변경:

```tsx
<Link href={getHref(card)} className={styles.firstPlace}>
```

- [ ] **Step 3: podiumCards의 Link href 교체**

기존 (152행 부근):

```tsx
<Link
  key={getSlug(card)}
  href={`/hotpick/${getSlug(card)}`}
  className={styles.podiumCard}
>
```

변경:

```tsx
<Link
  key={getSlug(card)}
  href={getHref(card)}
  className={styles.podiumCard}
>
```

- [ ] **Step 4: listCards의 Link href 교체**

기존 (199행 부근):

```tsx
<Link
  key={getSlug(card)}
  href={`/hotpick/${getSlug(card)}`}
  className={styles.listRow}
>
```

변경:

```tsx
<Link
  key={getSlug(card)}
  href={getHref(card)}
  className={styles.listRow}
>
```

- [ ] **Step 5: 타입 체크**

Run: `npx tsc --noEmit`
Expected: PASS (또는 Task 6의 TopSubFilter props 에러만)

- [ ] **Step 6: Commit**

```bash
git add src/components/features/Main/TopRankingList/TopRankingList.tsx
git commit -m "feat: add link routing for bundle cards in TopRankingList

BUNDLE cards link to /bundle/{slug}, SINGLE cards to /hotpick/{slug}."
```

---

### Task 8: MainViewClient 통합

번들 데이터 호출, 피드 머지, TOP 유형 상태를 `MainViewClient`에 통합한다.

**Files:**

- Modify: `src/components/features/Main/MainViewClient.tsx`

- [ ] **Step 1: import 추가**

기존 import 블록에 추가:

```ts
import { useBundleList } from '@/hooks/api/useBundle';
import { toBundleCardModelFromSummary } from '@/lib/mappers/cardMapper';
import { mergeBundlesIntoFeed } from '@/lib/mergeFeed';
```

contentTab import에 타입 추가:

기존:

```ts
import {
  DEFAULT_TOP_PERIOD,
  DEFAULT_TAB,
  DEFAULT_MY_SUB_TAB_GUEST,
  DEFAULT_MY_SUB_TAB_LOGGED_IN,
  type TopPeriod,
  type TabSelection,
  type FilterTabType,
  type MySubTabType,
} from '@/constants/contentTab';
```

변경:

```ts
import {
  DEFAULT_TOP_PERIOD,
  DEFAULT_TOP_CONTENT_TYPE,
  DEFAULT_TAB,
  DEFAULT_MY_SUB_TAB_GUEST,
  DEFAULT_MY_SUB_TAB_LOGGED_IN,
  type TopPeriod,
  type TopContentType,
  type TabSelection,
  type FilterTabType,
  type MySubTabType,
} from '@/constants/contentTab';
```

- [ ] **Step 2: 상태 추가**

`MainViewClient` 컴포넌트 내부, `topCategory` state 아래에 추가:

```ts
const [topContentType, setTopContentType] = useState<TopContentType>(DEFAULT_TOP_CONTENT_TYPE);
```

- [ ] **Step 3: 번들 데이터 호출 추가**

`isMyTab` 변수 선언 아래에 추가:

```ts
const isNewTab = selectedTab.kind === 'filter' && selectedTab.type === 'new';
const isTopBundleMode = isTopTab && topContentType === 'bundle';
const { data: bundleListData } = useBundleList(isNewTab || isTopBundleMode);
```

- [ ] **Step 4: 번들 카드 변환 + 머지 로직**

기존 `cards` useMemo (249행) 아래에 추가:

```ts
// 번들 → BundleCardModel 변환
const bundleCards = useMemo(
  () => (bundleListData ?? []).map(toBundleCardModelFromSummary),
  [bundleListData]
);

// NEW 탭: 싱글 + 번들 머지
const mergedCards = useMemo(() => {
  if (isNewTab) {
    return mergeBundlesIntoFeed(cards, bundleCards);
  }
  return cards;
}, [cards, bundleCards, isNewTab]);

// TOP 케미 모드: participantCount 내림차순 정렬
const topBundleCards = useMemo(() => {
  if (!isTopBundleMode) {
    return [];
  }
  const sorted = [...bundleCards].sort((a, b) => b.totalVoteCount - a.totalVoteCount);
  return sorted.map((data): CardModel => ({ type: 'BUNDLE', data }));
}, [bundleCards, isTopBundleMode]);
```

- [ ] **Step 5: TopSubFilter에 새 props 전달**

기존:

```tsx
<TopSubFilter
  selectedPeriod={topPeriod}
  onPeriodChange={setTopPeriod}
  selectedCategory={topCategory}
  onCategoryChange={setTopCategory}
  categories={dynamicCategories}
/>
```

변경:

```tsx
<TopSubFilter
  selectedPeriod={topPeriod}
  onPeriodChange={setTopPeriod}
  selectedCategory={topCategory}
  onCategoryChange={setTopCategory}
  categories={dynamicCategories}
  selectedContentType={topContentType}
  onContentTypeChange={setTopContentType}
/>
```

- [ ] **Step 6: TopRankingList에 케미 모드 분기**

기존 (290~296행):

```tsx
{isTopTab ? (
  <TopRankingList
    cards={cards}
    isLoading={isLoading}
    isError={isError}
    isFetching={isFetching}
    emptyState={emptyState}
  />
```

변경:

```tsx
{isTopTab ? (
  isTopBundleMode ? (
    <TopRankingList
      cards={topBundleCards}
      isLoading={!bundleListData && isTopBundleMode}
      isError={false}
      isFetching={!bundleListData && isTopBundleMode}
      emptyState={{ title: '케미 랭킹이 없어요', description: '케미에 참여해서 순위를 확인해 보세요.' }}
    />
  ) : (
    <TopRankingList
      cards={cards}
      isLoading={isLoading}
      isError={isError}
      isFetching={isFetching}
      emptyState={emptyState}
    />
  )
```

- [ ] **Step 7: CardList에 머지된 카드 전달**

기존 (320~331행):

```tsx
<CardList
  cards={cards}
  isLoading={isLoading}
  ...
```

변경:

```tsx
<CardList
  cards={mergedCards}
  isLoading={isLoading}
  ...
```

`cards`를 `mergedCards`로만 교체. 나머지 props는 동일.

- [ ] **Step 8: 타입 체크**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/components/features/Main/MainViewClient.tsx
git commit -m "feat: integrate bundles into main feed

NEW tab: merge bundles into single feed at regular intervals.
TOP tab: add chemi mode with participantCount ranking."
```

---

### Task 9: BE 요청 문서 작성

**Files:**

- Create: `docs/api/bundle-sort-request.md`

- [ ] **Step 1: 문서 작성**

```markdown
# BE 요청: GET /v1/bundles sort=popular 파라미터

## 요청 사항

`GET /v1/bundles` 엔드포인트에 `sort` 쿼리 파라미터를 추가해주세요.

## 상세

| 파라미터 | 값                | 설명                             |
| -------- | ----------------- | -------------------------------- |
| `sort`   | `popular`         | `participantCount` 내림차순 정렬 |
| `sort`   | `latest` (기본값) | 생성일 내림차순 정렬             |

## 현재 상태

- FE에서 전체 번들 목록을 가져온 후 `participantCount` 기준 클라이언트 정렬 중
- TOP 탭 > 케미 유형 필터에서 사용

## 필요 이유

- 번들 수가 늘어나면 전체 목록을 받아서 클라이언트 정렬하는 것이 비효율적
- BE에서 정렬하면 향후 페이지네이션도 가능

## 요청 예시
```

GET /v1/bundles?sort=popular

```

## FE 대응

BE 구현 완료 시 FE에서 클라이언트 정렬 제거하고 `sort=popular` 파라미터 전달로 교체 예정.
```

- [ ] **Step 2: Commit**

```bash
git add docs/api/bundle-sort-request.md
git commit -m "docs: add BE request for bundle sort=popular parameter"
```

---

### Task 10: 최종 검증

- [ ] **Step 1: 타입 체크**

Run: `npx tsc --noEmit`
Expected: PASS, 에러 0

- [ ] **Step 2: 린트 체크**

Run: `npx next lint`
Expected: PASS

- [ ] **Step 3: 개발 서버 확인**

Run: `npm run dev`

확인 사항:

1. NEW 탭: 2번째 위치에 번들 카드가 보이는지
2. 번들 카드에 "1:1 비교" / "그룹 비교" 뱃지가 있는지
3. 번들 카드 클릭 시 `/bundle/{slug}`로 이동하는지
4. TOP 탭: 유형 필터에서 "케미" 선택 시 번들 랭킹이 보이는지
5. TOP 탭 케미 모드에서 기간/카테고리 필터가 숨겨지는지
6. TOP 탭 케미 랭킹에서 카드 클릭 시 `/bundle/{slug}`로 이동하는지
7. MY 탭: 기존 "케미" 서브탭이 정상 동작하는지

- [ ] **Step 4: 최종 Commit (필요 시)**

이전 Task들에서 커밋이 완료되지 않은 변경사항이 있다면 여기서 커밋한다.
