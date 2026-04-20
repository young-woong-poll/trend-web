'use client';

import { type FC } from 'react';

import { CategoryBadge } from '@/components/common/CategoryBadge/CategoryBadge';
import { FloatingCta } from '@/components/common/FloatingCta/FloatingCta';
import { SmartBackButton } from '@/components/common/SmartBackButton/SmartBackButton';
import styles from '@/components/features/Compare/GroupResult/WaitingView.module.scss';
import { PreviewRotation } from '@/components/features/Compare/PreviewRotation/PreviewRotation';
import { useToast } from '@/hooks/useToast';
import type { CategoryCode } from '@/types/hotpick';

interface WaitingViewProps {
  /** 생성자 닉네임 (히어로 카피용) */
  nickname: string;
  /** compare-link token (초대 링크 생성용) */
  token: string;
  /** 헤더용 메타 */
  categoryCode?: CategoryCode;
  categoryMeta?: string | null;
  category?: string;
  bundleTitle?: string;
}

export const WaitingView: FC<WaitingViewProps> = ({
  nickname,
  token,
  categoryCode,
  categoryMeta,
  category,
  bundleTitle,
}) => {
  const { showToast } = useToast();

  const handleCopyInvite = async () => {
    const url = `${window.location.origin}/compare/group/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('링크가 복사됐어요. 단톡방·카톡·메시지에 붙여넣으면 친구가 바로 참여할 수 있어요');
    } catch {
      showToast('복사에 실패했어요');
    }
  };

  return (
    <div className={styles.container}>
      <SmartBackButton className={styles.backButton} size={22} />

      {/* 카테고리 + 번들 제목 */}
      <div className={styles.header}>
        {(categoryCode || category) && (
          <CategoryBadge categoryCode={categoryCode} categoryMeta={categoryMeta} label={category} />
        )}
        {bundleTitle && <h2 className={styles.title}>{bundleTitle}</h2>}
      </div>

      {/* 봉인 히어로 (제목 + 힌트 2줄) */}
      <section className={styles.hero} aria-label="비교 대기 안내">
        <div className={styles.unsealIcon} aria-hidden="true">
          <div className={styles.lockBody}>
            <div className={styles.lockShackle} />
          </div>
        </div>
        <h1 className={styles.heroTitle}>
          {nickname}님의 비교 링크
          <br />
          친구가 오면 열려요
        </h1>
      </section>

      {/* 샘플 등급 로테이션 */}
      <section className={styles.rotation} aria-label="이런 결과가 나올 수 있어요">
        <p className={styles.rotationLabel}>이런 결과가 나올 수 있어요</p>
        <PreviewRotation nickname={nickname} embedded compact />
      </section>

      {/* 플로팅 CTA */}
      <FloatingCta onClick={handleCopyInvite}>친구에게 링크 보내기</FloatingCta>
    </div>
  );
};
