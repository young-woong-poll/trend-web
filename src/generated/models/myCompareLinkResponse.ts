import type { MyCompareLinkResponseStatus } from './myCompareLinkResponseStatus';
import type { MyCompareLinkResponseType } from './myCompareLinkResponseType';

/**
 * 응답 데이터
 */
export interface MyCompareLinkResponse {
  token?: string;
  type?: MyCompareLinkResponseType;
  status?: MyCompareLinkResponseStatus;
  createdAt?: string;
  participantNickname?: string;
  groupName?: string;
  memberCount?: number;
  matchRate?: number;
}
