import { test, expect } from '@playwright/test';

import { DetailPage } from '../helpers/detail-page';

/**
 * 투표 추이 그래프 (VoteTrendChart) — E2E 테스트
 *
 * 체크리스트: qa/detail/checklist.md > 투표 추이 그래프
 */
const SLUGS = {
  /** 미투표 SINGLE (옵션 3개, TEXT 타입) — 시계열 데이터 충분 */
  SINGLE: 'single-text-finance',
  /** 마감된 SINGLE */
  CLOSED: 'single-food-closed',
} as const;

// ─── 투표 전 상태 ───

test.describe('투표 추이 — 투표 전', () => {
  let detail: DetailPage;

  test.beforeEach(async ({ page }) => {
    detail = new DetailPage(page);
    await detail.goto(SLUGS.SINGLE);
  });

  test('차트 섹션이 항상 렌더링된다', async () => {
    await expect(detail.chartSection).toBeVisible({ timeout: 10_000 });
  });

  test('투표 전 차트 블러 + "투표하면 실시간 추이를 확인할 수 있어요" 오버레이가 표시된다', async () => {
    await expect(detail.chartSection).toBeVisible({ timeout: 10_000 });
    await expect(detail.chartBlurOverlay).toBeVisible({ timeout: 10_000 });
  });

  test('투표 전에는 범례가 표시되지 않는다', async () => {
    await expect(detail.chartSection).toBeVisible({ timeout: 10_000 });
    await expect(detail.chartLegend).not.toBeVisible();
  });

  test('투표 전에는 집계 간격 탭이 표시되지 않는다', async () => {
    await expect(detail.chartSection).toBeVisible({ timeout: 10_000 });
    await expect(detail.chartIntervalTabs).not.toBeVisible();
  });

  test('블러 차트에 표시되는 더미 데이터는 실제 투표 결과와 무관한 균등 분배 패턴이다', async () => {
    await expect(detail.chartSection).toBeVisible({ timeout: 10_000 });

    // 블러 상태에서 차트가 렌더링되어야 함 (chartBlurred 클래스)
    const blurredChart = detail.chartSection.locator('[class*="chartBlurred"]');
    await expect(blurredChart).toBeVisible({ timeout: 10_000 });

    // SVG 영역(recharts Area path)이 존재해야 함 — 더미 데이터로 차트가 그려진 증거
    const areaPaths = blurredChart.locator('.recharts-area-area');
    const pathCount = await areaPaths.count();
    expect(pathCount).toBeGreaterThanOrEqual(2);
  });
});

// ─── 투표 후 상태 ───

test.describe('투표 추이 — 투표 후', () => {
  let detail: DetailPage;

  test.beforeEach(async ({ page }) => {
    detail = new DetailPage(page);
    await detail.goto(SLUGS.SINGLE);
    await detail.voteFirstOption();
  });

  test('투표 후 차트 + 범례 + 참여자 수 + 집계 간격 탭이 전체 노출된다', async () => {
    await expect(detail.chartSection).toBeVisible({ timeout: 10_000 });

    // 블러 오버레이가 사라져야 함
    await expect(detail.chartBlurOverlay).not.toBeVisible({ timeout: 10_000 });

    // 범례 표시
    await expect(detail.chartLegend).toBeVisible({ timeout: 10_000 });

    // 참여자 수 표시
    await expect(detail.chartTotalVotes).toBeVisible();
    await expect(detail.chartTotalVotes).toHaveText(/\d+.*명 참여/);

    // 집계 간격 탭 표시
    await expect(detail.chartIntervalTabs).toBeVisible();
  });

  test('기본 선택 interval이 1일이다', async () => {
    await expect(detail.chartIntervalTabs).toBeVisible({ timeout: 10_000 });

    const activeTab = detail.chartIntervalTabs.locator('[aria-selected="true"]');
    await expect(activeTab).toHaveText('1일');
  });

  test('범례에 옵션별 색상 dot + 옵션명 + 최신 득표율(%)이 표시된다', async () => {
    await expect(detail.chartLegend).toBeVisible({ timeout: 10_000 });

    // 범례 항목이 최소 2개 이상 (옵션 수만큼)
    const legendItems = detail.chartSection.locator('[class*="legendItem"]');
    const count = await legendItems.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // 각 항목에 옵션명과 퍼센트가 포함
    const firstItem = legendItems.first();
    await expect(firstItem.locator('[class*="legendDot"]')).toBeVisible();
    await expect(firstItem.locator('[class*="legendLabel"]')).toBeVisible();
    await expect(firstItem.locator('[class*="legendRate"]')).toHaveText(/\d+\.\d+%/);
  });

  test('투표 완료 시 그래프 데이터가 재요청되어 내 투표가 반영된 최신 추이가 표시된다', async ({
    page,
  }) => {
    // 투표 후 차트가 실제 데이터로 전환됨을 확인
    await expect(detail.chartSection).toBeVisible({ timeout: 10_000 });

    // 블러 오버레이가 사라져야 함 (투표 후 → 실제 데이터 표시)
    await expect(detail.chartBlurOverlay).not.toBeVisible({ timeout: 10_000 });

    // 범례가 표시됨 = 실제 데이터가 로드됨 (더미 데이터일 때는 범례 미표시)
    await expect(detail.chartLegend).toBeVisible({ timeout: 10_000 });

    // 참여자 수가 표시됨 = series 데이터가 갱신됨
    await expect(detail.chartTotalVotes).toBeVisible();
    await expect(detail.chartTotalVotes).toHaveText(/\d+.*명 참여/);

    // 네트워크 요청으로 series API가 호출되었는지 확인
    // (투표 후 invalidateQueries로 재요청됨)
    const seriesRequest = page.waitForResponse(
      (resp) => resp.url().includes('/election-series') && resp.status() === 200,
      { timeout: 5_000 }
    );
    // 탭 전환으로 series 재요청 트리거
    const hourTab = detail.chartIntervalTabs.getByRole('tab', { name: '1시간' });
    await hourTab.click();
    const response = await seriesRequest;
    expect(response.ok()).toBe(true);
  });

  test('집계 간격 탭(5분/1시간/1일) 전환 시 데이터가 갱신된다', async () => {
    await expect(detail.chartIntervalTabs).toBeVisible({ timeout: 10_000 });

    // '1시간' 탭 클릭
    const hourTab = detail.chartIntervalTabs.getByRole('tab', { name: '1시간' });
    await hourTab.click();
    await expect(hourTab).toHaveAttribute('aria-selected', 'true');

    // 차트가 여전히 표시됨 (데이터 갱신 후 렌더링 유지)
    await expect(detail.chartLegend).toBeVisible({ timeout: 10_000 });

    // '5분' 탭 클릭
    const minTab = detail.chartIntervalTabs.getByRole('tab', { name: '5분' });
    await minTab.click();
    await expect(minTab).toHaveAttribute('aria-selected', 'true');

    // 차트가 여전히 표시됨
    await expect(detail.chartLegend).toBeVisible({ timeout: 10_000 });
  });
});

// ─── 마감된 투표 ───

test.describe('투표 추이 — 마감된 투표', () => {
  test('마감된 투표에서도 차트 + 범례 + 탭이 노출된다', async ({ page }) => {
    const detail = new DetailPage(page);
    await detail.goto(SLUGS.CLOSED);

    await expect(detail.chartSection).toBeVisible({ timeout: 10_000 });

    // 마감 = showResult이므로 블러 없이 전체 노출
    await expect(detail.chartBlurOverlay).not.toBeVisible({ timeout: 10_000 });
    await expect(detail.chartLegend).toBeVisible({ timeout: 10_000 });
    await expect(detail.chartIntervalTabs).toBeVisible();
    await expect(detail.chartTotalVotes).toBeVisible();
  });
});
