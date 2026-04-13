import { test, expect } from '@playwright/test';

import { OfflineVotePage } from '../helpers/offline-vote-page';

/**
 * 오프라인 투표 페이지 — E2E 테스트
 *
 * 커밋 범위: 28b1a22(1차 구축), ba0ea25(1차 개발)
 * 테스트 대상: OfflineVotePage 컴포넌트
 *
 * Playwright route로 hotpick detail, vote API를 직접 mock하여
 * MSW Service Worker 초기화 레이스 컨디션을 완전히 제거합니다.
 *
 * NOTE: server-meta API는 BE에서 제거되었으며(b13aa66), 현재 OfflineVotePage는
 * serverMetaId를 그대로 저장할 뿐 서버 검증을 하지 않습니다. 따라서 위치/기간
 * 배지 관련 테스트는 server-meta가 BE에 재도입될 때까지 제외되어 있습니다.
 */

const VALID_SLUG = 'single-text-finance';
const VALID_META_ID = 'test-server-meta-001';

// ─── 파라미터 검증 ───

test.describe('오프라인 투표 파라미터 검증', () => {
  test('slug와 serverMetaId가 모두 없으면 에러 화면이 표시된다', async ({ page }) => {
    const offline = new OfflineVotePage(page);
    await offline.gotoWithoutParams();
    await expect(offline.errorTitle).toBeVisible();
  });

  test('slug만 있고 serverMetaId가 없으면 에러 화면이 표시된다', async ({ page }) => {
    const offline = new OfflineVotePage(page);
    await page.goto(`/offline-vote?slug=${VALID_SLUG}`);
    await expect(offline.errorTitle).toBeVisible({ timeout: 15_000 });
  });

  test('serverMetaId만 있고 slug가 없으면 에러 화면이 표시된다', async ({ page }) => {
    const offline = new OfflineVotePage(page);
    await page.goto(`/offline-vote?serverMetaId=${VALID_META_ID}`);
    await expect(offline.errorTitle).toBeVisible({ timeout: 15_000 });
  });
});

// ─── 준비(Ready) 화면 ───

test.describe('오프라인 투표 준비 화면', () => {
  let offline: OfflineVotePage;

  test.beforeEach(async ({ page }) => {
    offline = new OfflineVotePage(page);
    await offline.goto(VALID_SLUG, VALID_META_ID);
  });

  test('유효한 파라미터로 접속 시 프리뷰 카드가 표시된다', async () => {
    await expect(offline.previewCard).toBeVisible();
  });

  test('투표 제목이 표시된다', async () => {
    await expect(offline.previewTitle).toBeVisible();
    const title = await offline.previewTitle.textContent();
    expect(title?.length).toBeGreaterThan(0);
  });

  test('투표 옵션이 표시된다', async () => {
    const optionCount = await offline.previewOptions.count();
    expect(optionCount).toBeGreaterThanOrEqual(2);
  });

  test('카테고리 태그가 표시된다', async () => {
    const tagCount = await offline.categoryTags.count();
    expect(tagCount).toBeGreaterThanOrEqual(1);
  });

  test('"투표 시작 (전체화면)" 버튼이 표시된다', async () => {
    await expect(offline.fullscreenButton).toBeVisible();
    const text = await offline.fullscreenButton.textContent();
    expect(text).toContain('투표 시작');
  });
});

// ─── 투표 플로우 ───

test.describe('오프라인 투표 플로우', () => {
  let offline: OfflineVotePage;

  test.beforeEach(async ({ page }) => {
    offline = new OfflineVotePage(page);
    await offline.goto(VALID_SLUG, VALID_META_ID);
  });

  test('투표 시작 시 질문, 옵션, 참여자 수, 안내 텍스트가 표시된다', async () => {
    await offline.enterVoting();
    await expect(offline.voteQuestion).toBeVisible();
    await expect(offline.optionCards.first()).toBeVisible();
    await expect(offline.footerHint).toBeVisible();
    await expect(offline.participantCount).toBeVisible();
    const text = await offline.participantCount.textContent();
    expect(text).toMatch(/\d+.*명 참여/);
  });

  test('옵션 클릭 시 결과 화면이 표시된다', async () => {
    await offline.enterVoting();
    await offline.voteFirstOption();

    const barCount = await offline.resultBars.count();
    expect(barCount).toBeGreaterThanOrEqual(2);

    await expect(offline.resultPercents.first()).toBeVisible();
    await expect(offline.resultPercents.first()).toHaveText(/\d+%/);
  });

  test('투표 후 내 선택에 myChoice 표시가 된다', async () => {
    await offline.enterVoting();
    await offline.voteFirstOption();
    await expect(offline.myChoiceBars.first()).toBeVisible();
  });

  test('결과 화면에 자동 리셋 바와 안내 텍스트가 표시된다', async () => {
    await offline.enterVoting();
    await offline.voteFirstOption();
    await expect(offline.autoResetBar).toBeVisible();
    await expect(offline.autoResetText).toBeVisible();
  });

  test('3초 후 자동으로 투표 화면으로 리셋된다', async () => {
    await offline.enterVoting();
    await offline.voteFirstOption();

    await expect(offline.resultBars.first()).toBeVisible();

    // RESULT_DISPLAY_MS = 3000ms + 여유시간
    await expect(offline.optionCards.first()).toBeVisible({ timeout: 6_000 });
    await expect(offline.footerHint).toBeVisible();
  });
});
