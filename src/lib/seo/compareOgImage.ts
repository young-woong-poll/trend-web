import { SITE_URL } from '@/lib/seo/constants';

/** Compare OG 확정 디자인 */
export const COMPARE_OG_DESIGN = {
  PENDING: 'v2', // V2(Challenge Letter)로 확정
  MATCH: 'v2', // V2(Certificate)로 확정
  GROUP: 'v2', // V2(편지/초대장)로 확정
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
    }
  | {
      type: 'GROUP';
      categoryCode?: string;
      memberCount: number;
      groupName?: string;
      bundleTitle?: string;
    };

/** 5% 단위 반올림 (matchRate 캐시 키 안정화) */
function roundMatchRate(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n / 5) * 5));
}

/** memberCount 구간 반올림 (1/3/6/10/20/50) */
function roundMemberCount(n: number): number {
  if (n <= 1) {
    return 1;
  }
  if (n <= 3) {
    return 3;
  }
  if (n <= 6) {
    return 6;
  }
  if (n <= 10) {
    return 10;
  }
  if (n <= 20) {
    return 20;
  }
  return 50;
}

export function buildCompareOgImageUrl(params: CompareOgParams): string {
  const category = params.categoryCode ?? 'TREND';
  const query = new URLSearchParams({ category });

  if (params.type === 'GROUP') {
    query.set('design', COMPARE_OG_DESIGN.GROUP);
    query.set('type', 'GROUP');
    query.set('memberCount', String(roundMemberCount(params.memberCount)));
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
    query.set('matchRate', String(roundMatchRate(params.matchRate)));
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
