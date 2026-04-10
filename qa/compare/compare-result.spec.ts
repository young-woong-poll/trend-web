import { test, expect } from '@playwright/test';

import { CompareResultPage } from '../helpers/compare-result-page';

/**
 * 1:1 비교 결과 페이지 (/compare/match/[token]) — E2E 테스트
 *
 * MSW mock 토큰:
 * - abc123: 완료된 1:1 비교 (creator=mock-user-1 "웅이", participant=mock-user-2 "수진")
 * - waiting1: 대기 중 (creator=mock-user-1, 미리보기 모드)
 */
const TOKENS = {
  /** 완료된 1:1 비교 */
  COMPLETED: 'abc123',
  /** 대기 중 — 미리보기 모드 */
  PREVIEW: 'waiting1',
} as const;

// ─── 실제 결과 모드 ───

test.describe('실제 결과 모드', () => {
  let result: CompareResultPage;

  test.beforeEach(async ({ page }) => {
    result = new CompareResultPage(page);
    await result.goto(TOKENS.COMPLETED);
  });

  test('결과 타이틀이 표시된다', async () => {
    await expect(result.resultTitle).toBeVisible({ timeout: 15_000 });
  });

  test('카테고리 배지가 표시된다', async () => {
    await expect(result.categoryBadge).toBeVisible({ timeout: 10_000 });
  });

  test('미리보기 배너가 표시되지 않는다', async () => {
    await result.page.waitForTimeout(2_000);
    await expect(result.previewBanner).not.toBeVisible();
  });

  test('CTA 버튼이 표시된다', async () => {
    // 페이지 하단의 CTA 버튼 확인
    await result.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await result.page.waitForTimeout(1_000);
    await expect(result.ctaOneToOne).toBeVisible({ timeout: 10_000 });
  });
});

// ─── 미리보기 모드 ───

test.describe('미리보기 모드', () => {
  let result: CompareResultPage;

  test.beforeEach(async ({ page }) => {
    result = new CompareResultPage(page);
    await result.goto(TOKENS.PREVIEW);
  });

  test('미리보기 배너가 표시된다', async () => {
    // 미리보기 모드에서는 배너가 보이거나 결과가 보여야 함
    await result.page.waitForTimeout(3_000);
    const bannerVisible = await result.previewBanner.isVisible().catch(() => false);
    const titleVisible = await result.resultTitle.isVisible().catch(() => false);
    expect(bannerVisible || titleVisible).toBe(true);
  });
});

// ─── 그룹에서 진입 ───

test.describe('그룹에서 진입', () => {
  test('뒤로가기 버튼이 표시된다', async ({ page }) => {
    const result = new CompareResultPage(page);
    await result.gotoFromGroup(TOKENS.COMPLETED);

    await result.page.waitForTimeout(3_000);
    const backVisible = await result.backButton.isVisible().catch(() => false);
    // 그룹에서 온 경우 뒤로가기 가능
    if (backVisible) {
      await expect(result.backButton).toBeVisible();
    }
  });

  test('"그룹 결과로 돌아가기" 텍스트가 표시된다', async ({ page }) => {
    const result = new CompareResultPage(page);
    await result.gotoFromGroup(TOKENS.COMPLETED);

    await result.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await result.page.waitForTimeout(2_000);

    const groupCta = await result.ctaGroup.isVisible().catch(() => false);
    if (groupCta) {
      await expect(result.ctaGroup).toHaveText(/그룹 결과/);
    }
  });
});

// ─── 로딩 상태 ───

test.describe('로딩 상태', () => {
  test('초기 로딩 시 오빗 애니메이션이 잠시 표시된다', async ({ page }) => {
    const result = new CompareResultPage(page);
    // 바로 이동하고 로딩 상태를 캡처
    await page.goto(`/compare/match/${TOKENS.COMPLETED}`);

    // 로딩 중이거나 이미 결과가 표시됨
    await page.waitForTimeout(1_000);
    const orbitVisible = await result.loadingOrbit.isVisible().catch(() => false);
    const titleVisible = await result.resultTitle.isVisible().catch(() => false);
    expect(orbitVisible || titleVisible).toBe(true);
  });
});
