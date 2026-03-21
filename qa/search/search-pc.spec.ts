import { test, expect } from '@playwright/test';

import { SearchPage } from '../helpers/search-page';

/**
 * PC 검색 모달 — E2E 테스트 (viewport override ≥768px)
 *
 * 체크리스트 대응: qa/search/checklist.md > 2. 검색 진입점 (PC), 3. 검색 화면 구조 (PC)
 *
 * Playwright 설정이 mobile-chrome(Pixel 5)만 있으므로
 * viewport를 1280×720으로 오버라이드하여 PC 동작을 테스트한다.
 */

test.describe('PC 검색 모달', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  let search: SearchPage;

  test.beforeEach(async ({ page }) => {
    search = new SearchPage(page);
    await search.setupSearchMock();
    await search.clearRecentKeywords();
  });

  test('PC(≥768px): MainHeader에 검색 입력 필드(pill shape)가 표시된다', async () => {
    await search.gotoMain();
    await expect(search.headerSearchBar).toBeVisible();
    // Mobile 전용 돋보기 아이콘은 숨겨짐
    await expect(search.searchIconButton).not.toBeVisible();
  });

  test('PC: 검색창 클릭 시 검색 모달(드롭다운)이 등장한다', async () => {
    await search.gotoMain();
    await search.headerSearchBar.click();
    await expect(search.searchModal).toBeVisible({ timeout: 3_000 });
    // 페이지 이동 없음 (여전히 /)
    await expect(search.page).toHaveURL(/\/$/);
  });

  test('PC: 모달 바깥 클릭 시 모달이 닫힌다', async () => {
    await search.gotoMain();
    await search.headerSearchBar.click();
    await expect(search.searchModal).toBeVisible({ timeout: 3_000 });

    // 모달 바깥(본문 영역) 클릭
    await search.page.locator('body').click({ position: { x: 640, y: 600 } });
    await expect(search.searchModal).not.toBeVisible({ timeout: 3_000 });
  });

  test('PC: ESC 키 입력 시 모달이 닫힌다', async () => {
    await search.gotoMain();
    await search.headerSearchBar.click();
    await expect(search.searchModal).toBeVisible({ timeout: 3_000 });

    await search.page.keyboard.press('Escape');
    await expect(search.searchModal).not.toBeVisible({ timeout: 3_000 });
  });

  test('PC: 검색어 입력 즉시 모달 내에서 결과 미리보기가 표시된다', async () => {
    await search.gotoMain();
    await search.headerSearchBar.click();
    await expect(search.searchModal).toBeVisible({ timeout: 3_000 });

    await search.headerSearchInput.fill('데이트');
    // 모달 내에서 결과 카드 표시
    const modalCards = search.searchModal.locator('[class*="previewCard"]');
    await expect(modalCards.first()).toBeVisible({ timeout: 10_000 });
  });

  test('PC 검색 모달: backdrop(반투명 오버레이)이 표시된다', async () => {
    await search.gotoMain();
    await search.headerSearchBar.click();
    await expect(search.backdrop).toBeVisible({ timeout: 3_000 });
  });

  test('PC 검색 모달: 초기 상태에서 최근 검색어가 표시된다', async () => {
    await search.setRecentKeywords(['데이트', '재테크']);
    await search.gotoMain();
    await search.headerSearchBar.click();
    await expect(search.searchModal).toBeVisible({ timeout: 3_000 });

    const recentItems = search.searchModal.locator('[class*="recentItem"]');
    await expect(recentItems).toHaveCount(2);
  });

  test('PC 검색 모달: 결과 없음 시 빈 상태 메시지가 표시된다', async () => {
    await search.gotoMain();
    await search.headerSearchBar.click();
    await search.headerSearchInput.fill('없는검색어');

    const emptyTitle = search.searchModal.getByText('검색 결과가 없어요');
    await expect(emptyTitle).toBeVisible({ timeout: 10_000 });
  });
});

// ─── PC 라우팅 ───

test.describe('PC 라우팅', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  let search: SearchPage;

  test.beforeEach(async ({ page }) => {
    search = new SearchPage(page);
    await search.setupSearchMock();
  });

  test('PC에서 /search 직접 URL 접근 시 페이지로 렌더링된다', async () => {
    await search.goto();
    await expect(search.searchInput).toBeVisible();
  });
});
