import type { CommentUpdateResponse } from './commentUpdateResponse';

/**
 * 공통 응답 포맷
 */
export interface BaseResponseCommentUpdateResponse {
  /** 응답 코드 */
  code?: string;
  /** 응답 메시지 */
  message?: string;
  data?: CommentUpdateResponse;
}
