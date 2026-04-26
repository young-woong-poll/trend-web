'use client';

import { type FC, type ReactNode, useCallback } from 'react';

import { useRouter } from 'next/navigation';

import BackIcon from '@/assets/icon/BackIcon';
import CloseIcon from '@/assets/icon/CloseIcon';
import styles from '@/components/features/TetoEgen/TetoEgenLayout.module.scss';

type TetoEgenLayoutProps = {
  showBack?: boolean;
  onBack?: () => void;
  showClose?: boolean;
  onClose?: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

const TetoEgenLayout: FC<TetoEgenLayoutProps> = ({
  showBack = false,
  onBack,
  showClose = false,
  onClose,
  children,
  footer,
}) => {
  const router = useRouter();

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  }, [onBack, router]);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      router.push('/');
    }
  }, [onClose, router]);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.leadingSlot}>
          {showBack && (
            <button
              type="button"
              className={styles.iconButton}
              onClick={handleBack}
              aria-label="이전"
            >
              <BackIcon className={styles.icon} />
            </button>
          )}
        </div>
        <div className={styles.trailingSlot}>
          {showClose && (
            <button
              type="button"
              className={styles.iconButton}
              onClick={handleClose}
              aria-label="닫기"
            >
              <CloseIcon width={24} height={24} />
            </button>
          )}
        </div>
      </header>
      <main className={styles.body}>{children}</main>
      {footer && <footer className={styles.footer}>{footer}</footer>}
    </div>
  );
};

export default TetoEgenLayout;
