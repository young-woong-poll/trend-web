import type { Page, Locator } from '@playwright/test';

export class CompareLandingPage {
  readonly page: Page;

  // 헤더
  readonly resultTitle: Locator;

  // 히어로
  readonly heroTitle: Locator;
  readonly heroSubtitle: Locator;
  readonly highlight: Locator;

  // 봉인 해제
  readonly unsealSection: Locator;
  readonly unsealText: Locator;

  // 질문 미리보기
  readonly questionPreview: Locator;
  readonly questionLabel: Locator;
  readonly questionTitle: Locator;
  readonly questionOptions: Locator;
  readonly questionMore: Locator;

  // CTA
  readonly ctaButton: Locator;

  // 이미 참여된 링크
  readonly takenSection: Locator;
  readonly takenGuideMain: Locator;
  readonly takenNotice: Locator;

  // 에러
  readonly notFoundText: Locator;

  // 로딩
  readonly loading: Locator;

  constructor(page: Page) {
    this.page = page;

    this.resultTitle = page.locator('[class*="resultTitle"]');

    this.heroTitle = page.locator('[class*="heroTitle"]');
    this.heroSubtitle = page.locator('[class*="heroSubtitle"]');
    this.highlight = page.locator('[class*="highlight"]');

    this.unsealSection = page.locator('[class*="unsealSection"]');
    this.unsealText = page.locator('[class*="unsealText"]');

    this.questionPreview = page.locator('[class*="questionPreview"]');
    this.questionLabel = page.locator('[class*="questionLabel"]');
    this.questionTitle = page.locator('[class*="questionTitle"]');
    this.questionOptions = page.locator('[class*="questionOption"]');
    this.questionMore = page.locator('[class*="questionMore"]');

    this.ctaButton = page.locator('[class*="ctaButton"]');

    this.takenSection = page.locator('[class*="takenSection"]');
    this.takenGuideMain = page.locator('[class*="takenGuideMain"]');
    this.takenNotice = page.locator('[class*="takenNotice"]');

    this.notFoundText = page.getByText('케미 테스트를 찾을 수 없습니다');

    this.loading = page.locator('[class*="loading"]');
  }

  /** 비교 랜딩 페이지로 이동 */
  async goto(token: string) {
    await this.page.goto(`/compare/${token}`);
    await this.page
      .waitForFunction(
        () =>
          document.querySelector('[class*="heroTitle"]') !== null ||
          document.querySelector('[class*="loading"]') !== null ||
          document.querySelector('[class*="ctaButton"]') !== null,
        { timeout: 15_000 }
      )
      .catch(async () => {
        await this.page.reload();
        await this.page.waitForFunction(
          () =>
            document.querySelector('[class*="heroTitle"]') !== null ||
            document.querySelector('[class*="ctaButton"]') !== null,
          { timeout: 15_000 }
        );
      });
  }
}
