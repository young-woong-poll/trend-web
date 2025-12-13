import { useQuery } from '@tanstack/react-query';

import { trendApi } from '@/services/api/trend';

/**
 * Trend Query Keys
 */
export const trendKeys = {
  all: ['trend'] as const,
  itemOptions: (trendId: string, itemId: string) =>
    [...trendKeys.all, 'itemOptions', trendId, itemId] as const,
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
    queryFn: () => trendApi.getTrendItemOptionsCount(trendAlias, itemId, size),
    enabled,
    throwOnError: true,
  });

/**
 * Trend 항목 옵션 카운트를 Map 형태로 조회하는 Hook
 */
export const useTrendItemOptionsCountMap = (
  trendId: string,
  itemId: string,
  size?: number,
  enabled = true
) =>
  useQuery({
    queryKey: trendKeys.itemOptions(trendId, itemId),
    queryFn: () => trendApi.getTrendItemOptionsCount(trendId, itemId, size),
    enabled,
    throwOnError: true,
    select: (data) =>
      data.options.reduce(
        (acc, option) => ({
          ...acc,
          [option.id]: option.count,
        }),
        {} as Record<string, number>
      ),
  });
