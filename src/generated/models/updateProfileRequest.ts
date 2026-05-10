export interface UpdateProfileRequest {
  /**
   * @minLength 0
   * @maxLength 20
   */
  nickname?: string;
  profileColor?: string;
}
