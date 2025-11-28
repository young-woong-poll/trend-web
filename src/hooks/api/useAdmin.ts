import { useMutation } from '@tanstack/react-query';

import { adminApi } from '@/services/api/admin';
import type { CreateTrendRequest } from '@/types/trend';

/**
 * Admin Query Keys
 */
export const adminKeys = {
  all: ['admin'] as const,
  trend: () => [...adminKeys.all, 'trend'] as const,
};

/**
 * Admin: Trend 생성 Hook
 */
export const useCreateTrend = () =>
  useMutation({
    mutationFn: (data: CreateTrendRequest) => adminApi.createTrend(data),
  });
