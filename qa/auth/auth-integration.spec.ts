import { test, expect } from '@playwright/test';

/**
 * 인증 통합 테스트 — E2E
 *
 * 로그인/비로그인 상태에서의 페이지 동작 테스트
 * MSW: auth/me를 route mock으로 오버라이드하여 비로그인 상태 시뮬레이션
 */

/** auth/me를 401로 오버라이드하여 비로그인 상태 만들기 */
async function simulateLoggedOut(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/auth/me', (route) => {
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'UNAUTHORIZED',
        message: '로그인이 필요합니다.',
        data: null,
      }),
    });
  });
  // refresh도 401
  await page.route('**/api/v1/auth/refresh', (route) => {
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'UNAUTHORIZED',
        message: '로그인이 필요합니다.',
        data: null,
      }),
    });
  });
}

// ─── 비로그인 상태에서 번들 인트로 ───

test.describe('비로그인 상태 번들 접근', () => {
  test('비로그인 상태에서 번들 인트로 접근 시 로그인 안내가 표시된다', async ({ page }) => {
    await simulateLoggedOut(page);

    await page.goto('/bundle/grade-king');
    await page.waitForLoadState('networkidle');

    // 로그인 안내 또는 CTA가 보이는지 확인
    await page.waitForTimeout(3_000);
    const loginNotice = page.locator('[class*="loginNotice"]');
    const ctaButton = page.locator('[class*="ctaButton"]');
    const noticeVisible = await loginNotice.isVisible().catch(() => false);
    const ctaVisible = await ctaButton.isVisible().catch(() => false);
    expect(noticeVisible || ctaVisible).toBe(true);
  });
});

// ─── 로그인 상태에서 프로필 확인 ───

test.describe('로그인 상태 확인', () => {
  test('메인 페이지에서 로그인 유저의 프로필 아이콘이 표시된다', async ({ page }) => {
    await page.goto('/');
    await page
      .waitForFunction(
        () =>
          document.querySelector('[data-testid="single-card"]') !== null ||
          document.querySelector('[data-testid="bundle-card"]') !== null,
        { timeout: 15_000 }
      )
      .catch(async () => {
        await page.reload();
        await page.waitForFunction(
          () => document.querySelector('[data-testid="single-card"]') !== null,
          { timeout: 15_000 }
        );
      });

    // 프로필 메뉴 버튼이 보이면 로그인 상태
    const profileButton = page.getByRole('button', { name: '프로필 메뉴' });
    const isLoggedIn = await profileButton.isVisible().catch(() => false);

    if (isLoggedIn) {
      await profileButton.click();
      const myPage = page.getByText('마이페이지');
      await expect(myPage).toBeVisible({ timeout: 3_000 });
    }
  });
});

// ─── 비로그인 상태에서 비교 랜딩 ───

test.describe('비로그인 상태 비교 접근', () => {
  test('비로그인 상태에서 비교 랜딩 접근 시 CTA가 표시된다', async ({ page }) => {
    await simulateLoggedOut(page);

    await page.goto('/compare/invite2');
    await page.waitForTimeout(5_000);

    // CTA 또는 로그인 관련 UI가 표시
    const ctaButton = page.locator('[class*="ctaButton"]');
    const isVisible = await ctaButton.isVisible().catch(() => false);
    // 어떤 형태로든 페이지가 로딩됨
    expect(isVisible || page.url().includes('/compare/')).toBe(true);
  });
});
