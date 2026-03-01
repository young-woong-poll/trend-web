'use client';

import { useCallback, useState, type FC } from 'react';

import CopyIcon from '@/assets/icon/CopyIcon';
import InfoIcon from '@/assets/icon/InfoIcon';
import InstagramIcon from '@/assets/icon/InstagramIcon';
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
  /** 투표 완료 여부 — 결과 카드 공유 가능 여부 결정 */
  voted: boolean;
  /** 투표 제목 (카카오 SDK 연동 시 사용) */
  title: string;
}

export const ShareBottomSheet: FC<ShareBottomSheetProps> = ({
  isOpen,
  onClose,
  hotpickAlias,
  voted,
  title,
}) => {
  const { showToast } = useModal();
  const [useMyLink, setUseMyLink] = useState(false);

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

    // TODO: 카카오 SDK 연동 시 Kakao.Share.sendDefault({ title, url })로 교체
    // 현재는 클립보드 복사 fallback
    const shareText = title ? `${title} - HotPick\n${url}` : url;
    void navigator.clipboard.writeText(shareText).then(() => {
      showToast('카카오톡 공유 링크가 복사되었습니다');
    });

    onClose();
  }, [getShareUrl, title, showToast, onClose]);

  const handleInstagramStory = useCallback(() => {
    if (!voted) {
      showToast('투표 후 결과 카드를 저장할 수 있습니다');
      return;
    }

    onClose();

    // 결과 카드 이미지를 생성하여 다운로드
    // TODO: /api/og/share-card 엔드포인트 구현 필요
    const imageUrl = `${window.location.origin}/api/og/share-card?alias=${hotpickAlias}&tkuid=${getTKUID()}`;

    void fetch(imageUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hotpick-${hotpickAlias}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('이미지가 저장되었습니다. 인스타 스토리에 올려보세요!');
      })
      .catch(() => {
        showToast('이미지 저장에 실패했습니다');
      });
  }, [voted, hotpickAlias, showToast, onClose]);

  const handleCopyLink = useCallback(() => {
    const url = getShareUrl();
    void navigator.clipboard.writeText(url).then(() => {
      showToast('링크가 복사되었습니다');
    });
    onClose();
  }, [getShareUrl, showToast, onClose]);

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

              {/* 인스타그램 스토리 */}
              <button type="button" className={styles.shareButton} onClick={handleInstagramStory}>
                <div className={`${styles.shareIconWrapper} ${styles.instaIconBg}`}>
                  <InstagramIcon width={24} height={24} />
                </div>
                <span className={styles.shareLabel}>
                  {voted ? '결과 카드 저장' : '스토리 카드'}
                </span>
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
