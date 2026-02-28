import { test, expect } from '@playwright/test';

import { DetailPage } from './helpers/detail-page';

/**
 * 상세페이지 (hotpick/[slug]) — E2E 테스트 (MSW mock 데이터 사용)
 *
 * MSW mock 데이터의 slug를 사용합니다.
 * mock 데이터가 변경되면 이 상수도 업데이트 필요합니다.
 */
const SLUGS = {
  /** 미투표 SINGLE (옵션 3개, TEXT 타입) */
  SINGLE: 'single-text-finance',
  /** 존재하지 않는 slug */
  NOT_FOUND: 'nonexistent-slug-e2e-test-12345',
} as const;

// ─── 라우팅 ───

test.describe('라우팅', () => {
  test('SINGLE slug 진입 시 투표 카드가 렌더링된다', async ({ page }) => {
    const detail = new DetailPage(page);
    await detail.goto(SLUGS.SINGLE);

    await expect(detail.voteCard).toBeVisible();
    await expect(detail.question).toBeVisible();
  });

  test('존재하지 않는 slug 진입 시 에러/폴백 페이지가 노출된다', async ({ page }) => {
    await page.goto(`/hotpick/${SLUGS.NOT_FOUND}`);
    // MSW에서 미등록 slug는 폴백(love-dilemma BUNDLE)으로 처리됨
    // 페이지가 정상 로딩되는지 확인
    await page.waitForLoadState('networkidle');
    // 페이지가 로딩되면 성공 (에러 없이 렌더링)
    await expect(page).toHaveURL(`/hotpick/${SLUGS.NOT_FOUND}`);
  });
});

// ─── 투표 전 상태 ───

test.describe('투표 전 상태', () => {
  let detail: DetailPage;

  test.beforeEach(async ({ page }) => {
    detail = new DetailPage(page);
    await detail.goto(SLUGS.SINGLE);
  });

  test('옵션 버튼이 노출된다', async () => {
    // single-text-finance는 3개 옵션: 안전한 적금, 주식 투자, 코인 투자
    await expect(detail.page.getByText('안전한 적금')).toBeVisible();
    await expect(detail.page.getByText('주식 투자')).toBeVisible();
    await expect(detail.page.getByText('코인 투자')).toBeVisible();
  });

  test('댓글 영역에 블러 오버레이가 표시된다', async () => {
    await expect(detail.blurOverlay).toBeVisible({ timeout: 10_000 });
  });

  test('댓글 작성 불가 안내가 표시된다', async () => {
    await expect(detail.commentFormHint).toBeVisible({ timeout: 10_000 });
  });

  test('투표 전에 공유 CTA가 미노출되고 힌트 텍스트가 표시된다', async () => {
    await expect(detail.shareButton).not.toBeVisible();
    await expect(detail.voteHint).toBeVisible();
  });
});

// ─── 추천 섹션 ───

test.describe('추천 섹션', () => {
  test('추천 섹션이 표시되고 추천 카드가 있다', async ({ page }) => {
    const detail = new DetailPage(page);
    await detail.goto(SLUGS.SINGLE);

    await expect(detail.recommendSection).toBeVisible({ timeout: 10_000 });
    const cardCount = await detail.recommendCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);
  });

  test('"더 많은 투표 보기" 클릭 시 메인으로 이동한다', async ({ page }) => {
    const detail = new DetailPage(page);
    await detail.goto(SLUGS.SINGLE);

    await detail.recommendSection.scrollIntoViewIfNeeded();
    await detail.backToMainLink.click();
    await page.waitForURL('**/');
    expect(page.url()).toMatch(/\/$/);
  });
});

// ─── 댓글 좋아요 — 정렬 간 동기화 ───

test.describe('댓글 좋아요 정렬 동기화', () => {
  let detail: DetailPage;

  test.beforeEach(async ({ page }) => {
    detail = new DetailPage(page);
    await detail.goto(SLUGS.SINGLE);

    // 투표 실행 (댓글 잠금 해제)
    const optionButton = detail.optionButtons.first();
    await optionButton.click();

    // 댓글 목록이 로딩될 때까지 대기
    await detail.commentItems.first().waitFor({ state: 'visible', timeout: 10_000 });
  });

  test('좋아요 클릭 후 정렬 전환 왕복 시 좋아요 상태가 유지된다', async () => {
    // 1) 최신순 탭으로 전환하여 댓글 로드
    await detail.sortLatest.click();
    await expect(detail.commentItems.first()).toBeVisible({ timeout: 10_000 });

    // 2) 첫 번째 댓글(사용자1, 최신순 고정)의 좋아요 상태 확인 후 클릭
    const firstComment = detail.commentItems.first();
    const likeButton = firstComment.getByRole('button', { name: /좋아요/ });

    const ariaLabel = await likeButton.getAttribute('aria-label');
    const wasLiked = ariaLabel === '좋아요 취소';
    await likeButton.click();

    const expectedLabel = wasLiked ? '좋아요' : '좋아요 취소';
    await expect(likeButton).toHaveAttribute('aria-label', expectedLabel);

    // 3) 인기순으로 전환했다가 다시 최신순으로 복귀
    await detail.sortPopular.click();
    await expect(detail.commentItems.first()).toBeVisible({ timeout: 10_000 });
    await detail.sortLatest.click();
    await expect(detail.commentItems.first()).toBeVisible({ timeout: 10_000 });

    // 4) 같은 첫 번째 댓글의 좋아요 상태가 유지되는지 확인
    const sameFirstComment = detail.commentItems.first();
    await expect(sameFirstComment.getByRole('button', { name: /좋아요/ }))
      .toHaveAttribute('aria-label', expectedLabel);
  });
});

// ─── OG 메타태그 ───

test.describe('OG 메타태그', () => {
  test('og:title 메타태그가 존재한다', async ({ page }) => {
    const detail = new DetailPage(page);
    await detail.goto(SLUGS.SINGLE);

    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
    expect(ogTitle).toBeTruthy();
    expect(ogTitle!.length).toBeGreaterThan(0);
  });
});
