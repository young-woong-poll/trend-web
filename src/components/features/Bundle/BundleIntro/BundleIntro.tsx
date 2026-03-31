'use client';

import type { FC } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import styles from '@/components/features/Bundle/BundleIntro/BundleIntro.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import { useBundleDetail, useBundleMyResult } from '@/hooks/api/useBundle';
import { formatCount } from '@/lib/utils';

interface BundleIntroProps {
  slug: string;
}

export const BundleIntro: FC<BundleIntroProps> = ({ slug }) => {
  const { data: bundle, isLoading } = useBundleDetail(slug);
  const { data: existingResult } = useBundleMyResult(slug);
  const { isLoggedIn, requireLogin } = useAuth();
  const router = useRouter();

  const hasCompleted = !!existingResult;

  if (isLoading) {
    return (
      <FlexibleLayout>
        <div className={styles.loading}>불러오는 중...</div>
      </FlexibleLayout>
    );
  }

  if (!bundle) {
    return (
      <FlexibleLayout>
        <div className={styles.loading}>번들을 찾을 수 없습니다.</div>
      </FlexibleLayout>
    );
  }

  const handleStart = () => {
    if (!isLoggedIn) {
      requireLogin('default');
      return;
    }
    if (hasCompleted) {
      router.push(`/bundle/${slug}/result`);
    } else {
      router.push(`/bundle/${slug}/play`);
    }
  };

  const ctaText = () => {
    if (bundle.status === 'CLOSED') {
      return '마감된 번들입니다';
    }
    if (hasCompleted) {
      return '결과 보기';
    }
    return '시작하기';
  };

  return (
    <FlexibleLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.category}>{bundle.category}</span>
          <h1 className={styles.title}>{bundle.title}</h1>
          {bundle.subtitle && <p className={styles.subtitle}>{bundle.subtitle}</p>}
        </div>

        {bundle.imageUrl && (
          <div className={styles.heroImage}>
            <Image
              src={bundle.imageUrl}
              alt={bundle.title}
              width={280}
              height={280}
              className={styles.heroImg}
              priority
            />
          </div>
        )}

        <p className={styles.description}>{bundle.description}</p>

        <div className={styles.meta}>
          <span className={styles.metaItem}>{bundle.questionCount}개 질문</span>
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
    </FlexibleLayout>
  );
};
