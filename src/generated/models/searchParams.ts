import type { SearchSort } from './searchSort';

export type SearchParams = {
  q: string;
  /**
   * 정렬 방식 (기본: relevance, 관련도순)
   */
  sort?: SearchSort;
  limit?: number;
  offset?: number;
};
