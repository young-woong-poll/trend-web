import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { queryKeys } from '@/lib/react-query';
import { trendQueries } from '@/lib/react-query/queries';
import type { TrendItemOptionsResponse } from '@/types/trend';

/**
 * Trend Query Keys
 * @deprecated trendKeys는 더 이상 사용되지 않습니다.
 * 대신 @/lib/react-query의 queryKeys를 사용하세요.
 *
 * 마이그레이션:
 * - trendKeys.itemOptions(trendId, itemId) → queryKeys.trend.itemOptions(trendAlias, itemId)
 */
export const trendKeys = queryKeys.trend;

/**
 * Trend 항목 옵션 카운트 조회 Hook
 *
 * @example
 * ```tsx
 * const { data } = useTrendItemOptionsCount({ trendAlias: 'mbti', itemId: 'item1' });
 *
 * // 쿼리키 접근
 * queryClient.invalidateQueries({ queryKey: trendQueries.itemOptions('mbti', 'item1').queryKey });
 * ```
 */
export const useTrendItemOptionsCount = ({
  trendAlias,
  itemId,
  enabled = true,
  size,
}: {
  trendAlias: string;
  itemId: string;
  enabled?: boolean;
  size?: number;
}) =>
  useQuery({
    ...trendQueries.itemOptions(trendAlias, itemId, size),
    enabled,
    throwOnError: true,
  });

/**
 * Trend 항목 옵션 카운트를 Map 형태로 조회하는 Hook
 */
export const useTrendItemOptionsCountMap = (
  trendAlias: string,
  itemId: string,
  size?: number,
  options?: Omit<
    UseQueryOptions<TrendItemOptionsResponse, Error, Record<string, number>>,
    'queryKey' | 'queryFn' | 'select'
  >
) =>
  useQuery({
    ...trendQueries.itemOptions(trendAlias, itemId, size),
    throwOnError: true,
    select: (data: TrendItemOptionsResponse) =>
      data.options.reduce(
        (acc: Record<string, number>, option: { id: string; count: number }) => ({
          ...acc,
          [option.id]: option.count,
        }),
        {} as Record<string, number>
      ),
    ...options,
  });
