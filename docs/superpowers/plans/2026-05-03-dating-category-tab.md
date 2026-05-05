# Dating Category Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 메인 탭 바에서 기존 7개 카테고리(연애·결혼·관계·재테크·직장·라이프·트렌드)를 숨기고, 신규 `dating`(소개팅) 카테고리만 노출한다. 디폴트 진입 탭을 소개팅으로 바꾸고, 탭 첫 위치(필터탭 NEW/TOP/MY 앞)에 배치한다. 운영 DB와 카드 매핑은 일절 변경하지 않으며, FE 화이트리스트 상수 한 줄로 노출 통제한다.

**Architecture:** `src/constants/category.ts`에 `dating` 폴백 + `VISIBLE_CATEGORY_SLUGS` 화이트리스트 상수를 추가한다. `MainViewClient.tsx`의 `dynamicCategories` 계산 로직에 화이트리스트 필터를 추가하고, `parseTabFromQuery`의 디폴트 반환값을 `{ kind: 'category', slug: 'dating', label: '소개팅' }`로 변경한다. `ContentTabs.tsx`의 렌더 순서를 "카테고리 탭 → 구분자 → 필터탭"으로 뒤집어 소개팅이 첫 위치에 오도록 한다. 구분자(`styles.divider`)의 위치도 카테고리와 필터 사이로 이동한다. 직접 URL 진입(`/?category=love`)은 여전히 동작하므로 SEO와 롱테일 검색 유입은 보존된다.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, SCSS Modules, React Query v5, Playwright E2E.

**Strategy SSoT:** [../../strategy/2026-05-03-content-niche-pivot.md](../../strategy/2026-05-03-content-niche-pivot.md)

---

## File Structure

| 파일                                                       | 책임                                        | 작업 종류                                                               |
| ---------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| `src/constants/category.ts`                                | 카테고리 폴백 목록 + 노출 화이트리스트 상수 | Modify (add `dating`, add `VISIBLE_CATEGORY_SLUGS`)                     |
| `src/components/features/Main/MainViewClient.tsx`          | 디폴트 탭, 화이트리스트 필터                | Modify (`parseTabFromQuery` 디폴트 반환, `dynamicCategories` 필터 체인) |
| `src/components/features/Main/ContentTabs/ContentTabs.tsx` | 탭 렌더 순서 (카테고리 → 구분자 → 필터)     | Modify (JSX 블록 순서 + 구분자 위치)                                    |
| `src/constants/contentTab.ts`                              | `DEFAULT_TAB` 상수                          | Modify (`{ kind: 'filter', type: 'new' }` → 소개팅 카테고리)            |
| `docs/specs/pages/main.md`                                 | 메인 페이지 스펙 (탭 구조 다이어그램)       | Modify (Before/After)                                                   |
| `docs/specs/pages/tab.md`                                  | 탭 네비게이션 스펙                          | Modify (배치 순서, 디폴트, 화이트리스트 정책)                           |
| `qa/main/checklist.md`                                     | 메인 QA 체크리스트                          | Modify (디폴트 탭 가정)                                                 |
| `qa/tab/checklist.md`                                      | 탭 QA 체크리스트                            | Modify (디폴트, 노출 카테고리, 배치 순서)                               |
| `qa/tab/tab.spec.ts`                                       | 탭 E2E 테스트                               | Modify (디폴트 가정 + 화이트리스트)                                     |
| `qa/tab/tab-query-persistence.spec.ts`                     | URL 쿼리 동작 E2E                           | Modify (디폴트 변경 영향)                                               |
| `qa/main/main.spec.ts`                                     | 메인 E2E (필요 시)                          | Modify (디폴트 변경 영향만 점검)                                        |
| `qa/helpers/tab-page.ts`                                   | 탭 helper (필요 시)                         | Read only — 변경 불필요 (categoryTab(slug) 메서드로 `dating` 접근 가능) |

설계 원칙:

- 화이트리스트는 **상수**로 박는다. `process.env`나 런타임 fetch가 아니라 코드 변경으로 통제 — 가역성·검토 용이성 우선.
- 직접 URL 진입(`/?category=love`)은 **차단하지 않는다.** 화이트리스트는 "탭에 보이는가"만 통제하고, 라우팅·API 호출·SEO는 그대로 둠.
- 디폴트 탭 변경은 `parseTabFromQuery` 한 군데에서 이루어진다. `DEFAULT_TAB` 상수도 같이 갱신해 일관성 유지.

---

### Task 1: `src/constants/category.ts`에 `dating` 폴백 + `VISIBLE_CATEGORY_SLUGS` 화이트리스트 추가

**Files:**

- Modify: `src/constants/category.ts:1-15`

- [ ] **Step 1: 현재 파일 내용을 화이트리스트 + dating 추가본으로 교체**

```ts
export interface CategoryFilterItem {
  label: string;
  slug: string;
}

/**
 * 탭에 노출할 카테고리 슬러그 화이트리스트.
 * 운영 DB나 BE 응답이 어떻든, 이 목록에 있는 슬러그만 탭에 표시된다.
 * 직접 URL 진입(/?category=love 등)은 여전히 동작하므로 SEO·롱테일 검색 유입은 보존된다.
 *
 * 정책 변경 이력은 docs/strategy/2026-05-03-content-niche-pivot.md 참조.
 */
export const VISIBLE_CATEGORY_SLUGS: readonly string[] = ['dating'];

/** 카테고리 폴백 목록 (API 응답 전 또는 실패 시 사용) */
export const CATEGORY_FILTERS: CategoryFilterItem[] = [
  { label: '소개팅', slug: 'dating' },
  { label: '연애', slug: 'love' },
  { label: '결혼', slug: 'marriage' },
  { label: '관계', slug: 'relationship' },
  { label: '재테크', slug: 'finance' },
  { label: '직장', slug: 'work' },
  { label: '라이프', slug: 'life' },
  { label: '트렌드', slug: 'trend' },
];
```

폴백에 기존 7개를 남겨둔 이유: 화이트리스트가 빈 배열로 바뀌거나 다른 슬러그 추가 시 폴백 매칭이 동작하도록. 화이트리스트 + 폴백은 책임 분리.

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: PASS (다른 파일에서 `CATEGORY_FILTERS`나 `CategoryFilterItem`을 참조하는 부분이 깨지지 않음)

- [ ] **Step 3: 커밋**

```bash
git add src/constants/category.ts
git commit -m "feat(category): dating 폴백 + VISIBLE_CATEGORY_SLUGS 화이트리스트 추가"
```

---

### Task 2: `MainViewClient.tsx`의 `dynamicCategories` 화이트리스트 필터 적용

**Files:**

- Modify: `src/components/features/Main/MainViewClient.tsx:222-230`

- [ ] **Step 1: import 추가**

`MainViewClient.tsx` 파일 상단의 category import를 다음과 같이 변경.

기존 (24행 근처):

```ts
import type { CategoryFilterItem } from '@/constants/category';
```

변경:

```ts
import { VISIBLE_CATEGORY_SLUGS, type CategoryFilterItem } from '@/constants/category';
```

- [ ] **Step 2: `dynamicCategories` 계산에 화이트리스트 필터 체인 추가**

기존 코드 (222-230행 근처):

```ts
const dynamicCategories: CategoryFilterItem[] | undefined = Array.isArray(apiCategories)
  ? apiCategories
      .filter((c) => c.categoryCode !== 'all') // "전체" 카테고리 제외 (NEW 탭이 대체)
      .map((c) => ({
        label: c.category ?? '',
        slug: c.categoryCode ?? '',
      }))
  : undefined;
```

변경 후:

```ts
const dynamicCategories: CategoryFilterItem[] | undefined = Array.isArray(apiCategories)
  ? apiCategories
      .filter((c) => c.categoryCode !== 'all') // "전체" 카테고리 제외 (NEW 탭이 대체)
      .filter((c) => VISIBLE_CATEGORY_SLUGS.includes(c.categoryCode ?? ''))
      .map((c) => ({
        label: c.category ?? '',
        slug: c.categoryCode ?? '',
      }))
  : undefined;
```

- [ ] **Step 3: 타입 체크 + 린트**

Run: `npx tsc --noEmit && pnpm lint`
Expected: PASS

- [ ] **Step 4: 커밋**

```bash
git add src/components/features/Main/MainViewClient.tsx
git commit -m "feat(main): 카테고리 탭에 화이트리스트 필터 적용"
```

---

### Task 3: 디폴트 탭을 소개팅 카테고리로 변경 (`DEFAULT_TAB` + `parseTabFromQuery`)

**Files:**

- Modify: `src/constants/contentTab.ts:49`
- Modify: `src/components/features/Main/MainViewClient.tsx:55-72`

- [ ] **Step 1: `DEFAULT_TAB` 상수 변경**

`src/constants/contentTab.ts:49`의 기존 정의를 변경.

기존:

```ts
/** 기본 탭 선택 */
export const DEFAULT_TAB: TabSelection = { kind: 'filter', type: 'new' };
```

변경:

```ts
/** 기본 탭 선택 — 소개팅 카테고리 (2026-05-03 콘텐츠 니치 피벗) */
export const DEFAULT_TAB: TabSelection = {
  kind: 'category',
  slug: 'dating',
  label: '소개팅',
};
```

- [ ] **Step 2: `parseTabFromQuery`의 디폴트 분기 그대로 유지 확인**

`MainViewClient.tsx:55-72`의 `parseTabFromQuery` 함수는 `DEFAULT_TAB`을 그대로 반환하므로 추가 수정 불필요. 단 함수 내 `DEFAULT_TAB` 사용 경로에 카테고리 라벨이 누락되지 않는지 확인.

`parseTabFromQuery`는 URL 쿼리 우선이므로 `?category=dating`이 명시되면 `apiCategories`에서 라벨을 찾고, 없으면 슬러그를 라벨로 폴백. `DEFAULT_TAB`은 라벨 `'소개팅'`을 직접 박아두므로 첫 진입 시 표시 라벨이 즉시 보임.

- [ ] **Step 3: 타입 체크**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: 개발 서버 띄워서 디폴트 진입 확인**

Run: `pnpm start:msw`
브라우저 https://localhost/ 진입 → 첫 화면 탭 바에서 "소개팅" 탭이 활성(`aria-selected="true"`) 상태인지 확인. 카드 영역에 카테고리 슬러그 `dating`으로 fetch가 일어나는지 네트워크 탭에서 확인.

- [ ] **Step 5: 커밋**

```bash
git add src/constants/contentTab.ts
git commit -m "feat(tab): DEFAULT_TAB을 소개팅 카테고리로 변경"
```

---

### Task 4: `ContentTabs` 렌더 순서 변경 — 카테고리 탭을 필터탭 앞으로

**Files:**

- Modify: `src/components/features/Main/ContentTabs/ContentTabs.tsx:60-115`

- [ ] **Step 1: JSX 블록 순서 뒤집기**

`ContentTabs.tsx`의 `<div ref={containerRef} className={styles.tabList}>` 내부를 다음과 같이 변경.

기존 구조:

1. 필터 탭 (NEW/TOP/MY) `.map`
2. 구분자 (categories 있을 때)
3. 카테고리 탭 `.map`

변경 구조:

1. 카테고리 탭 `.map` (먼저)
2. 구분자 (categories 있을 때)
3. 필터 탭 (NEW/TOP/MY) `.map` (나중)

전체 교체본 (return 블록):

```tsx
return (
  <nav
    role="tablist"
    aria-label="콘텐츠 필터"
    className={styles.container}
    data-testid="content-tabs"
  >
    <div ref={containerRef} className={styles.tabList}>
      {/* 카테고리 탭 (소개팅이 첫 위치) */}
      {categories?.map((cat) => {
        const isActive = isTabActive(selectedTab, 'category', cat.slug);
        return (
          <button
            key={cat.slug}
            role="tab"
            type="button"
            aria-selected={isActive}
            data-testid={`content-tab-category-${cat.slug}`}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            onClick={(e) => handleCategoryClick(cat, e)}
          >
            {cat.label}
          </button>
        );
      })}

      {/* 구분자 (카테고리와 필터탭 사이) */}
      {categories && categories.length > 0 && <div className={styles.divider} aria-hidden="true" />}

      {/* 필터 탭: NEW, TOP, 가치관 비교, MY */}
      {FILTER_TABS.map((tab) => {
        const isActive = isTabActive(selectedTab, 'filter', tab.type);

        return (
          <button
            key={tab.type}
            role="tab"
            type="button"
            aria-selected={isActive}
            data-testid={`content-tab-${tab.type}`}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            onClick={(e) => handleFilterClick(tab.type, e)}
          >
            {TAB_ICONS[tab.type]}
            {tab.label}
          </button>
        );
      })}
    </div>
  </nav>
);
```

- [ ] **Step 2: 타입 체크 + 린트**

Run: `npx tsc --noEmit && pnpm lint`
Expected: PASS

- [ ] **Step 3: 개발 서버에서 시각 확인**

Run: `pnpm start:msw`
브라우저 https://localhost/ 진입 → 탭 바 순서가 `[ 소개팅 │ NEW · TOP · 가치관 비교 · MY ]`인지 확인. 첫 화면 활성 탭이 "소개팅"인지 재확인. 가로 스크롤 시작 위치가 소개팅인지도 확인.

- [ ] **Step 4: 커밋**

```bash
git add src/components/features/Main/ContentTabs/ContentTabs.tsx
git commit -m "feat(tab): 카테고리 탭을 필터탭 앞으로 이동, 구분자 위치 재배치"
```

---

### Task 5: `tab.md` 스펙 갱신

**Files:**

- Modify: `docs/specs/pages/tab.md`

- [ ] **Step 1: 탭 바 구조 다이어그램 변경**

`docs/specs/pages/tab.md`의 "레이아웃" 코드 블록을 다음으로 교체:

```
[ 💘 소개팅  │  ✦ NEW   🔥 TOP   ☑ 가치관 비교   ☑ MY ]
```

(이모지는 시각 표현일 뿐, 실제 코드에는 SVG 아이콘 사용)

그리고 "기본 선택" 항목을 다음으로 변경:

```
- 기본 선택: 소개팅 (카테고리 슬러그 `dating`)
- 카테고리 탭이 필터 탭(NEW/TOP/가치관 비교/MY) 앞에 위치
- 구분자(│)는 카테고리 탭과 필터 탭 사이
```

- [ ] **Step 2: 화이트리스트 정책 섹션 추가**

`tab.md` 끝의 Changelog 직전에 다음 섹션 추가:

```markdown
## 카테고리 노출 화이트리스트

탭에 노출할 카테고리는 `src/constants/category.ts`의 `VISIBLE_CATEGORY_SLUGS` 화이트리스트로 통제한다.
운영 DB나 `GET /api/v1/hotpicks/categories` 응답이 어떻든, 이 목록에 있는 슬러그만 탭에 표시된다.

- 현재 화이트리스트: `['dating']`
- 직접 URL 진입(`/?category=love` 등)은 여전히 동작 — SEO·롱테일 검색 유입 보존
- 정책 변경 이력은 [전략 PRD](../../strategy/2026-05-03-content-niche-pivot.md) 참조
```

- [ ] **Step 3: Changelog 한 줄 추가**

`tab.md` 맨 아래 Changelog 섹션 가장 위에 다음 한 줄 추가:

```
- 2026-05-03: 카테고리 정책 c' — 화이트리스트(`VISIBLE_CATEGORY_SLUGS`)로 노출 통제, 디폴트 탭을 "소개팅" 카테고리로 변경, 카테고리 탭을 필터탭 앞으로 이동
```

- [ ] **Step 4: 커밋**

```bash
git add docs/specs/pages/tab.md
git commit -m "docs(spec): tab 스펙 갱신 — 소개팅 디폴트, 화이트리스트 정책"
```

---

### Task 6: `main.md` 스펙 갱신

**Files:**

- Modify: `docs/specs/pages/main.md:32-46`

- [ ] **Step 1: 탭 다이어그램 + 기본값 + API 매핑 갱신**

기존 코드 블록 (33행):

```
[ ✦ NEW   🔥 HOT   ☑ MY  │  연애  결혼  관계  재테크  직장  라이프  트렌드 ]
```

변경:

```
[ 💘 소개팅  │  ✦ NEW   🔥 TOP   ☑ 가치관 비교   ☑ MY ]
```

기존 38행:

```
- 상호 배타적 선택, 기본값: NEW
```

변경:

```
- 상호 배타적 선택, 기본값: 소개팅 (카테고리 슬러그 `dating`)
- 카테고리 탭이 필터 탭(NEW/TOP/가치관 비교/MY) 앞에 위치
```

기존 45-46행:

```
- 카테고리 데이터: `GET /api/v1/hotpicks/categories` API 동적 로드 (폴백: 하드코딩 상수)
- API 응답의 "전체"(`slug: 'all'`) 카테고리는 제외 (NEW 탭이 대체)
```

변경:

```
- 카테고리 데이터: `GET /api/v1/hotpicks/categories` API 동적 로드 (폴백: 하드코딩 상수)
- API 응답의 "전체"(`slug: 'all'`) 카테고리는 제외 (NEW 탭이 대체)
- 추가로 `src/constants/category.ts`의 `VISIBLE_CATEGORY_SLUGS` 화이트리스트로 필터링 — 현재 `['dating']`만 노출
```

- [ ] **Step 2: Changelog 한 줄 추가**

`main.md` 맨 아래 Changelog 섹션 가장 위에 다음 한 줄 추가:

```
- 2026-05-03: 카테고리 정책 c' — 화이트리스트로 "소개팅" 단일 노출, 디폴트 탭 변경, 카테고리 탭을 필터탭 앞으로 이동 (전략 PRD: docs/strategy/2026-05-03-content-niche-pivot.md)
```

- [ ] **Step 3: 커밋**

```bash
git add docs/specs/pages/main.md
git commit -m "docs(spec): main 스펙 갱신 — 소개팅 디폴트, 화이트리스트 정책"
```

---

### Task 7: 탭 E2E 테스트 갱신 — `qa/tab/tab.spec.ts`

**Files:**

- Modify: `qa/tab/tab.spec.ts`

- [ ] **Step 1: "페이지 진입 시 NEW 탭이 기본 선택" 테스트를 소개팅 디폴트로 변경**

기존 (19행 근처):

```ts
test('페이지 진입 시 NEW 탭이 기본 선택되어 있다', async () => {
  await expect(tab.newTab).toHaveAttribute('aria-selected', 'true');
});
```

변경:

```ts
test('페이지 진입 시 소개팅 카테고리 탭이 기본 선택되어 있다', async () => {
  // 카테고리 API 로딩 대기
  await tab.page.waitForTimeout(2_000);
  const datingTab = tab.categoryTab('dating');
  await expect(datingTab).toHaveAttribute('aria-selected', 'true');
  // NEW 탭은 활성이 아니어야 함
  await expect(tab.newTab).toHaveAttribute('aria-selected', 'false');
});
```

- [ ] **Step 2: "필터탭과 카테고리탭이 하나의 탭 바에 표시된다" 테스트의 기대 카운트 갱신**

기존 (37-48행 근처):

```ts
test('필터탭(NEW/HOT/MY)과 카테고리탭이 하나의 탭 바에 표시된다', async () => {
  await expect(tab.newTab).toBeVisible();
  await expect(tab.hotTab).toBeVisible();
  await expect(tab.myTab).toBeVisible();

  // 카테고리 API 로딩 대기
  await tab.page.waitForTimeout(2_000);

  // 카테고리탭도 같은 탭 바 안에 존재
  const allTabs = await tab.allTabs.count();
  expect(allTabs).toBeGreaterThanOrEqual(3); // NEW + HOT + MY + (카테고리들)
});
```

변경:

```ts
test('필터탭(NEW/TOP/MY)과 소개팅 카테고리탭이 하나의 탭 바에 표시된다', async () => {
  await expect(tab.newTab).toBeVisible();
  await expect(tab.hotTab).toBeVisible();
  await expect(tab.myTab).toBeVisible();

  // 카테고리 API 로딩 대기
  await tab.page.waitForTimeout(2_000);

  // 화이트리스트 정책으로 소개팅 카테고리 1개만 노출
  await expect(tab.categoryTab('dating')).toBeVisible();

  // 기존 카테고리(연애·결혼·관계 등)는 화이트리스트로 숨김 — 탭에 보이지 않아야 함
  await expect(tab.categoryTab('love')).toHaveCount(0);
  await expect(tab.categoryTab('marriage')).toHaveCount(0);
});
```

- [ ] **Step 3: "NEW 탭 클릭 시 최신순" 테스트는 동작 그대로 유지 (디폴트만 바뀜)**

기존 65-72행은 `tab.clickTab(tab.hotTab)` → `tab.clickTab(tab.newTab)` 시나리오라 디폴트 변경에 영향 없음. **수정 불필요.**

- [ ] **Step 4: E2E 실행**

Run: `pnpm e2e qa/tab/tab.spec.ts`
Expected: 변경된 두 테스트가 PASS, 나머지도 PASS. 실패 시 디폴트 탭 가정이 남아있는 부분 추가 점검.

- [ ] **Step 5: 커밋**

```bash
git add qa/tab/tab.spec.ts
git commit -m "test(tab): 디폴트 탭을 소개팅으로 변경, 화이트리스트 검증 추가"
```

---

### Task 8: 탭 URL 쿼리 E2E 갱신 — `qa/tab/tab-query-persistence.spec.ts`

**Files:**

- Modify: `qa/tab/tab-query-persistence.spec.ts`

- [ ] **Step 1: 파일 전체 읽고 디폴트 가정 점검**

먼저 파일 전체 읽기:

Run: 파일 열어서 `?filter=new`나 "기본"이라는 단어가 있는 테스트 식별. 디폴트 탭이 NEW라는 가정에 의존하는 테스트만 추출.

- [ ] **Step 2: 디폴트 가정 테스트만 갱신**

URL `/`(쿼리 없음) 진입 시 활성 탭이 NEW라고 가정하는 테스트가 있다면, 다음 패턴으로 변경.

Before:

```ts
await tab.goto('/');
await expect(tab.newTab).toHaveAttribute('aria-selected', 'true');
```

After:

```ts
await tab.goto('/');
await tab.page.waitForTimeout(2_000); // 카테고리 API 대기
await expect(tab.categoryTab('dating')).toHaveAttribute('aria-selected', 'true');
```

URL `?filter=new`나 `?category=love` 등 명시된 쿼리로 진입하는 테스트는 변경 불필요 — `parseTabFromQuery`가 쿼리를 우선하므로 디폴트 변경 영향 없음.

- [ ] **Step 3: E2E 실행**

Run: `pnpm e2e qa/tab/tab-query-persistence.spec.ts`
Expected: PASS

- [ ] **Step 4: 커밋**

```bash
git add qa/tab/tab-query-persistence.spec.ts
git commit -m "test(tab): URL 쿼리 디폴트 가정을 소개팅으로 변경"
```

---

### Task 9: 메인 E2E 디폴트 탭 가정 점검 — `qa/main/main.spec.ts`

**Files:**

- Read + Modify (필요 시): `qa/main/main.spec.ts`

- [ ] **Step 1: 파일 읽기 + 디폴트 가정 의존 테스트 식별**

Run: 파일 열어서 `tab.newTab` 또는 `aria-selected.*true` 와 결합된 디폴트 탭 가정 테스트 식별. 메인 카드 그리드 테스트 위주라 디폴트 영향 적을 가능성 높음.

- [ ] **Step 2: 영향 있을 시에만 갱신**

영향이 없으면 변경 불필요. 영향 있는 케이스 발견 시 Task 8과 동일 패턴(`tab.categoryTab('dating')`)으로 갱신.

- [ ] **Step 3: E2E 실행**

Run: `pnpm e2e qa/main/main.spec.ts`
Expected: PASS

- [ ] **Step 4: 변경 시에만 커밋**

```bash
git add qa/main/main.spec.ts
git commit -m "test(main): 디폴트 탭 변경 영향 반영"
```

---

### Task 10: QA 체크리스트 갱신 — `qa/main/checklist.md`, `qa/tab/checklist.md`

**Files:**

- Modify: `qa/tab/checklist.md`
- Modify: `qa/main/checklist.md`

- [ ] **Step 1: `qa/tab/checklist.md` 갱신**

체크리스트의 "기본 선택" / "디폴트" / "탭 순서" 관련 항목을 다음 패턴으로 변경.

Before:

```
- [ ] 페이지 진입 시 NEW 탭이 기본 선택된다
- [ ] 탭 바 구조: [ NEW · HOT · MY │ 연애 · 결혼 · ... ]
```

After:

```
- [ ] 페이지 진입 시 소개팅(`dating`) 카테고리 탭이 기본 선택된다
- [ ] 탭 바 구조: [ 소개팅 │ NEW · TOP · 가치관 비교 · MY ]
- [ ] 화이트리스트 정책 — `VISIBLE_CATEGORY_SLUGS = ['dating']`이라 다른 카테고리(연애·결혼 등)는 탭에 보이지 않는다
- [ ] 직접 URL 진입(`/?category=love`)은 여전히 동작한다 (SEO 보존)
```

- [ ] **Step 2: `qa/main/checklist.md` 갱신**

체크리스트의 "메인 진입 시 첫 화면" 관련 항목을 다음 패턴으로 변경.

Before:

```
- [ ] 메인 진입 시 NEW 탭이 활성화된다
```

After:

```
- [ ] 메인 진입 시 소개팅 탭이 활성화되고 `dating` 카테고리 카드가 표시된다
- [ ] 소개팅 카드가 0건이면 빈 상태 메시지("'소개팅' 핫픽이 없어요" 또는 "'소개팅' 카테고리에 핫픽이 등록되면 표시됩니다.")가 보인다
```

- [ ] **Step 3: 커밋**

```bash
git add qa/main/checklist.md qa/tab/checklist.md
git commit -m "docs(qa): 체크리스트를 소개팅 디폴트 + 화이트리스트 정책으로 갱신"
```

---

### Task 11: 수동 통합 검증 — 개발 서버에서 시나리오 점검

**Files:** 없음 (브라우저 검증)

- [ ] **Step 1: 개발 서버 띄우기**

Run: `pnpm start:msw`

- [ ] **Step 2: 시나리오 1 — 디폴트 진입**

브라우저 https://localhost/ 접속 → 다음 모두 확인:

- 탭 바 첫 번째 위치에 "소개팅" 탭
- "소개팅" 탭의 `aria-selected="true"`
- 기존 카테고리(연애·결혼·관계·재테크·직장·라이프·트렌드)는 탭에 보이지 않음
- 카드 영역에 `category=dating`으로 fetch가 일어남 (네트워크 탭 확인)
- 카드 0건이면 빈 상태 메시지 노출

- [ ] **Step 3: 시나리오 2 — 탭 전환**

NEW 탭 클릭 → URL이 `/?filter=new`로 변경, 카드 fetch가 `sort=latest&filter=new`로 이루어짐 → 다시 소개팅 탭 클릭 → URL이 `/?category=dating`로 변경, 활성 표시 정상.

- [ ] **Step 4: 시나리오 3 — 직접 URL 진입(SEO 동작)**

브라우저 https://localhost/?category=love 접속 → 다음 확인:

- 카드 영역에 `category=love` fetch가 일어남
- 탭 바에서 "연애" 탭이 활성 표시되거나(라벨 폴백), 화이트리스트로 안 보이지만 활성 슬러그 자체는 URL과 일치
- (탭 바에 안 보이는 카테고리도 활성 상태가 표시되도록 디자인이 의도하는지 추가 확인 — 필요 시 별도 후속 이슈로 분리)

- [ ] **Step 5: 시나리오 4 — 가로 스크롤**

탭 바를 가로로 스크롤해 첫 위치가 소개팅인지, 끝이 MY인지 확인. 스크롤바 숨김·스무스 스크롤 정상 동작 확인.

- [ ] **Step 6: 시나리오 5 — 모바일 뷰포트**

DevTools에서 모바일 뷰포트(375px)로 변경 → 탭 바 가로 스크롤 정상, 첫 진입 시 소개팅 활성 확인.

- [ ] **Step 7: 발견 이슈 정리**

위 시나리오에서 발견된 이슈를 별도 메모로 정리. 작은 이슈는 즉시 수정, 큰 이슈는 후속 PR로 분리.

- [ ] **Step 8: 수동 검증 통과 확정**

위 시나리오 모두 PASS면 다음 단계 진행. FAIL 시 해당 Task로 돌아가 수정.

---

### Task 12: 최종 빌드 + E2E 전체 + PR 정리

**Files:** 없음 (빌드·테스트 실행)

- [ ] **Step 1: 빌드 통과 확인**

Run: `pnpm build`
Expected: 성공. `next build` 산출물 정상.

- [ ] **Step 2: 린트 + 타입 체크**

Run: `pnpm lint && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: 영향 영역 E2E 전체 실행**

Run: `pnpm e2e qa/tab/ qa/main/`
Expected: PASS

- [ ] **Step 4: 커밋 히스토리 정리**

`git log --oneline` 확인. 본 작업의 모든 커밋이 의미 단위로 분리돼 있는지 확인. 필요 시 squash 검토 (사용자 승인 받은 후에만).

- [ ] **Step 5: PR 생성 (사용자 승인 후)**

PR 제목: `feat(tab): 소개팅 카테고리 단일 노출 + 디폴트 탭 변경 (콘텐츠 니치 피벗)`
PR 본문: 전략 PRD 링크 + 변경 요약 + 수동 검증 시나리오 결과.

---

## 실패 시 회피 시나리오

### 회피 1 — `parseTabFromQuery` 디폴트 라벨 누락

**증상**: 첫 진입 시 탭 라벨이 비어있거나 "dating"으로 표시.
**원인**: `DEFAULT_TAB`의 `label`이 빈 문자열이거나 `apiCategories` 응답이 아직 도착 전.
**조치**: `DEFAULT_TAB`에 `label: '소개팅'`을 명시적으로 박아둠 (Task 3 Step 1 그대로). API 응답 도착 후 `parseTabFromQuery`가 더 정확한 라벨로 덮어쓰는 흐름 정상.

### 회피 2 — 화이트리스트가 빈 배열일 때 탭에서 카테고리 자체가 사라짐

**증상**: `VISIBLE_CATEGORY_SLUGS = []`로 두면 디폴트 진입은 dating인데 탭에 dating 자체가 안 보임.
**원인**: `dynamicCategories`가 빈 배열로 계산되어 `ContentTabs`의 `categories?.map`이 0개 렌더.
**조치**: 본 작업에서는 `['dating']`이 항상 들어가 있도록 박는다. 화이트리스트가 빈 배열인 케이스는 본 작업 범위 외 — 정책 폐기 시 별도 후속 작업.

### 회피 3 — 직접 URL `/?category=love` 진입 시 탭 활성 표시가 어색

**증상**: URL은 `?category=love`인데 탭 바에 "연애"가 안 보이니 활성 탭 표시가 없는 듯 보임.
**원인**: 화이트리스트로 "연애" 탭 자체가 렌더 안 됨. `parseTabFromQuery`는 활성 슬러그 `love`를 정확히 잡지만 시각적으론 활성 탭 부재.
**조치**: 본 작업에서는 SEO 동작만 보존(라우팅·API·카드 로드는 정상). 활성 탭 시각 표시까지 살리고 싶다면 후속 이슈로 "활성 카테고리는 화이트리스트와 무관하게 항상 표시"하는 정책 추가 검토.

---

## Self-Review 체크리스트 (계획 작성자용)

- [x] 전략 PRD의 카테고리 정책 c'에 명시된 모든 변경 사항이 Task로 매핑됨 (폴백·화이트리스트·디폴트·탭 순서·스펙·QA·E2E)
- [x] 모든 Task에 정확한 파일 경로와 라인 번호 또는 식별자 명시
- [x] 모든 Task에 실제 코드(또는 정확한 변경 텍스트) 포함, 플레이스홀더 없음
- [x] 모든 Task의 커밋 메시지 명시
- [x] 타입 시그니처·상수명·슬러그가 Task 간에 일관 (`VISIBLE_CATEGORY_SLUGS`, `dating`, `'소개팅'`)
- [x] 수동 검증 단계 포함 (Task 11)
- [x] 회피 시나리오 명시
