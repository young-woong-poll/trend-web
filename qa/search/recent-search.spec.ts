import { test, expect } from '@playwright/test';

import { SearchPage } from '../helpers/search-page';

/**
 * 최근 검색어 — E2E 테스트 (Mobile)
 *
 * 체크리스트 대응: qa/search/checklist.md > 4.3. 최근 검색어
 */

test.describe('최근 검색어', () => {
  let search: SearchPage;

  test.beforeEach(async ({ page }) => {
    search = new SearchPage(page);
    await search.setupSearchMock();
    await search.clearRecentKeywords();
  });

  test('최근 검색어가 localStorage(hotpick_recent_search)에 저장된다', async () => {
    await search.goto();
    await search.searchInput.fill('데이트');
    await expect(search.previewCards.first()).toBeVisible({ timeout: 10_000 });

    // 카드 클릭 시 최근 검색어 저장
    await search.previewCards.first().click();
    await search.page.waitForLoadState('domcontentloaded');

    const keywords = await search.getRecentKeywords();
    expect(keywords).toContain('데이트');
  });

  test('최근 검색어 개별 삭제(✕)가 동작한다', async () => {
    await search.setRecentKeywords(['데이트', '재테크', '치킨']);
    await search.goto();
    await expect(search.recentItems).toHaveCount(3);

    // '재테크' 삭제
    await search.recentRemoveButton('재테크').click();
    await expect(search.recentItems).toHaveCount(2);

    // localStorage에서도 삭제 확인
    const keywords = await search.getRecentKeywords();
    expect(keywords).not.toContain('재테크');
    expect(keywords).toContain('데이트');
    expect(keywords).toContain('치킨');
  });

  test('최근 검색어 전체 삭제가 동작한다', async () => {
    await search.setRecentKeywords(['데이트', '재테크', '치킨']);
    await search.goto();
    await expect(search.recentItems).toHaveCount(3);

    await search.clearAllButton.click();
    await expect(search.recentItems).toHaveCount(0);
    await expect(search.emptyRecentText).toBeVisible();

    const keywords = await search.getRecentKeywords();
    expect(keywords).toHaveLength(0);
  });

  test('최근 검색어가 최대 10개까지 유지된다', async () => {
    const manyKeywords = Array.from({ length: 12 }, (_, i) => `키워드${i + 1}`);
    await search.setRecentKeywords(manyKeywords);
    await search.goto();

    // 최대 10개만 표시
    await expect(search.recentItems).toHaveCount(10);
  });

  test('동일 검색어 재검색 시 최상단으로 이동한다', async () => {
    await search.setRecentKeywords(['첫번째', '두번째', '세번째']);
    await search.goto();

    // '세번째'를 검색하여 카드 클릭 → 최상단으로 이동
    await search.searchInput.fill('세번째');
    await expect(search.previewCards.first()).toBeVisible({ timeout: 10_000 });
    await search.previewCards.first().click();
    await search.page.waitForLoadState('domcontentloaded');

    const keywords = await search.getRecentKeywords();
    expect(keywords[0]).toBe('세번째');
  });

  test('최근 검색어 클릭 시 해당 키워드로 검색된다', async () => {
    await search.setRecentKeywords(['데이트']);
    await search.goto();

    await search.recentKeywordButton('데이트').click();
    await expect(search.previewCards.first()).toBeVisible({ timeout: 10_000 });
  });
});
