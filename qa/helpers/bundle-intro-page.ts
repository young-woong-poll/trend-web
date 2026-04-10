import type { Page, Locator } from '@playwright/test';

export class BundleIntroPage {
  readonly page: Page;

  // 헤더/타이틀
  readonly title: Locator;
  readonly categoryBadge: Locator;

  // 메타 정보
  readonly metaItems: Locator;

  // CTA
  readonly ctaButton: Locator;

  // 로그인 안내
  readonly loginNotice: Locator;

  // 비교 미리보기
  readonly comparePreviews: Locator;

  // 스켈레톤
  readonly skeleton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.title = page.locator('h1');
    this.categoryBadge = page.locator('[class*="CategoryBadge"]');

    this.metaItems = page.locator('[class*="metaItem"]');

    this.ctaButton = page.locator('[class*="ctaButton"]');

    this.loginNotice = page.locator('[class*="loginNotice"]');

    this.comparePreviews = page.locator('[class*="comparePreview"]');

    this.skeleton = page.locator('[class*="skeleton"]');
  }

  /** 번들 인트로 페이지로 이동 */
  async goto(slug: string) {
    await this.page.goto(`/bundle/${slug}`);
    // CTA 버튼 또는 스켈레톤이 보일 때까지 대기
    await this.ctaButton.waitFor({ state: 'visible', timeout: 15_000 }).catch(async () => {
      // MSW Service Worker가 아직 활성화되지 않은 경우 리로드
      await this.page.reload();
      await this.ctaButton.waitFor({ state: 'visible', timeout: 15_000 });
    });
  }

  /** 질문 수 메타 텍스트 */
  get questionCountMeta(): Locator {
    return this.metaItems.first();
  }

  /** 참여자 수 메타 텍스트 */
  get participantCountMeta(): Locator {
    return this.metaItems.nth(1);
  }
}
