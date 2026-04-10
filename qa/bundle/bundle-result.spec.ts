import { test, expect } from '@playwright/test';

import { BundlePlayPage } from '../helpers/bundle-play-page';
import { BundleResultPage } from '../helpers/bundle-result-page';

/**
 * 번들 결과 페이지 (/bundle/[slug]/result) — E2E 테스트
 *
 * MSW mock 데이터:
 * - grade-king: completed=true, 5문항, 대중성 68%+ → 사자왕
 * - love-values: 미완료 번들 (플레이 후 결과 확인)
 */
const SLUGS = {
  /** 이미 완료된 번들 (compare seed에서 mock-user-1 답변 시드) */
  COMPLETED: 'love-values',
  /** 미완료 번들 (플레이 필요) */
  ACTIVE: 'grade-king',
} as const;

const TOTAL_QUESTIONS = 5;

// ─── 이미 완료된 번들 결과 ───

test.describe('완료된 번들 결과 렌더링', () => {
  let result: BundleResultPage;

  test.beforeEach(async ({ page }) => {
    result = new BundleResultPage(page);
    await result.goto(SLUGS.COMPLETED);
  });

  test('결과 타이틀이 표시된다', async () => {
    await expect(result.resultTitle).toBeVisible();
  });

  test('대중성 등급 링이 표시된다', async () => {
    await expect(result.gradeRing).toBeVisible();
  });

  test('대중성 점수가 표시된다', async () => {
    await expect(result.scoreValue).toBeVisible();
    await expect(result.scoreUnit).toHaveText('%');
  });

  test('대중성 등급 타이틀이 표시된다', async () => {
    await expect(result.popularityTitle).toBeVisible();
  });

  test('대중성 등급 설명이 표시된다', async () => {
    await expect(result.popularityDescription).toBeVisible();
  });

  test('참여자 수 힌트가 표시된다', async () => {
    await expect(result.participantHint).toBeVisible();
    await expect(result.participantHint).toHaveText(/명 참여/);
  });
});

// ─── 답변 카드 ───

test.describe('답변 카드', () => {
  let result: BundleResultPage;

  test.beforeEach(async ({ page }) => {
    result = new BundleResultPage(page);
    await result.goto(SLUGS.COMPLETED);
  });

  test('"내 답변 N개" 섹션 헤더가 표시된다', async () => {
    await expect(result.sectionTitle).toBeVisible();
    await expect(result.sectionTitle).toHaveText(/내 답변.*\d+개/);
  });

  test('답변 카드가 질문 수만큼 표시된다', async () => {
    const cardCount = await result.answerCards.count();
    expect(cardCount).toBe(TOTAL_QUESTIONS);
  });

  test('답변 카드에 다수파/소수파 배지가 표시된다', async () => {
    const badgeCount = await result.answerBadges.count();
    expect(badgeCount).toBe(TOTAL_QUESTIONS);
  });

  test('옵션별 퍼센트 바가 표시된다', async () => {
    const fillCount = await result.optionBarFills.count();
    // 각 질문당 2개 옵션 = 총 10개
    expect(fillCount).toBe(TOTAL_QUESTIONS * 2);
  });

  test('퍼센트 텍스트가 표시된다', async () => {
    await expect(result.optionPercents.first()).toBeVisible();
    await expect(result.optionPercents.first()).toHaveText(/\d+%/);
  });
});

// ─── CTA ───

test.describe('CTA 버튼', () => {
  let result: BundleResultPage;

  test.beforeEach(async ({ page }) => {
    result = new BundleResultPage(page);
    await result.goto(SLUGS.COMPLETED);
  });

  test('"다른친구랑 케미 보기" 버튼이 표시된다', async () => {
    await result.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(result.ctaOneToOne).toBeVisible({ timeout: 5_000 });
  });

  test('"그룹 케미 보기" 버튼이 표시된다', async () => {
    await result.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(result.ctaGroup).toBeVisible({ timeout: 5_000 });
  });
});

// ─── 대중성 지수 설명 ───

test.describe('대중성 지수 설명', () => {
  test('도움말 버튼 클릭 시 툴팁이 표시된다', async ({ page }) => {
    const result = new BundleResultPage(page);
    await result.goto(SLUGS.COMPLETED);

    await result.togglePopularityTooltip();
    await expect(result.popularityTooltip).toBeVisible({ timeout: 3_000 });
  });
});

// ─── 전체 흐름: 플레이 → 결과 ───

test.describe('전체 흐름', () => {
  test('번들 플레이 완료 후 결과 페이지에 등급이 표시된다', async ({ page }) => {
    // 1) 번들 플레이
    const play = new BundlePlayPage(page);
    await play.goto(SLUGS.ACTIVE);
    await play.answerAllAndSubmit(TOTAL_QUESTIONS);

    // 2) 결과 페이지 도달 확인
    await page.waitForURL(`**/bundle/${SLUGS.ACTIVE}/result**`, { timeout: 10_000 });

    // 3) 결과 렌더링 확인
    const result = new BundleResultPage(page);
    await expect(result.gradeRing).toBeVisible({ timeout: 15_000 });
    await expect(result.scoreValue).toBeVisible();
  });
});
