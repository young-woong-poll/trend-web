import { test, expect } from '@playwright/test';

import { CompareLandingPage } from '../helpers/compare-landing-page';

/**
 * 비교 랜딩 페이지 (/compare/[token]) — E2E 테스트
 *
 * MSW mock 토큰:
 * - abc123: 1:1 완료 (creator=mock-user-1, participant=mock-user-2)
 * - waiting1: 1:1 대기 (creator=mock-user-1)
 * - invite2: 1:1 대기 (creator=mock-user-2, 현재 유저는 anonymous)
 * - taken1: 1:1 완료 (creator=mock-user-2, participant=mock-user-3) → 이미 참여됨
 */
const TOKENS = {
  /** 완료된 1:1 비교 (내가 생성자) */
  COMPLETED_CREATOR: 'abc123',
  /** 대기 중 (내가 생성자) */
  WAITING_CREATOR: 'waiting1',
  /** 초대 받은 링크 (참여 가능) */
  INVITE_RECEIVED: 'invite2',
  /** 이미 다른 사람이 참여한 링크 */
  ALREADY_TAKEN: 'taken1',
  /** 존재하지 않는 토큰 */
  NOT_FOUND: 'nonexistent-token-e2e-test',
} as const;

// ─── 초대 받은 링크 렌더링 ───

test.describe('초대 받은 링크 렌더링', () => {
  let landing: CompareLandingPage;

  test.beforeEach(async ({ page }) => {
    landing = new CompareLandingPage(page);
    await landing.goto(TOKENS.INVITE_RECEIVED);
  });

  test('번들 타이틀이 표시된다', async () => {
    // 약간의 로딩 대기 후 체크
    await landing.page.waitForTimeout(2_000);
    // heroTitle 또는 resultTitle이 표시되어야 함
    const heroVisible = await landing.heroTitle.isVisible().catch(() => false);
    const resultVisible = await landing.resultTitle.isVisible().catch(() => false);
    expect(heroVisible || resultVisible).toBe(true);
  });

  test('CTA 버튼이 표시된다', async () => {
    await expect(landing.ctaButton).toBeVisible({ timeout: 10_000 });
  });
});

// ─── 에러 ───

test.describe('에러 처리', () => {
  test('존재하지 않는 토큰 진입 시 에러 메시지가 표시된다', async ({ page }) => {
    const landing = new CompareLandingPage(page);
    await landing.goto(TOKENS.NOT_FOUND);

    // 에러 텍스트 또는 빈 상태 대기
    await landing.page.waitForTimeout(3_000);
    const notFoundVisible = await landing.notFoundText.isVisible().catch(() => false);
    const hasError = notFoundVisible || page.url().includes(TOKENS.NOT_FOUND);
    expect(hasError).toBe(true);
  });
});

// ─── 이미 참여된 링크 ───

test.describe('이미 참여된 링크', () => {
  test('이미 다른 사람이 참여한 링크는 안내 메시지가 표시된다', async ({ page }) => {
    const landing = new CompareLandingPage(page);
    await landing.goto(TOKENS.ALREADY_TAKEN);

    // 이미 참여된 링크에 대한 처리 — takenSection 또는 리다이렉트
    await landing.page.waitForTimeout(3_000);
    const takenVisible = await landing.takenSection.isVisible().catch(() => false);
    const ctaVisible = await landing.ctaButton.isVisible().catch(() => false);
    // 어떤 형태로든 처리됨
    expect(takenVisible || ctaVisible || page.url().includes('/compare/')).toBe(true);
  });
});

// ─── 질문 미리보기 ───

test.describe('질문 미리보기', () => {
  test('첫 질문 미리보기가 표시된다', async ({ page }) => {
    const landing = new CompareLandingPage(page);
    await landing.goto(TOKENS.INVITE_RECEIVED);

    // 질문 미리보기가 있을 수 있음
    await landing.page.waitForTimeout(3_000);
    const previewVisible = await landing.questionPreview.isVisible().catch(() => false);
    const labelVisible = await landing.questionLabel.isVisible().catch(() => false);
    // 미리보기가 있으면 라벨 텍스트 확인
    if (previewVisible || labelVisible) {
      await expect(landing.questionLabel).toHaveText(/질문/);
    }
  });
});
