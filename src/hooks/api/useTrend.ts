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
 * Trend 현재 투표 수 조회 Hook
 */
export const useTrendVoteCount = (trendId: string, enabled = true) =>
  useQuery({
    queryKey: trendKeys.voteCount(trendId),
    queryFn: () => trendApi.getTrendVoteCount(trendId),
    enabled,
  });
