import type { Page, Locator } from '@playwright/test';

/**
 * 공유하기 바텀시트 Page Object
 *
 * MainView 또는 SingleDetailView에서 공유 버튼을 통해 열리는 모달.
 * Portal로 렌더링되므로 page 전역에서 Locator를 잡습니다.
 */
export class ShareBottomSheetHelper {
  readonly page: Page;

  /** 바텀시트 컨테이너 */
  readonly sheet: Locator;

  /** 닫기 버튼 */
  readonly closeButton: Locator;

  /** 카카오톡 공유 버튼 */
  readonly kakaoShareButton: Locator;

  /** 링크 복사 버튼 */
  readonly copyLinkButton: Locator;

  /** "내 링크로 공유" 토글 스위치 (label 요소, 클릭 가능) */
  readonly myLinkToggle: Locator;

  /** "내 링크로 공유" 체크박스 (hidden input, 상태 확인용) */
  readonly myLinkCheckbox: Locator;

  /** 핫픽 제목 프리뷰 */
  readonly hotpickTitle: Locator;

  /** 옵션 프리뷰 (vs 텍스트 포함) */
  readonly hotpickOptions: Locator;

  constructor(page: Page) {
    this.page = page;

    this.sheet = page.getByTestId('share-bottom-sheet');
    this.closeButton = this.sheet.getByRole('button', { name: '닫기' });
    this.kakaoShareButton = this.sheet.getByRole('button', { name: '카카오톡' });
    this.copyLinkButton = this.sheet.getByRole('button', { name: '링크 복사' });
    this.myLinkToggle = this.sheet.locator('[class*="toggleSwitch"]');
    this.myLinkCheckbox = this.sheet.locator('input[type="checkbox"]');
    this.hotpickTitle = this.sheet.locator('[class*="hotpickTitle"]');
    this.hotpickOptions = this.sheet.locator('[class*="hotpickOptions"]');
  }

  /** 바텀시트가 열릴 때까지 대기 */
  async waitForOpen() {
    await this.sheet.waitFor({ state: 'visible', timeout: 5_000 });
  }

  /** 바텀시트가 닫힐 때까지 대기 */
  async waitForClose() {
    await this.sheet.waitFor({ state: 'hidden', timeout: 5_000 });
  }
}
