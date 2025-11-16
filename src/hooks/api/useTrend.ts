import { useQuery } from '@tanstack/react-query';

import { trendApi } from '@/services/api/trend';

/**
 * Trend Query Keys
 */
export const trendKeys = {
  all: ['trend'] as const,
  voteCount: (trendId: string) => [...trendKeys.all, 'voteCount', trendId] as const,
};

/**
 * Trend 투표 수를 Map 형태로 조회하는 Hook
 */
export const useTrendVoteCount = (trendId: string, enabled = true) =>
  useQuery({
    queryKey: trendKeys.voteCount(trendId),
    queryFn: () => trendApi.getTrendVoteCount(trendId),
    enabled,
    select: (data) =>
      data.options.reduce(
        (acc, option) => ({
          ...acc,
          [option.id]: option.count,
        }),
        {} as Record<string, number>
      ),
  });
