import type { MyCommentResponse } from './myCommentResponse';

/**
 * 응답 데이터
 */
export interface CursorPageResponseMyCommentResponse {
  data?: MyCommentResponse[];
  nextCursor?: string;
  hasMore?: boolean;
}
