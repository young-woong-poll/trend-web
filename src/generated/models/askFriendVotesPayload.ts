import type { AskVoterPayload } from './askVoterPayload';

export interface AskFriendVotesPayload {
  total?: number;
  tetoCount?: number;
  egenCount?: number;
  voters?: AskVoterPayload[];
}
