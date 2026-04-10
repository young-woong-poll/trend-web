import type { Page, Locator } from '@playwright/test';

export class CompareResultPage {
  readonly page: Page;

  // 헤더
  readonly resultTitle: Locator;
  readonly categoryBadge: Locator;
  readonly backButton: Locator;

  // 배너
  readonly previewBanner: Locator;
  readonly previewText: Locator;
  readonly groupPairBanner: Locator;
  readonly groupPairLabel: Locator;
  readonly groupPairNotice: Locator;

  // 로딩
  readonly loadingOrbit: Locator;
  readonly loadingTextGroup: Locator;

  // CTA
  readonly ctaOneToOne: Locator;
  readonly ctaGroup: Locator;
  readonly floatingCta: Locator;

  constructor(page: Page) {
    this.page = page;

    this.resultTitle = page.locator('[class*="resultTitle"]');
    this.categoryBadge = page.locator('[class*="CategoryBadge"]');
    this.backButton = page.locator('[class*="backButton"]');

    this.previewBanner = page.locator('[class*="previewBanner"]');
    this.previewText = page.locator('[class*="previewText"]');
    this.groupPairBanner = page.locator('[class*="groupPairBanner"]');
    this.groupPairLabel = page.locator('[class*="groupPairLabel"]');
    this.groupPairNotice = page.locator('[class*="groupPairNotice"]');

    this.loadingOrbit = page.locator('[class*="loadingOrbit"]');
    this.loadingTextGroup = page.locator('[class*="loadingTextGroup"]');

    this.ctaOneToOne = page.locator('[class*="ctaOneToOne"]');
    this.ctaGroup = page.locator('[class*="ctaGroup"]');
    this.floatingCta = page.locator('[class*="floatingCta"]');
  }

  /** 1:1 비교 결과 페이지로 이동 */
  async goto(token: string) {
    await this.page.goto(`/compare/match/${token}`);
    // 결과 로딩 완료 또는 미리보기 배너 대기
    await this.page
      .waitForFunction(
        () =>
          document.querySelector('[class*="resultTitle"]') !== null ||
          document.querySelector('[class*="previewBanner"]') !== null ||
          document.querySelector('[class*="loadingOrbit"]') !== null,
        { timeout: 15_000 }
      )
      .catch(async () => {
        await this.page.reload();
        await this.page.waitForFunction(
          () =>
            document.querySelector('[class*="resultTitle"]') !== null ||
            document.querySelector('[class*="previewBanner"]') !== null,
          { timeout: 15_000 }
        );
      });
  }

  /** 그룹에서 진입한 1:1 비교 결과 */
  async gotoFromGroup(token: string) {
    await this.page.goto(`/compare/match/${token}?from=group`);
    await this.page
      .waitForFunction(
        () =>
          document.querySelector('[class*="resultTitle"]') !== null ||
          document.querySelector('[class*="loadingOrbit"]') !== null,
        { timeout: 15_000 }
      )
      .catch(async () => {
        await this.page.reload();
        await this.page.waitForFunction(
          () => document.querySelector('[class*="resultTitle"]') !== null,
          { timeout: 15_000 }
        );
      });
  }
}
