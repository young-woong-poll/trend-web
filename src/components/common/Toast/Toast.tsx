'use client';

import { useEffect, useState, type FC } from 'react';

import CloseIcon from '@/assets/icon/CloseIcon';
import styles from '@/components/common/Toast/Toast.module.scss';

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
  /**
   * 닫기 버튼 클릭 핸들러
   */
  onClose?: () => void;
}

export const Toast: FC<ToastProps> = ({ message, icon, isVisible = true, onClose }) => {
  const [isHiding, setIsHiding] = useState(false);
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setIsHiding(false);
    } else if (shouldRender) {
      setIsHiding(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsHiding(false);
      }, 300); // 애니메이션 시간과 동일
      return () => clearTimeout(timer);
    }
  }, [isVisible, shouldRender]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div className={`${styles.container} ${isHiding ? styles.hiding : ''}`}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <span className={styles.message}>{message}</span>
      {onClose && (
        <button type="button" className={styles.closeButton} onClick={onClose}>
          <CloseIcon width={16} height={16} />
        </button>
      )}
    </div>
  );
};
