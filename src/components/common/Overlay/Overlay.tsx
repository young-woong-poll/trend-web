'use client';

import type { FC, ReactNode } from 'react';

import { Portal } from '../Portal/Portal';

import styles from './Overlay.module.scss';

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
