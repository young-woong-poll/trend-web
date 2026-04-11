import type { HotpickCardResponse, TopCommentResponse } from '@/generated/models';
import type { CategoryCode, HotpickStatus, VoteType } from '@/types/hotpick';
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
  categoryCode?: CategoryCode;
  categoryMeta?: string;
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

/** Detail page vote option (BE field names preserved) */
export interface DetailVoteOption {
  electionItemId: number;
  title: string;
  imageUrl?: string;
  voteCount: number;
}

/** SingleDetailView UI model */
export interface SingleDetailModel {
  // passthrough
  slug: string;
  expiredAt?: string;
  likeCount: number;
  liked: boolean;
  // election passthrough
  electionId: string;
  title: string;
  totalVoteCount: number;
  totalCommentCount: number;
  voted: boolean;
  myElectionItemId?: number;
  items: DetailVoteOption[];
  // derived
  categories: string[];
  isExpired: boolean;
  voteType: VoteType;
  logoUrl?: string;
  relatedHotpicks?: HotpickCardResponse[]; // intentional: passed through to SingleRecommendSection
}
