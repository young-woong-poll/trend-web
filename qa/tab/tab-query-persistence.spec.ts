import { test, expect } from '@playwright/test';
import { TabPage } from '../helpers/tab-page';

/**
 * 탭 쿼리 상태 유지 테스트 — URL 쿼리에 탭 정보가 저장되었는지 확인
 */

test.describe('탭 쿼리 상태 유지', () => {
  let tab: TabPage;

  test.beforeEach(async ({ page }) => {
    tab = new TabPage(page);
    await tab.goto();
  });

  test('탭 클릭 후 URL에 쿼리 파라미터가 저장된다 - HOT 탭', async () => {
    // HOT 탭 클릭
    await tab.clickTab(tab.hotTab);

    // URL에 filter=top 쿼리가 포함되어야 함
    const url = tab.page.url();
    expect(url).toContain('filter=top');
  });

  test('탭 클릭 후 새로고침 시 탭 상태가 유지된다 - HOT 탭', async () => {
    // HOT 탭 클릭
    await tab.clickTab(tab.hotTab);
    await expect(tab.hotTab).toHaveAttribute('aria-selected', 'true');

    // URL 확인
    const urlBefore = tab.page.url();
    expect(urlBefore).toContain('filter=top');

    // 새로고침
    await tab.page.reload();

    // 탭 상태가 유지되었는지 확인
    await expect(tab.hotTab).toHaveAttribute('aria-selected', 'true');
    await expect(tab.newTab).toHaveAttribute('aria-selected', 'false');
  });

  test('탭 클릭 후 새로고침 시 탭 상태가 유지된다 - MY 탭', async () => {
    // MY 탭 클릭
    await tab.clickTab(tab.myTab);
    await expect(tab.myTab).toHaveAttribute('aria-selected', 'true');

    // URL 확인
    const url = tab.page.url();
    expect(url).toContain('filter=my');

    // 새로고침
    await tab.page.reload();

    // 탭 상태가 유지되었는지 확인
    await expect(tab.myTab).toHaveAttribute('aria-selected', 'true');
    await expect(tab.newTab).toHaveAttribute('aria-selected', 'false');
  });

  test.fixme('TOP 탭에서 기간 변경 시 period 쿼리가 저장된다', async () => {
    // FIXME: HOT→TOP 변경 + 기간 UI가 TopSubFilter 컴포넌트로 변경되어 기존 셀렉터 무효
    // HOT 탭 클릭
    await tab.clickTab(tab.hotTab);

    // 기간 드롭다운 열기
    const hotTabButton = await tab.hotTab.locator('button').first();
    await hotTabButton.click();

    // "한주" 옵션 클릭 (period=1w)
    const oneWeekOption = tab.page.locator('button:has-text("한주")').first();
    await oneWeekOption.click();

    // URL에 period=1w 쿼리가 포함되어야 함
    const url = tab.page.url();
    expect(url).toContain('filter=top');
    expect(url).toContain('period=1w');
  });

  test.fixme('TOP 탭 기간 변경 후 새로고침 시 기간이 유지된다', async () => {
    // FIXME: HOT→TOP 변경 + 기간 UI가 TopSubFilter 컴포넌트로 변경되어 기존 셀렉터 무효
    // HOT 탭 클릭
    await tab.clickTab(tab.hotTab);

    // 기간 드롭다운 열기
    const hotTabButton = await tab.hotTab.locator('button').first();
    await hotTabButton.click();

    // "한달" 옵션 클릭 (period=1m)
    const oneMonthOption = tab.page.locator('button:has-text("한달")').first();
    await oneMonthOption.click();

    // URL 확인
    const urlBefore = tab.page.url();
    expect(urlBefore).toContain('period=1m');

    // 새로고침
    await tab.page.reload();

    // 기간이 유지되었는지 확인 (URL에서 period=1m 확인)
    const urlAfter = tab.page.url();
    expect(urlAfter).toContain('period=1m');
  });
});
