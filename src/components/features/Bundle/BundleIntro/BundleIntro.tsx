'use client';

import type { FC } from 'react';

import { useRouter } from 'next/navigation';

import CompareGroupIcon from '@/assets/icon/CompareGroupIcon';
import CompareOneIcon from '@/assets/icon/CompareOneIcon';
import { CategoryBadge } from '@/components/common/CategoryBadge/CategoryBadge';
import { Skeleton } from '@/components/common/Skeleton/Skeleton';
import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import styles from '@/components/features/Bundle/BundleIntro/BundleIntro.module.scss';
import { GroupPreviewNetwork } from '@/components/features/Compare/GroupPreviewNetwork/GroupPreviewNetwork';
import { PreviewRotation } from '@/components/features/Compare/PreviewRotation/PreviewRotation';
import { getCompareHook } from '@/constants/compare';
import { useAuth } from '@/contexts/AuthContext';
import { useBundleDetail } from '@/hooks/api/useBundle';
import { useCountUp } from '@/hooks/useCountUp';
import { formatCount } from '@/lib/utils';

interface BundleIntroProps {
  slug: string;
}

export const BundleIntro: FC<BundleIntroProps> = ({ slug }) => {
  const { data: bundle, isLoading } = useBundleDetail(slug);
  const { isLoggedIn, requireLogin } = useAuth();
  const router = useRouter();
  const animatedCount = useCountUp(bundle?.participantCount ?? 0);

  if (isLoading) {
    return (
      <BundleBackground>
        <div className={styles.container} style={{ gap: 24 }}>
          <Skeleton variant="dark" width={220} height={28} borderRadius={8} />
          <Skeleton variant="dark" width="100%" height={140} borderRadius={12} />
          <Skeleton variant="dark" width="100%" height={52} borderRadius={12} />
        </div>
      </BundleBackground>
    );
  }

  if (!bundle) {
    return (
      <BundleBackground>
        <div className={styles.loading}>번들을 찾을 수 없습니다.</div>
      </BundleBackground>
    );
  }

  const compareHook = getCompareHook(slug);

  const handleStart = () => {
    if (!isLoggedIn) {
      // 로그인 후 바로 플레이로 넘어가도록 returnUrl 세팅
      const dest = bundle.completed ? `/bundle/${slug}/result` : `/bundle/${slug}/play`;
      const params = new URLSearchParams(window.location.search);
      params.set('returnUrl', dest);
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
      requireLogin('default');
      return;
    }
    if (bundle.completed) {
      router.push(`/bundle/${slug}/result`);
    } else {
      router.push(`/bundle/${slug}/play`);
    }
  };

  const ctaText = () => {
    if (bundle.status === 'CLOSED') {
      return '마감된 번들입니다';
    }
    if (bundle.completed) {
      return '결과 보기';
    }
    return '시작하기';
  };

  return (
    <BundleBackground fireworks categoryCode={bundle.categoryCode}>
      <div className={styles.container}>
        <div className={styles.header}>
          <CategoryBadge categoryCode={bundle.categoryCode} label={bundle.category} />
          <h1 className={styles.title}>{bundle.title}</h1>
        </div>

        <div className={styles.meta}>
          <span className={styles.metaItem}>질문 {bundle.questionCount}개</span>
          <span className={styles.metaDot}>·</span>
          <span className={styles.metaItem}>{formatCount(animatedCount)}명 참여</span>
        </div>

        {/* 1:1 비교 프리뷰 */}
        <div className={styles.comparePreview}>
          <div className={styles.previewHeader}>
            <CompareOneIcon width={20} height={20} />
            <span className={styles.previewLabel}>1:1 비교</span>
          </div>
          <p className={styles.previewHook}>{compareHook.oneToOne}</p>
          <PreviewRotation nickname="나" embedded compact />
        </div>

        {/* 그룹 비교 */}
        <div className={styles.comparePreview}>
          <div className={styles.previewHeader}>
            <CompareGroupIcon width={20} height={20} />
            <span className={styles.previewLabel}>그룹 비교</span>
          </div>
          <p className={styles.previewHook}>{compareHook.group}</p>
          <GroupPreviewNetwork embedded />
        </div>
      </div>

      <div className={styles.floatingCta}>
        <button
          type="button"
          className={styles.ctaButton}
          onClick={handleStart}
          disabled={bundle.status === 'CLOSED'}
        >
          {ctaText()}
        </button>
        {!isLoggedIn && <p className={styles.loginNotice}>참여하려면 로그인이 필요합니다</p>}
      </div>
    </BundleBackground>
  );
};
