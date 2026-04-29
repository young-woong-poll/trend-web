'use client';

import { type FC } from 'react';

import { useRouter } from 'next/navigation';

import styles from '@/components/features/Notification/NotificationItem.module.scss';
import {
  NotificationItemType,
  type NotificationItem as NotificationItemModel,
} from '@/generated/models';
import { getRelativeTime } from '@/lib/utils';

interface NotificationItemProps {
  notification: NotificationItemModel;
  onNavigate: () => void;
}

const TYPE_TEXT: Record<string, { verb: string; emoji: string }> = {
  [NotificationItemType.COMMENT_LIKE]: { verb: '내 댓글에 좋아요를 눌렀어요', emoji: '♥' },
  [NotificationItemType.COMMENT_REPLY]: { verb: '내 댓글에 답글을 달았어요', emoji: '↩' },
  [NotificationItemType.COMPARE_LINK_JOIN]: { verb: '비교 링크에 참여했어요', emoji: '✦' },
};

export const NotificationItem: FC<NotificationItemProps> = ({ notification, onNavigate }) => {
  const router = useRouter();

  const handleClick = () => {
    if (notification.targetUrl) {
      router.push(notification.targetUrl);
    }
    onNavigate();
  };

  const typeInfo = notification.type ? TYPE_TEXT[notification.type] : undefined;
  const verb = typeInfo?.verb ?? '새 알림';
  const emoji = typeInfo?.emoji ?? '·';
  const isUnread = notification.read === false;
  const actorLabel = notification.actorNickname ?? '익명';

  return (
    <button
      type="button"
      className={`${styles.item} ${isUnread ? styles.unread : ''}`}
      onClick={handleClick}
      aria-label={`${isUnread ? '(안 읽음) ' : ''}${actorLabel}: ${verb}`}
    >
      <span className={styles.iconBadge} aria-hidden>
        {emoji}
      </span>
      <div className={styles.body}>
        <span className={styles.text}>
          <span className={styles.actor}>{actorLabel}</span>님이 {verb}
        </span>
        {notification.contentPreview && (
          <span className={styles.preview}>{notification.contentPreview}</span>
        )}
        <span className={styles.time}>{getRelativeTime(notification.createdAt ?? '')}</span>
      </div>
      {isUnread && <span className={styles.unreadDot} aria-hidden />}
    </button>
  );
};
