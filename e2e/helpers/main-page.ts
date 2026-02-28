import type { Page, Locator } from '@playwright/test';

export class MainPage {
  readonly page: Page;

  // 카드 목록
  readonly singleCards: Locator;
  readonly bundleCards: Locator;

  // 마감 배지
  readonly closedBadges: Locator;

  // topComment 미리보기
  readonly topCommentPreviews: Locator;

  // 댓글 바텀시트
  readonly commentBottomSheet: Locator;

  constructor(page: Page) {
    this.page = page;

    this.singleCards = page.getByTestId('single-card');
    this.bundleCards = page.getByTestId('bundle-card');

    this.closedBadges = page.getByTestId('closed-badge');

    this.topCommentPreviews = page.getByTestId('top-comment-preview');

    this.commentBottomSheet = page.getByTestId('comment-bottom-sheet');
  }

  async goto() {
    await this.page.goto('/');
    // MSW mock 데이터 로딩 대기: 카드가 렌더링되거나 에러/빈 상태가 표시될 때까지
    await this.page.waitForFunction(
      () => {
        return (
          document.querySelector('[data-testid="single-card"]') !== null ||
          document.querySelector('[data-testid="bundle-card"]') !== null ||
          document.body.textContent?.includes('실패') === true ||
          document.body.textContent?.includes('에러') === true ||
          document.body.textContent?.includes('핫픽이 없어요') === true
        );
      },
      { timeout: 30_000 }
    );
  }
}
