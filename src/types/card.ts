import type { TopCommentResponse } from '@/generated/models';
import type { HotpickStatus, VoteType } from '@/types/hotpick';
import type { SingleVoteData } from '@/types/singleVote';

/** SingleCard UI model */
export interface SingleCardModel {
  hotpickId: number | string;
  slug: string;
  title: string;
  categories: string[];
  status: HotpickStatus;
  voteType: VoteType;
  vote: SingleVoteData;
  totalVoteCount: number;
  totalCommentCount: number;
  expiredAt?: string;
  likeCount: number;
  liked: boolean;
  mainImageUrl?: string;
  topComment?: TopCommentResponse;
}

/** BundleCard UI model */
export interface BundleCardModel {
  slug: string;
  title: string;
  subtitle?: string;
  categories: string[];
  status: HotpickStatus;
  totalVoteCount: number;
  electionCount?: number;
  imageUrls?: string[];
  expiredAt?: string;
  participated: boolean;
}

/** Discriminated union for card rendering */
export type CardModel =
  | { type: 'SINGLE'; data: SingleCardModel }
  | { type: 'BUNDLE'; data: BundleCardModel };
