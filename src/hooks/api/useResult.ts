import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/react-query';
import { resultQueries } from '@/lib/react-query/queries';
import { resultApi } from '@/services/api/result';

/**
 * Result Query Keys
 * @deprecated resultKeys는 더 이상 사용되지 않습니다.
 * 대신 @/lib/react-query의 queryKeys를 사용하세요.
 */
export const resultKeys = queryKeys.result;

/**
 * Result 존재 여부 확인 Hook
 *
 * @example
 * ```tsx
 * const { data } = useCheckResultExists('result-123');
 *
 * // 쿼리키 접근
 * queryClient.invalidateQueries({ queryKey: resultQueries.exists('result-123').queryKey });
 * ```
 */
export const useCheckResultExists = (resultId: string, enabled = true) =>
  useQuery({
    ...resultQueries.exists(resultId),
    enabled,
  });

/**
 * Nickname 설정 Hook
 */
export const useSetNickname = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ resultId, nickname }: { resultId: string; nickname: string }) =>
      resultApi.setNickname(resultId, nickname),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.display.result(variables.resultId),
      });
    },
  });
};
