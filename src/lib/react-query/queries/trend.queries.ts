import { queryOptions } from '@tanstack/react-query';

import { queryKeys } from '@/lib/react-query/query-keys';
import { CACHE_TIMES } from '@/services/api/constants/cache';
import { trendApi } from '@/services/api/trend';
import type { TrendItemOptionsResponse } from '@/types/trend';

/**
 * Trend Query Options Factory
 *
 * 사용법:
 * - 클라이언트: useQuery(trendQueries.itemOptions('alias', 'itemId'))
 * - 쿼리키 접근: trendQueries.itemOptions('alias', 'itemId').queryKey
 */
export const trendQueries = {
  /**
   * Trend 항목 옵션 카운트 쿼리 옵션
   */
  itemOptions: (trendAlias: string, itemId: string, size?: number) =>
    queryOptions<TrendItemOptionsResponse>({
      queryKey: queryKeys.trend.itemOptions(trendAlias, itemId),
      queryFn: () => trendApi.getTrendItemOptionsCount(trendAlias, itemId, size),
      staleTime: CACHE_TIMES.TREND.ITEM_OPTIONS * 1000,
    }),
} as const;

export type TrendQueries = typeof trendQueries;
