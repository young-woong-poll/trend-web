import { useQuery } from '@tanstack/react-query';

import { displayApi } from '@/services/api/display';

/**
 * Display Query Keys
 */
export const displayKeys = {
  all: ['display'] as const,
  main: () => [...displayKeys.all, 'main'] as const,
  trend: (trendId: string) => [...displayKeys.all, 'trend', trendId] as const,
  result: (resultId: string) => [...displayKeys.all, 'result', resultId] as const,
};

/**
 * 메인 전시 조회 Hook
 */
export const useMainDisplay = () =>
  useQuery({
    queryKey: displayKeys.main(),
    queryFn: displayApi.getMainDisplay,
  });

/**
 * Trend 전시 조회 Hook
 */
export const useTrendDisplay = (trendId: string, enabled = true) =>
  useQuery({
    queryKey: displayKeys.trend(trendId),
    queryFn: () => displayApi.getTrendDisplay(trendId),
    enabled,
    throwOnError: true, // 에러 발생 시 에러 바운더리로 전파
  });

/**
 * Result 전시 조회 Hook
 */
export const useResultDisplay = (resultId: string, enabled = true) =>
  useQuery({
    queryKey: displayKeys.result(resultId),
    queryFn: () => displayApi.getResultDisplay(resultId),
    enabled,
  });
