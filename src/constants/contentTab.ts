/** 필터 탭 타입 (NEW, TOP, CHEM, MY) */
export type FilterTabType = 'new' | 'top' | 'chem' | 'my';

/** TOP 탭 기간 필터 */
export type TopPeriod = 'all' | '1y' | '1m' | '1w';

export interface TopPeriodItem {
  value: TopPeriod;
  label: string;
}

export const TOP_PERIODS: TopPeriodItem[] = [
  { value: 'all', label: '전체 기간' },
  { value: '1y', label: '일년' },
  { value: '1m', label: '한달' },
  { value: '1w', label: '한주' },
];

export const DEFAULT_TOP_PERIOD: TopPeriod = 'all';

/** 가치관 비교 탭 정렬 */
export type ChemSort = 'popular' | 'latest';

export const CHEM_SORTS: Array<{ value: ChemSort; label: string }> = [
  { value: 'popular', label: '인기순' },
  { value: 'latest', label: '최신순' },
];

export const DEFAULT_CHEM_SORT: ChemSort = 'popular';

/** 탭 선택 상태 — 필터탭 또는 카테고리탭 */
export type TabSelection =
  | { kind: 'filter'; type: FilterTabType }
  | { kind: 'category'; slug: string; label: string };

export interface FilterTabItem {
  type: FilterTabType;
  label: string;
}

export const FILTER_TABS: FilterTabItem[] = [
  { type: 'new', label: 'NEW' },
  { type: 'top', label: 'TOP' },
  { type: 'chem', label: '가치관 비교' },
  { type: 'my', label: 'MY' },
];

/** 기본 탭 선택 — 소개팅 카테고리 (2026-05-03 콘텐츠 니치 피벗) */
export const DEFAULT_TAB = {
  kind: 'category',
  slug: 'dating',
  label: '소개팅',
} as const;

/** My 탭 하위 탭 */
export type MySubTabType = 'vote' | 'compare' | 'comments' | 'likes';

export const MY_SUB_TABS: Array<{ type: MySubTabType; label: string }> = [
  { type: 'vote', label: '투표' },
  { type: 'compare', label: '내 테스트' },
  { type: 'comments', label: '댓글' },
  { type: 'likes', label: '좋아요' },
];

export const DEFAULT_MY_SUB_TAB_LOGGED_IN: MySubTabType = 'compare';
export const DEFAULT_MY_SUB_TAB_GUEST: MySubTabType = 'vote';
