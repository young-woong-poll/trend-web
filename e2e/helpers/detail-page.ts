import type { Page, Locator } from '@playwright/test';

export class DetailPage {
  readonly page: Page;

  // 투표 카드
  readonly voteCard: Locator;
  readonly question: Locator;
  readonly optionButtons: Locator;
  readonly resultBars: Locator;

  // 공유/힌트
  readonly shareButton: Locator;
  readonly voteHint: Locator;

  // 댓글 섹션
  readonly commentSection: Locator;
  readonly blurOverlay: Locator;
  readonly commentFormHint: Locator;

  // 댓글 정렬/좋아요
  readonly sortPopular: Locator;
  readonly sortLatest: Locator;
  readonly commentItems: Locator;

  // 추천 섹션
  readonly recommendSection: Locator;
  readonly recommendCards: Locator;
  readonly backToMainLink: Locator;

  // 결과 퍼센트
  readonly resultPercentages: Locator;
  readonly myChoiceBars: Locator;

  // 참여자 수
  readonly participantCount: Locator;

  // 카테고리 태그
  readonly categoryTags: Locator;

  // 댓글 폼 요소
  readonly commentTextarea: Locator;
  readonly commentNicknameInput: Locator;
  readonly commentPasswordInput: Locator;
  readonly commentSubmitButton: Locator;
  readonly commentCancelButton: Locator;
  readonly commentCharCount: Locator;

  // 댓글 더보기
  readonly loadMoreComments: Locator;

  constructor(page: Page) {
    this.page = page;

    this.voteCard = page.getByTestId('vote-card');
    this.question = page.locator('h1');
    this.optionButtons = this.voteCard.locator('button').filter({ hasNotText: /공유/ });
    this.resultBars = page.locator('[class*="resultBar"]');

    this.shareButton = page.getByRole('button', { name: /투표 공유하기/ });
    this.voteHint = page.getByText('투표하고 결과 확인하기');

    this.commentSection = page.getByTestId('comment-section');
    this.blurOverlay = page.getByText('투표 후 댓글을 확인할 수 있습니다');
    this.commentFormHint = page.getByText('투표 후 댓글을 작성할 수 있습니다');

    this.sortPopular = this.commentSection.getByRole('button', { name: /인기순/ });
    this.sortLatest = this.commentSection.getByRole('button', { name: /최신순/ });
    this.commentItems = this.commentSection.locator('[class*="commentItem"]');

    this.recommendSection = page.getByTestId('recommend-section');
    this.recommendCards = page.getByTestId('recommend-cards').locator('a');
    this.backToMainLink = page.getByRole('link', { name: /더 많은 투표 보기/ });

    this.resultPercentages = this.voteCard.locator('[class*="barPercent"]');
    this.myChoiceBars = this.voteCard.locator('[class*="myChoice"]');

    this.participantCount = page.locator('[class*="participants"]');

    this.categoryTags = this.voteCard.locator('[class*="categoryTag"]');

    this.commentTextarea = this.commentSection.locator('textarea');
    this.commentNicknameInput = this.commentSection.locator('input[type="text"]');
    this.commentPasswordInput = this.commentSection.locator('input[type="password"]');
    this.commentSubmitButton = this.commentSection.locator('[class*="submitButton"]');
    this.commentCancelButton = this.commentSection.locator('[class*="cancelButton"]');
    this.commentCharCount = this.commentSection.locator('[class*="charCount"]');

    this.loadMoreComments = this.commentSection.getByRole('button', { name: /댓글 더보기/ });
  }

  /** 특정 slug의 상세페이지로 이동 */
  async goto(slug: string) {
    await this.page.goto(`/hotpick/${slug}`);
    await this.voteCard.waitFor({ state: 'visible', timeout: 15_000 }).catch(async () => {
      // MSW Service Worker가 아직 활성화되지 않은 경우 리로드하여 재시도
      await this.page.reload();
      await this.voteCard.waitFor({ state: 'visible', timeout: 15_000 });
    });
  }

  /** 첫 번째 옵션을 클릭하여 투표 수행 */
  async voteFirstOption() {
    const firstOption = this.voteCard.locator('[class*="optionButton"]').first();
    await firstOption.click();
    // 결과 바가 나타날 때까지 대기
    await this.resultBars.first().waitFor({ state: 'visible', timeout: 10_000 });
  }

  /** 댓글 작성 폼 열기 (textarea 포커스) */
  async openCommentForm() {
    await this.commentTextarea.click();
    // 닉네임 입력창이 나타날 때까지 대기
    await this.commentNicknameInput.waitFor({ state: 'visible', timeout: 5_000 });
  }

  /** 좋아요 버튼 (댓글 내) */
  commentLikeButton(commentIndex: number): Locator {
    return this.commentItems.nth(commentIndex).getByRole('button', { name: /좋아요/ });
  }
}
