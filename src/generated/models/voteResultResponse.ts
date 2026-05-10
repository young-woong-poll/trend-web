import type { ElectionItemViewResponse } from './electionItemViewResponse';

/**
 * 응답 데이터
 */
export interface VoteResultResponse {
  hotpickId?: number;
  hotpickSlug?: string;
  electionId?: number;
  myElectionItemId?: number;
  totalVoteCount?: number;
  items?: ElectionItemViewResponse[];
  voted?: boolean;
}
