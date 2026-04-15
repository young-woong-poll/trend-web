import type { Page, Locator } from '@playwright/test';

export class GroupResultPage {
  readonly page: Page;

  // 헤더
  readonly groupName: Locator;
  readonly bundleTitle: Locator;
  readonly editButton: Locator;
  readonly backButton: Locator;

  // 미리보기 배너
  readonly previewBanner: Locator;
  readonly previewText: Locator;

  // 싱크율
  readonly syncLabel: Locator;
  readonly syncValue: Locator;
  readonly syncUnit: Locator;

  // 히어로 스탯
  readonly heroStats: Locator;
  readonly heroStatLabels: Locator;
  readonly heroStatValues: Locator;

  // 싱크 태그
  readonly syncTag: Locator;

  // CTA
  readonly ctaOneToOne: Locator;
  readonly ctaGroup: Locator;
  readonly floatingCta: Locator;
  readonly joinButton: Locator;

  // 로딩
  readonly loadingOrbit: Locator;

  // 에러
  readonly notFoundText: Locator;
  readonly emptyText: Locator;

  constructor(page: Page) {
    this.page = page;

    this.groupName = page.locator('h1[class*="groupName"]');
    this.bundleTitle = page
      .locator('span[class*="bundleTitle"], p[class*="bundleTitle"], div[class*="bundleTitle"]')
      .first();
    this.editButton = page.getByRole('button', { name: '그룹 설정' });
    this.backButton = page.getByRole('button', { name: '마이 탭으로 돌아가기' });

    this.previewBanner = page.locator('[class*="previewBanner"]');
    this.previewText = page.locator('[class*="previewText"]');

    this.syncLabel = page.locator('[class*="syncLabel"]');
    this.syncValue = page.locator('[class*="syncValue"]');
    this.syncUnit = page.locator('[class*="syncUnit"]');

    this.heroStats = page.locator('[class*="heroStats"]');
    this.heroStatLabels = page.locator('[class*="heroStatLabel"]');
    this.heroStatValues = page.locator('[class*="heroStatValue"]');

    this.syncTag = page.locator(
      '[class*="syncTagHigh"], [class*="syncTagMid"], [class*="syncTagLow"]'
    );

    this.ctaOneToOne = page.locator('[class*="ctaOneToOne"]');
    this.ctaGroup = page.locator('[class*="ctaGroup"]');
    this.floatingCta = page.locator('[class*="floatingCta"]');
    this.joinButton = page.getByRole('button', { name: /나도 참여하기/ });

    this.loadingOrbit = page.locator('[class*="loadingOrbit"]');

    this.notFoundText = page.getByText('그룹 케미 결과를 찾을 수 없습니다');
    this.emptyText = page.getByText('아직 참여한 멤버가 없어요');
  }

  /** 그룹 결과 페이지로 이동 */
  async goto(token: string) {
    await this.page.goto(`/compare/group/${token}`);
    await this.page
      .waitForFunction(
        () =>
          document.querySelector('h1[class*="groupName"]') !== null ||
          document.querySelector('[class*="loadingOrbit"]') !== null ||
          document.querySelector('[class*="previewBanner"]') !== null,
        { timeout: 15_000 }
      )
      .catch(async () => {
        await this.page.reload();
        await this.page.waitForFunction(
          () =>
            document.querySelector('h1[class*="groupName"]') !== null ||
            document.querySelector('[class*="previewBanner"]') !== null,
          { timeout: 15_000 }
        );
      });
  }
}
