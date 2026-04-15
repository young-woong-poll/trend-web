# 번들 추천 섹션 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 1:1 비교 결과와 그룹 결과 페이지 하단에 "이런 테스트는 어때요?" 번들 추천 섹션을 추가하여 사용자가 다른 번들로 자연스럽게 이동하게 한다.

**Architecture:** 공통 `BundleRecommendSection` 컴포넌트가 `useBundleList()` 훅으로 번들 목록을 가져오고, 현재 번들/완료/마감 번들을 필터한 뒤 Fisher-Yates 셔플로 3개를 선택하여 리스트형 카드로 렌더링한다. CompareResult와 GroupResult에서 동일 컴포넌트를 사용한다.

**Tech Stack:** Next.js 14 App Router, TypeScript, SCSS Modules, React Query v5

**Spec:** `docs/superpowers/specs/2026-04-15-bundle-recommend-section-design.md`

---

## 파일 구조

| 작업   | 파일                                                                              | 역할               |
| ------ | --------------------------------------------------------------------------------- | ------------------ |
| Create | `src/components/common/BundleRecommendSection/BundleRecommendSection.tsx`         | 추천 섹션 컴포넌트 |
| Create | `src/components/common/BundleRecommendSection/BundleRecommendSection.module.scss` | 추천 섹션 스타일   |
| Modify | `src/components/features/Compare/CompareResult/CompareResult.tsx`                 | 추천 섹션 삽입     |
| Modify | `src/components/features/Compare/GroupResult/GroupResult.tsx`                     | 추천 섹션 삽입     |

---

### Task 1: BundleRecommendSection 컴포넌트 생성

**Files:**

- Create: `src/components/common/BundleRecommendSection/BundleRecommendSection.tsx`

- [ ] **Step 1: 컴포넌트 파일 생성**

```tsx
'use client';

import { memo, useMemo, useRef } from 'react';

import Link from 'next/link';

import styles from '@/components/common/BundleRecommendSection/BundleRecommendSection.module.scss';
import { getCategoryTheme } from '@/constants/categoryTheme';
import { useBundleList } from '@/hooks/api/useBundle';
import { toBundleCardModelFromSummary } from '@/lib/mappers/cardMapper';
import type { BundleCardModel } from '@/types/card';

const RECOMMEND_COUNT = 3;

/** Fisher-Yates 셔플 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface BundleRecommendSectionProps {
  currentSlug: string;
}

// eslint-disable-next-line react/display-name
export const BundleRecommendSection = memo<BundleRecommendSectionProps>(({ currentSlug }) => {
  const { data: bundles, isLoading } = useBundleList(true);
  const shuffledRef = useRef<BundleCardModel[] | null>(null);

  const recommendations = useMemo(() => {
    if (!bundles || isLoading) return [];

    const cards = bundles.map(toBundleCardModelFromSummary);
    const filtered = cards.filter(
      (b) => b.slug !== currentSlug && !b.participated && b.status !== 'CLOSED'
    );

    if (filtered.length === 0) return [];

    // 마운트 시 1회만 셔플, 이후 리렌더에서 동일 결과 유지
    if (!shuffledRef.current || shuffledRef.current.length !== filtered.length) {
      shuffledRef.current = shuffle(filtered);
    }

    return shuffledRef.current.slice(0, RECOMMEND_COUNT);
  }, [bundles, isLoading, currentSlug]);

  if (recommendations.length === 0) return null;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>이런 테스트는 어때요?</h2>
      <div className={styles.list}>
        {recommendations.map((bundle) => {
          const theme = getCategoryTheme(bundle.categoryCode, bundle.categoryMeta);
          return (
            <Link key={bundle.slug} href={`/bundle/${bundle.slug}`} className={styles.card}>
              <div className={styles.cardColorBar} style={{ backgroundColor: theme.start }} />
              <div className={styles.cardContent}>
                <div className={styles.cardMeta}>
                  <span
                    className={styles.categoryBadge}
                    style={{
                      backgroundColor: `rgba(${theme.startRgb}, 0.15)`,
                      color: theme.start,
                    }}
                  >
                    {bundle.categories[0] ?? theme.label}
                  </span>
                  <span className={styles.questionCount}>{bundle.electionCount}문항</span>
                </div>
                <span className={styles.cardTitle}>{bundle.title}</span>
                <span className={styles.participantCount}>
                  {bundle.totalVoteCount.toLocaleString()}명 참여
                </span>
              </div>
              <span className={styles.chevron}>›</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
});
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit 2>&1 | grep -i BundleRecommend`
Expected: 에러 없음 (SCSS 모듈은 아직 없어서 import 경고만 있을 수 있음)

- [ ] **Step 3: Commit**

```bash
git add src/components/common/BundleRecommendSection/BundleRecommendSection.tsx
git commit -m "feat: BundleRecommendSection 컴포넌트 생성

필터링 + Fisher-Yates 셔플로 3개 번들 추천.
현재 번들, 완료 번들, 마감 번들 제외."
```

---

### Task 2: BundleRecommendSection 스타일 생성

**Files:**

- Create: `src/components/common/BundleRecommendSection/BundleRecommendSection.module.scss`

- [ ] **Step 1: SCSS 모듈 파일 생성**

```scss
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;

.container {
  @include flex-column;
  gap: 12px;
  width: 100%;
  padding: 0 $spacing-16;
}

.title {
  font-size: $font-size-16;
  font-weight: 700;
  color: $white;
  margin: 0;
}

.list {
  @include flex-column;
  gap: 10px;
}

.card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(#fff, 0.03);
  border-radius: $border-radius-md;
  border: 1px solid rgba(#fff, 0.06);
  text-decoration: none;
  transition: background 0.15s ease;
  overflow: hidden;
  position: relative;

  &:active {
    background: rgba(#fff, 0.06);
  }
}

.cardColorBar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
}

.cardContent {
  @include flex-column;
  flex: 1;
  min-width: 0;
  gap: 4px;
  padding-left: 2px;
}

.cardMeta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.categoryBadge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

.questionCount {
  font-size: 11px;
  color: $text-tertiary;
}

.cardTitle {
  font-size: $font-size-14;
  font-weight: 600;
  color: $white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.participantCount {
  font-size: $font-size-12;
  color: $text-tertiary;
}

.chevron {
  flex-shrink: 0;
  font-size: 18px;
  color: $text-tertiary;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/common/BundleRecommendSection/BundleRecommendSection.module.scss
git commit -m "style: BundleRecommendSection 스타일 추가

리스트형 카드, 왼쪽 카테고리 컬러 바, 다크 테마 준수."
```

---

### Task 3: CompareResult에 추천 섹션 삽입

**Files:**

- Modify: `src/components/features/Compare/CompareResult/CompareResult.tsx:1-7, 306-307`

- [ ] **Step 1: import 추가**

`CompareResult.tsx` 상단 import 영역에 추가:

```typescript
import { BundleRecommendSection } from '@/components/common/BundleRecommendSection/BundleRecommendSection';
```

기존 `BundleBackground` import 아래(`src/components/features/Compare/CompareResult/CompareResult.tsx:11`)에 배치.

- [ ] **Step 2: 추천 섹션 렌더링 삽입**

`CompareResult.tsx`에서 `PopularityCompare` 다음, `</div>` (container 닫힘) 전에 추천 섹션을 추가한다.

현재 코드 (line 306-307):

```tsx
        {!isFromGroup && <PopularityCompare result={result} />}
      </div>
```

변경 후:

```tsx
        {!isFromGroup && <PopularityCompare result={result} />}

        {!isFromGroup && <BundleRecommendSection currentSlug={result.bundleSlug ?? ''} />}
      </div>
```

`isFromGroup` 조건을 건 이유: 그룹에서 들어온 1:1 상세 보기에서는 "그룹 결과로 돌아가기" CTA만 보여주므로 추천이 불필요하다.

- [ ] **Step 3: 타입 체크**

Run: `npx tsc --noEmit 2>&1 | grep -i CompareResult`
Expected: 에러 없음

- [ ] **Step 4: Commit**

```bash
git add src/components/features/Compare/CompareResult/CompareResult.tsx
git commit -m "feat: 1:1 비교 결과에 번들 추천 섹션 추가

PopularityCompare 아래에 BundleRecommendSection 배치.
그룹 경유 상세보기(isFromGroup)에서는 미표시."
```

---

### Task 4: GroupResult에 추천 섹션 삽입

**Files:**

- Modify: `src/components/features/Compare/GroupResult/GroupResult.tsx:17, 473-486`

- [ ] **Step 1: import 추가**

`GroupResult.tsx` 상단 import 영역에 추가:

```typescript
import { BundleRecommendSection } from '@/components/common/BundleRecommendSection/BundleRecommendSection';
```

기존 `CreateGroupLink` import (`src/components/features/Compare/GroupResult/GroupResult.tsx:17`) 아래에 배치.

- [ ] **Step 2: 추천 섹션 렌더링 삽입**

`GroupResult.tsx`에서 성별 콘텐츠 블록 다음, "내 결과 다시 보기" ctaSection 전에 추천 섹션을 추가한다.

현재 코드 (line 473-476):

```tsx
        )}

        {isMember && (
          <div className={styles.ctaSection}>
```

변경 후:

```tsx
        )}

        {!isPreview && <BundleRecommendSection currentSlug={result.bundleSlug ?? ''} />}

        {isMember && (
          <div className={styles.ctaSection}>
```

`isPreview` 조건을 건 이유: 프리뷰 모드(가상 데이터)에서는 추천보다 참여 유도가 우선이다.

- [ ] **Step 3: 타입 체크**

Run: `npx tsc --noEmit 2>&1 | grep -i GroupResult`
Expected: 에러 없음

- [ ] **Step 4: Commit**

```bash
git add src/components/features/Compare/GroupResult/GroupResult.tsx
git commit -m "feat: 그룹 결과에 번들 추천 섹션 추가

성별 콘텐츠 아래, CTA 섹션 위에 BundleRecommendSection 배치.
프리뷰 모드에서는 미표시."
```

---

### Task 5: 빌드 검증

- [ ] **Step 1: 전체 타입 체크**

Run: `npx tsc --noEmit`
Expected: BundleRecommendSection 관련 에러 없음 (기존 ChemistryGrade 에러만 있을 수 있음)

- [ ] **Step 2: 빌드 확인**

Run: `npx next build 2>&1 | tail -20`
Expected: 빌드 성공

---

## 의존성 그래프

```
Task 1 (컴포넌트) ──┐
                    ├──> Task 3 (CompareResult 삽입)
Task 2 (스타일)  ───┤
                    ├──> Task 4 (GroupResult 삽입)
                    │
                    └──> Task 5 (빌드 검증)
```

Task 1, 2는 독립적으로 병렬 작업 가능. Task 3, 4는 Task 1+2 완료 후 병렬 가능. Task 5는 마지막.
