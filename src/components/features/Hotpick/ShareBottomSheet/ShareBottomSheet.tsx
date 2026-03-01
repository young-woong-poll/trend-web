'use client';

import { useCallback, useState, type FC } from 'react';

import CopyIcon from '@/assets/icon/CopyIcon';
import InfoIcon from '@/assets/icon/InfoIcon';
import KakaoIcon from '@/assets/icon/KakaoIcon';
import { Portal } from '@/components/common/Portal/Portal';
import styles from '@/components/features/Hotpick/ShareBottomSheet/ShareBottomSheet.module.scss';
import { useModal } from '@/contexts/ModalContext';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { getTKUID } from '@/lib/tkuid';

export interface ShareBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  hotpickAlias: string;
  /** 투표 제목 */
  title: string;
  /** 투표 옵션 제목 목록 (예: ['짜장면', '짬뽕']) */
  options?: string[];
  /** OG 이미지 URL (카카오 공유 썸네일) */
  imageUrl?: string;
}

export const ShareBottomSheet: FC<ShareBottomSheetProps> = ({
  isOpen,
  onClose,
  hotpickAlias,
  title,
  options = [],
  imageUrl,
}) => {
  const { showToast } = useModal();
  const [useMyLink, setUseMyLink] = useState(true);

  useBodyScrollLock(isOpen);
  useEscapeKey(isOpen, onClose);

  const getShareUrl = useCallback(() => {
    const baseUrl = `${window.location.origin}/hotpick/${hotpickAlias}`;
    if (useMyLink) {
      const tkuid = getTKUID();
      return `${baseUrl}?ref=${tkuid}`;
    }
    return baseUrl;
  }, [hotpickAlias, useMyLink]);

  const handleKakaoShare = useCallback(() => {
    const url = getShareUrl();
    const description = options.length > 0 ? options.join(' vs ') : '';

    // 카카오 SDK 로드 여부 확인
    if (window.Kakao?.isInitialized()) {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title,
          description,
          imageUrl: imageUrl || `${window.location.origin}/og-vote.jpg`,
          link: { mobileWebUrl: url, webUrl: url },
        },
        buttons: [
          {
            title: '투표하기',
            link: { mobileWebUrl: url, webUrl: url },
          },
        ],
      });
      return;
    }

    // SDK 미로드 시 클립보드 복사 fallback
    const shareText = title ? `${title} - HotPick\n${url}` : url;
    void navigator.clipboard.writeText(shareText).then(() => {
      showToast('카카오톡 공유 링크가 복사되었습니다');
    });
  }, [getShareUrl, title, options, imageUrl, showToast]);

  const handleCopyLink = useCallback(() => {
    const url = getShareUrl();
    void navigator.clipboard.writeText(url).then(() => {
      showToast('링크가 복사되었습니다');
    });
  }, [getShareUrl, showToast]);

  if (!isOpen) {
    return null;
  }

  const handleDimmedClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <Portal>
      <div className={styles.dimmed} onClick={handleDimmedClick}>
        <div className={styles.bottomSheet} data-testid="share-bottom-sheet">
          {/* 헤더 */}
          <div className={styles.header}>
            <div className={styles.titleRow}>
              <h2 className={styles.title}>공유하기</h2>
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 공유 대상 핫픽 프리뷰 */}
          <div className={styles.hotpickPreview}>
            <div className={styles.hotpickCard}>
              <div className={styles.hotpickAccent} />
              <div className={styles.hotpickCardContent}>
                <p className={styles.hotpickTitle}>{title}</p>
                {options.length > 0 && (
                  <div className={styles.hotpickOptions}>
                    {options.map((opt, i) => (
                      <span key={opt} className={styles.hotpickOption}>
                        {i > 0 && <span className={styles.hotpickVs}>vs</span>}
                        {opt}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 콘텐츠 */}
          <div className={styles.content}>
            {/* 공유 버튼 그리드 */}
            <div className={styles.shareGrid}>
              {/* 카카오톡 */}
              <button type="button" className={styles.shareButton} onClick={handleKakaoShare}>
                <div className={`${styles.shareIconWrapper} ${styles.kakaoIconBg}`}>
                  <KakaoIcon width={24} height={24} />
                </div>
                <span className={styles.shareLabel}>카카오톡</span>
              </button>

              {/* 링크 복사 */}
              <button type="button" className={styles.shareButton} onClick={handleCopyLink}>
                <div className={`${styles.shareIconWrapper} ${styles.copyIconBg}`}>
                  <CopyIcon width={20} height={20} />
                </div>
                <span className={styles.shareLabel}>링크 복사</span>
              </button>
            </div>

            {/* 구분선 */}
            <div className={styles.divider} />

            {/* 내 링크 옵션 */}
            <div className={styles.myLinkSection}>
              <div className={styles.myLinkToggle}>
                <div className={styles.myLinkLeft}>
                  <span className={styles.myLinkLabel}>내 링크로 공유</span>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    className={styles.toggleInput}
                    checked={useMyLink}
                    onChange={(e) => setUseMyLink(e.target.checked)}
                  />
                  <span className={styles.toggleSlider} />
                </label>
              </div>

              {/* 내 링크 설명 */}
              <div className={styles.myLinkDescription}>
                <InfoIcon width={16} height={16} />
                <p className={styles.myLinkDescriptionText}>
                  <strong>내 링크</strong>를 켜면 공유한 링크로 투표한 사람들의 결과를 따로 모아볼
                  수 있어요.
                  <br />
                  카카오톡, 링크 복사 모두 적용됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};
