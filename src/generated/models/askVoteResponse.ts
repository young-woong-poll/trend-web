import type { AskFriendVotesPayload } from './askFriendVotesPayload';
import type { AskVoteResponseMyVote } from './askVoteResponseMyVote';
import type { AskVoteResponseOwnerSelfAnswer } from './askVoteResponseOwnerSelfAnswer';

/**
 * 응답 데이터
 */
export interface AskVoteResponse {
  myVote?: AskVoteResponseMyVote;
  ownerDisplayName?: string;
  ownerSelfAnswer?: AskVoteResponseOwnerSelfAnswer;
  friendVotes?: AskFriendVotesPayload;
}
