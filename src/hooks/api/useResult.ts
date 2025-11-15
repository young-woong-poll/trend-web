import { useMutation, useQueryClient } from '@tanstack/react-query';

import { displayKeys } from '@/hooks/api/useDisplay';
import { resultApi } from '@/services/api/result';
import type { CreateResultRequest } from '@/types/result';

/**
 * Result Query Keys
 */
export const resultKeys = {
  all: ['result'] as const,
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
