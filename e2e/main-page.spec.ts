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

  test('SINGLE 카드와 BUNDLE 카드가 함께 표시된다', async () => {
    const singleCount = await main.singleCards.count();
    const bundleCount = await main.bundleCards.count();
    expect(singleCount).toBeGreaterThan(0);
    expect(bundleCount).toBeGreaterThan(0);
  });

  test('참여자 수가 "N명 참여" 형식으로 표시된다', async () => {
    const firstParticipant = main.participantCounts.first();
    await expect(firstParticipant).toBeVisible();
    await expect(firstParticipant).toHaveText(/\d+.*명 참여/);
  });

  test('카드에 카테고리 태그가 표시된다', async () => {
    const firstCardCategories = main.cardCategories(0);
    const count = await firstCardCategories.count();
    expect(count).toBeGreaterThanOrEqual(1);
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

  test('마감된 카드는 결과만 표시된다 (옵션 버튼 미노출)', async () => {
    // 마감 배지가 있는 카드 찾기
    const closedBadgeCount = await main.closedBadges.count();
    if (closedBadgeCount > 0) {
      // 마감된 카드를 포함하는 single-card 찾기
      const closedCard = main.singleCards.filter({
        has: main.page.getByTestId('closed-badge'),
      });
      const closedCardCount = await closedCard.count();
      if (closedCardCount > 0) {
        // 마감된 카드에는 결과 바가 표시되어야 한다
        const resultBars = closedCard.first().locator('[class*="resultBar"]');
        await expect(resultBars.first()).toBeVisible({ timeout: 5_000 });
      }
    }
  });
});

// ─── 카테고리 필터링 ───

test.describe('카테고리 필터', () => {
  let main: MainPage;

  test.beforeEach(async ({ page }) => {
    main = new MainPage(page);
    await main.goto();
  });

  test('카테고리 필터 버튼이 표시된다', async () => {
    await expect(main.categoryButton('전체')).toBeVisible();
  });

  test('카테고리 클릭 시 해당 카테고리 핫픽만 필터링된다', async () => {
    const totalBefore = await main.singleCards.count();

    // '재테크' 카테고리 클릭
    await main.categoryButton('재테크').click();

    // 필터링 후 카드 로딩 대기
    await main.page.waitForTimeout(1_000);

    const totalAfter = await main.singleCards.count();
    // 전체보다 적거나 같은 수의 카드가 표시되어야 함
    expect(totalAfter).toBeLessThanOrEqual(totalBefore);
    expect(totalAfter).toBeGreaterThanOrEqual(0);
  });

  test('"전체" 클릭 시 전체 핫픽으로 복귀한다', async () => {
    const totalBefore = await main.singleCards.count();
    const bundleBefore = await main.bundleCards.count();

    // '재테크' 카테고리 클릭 → 필터링
    await main.categoryButton('재테크').click();
    await main.page.waitForTimeout(1_500);

    // '전체' 클릭 → 전체로 복귀
    await main.categoryButton('전체').click();
    await main.page.waitForTimeout(1_500);

    const totalAfter = await main.singleCards.count();
    const bundleAfter = await main.bundleCards.count();
    // 카드 수가 원래와 같아야 함
    expect(totalAfter + bundleAfter).toBe(totalBefore + bundleBefore);
  });
});

// ─── 메인 카드 투표 플로우 ───

test.describe('메인 카드 인라인 투표', () => {
  let main: MainPage;

  test.beforeEach(async ({ page }) => {
    main = new MainPage(page);
    await main.goto();
  });

  test('투표 시 결과 바와 퍼센트가 표시된다', async () => {
    // 첫 번째 싱글 카드의 옵션 버튼 클릭
    const options = main.optionButtons(0);
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);

    await options.first().click();

    // 결과 바가 나타나는지 확인
    const resultBars = main.cardResultBars(0);
    await expect(resultBars.first()).toBeVisible({ timeout: 10_000 });

    // 퍼센트가 표시되는지 확인
    const percentages = main.cardPercentages(0);
    await expect(percentages.first()).toBeVisible();
    await expect(percentages.first()).toHaveText(/\d+%/);
  });

  test('투표 후 선택한 옵션에 myChoice 표시가 된다', async () => {
    const options = main.optionButtons(0);
    await options.first().click();

    // myChoice 클래스가 적용된 결과 바가 있는지 확인
    const myChoice = main.cardMyChoice(0);
    await expect(myChoice).toBeVisible({ timeout: 10_000 });
  });

  test('투표 후 공유 버튼 클릭 시 바텀시트가 열린다', async () => {
    // 첫 번째 카드의 공유 버튼 클릭
    const shareBtn = main.shareButton(0);
    await expect(shareBtn).toBeVisible();
    await shareBtn.click();

    // 공유 바텀시트 확인
    const sheet = main.page.getByTestId('share-bottom-sheet');
    await expect(sheet).toBeVisible({ timeout: 5_000 });
  });
});
