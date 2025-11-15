'use client';

import type { FC } from 'react';

import styles from './Toast.module.scss';

interface ToastProps {
  /**
   * 토스트 메시지
   */
  message: string;
  /**
   * 아이콘 (선택사항)
   */
  icon?: React.ReactNode;
  /**
   * 표시 여부
   */
  isVisible?: boolean;
}

export const Toast: FC<ToastProps> = ({ message, icon, isVisible = true }) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div className={styles.container}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <span className={styles.message}>{message}</span>
    </div>
  );
};
