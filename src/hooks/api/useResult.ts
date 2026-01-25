import { useMutation, useQuery } from '@tanstack/react-query';

import { createResult, checkResultExists } from '@/generated/api/client/result/result';
import type { CreateResultRequest } from '@/generated/models';

/**
 * Result Query Keys
 */
export const resultKeys = {
  all: ['result'] as const,
  exists: (resultId: string) => [...resultKeys.all, 'exists', resultId] as const,
};

/**
 * Result 존재 여부 확인 Hook
 */
export const useCheckResultExists = (resultId: string, enabled = true) =>
  useQuery({
    queryKey: resultKeys.exists(resultId),
    queryFn: () => checkResultExists(resultId),
    enabled: !!resultId && enabled,
    staleTime: 60 * 1000,
  });

/**
 * Result 생성 Hook
 */
export const useCreateResult = () =>
  useMutation({
    mutationFn: (data: CreateResultRequest) => createResult(data),
  });
