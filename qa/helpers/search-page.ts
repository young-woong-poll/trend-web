import type { Page, Locator } from '@playwright/test';

export class SearchPage {
  readonly page: Page;

  // 검색 헤더 (Mobile /search 페이지)
  readonly searchInput: Locator;
  readonly backButton: Locator;
  readonly clearButton: Locator;

  // 최근 검색어
  readonly recentSection: Locator;
  readonly recentItems: Locator;
  readonly clearAllButton: Locator;
  readonly emptyRecentText: Locator;

  // 검색 결과
  readonly previewCards: Locator;
  readonly emptyResultTitle: Locator;
  readonly emptyResultDescription: Locator;
  readonly skeletonCards: Locator;
  readonly minLengthHint: Locator;

  // MainHeader (PC 검색)
  readonly headerSearchBar: Locator;
  readonly headerSearchInput: Locator;
  readonly headerSearchClear: Locator;
  readonly searchModal: Locator;
  readonly backdrop: Locator;
  readonly searchIconButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Mobile /search 페이지 헤더
    this.searchInput = page.getByRole('searchbox', { name: '핫픽 검색' });
    this.backButton = page.getByRole('button', { name: '뒤로가기' });
    this.clearButton = page.getByRole('button', { name: '검색어 삭제' });

    // 최근 검색어
    this.recentSection = page.getByRole('heading', { name: '최근 검색어' });
    this.recentItems = page.locator('[class*="recentItem"]');
    this.clearAllButton = page.getByRole('button', { name: '전체 삭제' });
    this.emptyRecentText = page.getByText('최근 검색어가 없습니다');

    // 검색 결과
    this.previewCards = page.locator('[class*="previewCard"]');
    this.emptyResultTitle = page.getByText('검색 결과가 없어요');
    this.emptyResultDescription = page.getByText('다른 키워드로 검색해보세요');
    this.skeletonCards = page.locator('[class*="skeletonCard"]');
    this.minLengthHint = page.getByText('검색어를 2글자 이상 입력해주세요');

    // MainHeader PC 검색
    this.headerSearchBar = page.locator('[class*="searchBar"]').first();
    this.headerSearchInput = page.locator('[class*="searchBarInput"]');
    this.headerSearchClear = page.locator('[class*="searchBarClear"]');
    this.searchModal = page.locator('[class*="searchModal"]');
    this.backdrop = page.locator('[class*="backdrop"]');
    this.searchIconButton = page.locator('[class*="searchIconButton"]');
  }

  /** 최근 검색어의 개별 삭제 버튼 */
  recentRemoveButton(keyword: string): Locator {
    return this.page.getByRole('button', { name: `검색어 '${keyword}' 삭제` });
  }

  /** 최근 검색어 클릭 */
  recentKeywordButton(keyword: string): Locator {
    return this.recentItems.filter({ hasText: keyword }).locator('[class*="recentKeyword"]');
  }

  /** 카드의 카테고리 태그 */
  cardCategory(cardIndex: number): Locator {
    return this.previewCards.nth(cardIndex).locator('[class*="categoryTag"]');
  }

  /** 카드의 제목 */
  cardTitle(cardIndex: number): Locator {
    return this.previewCards.nth(cardIndex).locator('[class*="cardTitle"]');
  }

  /** 카드의 메타 정보 */
  cardMeta(cardIndex: number): Locator {
    return this.previewCards.nth(cardIndex).locator('[class*="cardMeta"]');
  }

  /** localStorage에 최근 검색어 설정 (페이지 이동 후 호출해야 함) */
  async setRecentKeywords(keywords: string[]) {
    await this.page.evaluate(
      (kw) => localStorage.setItem('hotpick_recent_search', JSON.stringify(kw)),
      keywords
    );
  }

  /** localStorage에서 최근 검색어 조회 */
  async getRecentKeywords(): Promise<string[]> {
    return this.page.evaluate(() => {
      const raw = localStorage.getItem('hotpick_recent_search');
      return raw ? JSON.parse(raw) : [];
    });
  }

  /** localStorage 최근 검색어 초기화 (페이지 이동 후 호출해야 함) */
  async clearRecentKeywords() {
    await this.page.evaluate(() => localStorage.removeItem('hotpick_recent_search'));
  }

  /** Mobile: /search 페이지로 이동 */
  async goto() {
    await this.page.goto('/search');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Mobile: /search 페이지로 이동 (최근 검색어 설정 포함)
   * localStorage를 먼저 설정한 후 /search로 이동한다.
   */
  async gotoWithRecentKeywords(keywords: string[]) {
    // 먼저 아무 페이지로 이동하여 origin 확보
    await this.page.goto('/search');
    await this.page.waitForLoadState('domcontentloaded');
    await this.setRecentKeywords(keywords);
    // reload하여 최근 검색어가 반영된 상태로 다시 렌더링
    await this.page.reload();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Mobile: /search 페이지로 이동 (최근 검색어 초기화 포함)
   */
  async gotoWithCleanState() {
    await this.page.goto('/search');
    await this.page.waitForLoadState('domcontentloaded');
    await this.clearRecentKeywords();
    await this.page.reload();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** 메인 페이지로 이동 (MSW 초기화 대기 포함) */
  async gotoMain() {
    await this.page.goto('/');
    // MSW 초기화 후 API 응답이 도착하여 카드가 렌더링될 때까지 대기
    await this.page
      .waitForFunction(
        () =>
          document.querySelector('[data-testid="single-card"]') !== null ||
          document.querySelector('[data-testid="bundle-card"]') !== null,
        { timeout: 10_000 }
      )
      .catch(async () => {
        // MSW Service Worker 미초기화 시 리로드
        await this.page.reload();
        await this.page.waitForFunction(
          () =>
            document.querySelector('[data-testid="single-card"]') !== null ||
            document.querySelector('[data-testid="bundle-card"]') !== null,
          { timeout: 10_000 }
        );
      });
  }

  /**
   * 메인 페이지로 이동 (최근 검색어 설정 포함)
   */
  async gotoMainWithRecentKeywords(keywords: string[]) {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
    await this.setRecentKeywords(keywords);
  }
}
