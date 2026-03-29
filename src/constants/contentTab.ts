/** 필터 탭 타입 (NEW, TOP, MY) */
export type FilterTabType = 'new' | 'top' | 'my';

/** TOP 탭 기간 필터 */
export type TopPeriod = 'all' | '1y' | '1m' | '1w';

export interface TopPeriodItem {
  value: TopPeriod;
  label: string;
}

export const TOP_PERIODS: TopPeriodItem[] = [
  { value: 'all', label: '전체' },
  { value: '1y', label: '일년' },
  { value: '1m', label: '한달' },
  { value: '1w', label: '한주' },
];

export const DEFAULT_TOP_PERIOD: TopPeriod = 'all';

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
  { type: 'my', label: 'MY' },
];

/** 기본 탭 선택 */
export const DEFAULT_TAB: TabSelection = { kind: 'filter', type: 'new' };
