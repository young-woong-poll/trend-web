'use client';

import { useEffect, useState, type FC } from 'react';

import { useRouter } from 'next/navigation';

import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import { CreateCompareLink } from '@/components/features/Bundle/BundleResult/CreateCompareLink';
import { CreateGroupLink } from '@/components/features/Bundle/BundleResult/CreateGroupLink';
import { AnswerComparison } from '@/components/features/Compare/CompareResult/AnswerComparison';
import { ChemistryCard } from '@/components/features/Compare/CompareResult/ChemistryCard';
import styles from '@/components/features/Compare/CompareResult/CompareResult.module.scss';
import { PopularityCompare } from '@/components/features/Compare/CompareResult/PopularityCompare';
import { ShockPoint } from '@/components/features/Compare/CompareResult/ShockPoint';
import { classifyAnswers, findShockPoint } from '@/constants/compare';
import { useAuth } from '@/contexts/AuthContext';
import { useCompareResult } from '@/hooks/api/useCompare';

interface CompareResultProps {
  token: string;
}

export const CompareResult: FC<CompareResultProps> = ({ token }) => {
  const { isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const { data: result, isLoading } = useCompareResult(token);
  const router = useRouter();
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !isLoggedIn) {
      router.replace(
        `/compare/${token}?login=true&returnUrl=${encodeURIComponent(`/compare/match/${token}`)}`
      );
    }
  }, [isAuthLoading, isLoggedIn, token, router]);

  if (isLoading) {
    return (
      <BundleBackground>
        <div className={styles.loading}>
          <div className={styles.loadingOrbit}>
            {[0, 1].map((i) => (
              <div
                key={i}
                className={styles.loadingDot}
                style={{ '--i': i } as React.CSSProperties}
              />
            ))}
            <div className={styles.loadingCenter} />
          </div>
          <div className={styles.loadingTextGroup}>
            <p className={styles.loadingTitle}>둘의 케미를 분석하고 있어요</p>
            <p className={styles.loadingSubtitle}>답변을 비교 중...</p>
          </div>
        </div>
      </BundleBackground>
    );
  }

  if (!result) {
    return (
      <BundleBackground>
        <div className={styles.loading}>
          비교 결과를 찾을 수 없습니다.
          <button
            type="button"
            className={styles.ctaButton}
            style={{ maxWidth: 200 }}
            onClick={() => router.push('/')}
          >
            메인으로
          </button>
        </div>
      </BundleBackground>
    );
  }

  const shockPoint = findShockPoint(result);
  const storyData = classifyAnswers(result);

  return (
    <BundleBackground>
      <div className={styles.container}>
        {/* 케미 카드 */}
        <ChemistryCard
          matchRate={result.matchRate}
          myNickname={result.me.nickname}
          targetNickname={result.target.nickname}
          bundleTitle={result.bundleTitle}
        />

        {/* 같은 편/갈린 순간 */}
        <AnswerComparison
          data={storyData}
          myNickname={result.me.nickname}
          targetNickname={result.target.nickname}
        />

        {/* 충격 포인트 */}
        {shockPoint && (
          <ShockPoint
            data={shockPoint}
            myNickname={result.me.nickname}
            targetNickname={result.target.nickname}
          />
        )}

        {/* 대중성 비교 */}
        <PopularityCompare result={result} />
      </div>

      <div className={styles.floatingCta}>
        <div className={styles.floatingCtaRow}>
          <button
            type="button"
            className={styles.ctaOneToOne}
            onClick={() => setShowCompareModal(true)}
          >
            다른 친구랑 비교하기
          </button>
          <button type="button" className={styles.ctaGroup} onClick={() => setShowGroupModal(true)}>
            그룹 비교하기
          </button>
        </div>
      </div>

      {showCompareModal && (
        <CreateCompareLink slug={result.bundleSlug} onClose={() => setShowCompareModal(false)} />
      )}
      {showGroupModal && (
        <CreateGroupLink slug={result.bundleSlug} onClose={() => setShowGroupModal(false)} />
      )}
    </BundleBackground>
  );
};
