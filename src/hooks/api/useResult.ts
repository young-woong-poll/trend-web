/**
 * Result hooks — 스텁 처리
 *
 * BUNDLE 전용. Result API가 새 swagger에서 제거됨.
 */

import { useMutation, useQuery } from '@tanstack/react-query';

/**
 * Result Query Keys
 */
export const resultKeys = {
  all: ['result'] as const,
  exists: (resultId: string) => [...resultKeys.all, 'exists', resultId] as const,
};

/**
 * Result 존재 여부 확인 Hook (스텁)
 */
export const useCheckResultExists = (resultId: string, enabled = true) =>
  useQuery({
    queryKey: resultKeys.exists(resultId),
    queryFn: () => Promise.resolve(null),
    enabled: !!resultId && enabled,
    staleTime: 60 * 1000,
  });

/**
 * Result 생성 Hook (스텁)
 */
export const useCreateResult = () =>
  useMutation({
    mutationFn: async (_data: unknown) => {
      throw new Error('BUNDLE 투표는 준비 중입니다');
    },
  });
