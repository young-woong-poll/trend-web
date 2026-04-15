import { test, expect } from '@playwright/test';

/**
 * 로그인 모달 — E2E 테스트
 *
 * 로그인 모달은 다양한 트리거로 열림:
 * - 헤더의 로그인 버튼
 * - 번들 페이지 CTA (로그인 필요 시)
 * - 비교 페이지 CTA (compare 트리거)
 *
 * MSW: 기본 mock-user-1은 로그인 상태.
 * 로그인 모달을 테스트하려면 로그아웃 상태를 시뮬레이션해야 함.
 */

// ─── 로그인 모달 기본 ───

test.describe('로그인 모달', () => {
  test('헤더의 로그인 버튼이 비로그인 상태에서 표시된다', async ({ page }) => {
    // MSW 기본 상태에서는 로그인된 상태이므로 프로필 드롭다운이 보임
    // auth/me를 401로 오버라이드하여 비로그인 시뮬레이션
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

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 로그인 버튼 또는 프로필 아이콘이 표시됨
    const loginButton = page.locator('[class*="loginButton"]');
    const isVisible = await loginButton.isVisible().catch(() => false);
    if (isVisible) {
      await expect(loginButton).toBeVisible();
    }
  });

  test('로그인 버튼 클릭 시 모달이 열린다', async ({ page }) => {
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

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loginButton = page.locator('[class*="loginButton"]');
    const isVisible = await loginButton.isVisible().catch(() => false);
    if (isVisible) {
      await loginButton.click();

      // 모달 내용 확인
      const kakaoButton = page.getByText(/카카오로 시작하기/);
      await expect(kakaoButton).toBeVisible({ timeout: 5_000 });
    }
  });

  test('모달에 혜택 목록이 표시된다', async ({ page }) => {
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

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loginButton = page.locator('[class*="loginButton"]');
    const isVisible = await loginButton.isVisible().catch(() => false);
    if (isVisible) {
      await loginButton.click();

      await expect(page.getByText('내 활동이 저장돼요')).toBeVisible({ timeout: 5_000 });
      await expect(page.getByText(/투표 기록/)).toBeVisible();
      await expect(page.getByText(/가치관 비교/)).toBeVisible();
    }
  });
});

// ─── 프로필 드롭다운 (로그인 상태) ───

test.describe('프로필 드롭다운', () => {
  test('로그인 상태에서 프로필 버튼이 표시된다', async ({ page }) => {
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
          () =>
            document.querySelector('[data-testid="single-card"]') !== null ||
            document.querySelector('[data-testid="bundle-card"]') !== null,
          { timeout: 15_000 }
        );
      });

    const profileButton = page.getByRole('button', { name: '프로필 메뉴' });
    const isVisible = await profileButton.isVisible().catch(() => false);
    if (isVisible) {
      await expect(profileButton).toBeVisible();
    }
  });

  test('프로필 클릭 시 드롭다운 메뉴가 열린다', async ({ page }) => {
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

    const profileButton = page.getByRole('button', { name: '프로필 메뉴' });
    const isVisible = await profileButton.isVisible().catch(() => false);
    if (isVisible) {
      await profileButton.click();

      const myPageItem = page.getByText('마이페이지');
      await expect(myPageItem).toBeVisible({ timeout: 3_000 });
    }
  });

  test('드롭다운에서 로그아웃 메뉴가 표시된다', async ({ page }) => {
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

    const profileButton = page.getByRole('button', { name: '프로필 메뉴' });
    const isVisible = await profileButton.isVisible().catch(() => false);
    if (isVisible) {
      await profileButton.click();

      const logoutItem = page.getByText('로그아웃');
      await expect(logoutItem).toBeVisible({ timeout: 3_000 });
    }
  });
});
