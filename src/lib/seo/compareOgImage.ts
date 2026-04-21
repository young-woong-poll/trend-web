import { parseCategoryMeta } from '@/constants/categoryTheme';
import { clampMatchRate } from '@/lib/og/shared';
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
      categoryMeta?: string | null;
      bundleTitle?: string;
      creatorName?: string;
    }
  | {
      type: 'ONE_TO_ONE';
      status: 'DONE';
      categoryCode?: string;
      categoryMeta?: string | null;
      grade: string;
      matchRate: number;
      bundleTitle?: string;
      creatorName?: string;
      participantName?: string;
    }
  | {
      type: 'GROUP';
      categoryCode?: string;
      categoryMeta?: string | null;
      bundleTitle?: string;
    };

function stripHash(hex: string): string {
  return hex.replace(/^#/, '');
}

/** BE categoryMeta(JSON) SSoT → start/end 쿼리 우선, 없으면 categoryCode 폴백. */
function applyThemeQuery(
  query: URLSearchParams,
  categoryCode?: string,
  categoryMeta?: string | null
): void {
  const theme = parseCategoryMeta(categoryMeta);
  if (theme) {
    query.set('start', stripHash(theme.start));
    query.set('end', stripHash(theme.end));
    return;
  }
  query.set('category', categoryCode ?? 'TREND');
}

export function buildCompareOgImageUrl(params: CompareOgParams): string {
  const query = new URLSearchParams();
  applyThemeQuery(query, params.categoryCode, params.categoryMeta);

  if (params.type === 'GROUP') {
    query.set('design', COMPARE_OG_DESIGN.GROUP);
    query.set('type', 'GROUP');
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
