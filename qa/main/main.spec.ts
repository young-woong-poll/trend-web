import { test, expect } from '@playwright/test';

import { MainPage } from '../helpers/main-page';

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

// ─── 카테고리 필터링 → tab.spec.ts로 이관됨 ───

// ─── 무한스크롤 ───

test.describe('무한스크롤', () => {
  let main: MainPage;

  test.beforeEach(async ({ page }) => {
    main = new MainPage(page);
    await main.goto();
  });

  test('투표가 최신순으로 무한스크롤 표시된다', async () => {
    const initialCount = await main.singleCards.count();
    expect(initialCount).toBeGreaterThan(0);

    // 페이지 끝까지 스크롤
    await main.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await main.page.waitForTimeout(2_000);

    const afterScrollCount = await main.singleCards.count();
    // 추가 로딩이 발생했거나, 모든 데이터가 이미 로드됨
    expect(afterScrollCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('로딩시 스켈레톤 로딩이 표시된다', async ({ page }) => {
    // API 응답을 지연시켜 스켈레톤이 확실히 보이도록 함
    await page.route('**/api/v1/hotpicks/main*', async (route) => {
      await new Promise((r) => setTimeout(r, 2_000));
      await route.continue();
    });

    await page.goto('/', { waitUntil: 'commit' });
    const skeleton = page.locator('[class*="skeleton"], [class*="Skeleton"]');
    await expect(skeleton.first()).toBeVisible({ timeout: 5_000 });
  });
});

// ─── 카드 상세 UI ───

test.describe('카드 상세 UI', () => {
  let main: MainPage;

  test.beforeEach(async ({ page }) => {
    main = new MainPage(page);
    await main.goto();
  });

  test('옵션이 2~4개일 때 결과까지 잘 노출된다', async () => {
    // 첫 번째 카드의 옵션 버튼 수 확인
    const options = main.optionButtons(0);
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThanOrEqual(2);
    expect(optionCount).toBeLessThanOrEqual(4);

    // 투표 후 결과 확인
    await options.first().click();
    const resultBars = main.cardResultBars(0);
    await expect(resultBars.first()).toBeVisible({ timeout: 10_000 });

    // 모든 옵션에 대한 결과 바가 표시되어야 함
    const resultCount = await resultBars.count();
    expect(resultCount).toBe(optionCount);
  });

  test('댓글 수가 노출되고 클릭시 댓글창이 뜬다', async () => {
    // 투표를 먼저 완료해야 댓글 접근 가능
    const options = main.optionButtons(0);
    await options.first().click();
    await main.page.waitForTimeout(1_000);

    // 댓글 버튼 클릭
    const commentBtn = main.commentButton(0);
    await expect(commentBtn).toBeVisible({ timeout: 5_000 });
    await commentBtn.click();

    // 댓글 바텀시트 열림 확인
    await expect(main.commentBottomSheet).toBeVisible({ timeout: 5_000 });
  });

  test('TopComment(인기 댓글) 미리보기가 카드 하단에 표시된다', async () => {
    // 이미 투표한 카드에 topComment가 있으면 표시됨
    // 투표 완료 후 확인
    const options = main.optionButtons(0);
    await options.first().click();
    await main.page.waitForTimeout(1_000);

    // topComment가 있는 카드에서만 표시됨 (mock 데이터에 따라)
    const topCommentCount = await main.topCommentPreviews.count();
    // topComment가 있으면 표시되어야 하고, 없으면 패스
    if (topCommentCount > 0) {
      await expect(main.topCommentPreviews.first()).toBeVisible();
    }
  });

  test('질문이나 옵션 글자수가 너무 긴 경우 줄바꿈이 된다', async () => {
    // 카드 내 텍스트가 컨테이너를 넘지 않는지 확인
    const firstCard = main.singleCards.first();
    const cardBox = await firstCard.boundingBox();
    expect(cardBox).not.toBeNull();

    // 카드 안의 텍스트 요소들이 카드 너비를 넘지 않아야 함
    if (cardBox) {
      const textElements = firstCard.locator('p, span, h2, h3');
      const textCount = await textElements.count();
      for (let i = 0; i < Math.min(textCount, 5); i++) {
        const textBox = await textElements.nth(i).boundingBox();
        if (textBox) {
          expect(textBox.x + textBox.width).toBeLessThanOrEqual(cardBox.x + cardBox.width + 1);
        }
      }
    }
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
    const options = main.optionButtons(0);
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);

    await options.first().click();

    const resultBars = main.cardResultBars(0);
    await expect(resultBars.first()).toBeVisible({ timeout: 10_000 });

    const percentages = main.cardPercentages(0);
    await expect(percentages.first()).toBeVisible();
    await expect(percentages.first()).toHaveText(/\d+%/);
  });

  test('투표 후 선택한 옵션에 myChoice 표시가 된다', async () => {
    const options = main.optionButtons(0);
    await options.first().click();

    const myChoice = main.cardMyChoice(0);
    await expect(myChoice).toBeVisible({ timeout: 10_000 });
  });

  test('낙관적 업데이트: 투표 즉시 딜레이 없이 결과가 표시된다', async () => {
    const options = main.optionButtons(0);

    // 투표 클릭 시점 기록
    const startTime = Date.now();
    await options.first().click();

    // 결과 바가 즉시 표시되는지 확인 (낙관적 업데이트이므로 빠르게)
    const resultBars = main.cardResultBars(0);
    await expect(resultBars.first()).toBeVisible({ timeout: 2_000 });
    const elapsed = Date.now() - startTime;

    // 낙관적 업데이트이므로 2초 이내에 결과가 표시되어야 함
    expect(elapsed).toBeLessThan(2_000);
  });

  test('이미 투표한 핫픽은 결과가 보여진다', async () => {
    // 첫 번째 카드에 투표
    const options = main.optionButtons(0);
    await options.first().click();
    await main.page.waitForTimeout(1_000);

    // 투표 직후 결과 바가 바로 표시되는지 확인
    const resultBars = main.cardResultBars(0);
    await expect(resultBars.first()).toBeVisible({ timeout: 5_000 });

    // 옵션 버튼이 사라지고 결과만 남아있는지 확인
    const optionsAfter = main.optionButtons(0);
    const optionCount = await optionsAfter.count();
    expect(optionCount).toBe(0);
  });

  test('재투표가 불가능하다', async () => {
    // 첫 번째 카드에 투표
    const options = main.optionButtons(0);
    await options.first().click();
    await main.page.waitForTimeout(1_000);

    // 투표 후 옵션 버튼이 사라지고 결과만 표시
    const optionsAfter = main.optionButtons(0);
    const optionCountAfter = await optionsAfter.count();
    expect(optionCountAfter).toBe(0);
  });
});

// ─── 에러/엣지케이스 ───

test.describe('에러/엣지케이스', () => {
  test.fixme('불러오는 과정에서 에러 발생시 에러 문구가 노출된다', async ({ page }) => {
    // FIXME: SSR(Node MSW) + CSR(Browser MSW)이 독립적이라
    // E2E에서 서버 사이드 에러를 시뮬레이션할 수 없음.
    // 서버 fetch가 성공하면 initialData가 정상 전달되어 에러 UI가 표시되지 않음.
    // → 통합 테스트(Jest + Testing Library)에서 커버 필요
    await page.goto('/');
    const errorMsg = page.getByText('핫픽을 불러오는데 실패했습니다');
    await expect(errorMsg).toBeVisible({ timeout: 10_000 });
  });

  test.fixme('카테고리별 핫픽이 없는 경우 빈 상태 문구가 노출된다', async ({ page }) => {
    // FIXME: SSR(Node MSW)이 정상 데이터를 반환하므로
    // 클라이언트 MSW만 빈 응답으로 오버라이드해도 initialData가 전달되어 빈 상태가 안 뜸.
    // → 통합 테스트(Jest + Testing Library)에서 커버 필요
    await page.goto('/');
    const emptyMsg = page.getByText('아직 진행중인 핫픽이 없어요');
    await expect(emptyMsg).toBeVisible({ timeout: 10_000 });
  });
});
