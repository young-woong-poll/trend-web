import type { MyLikeResponse } from './myLikeResponse';

/**
 * 응답 데이터
 */
export interface CursorPageResponseMyLikeResponse {
  data?: MyLikeResponse[];
  nextCursor?: string;
  hasMore?: boolean;
}
