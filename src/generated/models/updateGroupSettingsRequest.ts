export interface UpdateGroupSettingsRequest {
  /**
   * @minLength 1
   * @maxLength 20
   * @pattern ^[^<>"'&]+$
   */
  groupName?: string;
  showGenderContent?: boolean;
}
