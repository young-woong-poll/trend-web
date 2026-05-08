'use client';

import { type FC, useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { motion, useReducedMotion } from 'framer-motion';

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

  // 4초 무반응 시 scrollHint 펄스 — FriendResultView와 동일 패턴.
  // 한 번이라도 스크롤하면 즉시 해제, 다시 트리거되지 않음.
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [shouldPulse, setShouldPulse] = useState(false);
  useEffect(() => {
    if (shouldReduceMotion) {
      return;
    }
    const el = frameRef.current;
    if (!el) {
      return;
    }
    let scrolled = false;
    const onScroll = () => {
      if (el.scrollTop > 4) {
        scrolled = true;
        setShouldPulse(false);
      }
    };
    const timer = window.setTimeout(() => {
      if (!scrolled) {
        setShouldPulse(true);
      }
    }, 4000);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      el.removeEventListener('scroll', onScroll);
    };
  }, [shouldReduceMotion]);

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
  const heroPreMotion = shouldReduceMotion
    ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
    : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };

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

  return (
    <>
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
          <button
            type="button"
            className={styles.backButton}
            onClick={() => router.back()}
            aria-label="뒤로"
          >
            <BackIcon className={styles.backIcon} />
          </button>
          <span className={styles.contextChip}>내 결과</span>

          <div className={styles.heroMid}>
            <motion.p className={styles.pre} {...heroPreMotion} transition={baseTransition}>
              <strong>{data.displayName}</strong>님은 친구들이 보기에
            </motion.p>

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

          {!isEmpty && !isSparse && (
            <div
              className={`${styles.scrollHint} ${shouldPulse ? styles.scrollHintPulse : ''}`}
              aria-hidden
            >
              <span className={styles.scrollHintLabel}>친구들 답 보기</span>
              <svg
                className={styles.scrollHintIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path d="M6 6l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 13l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </section>

        {/* 정상 케이스만 Detail 노출. empty/sparse는 Hero 안에서 공유 완결. */}
        {!isEmpty && !isSparse && (
          <section className={styles.detail}>
            <h2 className={styles.sectionTitle}>친구들의 답 분포</h2>
            <DistCard
              tetoCount={data.friendVotes.tetoCount}
              egenCount={data.friendVotes.egenCount}
            />
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>친구들 답</h2>
              <span className={styles.sectionCount}>
                <strong>{total}</strong>명
              </span>
            </div>
            <VoterList voters={data.friendVotes.voters} />
            <div className={styles.detailCta}>
              <button
                type="button"
                className={styles.ctaPrimary}
                onClick={handleCopy}
                aria-live="polite"
              >
                {isCopied ? '복사됐어요!' : '투표 링크 복사하기'}
              </button>
            </div>
          </section>
        )}
      </div>

      {toast.isVisible && <div className={styles.toast}>{toast.message}</div>}
    </>
  );
};

export default MyResultView;
