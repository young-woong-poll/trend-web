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

/**
 * 단일 알림 클릭 시의 낙관 read 처리.
 * BE에 per-item read 엔드포인트가 없으므로 캐시만 패치 — 다음 refetch 때 서버 상태로 되돌아갈 수 있음.
 * 그래도 클릭 시점의 시각적 피드백을 위해 사용한다.
 */
export const useMarkNotificationReadLocally = () => {
  const queryClient = useQueryClient();

  return (id: number) => {
    queryClient.setQueryData<{ pages: NotificationListResponse[] }>(
      notificationKeys.list(),
      (old) => {
        if (!old) {
          return old;
        }
        let didMark = false;
        const next = {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            notifications: (page.notifications ?? []).map((n) => {
              if (n.id === id && n.read === false) {
                didMark = true;
                return { ...n, read: true };
              }
              return n;
            }),
          })),
        };
        if (!didMark) {
          return old;
        }
        // unread count도 1 감소
        queryClient.setQueryData<UnreadCountResponse>(notificationKeys.unreadCount(), (prev) => ({
          count: Math.max(0, (prev?.count ?? 1) - 1),
        }));
        return next;
      }
    );
  };
};
