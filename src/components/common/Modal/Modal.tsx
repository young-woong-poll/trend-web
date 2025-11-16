'use client';

import { useEffect, type FC, type ReactNode } from 'react';

import styles from '@/components/common/Modal/Modal.module.scss';
import { Portal } from '@/components/common/Portal/Portal';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
  closeOnDimmedClick?: boolean;
  showCloseButton?: boolean;
  maxWidth?: number;
}

export const Modal: FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  closeOnDimmedClick = false,
  showCloseButton = false,
  maxWidth = 400,
}) => {
  // 모달이 열릴 때 body 스크롤 막기
  useEffect(() => {
    if (isOpen) {
      // 현재 스크롤 위치 저장
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // 원래 스크롤 위치로 복원
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleDimmedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (closeOnDimmedClick && onClose) {
      onClose();
    }
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // 터치 이벤트에서도 스크롤 막기
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
  };

  return (
    <Portal>
      <div className={styles.dimmed} onClick={handleDimmedClick} onTouchMove={handleTouchMove}>
        <div
          className={styles.modalContent}
          onClick={handleContentClick}
          style={{ maxWidth: `${maxWidth}px` }}
        >
          {showCloseButton && onClose && (
            <button className={styles.closeButton} onClick={onClose} aria-label="닫기">
              ✕
            </button>
          )}
          {children}
        </div>
      </div>
    </Portal>
  );
};
