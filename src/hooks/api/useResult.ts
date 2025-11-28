import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { displayKeys } from '@/hooks/api/useDisplay';
import { resultApi } from '@/services/api/result';
import type { CreateResultRequest } from '@/types/result';

/**
 * Result Query Keys
 */
export const resultKeys = {
  all: ['result'] as const,
  exists: (resultId: string) => [...resultKeys.all, 'exists', resultId] as const,
};

/**
 * Result 생성 Hook
 */
export const useCreateResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateResultRequest) => resultApi.createResult(data),
    onSuccess: (data) => {
      // 생성된 result의 display 쿼리를 prefetch하거나 무효화할 수 있습니다
      void queryClient.invalidateQueries({ queryKey: displayKeys.result(data.resultId) });
    },
  });
};

/**
 * Result 존재 여부 확인 Hook
 */
export const useCheckResultExists = (resultId: string, enabled = true) =>
  useQuery({
    queryKey: resultKeys.exists(resultId),
    queryFn: () => resultApi.checkResultExists(resultId),
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
      void queryClient.invalidateQueries({ queryKey: displayKeys.result(variables.resultId) });
    },
  });
};
