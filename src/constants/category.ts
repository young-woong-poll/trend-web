import type { CategoryCode } from '@/types/hotpick';

export interface CategoryFilter {
  label: string;
  codes: CategoryCode[];
}

export const CATEGORY_FILTERS: CategoryFilter[] = [
  { label: '전체', codes: [] },
  { label: '연애/결혼', codes: ['LOVE', 'MARRIAGE'] },
  { label: '재테크', codes: ['FINANCE'] },
  { label: '직장', codes: ['WORK'] },
  { label: '스포츠', codes: ['SPORTS'] },
  { label: '음식', codes: ['FOOD'] },
  { label: '트렌드', codes: ['TREND'] },
];
