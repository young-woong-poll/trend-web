'use client';

import { useEffect, useState, type FC } from 'react';

import { useRouter } from 'next/navigation';

import { Skeleton } from '@/components/common/Skeleton/Skeleton';
import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import { CreateCompareLink } from '@/components/features/Bundle/BundleResult/CreateCompareLink';
import { AnswerComparison } from '@/components/features/Compare/CompareResult/AnswerComparison';
import { ChemistryCard } from '@/components/features/Compare/CompareResult/ChemistryCard';
import styles from '@/components/features/Compare/CompareResult/CompareResult.module.scss';
import { PopularityCompare } from '@/components/features/Compare/CompareResult/PopularityCompare';
import { ShockPoint } from '@/components/features/Compare/CompareResult/ShockPoint';
import { calcPopularityScore, getPopularityByScore } from '@/constants/bundle';
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

  useEffect(() => {
    if (!isAuthLoading && !isLoggedIn) {
      router.replace(`/compare/${token}`);
    }
  }, [isAuthLoading, isLoggedIn, token, router]);

  if (isLoading) {
    return (
      <BundleBackground>
        <div className={styles.container}>
          <Skeleton variant="dark" width={148} height={148} borderRadius="50%" />
          <Skeleton variant="dark" width="100%" height={200} borderRadius={12} />
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
  const myPopularityScore = calcPopularityScore(result.me.answers, result.questionStats);
  const targetPopularityScore = calcPopularityScore(result.target.answers, result.questionStats);
  const myPopularity = getPopularityByScore(myPopularityScore);
  const targetPopularity = getPopularityByScore(targetPopularityScore);

  return (
    <BundleBackground>
      <div className={styles.container}>
        {/* 케미 카드 */}
        <ChemistryCard
          matchRate={result.matchRate}
          matchCount={result.matchCount}
          totalQuestions={result.totalQuestions}
          myNickname={result.me.nickname}
          targetNickname={result.target.nickname}
          bundleTitle={result.bundleTitle}
          myPopularityScore={myPopularityScore}
          targetPopularityScore={targetPopularityScore}
          myPopularity={myPopularity}
          targetPopularity={targetPopularity}
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

        {/* CTA — 바이럴 루프 */}
        <div className={styles.ctaSection}>
          <button
            type="button"
            className={styles.ctaButton}
            onClick={() => setShowCompareModal(true)}
          >
            다른 친구와도 비교해볼래?
          </button>
          <button
            type="button"
            className={styles.secondaryCta}
            onClick={() =>
              router.push(`/bundle/${result.bundleSlug}/result?from=compare&token=${token}`)
            }
          >
            내 결과 다시 보기
          </button>
          <button type="button" className={styles.secondaryCta} onClick={() => router.push('/')}>
            메인으로 돌아가기
          </button>
        </div>
      </div>

      {showCompareModal && (
        <CreateCompareLink slug={result.bundleSlug} onClose={() => setShowCompareModal(false)} />
      )}
    </BundleBackground>
  );
};
