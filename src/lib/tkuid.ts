/**
 * TKUID (Trend-Kkultube Unique ID) 관리 유틸리티
 * 세션 스토리지를 사용하여 사용자를 식별하고 좋아요 중복 방지
 */

const TKUID_KEY = 'tkuid';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getTKUID(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    let tkuid = sessionStorage.getItem(TKUID_KEY);

    if (!tkuid) {
      tkuid = generateUUID();
      sessionStorage.setItem(TKUID_KEY, tkuid);
    }

    return tkuid;
  } catch (error) {
    console.error('Failed to access sessionStorage:', error);
    return generateUUID();
  }
}

export function clearTKUID(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    sessionStorage.removeItem(TKUID_KEY);
  } catch (error) {
    console.error('Failed to clear TKUID:', error);
  }
}

export function hasTKUID(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return sessionStorage.getItem(TKUID_KEY) !== null;
  } catch {
    return false;
  }
}
