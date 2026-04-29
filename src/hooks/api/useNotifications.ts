/**
 * 알림 API 훅
 *
 * - 목록: cursor 무한 스크롤 (로그인 필수)
 * - 미읽은 수: 60초 폴링 (로그인 시), 윈도우 포커스 복귀 시 즉시 갱신
 * - 전체 읽음: 호출 후 unread count + 목록 read 플래그 낙관 패치
 */

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getNotifications,
  getUnreadCount,
  markAllRead,
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
    staleTime: 30 * 1000,
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
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllRead(),
    onSuccess: () => {
      // unread count → 0 으로 즉시 패치
      queryClient.setQueryData<UnreadCountResponse>(notificationKeys.unreadCount(), { count: 0 });
      // 목록의 read 플래그도 모두 true 로 패치
      queryClient.setQueryData<{ pages: NotificationListResponse[] }>(
        notificationKeys.list(),
        (old) => {
          if (!old) {
            return old;
          }
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              notifications: (page.notifications ?? []).map((n) => ({ ...n, read: true })),
            })),
          };
        }
      );
    },
  });
};
