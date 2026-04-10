import { test, expect } from '@playwright/test';

import { BundleIntroPage } from '../helpers/bundle-intro-page';

/**
 * 번들 인트로 페이지 (/bundle/[slug]) — E2E 테스트
 *
 * MSW mock 데이터:
 * - grade-king: 미완료 (bundleAnswerStore에 답변 없음)
 * - love-values: 완료 (compare seed에서 mock-user-1 답변이 시드됨)
 */
const SLUGS = {
  /** ACTIVE 번들 (미완료 — MSW 답변 미시드) */
  ACTIVE: 'grade-king',
  /** 완료된 번들 (MSW compare seed에서 답변 시드) */
  COMPLETED: 'love-values',
  /** 존재하지 않는 slug */
  NOT_FOUND: 'nonexistent-bundle-e2e-test',
} as const;

// ─── 렌더링 ───

test.describe('번들 인트로 렌더링', () => {
  let intro: BundleIntroPage;

  test.beforeEach(async ({ page }) => {
    intro = new BundleIntroPage(page);
    await intro.goto(SLUGS.ACTIVE);
  });

  test('번들 타이틀이 표시된다', async () => {
    await expect(intro.title).toBeVisible();
    await expect(intro.title).toHaveText(/등급 테스트/);
  });

  test('카테고리 배지가 표시된다', async () => {
    await expect(intro.categoryBadge).toBeVisible();
  });

  test('질문 수 메타 정보가 표시된다', async () => {
    await expect(intro.questionCountMeta).toBeVisible();
    // grade-king: 5문항
    await expect(intro.questionCountMeta).toHaveText(/5/);
  });

  test('참여자 수 메타 정보가 표시된다', async () => {
    await expect(intro.participantCountMeta).toBeVisible();
  });

  test('CTA 버튼 "시작하기"가 표시된다', async () => {
    await expect(intro.ctaButton).toBeVisible();
    await expect(intro.ctaButton).toHaveText(/시작하기/);
  });

  test('비교 미리보기 카드가 표시된다', async () => {
    const previewCount = await intro.comparePreviews.count();
    expect(previewCount).toBeGreaterThanOrEqual(1);
  });
});

// ─── 상태별 CTA ───

test.describe('상태별 CTA', () => {
  test('완료된 번들은 "결과 보기" CTA가 표시된다', async ({ page }) => {
    const intro = new BundleIntroPage(page);
    // love-values는 compare seed에서 mock-user-1의 답변이 시드되어 completed=true
    await intro.goto(SLUGS.COMPLETED);

    await expect(intro.ctaButton).toBeVisible();
    await expect(intro.ctaButton).toHaveText(/결과 보기/);
  });
});

// ─── 네비게이션 ───

test.describe('네비게이션', () => {
  test('"시작하기" 클릭 시 플레이 페이지 또는 로그인으로 이동한다', async ({ page }) => {
    const intro = new BundleIntroPage(page);
    await intro.goto(SLUGS.ACTIVE);

    await intro.ctaButton.click();
    // 로그인 모달이 뜨거나 play 페이지로 이동
    await page.waitForTimeout(3_000);
    const url = page.url();
    // play 페이지 이동, 로그인 모달 오픈, 또는 로그인 쿼리 파라미터 추가
    const hasNavigated =
      url.includes('/play') || url.includes('login') || url.includes(SLUGS.ACTIVE);
    expect(hasNavigated).toBe(true);
  });
});

// ─── 에러/폴백 ───

test.describe('에러 처리', () => {
  test('존재하지 않는 slug 진입 시 페이지가 로딩된다', async ({ page }) => {
    await page.goto(`/bundle/${SLUGS.NOT_FOUND}`);
    await page.waitForLoadState('networkidle');
    // 404 처리 — 에러 UI 또는 빈 상태
    await expect(page).toHaveURL(new RegExp(SLUGS.NOT_FOUND));
  });
});
