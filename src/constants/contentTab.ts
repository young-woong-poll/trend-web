/** 필터 탭 타입 (NEW, HOT, MY) */
export type FilterTabType = 'new' | 'hot' | 'my';

/** HOT 탭 기간 필터 */
export type HotPeriod = '1d' | '1w' | '1m' | '1y';

export interface HotPeriodItem {
  value: HotPeriod;
  label: string;
}

export const HOT_PERIODS: HotPeriodItem[] = [
  { value: '1d', label: '오늘' },
  { value: '1w', label: '한주' },
  { value: '1m', label: '한달' },
  { value: '1y', label: '일년' },
];

export const DEFAULT_HOT_PERIOD: HotPeriod = '1d';

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
  { type: 'hot', label: 'HOT' },
  { type: 'my', label: 'MY' },
];

/** 기본 탭 선택 */
export const DEFAULT_TAB: TabSelection = { kind: 'filter', type: 'new' };
