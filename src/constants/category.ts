export interface CategoryFilterItem {
  label: string;
  slug: string | null; // null = 전체
}

export const CATEGORY_FILTERS: CategoryFilterItem[] = [
  { label: '전체', slug: null },
  { label: '연애/결혼', slug: 'LOVE' },
  { label: '재테크', slug: 'FINANCE' },
  { label: '직장', slug: 'WORK' },
  { label: '스포츠', slug: 'SPORTS' },
  { label: '음식', slug: 'FOOD' },
  { label: '트렌드', slug: 'TREND' },
];
