import { test, expect } from '@playwright/test';

import { DetailPage } from './helpers/detail-page';
import { MainPage } from './helpers/main-page';

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
    const likeButton = main.likeButton(0);
    await expect(likeButton).toBeVisible({ timeout: 10_000 });
  });

  test('좋아요 클릭 시 아이콘 상태가 변경된다', async () => {
    const likeButton = main.likeButton(0);
    await expect(likeButton).toBeVisible({ timeout: 10_000 });

    // 좋아요 클릭
    await likeButton.click();

    // 좋아요 아이콘의 filled 상태 확인 (svg fill 속성이 none이 아님)
    const svgPath = likeButton.locator('svg path');
    const fill = await svgPath.getAttribute('fill');
    expect(fill).not.toBe('none');
  });

  test('좋아요 취소 시 아이콘이 원래 상태로 돌아간다', async () => {
    const likeButton = main.likeButton(0);
    await expect(likeButton).toBeVisible({ timeout: 10_000 });

    // 좋아요 클릭
    await likeButton.click();

    // filled 상태 확인
    const svgPath = likeButton.locator('svg path');
    let fill = await svgPath.getAttribute('fill');
    expect(fill).not.toBe('none');

    // 좋아요 취소 클릭
    await likeButton.click();

    // 원래 상태 복귀
    fill = await svgPath.getAttribute('fill');
    expect(fill).toBe('none');
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

    // filled 상태 확인
    const svgPath = detail.likeButton.locator('svg path');
    const fill = await svgPath.getAttribute('fill');
    expect(fill).not.toBe('none');
  });

  test('좋아요 취소 시 아이콘이 원래 상태로 돌아간다', async () => {
    await expect(detail.likeButton).toBeVisible({ timeout: 10_000 });

    // 좋아요 → 취소
    await detail.likeButton.click();
    await detail.likeButton.click();

    // 원래 상태 복귀
    const svgPath = detail.likeButton.locator('svg path');
    const fill = await svgPath.getAttribute('fill');
    expect(fill).toBe('none');
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

    // 카운트가 증가했는지 확인 (낙관적 업데이트)
    const countAfter = await likeButton.locator('[class*="likeCount"]').textContent();
    const numAfter = parseInt(countAfter ?? '0', 10) || 0;
    expect(numAfter).toBeGreaterThan(numBefore);
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

    // filled 상태 확인
    const svgPath = detail.likeButton.locator('svg path');
    const fill = await svgPath.getAttribute('fill');
    expect(fill).not.toBe('none');
  });
});
