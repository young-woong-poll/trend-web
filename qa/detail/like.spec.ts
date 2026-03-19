import { test, expect } from '@playwright/test';

import { DetailPage } from '../helpers/detail-page';
import { MainPage } from '../helpers/main-page';

/**
 * 핫픽 좋아요 기능 — E2E 테스트 (MSW mock 데이터 사용)
 *
 * API 스펙:
 * - POST /api/v1/hotpicks/:slug/like → 좋아요
 * - DELETE /api/v1/hotpicks/:slug/like → 좋아요 취소
 * - 응답: { liked: boolean, likeCount: number }
 */
const SLUGS = {
  /** 미투표 SINGLE (옵션 3개, TEXT 타입) */
  SINGLE: 'single-text-finance',
  /** 마감된 SINGLE (옵션 2개, TEXT 타입) */
  CLOSED: 'single-food-closed',
} as const;

// ─── 메인 페이지: 좋아요 버튼 노출 ───

test.describe('메인 페이지 좋아요 버튼', () => {
  let main: MainPage;

  test.beforeEach(async ({ page }) => {
    main = new MainPage(page);
    await main.goto();
  });

  test('싱글 카드에 좋아요 버튼이 표시된다', async () => {
    // 카드가 완전히 렌더링될 때까지 대기
    await expect(main.singleCards.first()).toBeVisible({ timeout: 10_000 });
    const likeButton = main.likeButton(0);
    await expect(likeButton).toBeVisible({ timeout: 10_000 });
  });

  test('좋아요 클릭 시 아이콘 상태가 변경된다', async () => {
    const likeButton = main.likeButton(0);
    await expect(likeButton).toBeVisible({ timeout: 10_000 });

    // 좋아요 클릭
    await likeButton.click();

    // filled 상태로 전환될 때까지 대기 (낙관적 업데이트 후 re-render)
    const svgPath = likeButton.locator('svg path');
    await expect(svgPath).not.toHaveAttribute('fill', 'none', { timeout: 5_000 });
  });

  test('좋아요 취소 시 아이콘이 원래 상태로 돌아간다', async () => {
    const likeButton = main.likeButton(0);
    await expect(likeButton).toBeVisible({ timeout: 10_000 });

    const svgPath = likeButton.locator('svg path');

    // 좋아요 클릭 → filled 상태 대기
    await likeButton.click();
    await expect(svgPath).not.toHaveAttribute('fill', 'none', { timeout: 5_000 });

    // 좋아요 취소 클릭 → none 상태 복귀 대기
    await likeButton.click();
    await expect(svgPath).toHaveAttribute('fill', 'none', { timeout: 5_000 });
  });
});

// ─── 상세 페이지: 좋아요 버튼 노출 ───

test.describe('상세 페이지 좋아요 버튼', () => {
  let detail: DetailPage;

  test.beforeEach(async ({ page }) => {
    detail = new DetailPage(page);
    await detail.goto(SLUGS.SINGLE);
  });

  test('상세 페이지에 좋아요 버튼이 표시된다', async () => {
    await expect(detail.likeButton).toBeVisible({ timeout: 10_000 });
  });

  test('좋아요 클릭 시 아이콘 상태가 변경된다', async () => {
    await expect(detail.likeButton).toBeVisible({ timeout: 10_000 });

    // 좋아요 클릭
    await detail.likeButton.click();

    // filled 상태로 전환될 때까지 대기 (낙관적 업데이트 후 re-render)
    const svgPath = detail.likeButton.locator('svg path');
    await expect(svgPath).not.toHaveAttribute('fill', 'none', { timeout: 5_000 });
  });

  test('좋아요 취소 시 아이콘이 원래 상태로 돌아간다', async () => {
    await expect(detail.likeButton).toBeVisible({ timeout: 10_000 });

    const svgPath = detail.likeButton.locator('svg path');

    // 좋아요 클릭 → filled 상태 대기
    await detail.likeButton.click();
    await expect(svgPath).not.toHaveAttribute('fill', 'none', { timeout: 5_000 });

    // 좋아요 취소 클릭 → none 상태 복귀 대기
    await detail.likeButton.click();
    await expect(svgPath).toHaveAttribute('fill', 'none', { timeout: 5_000 });
  });
});

// ─── 상세 페이지: 좋아요 카운트 ───

test.describe('상세 페이지 좋아요 카운트', () => {
  test('좋아요 클릭 시 카운트가 증가한다', async ({ page }) => {
    const detail = new DetailPage(page);
    await detail.goto(SLUGS.SINGLE);

    // 좋아요 버튼의 카운트 영역 확인
    const likeButton = detail.likeButton;
    await expect(likeButton).toBeVisible({ timeout: 10_000 });

    // 좋아요 전 카운트 텍스트 캡처
    const countBefore = await likeButton
      .locator('[class*="likeCount"]')
      .textContent()
      .catch(() => '0');
    const numBefore = parseInt(countBefore ?? '0', 10) || 0;

    // 좋아요 클릭
    await likeButton.click();

    // 카운트가 증가할 때까지 대기 (낙관적 업데이트 후 re-render)
    await expect
      .poll(
        async () => {
          const text = await likeButton
            .locator('[class*="likeCount"]')
            .textContent()
            .catch(() => '0');
          return parseInt(text ?? '0', 10) || 0;
        },
        { timeout: 5_000 }
      )
      .toBeGreaterThan(numBefore);
  });
});

// ─── 마감된 투표: 좋아요 ───

test.describe('마감된 투표 좋아요', () => {
  test('마감된 투표에서도 좋아요 버튼이 동작한다', async ({ page }) => {
    const detail = new DetailPage(page);
    await detail.goto(SLUGS.CLOSED);

    await expect(detail.likeButton).toBeVisible({ timeout: 10_000 });

    // 좋아요 클릭
    await detail.likeButton.click();

    // filled 상태로 전환될 때까지 대기 (낙관적 업데이트 후 re-render)
    const svgPath = detail.likeButton.locator('svg path');
    await expect(svgPath).not.toHaveAttribute('fill', 'none', { timeout: 5_000 });
  });
});
