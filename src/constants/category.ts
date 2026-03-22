export interface CategoryFilterItem {
  label: string;
  slug: string;
}

/** 카테고리 폴백 목록 (API 응답 전 또는 실패 시 사용) */
export const CATEGORY_FILTERS: CategoryFilterItem[] = [
  { label: '연애', slug: 'love' },
  { label: '결혼', slug: 'marriage' },
  { label: '관계', slug: 'relationship' },
  { label: '재테크', slug: 'finance' },
  { label: '직장', slug: 'work' },
  { label: '라이프', slug: 'life' },
  { label: '트렌드', slug: 'trend' },
];
