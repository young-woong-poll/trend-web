import { test, expect } from '@playwright/test';

import { MainPage } from './helpers/main-page';

/**
 * 메인페이지 (/) — read-only E2E 테스트
 *
 * 실제 beta API 사용. write 동작(투표, 댓글 CRUD)은 테스트하지 않음.
 * 마감 UI + topComment 미리보기 검증.
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

  test('마감된 SingleCard에 "마감" 배지가 표시된다', async () => {
    // 마감 배지가 있는 카드가 존재하면 검증
    const closedBadgeCount = await main.closedBadges.count();
    if (closedBadgeCount > 0) {
      const firstBadge = main.closedBadges.first();
      await expect(firstBadge).toBeVisible();
      await expect(firstBadge).toHaveText('마감');
    }
  });

  test('마감된 SingleCard는 결과 바가 표시되고 투표 버튼이 미노출', async () => {
    const closedBadgeCount = await main.closedBadges.count();
    if (closedBadgeCount > 0) {
      // 마감 배지가 있는 첫 번째 카드 찾기
      const closedCard = main.closedBadges.first().locator('ancestor::[class*="SingleCard_card"]');
      // 해당 카드 내 결과 바 확인
      const resultBars = closedCard.locator('[class*="resultBar"]');
      const optionButtons = closedCard.locator('[class*="optionButton"]');

      expect(await resultBars.count()).toBeGreaterThan(0);
      expect(await optionButtons.count()).toBe(0);
    }
  });

  test('마감된 BundleCard에 "마감" 배지가 표시된다', async () => {
    const bundleClosedCount = await main.bundleClosedBadges.count();
    if (bundleClosedCount > 0) {
      const firstBadge = main.bundleClosedBadges.first();
      await expect(firstBadge).toBeVisible();
      await expect(firstBadge).toHaveText('마감');
    }
  });
});

// ─── topComment 미리보기 ───

test.describe('topComment 미리보기', () => {
  let main: MainPage;

  test.beforeEach(async ({ page }) => {
    main = new MainPage(page);
    await main.goto();
  });

  test('topComment가 있는 카드에 미리보기가 표시된다', async () => {
    const previewCount = await main.topCommentPreviews.count();
    if (previewCount > 0) {
      const firstPreview = main.topCommentPreviews.first();
      await expect(firstPreview).toBeVisible();

      // 닉네임 + 댓글 내용이 존재하는지 확인
      const nickname = firstPreview.locator('[class*="topCommentNickname"]');
      const text = firstPreview.locator('[class*="topCommentText"]');
      await expect(nickname).toBeVisible();
      await expect(text).toBeVisible();
    }
  });

  test('topComment 클릭 시 댓글 바텀시트가 열린다', async () => {
    const previewCount = await main.topCommentPreviews.count();
    if (previewCount > 0) {
      await main.topCommentPreviews.first().click();

      // 바텀시트가 열리는지 확인
      await expect(main.commentBottomSheet).toBeVisible({ timeout: 5_000 });
    }
  });
});
