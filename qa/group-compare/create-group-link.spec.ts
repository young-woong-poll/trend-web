import { test, expect } from '@playwright/test';

import { BundleResultPage } from '../helpers/bundle-result-page';

/**
 * 그룹 생성 모달 — E2E 테스트
 *
 * BundleResult 페이지에서 "그룹 케미 보기" 클릭 시 열리는 모달
 * MSW mock: grade-king (completed 번들)
 */
const SLUG = 'love-values';

// ─── 모달 렌더링 ───

test.describe('그룹 생성 모달', () => {
  let result: BundleResultPage;

  test.beforeEach(async ({ page }) => {
    result = new BundleResultPage(page);
    await result.goto(SLUG);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await result.ctaGroup.waitFor({ state: 'visible', timeout: 5_000 });
  });

  test('CTA 클릭 시 모달이 열린다', async () => {
    await result.ctaGroup.click({ force: true });

    const modalTitle = result.page.getByText('그룹 만들기');
    await expect(modalTitle).toBeVisible({ timeout: 5_000 });
  });

  test('그룹 이름 입력 필드가 표시된다', async () => {
    await result.ctaGroup.click({ force: true });

    const input = result.page.locator('[class*="groupNameInput"]');
    await expect(input).toBeVisible({ timeout: 5_000 });
  });

  test('플레이스홀더가 표시된다', async () => {
    await result.ctaGroup.click({ force: true });

    const input = result.page.locator('[class*="groupNameInput"]');
    await expect(input).toHaveAttribute('placeholder', /마케팅팀|대학 친구들/);
  });

  test('"1~20자" 힌트가 표시된다', async () => {
    await result.ctaGroup.click({ force: true });

    const hint = result.page.getByText('1~20자');
    await expect(hint).toBeVisible({ timeout: 5_000 });
  });

  test('"그룹 링크 만들기" 버튼이 표시된다', async () => {
    await result.ctaGroup.click({ force: true });

    const createButton = result.page.getByText('그룹 링크 만들기');
    await expect(createButton).toBeVisible({ timeout: 5_000 });
  });
});

// ─── 유효성 검사 ───

test.describe('그룹 이름 유효성 검사', () => {
  test('빈 이름으로 생성 시도 시 버튼이 비활성화된다', async ({ page }) => {
    const result = new BundleResultPage(page);
    await result.goto(SLUG);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await result.ctaGroup.click({ force: true });

    const createButton = page.locator('[class*="createButton"]');
    await expect(createButton).toBeVisible({ timeout: 5_000 });
    // 입력이 비어있으면 disabled
    await expect(createButton).toBeDisabled();
  });

  test('유효한 이름 입력 시 버튼이 활성화된다', async ({ page }) => {
    const result = new BundleResultPage(page);
    await result.goto(SLUG);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await result.ctaGroup.click({ force: true });

    const input = page.locator('[class*="groupNameInput"]');
    await input.fill('테스트 그룹');

    const createButton = page.locator('[class*="createButton"]');
    await expect(createButton).toBeEnabled();
  });
});

// ─── 그룹 생성 ───

test.describe('그룹 생성', () => {
  test('유효한 이름으로 생성 시 그룹 결과 페이지로 이동한다', async ({ page }) => {
    const result = new BundleResultPage(page);
    await result.goto(SLUG);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await result.ctaGroup.click({ force: true });

    const input = page.locator('[class*="groupNameInput"]');
    await input.fill('E2E 테스트 그룹');

    const createButton = page.locator('[class*="createButton"]');
    await createButton.click();

    // 그룹 결과 페이지로 이동 대기
    await page.waitForURL('**/compare/group/**', { timeout: 10_000 });
    expect(page.url()).toContain('/compare/group/');
  });
});

// ─── 모달 닫기 ───

test.describe('모달 닫기', () => {
  test('닫기 버튼 클릭 시 모달이 닫힌다', async ({ page }) => {
    const result = new BundleResultPage(page);
    await result.goto(SLUG);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await result.ctaGroup.click({ force: true });

    const modalTitle = page.getByText('그룹 만들기');
    await expect(modalTitle).toBeVisible({ timeout: 5_000 });

    const closeButton = page.getByRole('button', { name: '닫기' });
    await closeButton.click();

    await expect(modalTitle).not.toBeVisible({ timeout: 3_000 });
  });
});
