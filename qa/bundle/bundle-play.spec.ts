import { test, expect } from '@playwright/test';

import { BundlePlayPage } from '../helpers/bundle-play-page';

/**
 * 번들 플레이 페이지 (/bundle/[slug]/play) — E2E 테스트
 *
 * MSW mock 데이터:
 * - love-values: 5문항 번들 (썸 탈 때, 전 애인 사진, 기념일, 이성친구, 싸우면)
 */
const SLUGS = {
  /** 미완료 번들 (MSW 답변 미시드) */
  ACTIVE: 'grade-king',
} as const;

const TOTAL_QUESTIONS = 5;

// ─── 렌더링 ───

test.describe('번들 플레이 렌더링', () => {
  let play: BundlePlayPage;

  test.beforeEach(async ({ page }) => {
    play = new BundlePlayPage(page);
    await play.goto(SLUGS.ACTIVE);
  });

  test('프로그레스 바가 표시된다', async () => {
    await expect(play.topBar).toBeVisible();
  });

  test('질문 번호 "Q1"이 표시된다', async () => {
    await expect(play.questionNumber).toBeVisible();
    await expect(play.questionNumber).toHaveText(/Q1/);
  });

  test('질문 텍스트가 표시된다', async () => {
    await expect(play.questionText).toBeVisible();
  });

  test('옵션 A, B 버튼이 표시된다', async () => {
    const optionCount = await play.optionButtons.count();
    expect(optionCount).toBe(2);
  });
});

// ─── 투표 흐름 ───

test.describe('투표 흐름', () => {
  let play: BundlePlayPage;

  test.beforeEach(async ({ page }) => {
    play = new BundlePlayPage(page);
    await play.goto(SLUGS.ACTIVE);
  });

  test('옵션 A 클릭 시 다음 질문으로 자동 이동한다', async () => {
    await expect(play.questionNumber).toHaveText(/Q1/);
    await play.selectOptionA();

    // Q2로 이동 대기
    await expect(play.questionNumber).toHaveText(/Q2/, { timeout: 3_000 });
  });

  test('옵션 B 클릭 시 다음 질문으로 자동 이동한다', async () => {
    await expect(play.questionNumber).toHaveText(/Q1/);
    await play.selectOptionB();

    await expect(play.questionNumber).toHaveText(/Q2/, { timeout: 3_000 });
  });

  test('뒤로가기 버튼 클릭 시 이전 질문으로 돌아간다', async () => {
    // Q1 답변
    await play.selectOptionA();
    await expect(play.questionNumber).toHaveText(/Q2/, { timeout: 3_000 });

    // 뒤로가기
    await play.backButton.click();
    await expect(play.questionNumber).toHaveText(/Q1/, { timeout: 3_000 });
  });

  test('마지막 질문 답변 후 "결과 보기" 제출 버튼이 표시된다', async () => {
    // Q1 ~ Q4 답변
    for (let i = 0; i < TOTAL_QUESTIONS - 1; i++) {
      await play.selectOptionA();
      await play.page.waitForTimeout(600);
    }

    // Q5 (마지막) 답변
    await play.selectOptionA();

    // 제출 버튼 표시 확인
    await expect(play.submitButton).toBeVisible({ timeout: 5_000 });
    await expect(play.submitButton).toHaveText(/결과 보기/);
  });
});

// ─── 제출 ───

test.describe('제출', () => {
  test('모든 질문 답변 후 제출 시 결과 페이지로 이동한다', async ({ page }) => {
    const play = new BundlePlayPage(page);
    await play.goto(SLUGS.ACTIVE);

    await play.answerAllAndSubmit(TOTAL_QUESTIONS);

    // 결과 페이지 이동 대기
    await page.waitForURL(`**/bundle/${SLUGS.ACTIVE}/result**`, { timeout: 10_000 });
    expect(page.url()).toContain('/result');
  });
});
