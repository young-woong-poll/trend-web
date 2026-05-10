import type { NotificationItem } from './notificationItem';

/**
 * 응답 데이터
 */
export interface NotificationListResponse {
  notifications?: NotificationItem[];
  nextCursor?: string;
  hasMore?: boolean;
}
