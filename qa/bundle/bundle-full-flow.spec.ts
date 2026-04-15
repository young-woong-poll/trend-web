import { test, expect } from '@playwright/test';

import { BundleIntroPage } from '../helpers/bundle-intro-page';
import { BundlePlayPage } from '../helpers/bundle-play-page';
import { BundleResultPage } from '../helpers/bundle-result-page';

/**
 * 번들 전체 플로우 — E2E 테스트
 *
 * 인트로 → 플레이 → 결과 → 모달의 E2E 흐름 테스트
 * MSW mock: grade-king (미완료 번들, 5문항)
 */
const SLUG = 'grade-king';
const TOTAL_QUESTIONS = 5;

/** Next.js dev overlay 제거 */
async function dismissOverlay(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    document.querySelectorAll('nextjs-portal').forEach((el) => el.remove());
  });
}

// ─── 인트로 → 플레이 → 결과 전체 흐름 ───

test.describe('인트로 → 플레이 → 결과 전체 흐름', () => {
  test('인트로에서 시작하여 결과까지 도달한다', async ({ page }) => {
    // 1) 인트로 페이지
    const intro = new BundleIntroPage(page);
    await intro.goto(SLUG);
    await expect(intro.ctaButton).toHaveText(/시작하기/);

    // 2) CTA 클릭 → 플레이 페이지
    await intro.ctaButton.click();
    await page.waitForTimeout(2_000);

    // 로그인 상태이면 play 페이지로 이동
    if (page.url().includes('/play')) {
      const play = new BundlePlayPage(page);
      await play.questionNumber.waitFor({ state: 'visible', timeout: 10_000 });

      // 3) 모든 질문 답변
      await play.answerAllAndSubmit(TOTAL_QUESTIONS);

      // 4) 결과 페이지 도달
      await page.waitForURL(`**/bundle/${SLUG}/result**`, { timeout: 10_000 });

      const result = new BundleResultPage(page);
      await expect(result.gradeRing).toBeVisible({ timeout: 15_000 });
      await expect(result.scoreValue).toBeVisible();
      await expect(result.answerCards.first()).toBeVisible();
    }
  });
});

// ─── 결과 페이지에서 모달 열기 ───

test.describe('결과 페이지 모달 인터랙션', () => {
  test('결과에서 1:1 비교 모달을 열고 닫는다', async ({ page }) => {
    const result = new BundleResultPage(page);
    // love-values는 이미 완료된 번들
    await result.goto('love-values');
    await dismissOverlay(page);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await result.ctaOneToOne.waitFor({ state: 'visible', timeout: 5_000 });
    await result.ctaOneToOne.click();

    // 모달 열림
    const modalTitle = page.getByText('1:1 케미 테스트 공유');
    await expect(modalTitle).toBeVisible({ timeout: 5_000 });

    // 모달 닫기
    const closeButton = page.getByRole('button', { name: '닫기' });
    await closeButton.click();
    await expect(modalTitle).not.toBeVisible({ timeout: 3_000 });
  });

  test('결과에서 그룹 생성 모달을 열고 닫는다', async ({ page }) => {
    const result = new BundleResultPage(page);
    await result.goto('love-values');
    await dismissOverlay(page);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await result.ctaGroup.waitFor({ state: 'visible', timeout: 5_000 });
    await result.ctaGroup.click({ force: true });

    // 모달 열림
    const modalTitle = page.getByText('그룹 만들기');
    await expect(modalTitle).toBeVisible({ timeout: 5_000 });

    // 모달 닫기
    const closeButton = page.getByRole('button', { name: '닫기' });
    await closeButton.click();
    await expect(modalTitle).not.toBeVisible({ timeout: 3_000 });
  });
});

// ─── 플레이 페이지 뒤로가기 ───

test.describe('플레이 페이지 네비게이션', () => {
  test('여러 질문을 답변 후 뒤로가기로 수정할 수 있다', async ({ page }) => {
    const play = new BundlePlayPage(page);
    await play.goto(SLUG);

    // Q1 답변
    await play.selectOptionA();
    await expect(play.questionNumber).toHaveText(/Q2/, { timeout: 3_000 });

    // Q2 답변
    await play.selectOptionB();
    await expect(play.questionNumber).toHaveText(/Q3/, { timeout: 3_000 });

    // 뒤로가기 2번
    await play.backButton.click();
    await expect(play.questionNumber).toHaveText(/Q2/, { timeout: 3_000 });

    await play.backButton.click();
    await expect(play.questionNumber).toHaveText(/Q1/, { timeout: 3_000 });

    // 다시 답변 진행
    await play.selectOptionB();
    await expect(play.questionNumber).toHaveText(/Q2/, { timeout: 3_000 });
  });
});
