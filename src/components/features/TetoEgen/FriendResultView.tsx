'use client';

import { type FC, useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import BackIcon from '@/assets/icon/BackIcon';
import DistCard from '@/components/features/TetoEgen/DistCard';
import styles from '@/components/features/TetoEgen/FriendResultView.module.scss';
import VoterList from '@/components/features/TetoEgen/VoterList';
import { useAuth } from '@/contexts/AuthContext';
import { useMyTetoEgenLink } from '@/hooks/api/useAskTetoEgen';
import {
  trackAskFriendResultBack,
  trackAskFriendResultCtaClick,
  trackAskFriendResultCtaVisible,
  trackAskFriendResultView,
} from '@/lib/analytics';
import { getBigword, getResultAdjective } from '@/lib/tetoEgenAdjective';
import { getResultColorTokens } from '@/lib/tetoEgenColor';
import type { TetoEgenAnswer, TetoEgenFriendVotes } from '@/types/ask-teto-egen';

type FriendResultViewProps = {
  ownerDisplayName: string;
  // owner 자기평가가 BE 응답에 누락될 수 있어 nullable. 없으면 부제·예측 비교 미노출.
  ownerSelfAnswer: TetoEgenAnswer | null;
  myVote: TetoEgenAnswer;
  friendVotes: TetoEgenFriendVotes;
  isLoggedIn: boolean;
};

const labelOf = (a: TetoEgenAnswer) => (a === 'TETO' ? '테토' : '에겐');

const FriendResultView: FC<FriendResultViewProps> = ({
  ownerDisplayName,
  ownerSelfAnswer,
  myVote,
  friendVotes,
  isLoggedIn,
}) => {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const { user } = useAuth();

  // owner 자기평가는 owner의 selfAnswer로, 빅워드 매핑 시에도 동률 처리에 사용.
  // owner 자기평가가 없으면 다수표만으로 결정 (동률은 임의로 TETO 폴백).
  const adj = getResultAdjective(
    friendVotes.tetoCount,
    friendVotes.egenCount,
    ownerSelfAnswer ?? 'TETO'
  );
  const colors = getResultColorTokens(adj.result);
  const bigword = getBigword(adj);

  // CTA 카피 분기 — 본인 링크 보유 여부.
  const myLink = useMyTetoEgenLink(isLoggedIn);

  const verdictCopy: { strong: string; rest: string } | null = ownerSelfAnswer
    ? myVote === ownerSelfAnswer
      ? { strong: '같은 생각이에요', rest: '' }
      : { strong: '조금 다르게 봤어요', rest: '' }
    : null;

  const hasMyLink = !!myLink.data;
  const voteMatch = ownerSelfAnswer ? myVote === ownerSelfAnswer : false;

  // sticky CTA: detail 진입 여부로 sticky/inline 전환. 사용자 스크롤 시 통통 펄스 정지.
  const frameRef = useRef<HTMLDivElement | null>(null);
  const detailRef = useRef<HTMLElement | null>(null);
  const [inDetail, setInDetail] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  const handleBack = () => {
    trackAskFriendResultBack('teto-egen');
    // 같은 앱 내 진입(my → friend, friend → friend)이면 router.back()으로 자연스러운 복귀.
    // 외부 링크/직접 진입은 history가 비어있어 back할 곳이 없으니 home으로 fallback.
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleNext = () => {
    trackAskFriendResultCtaClick('teto-egen', 'create_my', false);
    router.push('/ask/teto-egen/my?from=friend');
  };

  const handleStickyScroll = () => {
    detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleScrollToHero = () => {
    frameRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // mount 1회: myLink.isLoading이 끝난 직후 첫 1회만 발화.
  // 로딩 중에는 has_my_link가 false로 잘못 잡히므로 결과 도착 후 발화.
  const viewSentRef = useRef(false);
  useEffect(() => {
    if (viewSentRef.current) {
      return;
    }
    if (myLink.isLoading) {
      return;
    }
    viewSentRef.current = true;
    trackAskFriendResultView('teto-egen', hasMyLink, voteMatch);
  }, [myLink.isLoading, hasMyLink, voteMatch]);

  // CTA visible: .detailCta가 뷰포트 50% 이상 노출되는 첫 시점 1회.
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const ctaVisibleSentRef = useRef(false);
  useEffect(() => {
    if (ctaVisibleSentRef.current) {
      return;
    }
    if (myLink.isLoading) {
      return;
    }
    const node = ctaRef.current;
    if (!node) {
      return;
    }
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !ctaVisibleSentRef.current) {
            ctaVisibleSentRef.current = true;
            trackAskFriendResultCtaVisible('teto-egen', hasMyLink);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.5, root: frameRef.current }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [myLink.isLoading, hasMyLink]);

  const baseTransition = { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const };

  const heroBigwordMotion = shouldReduceMotion
    ? { initial: { opacity: 1, scale: 1, y: 0 }, animate: { opacity: 1, scale: 1, y: 0 } }
    : {
        initial: { opacity: 0, scale: 0.85, y: 8 },
        animate: { opacity: 1, scale: 1, y: 0 },
      };

  const heroLateMotion = shouldReduceMotion
    ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
    : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };

  // 사용자가 한 번이라도 스크롤하면 sticky 통통 펄스를 정지 — 발견성 시그널 임무 완료.
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

  // detail 50% 노출 시 sticky → inline 전환. root는 frame.
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

  return (
    <div className={styles.wrap}>
      {/* frame 외부 sticky back — Hero/Detail 어느 위치에서도 항상 노출 */}
      <button type="button" className={styles.floatingBack} onClick={handleBack} aria-label="뒤로">
        <BackIcon className={styles.backIcon} />
      </button>

      {/* Detail 진입 시 상단 가운데에 fade-in되는 ↑ scroll-up indicator */}
      <AnimatePresence>
        {inDetail && (
          <motion.button
            key="scroll-up"
            type="button"
            className={styles.scrollUpIndicator}
            onClick={handleScrollToHero}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            aria-label="결과 위로"
          >
            <svg
              className={styles.scrollUpIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden
            >
              <path d="M6 11l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 18l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className={styles.scrollUpLabel}>위로</span>
          </motion.button>
        )}
      </AnimatePresence>

      <div
        ref={frameRef}
        className={styles.frame}
        style={{
          ['--ambient-primary' as string]: colors.ambient.primary,
          ['--ambient-secondary' as string]: colors.ambient.secondary,
        }}
      >
        <section className={styles.hero}>
          <span className={styles.contextChip}>현재 {ownerDisplayName}님의 결과</span>

          <div className={styles.heroMid}>
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

            {verdictCopy && (
              <motion.p
                className={styles.verdictSub}
                {...heroLateMotion}
                transition={{ ...baseTransition, delay: 0.6 }}
              >
                {ownerDisplayName}님과 <strong>{verdictCopy.strong}</strong>
              </motion.p>
            )}

            {ownerSelfAnswer && (
              <motion.dl
                className={styles.meta}
                aria-label="내 답과 owner 답 비교"
                {...heroLateMotion}
                transition={{ ...baseTransition, delay: 0.9 }}
              >
                <div className={styles.metaItem}>
                  <dt className={styles.metaLabel}>내 답</dt>
                  <dd className={styles.metaVal}>{labelOf(myVote)}</dd>
                </div>
                <span className={styles.metaDivider} aria-hidden />
                <div className={styles.metaItem}>
                  <dt className={styles.metaLabel}>{ownerDisplayName}님</dt>
                  <dd className={styles.metaVal}>{labelOf(ownerSelfAnswer)}</dd>
                </div>
              </motion.dl>
            )}
          </div>
        </section>

        <section ref={detailRef} className={styles.detail}>
          <h2 className={styles.sectionTitle}>답 분포</h2>
          <DistCard tetoCount={friendVotes.tetoCount} egenCount={friendVotes.egenCount} />
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>참여한 친구들</h2>
            <span className={styles.sectionCount}>
              <strong>{friendVotes.total}</strong>명
            </span>
          </div>
          <p className={styles.sectionHint}>눌러서 친구 결과도 구경하기</p>
          <VoterList voters={friendVotes.voters} highlightSelfId={user?.id} enableProfileLink />
          <div ref={ctaRef} className={styles.detailCta}>
            <AnimatePresence>
              {inDetail && (
                <motion.div
                  key="inline-cta"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className={styles.ctaHook}>친구들은 나를 어떻게 볼까?</p>
                  <button type="button" className={styles.ctaPrimary} onClick={handleNext}>
                    나도 투표 받아보기
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>

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
    </div>
  );
};

export default FriendResultView;
