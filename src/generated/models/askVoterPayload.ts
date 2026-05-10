import type { AskVoterPayloadProfileColor } from './askVoterPayloadProfileColor';
import type { AskVoterPayloadVote } from './askVoterPayloadVote';

export interface AskVoterPayload {
  userId?: string;
  displayName?: string;
  profileColor?: AskVoterPayloadProfileColor;
  tetoEgenToken?: string;
  vote?: AskVoterPayloadVote;
  votedAt?: string;
}
