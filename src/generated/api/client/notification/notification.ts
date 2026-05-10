import type {
  BaseResponseNotificationListResponse,
  BaseResponseNotificationReadResponse,
  BaseResponseUnreadCountResponse,
  BaseResponseVoid,
  GetNotificationsParams,
} from '../../../models';

import { customInstance } from '../../../../lib/axios-mutator';

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

/**
 * 이미 읽음 상태여도 200 + 현재 unreadCount 반환. 다른 유저 알림은 403, 존재하지 않으면 404.
 * @summary 단건 읽음 처리 (idempotent)
 */
export const markRead = (
  notificationId: number,
  options?: SecondParameter<typeof customInstance<BaseResponseNotificationReadResponse>>
) => {
  return customInstance<BaseResponseNotificationReadResponse>(
    { url: `/api/v1/notifications/${notificationId}/read`, method: 'POST' },
    options
  );
};
/**
 * @summary 전체 읽음 처리
 */
export const markAllRead = (options?: SecondParameter<typeof customInstance<BaseResponseVoid>>) => {
  return customInstance<BaseResponseVoid>(
    { url: `/api/v1/notifications/read-all`, method: 'POST' },
    options
  );
};
/**
 * @summary 알림 목록 조회 (최신순, retention 기간 내)
 */
export const getNotifications = (
  params?: GetNotificationsParams,
  options?: SecondParameter<typeof customInstance<BaseResponseNotificationListResponse>>
) => {
  return customInstance<BaseResponseNotificationListResponse>(
    { url: `/api/v1/notifications`, method: 'GET', params },
    options
  );
};
/**
 * @summary 미읽은 알림 수
 */
export const getUnreadCount = (
  options?: SecondParameter<typeof customInstance<BaseResponseUnreadCountResponse>>
) => {
  return customInstance<BaseResponseUnreadCountResponse>(
    { url: `/api/v1/notifications/unread-count`, method: 'GET' },
    options
  );
};
export type MarkReadResult = NonNullable<Awaited<ReturnType<typeof markRead>>>;
export type MarkAllReadResult = NonNullable<Awaited<ReturnType<typeof markAllRead>>>;
export type GetNotificationsResult = NonNullable<Awaited<ReturnType<typeof getNotifications>>>;
export type GetUnreadCountResult = NonNullable<Awaited<ReturnType<typeof getUnreadCount>>>;
