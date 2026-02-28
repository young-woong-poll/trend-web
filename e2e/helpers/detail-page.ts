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
  }

  async goto(slug: string) {
    await this.page.goto(`/hotpick/${slug}`);
    await this.voteCard.waitFor({ state: 'visible', timeout: 15_000 }).catch(async () => {
      // MSW Service Worker가 아직 활성화되지 않은 경우 리로드하여 재시도
      await this.page.reload();
      await this.voteCard.waitFor({ state: 'visible', timeout: 15_000 });
    });
  }
}
