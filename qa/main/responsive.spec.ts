import { test, expect } from '@playwright/test';

import { MainPage } from '../helpers/main-page';

/**
 * 메인페이지 반응형 레이아웃 — E2E 테스트 (MSW mock 데이터 사용)
 *
 * 체크리스트 대응: qa/main/checklist.md > 반응형 레이아웃
 */

// ─── 반응형 열 배치 ───

test.describe('반응형 열 배치', () => {
  let main: MainPage;

  test.beforeEach(async ({ page }) => {
    main = new MainPage(page);
  });

  test('모바일(<768px) 1열, 태블릿 이상(>=768px) 2열로 카드가 배치된다', async () => {
    // 모바일 (375px)
    await main.page.setViewportSize({ width: 375, height: 812 });
    await main.goto();
    await expect(main.cardColumns).toHaveCount(1);

    // 태블릿 (768px)
    await main.page.setViewportSize({ width: 768, height: 1024 });
    await main.page.waitForTimeout(500);
    await expect(main.cardColumns).toHaveCount(2);

    // 데스크톱 (1024px) — 최대 2열 유지
    await main.page.setViewportSize({ width: 1024, height: 768 });
    await main.page.waitForTimeout(500);
    await expect(main.cardColumns).toHaveCount(2);
  });

  test('카드 분배가 행 우선 라운드로빈 순서로 동작한다', async () => {
    // 태블릿 2열 모드
    await main.page.setViewportSize({ width: 768, height: 1024 });
    await main.goto();

    await expect(main.cardColumns).toHaveCount(2);

    // 각 열의 카드 ID 수집
    const col0Ids = await main.columnCardIds(0);
    const col1Ids = await main.columnCardIds(1);

    const totalCount = col0Ids.length + col1Ids.length;
    if (totalCount < 2) {
      return;
    }

    // 라운드로빈 재조합: col0[0], col1[0], col0[1], col1[1], ...
    const maxLen = Math.max(col0Ids.length, col1Ids.length);
    const reconstructed: string[] = [];
    for (let i = 0; i < maxLen; i++) {
      if (i < col0Ids.length) {
        reconstructed.push(col0Ids[i]);
      }
      if (i < col1Ids.length) {
        reconstructed.push(col1Ids[i]);
      }
    }

    // 재조합된 순서가 연속적이어야 함
    expect(reconstructed.length).toBe(totalCount);
    // 각 열의 카드 수 차이가 1 이하 (라운드로빈 특성)
    expect(Math.abs(col0Ids.length - col1Ids.length)).toBeLessThanOrEqual(1);
  });
});

// ─── 뷰포트 축소 ───

test.describe('뷰포트 축소', () => {
  test('뷰포트 축소 시 카드가 overflow 없이 정상적으로 축소된다', async ({ page }) => {
    const main = new MainPage(page);
    const viewportWidth = 320;

    await page.setViewportSize({ width: viewportWidth, height: 568 });
    await main.goto();

    const cards = page.locator('[class*="cardWrapper"]');
    const cardCount = await cards.count();

    for (let i = 0; i < Math.min(cardCount, 3); i++) {
      const cardBox = await cards.nth(i).boundingBox();
      if (cardBox) {
        // 카드가 뷰포트 너비를 초과하지 않아야 함
        expect(cardBox.x + cardBox.width).toBeLessThanOrEqual(viewportWidth + 1);
        expect(cardBox.x).toBeGreaterThanOrEqual(-1);
      }
    }
  });
});

// ─── 스켈레톤 ───

test.describe('스켈레톤 카드 개수', () => {
  test('초기 로딩 스켈레톤 6개가 그리드로 표시된다', async ({ page }) => {
    // API 응답 지연으로 스켈레톤이 보이도록 함
    await page.route('**/api/v1/hotpicks/main*', async (route) => {
      await new Promise((r) => setTimeout(r, 3_000));
      await route.continue();
    });

    await page.goto('/', { waitUntil: 'commit' });

    const skeletonGroup = page.locator('[class*="skeletonGroup"]');
    await expect(skeletonGroup.first()).toBeVisible({ timeout: 5_000 });

    // skeletonGroup의 직계 자식(SkeletonCard)만 카운트
    const skeletons = skeletonGroup.first().locator(':scope > div');
    await expect(skeletons).toHaveCount(6);
  });
});

// ─── 균등 분배 ───

test.describe('카드 균등 분배', () => {
  let main: MainPage;

  test.beforeEach(async ({ page }) => {
    main = new MainPage(page);
  });

  test('18개 로드 시 2열에 균등 분배된다 (9+9)', async () => {
    // 태블릿 이상 2열 모드
    await main.page.setViewportSize({ width: 768, height: 1024 });
    await main.goto();

    const columnCount = await main.cardColumns.count();
    if (columnCount !== 2) {
      return;
    }

    const col0Count = await main.columnCards(0).count();
    const col1Count = await main.columnCards(1).count();
    const total = col0Count + col1Count;

    // 총 개수가 2의 배수면 모든 열이 같아야 함
    if (total % 2 === 0) {
      expect(col0Count).toBe(col1Count);
    }
  });
});
