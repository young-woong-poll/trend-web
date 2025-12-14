/**
 * Comment 관련 타입 정의
 */

/**
 * 댓글 작성 요청
 */
export interface CreateCommentRequest {
  trendId: number;
  itemId: string;
  nickname: string;
  password: string;
  content: string;
}

/**
 * 댓글 작성 응답
 */
export interface CommentCreateResponse {
  id: string;
}

/**
 * 댓글 수정 요청
 */
export interface UpdateCommentRequest {
  editToken: string;
  content: string;
}

/**
 * 댓글 수정 검증 요청
 */
export interface VerifyCommentRequest {
  password: string;
}

/**
 * 댓글 수정 검증 응답
 */
export interface CommentVerifyResponse {
  editToken: string;
  expiresIn: number;
  expiresAt: string;
}

/**
 * 댓글 좋아요 응답
 */
export interface CommentLikeResponse {
  liked: boolean;
  likeCount: number;
}

/**
 * 댓글 아이템
 */
export interface CommentItem {
  id: string;
  nickname: string;
  content: string;
  likeCount: number;
  liked: boolean;
  createdAt: string;
}

/**
 * 댓글 목록 조회 응답
 */
export interface CommentListResponse {
  totalSize: number;
  nextId: string | null;
  comments: CommentItem[];
}
