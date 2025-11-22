/**
 * 커스텀 에러 클래스
 */

/**
 * 투표 검증 에러
 */
export class VoteValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VoteValidationError';
  }
}

/**
 * 투표 제출 에러
 */
export class VoteSubmissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VoteSubmissionError';
  }
}

/**
 * API 조회 에러
 */
export class ApiFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiFetchError';
  }
}
