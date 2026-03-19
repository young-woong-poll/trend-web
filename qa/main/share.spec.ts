import { test, expect } from '@playwright/test';

import { MainPage } from '../helpers/main-page';

/**
 * 메인페이지 공유하기 — E2E 테스트 (MSW mock 데이터 사용)
 *
 * 체크리스트 대응: qa/main/checklist.md > 공유하기
 */

test.describe('메인 카드 공유하기', () => {
  let main: MainPage;

  test.beforeEach(async ({ page }) => {
    main = new MainPage(page);
    await main.goto();

    // 투표 완료 후 공유 버튼 활성화
    const options = main.optionButtons(0);
    await options.first().click();
    await main.page.waitForTimeout(1_000);
  });

  test('공유하기 버튼을 클릭하면 상세페이지 URL이 복사된다', async () => {
    const shareBtn = main.shareButton(0);
    await expect(shareBtn).toBeVisible({ timeout: 5_000 });
    await shareBtn.click();

    // 클립보드 내용 확인
    const clipboardText = await main.page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('/hotpick/');
  });

  test('"링크가 복사되었습니다" 토스트 메시지가 등장한다', async () => {
    const shareBtn = main.shareButton(0);
    await shareBtn.click();

    const toast = main.page.getByText('링크가 복사되었습니다');
    await expect(toast).toBeVisible({ timeout: 5_000 });
  });
});
