import type { Page, Locator } from '@playwright/test';

export class BundleResultPage {
  readonly page: Page;

  // 헤더
  readonly resultTitle: Locator;
  readonly categoryBadge: Locator;
  readonly backButton: Locator;

  // 대중성 카드
  readonly gradeRing: Locator;
  readonly scoreValue: Locator;
  readonly scoreUnit: Locator;
  readonly scoreLabel: Locator;
  readonly scoreHelp: Locator;
  readonly popularityTooltip: Locator;
  readonly popularityTitle: Locator;
  readonly popularityDescription: Locator;
  readonly participantHint: Locator;

  // 답변 섹션
  readonly sectionTitle: Locator;
  readonly answerCards: Locator;
  readonly answerBadges: Locator;
  readonly optionBarFills: Locator;
  readonly optionPercents: Locator;

  // CTA
  readonly ctaOneToOne: Locator;
  readonly ctaGroup: Locator;

  // 스켈레톤
  readonly skeleton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.resultTitle = page.locator('[class*="resultTitle"]');
    this.categoryBadge = page.locator('[class*="CategoryBadge"]');
    this.backButton = page.getByRole('button', { name: '뒤로 가기' });

    this.gradeRing = page.locator('[class*="gradeRing"]');
    this.scoreValue = page.locator('[class*="scoreValue"]');
    this.scoreUnit = page.locator('[class*="scoreUnit"]');
    this.scoreLabel = page.locator('[class*="scoreLabel"]');
    this.scoreHelp = page.getByRole('button', { name: '대중성 지수 설명' });
    this.popularityTooltip = page.locator('[class*="popularityTooltip"]');
    this.popularityTitle = page.locator('[class*="popularityTitle"]');
    this.popularityDescription = page.locator('[class*="popularityDescription"]');
    this.participantHint = page.locator('[class*="participantHint"]');

    this.sectionTitle = page.locator('[class*="sectionTitle"]');
    this.answerCards = page.locator('[class*="answerCard"]');
    this.answerBadges = page.locator('[class*="answerBadge"]');
    this.optionBarFills = page.locator('[class*="optionBarFill"]');
    this.optionPercents = page.locator('[class*="optionPercent"]');

    this.ctaOneToOne = page.locator('[class*="ctaOneToOne"]');
    this.ctaGroup = page.locator('[class*="ctaGroup"]');

    this.skeleton = page.locator('[class*="skeleton"]');
  }

  /** 번들 결과 페이지로 이동 */
  async goto(slug: string) {
    await this.page.goto(`/bundle/${slug}/result`);
    await this.gradeRing.waitFor({ state: 'visible', timeout: 15_000 }).catch(async () => {
      await this.page.reload();
      await this.gradeRing.waitFor({ state: 'visible', timeout: 15_000 });
    });
  }

  /** 대중성 지수 설명 툴팁 토글 */
  async togglePopularityTooltip() {
    await this.scoreHelp.click();
  }
}
