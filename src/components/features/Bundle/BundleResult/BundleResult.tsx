'use client';

import { useEffect, useState, type FC } from 'react';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

import BackIcon from '@/assets/icon/BackIcon';
import QuestionIcon from '@/assets/icon/QuestionIcon';
import { Skeleton } from '@/components/common/Skeleton/Skeleton';
import { Toast } from '@/components/common/Toast/Toast';
import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import styles from '@/components/features/Bundle/BundleResult/BundleResult.module.scss';
import { CreateCompareLink } from '@/components/features/Bundle/BundleResult/CreateCompareLink';
import { calcPopularityScore, getPopularityByScore } from '@/constants/bundle';
import { useAuth } from '@/contexts/AuthContext';
import { useBundleMyResult } from '@/hooks/api/useBundle';
import { useJoinCompareLink } from '@/hooks/api/useCompare';
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
  const searchParams = useSearchParams();
  const compareToken =
    searchParams.get('compareToken') ??
    (searchParams.get('from') === 'compare' ? searchParams.get('token') : null);
  const joinMutation = useJoinCompareLink(compareToken ?? '');
  const { toast, showToast } = useToast();
  const [showCompareModal, setShowCompareModal] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !isLoggedIn) {
      router.replace(`/bundle/${slug}`);
    }
  }, [isAuthLoading, isLoggedIn, slug, router]);

  // compare 토큰이 있고 결과가 로드되면 → 자동 join → compare result로 이동
  useEffect(() => {
    if (!compareToken || !result || joinMutation.isPending || joinMutation.isSuccess) {
      return;
    }

    const autoJoin = async () => {
      try {
        await joinMutation.mutateAsync();
      } catch {
        // join 실패해도 (이미 참여 등) compare result로 이동 시도
      }
      router.replace(`/compare/${compareToken}/result`);
    };
    void autoJoin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareToken, result]);

  if (isLoading) {
    return (
      <BundleBackground>
        <div className={styles.container}>
          <Skeleton variant="dark" width={160} height={160} borderRadius="50%" />
          <Skeleton variant="dark" width="100%" height={100} borderRadius={12} />
        </div>
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
        {compareToken && (
          <button
            type="button"
            className={styles.backButton}
            onClick={() => router.push(`/compare/${compareToken}/result`)}
            aria-label="비교 결과로 돌아가기"
          >
            <BackIcon width={22} height={22} />
          </button>
        )}

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
                        className={`${styles.optionLabel} ${answer.selected === 'A' ? styles.optionLabelSelected : ''}`}
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
                        className={`${styles.optionLabel} ${answer.selected === 'B' ? styles.optionLabelSelected : ''}`}
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

        {/* ═══ 하단 여백 (플로팅 CTA 공간 확보) ═══ */}
        {/* <div className={styles.ctaSection}>
          <button type="button" className={styles.secondaryCta} onClick={() => router.push('/')}>
            메인으로 돌아가기
          </button>
        </div> */}
      </div>

      {/* ═══ 플로팅 CTA — 핵심 바이럴 버튼 ═══ */}
      <div className={styles.floatingCta}>
        <button
          type="button"
          className={styles.floatingCtaButton}
          onClick={() => setShowCompareModal(true)}
        >
          친구와 가치관 비교하기
        </button>
      </div>

      <Toast message={toast.message} isVisible={toast.isVisible} />
      {showCompareModal && (
        <CreateCompareLink slug={slug} onClose={() => setShowCompareModal(false)} />
      )}
    </BundleBackground>
  );
};
