import { queryOptions } from '@tanstack/react-query';

import { queryKeys } from '@/lib/react-query/query-keys';
import { CACHE_TIMES } from '@/services/api/constants/cache';
import { resultApi } from '@/services/api/result';
import type { ResultExistsResponse } from '@/types/result';

/**
 * Result Query Options Factory
 *
 * 사용법:
 * - 클라이언트: useQuery(resultQueries.exists('resultId'))
 * - 쿼리키 접근: resultQueries.exists('resultId').queryKey
 */
export const resultQueries = {
  /**
   * Result 존재 여부 확인 쿼리 옵션
   */
  exists: (resultId: string) =>
    queryOptions<ResultExistsResponse>({
      queryKey: queryKeys.result.exists(resultId),
      queryFn: () => resultApi.checkResultExists(resultId),
      staleTime: CACHE_TIMES.RESULT.EXISTS * 1000,
    }),
} as const;

export type ResultQueries = typeof resultQueries;
