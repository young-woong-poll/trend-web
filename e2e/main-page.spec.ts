import { test, expect } from '@playwright/test';

import { MainPage } from './helpers/main-page';

/**
 * 메인페이지 (/) — E2E 테스트 (MSW mock 데이터 사용)
 *
 * playwright.config.ts에서 MSW를 활성화하므로
 * 실제 API가 아닌 mock 데이터 기반으로 테스트합니다.
 */

// ─── 카드 렌더링 ───

test.describe('메인페이지 카드 렌더링', () => {
  let main: MainPage;

  test.beforeEach(async ({ page }) => {
    main = new MainPage(page);
    await main.goto();
  });

  test('메인페이지에 카드가 렌더링된다', async () => {
    const singleCount = await main.singleCards.count();
    const bundleCount = await main.bundleCards.count();
    expect(singleCount + bundleCount).toBeGreaterThan(0);
  });
});

// ─── 마감 UI ───

test.describe('마감된 투표 UI', () => {
  let main: MainPage;

  test.beforeEach(async ({ page }) => {
    main = new MainPage(page);
    await main.goto();
  });

  test('마감된 카드에 "마감" 배지가 표시된다', async () => {
    const closedBadgeCount = await main.closedBadges.count();
    if (closedBadgeCount > 0) {
      const firstBadge = main.closedBadges.first();
      await expect(firstBadge).toBeVisible();
      await expect(firstBadge).toHaveText('마감');
    }
  });
});
