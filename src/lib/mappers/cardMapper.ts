import { categoryNameToCode } from '@/constants/categoryTheme';
import type { HotpickCardResponse, HotpickDetailResponse } from '@/generated/models';
import type { BundleDetail } from '@/types/bundle';
import type {
  CardModel,
  SingleCardModel,
  BundleCardModel,
  DetailVoteOption,
  SingleDetailModel,
} from '@/types/card';
import type { CategoryCode } from '@/types/hotpick';
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
    categories: (hotpick.categories ?? []).map((c) => c.category ?? ''),
    status: hotpick.isExpired ? 'CLOSED' : 'OPEN',
    voteType: hasOptionImages ? 'IMAGE' : 'TEXT',
    vote: electionToSingleVoteData(election),
    mainImageUrl: !hasOptionImages ? (election.imageUrl ?? hotpick.imageUrl) : undefined,
  };
}

export function toBundleCardModelFromSummary(bundle: BundleDetail): BundleCardModel {
  const category = bundle.category ?? '';

  return {
    slug: bundle.slug ?? '',
    title: bundle.title ?? '',
    subtitle: bundle.subtitle,
    categories: category ? [category] : [],
    categoryCode: (bundle.categoryCode as CategoryCode) ?? categoryNameToCode(category),
    categoryMeta: bundle.categoryMeta,
    totalVoteCount: bundle.participantCount ?? 0,
    electionCount: bundle.questionCount,
    imageUrls: bundle.imageUrl ? [bundle.imageUrl] : undefined,
    status: bundle.status === 'CLOSED' ? 'CLOSED' : 'OPEN',
    participated: bundle.completed ?? false,
  };
}

export function toCardModel(hotpick: HotpickCardResponse): CardModel {
  return { type: 'SINGLE', data: toSingleCardModel(hotpick) };
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
    categories: (hotpick?.categories ?? []).map((c) => c.category ?? ''),
    isExpired: hotpick?.expiredAt ? new Date(hotpick.expiredAt) < new Date() : false,
    voteType: hasOptionImages ? 'IMAGE' : 'TEXT',
    logoUrl: !hasOptionImages ? (election.imageUrl ?? hotpick?.imageUrl) : undefined,
    relatedHotpicks: data.relatedHotpicks,
  };
}
