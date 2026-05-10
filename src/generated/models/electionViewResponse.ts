import type { ElectionItemViewResponse } from './electionItemViewResponse';

export interface ElectionViewResponse {
  electionId?: number;
  title?: string;
  imageUrl?: string;
  totalVoteCount?: number;
  totalCommentCount?: number;
  items?: ElectionItemViewResponse[];
  voted?: boolean;
  myElectionItemId?: number;
}
