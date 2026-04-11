'use client';

import { useCallback } from 'react';

import { createPortal } from 'react-dom';

import styles from '@/components/common/ImageViewer/ImageViewer.module.scss';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface ImageViewerProps {
  src: string | null;
  alt?: string;
  onClose: () => void;
}

export const ImageViewer = ({ src, alt = '', onClose }: ImageViewerProps) => {
  useBodyScrollLock(!!src);
  useEscapeKey(
    !!src,
    useCallback(() => onClose(), [onClose])
  );

  if (!src) {
    return null;
  }

  return createPortal(
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <button type="button" className={styles.closeButton} onClick={onClose} aria-label="닫기">
        ✕
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className={styles.image} onClick={(e) => e.stopPropagation()} />
    </div>,
    document.body
  );
};
