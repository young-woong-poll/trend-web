/**
 * TKUID (Trend-Kkultube Unique ID) 관리 유틸리티
 * 로컬 스토리지를 사용하여 사용자를 식별하고 좋아요/투표 중복 방지
 */

const TKUID_KEY = 'hp_tkuid';
const TKUID_OLD_KEY = 'tkuid';

function generateUUID(): string {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * TKUID를 반환합니다.
 * - 비로그인 유저: 기존 TKUID 반환 또는 신규 생성
 * - 로그인 유저: 기존 TKUID만 반환, 없으면 빈 문자열 (신규 생성 안 함)
 */
export function getTKUID(options?: { isLoggedIn?: boolean }): string {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    // 마이그레이션: 기존 키(tkuid) → 새 키(hp_tkuid)
    const oldValue = localStorage.getItem(TKUID_OLD_KEY);
    if (oldValue && !localStorage.getItem(TKUID_KEY)) {
      localStorage.setItem(TKUID_KEY, oldValue);
      localStorage.removeItem(TKUID_OLD_KEY);
    }

    const tkuid = localStorage.getItem(TKUID_KEY);

    if (tkuid) {
      return tkuid;
    }

    // 로그인 유저는 신규 TKUID를 생성하지 않음
    if (options?.isLoggedIn) {
      return '';
    }

    const newTkuid = generateUUID();
    localStorage.setItem(TKUID_KEY, newTkuid);
    return newTkuid;
  } catch (error) {
    console.error('Failed to access localStorage:', error);
    return options?.isLoggedIn ? '' : generateUUID();
  }
}

export function clearTKUID(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(TKUID_KEY);
  } catch (error) {
    console.error('Failed to clear TKUID:', error);
  }
}

export function hasTKUID(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return localStorage.getItem(TKUID_KEY) !== null;
  } catch {
    return false;
  }
}
