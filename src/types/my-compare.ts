export interface MyCompareLink {
  token: string;
  type: 'ONE_TO_ONE' | 'GROUP';
  status: 'WAITING' | 'COMPLETED';
  createdAt: string;
  participantNickname: string | null;
  groupName: string | null;
  memberCount: number;
}
