/**
 * Utility function to combine class names
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Utility function to format date
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Utility function to sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Nickname validation constants and functions
 */
export const NICKNAME_MAX_LENGTH = 10;
export const NICKNAME_REGEX = /^[a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s._-]*$/;

export interface NicknameValidationResult {
  isValid: boolean;
  error?: string;
  trimmedValue: string;
}

/**
 * Validate nickname
 * - Allowed: English, Korean, spaces, numbers, -_.
 * - Max length: 10 characters
 * - Automatically trims whitespace
 */
export function validateNickname(value: string): NicknameValidationResult {
  const trimmedValue = value.trim();

  // Check if empty
  if (!trimmedValue) {
    return {
      isValid: false,
      error: '닉네임을 입력해주세요',
      trimmedValue,
    };
  }

  // Check length
  if (trimmedValue.length > NICKNAME_MAX_LENGTH) {
    return {
      isValid: false,
      error: `닉네임은 최대 ${NICKNAME_MAX_LENGTH}자까지 입력 가능합니다`,
      trimmedValue,
    };
  }

  // Check allowed characters
  if (!NICKNAME_REGEX.test(trimmedValue)) {
    return {
      isValid: false,
      error: '영어, 한글, 숫자, 공백, -_. 만 입력 가능합니다',
      trimmedValue,
    };
  }

  return {
    isValid: true,
    trimmedValue,
  };
}

/**
 * Check if nickname contains only valid characters (without trimming)
 * Used for real-time input validation
 */
export function isValidNicknameCharacters(value: string): boolean {
  return NICKNAME_REGEX.test(value);
}

/**
 * 친구 이름 resolver
 */

export function fNameRes(name: string | undefined, resultId: string): string {
  if (!!name) {
    return name;
  }
  return `친구${resultId.slice(-4)}`;
}

export interface UploadImageOptions {
  prefix?: string; // 파일명 prefix (예: 'trend', 'election')
}

/**
 * Build filename for image upload
 * Format: {prefix}_{timestamp}_{random}.{extension}
 */
export function buildFileName(file: File, options?: UploadImageOptions): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const prefix = options?.prefix || 'image';

  return `${prefix}_${timestamp}_${random}.${extension}`;
}

/**
 * Get relative time string (YouTube style)
 * Examples: "방금 전", "5분전", "3시간전", "2일전", "1주전", "3개월전", "1년전"
 */
export function getRelativeTime(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  // 음수인 경우 (미래 시간) 방금 전으로 표시
  if (diffInSeconds < 0) {
    return '방금 전';
  }

  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;

  if (diffInSeconds < minute) {
    return '방금 전';
  } else if (diffInSeconds < hour) {
    const minutes = Math.floor(diffInSeconds / minute);
    return `${minutes}분전`;
  } else if (diffInSeconds < day) {
    const hours = Math.floor(diffInSeconds / hour);
    return `${hours}시간전`;
  } else if (diffInSeconds < week) {
    const days = Math.floor(diffInSeconds / day);
    return `${days}일전`;
  } else if (diffInSeconds < month) {
    const weeks = Math.floor(diffInSeconds / week);
    return `${weeks}주전`;
  } else if (diffInSeconds < year) {
    const months = Math.floor(diffInSeconds / month);
    return `${months}개월전`;
  } else {
    const years = Math.floor(diffInSeconds / year);
    return `${years}년전`;
  }
}
