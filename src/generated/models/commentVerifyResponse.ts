/**
 * 응답 데이터
 */
export interface CommentVerifyResponse {
  verifyToken?: string;
  expiresIn?: number;
  expiredAt?: string;
}
