'use client';

import { type FC } from 'react';

import { useRouter } from 'next/navigation';

import styles from '@/components/features/Notification/NotificationItem.module.scss';
import {
  NotificationItemType,
  type NotificationItem as NotificationItemModel,
} from '@/generated/models';
import { useMarkNotificationReadLocally } from '@/hooks/api/useNotifications';
import { getRelativeTime } from '@/lib/utils';

interface NotificationItemProps {
  notification: NotificationItemModel;
  onNavigate: () => void;
}

const TYPE_TEXT: Record<string, { verb: string; emoji: string }> = {
  [NotificationItemType.COMMENT_LIKE]: { verb: '내 댓글에 좋아요를 눌렀어요', emoji: '♥' },
  [NotificationItemType.COMMENT_REPLY]: { verb: '내 댓글에 답글을 달았어요', emoji: '↩' },
  [NotificationItemType.COMPARE_LINK_JOIN]: { verb: '비교 링크에 참여했어요', emoji: '✦' },
  [NotificationItemType.ASK_TETO_EGEN_VOTE]: { verb: '당신을 평가했어요', emoji: '◐' },
};

// targetUrl이 비어있는 타입에 대한 FE 폴백. BE가 targetUrl을 채우면 자동으로 그 값이 우선 사용됨.
const FALLBACK_URL_BY_TYPE: Record<string, string> = {
  [NotificationItemType.ASK_TETO_EGEN_VOTE]: '/ask/teto-egen/my',
};

const formatPreview = (notification: NotificationItemModel): string | null | undefined => {
  if (notification.type === NotificationItemType.ASK_TETO_EGEN_VOTE) {
    if (notification.contentPreview === 'TETO') {
      return '테토';
    }
    if (notification.contentPreview === 'EGEN') {
      return '에겐';
    }
  }
  return notification.contentPreview;
};

export const NotificationItem: FC<NotificationItemProps> = ({ notification, onNavigate }) => {
  const router = useRouter();
  const markReadLocally = useMarkNotificationReadLocally();

  const handleClick = () => {
    if (notification.id !== undefined && notification.read === false) {
      markReadLocally(notification.id);
    }

    const fallbackUrl = notification.type ? FALLBACK_URL_BY_TYPE[notification.type] : undefined;
    const target = notification.targetUrl || fallbackUrl;
    if (target) {
      router.push(target);
    }
    onNavigate();
  };

  const typeInfo = notification.type ? TYPE_TEXT[notification.type] : undefined;
  const verb = typeInfo?.verb ?? '새 알림';
  const emoji = typeInfo?.emoji ?? '·';
  const isUnread = notification.read === false;
  const actorLabel = notification.actorNickname ?? '익명';
  const preview = formatPreview(notification);

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
        {preview && <span className={styles.preview}>{preview}</span>}
        <span className={styles.time}>{getRelativeTime(notification.createdAt ?? '')}</span>
      </div>
      {isUnread && <span className={styles.unreadDot} aria-hidden />}
    </button>
  );
};
