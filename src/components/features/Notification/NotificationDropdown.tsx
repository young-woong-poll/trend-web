'use client';

import { useEffect, useRef, type FC } from 'react';

import styles from '@/components/features/Notification/NotificationDropdown.module.scss';
import { NotificationItem } from '@/components/features/Notification/NotificationItem';
import { useInfiniteNotifications, useMarkAllNotificationsRead } from '@/hooks/api';

interface NotificationDropdownProps {
  unreadCount: number;
  onClose: () => void;
}

export const NotificationDropdown: FC<NotificationDropdownProps> = ({ unreadCount, onClose }) => {
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteNotifications({ size: 20 });
  const { mutate: markAll, isPending: isMarking } = useMarkAllNotificationsRead();

  const observerTarget = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = observerTarget.current;
    const root = scrollAreaRef.current;
    if (!target || !root) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { root, threshold: 0.1 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const notifications = data?.pages.flatMap((page) => page.notifications ?? []) ?? [];
  const handleMarkAll = () => markAll();

  return (
    <div className={styles.dropdown} role="dialog" aria-label="알림">
      <div className={styles.header}>
        <h2 className={styles.title}>알림</h2>
        <button
          type="button"
          className={styles.markAllButton}
          onClick={handleMarkAll}
          disabled={unreadCount === 0 || isMarking}
        >
          전체 읽음
        </button>
      </div>

      <div className={styles.scrollArea} ref={scrollAreaRef}>
        {isLoading ? (
          <div className={styles.loading}>불러오는 중...</div>
        ) : isError ? (
          <div className={styles.empty}>알림을 불러오는데 실패했습니다.</div>
        ) : notifications.length === 0 ? (
          <div className={styles.empty}>아직 알림이 없습니다.</div>
        ) : (
          <>
            {notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} onNavigate={onClose} />
            ))}
            <div ref={observerTarget} className={styles.observerTarget}>
              {isFetchingNextPage && <div className={styles.loadMore}>불러오는 중...</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
