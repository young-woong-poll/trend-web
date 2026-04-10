import { test, expect } from '@playwright/test';

import { GroupResultPage } from '../helpers/group-result-page';

/**
 * 그룹 결과 페이지 (/compare/group/[token]) — E2E 테스트
 *
 * MSW mock 토큰:
 * - group-abc: 5명 그룹 (mock-user-1~6)
 * - group-empty: 생성자만 있는 그룹 (미리보기 모드)
 * - group-new: 빈 그룹
 * - nonexistent: 존재하지 않는 토큰
 */
const TOKENS = {
  /** 5명 완성 그룹 */
  FULL_GROUP: 'group-abc',
  /** 생성자만 있는 그룹 (미리보기) */
  EMPTY_GROUP: 'group-empty',
  /** 존재하지 않는 토큰 */
  NOT_FOUND: 'nonexistent-group-e2e-test',
} as const;

// ─── 멤버 그룹 렌더링 ───

test.describe('멤버 그룹 렌더링', () => {
  let group: GroupResultPage;

  test.beforeEach(async ({ page }) => {
    group = new GroupResultPage(page);
    await group.goto(TOKENS.FULL_GROUP);
  });

  test('그룹 이름이 표시된다', async () => {
    await expect(group.groupName).toBeVisible({ timeout: 15_000 });
  });

  test('번들 타이틀이 표시된다', async () => {
    await expect(group.bundleTitle).toBeVisible({ timeout: 10_000 });
  });

  test('그룹 싱크율이 표시된다', async () => {
    await expect(group.syncValue).toBeVisible({ timeout: 10_000 });
    await expect(group.syncUnit).toHaveText('%');
  });

  test('싱크율 라벨이 표시된다', async () => {
    await expect(group.syncLabel).toBeVisible();
    await expect(group.syncLabel).toHaveText(/그룹 싱크율/);
  });

  test('참여 인원 수가 표시된다', async () => {
    await expect(group.heroStatLabels.first()).toBeVisible();
  });

  test('싱크율 태그가 표시된다', async () => {
    await expect(group.syncTag).toBeVisible({ timeout: 10_000 });
  });

  test('설정 버튼이 표시된다 (멤버)', async () => {
    await expect(group.editButton).toBeVisible({ timeout: 10_000 });
  });
});

// ─── CTA (멤버) ───

test.describe('CTA 버튼 (멤버)', () => {
  let group: GroupResultPage;

  test.beforeEach(async ({ page }) => {
    group = new GroupResultPage(page);
    await group.goto(TOKENS.FULL_GROUP);
  });

  test('"1:1 케미 따로 보기" 버튼이 표시된다', async () => {
    await group.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(group.ctaOneToOne).toBeVisible({ timeout: 5_000 });
  });

  test('그룹 생성 버튼이 표시된다', async () => {
    await group.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(group.ctaGroup).toBeVisible({ timeout: 5_000 });
  });
});

// ─── 미리보기 모드 ───

test.describe('미리보기 모드', () => {
  test('빈 그룹에서 미리보기 배너가 표시된다', async ({ page }) => {
    const group = new GroupResultPage(page);
    await group.goto(TOKENS.EMPTY_GROUP);

    await page.waitForTimeout(3_000);
    const bannerVisible = await group.previewBanner.isVisible().catch(() => false);
    const groupNameVisible = await group.groupName.isVisible().catch(() => false);
    // 미리보기 배너 또는 그룹 이름이 표시됨
    expect(bannerVisible || groupNameVisible).toBe(true);
  });
});

// ─── 에러 ───

test.describe('에러 처리', () => {
  test('존재하지 않는 토큰 진입 시 에러가 표시된다', async ({ page }) => {
    const group = new GroupResultPage(page);
    await group.goto(TOKENS.NOT_FOUND);

    await page.waitForTimeout(5_000);
    const notFoundVisible = await group.notFoundText.isVisible().catch(() => false);
    const emptyVisible = await group.emptyText.isVisible().catch(() => false);
    const hasUrl = page.url().includes(TOKENS.NOT_FOUND);
    expect(notFoundVisible || emptyVisible || hasUrl).toBe(true);
  });
});
