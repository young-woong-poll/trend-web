// NOTE: 카카오 공유하기 바텀시트 비활성화로 인해 전체 주석 처리 (코드 보존)

// import { test, expect } from '@playwright/test';
//
// import { DetailPage } from './helpers/detail-page';
// import { MainPage } from './helpers/main-page';
// import { ShareBottomSheetHelper } from './helpers/share-bottom-sheet';
//
// /**
//  * 공유하기 바텀시트 — E2E 테스트 (MSW mock 데이터 사용)
//  *
//  * 커밋 범위: 298b66c(공유하기 1차), 66eb3ec(바텀시트), a936777(카카오 공유)
//  * 테스트 대상: ShareBottomSheet 컴포넌트
//  */
//
// const SLUG = 'single-text-finance';
//
// // ─── 상세페이지에서 공유 바텀시트 ───
//
// test.describe('상세페이지 공유하기 바텀시트', () => {
//   let detail: DetailPage;
//   let sheet: ShareBottomSheetHelper;
//
//   test.beforeEach(async ({ page }) => {
//     detail = new DetailPage(page);
//     sheet = new ShareBottomSheetHelper(page);
//     await detail.goto(SLUG);
//     // 투표 후 공유 버튼 활성화
//     await detail.voteFirstOption();
//   });
//
//   test('투표 후 공유 버튼 클릭 시 바텀시트가 열린다', async () => {
//     await detail.shareButton.click();
//     await sheet.waitForOpen();
//     await expect(sheet.sheet).toBeVisible();
//   });
//
//   test('바텀시트에 핫픽 제목이 표시된다', async () => {
//     await detail.shareButton.click();
//     await sheet.waitForOpen();
//     await expect(sheet.hotpickTitle).toBeVisible();
//     const title = await sheet.hotpickTitle.textContent();
//     expect(title?.length).toBeGreaterThan(0);
//   });
//
//   test('바텀시트에 카카오톡, 링크 복사 버튼이 표시된다', async () => {
//     await detail.shareButton.click();
//     await sheet.waitForOpen();
//     await expect(sheet.kakaoShareButton).toBeVisible();
//     await expect(sheet.copyLinkButton).toBeVisible();
//   });
//
//   test('링크 복사 클릭 시 토스트가 표시된다', async () => {
//     await detail.shareButton.click();
//     await sheet.waitForOpen();
//     await sheet.copyLinkButton.click();
//     await expect(detail.page.getByText('링크가 복사되었습니다')).toBeVisible({ timeout: 5_000 });
//   });
//
//   test('카카오톡 공유 클릭 시 SDK 미로드 fallback 토스트가 표시된다', async () => {
//     await detail.shareButton.click();
//     await sheet.waitForOpen();
//     await sheet.kakaoShareButton.click();
//     // MSW 환경에서 카카오 SDK 미로드 → 클립보드 복사 fallback
//     await expect(detail.page.getByText('카카오톡 공유 링크가 복사되었습니다')).toBeVisible({
//       timeout: 5_000,
//     });
//   });
//
//   test('닫기 버튼 클릭 시 바텀시트가 닫힌다', async () => {
//     await detail.shareButton.click();
//     await sheet.waitForOpen();
//     await sheet.closeButton.click();
//     await sheet.waitForClose();
//     await expect(sheet.sheet).not.toBeVisible();
//   });
// });
//
// // ─── 메인페이지에서 공유 바텀시트 ───
//
// test.describe('메인페이지 공유하기 바텀시트', () => {
//   let main: MainPage;
//   let sheet: ShareBottomSheetHelper;
//
//   test.beforeEach(async ({ page }) => {
//     main = new MainPage(page);
//     sheet = new ShareBottomSheetHelper(page);
//     await main.goto();
//   });
//
//   test('메인 카드의 공유 버튼 클릭 시 바텀시트가 열린다', async () => {
//     const shareBtn = main.shareButton(0);
//     await expect(shareBtn).toBeVisible();
//     await shareBtn.click();
//     await sheet.waitForOpen();
//     await expect(sheet.sheet).toBeVisible();
//   });
//
//   test('바텀시트에 옵션 프리뷰(vs 형식)가 표시된다', async () => {
//     const shareBtn = main.shareButton(0);
//     await shareBtn.click();
//     await sheet.waitForOpen();
//     await expect(sheet.hotpickOptions).toBeVisible();
//     const text = await sheet.hotpickOptions.textContent();
//     expect(text).toContain('vs');
//   });
// });
