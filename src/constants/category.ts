export interface CategoryFilterItem {
  label: string;
  slug: string; // null = 전체
}

export const CATEGORY_FILTERS: CategoryFilterItem[] = [
  { label: '전체', slug: 'all' },
  { label: '연애/결혼', slug: 'love-marriage' },
  { label: '재테크', slug: 'finance' },
  { label: '직업', slug: 'work' },
  { label: '트렌드', slug: 'trend' },
];
