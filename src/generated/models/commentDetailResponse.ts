import type { CommentItem } from './commentItem';

/**
 * 응답 데이터
 */
export interface CommentDetailResponse {
  comment?: CommentItem;
  parent?: CommentItem;
}
