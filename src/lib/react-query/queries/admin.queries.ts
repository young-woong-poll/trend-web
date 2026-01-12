import { queryOptions } from '@tanstack/react-query';

import { adminApi } from '@/services/api/admin';
import type { ElectionDetail } from '@/types/election';
import type { AdminTrendResponse } from '@/types/trend';

/**
 * Admin Query Keys
 */
export const adminKeys = {
  all: ['admin'] as const,
  trends: () => [...adminKeys.all, 'trend'] as const,
  election: (electionId: string) => [...adminKeys.all, 'election', electionId] as const,
  storage: () => [...adminKeys.all, 'storage'] as const,
};

/**
 * Admin Query Options Factory
 *
 * 사용법:
 * - 클라이언트: useQuery(adminQueries.trends())
 * - 쿼리키 접근: adminQueries.trends().queryKey
 */
export const adminQueries = {
  /**
   * Admin: 트렌드 목록 조회 쿼리 옵션
   */
  trends: () =>
    queryOptions<AdminTrendResponse[]>({
      queryKey: adminKeys.trends(),
      queryFn: () => adminApi.getTrends(),
    }),

  /**
   * Admin: 선거 상세 조회 쿼리 옵션
   */
  election: (electionId: string) =>
    queryOptions<ElectionDetail>({
      queryKey: adminKeys.election(electionId),
      queryFn: () => adminApi.getElection(electionId),
    }),
} as const;

export type AdminQueries = typeof adminQueries;
