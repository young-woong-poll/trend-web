import { test, expect } from '@playwright/test';

import { BundleResultPage } from '../helpers/bundle-result-page';

/**
 * 1:1 비교 링크 생성 모달 — E2E 테스트
 *
 * BundleResult 페이지에서 "다른친구랑 케미 보기" 클릭 시 열리는 모달
 * MSW mock: love-values (compare seed에서 mock-user-1 답변 시드 → completed)
 */
const SLUG = 'love-values';

/** Next.js dev overlay 제거 (클릭 가로채기 방지) */
async function dismissNextjsOverlay(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    document.querySelectorAll('nextjs-portal').forEach((el) => el.remove());
  });
}

// ─── 모달 렌더링 ───

test.describe('1:1 비교 링크 생성 모달', () => {
  let result: BundleResultPage;

  test.beforeEach(async ({ page }) => {
    result = new BundleResultPage(page);
    await result.goto(SLUG);
    // Next.js dev overlay 제거
    await dismissNextjsOverlay(page);
    // 스크롤 내려서 CTA 표시
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await result.ctaOneToOne.waitFor({ state: 'visible', timeout: 5_000 });
  });

  test('CTA 클릭 시 모달이 열린다', async () => {
    await result.ctaOneToOne.click();

    const modalTitle = result.page.getByText('1:1 케미 테스트 공유');
    await expect(modalTitle).toBeVisible({ timeout: 5_000 });
  });

  test('모달에 번들 정보가 표시된다', async () => {
    await result.ctaOneToOne.click();

    const description = result.page.getByText(/1:1 비교/);
    await expect(description).toBeVisible({ timeout: 5_000 });
  });

  test('링크 생성 후 URL이 표시된다', async () => {
    await result.ctaOneToOne.click();

    // 링크 생성 대기
    const linkText = result.page.locator('[class*="linkText"]');
    await expect(linkText).toBeVisible({ timeout: 10_000 });

    // "링크 생성 중..."이 아닌 실제 URL이 표시됨
    await result.page.waitForFunction(
      () => {
        const el = document.querySelector('[class*="linkText"]');
        return el && !el.textContent?.includes('생성 중');
      },
      { timeout: 10_000 }
    );
  });

  test('"링크 복사하기" 버튼이 표시된다', async () => {
    await result.ctaOneToOne.click();

    const copyButton = result.page.getByText('링크 복사하기');
    await expect(copyButton).toBeVisible({ timeout: 10_000 });
  });

  test('닫기 버튼 클릭 시 모달이 닫힌다', async () => {
    await result.ctaOneToOne.click();

    const modalTitle = result.page.getByText('1:1 케미 테스트 공유');
    await expect(modalTitle).toBeVisible({ timeout: 5_000 });

    const closeButton = result.page.getByRole('button', { name: '닫기' });
    await closeButton.click();

    await expect(modalTitle).not.toBeVisible({ timeout: 3_000 });
  });
});
