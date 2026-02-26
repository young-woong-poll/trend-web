import { test, expect } from '@playwright/test';

import { DetailPage } from './helpers/detail-page';

/**
 * 상세페이지 (hotpick/[slug]) — read-only E2E 테스트
 *
 * 실제 beta API 사용. write 동작(투표, 댓글 CRUD)은 테스트하지 않음.
 * regression.md "상세페이지" 섹션 매핑.
 *
 * slug 상수는 beta 환경에 실제 존재하는 핫픽.
 * beta 데이터가 변경되면 이 상수도 업데이트 필요.
 */
const SLUGS = {
  /** 미투표 SINGLE (옵션 3개, 댓글 있음, 추천 있음) */
  SINGLE: 'sleep-hours',
  /** 존재하지 않는 slug */
  NOT_FOUND: 'nonexistent-slug-e2e-test-12345',
} as const;

// ─── 라우팅 ───

// regression: SINGLE 타입은 SingleDetailView, BUNDLE 타입은 HotpickView 가 렌더링된다.
test.describe('라우팅', () => {
  test('SINGLE slug 진입 시 투표 카드가 렌더링된다', async ({ page }) => {
    const detail = new DetailPage(page);
    await detail.goto(SLUGS.SINGLE);

    await expect(detail.voteCard).toBeVisible({ timeout: 15_000 });
    await expect(detail.question).toBeVisible();
  });

  // regression: 존재하지 않는 alias 진입 시 404 페이지가 노출된다.
  test('존재하지 않는 slug 진입 시 에러 페이지가 노출된다', async ({ page }) => {
    await page.goto(`/hotpick/${SLUGS.NOT_FOUND}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/존재하지 않는/)).toBeVisible({ timeout: 15_000 });
  });
});

// ─── 투표 전 상태 ───

// regression: 투표 전에 결과 & 댓글 미노출 (댓글 블러 + "투표 후 댓글을 확인할 수 있습니다" 오버레이)
test.describe('투표 전 상태', () => {
  let detail: DetailPage;

  test.beforeEach(async ({ page }) => {
    detail = new DetailPage(page);
    // 새 컨텍스트 = 새 UUID → 미투표 상태
    await detail.goto(SLUGS.SINGLE);
    await expect(detail.voteCard).toBeVisible({ timeout: 15_000 });
  });

  test('옵션 버튼이 노출되고 결과 바는 미노출', async () => {
    const optionCount = await detail.optionButtons.count();
    expect(optionCount).toBeGreaterThanOrEqual(2);

    await expect(detail.resultBars.first()).not.toBeVisible();
  });

  // regression: 투표 전에 결과 & 댓글 미노출
  test('댓글 영역에 블러 오버레이가 표시된다', async () => {
    await expect(detail.blurOverlay).toBeVisible();
  });

  test('댓글 작성 불가 안내가 표시된다', async () => {
    await expect(detail.commentFormHint).toBeVisible();
  });

  // regression: 투표 후 공유 CTA("투표 공유하기") 버튼이 활성화되고...
  test('공유 CTA 미노출, 힌트 텍스트가 표시된다', async () => {
    await expect(detail.shareButton).not.toBeVisible();
    await expect(detail.voteHint).toBeVisible();
  });
});

// ─── 추천 섹션 ───

// regression: 추천 섹션: 동일 카테고리 Single 최대 2개 표시, 없으면 섹션 미노출
test.describe('추천 섹션', () => {
  test('추천 섹션이 표시되고 추천 카드가 있다', async ({ page }) => {
    const detail = new DetailPage(page);
    await detail.goto(SLUGS.SINGLE);
    await expect(detail.voteCard).toBeVisible({ timeout: 15_000 });

    await expect(detail.recommendSection).toBeVisible();
    const cardCount = await detail.recommendCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);
  });

  // regression: "더 많은 투표 보기" 클릭 시 메인("/")으로 이동
  test('"더 많은 투표 보기" 클릭 시 메인으로 이동한다', async ({ page }) => {
    const detail = new DetailPage(page);
    await detail.goto(SLUGS.SINGLE);
    await expect(detail.voteCard).toBeVisible({ timeout: 15_000 });

    await detail.backToMainLink.click();
    await page.waitForURL('**/');
    expect(page.url()).toMatch(/\/$/);
  });
});

// ─── OG 메타태그 ───

// regression: OG 메타태그가 정상 생성된다 (카카오톡 등 프리뷰 확인)
test.describe('OG 메타태그', () => {
  test('og:title 메타태그가 존재한다', async ({ page }) => {
    const detail = new DetailPage(page);
    await detail.goto(SLUGS.SINGLE);

    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
    expect(ogTitle).toBeTruthy();
    expect(ogTitle!.length).toBeGreaterThan(0);
  });
});
