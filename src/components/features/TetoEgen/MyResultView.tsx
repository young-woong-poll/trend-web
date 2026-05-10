'use client';

import { type FC, useEffect, useRef, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import BackIcon from '@/assets/icon/BackIcon';
import DistCard from '@/components/features/TetoEgen/DistCard';
import styles from '@/components/features/TetoEgen/MyResultView.module.scss';
import TetoEgenLoading from '@/components/features/TetoEgen/TetoEgenLoading';
import VoterList from '@/components/features/TetoEgen/VoterList';
import { useAuth } from '@/contexts/AuthContext';
import { useMyTetoEgenLink } from '@/hooks/api/useAskTetoEgen';
import { useToast } from '@/hooks/useToast';
import { trackAskOwnerResultView } from '@/lib/analytics';
import { getBigword, getResultAdjective } from '@/lib/tetoEgenAdjective';
import { getResultColorTokens } from '@/lib/tetoEgenColor';
import { buildFriendShareUrl, type TetoEgenAnswer } from '@/types/ask-teto-egen';

const SPARSE_THRESHOLD = 2;
const COPY_FEEDBACK_MS = 1800;

const labelOf = (a: TetoEgenAnswer) => (a === 'TETO' ? '테토' : '에겐');

const MyResultView: FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, isLoading: isAuthLoading, requireLogin } = useAuth();
  const { toast, showToast } = useToast();
  const shouldReduceMotion = useReducedMotion();

  // 비로그인 → 랜딩 + 로그인 모달
  useEffect(() => {
    if (!isAuthLoading && !isLoggedIn) {
      router.replace('/ask/teto-egen');
      window.setTimeout(() => requireLogin('ask'), 100);
    }
  }, [isAuthLoading, isLoggedIn, requireLogin, router]);

  const { data, isLoading, error } = useMyTetoEgenLink(isLoggedIn);

  // 본인 링크 없음 → 랜딩으로
  useEffect(() => {
    const status = (error as { response?: { status?: number } } | null)?.response?.status;
    if (status === 404) {
      router.replace('/ask/teto-egen');
    }
  }, [error, router]);

  // GA 트래킹 (1회)
  const trackedRef = useRef(false);
  useEffect(() => {
    if (trackedRef.current || !data) {
      return;
    }
    const { tetoCount, egenCount, total } = data.friendVotes;
    let isMajorityMatch = false;
    if (total > 0) {
      if (tetoCount === egenCount) {
        isMajorityMatch = true;
      } else if (tetoCount > egenCount) {
        isMajorityMatch = data.selfAnswer === 'TETO';
      } else {
        isMajorityMatch = data.selfAnswer === 'EGEN';
      }
    }
    trackAskOwnerResultView('teto-egen', total, isMajorityMatch);
    trackedRef.current = true;
  }, [data]);

  // 복사 morphing + 실패 toast (기존 패턴 유지)
  const [isCopied, setIsCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = async () => {
    if (!data) {
      return;
    }
    try {
      await navigator.clipboard.writeText(buildFriendShareUrl(data.token));
      setIsCopied(true);
      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current);
      }
      copiedTimerRef.current = setTimeout(() => setIsCopied(false), COPY_FEEDBACK_MS);
    } catch {
      showToast('복사에 실패했어요');
    }
  };

  useEffect(
    () => () => {
      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current);
      }
    },
    []
  );

  // sticky CTA 동작용 ref/state — 정상 케이스(!isEmpty && !isSparse)에서만 효력.
  // sparse/empty는 Hero 안에서 공유가 완결되므로 sticky 노출 안 함.
  const frameRef = useRef<HTMLDivElement | null>(null);
  const detailRef = useRef<HTMLElement | null>(null);
  const [inDetail, setInDetail] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  const handleStickyScroll = () => {
    detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleScrollToHero = () => {
    frameRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 사용자가 한 번이라도 스크롤하면 sticky 통통 펄스 정지.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) {
      return;
    }
    const onScroll = () => {
      if (el.scrollTop > 4) {
        setHasScrolled(true);
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // detail 50% 노출 시 sticky → inline 전환.
  useEffect(() => {
    const root = frameRef.current;
    const target = detailRef.current;
    if (!root || !target || typeof IntersectionObserver === 'undefined') {
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setInDetail(entry.intersectionRatio >= 0.5);
        }
      },
      { root, threshold: [0, 0.5, 1] }
    );
    obs.observe(target);
    return () => obs.disconnect();
  }, []);

  // friend → my 뒤로가기 복원: ?section=detail이면 마운트 직후 detail 영역으로 즉시 scroll.
  // 데이터 로딩 후에 detailRef가 마운트되므로 data + query 의존.
  // scroll 후 query는 history.replaceState로 제거 → 새로고침/외부 진입 시 hero 복귀가 기본.
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current || !data) {
      return;
    }
    if (searchParams.get('section') !== 'detail') {
      return;
    }
    const target = detailRef.current;
    if (!target) {
      return;
    }
    restoredRef.current = true;
    target.scrollIntoView({ behavior: 'auto', block: 'start' });
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/ask/teto-egen/my');
    }
  }, [data, searchParams]);

  // 친구 클릭으로 friend 이동 직전 — 현재 url에 ?section=detail을 새겨두면
  // friend에서 router.back() 시 history가 그대로 my?section=detail로 복귀.
  const handleVoterLinkClick = () => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/ask/teto-egen/my?section=detail');
    }
  };

  if (isAuthLoading || isLoading || !data) {
    return <TetoEgenLoading />;
  }

  const total = data.friendVotes.total;
  const isEmpty = total === 0;
  const isSparse = total > 0 && total <= SPARSE_THRESHOLD;
  const adj = getResultAdjective(
    data.friendVotes.tetoCount,
    data.friendVotes.egenCount,
    data.selfAnswer
  );
  const colors = getResultColorTokens(adj.result);

  const bigword = getBigword(adj);
  const isPredictionHit = data.selfPrediction === adj.result;

  // 진입 모션 — 위→아래 순차 등장. reduce-motion 시 즉시 표시.
  const heroBigwordMotion = shouldReduceMotion
    ? { initial: { opacity: 1, scale: 1, y: 0 }, animate: { opacity: 1, scale: 1, y: 0 } }
    : {
        initial: { opacity: 0, scale: 0.85, y: 8 },
        animate: { opacity: 1, scale: 1, y: 0 },
      };

  const heroLateMotion = shouldReduceMotion
    ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
    : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };

  const baseTransition = { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const };

  const showScrollUp = !isEmpty && !isSparse && inDetail;

  return (
    <>
      <div className={styles.wrap}>
        {/* frame 외부 sticky back — Hero/Detail 어느 위치에서도 항상 노출 */}
        <button
          type="button"
          className={styles.floatingBack}
          onClick={() => router.back()}
          aria-label="뒤로"
        >
          <BackIcon className={styles.backIcon} />
        </button>

        {/* Detail 진입 시 상단 가운데 fade-in되는 ↑ scroll-up indicator (정상 케이스만) */}
        <AnimatePresence>
          {showScrollUp && (
            <motion.button
              key="scroll-up"
              type="button"
              className={styles.scrollUpIndicator}
              onClick={handleScrollToHero}
              initial={{ opacity: 0, y: -6, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: -6, x: '-50%' }}
              transition={{ duration: 0.25 }}
              aria-label="결과 위로"
            >
              <svg
                className={styles.scrollUpIcon}
                viewBox="0 4 24 16"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden
              >
                <path d="M6 11l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 18l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>

        <div
          ref={frameRef}
          className={styles.frame}
          style={{
            // 결과 색상에 따라 페이지 배경 ambient를 동적으로 설정.
            ['--ambient-primary' as string]: colors.ambient.primary,
            ['--ambient-secondary' as string]: colors.ambient.secondary,
          }}
        >
          <section className={styles.hero}>
            <span className={styles.contextChip}>현재 나의 결과</span>

            <div className={styles.heroMid}>
              {isEmpty ? (
                <motion.h1
                  className={styles.bigwordEmpty}
                  {...heroBigwordMotion}
                  transition={{ ...baseTransition, duration: 0.9, delay: 0.3 }}
                >
                  아직 친구가
                  <br />
                  평가하지 않았어요
                </motion.h1>
              ) : (
                <>
                  {adj.display === 'spaced' && adj.modifier && (
                    <motion.p
                      className={styles.modifier}
                      {...heroLateMotion}
                      transition={{ ...baseTransition, delay: 0.3 }}
                    >
                      {adj.modifier}
                    </motion.p>
                  )}
                  <motion.h1
                    className={styles.bigword}
                    style={{
                      backgroundImage: colors.gradient,
                      textShadow: `0 8px 40px ${colors.glow}`,
                    }}
                    {...heroBigwordMotion}
                    transition={{ ...baseTransition, duration: 0.9, delay: 0.3 }}
                  >
                    {bigword}
                  </motion.h1>
                  <motion.p
                    className={styles.tag}
                    {...heroLateMotion}
                    transition={{ ...baseTransition, delay: 0.6 }}
                  >
                    {isSparse ? (
                      <>
                        <strong>{total}명</strong>만 답함
                      </>
                    ) : (
                      <>
                        <strong>{total}명</strong> 중{' '}
                        <strong>
                          {adj.result === 'TETO'
                            ? data.friendVotes.tetoCount
                            : data.friendVotes.egenCount}
                          명
                        </strong>{' '}
                        동의
                      </>
                    )}
                  </motion.p>
                  {!isSparse && (
                    <motion.dl
                      className={styles.meta}
                      aria-label="예측 결과 비교"
                      {...heroLateMotion}
                      transition={{ ...baseTransition, delay: 0.9 }}
                    >
                      <div className={styles.metaItem}>
                        <dt className={styles.metaLabel}>내 예측</dt>
                        <dd className={styles.metaVal}>{labelOf(data.selfPrediction)}</dd>
                      </div>
                      <span className={styles.metaDivider} aria-hidden />
                      <div className={styles.metaItem}>
                        <dt className={styles.metaLabel}>실제</dt>
                        <dd className={styles.metaVal}>{labelOf(adj.result)}</dd>
                      </div>
                      <span className={styles.metaDivider} aria-hidden />
                      <div className={styles.metaItem}>
                        <dt className={styles.metaLabel}>예상</dt>
                        <dd className={styles.metaVal}>{isPredictionHit ? '적중' : '빗나감'}</dd>
                      </div>
                    </motion.dl>
                  )}
                  {isSparse && (
                    <motion.ul
                      className={styles.sparseVoters}
                      aria-label="답한 친구"
                      {...heroLateMotion}
                      transition={{ ...baseTransition, delay: 0.9 }}
                    >
                      {data.friendVotes.voters.map((v) => (
                        <li key={v.userId} className={styles.sparseVoter}>
                          <span className={styles.sparseVoterName}>{v.displayName}</span>
                          <span
                            className={`${styles.sparseVoterVote} ${
                              v.vote === 'TETO'
                                ? styles.sparseVoterVoteTeto
                                : styles.sparseVoterVoteEgen
                            }`}
                          >
                            {labelOf(v.vote)}
                          </span>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </>
              )}
            </div>

            {/* sparse/empty 케이스: Hero 자체에서 공유 유도 (snap 이동 없이) */}
            {(isEmpty || isSparse) && (
              <div className={styles.heroShare}>
                <p className={styles.heroShareHint}>
                  {isEmpty
                    ? '친구들에게 공유하고 결과를 받아보세요'
                    : '아직 초기 결과예요 — 더 물어보세요'}
                </p>
                <button
                  type="button"
                  className={styles.ctaPrimary}
                  onClick={handleCopy}
                  aria-live="polite"
                >
                  {isCopied ? '복사됐어요!' : '투표 링크 복사하기'}
                </button>
              </div>
            )}
          </section>

          {/* 정상 케이스만 Detail 노출. empty/sparse는 Hero 안에서 공유 완결. */}
          {!isEmpty && !isSparse && (
            <section ref={detailRef} className={styles.detail}>
              <DistCard
                tetoCount={data.friendVotes.tetoCount}
                egenCount={data.friendVotes.egenCount}
              />
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>참여한 친구들</h2>
                <span className={styles.sectionCount}>
                  <strong>{total}</strong>명
                </span>
              </div>
              <p className={styles.sectionHint}>눌러서 친구 결과도 구경하기</p>
              <VoterList
                voters={data.friendVotes.voters}
                enableProfileLink
                onProfileLinkClick={handleVoterLinkClick}
              />
              <div className={styles.detailCta}>
                <AnimatePresence>
                  {inDetail && (
                    <motion.div
                      key="inline-cta"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <button
                        type="button"
                        className={styles.ctaPrimary}
                        onClick={handleCopy}
                        aria-live="polite"
                      >
                        {isCopied ? '복사됐어요!' : '투표 링크 복사하기'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>
          )}
        </div>

        {/* 정상 케이스만 sticky 노출. sparse/empty는 Hero에서 공유 완결되므로 sticky 불필요. */}
        {!isEmpty && !isSparse && (
          <AnimatePresence>
            {!inDetail && (
              <motion.div
                key="sticky"
                className={styles.stickyWrap}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.25 }}
              >
                <button
                  type="button"
                  className={`${styles.stickyCta} ${hasScrolled ? '' : styles.stickyCtaPulse}`}
                  onClick={handleStickyScroll}
                >
                  <span>친구들 답 보기</span>
                  <svg
                    className={styles.stickyArrow}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    aria-hidden
                  >
                    <path d="M6 6l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6 13l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {toast.isVisible && <div className={styles.toast}>{toast.message}</div>}
    </>
  );
};

export default MyResultView;
