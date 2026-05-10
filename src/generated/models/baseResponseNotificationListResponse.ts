import type { NotificationListResponse } from './notificationListResponse';

/**
 * 공통 응답 포맷
 */
export interface BaseResponseNotificationListResponse {
  /** 응답 코드 */
  code?: string;
  /** 응답 메시지 */
  message?: string;
  data?: NotificationListResponse;
}
