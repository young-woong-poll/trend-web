import type { Page, Locator } from '@playwright/test';

export class TabPage {
  readonly page: Page;

  /** 탭 바 컨테이너 */
  readonly tabBar: Locator;

  /** 필터탭 */
  readonly newTab: Locator;
  readonly hotTab: Locator;
  readonly myTab: Locator;

  /** 구분자 */
  readonly divider: Locator;

  /** 카드 & 상태 */
  readonly singleCards: Locator;
  readonly bundleCards: Locator;
  readonly skeletonCards: Locator;
  readonly emptyState: Locator;

  /** 헤더 */
  readonly header: Locator;

  constructor(page: Page) {
    this.page = page;

    this.tabBar = page.getByTestId('content-tabs');

    this.newTab = page.getByTestId('content-tab-new');
    this.hotTab = page.getByTestId('content-tab-top');
    this.myTab = page.getByTestId('content-tab-my');

    this.divider = this.tabBar.locator('[aria-hidden="true"]');

    this.singleCards = page.getByTestId('single-card');
    this.bundleCards = page.getByTestId('bundle-card');
    this.skeletonCards = page.locator('[class*="skeleton"], [class*="Skeleton"]');
    this.emptyState = page.locator('[class*="emptyState"]');

    this.header = page.locator('header').first();
  }

  /** 카테고리탭 (slug로 접근) */
  categoryTab(slug: string): Locator {
    return this.page.getByTestId(`content-tab-category-${slug}`);
  }

  /** 카테고리탭 (라벨 텍스트로 접근) */
  categoryTabByLabel(label: string): Locator {
    return this.tabBar.getByRole('tab', { name: label });
  }

  /** 현재 활성 탭 */
  get activeTab(): Locator {
    return this.tabBar.locator('[aria-selected="true"]');
  }

  /** 모든 탭 버튼 */
  get allTabs(): Locator {
    return this.tabBar.getByRole('tab');
  }

  /** 카드 로딩 대기 (카드가 나타나거나 빈 상태가 나타날 때까지) */
  async waitForContent() {
    await this.page.waitForFunction(
      () => {
        return (
          document.querySelector('[data-testid="single-card"]') !== null ||
          document.querySelector('[data-testid="bundle-card"]') !== null ||
          document.querySelector('[class*="emptyState"]') !== null
        );
      },
      { timeout: 30_000 }
    );
  }

  /** 페이지 이동 + 로딩 대기 */
  async goto() {
    await this.page.goto('/');
    await this.waitForContent();
  }

  /** 탭 클릭 + 콘텐츠 로딩 대기 */
  async clickTab(tab: Locator) {
    await tab.click();
    // 탭 전환 후 데이터 로딩 대기
    await this.page.waitForTimeout(1_500);
  }

  /** 총 카드 수 */
  async totalCardCount(): Promise<number> {
    const singles = await this.singleCards.count();
    const bundles = await this.bundleCards.count();
    return singles + bundles;
  }
}
