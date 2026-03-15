import type { HotpickCardResponse } from '@/generated/models';
import type { CardModel, SingleCardModel, BundleCardModel } from '@/types/card';
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

  return {
    // passthrough
    slug,
    expiredAt,
    title: hotpick.election?.title ?? '',
    totalVoteCount: hotpick.election?.totalVoteCount ?? 0,
    // derived
    categories: (hotpick.categories ?? []).map((c) => c.name ?? ''),
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
