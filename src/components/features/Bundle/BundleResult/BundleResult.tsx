'use client';

import { useEffect, type FC } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import QuestionIcon from '@/assets/icon/QuestionIcon';
import { Toast } from '@/components/common/Toast/Toast';
import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import styles from '@/components/features/Bundle/BundleResult/BundleResult.module.scss';
import { calcPopularityScore, getPopularityByScore } from '@/constants/bundle';
import { useAuth } from '@/contexts/AuthContext';
import { useBundleMyResult } from '@/hooks/api/useBundle';
import { useToast } from '@/hooks/useToast';

interface BundleResultProps {
  slug: string;
}

/** 등급 → 그라디언트 색상 쌍 */
function getGradeColors(grade: string): [string, string] {
  const map: Record<string, [string, string]> = {
    KING: ['#FFD700', '#FFA500'],
    LEADER: ['#FF00FF', '#8B5CF6'],
    BALANCER: ['#FF6B35', '#FF00FF'],
    REBEL: ['#4FC3F7', '#00BCD4'],
    UNICORN: ['#66BB6A', '#00BCD4'],
  };
  return map[grade] ?? map.BALANCER;
}

export const BundleResult: FC<BundleResultProps> = ({ slug }) => {
  const { isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const { data: result, isLoading } = useBundleMyResult(slug);
  const router = useRouter();
  const { toast, showToast } = useToast();

  useEffect(() => {
    if (!isAuthLoading && !isLoggedIn) {
      router.replace(`/bundle/${slug}`);
    }
  }, [isAuthLoading, isLoggedIn, slug, router]);

  if (isLoading) {
    return (
      <BundleBackground>
        <div className={styles.loading}>결과를 불러오는 중...</div>
      </BundleBackground>
    );
  }

  if (!result) {
    return (
      <BundleBackground>
        <div className={styles.loading}>
          아직 번들을 풀지 않았어요.
          <button
            type="button"
            className={styles.ctaButton}
            style={{ maxWidth: 200 }}
            onClick={() => router.push(`/bundle/${slug}/play`)}
          >
            풀러 가기
          </button>
        </div>
      </BundleBackground>
    );
  }

  const popularityScore = calcPopularityScore(result.myAnswers, result.questionStats);
  const popularity = getPopularityByScore(popularityScore);
  const [color1, color2] = getGradeColors(popularity.grade);

  return (
    <BundleBackground>
      <div className={styles.container}>
        {/* ═══ 대중성 히어로 ═══ */}
        <div className={styles.popularityCard}>
          <div
            className={styles.gradeRing}
            style={
              {
                '--grade-color-1': color1,
                '--grade-color-2': color2,
              } as React.CSSProperties
            }
          >
            <div className={styles.gradeInner}>
              {popularity.imagePath ? (
                <Image
                  src={popularity.imagePath}
                  alt={popularity.title}
                  width={220}
                  height={220}
                  className={styles.characterImage}
                />
              ) : (
                <span className={styles.gradeLetter}>{popularity.grade[0]}</span>
              )}
            </div>
          </div>

          <div className={styles.scoreArea}>
            <div className={styles.scoreLabelRow}>
              <span className={styles.scoreLabel}>대중성 지수</span>
              <button
                type="button"
                className={styles.scoreHelp}
                onClick={() =>
                  showToast(
                    `${result.totalQuestions}개 질문에서 내가 고른 선택지의 득표율 평균이에요`
                  )
                }
                aria-label="대중성 지수 설명"
              >
                <QuestionIcon width={14} height={14} />
              </button>
            </div>
            <div className={styles.scoreRow}>
              <span className={styles.scoreValue}>{popularityScore}</span>
              <span className={styles.scoreUnit}>%</span>
            </div>
          </div>
          <div className={styles.popularityTitle}>{popularity.title}</div>
          <div className={styles.popularityDescription}>{popularity.description}</div>
        </div>

        {/* ═══ 내 답변 ═══ */}
        <div className={styles.answerSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>내 답변 {result.totalQuestions}개</span>
            <div className={styles.sectionLine} />
          </div>

          <div className={styles.answerList}>
            {result.myAnswers.map((answer, idx) => {
              const stat = result.questionStats.find((s) => s.electionId === answer.electionId);
              const aRate = stat?.optionARate ?? 50;
              const bRate = stat?.optionBRate ?? 50;
              const myRate = answer.selected === 'A' ? aRate : bRate;
              const isMajority = myRate >= 50;

              return (
                <div
                  key={answer.electionId}
                  className={styles.answerCard}
                  style={{ '--i': idx } as React.CSSProperties}
                >
                  <div className={styles.answerHeader}>
                    <div>
                      <div className={styles.questionIndex}>Q{idx + 1}</div>
                      <span className={styles.answerQuestion}>{answer.title}</span>
                    </div>
                    <span
                      className={`${styles.answerBadge} ${isMajority ? styles.majorityBadge : styles.minorityBadge}`}
                    >
                      {isMajority ? '다수파' : '소수파'}
                    </span>
                  </div>

                  {/* 분리형 투표 바 */}
                  <div className={styles.voteOptions}>
                    <div className={styles.optionRow}>
                      <button
                        type="button"
                        className={styles.optionLabel}
                        onClick={(e) => {
                          const el = e.currentTarget;
                          if (el.scrollWidth > el.clientWidth) {
                            showToast(answer.optionA);
                          }
                        }}
                      >
                        {answer.optionA}
                      </button>
                      <div className={styles.optionBarTrack}>
                        <div
                          className={`${styles.optionBarFill} ${answer.selected === 'A' ? styles.myFill : ''}`}
                          style={{ width: `${aRate}%`, '--i': idx } as React.CSSProperties}
                        >
                          <span className={styles.optionPercent}>{aRate}%</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.optionRow}>
                      <button
                        type="button"
                        className={styles.optionLabel}
                        onClick={(e) => {
                          const el = e.currentTarget;
                          if (el.scrollWidth > el.clientWidth) {
                            showToast(answer.optionB);
                          }
                        }}
                      >
                        {answer.optionB}
                      </button>
                      <div className={styles.optionBarTrack}>
                        <div
                          className={`${styles.optionBarFill} ${answer.selected === 'B' ? styles.myFill : ''}`}
                          style={{ width: `${bRate}%`, '--i': idx } as React.CSSProperties}
                        >
                          <span className={styles.optionPercent}>{bRate}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ CTA ═══ */}
        <div className={styles.ctaSection}>
          <button type="button" className={styles.secondaryCta} onClick={() => router.push('/')}>
            메인으로 돌아가기
          </button>
        </div>
      </div>
      <Toast message={toast.message} isVisible={toast.isVisible} />
    </BundleBackground>
  );
};
