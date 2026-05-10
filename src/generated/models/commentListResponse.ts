import type { CommentItem } from './commentItem';

/**
 * 응답 데이터
 */
export interface CommentListResponse {
  totalCount?: number;
  nextCursor?: string;
  comments?: CommentItem[];
}
