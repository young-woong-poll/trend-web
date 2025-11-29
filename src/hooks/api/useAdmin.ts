import { useMutation, useQuery } from '@tanstack/react-query';

import { adminApi } from '@/services/api/admin';
import type { CreateTrendRequest } from '@/types/trend';

/**
 * Admin Query Keys
 */
export const adminKeys = {
  all: ['admin'] as const,
  trend: () => [...adminKeys.all, 'trend'] as const,
  election: (electionId: string) => [...adminKeys.all, 'election', electionId] as const,
};

/**
 * Admin: Trend 생성 Hook
 */
export const useCreateTrend = () =>
  useMutation({
    mutationFn: (data: CreateTrendRequest) => adminApi.createTrend(data),
  });

/**
 * Admin: 선거 상세 조회 Hook
 */
export const useElection = (electionId: string) =>
  useQuery({
    queryKey: adminKeys.election(electionId),
    queryFn: () => adminApi.getElection(electionId),
    enabled: !!electionId,
  });
