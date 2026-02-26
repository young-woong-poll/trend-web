import type { Page, Locator } from '@playwright/test';

export class DetailPage {
  readonly page: Page;

  // 투표 카드
  readonly voteCard: Locator;
  readonly optionButtons: Locator;
  readonly resultBars: Locator;
  readonly resultPercentages: Locator;
  readonly myChoiceBadge: Locator;
  readonly question: Locator;

  // 공유
  readonly shareButton: Locator;
  readonly voteHint: Locator;

  // 댓글
  readonly commentSection: Locator;
  readonly blurOverlay: Locator;
  readonly commentFormHint: Locator;
  readonly commentItems: Locator;
  readonly loadMoreButton: Locator;
  readonly sortPopular: Locator;
  readonly sortLatest: Locator;
  readonly commentTextarea: Locator;

  // 추천
  readonly recommendSection: Locator;
  readonly recommendCards: Locator;
  readonly backToMainLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.voteCard = page.locator('[class*="voteCard"]');
    this.optionButtons = page.locator('[class*="optionButton"]');
    this.resultBars = page.locator('[class*="resultBar"]');
    this.resultPercentages = page.locator('[class*="barPercent"]');
    this.myChoiceBadge = page.locator('[class*="myChoice"]');
    this.question = page.locator('h1[class*="question"]');

    this.shareButton = page.getByRole('button', { name: /투표 공유하기/ });
    this.voteHint = page.getByText('투표하고 결과 확인하기');

    this.commentSection = page.locator('[class*="commentSection"]');
    this.blurOverlay = page.getByText('투표 후 댓글을 확인할 수 있습니다');
    this.commentFormHint = page.getByText('투표 후 댓글을 작성할 수 있습니다');
    this.commentItems = page.locator('[class*="commentItem"]');
    this.loadMoreButton = page.getByRole('button', { name: '댓글 더보기' });
    this.sortPopular = page.getByRole('button', { name: /인기순/ });
    this.sortLatest = page.getByRole('button', { name: /최신순/ });
    this.commentTextarea = page.locator('textarea[placeholder="댓글 추가..."]');

    this.recommendSection = page.locator('[class*="recommendSection"]');
    this.recommendCards = page.locator('[class*="recommendCard"]');
    this.backToMainLink = page.getByRole('link', { name: /더 많은 투표 보기/ });
  }

  async goto(slug: string) {
    await this.page.goto(`/hotpick/${slug}`);
    await this.page.waitForLoadState('networkidle');
  }
}
