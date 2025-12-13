import { useQuery } from '@tanstack/react-query';

import { displayApi } from '@/services/api/display';

/**
 * Display Query Keys
 */
export const displayKeys = {
  all: ['display'] as const,
  main: () => [...displayKeys.all, 'main'] as const,
  trend: (trendAlias: string) => [...displayKeys.all, 'trend', trendAlias] as const,
  result: (resultId: string) => [...displayKeys.all, 'result', resultId] as const,
  resultInvitee: (resultId: string) => [...displayKeys.all, 'result', resultId, 'invitee'] as const,
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
export const useTrendDisplay = (trendAlias: string, enabled = true) =>
  useQuery({
    queryKey: displayKeys.trend(trendAlias),
    queryFn: () => displayApi.getTrendDisplay(trendAlias),
    enabled,
    throwOnError: true, // 에러 발생 시 에러 바운더리로 전파
  });

/**
 * Result 전시 조회 Hook
 */
export const useResultDisplay = (resultId: string, compareId: string, enabled = true) =>
  useQuery({
    queryKey: displayKeys.result(resultId),
    queryFn: () => displayApi.getResultDisplay({ resultId, compareId }),
    enabled,
  });

export const useResultDisplayInvitee = (resultId: string, enabled = true) =>
  useQuery({
    queryKey: displayKeys.resultInvitee(resultId),
    queryFn: () => displayApi.getResultDisplayInvitee(resultId),
    enabled,
  });
