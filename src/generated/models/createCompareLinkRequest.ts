import type { CreateCompareLinkRequestType } from './createCompareLinkRequestType';

export interface CreateCompareLinkRequest {
  type: CreateCompareLinkRequestType;
  /**
   * @minLength 1
   * @maxLength 20
   * @pattern ^[^<>"'&]+$
   */
  groupName?: string;
  showGenderContent?: boolean;
}
