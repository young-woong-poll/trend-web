import { useCallback } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { User } from '@/contexts/AuthContext';
import { getMe } from '@/hooks/api/useAuthApi';

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

/**
 * auth/me를 React Query로 관리하는 훅
 * - staleTime: 5분 (중복 호출 방지)
 * - refetchOnWindowFocus: true (탭 복귀 시 세션 재검증)
 */
export const useAuthMe = (options?: { enabled?: boolean }) =>
  useQuery<User | null>({
    queryKey: authKeys.me(),
    queryFn: async () => {
      try {
        return await getMe();
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: false,
    enabled: options?.enabled,
  });

/**
 * auth 캐시를 직접 조작하는 유틸 훅
 * - 로그인/가입 성공 시 setQueryData로 즉시 반영
 * - 로그아웃 시 null로 세팅
 * - 프로필 수정 시 부분 업데이트
 */
export const useSetAuthData = () => {
  const queryClient = useQueryClient();

  const setAuthData = useCallback(
    (user: User | null) => {
      queryClient.setQueryData<User | null>(authKeys.me(), user);
    },
    [queryClient]
  );

  const updateAuthData = useCallback(
    (updater: (prev: User) => User) => {
      queryClient.setQueryData<User | null>(authKeys.me(), (prev) => {
        if (!prev) {
          return prev;
        }
        return updater(prev);
      });
    },
    [queryClient]
  );

  return { setAuthData, updateAuthData };
};
