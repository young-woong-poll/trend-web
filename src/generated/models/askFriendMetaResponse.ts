import type { AskFriendMetaResponseMyVote } from './askFriendMetaResponseMyVote';
import type { AskFriendMetaResponseOwnerSelfAnswer } from './askFriendMetaResponseOwnerSelfAnswer';
import type { AskFriendVotesPayload } from './askFriendVotesPayload';

/**
 * 응답 데이터
 */
export interface AskFriendMetaResponse {
  token?: string;
  ownerDisplayName?: string;
  isOwn?: boolean;
  myVote?: AskFriendMetaResponseMyVote;
  ownerSelfAnswer?: AskFriendMetaResponseOwnerSelfAnswer;
  friendVotes?: AskFriendVotesPayload;
}
