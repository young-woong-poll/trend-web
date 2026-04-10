import { categoryNameToCode } from '@/constants/categoryTheme';
import type { HotpickCardResponse, HotpickDetailResponse } from '@/generated/models';
import type {
  CardModel,
  SingleCardModel,
  BundleCardModel,
  DetailVoteOption,
  SingleDetailModel,
} from '@/types/card';
import { electionToSingleVoteData } from '@/types/singleVote';

export function toSingleCardModel(hotpick: HotpickCardResponse): SingleCardModel {
  const { hotpickId = 0, slug = '', expiredAt, likeCount = 0, liked = false, topComment } = hotpick;
  const election = hotpick.election!;
  const hasOptionImages = (election.items ?? []).some((item) => !!item.imageUrl);

  return {
    // passthrough (BE field names preserved)
    hotpickId,
    slug,
    expiredAt,
    likeCount,
    liked,
    topComment,
    title: election.title ?? '',
    totalVoteCount: election.totalVoteCount ?? 0,
    totalCommentCount: election.totalCommentCount ?? 0,
    // derived (FE-only computed fields)
    categories: (hotpick.categories ?? []).map((c) => c.name ?? ''),
    status: hotpick.isExpired ? 'CLOSED' : 'OPEN',
    voteType: hasOptionImages ? 'IMAGE' : 'TEXT',
    vote: electionToSingleVoteData(election),
    mainImageUrl: !hasOptionImages ? (election.imageUrl ?? hotpick.imageUrl) : undefined,
  };
}

export function toBundleCardModel(hotpick: HotpickCardResponse): BundleCardModel {
  const { slug = '', expiredAt } = hotpick;
  const categories = (hotpick.categories ?? []).map((c) => c.name ?? '');

  return {
    // passthrough
    slug,
    expiredAt,
    title: hotpick.election?.title ?? '',
    totalVoteCount: hotpick.election?.totalVoteCount ?? 0,
    // derived
    categories,
    categoryCode: categoryNameToCode(categories[0]),
    status: hotpick.isExpired ? 'CLOSED' : 'OPEN',
    imageUrls: hotpick.imageUrl ? [hotpick.imageUrl] : undefined,
    participated: false, // placeholder: BE not implemented
  };
}

export function toCardModel(hotpick: HotpickCardResponse): CardModel {
  if (hotpick.type === 'SINGLE' && hotpick.election) {
    return { type: 'SINGLE', data: toSingleCardModel(hotpick) };
  }
  return { type: 'BUNDLE', data: toBundleCardModel(hotpick) };
}

export function toSingleDetailModel(data: HotpickDetailResponse, slug: string): SingleDetailModel {
  const hotpick = data.hotpick;
  const election = hotpick!.election!;
  const items: DetailVoteOption[] = (election.items ?? []).map((item) => ({
    electionItemId: item.electionItemId ?? 0,
    title: item.title ?? '',
    imageUrl: item.imageUrl,
    voteCount: item.voteCount ?? 0,
  }));
  const hasOptionImages = items.some((item) => !!item.imageUrl);

  return {
    // passthrough
    slug,
    expiredAt: hotpick?.expiredAt,
    likeCount: hotpick?.likeCount ?? 0,
    liked: hotpick?.liked ?? false,
    // election passthrough
    electionId: String(election.electionId ?? ''),
    title: election.title ?? '',
    totalVoteCount: election.totalVoteCount ?? 0,
    totalCommentCount: election.totalCommentCount ?? 0,
    voted: election.voted ?? false,
    myElectionItemId: election.myElectionItemId,
    items,
    // derived
    categories: (hotpick?.categories ?? []).map((c) => c.name ?? ''),
    isExpired: hotpick?.expiredAt ? new Date(hotpick.expiredAt) < new Date() : false,
    voteType: hasOptionImages ? 'IMAGE' : 'TEXT',
    logoUrl: !hasOptionImages ? (election.imageUrl ?? hotpick?.imageUrl) : undefined,
    relatedHotpicks: data.relatedHotpicks,
  };
}
