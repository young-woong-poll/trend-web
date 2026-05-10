import type { CreateAskLinkRequestSelfAnswer } from './createAskLinkRequestSelfAnswer';
import type { CreateAskLinkRequestSelfPrediction } from './createAskLinkRequestSelfPrediction';

export interface CreateAskLinkRequest {
  /**
   * @minLength 1
   * @maxLength 12
   */
  displayName: string;
  selfAnswer: CreateAskLinkRequestSelfAnswer;
  selfPrediction: CreateAskLinkRequestSelfPrediction;
}
