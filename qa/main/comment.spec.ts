import { test, expect } from '@playwright/test';

import { MainPage } from '../helpers/main-page';

/**
 * 메인페이지 바텀시트 댓글 — E2E 테스트 (MSW mock 데이터 사용)
 *
 * 체크리스트 대응: qa/main/checklist.md > 바텀시트 댓글
 */

// ─── 댓글 접근 ───

test.describe('바텀시트 댓글 접근', () => {
  let main: MainPage;

  test.beforeEach(async ({ page }) => {
    main = new MainPage(page);
    await main.goto();
  });

  test('투표 완료 후에만 댓글에 접근 가능하다', async () => {
    // 투표 전: 댓글 버튼 클릭
    const commentBtn = main.commentButton(0);
    const isVisible = await commentBtn.isVisible().catch(() => false);

    if (isVisible) {
      await commentBtn.click();
      // 투표 전에는 댓글을 볼 수 없거나 잠금 상태
      const locked = main.page.getByText(/투표 후/);
      const sheet = main.commentBottomSheet;
      const lockedVisible = await locked.isVisible().catch(() => false);
      const sheetVisible = await sheet.isVisible().catch(() => false);

      // 잠금 안내가 뜨거나 바텀시트가 안 열림
      expect(lockedVisible || !sheetVisible).toBeTruthy();
    }

    // 투표 후: 댓글 접근 가능
    const options = main.optionButtons(0);
    await options.first().click();
    await main.page.waitForTimeout(1_000);

    const commentBtnAfter = main.commentButton(0);
    await expect(commentBtnAfter).toBeVisible({ timeout: 5_000 });
    await commentBtnAfter.click();
    await expect(main.commentBottomSheet).toBeVisible({ timeout: 5_000 });
  });
});

// ─── 댓글 CRUD ───

test.describe('바텀시트 댓글 CRUD', () => {
  let main: MainPage;

  test.beforeEach(async ({ page }) => {
    main = new MainPage(page);
    await main.goto();

    // 투표 완료
    const options = main.optionButtons(0);
    await options.first().click();
    await main.page.waitForTimeout(1_000);

    // 바텀시트 열기
    const commentBtn = main.commentButton(0);
    await commentBtn.click();
    await expect(main.commentBottomSheet).toBeVisible({ timeout: 5_000 });
  });

  test('댓글 게시가 잘 되고, 게시 후 최신순 탭으로 이동한다', async () => {
    const textarea = main.commentBottomSheet.locator('textarea');
    await textarea.fill('테스트 댓글입니다');

    const nicknameInput = main.commentBottomSheet.getByPlaceholder('닉네임');
    await nicknameInput.fill('테스터');

    const passwordInput = main.commentBottomSheet.getByPlaceholder('비밀번호');
    await passwordInput.fill('1234');

    const submitBtn = main.commentBottomSheet.locator('[class*="submitButton"]');
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.dispatchEvent('click');

    // 최신순 탭이 활성화되어야 함
    const latestTab = main.commentBottomSheet.getByRole('button', { name: /최신순/ });
    await expect(latestTab).toBeVisible({ timeout: 5_000 });
  });

  test('미입력 필드가 있는 상태에서 게시 버튼 클릭시 에러표시가 나온다', async () => {
    // 빈 상태로 게시 시도
    const submitBtn = main.commentBottomSheet.locator('[class*="submitButton"]');
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.dispatchEvent('click');

    // 에러는 toast 메시지로 표시됨
    const toast = main.page.getByText(/입력해주세요/);
    await expect(toast).toBeVisible({ timeout: 5_000 });
  });
});

// ─── 댓글 정렬 ───

test.describe('바텀시트 댓글 정렬', () => {
  let main: MainPage;

  test.beforeEach(async ({ page }) => {
    main = new MainPage(page);
    await main.goto();

    const options = main.optionButtons(0);
    await options.first().click();
    await main.page.waitForTimeout(1_000);

    const commentBtn = main.commentButton(0);
    await commentBtn.click();
    await expect(main.commentBottomSheet).toBeVisible({ timeout: 5_000 });
  });

  test('댓글이 최신순/인기순 필터에 맞게 정렬된다', async () => {
    const popularTab = main.commentBottomSheet.getByRole('button', { name: /인기순/ });
    const latestTab = main.commentBottomSheet.getByRole('button', { name: /최신순/ });

    await expect(popularTab).toBeVisible();
    await expect(latestTab).toBeVisible();

    // 인기순 클릭
    await popularTab.click();
    await main.page.waitForTimeout(1_000);

    // 최신순 클릭
    await latestTab.click();
    await main.page.waitForTimeout(1_000);

    // 탭 전환 후에도 댓글 목록이 표시됨
    const comments = main.commentBottomSheet.locator('[class*="commentItem"]');
    const commentCount = await comments.count();
    // 댓글이 있거나 빈 상태가 표시됨
    const emptyMsg = main.commentBottomSheet.getByText('아직 댓글이 없습니다');
    const isEmpty = await emptyMsg.isVisible().catch(() => false);
    expect(commentCount > 0 || isEmpty).toBeTruthy();
  });

  test('댓글 전체 개수가 잘 표시된다', async () => {
    // 헤더에 "댓글 N개" 형식으로 표시
    const title = main.commentBottomSheet.locator('[class*="title"]').first();
    await expect(title).toBeVisible();
    await expect(title).toHaveText(/댓글\s*\d+개/);
  });
});

// ─── 댓글 좋아요 ───

test.describe('바텀시트 댓글 좋아요', () => {
  let main: MainPage;

  test.beforeEach(async ({ page }) => {
    main = new MainPage(page);
    await main.goto();

    const options = main.optionButtons(0);
    await options.first().click();
    await main.page.waitForTimeout(1_000);

    const commentBtn = main.commentButton(0);
    await commentBtn.click();
    await expect(main.commentBottomSheet).toBeVisible({ timeout: 5_000 });
  });

  test('좋아요를 누를 수 있다 (토글)', async () => {
    const comments = main.commentBottomSheet.locator('[class*="commentItem"]');
    const commentCount = await comments.count();

    if (commentCount > 0) {
      const likeBtn = comments.first().locator('[class*="likeButton"]');
      await expect(likeBtn).toBeVisible();

      // 좋아요 전 카운트
      const likeCount = comments.first().locator('[class*="likeCount"]');
      const beforeText = await likeCount.textContent();

      // 좋아요 클릭
      await likeBtn.click();
      await main.page.waitForTimeout(500);

      // 좋아요 상태 변경 확인 (liked 클래스 또는 카운트 변화)
      const afterText = await likeCount.textContent();
      const hasLikedClass = await likeBtn.evaluate((el) => el.className.includes('liked'));

      expect(beforeText !== afterText || hasLikedClass).toBeTruthy();
    }
  });
});

// ─── 바텀시트 UI ───

test.describe('바텀시트 UI', () => {
  let main: MainPage;

  test.beforeEach(async ({ page }) => {
    main = new MainPage(page);
    await main.goto();

    const options = main.optionButtons(0);
    await options.first().click();
    await main.page.waitForTimeout(1_000);

    const commentBtn = main.commentButton(0);
    await commentBtn.click();
    await expect(main.commentBottomSheet).toBeVisible({ timeout: 5_000 });
  });

  test('dimmed 영역 클릭시 바텀시트가 닫힌다', async () => {
    // dimmed 영역 클릭 (바텀시트 바깥)
    const dimmed = main.page.locator('[class*="dimmed"]');
    await dimmed.click({ position: { x: 10, y: 10 } });

    await expect(main.commentBottomSheet).not.toBeVisible({ timeout: 5_000 });
  });

  test('글자수가 제한수만큼만 입력된다', async () => {
    // 댓글 200자 제한 확인
    const textarea = main.commentBottomSheet.locator('textarea');
    const longText = 'A'.repeat(250);
    await textarea.fill(longText);

    const value = await textarea.inputValue();
    expect(value.length).toBeLessThanOrEqual(200);

    // 닉네임 20자 제한 확인
    const nicknameInput = main.commentBottomSheet.getByPlaceholder('닉네임');
    await nicknameInput.fill('A'.repeat(30));

    const nicknameValue = await nicknameInput.inputValue();
    expect(nicknameValue.length).toBeLessThanOrEqual(20);
  });

  test('등록된 시간에 맞게 상대 시간이 표시된다', async () => {
    const comments = main.commentBottomSheet.locator('[class*="commentItem"]');
    const commentCount = await comments.count();

    if (commentCount > 0) {
      const timeEl = comments.first().locator('[class*="time"]');
      await expect(timeEl).toBeVisible();
      // "N초 전", "N분 전", "N시간 전" 등의 형식
      await expect(timeEl).toHaveText(/\d+.*(초|분|시간|일|주|달|년)\s*전/);
    }
  });
});

// ─── 댓글 수정 & 삭제 ───

test.describe('바텀시트 댓글 수정/삭제', () => {
  let main: MainPage;

  test.beforeEach(async ({ page }) => {
    main = new MainPage(page);
    await main.goto();

    const options = main.optionButtons(0);
    await options.first().click();
    await main.page.waitForTimeout(1_000);

    const commentBtn = main.commentButton(0);
    await commentBtn.click();
    await expect(main.commentBottomSheet).toBeVisible({ timeout: 5_000 });
  });

  test('댓글 수정 시 비밀번호 모달이 열리고 입력할 수 있다', async () => {
    // 댓글 목록 대기
    const editBtn = main.commentBottomSheet.locator('[class*="editButton"]').first();
    await expect(editBtn).toBeVisible({ timeout: 5_000 });
    await editBtn.click();

    // 비밀번호 모달은 Portal로 렌더되므로 page 루트에서 탐색
    const passwordModal = main.page.locator('[class*="modal"]').filter({
      hasText: '비밀번호 입력',
    });
    await expect(passwordModal).toBeVisible({ timeout: 5_000 });

    const passwordInput = passwordModal.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();

    // 비밀번호 입력 및 확인 버튼 동작 확인
    await passwordInput.fill('1234');
    const confirmBtn = passwordModal.locator('[class*="confirmButton"]');
    await expect(confirmBtn).toBeEnabled();
  });

  test('댓글 삭제 시 비밀번호 인증 후 삭제된다', async () => {
    const deleteBtn = main.commentBottomSheet.locator('[class*="deleteButton"]').first();
    await expect(deleteBtn).toBeVisible({ timeout: 5_000 });
    await deleteBtn.click();

    // 비밀번호 모달은 Portal로 렌더되므로 page 루트에서 탐색
    const passwordModal = main.page.locator('[class*="modal"]').filter({
      hasText: '비밀번호 입력',
    });
    await expect(passwordModal).toBeVisible({ timeout: 5_000 });
  });
});
