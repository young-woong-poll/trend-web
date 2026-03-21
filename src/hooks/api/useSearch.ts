import { queryOptions, useQuery } from '@tanstack/react-query';

import * as clientApi from '@/generated/api/client/hotpick-search/hotpick-search';
import type { ElectionViewResponse, HotpickCategoryResponse, SearchSort } from '@/generated/models';
import { getTKUID } from '@/lib/tkuid';

/**
 * 검색 hit 아이템 — Meilisearch가 인덱싱한 문서 구조
 * HotpickCardResponse와 유사하지만 `id` (not `hotpickId`) 등 차이가 있음
 */
export interface SearchHit {
  id?: number;
  hotpickId?: number;
  type?: string;
  slug?: string;
  visible?: boolean;
  imageUrl?: string | null;
  createdAt?: string;
  expiredAt?: string | null;
  isExpired?: boolean;
  likeCount?: number;
  liked?: boolean;
  categories?: (HotpickCategoryResponse & { categoryId?: number })[];
  election?: ElectionViewResponse;
}

/**
 * 검색 API 응답 타입
 * BE swagger가 Map<String, Object>로 제네릭하게 정의되어 있으므로
 * 실제 응답 구조를 FE에서 명시적으로 정의한다.
 */
export interface SearchResponse {
  hits?: SearchHit[];
  query?: string;
  processingTimeMs?: number;
  limit?: number;
  offset?: number;
  estimatedTotalHits?: number;
}

/**
 * Search Query Keys
 */
export const searchKeys = {
  all: ['search'] as const,
  search: (params: { q: string; sort?: SearchSort; limit?: number; offset?: number }) =>
    [...searchKeys.all, params] as const,
};

/**
 * Search Query Options
 */
export const searchQueries = {
  search: (params: { q: string; sort?: SearchSort; limit?: number; offset?: number }) =>
    queryOptions<SearchResponse | null>({
      queryKey: searchKeys.search(params),
      queryFn: async () => {
        const tkuId = getTKUID();
        const result = await clientApi.search(params, {
          headers: tkuId ? { 'x-tku-id': tkuId } : undefined,
        });
        // axios-mutator가 BaseResponse.data를 자동 추출
        // 결과가 Map<String, Object> 형태이므로 SearchResponse로 캐스팅
        return (result as unknown as SearchResponse) || null;
      },
      staleTime: 30 * 1000,
    }),
};

/**
 * 검색 Hook
 * - 2글자 이상일 때만 쿼리 활성화
 * - staleTime 30초 (검색 결과는 자주 변하지 않지만 너무 오래 캐싱하지 않음)
 */
export const useSearch = (params: {
  q: string;
  sort?: SearchSort;
  limit?: number;
  offset?: number;
}) =>
  useQuery({
    ...searchQueries.search(params),
    enabled: params.q.length >= 2,
  });
