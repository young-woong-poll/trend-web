import type { Page, Locator } from '@playwright/test';

export class BundlePlayPage {
  readonly page: Page;

  // 프로그레스 바
  readonly topBar: Locator;
  readonly progressLabel: Locator;
  readonly progressSteps: Locator;

  // 질문 카드
  readonly questionNumber: Locator;
  readonly questionText: Locator;
  readonly backButton: Locator;
  readonly optionButtons: Locator;
  readonly orDivider: Locator;

  // 제출
  readonly submitButton: Locator;

  // 로딩
  readonly loadingSpinner: Locator;
  readonly loadingText: Locator;

  constructor(page: Page) {
    this.page = page;

    this.topBar = page.locator('[class*="topBar"]');
    this.progressLabel = page.locator('[class*="label"]').first();
    this.progressSteps = page.locator('[class*="step"]');

    this.questionNumber = page.locator('[class*="questionNumber"]');
    this.questionText = page.locator('h2');
    this.backButton = page.getByRole('button', { name: '이전 질문' });
    this.optionButtons = page.locator('button[class*="option"]');
    this.orDivider = page.locator('[class*="or"]');

    this.submitButton = page.locator('[class*="submitButton"]');

    this.loadingSpinner = page.locator('[class*="loadingSpinner"]');
    this.loadingText = page.locator('[class*="loading"]');
  }

  /** 번들 플레이 페이지로 이동 */
  async goto(slug: string) {
    await this.page.goto(`/bundle/${slug}/play`);
    // 질문 카드가 보일 때까지 대기 (MSW race condition 대응)
    const hasQuestion = await this.page
      .waitForFunction(() => document.querySelector('[class*="questionNumber"]') !== null, {
        timeout: 10_000,
      })
      .then(() => true)
      .catch(() => false);

    if (!hasQuestion) {
      // MSW Service Worker가 아직 활성화되지 않은 경우 리로드
      await this.page.reload();
      await this.page.waitForFunction(
        () => document.querySelector('[class*="questionNumber"]') !== null,
        { timeout: 15_000 }
      );
    }
  }

  /** 옵션 A 클릭 */
  async selectOptionA() {
    const optionA = this.optionButtons.first();
    await optionA.waitFor({ state: 'visible', timeout: 5_000 });
    await optionA.click();
  }

  /** 옵션 B 클릭 */
  async selectOptionB() {
    const optionB = this.optionButtons.nth(1);
    await optionB.waitFor({ state: 'visible', timeout: 5_000 });
    await optionB.click();
  }

  /** 모든 질문에 A로 답변하고 제출 */
  async answerAllAndSubmit(totalQuestions: number) {
    for (let i = 0; i < totalQuestions; i++) {
      // 질문 카드가 보일 때까지 대기
      await this.questionNumber.waitFor({ state: 'visible', timeout: 5_000 });

      if (i < totalQuestions - 1) {
        // 마지막 질문 전: 옵션 클릭 → 자동 이동 대기
        await this.selectOptionA();
        await this.page.waitForTimeout(600); // 전환 애니메이션 대기
      } else {
        // 마지막 질문: 옵션 클릭 → 제출 버튼 클릭
        await this.selectOptionA();
        await this.submitButton.waitFor({ state: 'visible', timeout: 5_000 });
        await this.submitButton.click();
      }
    }
  }

  /** 현재 질문 번호 텍스트 가져오기 */
  async getCurrentQuestionNumber(): Promise<string> {
    return (await this.questionNumber.textContent()) ?? '';
  }
}
