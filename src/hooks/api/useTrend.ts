import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { getTrendItemOptions } from '@/generated/api/client/trend/trend';
import type { TrendItemOptionsResponse, OptionCount } from '@/generated/models';

/**
 * Trend Query Keys
 */
export const trendKeys = {
  all: ['trend'] as const,
  itemOptions: (trendAlias: string, itemId: string) =>
    [...trendKeys.all, 'itemOptions', trendAlias, itemId] as const,
};

/**
 * Trend 항목 옵션 카운트 조회 Hook
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
    queryKey: trendKeys.itemOptions(trendAlias, itemId),
    queryFn: () => getTrendItemOptions(trendAlias, itemId, { size }),
    enabled,
    throwOnError: true,
    staleTime: 60 * 1000,
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
    queryKey: trendKeys.itemOptions(trendAlias, itemId),
    queryFn: () => getTrendItemOptions(trendAlias, itemId, { size }),
    throwOnError: true,
    select: (data: TrendItemOptionsResponse) =>
      (data.options ?? []).reduce(
        (acc: Record<string, number>, option: OptionCount) => ({
          ...acc,
          [option.id ?? '']: option.count ?? 0,
        }),
        {} as Record<string, number>
      ),
    staleTime: 60 * 1000,
    ...options,
  });
