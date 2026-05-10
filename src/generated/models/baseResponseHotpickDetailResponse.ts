import type { HotpickDetailResponse } from './hotpickDetailResponse';

/**
 * 공통 응답 포맷
 */
export interface BaseResponseHotpickDetailResponse {
  /** 응답 코드 */
  code?: string;
  /** 응답 메시지 */
  message?: string;
  data?: HotpickDetailResponse;
}
