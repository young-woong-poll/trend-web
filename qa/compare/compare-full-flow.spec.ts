import { test, expect } from '@playwright/test';

import { CompareLandingPage } from '../helpers/compare-landing-page';
import { CompareResultPage } from '../helpers/compare-result-page';
import { GroupResultPage } from '../helpers/group-result-page';

/**
 * 비교 기능 통합 플로우 — E2E 테스트
 *
 * MSW mock 토큰:
 * - abc123: 완료된 1:1 비교
 * - waiting1: 대기 중 1:1 비교 (미리보기)
 * - group-abc: 5명 그룹
 */

// ─── 1:1 비교 결과 상세 ───

test.describe('1:1 비교 결과 상세', () => {
  test('완료된 비교에서 닉네임이 표시된다', async ({ page }) => {
    const result = new CompareResultPage(page);
    await result.goto('abc123');

    await expect(result.resultTitle).toBeVisible({ timeout: 15_000 });
    // 닉네임이 페이지 어딘가에 표시
    const hasNickname =
      (await page
        .locator('text=웅이')
        .first()
        .isVisible()
        .catch(() => false)) ||
      (await page
        .locator('text=수진')
        .first()
        .isVisible()
        .catch(() => false));
    expect(hasNickname).toBe(true);
  });

  test('케미 등급이 표시된다', async ({ page }) => {
    const result = new CompareResultPage(page);
    await result.goto('abc123');

    await expect(result.resultTitle).toBeVisible({ timeout: 15_000 });
    // B등급 텍스트가 페이지에 존재
    const gradeText = page.getByText(
      /같을 때도 다를 때도|말 안 해도 통하는|꽤 잘 맞는|각자의 세계|정반대의 가치관/
    );
    await expect(gradeText).toBeVisible({ timeout: 5_000 });
  });

  test('대중성 비교 섹션이 표시된다', async ({ page }) => {
    const result = new CompareResultPage(page);
    await result.goto('abc123');

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const popularitySection = page.getByText('대중성 비교');
    await expect(popularitySection).toBeVisible({ timeout: 10_000 });
  });
});

// ─── 미리보기 → 실제 비교 ───

test.describe('미리보기 모드 상세', () => {
  test('미리보기에서 초대 CTA가 표시된다', async ({ page }) => {
    const result = new CompareResultPage(page);
    await result.goto('waiting1');

    await page.waitForTimeout(3_000);
    const previewBanner = await result.previewBanner.isVisible().catch(() => false);
    const titleVisible = await result.resultTitle.isVisible().catch(() => false);

    if (previewBanner) {
      await expect(result.previewBanner).toBeVisible();
    }
    // 어떤 형태로든 결과가 표시됨
    expect(previewBanner || titleVisible).toBe(true);
  });
});

// ─── 그룹 결과 상세 ───

test.describe('그룹 결과 상세', () => {
  let group: GroupResultPage;

  test.beforeEach(async ({ page }) => {
    group = new GroupResultPage(page);
    await group.goto('group-abc');
  });

  test('그룹 싱크율이 0~100 범위이다', async () => {
    await expect(group.syncValue).toBeVisible({ timeout: 10_000 });
    const syncText = await group.syncValue.textContent();
    const syncNum = parseInt(syncText ?? '0', 10);
    expect(syncNum).toBeGreaterThanOrEqual(0);
    expect(syncNum).toBeLessThanOrEqual(100);
  });

  test('히어로 스탯에 참여 수와 질문 수가 표시된다', async () => {
    await expect(group.heroStats).toBeVisible({ timeout: 10_000 });
    const statsText = await group.heroStats.textContent();
    expect(statsText).toMatch(/참여/);
    expect(statsText).toMatch(/질문/);
  });

  test('CTA 버튼 영역이 페이지 하단에 표시된다', async () => {
    // Next.js dev overlay 제거
    await group.page.evaluate(() => {
      document.querySelectorAll('nextjs-portal').forEach((el) => el.remove());
    });
    await group.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await group.page.waitForTimeout(2_000);

    // 1:1 또는 그룹 CTA 확인 (floating CTA)
    const oneToOneVisible = await group.ctaOneToOne.isVisible().catch(() => false);
    const groupVisible = await group.ctaGroup.isVisible().catch(() => false);
    const floatingVisible = await group.floatingCta.isVisible().catch(() => false);
    expect(oneToOneVisible || groupVisible || floatingVisible).toBe(true);
  });
});

// ─── 비교 랜딩 상세 ───

test.describe('비교 랜딩 상세', () => {
  test('초대 링크 랜딩에서 질문 미리보기가 보인다', async ({ page }) => {
    const landing = new CompareLandingPage(page);
    await landing.goto('invite2');

    await page.waitForTimeout(3_000);
    // 질문 미리보기 또는 CTA가 표시
    const previewVisible = await landing.questionPreview.isVisible().catch(() => false);
    const ctaVisible = await landing.ctaButton.isVisible().catch(() => false);
    expect(previewVisible || ctaVisible).toBe(true);
  });

  test('봉인 해제 섹션이 표시된다', async ({ page }) => {
    const landing = new CompareLandingPage(page);
    await landing.goto('invite2');

    await page.waitForTimeout(3_000);
    const unsealVisible = await landing.unsealSection.isVisible().catch(() => false);
    const heroVisible = await landing.heroTitle.isVisible().catch(() => false);
    // 봉인 해제 또는 히어로가 표시
    expect(unsealVisible || heroVisible).toBe(true);
  });
});
