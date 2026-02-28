import type { Page, Locator } from '@playwright/test';

export class MainPage {
  readonly page: Page;

  // 카드 목록
  readonly singleCards: Locator;
  readonly bundleCards: Locator;

  // SingleCard 내부 요소
  readonly closedBadges: Locator;
  readonly resultBars: Locator;
  readonly optionButtons: Locator;
  readonly topCommentPreviews: Locator;

  // BundleCard 내부 요소
  readonly bundleClosedBadges: Locator;

  // 댓글 바텀시트
  readonly commentBottomSheet: Locator;

  constructor(page: Page) {
    this.page = page;

    this.singleCards = page.locator('[class*="SingleCard_card"]');
    this.bundleCards = page.locator('[class*="BundleCard_card"]');

    this.closedBadges = page.locator('[class*="SingleCard_closedBadge"]');
    this.resultBars = page.locator('[class*="SingleCard_resultBar"]');
    this.optionButtons = page.locator('[class*="SingleCard_optionButton"]');
    this.topCommentPreviews = page.locator('[class*="SingleCard_topCommentPreview"]');

    this.bundleClosedBadges = page.locator('[class*="BundleCard_closedBadge"]');

    this.commentBottomSheet = page.locator('[class*="CommentBottomSheet_bottomSheet"]');
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }
}
