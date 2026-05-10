import type { AskFriendMetaResponse } from './askFriendMetaResponse';

/**
 * 공통 응답 포맷
 */
export interface BaseResponseAskFriendMetaResponse {
  /** 응답 코드 */
  code?: string;
  /** 응답 메시지 */
  message?: string;
  data?: AskFriendMetaResponse;
}
