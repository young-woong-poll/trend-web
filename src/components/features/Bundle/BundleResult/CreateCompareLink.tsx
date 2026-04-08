'use client';

import { useEffect, type FC } from 'react';

import { createPortal } from 'react-dom';

import CloseIcon from '@/assets/icon/CloseIcon';
import { CategoryBadge } from '@/components/common/CategoryBadge/CategoryBadge';
import { Toast } from '@/components/common/Toast/Toast';
import styles from '@/components/features/Bundle/BundleResult/CreateCompareLink.module.scss';
import { getCategoryThemeVars } from '@/constants/categoryTheme';
import { useCreateCompareLink } from '@/hooks/api/useCompare';
import { useToast } from '@/hooks/useToast';
import { trackCompareCreate, trackCompareShare } from '@/lib/analytics';
import type { CategoryCode } from '@/types/hotpick';

interface CreateCompareLinkProps {
  slug: string;
  categoryCode?: CategoryCode;
  bundleTitle?: string;
  onClose: () => void;
  source?: string;
}

export const CreateCompareLink: FC<CreateCompareLinkProps> = ({
  slug,
  categoryCode,
  bundleTitle,
  onClose,
  source = 'bundle_result',
}) => {
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

    createMutation.mutate(
      { type: 'ONE_TO_ONE' },
      {
        onSuccess: () => trackCompareCreate(slug, 'ONE_TO_ONE', source),
        onError: () => {
          showToast('링크 생성에 실패했습니다. 번들을 먼저 완료해주세요.');
          onClose();
        },
      }
    );

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
      trackCompareShare(slug, 'copy', 'ONE_TO_ONE', source);
      showToast('링크가 복사되었습니다');
    } catch {
      showToast('복사에 실패했습니다');
    }
  };

  return createPortal(
    <div className={styles.overlay} style={getCategoryThemeVars(categoryCode)} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.title}>1:1 비교 링크 공유</h2>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label="닫기">
            <CloseIcon width={16} height={16} />
          </button>
        </div>
        {bundleTitle && (
          <div className={styles.bundleInfo}>
            <CategoryBadge categoryCode={categoryCode} />
            <span className={styles.bundleTitle}>{bundleTitle}</span>
          </div>
        )}

        <p className={styles.description}>가장 먼저 참여한 친구와 1:1 비교돼요</p>
        <div className={styles.linkBox}>
          <span className={styles.linkText}>
            {createMutation.isPending
              ? '링크 생성 중...'
              : createMutation.isError
                ? '링크 생성 실패'
                : shareUrl}
          </span>
        </div>
        <button
          type="button"
          className={styles.ctaButton}
          onClick={handleCopy}
          disabled={createMutation.isPending || createMutation.isError}
        >
          링크 복사하기
        </button>
      </div>
      <Toast message={toast.message} isVisible={toast.isVisible} />
    </div>,
    document.body
  );
};
