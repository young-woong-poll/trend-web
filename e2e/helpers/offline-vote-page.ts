import type { Page, Locator } from '@playwright/test';

/**
 * 오프라인 투표 페이지 Page Object
 *
 * URL: /offline-vote?slug=xxx&serverMetaId=yyy
 * 단계(Phase): loading → ready → voting → result → (auto-reset) → voting
 *
 * 오프라인 투표 페이지는 useEffect에서 직접 API를 호출하므로,
 * MSW Service Worker 초기화 전에 요청이 나갈 수 있습니다.
 * 이를 방지하기 위해 Playwright route를 사용해 API를 mock합니다.
 */

/** 테스트용 서버 메타 데이터 */
const MOCK_SERVER_METAS: Record<string, object> = {
  'test-server-meta-001': {
    code: 'SUCCESS',
    message: '성공',
    data: {
      id: 'test-server-meta-001',
      meta: {
        location: {
          code: '1100000000',
          sido: '서울특별시',
          sigungu: '강남구',
          eupmyeondong: '역삼동',
        },
        from: '2026-01-01',
        to: '2026-12-31',
      },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  },
  'test-server-meta-no-location': {
    code: 'SUCCESS',
    message: '성공',
    data: {
      id: 'test-server-meta-no-location',
      meta: {},
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  },
};

/** 테스트용 핫픽 상세 데이터 (slug → response) */
const MOCK_HOTPICK_DETAILS: Record<string, object> = {
  'single-text-finance': {
    code: 'SUCCESS',
    message: '성공',
    data: {
      hotpick: {
        hotpickId: 202,
        type: 'SINGLE',
        slug: 'single-text-finance',
        imageUrl: 'https://picsum.photos/600/400?random=finance',
        expiredAt: undefined,
        categories: [{ id: 1, name: 'FINANCE', slug: 'FINANCE' }],
        election: {
          electionId: 1,
          title: '여유자금이 생기면?',
          imageUrl: 'https://picsum.photos/400/200?random=st1',
          totalVoteCount: 890,
          totalCommentCount: 0,
          items: [
            { electionItemId: 1, displayOrder: 0, title: '안전한 적금' },
            { electionItemId: 2, displayOrder: 1, title: '주식 투자' },
            { electionItemId: 3, displayOrder: 2, title: '코인 투자' },
          ],
          voted: false,
          myElectionItemId: undefined,
        },
      },
      relatedHotpicks: [],
    },
  },
};

/** 투표 응답 생성 */
function buildVoteResponse(slug: string, electionItemId: number) {
  const detail = MOCK_HOTPICK_DETAILS[slug] as
    | { data: { hotpick: { election: { items: { electionItemId: number; title: string }[] } } } }
    | undefined;
  const items = detail?.data?.hotpick?.election?.items ?? [];
  const total = 891; // 기존 890 + 방금 1표

  return {
    code: 'SUCCESS',
    message: '성공',
    data: {
      hotpickId: 202,
      hotpickSlug: slug,
      electionId: 'st1',
      voted: true,
      myElectionItemId: electionItemId,
      totalVoteCount: total,
      items: items.map((item) => ({
        electionItemId: item.electionItemId,
        title: item.title,
        voteCount:
          item.electionItemId === electionItemId ? 341 : item.electionItemId === 2 ? 410 : 140,
        voteRate: item.electionItemId === electionItemId ? 38 : item.electionItemId === 2 ? 46 : 16,
      })),
    },
  };
}

export class OfflineVotePage {
  readonly page: Page;

  // ── 로딩 화면 ──
  readonly loadingTitle: Locator;
  readonly loadingSpinner: Locator;

  // ── 에러 화면 ──
  readonly errorTitle: Locator;
  readonly errorMessage: Locator;

  // ── 준비(ready) 화면 ──
  readonly previewCard: Locator;
  readonly locationBadge: Locator;
  readonly timeBadge: Locator;
  readonly categoryTags: Locator;
  readonly previewTitle: Locator;
  readonly previewOptions: Locator;
  readonly fullscreenButton: Locator;

  // ── 투표(voting) 화면 ──
  readonly voteContainer: Locator;
  readonly voteQuestion: Locator;
  readonly optionCards: Locator;
  readonly participantCount: Locator;
  readonly voteLocation: Locator;
  readonly footerHint: Locator;

  // ── 결과(result) 화면 ──
  readonly resultBars: Locator;
  readonly resultPercents: Locator;
  readonly myChoiceBars: Locator;
  readonly autoResetBar: Locator;
  readonly autoResetText: Locator;

  constructor(page: Page) {
    this.page = page;

    // 로딩
    this.loadingTitle = page.getByText('투표 준비 중');
    this.loadingSpinner = page.locator('[class*="loadingSpinner"]');

    // 에러
    this.errorTitle = page.getByText('투표 링크 오류');
    this.errorMessage = page.locator('[class*="errorMessage"]');

    // 준비
    this.previewCard = page.locator('[class*="previewCard"]');
    this.locationBadge = page.locator('[class*="locationBadge"]');
    this.timeBadge = page.locator('[class*="timeBadge"]');
    this.categoryTags = page.locator('[class*="categoryTag"]');
    this.previewTitle = page.locator('[class*="previewTitle"]');
    this.previewOptions = page.locator('[class*="previewOption"]');
    this.fullscreenButton = page.locator('[class*="fullscreenButton"]');

    // 투표
    this.voteContainer = page.locator('[class*="voteContainer"]');
    this.voteQuestion = page.locator('h1[class*="voteQuestion"]');
    this.optionCards = page.locator('[class*="optionCard"]');
    this.participantCount = page.locator('[class*="voteParticipants"]');
    this.voteLocation = page.locator('[class*="voteLocation"]');
    this.footerHint = page.getByText('원하는 항목을 탭하세요');

    // 결과
    this.resultBars = page.locator('[class*="resultBar"]');
    this.resultPercents = page.locator('[class*="resultPercent"]');
    this.myChoiceBars = page.locator('[class*="myChoice"]');
    this.autoResetBar = page.locator('[class*="autoResetBar"]');
    this.autoResetText = page.getByText('잠시 후 다음 투표자를 위해 초기화됩니다');
  }

  /**
   * Playwright route를 사용해 오프라인 투표에 필요한 모든 API를 mock합니다.
   * MSW Service Worker 초기화 전에 요청이 나가는 레이스 컨디션을 완전히 제거합니다.
   *
   * 대상 API:
   * - GET  /api/v1/server-metas/:id — 서버 메타 정보
   * - GET  /api/v1/hotpicks/:slug — 핫픽 상세 정보
   * - POST /api/v1/hotpicks/:slug/votes — 투표
   */
  private async setupRoutes(slug: string, serverMetaId: string) {
    // 1) server-meta API
    await this.page.route('**/api/v1/server-metas/**', async (route) => {
      const mockData = MOCK_SERVER_METAS[serverMetaId];
      if (mockData) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockData),
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'NOT_FOUND',
            message: '서버 메타를 찾을 수 없습니다.',
            data: null,
          }),
        });
      }
    });

    // 2) hotpick detail API
    await this.page.route('**/api/v1/hotpicks/*', async (route) => {
      const url = new URL(route.request().url());
      // votes 엔드포인트는 별도 핸들러에서 처리
      if (url.pathname.includes('/votes')) {
        return route.fallback();
      }
      const reqSlug = url.pathname.split('/').pop() ?? '';
      const mockData = MOCK_HOTPICK_DETAILS[reqSlug];
      if (mockData) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockData),
        });
      } else {
        // 알 수 없는 slug → MSW에 위임
        return route.fallback();
      }
    });

    // 3) vote API
    await this.page.route('**/api/v1/hotpicks/*/votes', async (route) => {
      if (route.request().method() !== 'POST') {
        return route.fallback();
      }
      try {
        const body = route.request().postDataJSON() as { electionItemId: number };
        const url = new URL(route.request().url());
        // pathname: /api/v1/hotpicks/{slug}/votes
        const parts = url.pathname.split('/');
        const reqSlug = parts[parts.length - 2];
        const resp = buildVoteResponse(reqSlug, body.electionItemId);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(resp),
        });
      } catch {
        return route.fallback();
      }
    });
  }

  /** 유효한 파라미터로 오프라인 투표 페이지 이동 */
  async goto(slug: string, serverMetaId: string) {
    // Playwright route로 모든 API mock 설정 (MSW 의존 제거)
    await this.setupRoutes(slug, serverMetaId);

    // 오프라인 투표 페이지로 직접 이동
    await this.page.goto(`/offline-vote?slug=${slug}&serverMetaId=${serverMetaId}`);
    await this.page.waitForFunction(
      () => {
        const hasFullPreview =
          document.querySelector('[class*="previewCard"]') !== null &&
          document.querySelector('[class*="fullscreenButton"]') !== null;
        const hasError =
          document.querySelector('[class*="errorCard"]') !== null ||
          document.body.textContent?.includes('투표 링크 오류') === true;
        return hasFullPreview || hasError;
      },
      { timeout: 15_000 }
    );
  }

  /** 파라미터 없이 이동 (에러 케이스) */
  async gotoWithoutParams() {
    await this.page.goto('/offline-vote');
    await this.page.waitForFunction(
      () => {
        return (
          document.querySelector('[class*="errorCard"]') !== null ||
          document.body.textContent?.includes('투표 링크 오류') === true
        );
      },
      { timeout: 15_000 }
    );
  }

  /** 풀스크린 진입 (준비 → 투표) */
  async enterVoting() {
    await this.fullscreenButton.waitFor({ state: 'visible', timeout: 15_000 });
    await this.fullscreenButton.click();
    await this.optionCards.first().waitFor({ state: 'visible', timeout: 10_000 });
  }

  /** 첫 번째 옵션 클릭하여 투표 */
  async voteFirstOption() {
    await this.optionCards.first().click();
    await this.resultBars.first().waitFor({ state: 'visible', timeout: 10_000 });
  }
}
