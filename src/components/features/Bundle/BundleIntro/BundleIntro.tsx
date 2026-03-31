'use client';

import type { FC } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import styles from '@/components/features/Bundle/BundleIntro/BundleIntro.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import { useBundleDetail } from '@/hooks/api/useBundle';
import { formatCount } from '@/lib/utils';

interface BundleIntroProps {
  slug: string;
}

export const BundleIntro: FC<BundleIntroProps> = ({ slug }) => {
  const { data: bundle, isLoading } = useBundleDetail(slug);
  const { isLoggedIn, requireLogin } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <BundleBackground>
        <div className={styles.loading}>불러오는 중...</div>
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

  const handleStart = () => {
    if (!isLoggedIn) {
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
    <BundleBackground fireworks>
      <div className={styles.container}>
        <div className={styles.heroImage}>
          {bundle.imageUrl ? (
            <Image
              src={bundle.imageUrl}
              alt={bundle.title}
              fill
              className={styles.heroImg}
              priority
            />
          ) : (
            <div className={styles.heroPlaceholder} />
          )}
        </div>

        <div className={styles.header}>
          <span className={styles.category}>{bundle.category}</span>
          <h1 className={styles.title}>{bundle.title}</h1>
          {bundle.subtitle && <p className={styles.subtitle}>{bundle.subtitle}</p>}
        </div>

        <div className={styles.meta}>
          <span className={styles.metaItem}>질문 {bundle.questionCount}개</span>
          <span className={styles.metaDot}>·</span>
          <span className={styles.metaItem}>{formatCount(bundle.participantCount)}명 참여</span>
        </div>

        <div className={styles.ctaArea}>
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
      </div>
    </BundleBackground>
  );
};
