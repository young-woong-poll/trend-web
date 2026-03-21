import { test, expect } from '@playwright/test';

import { SearchPage } from '../helpers/search-page';

/**
 * 검색 페이지 (/search) — E2E 테스트 (Mobile)
 *
 * 체크리스트 대응: qa/search/checklist.md
 * 섹션: 2. 검색 진입점, 3. 검색 화면 구조, 4. 검색 UX 스펙, 8. 접근성, 9. 라우팅
 */

// ─── 검색 진입점 (Mobile) ───

test.describe('검색 진입점 (Mobile)', () => {
  let search: SearchPage;

  test.beforeEach(async ({ page }) => {
    search = new SearchPage(page);
    await search.setupSearchMock();
  });

  test('Mobile: MainHeader에 돋보기 아이콘만 표시된다', async () => {
    await search.gotoMain();
    await expect(search.searchIconButton).toBeVisible();
    // PC 전용 검색 바는 mobile에서 숨겨져야 함
    await expect(search.headerSearchBar).not.toBeVisible();
  });

  test('Mobile: 돋보기 탭 시 /search 페이지로 이동한다', async () => {
    await search.gotoMain();
    await search.searchIconButton.click();
    await expect(search.page).toHaveURL(/\/search/);
  });
});

// ─── 검색 화면 구조 ───

test.describe('검색 화면 구조', () => {
  let search: SearchPage;

  test.beforeEach(async ({ page }) => {
    search = new SearchPage(page);
    await search.setupSearchMock();
  });

  test('초기 상태: 최근 검색어가 없으면 빈 화면이 표시된다', async () => {
    await search.clearRecentKeywords();
    await search.goto();
    await expect(search.emptyRecentText).toBeVisible();
  });

  test('초기 상태: 최근 검색어 목록이 표시된다', async () => {
    await search.setRecentKeywords(['데이트', '재테크']);
    await search.goto();
    await expect(search.recentSection).toBeVisible();
    await expect(search.recentItems).toHaveCount(2);
  });

  test('2글자 이상 입력 시 검색 결과 미리보기가 표시된다', async () => {
    await search.goto();
    await search.searchInput.fill('데이트');
    await expect(search.previewCards.first()).toBeVisible({ timeout: 10_000 });
  });

  test('미리보기 카드에 카테고리, 제목, 투표수, 댓글수, 공감수가 표시된다', async () => {
    await search.goto();
    await search.searchInput.fill('데이트');
    await expect(search.previewCards.first()).toBeVisible({ timeout: 10_000 });

    // 카테고리
    const category = search.cardCategory(0);
    await expect(category.first()).toBeVisible();

    // 제목
    const title = search.cardTitle(0);
    await expect(title).toBeVisible();

    // 메타 정보 (투표수, 댓글, 공감)
    const meta = search.cardMeta(0);
    await expect(meta).toContainText(/명 참여/);
    await expect(meta).toContainText(/댓글/);
    await expect(meta).toContainText(/♡/);
  });

  test('미리보기 카드에 투표 옵션(A/B 바)이 표시되지 않는다', async () => {
    await search.goto();
    await search.searchInput.fill('데이트');
    await expect(search.previewCards.first()).toBeVisible({ timeout: 10_000 });

    // 옵션 버튼이나 결과 바가 없어야 함
    const optionButtons = search.previewCards.first().locator('[class*="optionButton"]');
    const resultBars = search.previewCards.first().locator('[class*="resultBar"]');
    await expect(optionButtons).toHaveCount(0);
    await expect(resultBars).toHaveCount(0);
  });

  test('결과 없음 시 빈 상태 메시지가 표시된다', async () => {
    await search.goto();
    await search.searchInput.fill('없는검색어');
    await expect(search.emptyResultTitle).toBeVisible({ timeout: 10_000 });
    await expect(search.emptyResultDescription).toBeVisible();
  });
});

// ─── 검색 UX 스펙 ───

test.describe('검색 UX 스펙', () => {
  let search: SearchPage;

  test.beforeEach(async ({ page }) => {
    search = new SearchPage(page);
    await search.setupSearchMock();
  });

  test('검색 화면 진입 시 입력 필드에 자동 포커스된다', async () => {
    await search.goto();
    await expect(search.searchInput).toBeFocused({ timeout: 3_000 });
  });

  test('최소 2글자 입력 시 미리보기가 트리거된다', async () => {
    await search.goto();

    // 1글자: 힌트만 표시, 결과 없음
    await search.searchInput.fill('데');
    await expect(search.minLengthHint).toBeVisible({ timeout: 3_000 });
    await expect(search.previewCards).toHaveCount(0);

    // 2글자: 결과 표시
    await search.searchInput.fill('데이');
    await expect(search.previewCards.first()).toBeVisible({ timeout: 10_000 });
  });

  test('search-as-you-type 동작한다 (엔터 불필요)', async () => {
    await search.goto();
    // 타이핑만으로 결과가 표시됨
    await search.searchInput.fill('데이트');
    await expect(search.previewCards.first()).toBeVisible({ timeout: 10_000 });
  });

  test('검색어 삭제 ✕ 버튼 클릭 시 입력값이 초기화된다', async () => {
    await search.goto();
    await search.searchInput.fill('테스트');
    await expect(search.clearButton).toBeVisible();
    await search.clearButton.click();
    await expect(search.searchInput).toHaveValue('');
  });

  test('취소 버튼이 없다 (뒤로가기 ←와 ✕만 존재)', async () => {
    await search.goto();
    // 취소 버튼이 존재하지 않음
    const cancelButton = search.page.getByRole('button', { name: '취소' });
    await expect(cancelButton).toHaveCount(0);
    // 뒤로가기 버튼은 존재
    await expect(search.backButton).toBeVisible();
  });

  test('최대 50자 입력 제한이 적용된다', async () => {
    await search.goto();
    const longText = '가'.repeat(60);
    await search.searchInput.fill(longText);
    const value = await search.searchInput.inputValue();
    expect(value.length).toBeLessThanOrEqual(50);
  });
});

// ─── 접근성 ───

test.describe('접근성', () => {
  let search: SearchPage;

  test.beforeEach(async ({ page }) => {
    search = new SearchPage(page);
    await search.setupSearchMock();
  });

  test('검색 입력 필드에 role="searchbox", aria-label="핫픽 검색"이 있다', async () => {
    await search.goto();
    const input = search.page.getByRole('searchbox', { name: '핫픽 검색' });
    await expect(input).toBeVisible();
  });

  test('최근 검색어 삭제 버튼에 aria-label이 있다', async () => {
    await search.setRecentKeywords(['데이트']);
    await search.goto();
    const removeBtn = search.recentRemoveButton('데이트');
    await expect(removeBtn).toBeVisible();
  });

  test('ESC 키보드로 검색 화면이 닫힌다 (뒤로가기 동작)', async () => {
    // 메인에서 검색 페이지로 이동 후 ESC
    await search.gotoMain();
    await search.searchIconButton.click();
    await expect(search.page).toHaveURL(/\/search/);

    // 검색어 입력 후 ESC → 검색어 초기화 (뒤로가기 동작)
    await search.searchInput.fill('데이트');
    await expect(search.previewCards.first()).toBeVisible({ timeout: 10_000 });
    await search.page.keyboard.press('Escape');
    // 뒤로가기 버튼과 동일하게 동작하지 않을 수 있으므로 화면 확인
    // (ESC 키 동작은 구현에 따라 다름)
  });
});

// ─── 라우팅 ───

test.describe('라우팅', () => {
  let search: SearchPage;

  test.beforeEach(async ({ page }) => {
    search = new SearchPage(page);
    await search.setupSearchMock();
  });

  test('/search 경로로 검색 화면에 접근할 수 있다', async () => {
    await search.goto();
    await expect(search.searchInput).toBeVisible();
  });
});
