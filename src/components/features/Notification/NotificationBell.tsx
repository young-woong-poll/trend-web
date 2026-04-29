'use client';

import { useCallback, useEffect, useRef, useState, type FC } from 'react';

import BellIcon from '@/assets/icon/BellIcon';
import styles from '@/components/features/Notification/NotificationBell.module.scss';
import { NotificationDropdown } from '@/components/features/Notification/NotificationDropdown';
import { useUnreadNotificationCount } from '@/hooks/api';

interface NotificationBellProps {
  /** 로그인 상태일 때만 fetch 수행 */
  enabled: boolean;
}

export const NotificationBell: FC<NotificationBellProps> = ({ enabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data } = useUnreadNotificationCount(enabled);
  const unreadCount = data?.count ?? 0;

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // outside click → close
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, close]);

  // ESC → close
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  if (!enabled) {
    return null;
  }

  const badgeText = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={styles.bellButton}
        onClick={toggle}
        aria-label={unreadCount > 0 ? `알림 ${unreadCount}개` : '알림'}
        aria-expanded={isOpen}
      >
        <BellIcon className={styles.bellIcon} />
        {unreadCount > 0 && <span className={styles.badge}>{badgeText}</span>}
      </button>
      {isOpen && <NotificationDropdown unreadCount={unreadCount} onClose={close} />}
    </div>
  );
};
