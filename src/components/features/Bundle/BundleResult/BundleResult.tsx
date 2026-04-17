'use client';

import { useEffect, useRef, useState, type FC } from 'react';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

import BackIcon from '@/assets/icon/BackIcon';
import QuestionIcon from '@/assets/icon/QuestionIcon';
import { CategoryBadge } from '@/components/common/CategoryBadge/CategoryBadge';
import { Skeleton } from '@/components/common/Skeleton/Skeleton';
import { Toast } from '@/components/common/Toast/Toast';
import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import styles from '@/components/features/Bundle/BundleResult/BundleResult.module.scss';
import { CreateCompareLink } from '@/components/features/Bundle/BundleResult/CreateCompareLink';
import { CreateGroupLink } from '@/components/features/Bundle/BundleResult/CreateGroupLink';
import { calcPopularityScore, getPopularityByScore } from '@/constants/bundle';
import { useAuth } from '@/contexts/AuthContext';
import { useBundleDetail, useBundleMyResult } from '@/hooks/api/useBundle';
import { useJoinCompareLink } from '@/hooks/api/useCompare';
import { useToast } from '@/hooks/useToast';
import { trackBundleResultView } from '@/lib/analytics';

interface BundleResultProps {
  slug: string;
}

export const BundleResult: FC<BundleResultProps> = ({ slug }) => {
  const { isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const { data: bundle } = useBundleDetail(slug);
  const { data: result, isLoading } = useBundleMyResult(slug);
  const router = useRouter();
  const searchParams = useSearchParams();
  const compareToken =
    searchParams.get('compareToken') ??
    (searchParams.get('from') === 'compare' ? searchParams.get('token') : null);
  const joinMutation = useJoinCompareLink(compareToken ?? '');
  const { toast, showToast } = useToast();
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showPopularityInfo, setShowPopularityInfo] = useState(false);
  const popularityInfoRef = useRef<HTMLDivElement>(null);
  const popularityBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showPopularityInfo) {
      return;
    }
    const handleOutside = (e: MouseEvent) => {
      if (popularityBtnRef.current?.contains(e.target as Node)) {
        return;
      }
      if (popularityInfoRef.current?.contains(e.target as Node)) {
        return;
      }
      setShowPopularityInfo(false);
    };
    const handleScroll = () => setShowPopularityInfo(false);
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showPopularityInfo]);

  // GA4: 번들 결과 조회
  useEffect(() => {
    if (result) {
      trackBundleResultView(slug);
    }
  }, [result, slug]);

  // 접근제어: 미완료 → 플레이 (로그인/회원가입 후 바로 플레이로 이동)
  useEffect(() => {
    if (!isLoading && !result && isLoggedIn && !compareToken) {
      router.replace(`/bundle/${slug}/play`);
    }
  }, [isLoading, result, isLoggedIn, slug, router, compareToken]);

  // compare 토큰이 있고 결과가 로드되면 → 자동 join → compare result로 이동
  useEffect(() => {
    if (!compareToken || !result || joinMutation.isPending || joinMutation.isSuccess) {
      return;
    }

    const autoJoin = async () => {
      try {
        await joinMutation.mutateAsync(undefined);
        router.replace(`/compare/match/${compareToken}`);
      } catch {
        // join 실패 (이미 다른 유저가 참여 등) → 랜딩 페이지로 이동 (isAlreadyTaken 안내)
        router.replace(`/compare/${compareToken}`);
      }
    };
    void autoJoin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareToken, result]);

  if (isAuthLoading || isLoading) {
    return (
      <BundleBackground categoryCode={bundle?.categoryCode} categoryMeta={bundle?.categoryMeta}>
        <div className={styles.container}>
          <Skeleton variant="dark" width={160} height={160} borderRadius="50%" />
          <Skeleton variant="dark" width="100%" height={100} borderRadius={12} />
        </div>
      </BundleBackground>
    );
  }

  if (!result) {
    // 리다이렉트 대기 중 로딩 표시
    return (
      <BundleBackground categoryCode={bundle?.categoryCode} categoryMeta={bundle?.categoryMeta}>
        <div className={styles.container}>
          <Skeleton variant="dark" width={160} height={160} borderRadius="50%" />
          <Skeleton variant="dark" width="100%" height={100} borderRadius={12} />
        </div>
      </BundleBackground>
    );
  }

  const myAnswers = result.myAnswers ?? [];
  const questionStats = result.questionStats ?? [];
  const popularityScore = calcPopularityScore(myAnswers, questionStats);
  const popularity = getPopularityByScore(popularityScore);

  return (
    <BundleBackground categoryCode={bundle?.categoryCode} categoryMeta={bundle?.categoryMeta}>
      <div className={styles.container}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => router.back()}
          aria-label="뒤로 가기"
        >
          <BackIcon width={22} height={22} />
        </button>

        {/* ═══ 번들 카테고리 + 제목 ═══ */}
        <div className={styles.resultHeader}>
          <CategoryBadge
            categoryCode={bundle?.categoryCode}
            categoryMeta={bundle?.categoryMeta}
            label={bundle?.category}
          />
          <h2 className={styles.resultTitle}>{result.bundleTitle}</h2>
        </div>

        {/* ═══ 대중성 히어로 ═══ */}
        <div className={styles.popularityCard}>
          <div className={styles.gradeRing}>
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
              <div className={styles.scoreHelpWrap}>
                <button
                  ref={popularityBtnRef}
                  type="button"
                  className={styles.scoreHelp}
                  onClick={() => setShowPopularityInfo((v) => !v)}
                  aria-label="대중성 지수 설명"
                >
                  <QuestionIcon width={14} height={14} />
                </button>
                {showPopularityInfo && (
                  <div ref={popularityInfoRef} className={styles.popularityTooltip}>
                    <span className={styles.tooltipTitle}>대중성 지수란?</span>
                    <span className={styles.tooltipBody}>
                      {result.totalQuestions ?? myAnswers.length}개 질문에서 내가 고른 선택지의
                      득표율 평균이에요. 높을수록 다수의 선택과 비슷하고, 낮을수록 독자적인 가치관을
                      가진 타입이에요.
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.scoreRow}>
              <span className={styles.scoreValue}>{popularityScore}</span>
              <span className={styles.scoreUnit}>%</span>
            </div>
          </div>
          <div className={styles.popularityTitle}>{popularity.title}</div>
          <div className={styles.popularityDescription}>{popularity.description}</div>
          <span className={styles.participantHint}>
            * 현재{' '}
            {questionStats[0]?.optionStats
              ? questionStats[0].optionStats.reduce((sum, o) => sum + (o.voteCount ?? 0), 0)
              : 0}
            명 참여 기준 · 참여자가 늘면 업데이트 돼요
          </span>
        </div>

        {/* ═══ 내 답변 ═══ */}
        <div className={styles.answerSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              내 답변 {result.totalQuestions ?? myAnswers.length}개
            </span>
            <div className={styles.sectionLine} />
          </div>

          <div className={styles.answerList}>
            {myAnswers.map((answer, idx) => {
              const stat = questionStats.find((s) => s.electionId === answer.electionId);
              const options = stat?.optionStats ?? [];
              const totalVotes = options.reduce((sum, o) => sum + (o.voteCount ?? 0), 0);
              const selectedOption = options.find(
                (o) => o.electionItemId === answer.selectedElectionItemId
              );
              const selectedRate =
                totalVotes > 0
                  ? Math.round(((selectedOption?.voteCount ?? 0) / totalVotes) * 100)
                  : 50;
              const isMajority = selectedRate >= 50;

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
                    {(answer.options ?? []).map((opt) => {
                      const optStat = options.find((o) => o.electionItemId === opt.electionItemId);
                      const rate =
                        totalVotes > 0
                          ? Math.round(((optStat?.voteCount ?? 0) / totalVotes) * 100)
                          : 50;
                      const isSelected = opt.electionItemId === answer.selectedElectionItemId;
                      return (
                        <div key={opt.electionItemId} className={styles.optionRow}>
                          <button
                            type="button"
                            className={`${styles.optionLabel} ${isSelected ? styles.optionLabelSelected : ''}`}
                            onClick={(e) => {
                              const el = e.currentTarget;
                              if (el.scrollWidth > el.clientWidth) {
                                showToast(opt.title ?? '');
                              }
                            }}
                          >
                            {opt.title}
                          </button>
                          <div className={styles.optionBarTrack}>
                            <div
                              className={`${styles.optionBarFill} ${isSelected ? styles.myFill : ''}`}
                              style={{ width: `${rate}%`, '--i': idx } as React.CSSProperties}
                            >
                              <span className={styles.optionPercent}>{rate}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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

      {/* ═══ 플로팅 CTA — 비교 버튼 2개 나란히 ═══ */}
      <div className={styles.floatingCta}>
        <div className={styles.floatingCtaRow}>
          <button
            type="button"
            className={styles.ctaOneToOne}
            onClick={() => setShowCompareModal(true)}
          >
            다른 친구랑 케미 보기
          </button>
          <button type="button" className={styles.ctaGroup} onClick={() => setShowGroupModal(true)}>
            그룹 케미 보기
          </button>
        </div>
      </div>

      <Toast message={toast.message} isVisible={toast.isVisible} />
      {showCompareModal && (
        <CreateCompareLink
          slug={slug}
          categoryCode={bundle?.categoryCode}
          categoryMeta={bundle?.categoryMeta}
          category={bundle?.category}
          bundleTitle={bundle?.title}
          onClose={() => setShowCompareModal(false)}
        />
      )}
      {showGroupModal && (
        <CreateGroupLink
          slug={slug}
          categoryCode={bundle?.categoryCode}
          categoryMeta={bundle?.categoryMeta}
          category={bundle?.category}
          bundleTitle={bundle?.title}
          onClose={() => setShowGroupModal(false)}
        />
      )}
    </BundleBackground>
  );
};
