import type { AskFriendVotesPayload } from './askFriendVotesPayload';
import type { AskMyLinkResponseSelfAnswer } from './askMyLinkResponseSelfAnswer';
import type { AskMyLinkResponseSelfPrediction } from './askMyLinkResponseSelfPrediction';

/**
 * 응답 데이터
 */
export interface AskMyLinkResponse {
  token?: string;
  displayName?: string;
  selfAnswer?: AskMyLinkResponseSelfAnswer;
  selfPrediction?: AskMyLinkResponseSelfPrediction;
  friendVotes?: AskFriendVotesPayload;
}
