'use client';

import { useEffect, type FC } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import ClockIcon from '@/assets/icon/ClockIcon';
import CompareGroupIcon from '@/assets/icon/CompareGroupIcon';
import { CategoryBadge } from '@/components/common/CategoryBadge/CategoryBadge';
import { Skeleton } from '@/components/common/Skeleton/Skeleton';
import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import styles from '@/components/features/Bundle/BundleIntro/BundleIntro.module.scss';
import { GroupPreviewNetwork } from '@/components/features/Compare/GroupPreviewNetwork/GroupPreviewNetwork';
import { getCompareHook } from '@/constants/compare';
import { useAuth } from '@/contexts/AuthContext';
import { useBundleDetail } from '@/hooks/api/useBundle';
import { useCountUp } from '@/hooks/useCountUp';
import { trackBundleView, trackBundleStart } from '@/lib/analytics';
import { formatCount } from '@/lib/utils';

interface BundleIntroProps {
  slug: string;
}

function formatDuration(electionCount: number): string {
  const seconds = electionCount * 5;
  if (seconds <= 30) {
    return '약 30초';
  }
  if (seconds <= 59) {
    return '약 1분';
  }
  return `약 ${Math.round(seconds / 60)}분`;
}

export const BundleIntro: FC<BundleIntroProps> = ({ slug }) => {
  const { data: bundle, isLoading } = useBundleDetail(slug);
  const { isLoggedIn, requireLogin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const animatedCount = useCountUp(bundle?.participantCount ?? 0);
  const compareHook = getCompareHook(slug);

  // GA4: 번들 인트로 조회
  useEffect(() => {
    if (bundle) {
      const entryPoint = searchParams.get('compareToken') ? 'compare_link' : 'direct';
      trackBundleView(slug, entryPoint);
    }
  }, [bundle, slug, searchParams]);

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
        <div className={styles.loading}>테스트를 찾을 수 없어요. 링크를 다시 확인해 주세요.</div>
      </BundleBackground>
    );
  }

  const handleStart = () => {
    trackBundleStart(slug);
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

  const questionCount = bundle.questionCount ?? 0;

  return (
    <BundleBackground
      fireworks
      categoryCode={bundle.categoryCode}
      categoryMeta={bundle.categoryMeta}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <CategoryBadge
            categoryCode={bundle.categoryCode}
            categoryMeta={bundle.categoryMeta}
            label={bundle.category}
          />
          <h1 className={styles.title}>{bundle.title}</h1>
        </div>

        <div className={styles.meta}>
          <span className={styles.metaItem}>가치관 질문 {questionCount}개</span>
          <span className={styles.metaDot}>·</span>
          <span className={styles.metaItem}>
            <ClockIcon width={14} height={14} />
            {formatDuration(questionCount)}
          </span>
          <span className={styles.metaDot}>·</span>
          <span className={styles.metaItem}>{formatCount(animatedCount)}명 참여</span>
        </div>

        {/* ═══ 이렇게 진행돼요 ═══ */}
        <section className={styles.flowCard}>
          <h2 className={styles.flowTitle}>이렇게 진행돼요</h2>
          <ol className={styles.flowSteps}>
            <li className={styles.flowStep}>
              <span className={styles.flowBadge}>1</span>
              <span className={styles.flowText}>가치관 질문 {questionCount}개에 답해요</span>
            </li>
            <li className={styles.flowStep}>
              <span className={styles.flowBadge}>2</span>
              <span className={styles.flowText}>단톡방 친구들에게 링크를 보내요</span>
            </li>
            <li className={styles.flowStep}>
              <span className={styles.flowBadge}>3</span>
              <span className={styles.flowText}>친구들이 풀면 그룹 비교가 열려요</span>
            </li>
          </ol>
        </section>

        {/* ═══ 우리의 케미 프리뷰 ═══ */}
        <div className={styles.comparePreview}>
          <div className={styles.previewHeader}>
            <CompareGroupIcon width={20} height={20} />
            <span className={styles.previewLabel}>우리의 가치관</span>
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
