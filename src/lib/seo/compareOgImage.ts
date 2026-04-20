import { clampMatchRate, clampMemberCount } from '@/lib/og/shared';
import { SITE_URL } from '@/lib/seo/constants';

/** Compare OG 확정 디자인 */
export const COMPARE_OG_DESIGN = {
  PENDING: 'v2', // V2(Challenge Letter)
  MATCH: 'v2', // V2(Game Complete)
  GROUP: 'v2', // V2(편지/초대장)
} as const;

type CompareOgParams =
  | {
      type: 'ONE_TO_ONE';
      status: 'PENDING';
      categoryCode?: string;
      bundleTitle?: string;
      creatorName?: string;
    }
  | {
      type: 'ONE_TO_ONE';
      status: 'DONE';
      categoryCode?: string;
      grade: string;
      matchRate: number;
      bundleTitle?: string;
      creatorName?: string;
      participantName?: string;
    }
  | {
      type: 'GROUP';
      categoryCode?: string;
      memberCount: number;
      groupName?: string;
      bundleTitle?: string;
    };

export function buildCompareOgImageUrl(params: CompareOgParams): string {
  const category = params.categoryCode ?? 'TREND';
  const query = new URLSearchParams({ category });

  if (params.type === 'GROUP') {
    query.set('design', COMPARE_OG_DESIGN.GROUP);
    query.set('type', 'GROUP');
    query.set('memberCount', String(clampMemberCount(params.memberCount)));
    if (params.groupName) {
      query.set('groupName', params.groupName.slice(0, 20));
    }
    if (params.bundleTitle) {
      query.set('bundleTitle', params.bundleTitle.slice(0, 40));
    }
  } else if (params.status === 'DONE') {
    query.set('design', COMPARE_OG_DESIGN.MATCH);
    query.set('type', 'ONE_TO_ONE');
    query.set('status', 'DONE');
    query.set('grade', params.grade);
    query.set('matchRate', String(clampMatchRate(params.matchRate)));
    if (params.bundleTitle) {
      query.set('bundleTitle', params.bundleTitle.slice(0, 40));
    }
    if (params.creatorName) {
      query.set('creatorName', params.creatorName.slice(0, 20));
    }
    if (params.participantName) {
      query.set('participantName', params.participantName.slice(0, 20));
    }
  } else {
    query.set('design', COMPARE_OG_DESIGN.PENDING);
    query.set('type', 'ONE_TO_ONE');
    query.set('status', 'PENDING');
    if (params.bundleTitle) {
      query.set('bundleTitle', params.bundleTitle.slice(0, 40));
    }
    if (params.creatorName) {
      query.set('creatorName', params.creatorName.slice(0, 20));
    }
  }

  return `${SITE_URL}/api/og/compare?${query.toString()}`;
}
