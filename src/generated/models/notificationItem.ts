import type { NotificationItemType } from './notificationItemType';

export interface NotificationItem {
  id?: number;
  type?: NotificationItemType;
  actorNickname?: string;
  actorProfileColor?: string;
  contentPreview?: string;
  targetUrl?: string;
  hotpickSlug?: string;
  electionId?: number;
  commentId?: string;
  parentCommentId?: string;
  read?: boolean;
  createdAt?: string;
}
