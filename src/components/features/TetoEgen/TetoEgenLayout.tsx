'use client';

import { type FC, type ReactNode, useCallback } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import BackIcon from '@/assets/icon/BackIcon';
import CloseIcon from '@/assets/icon/CloseIcon';
import mainLogo from '@/assets/img/main-logo@1x.png';
import styles from '@/components/features/TetoEgen/TetoEgenLayout.module.scss';

type TetoEgenLayoutProps = {
  showBack?: boolean;
  onBack?: () => void;
  showClose?: boolean;
  onClose?: () => void;
  // 좌상단에 HotPick 로고 노출 + 클릭 시 홈으로. showBack과 동시 사용 시 showBack 우선.
  showLogo?: boolean;
  children: ReactNode;
  footer?: ReactNode;
};

const TetoEgenLayout: FC<TetoEgenLayoutProps> = ({
  showBack = false,
  onBack,
  showClose = false,
  onClose,
  showLogo = false,
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

  const hasHeaderButton = showBack || showClose || showLogo;

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.leadingSlot}>
          {showBack ? (
            <button
              type="button"
              className={styles.iconButton}
              onClick={handleBack}
              aria-label="이전"
            >
              <BackIcon className={styles.icon} />
            </button>
          ) : showLogo ? (
            <Link href="/" className={styles.logoLink} aria-label="HotPick 메인으로 이동">
              <Image src={mainLogo} alt="HotPick" priority height={24} className={styles.logoImg} />
            </Link>
          ) : null}
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
      <main className={`${styles.body} ${!hasHeaderButton ? styles.bodyCompact : ''}`}>
        {children}
      </main>
      {footer && <footer className={styles.footer}>{footer}</footer>}
    </div>
  );
};

export default TetoEgenLayout;
