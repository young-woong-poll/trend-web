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

  // 참여자 수
  readonly participantCounts: Locator;

  // 결과 바
  readonly resultBars: Locator;

  constructor(page: Page) {
    this.page = page;

    this.singleCards = page.getByTestId('single-card');
    this.bundleCards = page.getByTestId('bundle-card');

    this.closedBadges = page.getByTestId('closed-badge');

    this.topCommentPreviews = page.getByTestId('top-comment-preview');

    this.commentBottomSheet = page.getByTestId('comment-bottom-sheet');

    this.participantCounts = page.locator('[class*="participants"]');

    this.resultBars = page.locator('[class*="resultBar"]');
  }

  /** 카테고리 버튼 클릭 (라벨 텍스트로 찾기) */
  categoryButton(label: string): Locator {
    return this.page.getByRole('button', { name: label, exact: true });
  }

  /** 특정 카드의 공유 버튼 */
  shareButton(cardIndex: number): Locator {
    return this.singleCards.nth(cardIndex).getByRole('button', { name: '공유' });
  }

  /** 특정 카드의 옵션 버튼들 */
  optionButtons(cardIndex: number): Locator {
    return this.singleCards.nth(cardIndex).locator('[class*="optionButton"]');
  }

  /** 특정 카드의 결과 바들 */
  cardResultBars(cardIndex: number): Locator {
    return this.singleCards.nth(cardIndex).locator('[class*="resultBar"]');
  }

  /** 특정 카드의 퍼센트 텍스트들 */
  cardPercentages(cardIndex: number): Locator {
    return this.singleCards.nth(cardIndex).locator('[class*="barPercent"]');
  }

  /** 특정 카드의 myChoice 표시 */
  cardMyChoice(cardIndex: number): Locator {
    return this.singleCards.nth(cardIndex).locator('[class*="myChoice"]');
  }

  /** 특정 카드의 카테고리 태그들 */
  cardCategories(cardIndex: number): Locator {
    return this.singleCards.nth(cardIndex).locator('[class*="categoryTag"]');
  }

  /** 특정 카드의 좋아요 버튼 */
  likeButton(cardIndex: number): Locator {
    return this.singleCards.nth(cardIndex).getByRole('button', { name: '좋아요' });
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
