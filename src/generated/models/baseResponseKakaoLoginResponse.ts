import type { KakaoLoginResponse } from './kakaoLoginResponse';

/**
 * 공통 응답 포맷
 */
export interface BaseResponseKakaoLoginResponse {
  /** 응답 코드 */
  code?: string;
  /** 응답 메시지 */
  message?: string;
  data?: KakaoLoginResponse;
}
