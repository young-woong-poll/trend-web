'use client';

import { useEffect, useId, useRef, type FC } from 'react';

import { createPortal } from 'react-dom';

import CloseIcon from '@/assets/icon/CloseIcon';
import styles from '@/components/features/Compare/MyCompareLinksSheet/MyCompareLinksSheet.module.scss';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import type { MyCompareLink } from '@/types/my-compare';

interface MyCompareLinksSheetProps {
  isOpen: boolean;
  links: MyCompareLink[];
  onItemClick: (token: string) => void;
  onClose: () => void;
}

export const MyCompareLinksSheet: FC<MyCompareLinksSheetProps> = ({
  isOpen,
  links,
  onItemClick,
  onClose,
}) => {
  const labelId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEscapeKey(isOpen, onClose);

  // 시트 마운트 직후 닫기 버튼으로 포커스 이동
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  // 배경 스크롤 잠금 (iOS position: fixed 패턴)
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby={labelId}>
        <div className={styles.sheetHeader}>
          <span id={labelId} className={styles.sheetLabel}>
            참여 중인 비교링크 {links.length}개
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="닫기"
          >
            <CloseIcon width={16} height={16} />
          </button>
        </div>

        <div className={styles.sheetBody} role="list">
          {links.map((link) => {
            const token = link.token ?? '';
            return (
              <button
                key={token}
                type="button"
                className={styles.row}
                onClick={() => onItemClick(token)}
                role="listitem"
              >
                <span className={styles.name} title={link.groupName ?? undefined}>
                  {link.groupName ?? '이름 없음'}
                </span>
                <span className={styles.meta}>
                  {link.memberCount ?? 0}명
                  <span className={styles.arrow} aria-hidden>
                    ›
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>,
    document.body
  );
};
