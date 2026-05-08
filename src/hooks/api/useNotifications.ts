/**
 * 알림 API 훅
 *
 * - 목록: cursor 무한 스크롤 (로그인 필수). 캐시 보관 안 함 — 매번 서버 fetch.
 * - 미읽은 수: 60초 폴링 (로그인 시), 윈도우 포커스 복귀 시 즉시 갱신.
 * - 전체 읽음 / 단건 읽음: 호출 후 목록·미읽은 수 캐시 무효화 → 서버에서 최신 상태 재조회.
 */

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
} from '@/generated/api/client/notification/notification';
import type { NotificationListResponse, UnreadCountResponse } from '@/generated/models';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

export const useInfiniteNotifications = (params?: { size?: number; enabled?: boolean }) =>
  useInfiniteQuery({
    queryKey: notificationKeys.list(),
    queryFn: async ({ pageParam }) => {
      const result = await getNotifications({
        cursor: pageParam,
        size: params?.size ?? 20,
      });
      return result as NotificationListResponse;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    enabled: params?.enabled ?? true,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

/**
 * 미읽은 알림 수 — 60초 폴링 + 포커스 복귀 시 갱신.
 * 로그인 유저에 한해 enabled = true.
 */
export const useUnreadNotificationCount = (enabled: boolean) =>
  useQuery<UnreadCountResponse>({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => getUnreadCount() as Promise<UnreadCountResponse>,
    enabled,
    staleTime: 0,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllRead(),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

/**
 * 단일 알림 읽음 처리.
 * 낙관 패치 없이 서버 호출 후 목록·미읽은 수 캐시를 무효화 → 서버가 진실 공급원.
 */
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => markRead(id),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};
