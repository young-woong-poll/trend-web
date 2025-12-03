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
