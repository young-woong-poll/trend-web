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

  // 스켈레톤 로딩
  readonly skeletonCards: Locator;

  // 에러/빈 상태
  readonly errorText: Locator;
  readonly emptyState: Locator;

  // 데드라인 배지
  readonly deadlineBadges: Locator;

  // 반응형 레이아웃: 열
  readonly cardColumns: Locator;

  constructor(page: Page) {
    this.page = page;

    this.singleCards = page.getByTestId('single-card');
    this.bundleCards = page.getByTestId('bundle-card');

    this.closedBadges = page.getByTestId('closed-badge');

    this.topCommentPreviews = page.getByTestId('top-comment-preview');

    this.commentBottomSheet = page.getByTestId('comment-bottom-sheet');

    this.participantCounts = page.locator('[class*="participants"]');

    this.resultBars = page.locator('[class*="resultBar"]');

    this.skeletonCards = page.locator('[class*="skeleton"]');

    this.errorText = page.getByText('핫픽을 불러오는데 실패했습니다');
    this.emptyState = page.getByText('아직 진행중인 핫픽이 없어요');

    this.deadlineBadges = page
      .locator('[class*="badge"]')
      .filter({ has: page.locator('[class*="DeadlineBadge"]') });

    this.cardColumns = page.locator('[class*="cardColumn"]');
  }

  /** 카테고리 SelectBox 컨테이너 */
  get categorySelect(): Locator {
    return this.page.getByTestId('category-filter');
  }

  /** 카테고리 선택 (라벨 텍스트로 커스텀 SelectBox 옵션 클릭) */
  async selectCategory(label: string) {
    // SelectBox 트리거 클릭하여 드롭다운 열기
    await this.categorySelect.getByRole('button').first().click();
    // 옵션 클릭
    await this.categorySelect.getByRole('option', { name: label }).getByRole('button').click();
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

  /** 특정 카드의 댓글 수 표시 */
  cardCommentCount(cardIndex: number): Locator {
    return this.singleCards.nth(cardIndex).locator('[class*="commentCount"]');
  }

  /** 특정 카드의 댓글 버튼 */
  commentButton(cardIndex: number): Locator {
    return this.singleCards.nth(cardIndex).getByRole('button', { name: /댓글/ });
  }

  /** 특정 카드의 데드라인 배지 */
  cardDeadlineBadge(cardIndex: number): Locator {
    return this.singleCards
      .nth(cardIndex)
      .locator('[class*="DeadlineBadge"], [class*="deadlineBadge"], [class*="badge"]')
      .first();
  }

  /** 특정 열의 카드들 */
  columnCards(colIndex: number): Locator {
    return this.cardColumns.nth(colIndex).locator('[class*="cardWrapper"]');
  }

  /** 특정 열의 카드 ID 목록 */
  async columnCardIds(colIndex: number): Promise<string[]> {
    const cards = this.columnCards(colIndex);
    const count = await cards.count();
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      ids.push((await cards.nth(i).getAttribute('id')) ?? '');
    }
    return ids;
  }

  /** 무한스크롤 옵저버 타겟 */
  get observerTarget(): Locator {
    return this.page.locator('[class*="observerTarget"], [class*="observer"]').first();
  }

  async goto() {
    await this.page.goto('/');
    // MSW mock 데이터 로딩 대기: 카드가 렌더링될 때까지
    const hasCards = await this.page
      .waitForFunction(
        () =>
          document.querySelector('[data-testid="single-card"]') !== null ||
          document.querySelector('[data-testid="bundle-card"]') !== null,
        { timeout: 10_000 }
      )
      .then(() => true)
      .catch(() => false);

    if (!hasCards) {
      // MSW Service Worker가 아직 활성화되지 않은 경우 리로드하여 재시도
      await this.page.reload();
      await this.page.waitForFunction(
        () =>
          document.querySelector('[data-testid="single-card"]') !== null ||
          document.querySelector('[data-testid="bundle-card"]') !== null,
        { timeout: 10_000 }
      );
    }
  }
}
