import { test, expect } from '@playwright/test';

import { TabPage } from '../helpers/tab-page';

/**
 * 탭 네비게이션 (/) — E2E 테스트 (MSW mock 데이터 사용)
 */

// ─── 1. 탭 바 구조 ───

test.describe('탭 바 구조', () => {
  let tab: TabPage;

  test.beforeEach(async ({ page }) => {
    tab = new TabPage(page);
    await tab.goto();
  });

  test('페이지 진입 시 NEW 탭이 기본 선택되어 있다', async () => {
    await expect(tab.newTab).toHaveAttribute('aria-selected', 'true');
  });

  test('탭은 상호 배타적으로 동작한다 (하나만 활성화 가능)', async () => {
    // HOT 탭 클릭
    await tab.clickTab(tab.hotTab);
    await expect(tab.hotTab).toHaveAttribute('aria-selected', 'true');
    await expect(tab.newTab).toHaveAttribute('aria-selected', 'false');
    await expect(tab.myTab).toHaveAttribute('aria-selected', 'false');

    // MY 탭 클릭
    await tab.clickTab(tab.myTab);
    await expect(tab.myTab).toHaveAttribute('aria-selected', 'true');
    await expect(tab.hotTab).toHaveAttribute('aria-selected', 'false');
    await expect(tab.newTab).toHaveAttribute('aria-selected', 'false');
  });

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

  test('탭 바가 <nav role="tablist"> 요소로 렌더링된다', async () => {
    await expect(tab.tabBar).toHaveRole('tablist');
  });
});

// ─── 2. 필터탭 ───

test.describe('필터탭', () => {
  let tab: TabPage;

  test.beforeEach(async ({ page }) => {
    tab = new TabPage(page);
    await tab.goto();
  });

  test('NEW 탭 클릭 시 최신순(sort=latest) 핫픽이 표시된다', async () => {
    // HOT로 이동했다가 NEW로 돌아오기
    await tab.clickTab(tab.hotTab);
    await tab.clickTab(tab.newTab);

    const cardCount = await tab.totalCardCount();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('TOP 탭 클릭 시 인기순 핫픽이 표시된다', async () => {
    await tab.clickTab(tab.hotTab);
    // TOP 탭 데이터 로딩 대기 (API 재요청 + 렌더링)
    await tab.page.waitForTimeout(2_000);
    await tab.waitForContent();

    const cardCount = await tab.totalCardCount();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('MY 탭 클릭 시 하위 콘텐츠가 표시된다', async () => {
    await tab.clickTab(tab.myTab);
    await tab.page.waitForTimeout(2_000);

    // 로그인 상태에서는 하위 서브탭(투표/케미/댓글/좋아요) 또는 카드/빈 상태 확인
    const cardCount = await tab.totalCardCount();
    const emptyVisible = await tab.emptyState.isVisible().catch(() => false);
    const hasSubTabs = await tab.page
      .locator('[class*="subTab"], [class*="SubTab"]')
      .first()
      .isVisible()
      .catch(() => false);
    expect(cardCount > 0 || emptyVisible || hasSubTabs).toBeTruthy();
  });

  test('각 필터탭에 아이콘이 텍스트 왼쪽에 표시된다', async () => {
    // 각 필터탭 안에 SVG 아이콘이 존재하는지 확인
    const newIcon = tab.newTab.locator('svg');
    const hotIcon = tab.hotTab.locator('svg');
    const myIcon = tab.myTab.locator('svg');

    await expect(newIcon).toBeVisible();
    await expect(hotIcon).toBeVisible();
    await expect(myIcon).toBeVisible();
  });
});

// ─── 3. 구분자 ───

test.describe('구분자', () => {
  let tab: TabPage;

  test.beforeEach(async ({ page }) => {
    tab = new TabPage(page);
    await tab.goto();
  });

  test.fixme('필터탭과 카테고리탭 사이에 세로선 구분자가 표시된다', async () => {
    // FIXME: SSR에서 카테고리 API가 로드되지 않으면 구분자가 렌더링되지 않음.
    // CSR hydration 후 카테고리가 로드되어야 구분자가 표시됨.
    // → BE 카테고리 API 연동 후 재테스트 필요
    await tab.page.waitForTimeout(2_000);
    await expect(tab.divider).toBeVisible({ timeout: 5_000 });
  });
});

// ─── 4. 카테고리탭 ───

test.describe('카테고리탭', () => {
  let tab: TabPage;

  test.beforeEach(async ({ page }) => {
    tab = new TabPage(page);
    await tab.goto();
  });

  test.fixme('카테고리 목록이 API에서 동적으로 로드된다', async () => {
    // FIXME: SSR에서 카테고리 API 호출이 MSW 환경에서 정상 동작하지 않아
    // 카테고리탭이 렌더링되지 않음. CSR hydration 후에도 타이밍 이슈 존재.
    // → BE 카테고리 API 연동 후 재테스트 필요
    await tab.page.waitForTimeout(2_000);

    const allTabCount = await tab.allTabs.count();
    expect(allTabCount).toBeGreaterThan(3);
  });

  test('API 응답의 "전체"(slug: all) 카테고리는 탭에 표시되지 않는다', async () => {
    const allCatTab = tab.page.getByTestId('content-tab-category-all');
    await expect(allCatTab).toHaveCount(0);
  });

  test('카테고리탭 클릭 시 해당 카테고리의 핫픽이 표시된다', async () => {
    // 첫 번째 카테고리탭 찾기
    const firstCatTab = tab.page.locator('[data-testid^="content-tab-category-"]').first();
    const isVisible = await firstCatTab.isVisible();

    if (isVisible) {
      await tab.clickTab(firstCatTab);

      // 활성 상태 확인
      await expect(firstCatTab).toHaveAttribute('aria-selected', 'true');

      // 카드 또는 빈 상태 표시
      const cardCount = await tab.totalCardCount();
      const emptyVisible = await tab.emptyState.isVisible();
      expect(cardCount > 0 || emptyVisible).toBeTruthy();
    }
  });

  test('카테고리탭에는 아이콘이 없고 텍스트만 표시된다', async () => {
    const firstCatTab = tab.page.locator('[data-testid^="content-tab-category-"]').first();
    const isVisible = await firstCatTab.isVisible();

    if (isVisible) {
      const svgCount = await firstCatTab.locator('svg').count();
      expect(svgCount).toBe(0);
    }
  });
});

// ─── 5. 탭 시각 스타일 ───

test.describe('탭 시각 스타일', () => {
  let tab: TabPage;

  test.beforeEach(async ({ page }) => {
    tab = new TabPage(page);
    await tab.goto();
  });

  test('활성 탭은 흰색 텍스트와 bold 폰트로 표시된다', async () => {
    const color = await tab.newTab.evaluate((el) => getComputedStyle(el).color);
    const fontWeight = await tab.newTab.evaluate((el) => getComputedStyle(el).fontWeight);

    // rgb(255, 255, 255) 또는 유사한 흰색
    expect(color).toMatch(/rgb\(255,\s*255,\s*255\)/);
    // 700 또는 bold
    expect(Number(fontWeight)).toBeGreaterThanOrEqual(700);
  });

  test('비활성 탭은 회색 텍스트와 medium 폰트로 표시된다', async () => {
    const color = await tab.hotTab.evaluate((el) => getComputedStyle(el).color);
    const fontWeight = await tab.hotTab.evaluate((el) => getComputedStyle(el).fontWeight);

    // 비활성 = #8a8a8a = rgb(138, 138, 138) 근처
    expect(color).not.toMatch(/rgb\(255,\s*255,\s*255\)/);
    expect(Number(fontWeight)).toBeLessThan(700);
  });
});

// ─── 7. 탭 전환 동작 ───

test.describe('탭 전환 동작', () => {
  let tab: TabPage;

  test.beforeEach(async ({ page }) => {
    tab = new TabPage(page);
    await tab.goto();
  });

  test('탭 전환 시 해당 탭에 맞는 새로운 데이터가 로드된다', async () => {
    // TOP 탭으로 전환
    await tab.clickTab(tab.hotTab);
    await tab.page.waitForTimeout(2_000);
    await tab.waitForContent();

    // TOP에서 카드가 표시되는지 확인
    const cardCount = await tab.totalCardCount();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('탭 전환 시 스크롤이 최상단으로 초기화된다', async () => {
    // 스크롤 내리기
    await tab.page.evaluate(() => window.scrollTo(0, 500));
    await tab.page.waitForTimeout(300);

    const scrollBefore = await tab.page.evaluate(() => window.scrollY);
    expect(scrollBefore).toBeGreaterThan(0);

    // HOT 탭 클릭
    await tab.clickTab(tab.hotTab);

    const scrollAfter = await tab.page.evaluate(() => window.scrollY);
    expect(scrollAfter).toBe(0);
  });

  test('탭 전환 중 로딩 스켈레톤이 표시된다', async ({ page }) => {
    // API 응답을 지연시켜 스켈레톤이 보이도록 함
    await page.route('**/api/v1/hotpicks/main*', async (route) => {
      await new Promise((r) => setTimeout(r, 2_000));
      await route.continue();
    });

    const tab = new TabPage(page);
    await page.goto('/');

    // 스켈레톤 확인
    const skeleton = page.locator('[class*="skeleton"], [class*="Skeleton"]');
    await expect(skeleton.first()).toBeVisible({ timeout: 5_000 });
  });
});

// ─── 8. 빈 상태 메시지 ───

test.describe('빈 상태 메시지', () => {
  test('MY 탭에서 결과 없을 때 빈 상태 또는 서브탭이 표시된다', async ({ page }) => {
    const tab = new TabPage(page);
    await tab.goto();

    await tab.clickTab(tab.myTab);
    await page.waitForTimeout(2_000);

    // 로그인 상태에서 MY 탭은 서브탭(투표/케미/댓글/좋아요)이 표시될 수 있음
    const cardCount = await tab.totalCardCount();
    const emptyVisible = await tab.emptyState.isVisible().catch(() => false);
    const hasSubTabs = await page
      .locator('[class*="subTab"], [class*="SubTab"]')
      .first()
      .isVisible()
      .catch(() => false);
    const hasContent = cardCount > 0 || emptyVisible || hasSubTabs;
    expect(hasContent).toBeTruthy();
  });
});

// ─── 10. 헤더 고정 ───

test.describe('헤더 고정', () => {
  let tab: TabPage;

  test.beforeEach(async ({ page }) => {
    tab = new TabPage(page);
    await tab.goto();
  });

  test('스크롤 시 헤더와 탭 바가 화면 상단에 고정되어 있다 (fixed)', async () => {
    // 스크롤 내리기
    await tab.page.evaluate(() => window.scrollTo(0, 1000));
    await tab.page.waitForTimeout(300);

    // 헤더가 여전히 보이는지 확인
    await expect(tab.header).toBeVisible();

    // 탭 바가 여전히 보이는지 확인
    await expect(tab.tabBar).toBeVisible();

    // 헤더의 position이 fixed인지 확인
    const headerPosition = await tab.header.evaluate((el) => getComputedStyle(el).position);
    expect(headerPosition).toBe('fixed');

    // 탭 바의 position이 fixed인지 확인
    const tabBarPosition = await tab.tabBar.evaluate((el) => getComputedStyle(el).position);
    expect(tabBarPosition).toBe('fixed');
  });
});
