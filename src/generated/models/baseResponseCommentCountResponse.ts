import type { CommentCountResponse } from './commentCountResponse';

/**
 * 공통 응답 포맷
 */
export interface BaseResponseCommentCountResponse {
  /** 응답 코드 */
  code?: string;
  /** 응답 메시지 */
  message?: string;
  data?: CommentCountResponse;
}
