import type { Page, Locator } from '@playwright/test';

export class MyPage {
  readonly page: Page;

  // 프로필
  readonly profileName: Locator;
  readonly profileAvatar: Locator;

  // 액션 버튼
  readonly nicknameButton: Locator;
  readonly colorButton: Locator;

  // 계정 관리
  readonly logoutButton: Locator;
  readonly withdrawButton: Locator;

  // 뒤로가기
  readonly backButton: Locator;

  // 스켈레톤
  readonly skeleton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.profileName = page.locator('[class*="profileName"]');
    this.profileAvatar = page.locator('[class*="ProfileAvatar"], [class*="avatar"]').first();

    this.nicknameButton = page.getByRole('button', { name: /닉네임 변경/ });
    this.colorButton = page.getByRole('button', { name: /프로필 색상/ });

    this.logoutButton = page.locator('[class*="logoutButton"]');
    this.withdrawButton = page.locator('[class*="withdrawButton"]');

    this.backButton = page.getByRole('button', { name: '뒤로가기' });

    this.skeleton = page.locator('[class*="skeleton"]');
  }

  /** 마이페이지로 이동 */
  async goto() {
    await this.page.goto('/my');
    await this.page
      .waitForFunction(
        () =>
          document.querySelector('[class*="profileName"]') !== null ||
          document.querySelector('[class*="skeleton"]') !== null ||
          document.querySelector('[class*="loginButton"]') !== null,
        { timeout: 15_000 }
      )
      .catch(async () => {
        await this.page.reload();
        await this.page.waitForFunction(
          () => document.querySelector('[class*="profileName"]') !== null,
          { timeout: 15_000 }
        );
      });
  }
}
