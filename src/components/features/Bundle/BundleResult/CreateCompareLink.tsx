'use client';

import { useEffect, type FC } from 'react';

import { createPortal } from 'react-dom';

import CloseIcon from '@/assets/icon/CloseIcon';
import { Toast } from '@/components/common/Toast/Toast';
import styles from '@/components/features/Bundle/BundleResult/CreateCompareLink.module.scss';
import { getCategoryThemeVars } from '@/constants/categoryTheme';
import { useCreateCompareLink } from '@/hooks/api/useCompare';
import { useToast } from '@/hooks/useToast';
import type { CategoryCode } from '@/types/hotpick';

interface CreateCompareLinkProps {
  slug: string;
  categoryCode?: CategoryCode;
  onClose: () => void;
}

export const CreateCompareLink: FC<CreateCompareLinkProps> = ({ slug, categoryCode, onClose }) => {
  const createMutation = useCreateCompareLink(slug);
  const { toast, showToast } = useToast();

  // 모달 열릴 때 즉시 링크 생성 + 배경 스크롤 잠금
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';

    createMutation.mutate({ type: 'ONE_TO_ONE' });

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shareUrl = createMutation.data?.token
    ? `${window.location.origin}/compare/${createMutation.data.token}`
    : null;

  const handleCopy = async () => {
    if (!shareUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('링크가 복사되었습니다');
    } catch {
      showToast('복사에 실패했습니다');
    }
  };

  return createPortal(
    <div className={styles.overlay} style={getCategoryThemeVars(categoryCode)} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.modalClose} onClick={onClose} aria-label="닫기">
          <CloseIcon width={16} height={16} />
        </button>

        {createMutation.isPending ? (
          <p className={styles.description}>링크 생성 중...</p>
        ) : createMutation.isError ? (
          <p className={styles.description}>링크 생성에 실패했습니다</p>
        ) : (
          <>
            <h2 className={styles.title}>비교 링크를 친구에게 공유해주세요</h2>
            <p className={styles.description}>가장 먼저 들어오는 친구와 1:1 비교돼요</p>
            <div className={styles.linkBox}>
              <span className={styles.linkText}>{shareUrl}</span>
            </div>
            <button type="button" className={styles.ctaButton} onClick={handleCopy}>
              링크 복사하기
            </button>
          </>
        )}
      </div>
      <Toast message={toast.message} isVisible={toast.isVisible} />
    </div>,
    document.body
  );
};
