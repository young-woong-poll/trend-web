export interface CreateCommentRequest {
  /**
   * @minLength 0
   * @maxLength 80
   */
  nickname?: string;
  /**
   * @minLength 1
   * @maxLength 64
   */
  password?: string;
  /**
   * @minLength 0
   * @maxLength 200
   */
  content: string;
}
