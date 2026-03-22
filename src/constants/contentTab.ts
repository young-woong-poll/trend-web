/** 필터 탭 타입 (NEW, HOT, MY) */
export type FilterTabType = 'new' | 'hot' | 'my';

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
