'use client';

import type { FC, ReactNode } from 'react';

import styles from '@/components/common/Overlay/Overlay.module.scss';
import { Portal } from '@/components/common/Portal/Portal';

interface OverlayProps {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
}

export const Overlay: FC<OverlayProps> = ({ isOpen, onClose, children, className = '' }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Portal>
      <div className={styles.overlay} onClick={onClose}>
        <div className={`${styles.content} ${className}`} onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </Portal>
  );
};
