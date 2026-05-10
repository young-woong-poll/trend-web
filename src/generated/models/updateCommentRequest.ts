export interface UpdateCommentRequest {
  verifyToken?: string;
  /**
   * @minLength 0
   * @maxLength 200
   */
  content: string;
}
