'use client';

import { useEffect, type FC } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import styles from '@/components/features/Bundle/BundleResult/BundleResult.module.scss';
import { calcPopularityScore, getPopularityByScore } from '@/constants/bundle';
import { useAuth } from '@/contexts/AuthContext';
import { useBundleMyResult } from '@/hooks/api/useBundle';

interface BundleResultProps {
  slug: string;
}

export const BundleResult: FC<BundleResultProps> = ({ slug }) => {
  const { isLoggedIn } = useAuth();
  const { data: result, isLoading } = useBundleMyResult(slug);
  const router = useRouter();

  // Auth guard: 미로그인 시 인트로로 리다이렉트
  useEffect(() => {
    if (!isLoggedIn) {
      router.replace(`/bundle/${slug}`);
    }
  }, [isLoggedIn, slug, router]);

  if (isLoading) {
    return (
      <FlexibleLayout>
        <div className={styles.loading}>결과를 불러오는 중...</div>
      </FlexibleLayout>
    );
  }

  if (!result) {
    return (
      <FlexibleLayout>
        <div className={styles.loading}>
          아직 번들을 풀지 않았어요.
          <button
            type="button"
            className={styles.ctaButton}
            style={{ marginTop: 16, maxWidth: 200 }}
            onClick={() => router.push(`/bundle/${slug}/play`)}
          >
            풀러 가기
          </button>
        </div>
      </FlexibleLayout>
    );
  }

  const popularityScore = calcPopularityScore(result.myAnswers, result.questionStats);
  const popularity = getPopularityByScore(popularityScore);

  return (
    <FlexibleLayout>
      <div className={styles.container}>
        {/* 대중성 카드 */}
        <div className={styles.popularityCard}>
          {/* 3D 캐릭터 이미지 — 에셋 준비 전 등급 이니셜 placeholder */}
          {popularity.imagePath ? (
            <Image
              src={popularity.imagePath}
              alt={popularity.title}
              width={120}
              height={120}
              className={styles.characterImage}
            />
          ) : (
            <div
              className={styles.characterPlaceholder}
              style={{ background: 'linear-gradient(135deg, #ff00ff, #ff4500)' }}
            >
              {popularity.grade[0]}
            </div>
          )}
          <div className={styles.popularityScore}>{popularityScore}%</div>
          <div className={styles.popularityTitle}>{popularity.title}</div>
          <div className={styles.popularityDescription}>{popularity.description}</div>
        </div>

        {/* 내 답변 요약 */}
        <div>
          <h3 className={styles.sectionTitle}>내 답변 ({result.totalQuestions}개)</h3>
          <div className={styles.answerList}>
            {result.myAnswers.map((answer) => {
              const stat = result.questionStats.find((s) => s.electionId === answer.electionId);
              const myRate =
                answer.selected === 'A' ? (stat?.optionARate ?? 50) : (stat?.optionBRate ?? 50);
              const isMajority = myRate >= 50;

              return (
                <div key={answer.electionId} className={styles.answerItem}>
                  <span className={styles.answerQuestion}>{answer.title}</span>
                  <span className={styles.answerChoice}>
                    {answer.selected === 'A' ? answer.optionA : answer.optionB}
                  </span>
                  <span
                    className={`${styles.answerStat} ${isMajority ? styles.majorityBadge : styles.minorityBadge}`}
                  >
                    {myRate}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA — 비교 버튼은 Plan 2에서 추가 */}
        <div className={styles.ctaSection}>
          <button type="button" className={styles.secondaryCta} onClick={() => router.push('/')}>
            메인으로 돌아가기
          </button>
        </div>
      </div>
    </FlexibleLayout>
  );
};
