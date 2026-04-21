'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FC,
} from 'react';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';

import BackIcon from '@/assets/icon/BackIcon';
import QuestionIcon from '@/assets/icon/QuestionIcon';
import { CategoryBadge } from '@/components/common/CategoryBadge/CategoryBadge';
import { Skeleton } from '@/components/common/Skeleton/Skeleton';
import { Toast } from '@/components/common/Toast/Toast';
import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import styles from '@/components/features/Bundle/BundleResult/BundleResult.module.scss';
import { CreateCompareLink } from '@/components/features/Bundle/BundleResult/CreateCompareLink';
import { calcPopularityScore, getPopularityByScore } from '@/constants/bundle';
import { useAuth } from '@/contexts/AuthContext';
import { useBundleDetail, useBundleMyResult } from '@/hooks/api/useBundle';
import { useJoinCompareLink } from '@/hooks/api/useCompare';
import { prefetchMyCompareLinks } from '@/hooks/api/useMyCompareLinks';
import { useToast } from '@/hooks/useToast';
import { trackBundleResultView } from '@/lib/analytics';

interface BundleResultProps {
  slug: string;
}

export const BundleResult: FC<BundleResultProps> = ({ slug }) => {
  const { isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const { data: bundle } = useBundleDetail(slug);
  const { data: result, isLoading } = useBundleMyResult(slug);
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const compareToken =
    searchParams.get('compareToken') ??
    (searchParams.get('from') === 'compare' ? searchParams.get('token') : null);
  const joinMutation = useJoinCompareLink(compareToken ?? '');
  const { toast } = useToast();
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showPopularityInfo, setShowPopularityInfo] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const [activeAnswerIndex, setActiveAnswerIndex] = useState(0);
  const popularityInfoRef = useRef<HTMLDivElement>(null);
  const popularityBtnRef = useRef<HTMLButtonElement>(null);
  const answerScrollerRef = useRef<HTMLDivElement>(null);
  const answerDragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0 });

  // 툴팁 위치를 viewport 기준으로 계산 — stacking context/overflow 영향 받지 않음
  useLayoutEffect(() => {
    if (!showPopularityInfo || !popularityBtnRef.current) {
      setTooltipPos(null);
      return;
    }
    const rect = popularityBtnRef.current.getBoundingClientRect();
    const tooltipWidth = 240;
    const margin = 16;
    const viewportWidth = window.innerWidth;

    // 기본: 버튼 우측을 툴팁 우측에 정렬
    let left = rect.right - tooltipWidth;
    if (left < margin) {
      left = margin;
    }
    if (left + tooltipWidth > viewportWidth - margin) {
      left = viewportWidth - tooltipWidth - margin;
    }

    setTooltipPos({ top: rect.bottom + 8, left });
  }, [showPopularityInfo]);

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

  useEffect(() => {
    if (result) {
      trackBundleResultView(slug);
    }
  }, [result, slug]);

  // 비교링크 모달 CLS 방지 — 결과 페이지 진입 시 '참여 중인 링크' 리스트를 미리 받아둠
  useEffect(() => {
    if (!isLoggedIn || !slug) {
      return;
    }
    void prefetchMyCompareLinks(queryClient, slug);
  }, [isLoggedIn, slug, queryClient]);

  // 접근제어: 미완료 → 플레이
  useEffect(() => {
    if (!isLoading && !result && isLoggedIn && !compareToken) {
      router.replace(`/bundle/${slug}/play`);
    }
  }, [isLoading, result, isLoggedIn, slug, router, compareToken]);

  // compare 토큰 자동 join
  useEffect(() => {
    if (!compareToken || !result || joinMutation.isPending || joinMutation.isSuccess) {
      return;
    }

    const autoJoin = async () => {
      try {
        await joinMutation.mutateAsync(undefined);
        router.replace(`/compare/group/${compareToken}`);
      } catch {
        // join 실패 (이미 다른 유저가 참여 등) → 그룹 비교 페이지로 이동
        router.replace(`/compare/group/${compareToken}`);
      }
    };
    void autoJoin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareToken, result]);

  // ─── 답변 swiper 핸들러 (PickASide 패턴 차용) ───
  // early return 위에 배치 — Hooks 호출 순서 보장
  const answersCount = result?.myAnswers?.length ?? 0;

  const handleAnswerScroll = useCallback(() => {
    const el = answerScrollerRef.current;
    if (!el || answersCount === 0) {
      return;
    }
    const cardWidth = el.scrollWidth / answersCount;
    const index = Math.round(el.scrollLeft / cardWidth);
    setActiveAnswerIndex(Math.min(index, answersCount - 1));
  }, [answersCount]);

  const handleAnswerMouseDown = useCallback((e: React.MouseEvent) => {
    const el = answerScrollerRef.current;
    if (!el) {
      return;
    }
    answerDragState.current = {
      isDragging: true,
      startX: e.pageX,
      scrollLeft: el.scrollLeft,
    };
    el.style.scrollSnapType = 'none';
    el.style.scrollBehavior = 'auto';
    el.style.cursor = 'grabbing';
  }, []);

  const handleAnswerMouseMove = useCallback((e: React.MouseEvent) => {
    if (!answerDragState.current.isDragging) {
      return;
    }
    const el = answerScrollerRef.current;
    if (!el) {
      return;
    }
    e.preventDefault();
    const dx = e.pageX - answerDragState.current.startX;
    el.scrollLeft = answerDragState.current.scrollLeft - dx;
  }, []);

  const handleAnswerMouseUp = useCallback(() => {
    if (!answerDragState.current.isDragging) {
      return;
    }
    answerDragState.current.isDragging = false;
    const el = answerScrollerRef.current;
    if (!el) {
      return;
    }
    el.style.scrollBehavior = 'smooth';
    el.style.scrollSnapType = 'x mandatory';
    el.style.cursor = '';
    const onEnd = () => {
      el.style.scrollBehavior = '';
      el.removeEventListener('scrollend', onEnd);
    };
    el.addEventListener('scrollend', onEnd);
    setTimeout(() => {
      el.style.scrollBehavior = '';
      el.removeEventListener('scrollend', onEnd);
    }, 400);
  }, []);

  if (isAuthLoading || isLoading) {
    return (
      <BundleBackground categoryCode={bundle?.categoryCode} categoryMeta={bundle?.categoryMeta}>
        <div className={styles.container}>
          <Skeleton variant="dark" width={160} height={60} borderRadius={9999} />
          <Skeleton variant="dark" width="100%" height={240} borderRadius={20} />
        </div>
      </BundleBackground>
    );
  }

  if (!result) {
    return (
      <BundleBackground categoryCode={bundle?.categoryCode} categoryMeta={bundle?.categoryMeta}>
        <div className={styles.container}>
          <Skeleton variant="dark" width={160} height={60} borderRadius={9999} />
          <Skeleton variant="dark" width="100%" height={240} borderRadius={20} />
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

        {/* ═══ 1. 카테고리 + 번들 제목 (작게) ═══ */}
        <div className={styles.resultHeader}>
          <CategoryBadge
            categoryCode={bundle?.categoryCode}
            categoryMeta={bundle?.categoryMeta}
            label={bundle?.category}
          />
          <h2 className={styles.resultTitle}>{result.bundleTitle}</h2>
        </div>

        {/* ═══ 2. 압축 결과 1줄 ═══ */}
        <div className={styles.resultLine} role="status" aria-label="내 결과 요약">
          <div className={styles.resultAvatar}>
            {popularity.imagePath ? (
              <Image
                src={popularity.imagePath}
                alt={popularity.title}
                width={120}
                height={120}
                className={styles.resultAvatarImg}
              />
            ) : (
              <span className={styles.resultAvatarFallback}>{popularity.grade[0]}</span>
            )}
          </div>
          <div className={styles.resultText}>
            <div className={styles.resultTextTitleRow}>
              <span className={styles.resultTextLead}>당신의 성향은</span>
              <span className={styles.resultTextStrong}>{popularity.title}</span>
            </div>
            <div className={styles.resultTextMeaningRow}>
              <span className={styles.resultTextMeaning}>{popularity.description}</span>
              <div className={styles.scoreHelpWrap}>
                <button
                  ref={popularityBtnRef}
                  type="button"
                  className={styles.scoreHelp}
                  onClick={() => setShowPopularityInfo((v) => !v)}
                  aria-label="대중성 지수 설명"
                >
                  <QuestionIcon width={12} height={12} />
                </button>
                {showPopularityInfo &&
                  tooltipPos &&
                  typeof document !== 'undefined' &&
                  createPortal(
                    <div
                      ref={popularityInfoRef}
                      className={styles.popularityTooltip}
                      style={{ top: tooltipPos.top, left: tooltipPos.left }}
                      role="tooltip"
                    >
                      <span className={styles.tooltipTitle}>대중성 지수란?</span>
                      <span className={styles.tooltipBody}>
                        {result.totalQuestions ?? myAnswers.length}개 질문에서 내가 고른 선택지의
                        득표율 평균이에요. 지금 내 대중성 지수는 {popularityScore}%, 높을수록 다수와
                        비슷하고 낮을수록 독자적인 가치관이에요.
                      </span>
                    </div>,
                    document.body
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ 3. 비교 게이트 메인 영역 (결과 1줄 직후 — fold 안 CTA 노출) ═══ */}
        <section className={styles.gateSection} aria-label="친구들과 비교하기">
          <h1 className={styles.gateHeadline}>이제 진짜 시작이에요</h1>
          <p className={styles.gateSubtitle}>다른 친구들과 가치관을 비교하세요</p>

          <div className={styles.gateVisual} aria-hidden="true">
            <svg
              viewBox="0 0 280 160"
              width="100%"
              height="100%"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
            >
              <defs>
                <linearGradient id="bundleResultCenterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff00ff" />
                  <stop offset="100%" stopColor="#ff4500" />
                </linearGradient>
              </defs>

              <g stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3 4" fill="none">
                <line x1="140" y1="80" x2="40" y2="40" />
                <line x1="140" y1="80" x2="240" y2="40" />
                <line x1="140" y1="80" x2="40" y2="120" />
                <line x1="140" y1="80" x2="240" y2="120" />
              </g>

              <g>
                {[
                  [40, 40],
                  [240, 40],
                  [40, 120],
                  [240, 120],
                ].map(([cx, cy]) => (
                  <g key={`${cx}-${cy}`}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r="16"
                      fill="rgba(255,255,255,0.04)"
                      stroke="rgba(255,255,255,0.18)"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={cx}
                      y={cy + 4}
                      textAnchor="middle"
                      fontSize="14"
                      fill="rgba(255,255,255,0.4)"
                      fontWeight="600"
                    >
                      ?
                    </text>
                  </g>
                ))}
              </g>

              <circle cx="140" cy="80" r="26" fill="url(#bundleResultCenterGrad)" opacity="0.95" />
              <circle
                cx="140"
                cy="80"
                r="26"
                fill="none"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="1"
              />
              <g transform="translate(140 80)" stroke="#ffffff" strokeWidth="1.6" fill="none">
                <rect x="-7" y="-2" width="14" height="11" rx="2" fill="#ffffff" stroke="none" />
                <path d="M -4 -2 V -5 a 4 4 0 0 1 8 0 V -2" />
              </g>
            </svg>
          </div>

          <button type="button" className={styles.gateCta} onClick={() => setShowGroupModal(true)}>
            친구들과 가치관 비교하기
          </button>
        </section>

        {/* ═══ 4. 답변 미리보기 — swiper (게이트 다음, 결과 디테일) ═══ */}
        {myAnswers.length > 0 && (
          <div className={styles.answerSection}>
            <div className={styles.answerSectionHeader}>
              <span className={styles.answerSectionTitle}>
                내 답변 {result.totalQuestions ?? myAnswers.length}개
              </span>
            </div>

            <div
              ref={answerScrollerRef}
              className={styles.answerScroller}
              onScroll={handleAnswerScroll}
              onMouseDown={handleAnswerMouseDown}
              onMouseMove={handleAnswerMouseMove}
              onMouseUp={handleAnswerMouseUp}
              onMouseLeave={handleAnswerMouseUp}
            >
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
                  <div key={answer.electionId} className={styles.answerCard}>
                    <div className={styles.answerHeader}>
                      <div>
                        <div className={styles.questionIndex}>Q{idx + 1}</div>
                        <span className={styles.answerQuestion}>{answer.title}</span>
                      </div>
                      <span
                        className={`${styles.answerBadge} ${
                          isMajority ? styles.majorityBadge : styles.minorityBadge
                        }`}
                      >
                        {isMajority ? '다수파' : '소수파'}
                      </span>
                    </div>

                    <div className={styles.voteOptions}>
                      {(answer.options ?? []).map((opt) => {
                        const optStat = options.find(
                          (o) => o.electionItemId === opt.electionItemId
                        );
                        const rate =
                          totalVotes > 0
                            ? Math.round(((optStat?.voteCount ?? 0) / totalVotes) * 100)
                            : 50;
                        const isSelected = opt.electionItemId === answer.selectedElectionItemId;
                        return (
                          <div key={opt.electionItemId} className={styles.optionRow}>
                            <span
                              className={`${styles.optionLabel} ${
                                isSelected ? styles.optionLabelSelected : ''
                              }`}
                            >
                              {opt.title}
                            </span>
                            <div className={styles.optionBarTrack}>
                              <div
                                className={`${styles.optionBarFill} ${
                                  isSelected ? styles.myFill : ''
                                }`}
                                style={{ width: `${rate}%` } as CSSProperties}
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

            {myAnswers.length > 1 && (
              <div className={styles.dots}>
                {myAnswers.map((answer, i) => (
                  <div
                    key={answer.electionId}
                    className={`${styles.dot} ${i === activeAnswerIndex ? styles.dotActive : ''}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Toast message={toast.message} isVisible={toast.isVisible} />
      {showGroupModal && (
        <CreateCompareLink
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
