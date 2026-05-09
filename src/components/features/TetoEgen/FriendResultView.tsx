'use client';

import { type FC, useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { motion, useReducedMotion } from 'framer-motion';

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

  // 4초 무반응 시 scrollHint 펄스용 ref도 같이 사용 — 선언을 위로 올려 effect들이 참조 가능하게.
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [shouldPulse, setShouldPulse] = useState(false);

  const handleBack = () => {
    trackAskFriendResultBack('teto-egen');
    router.push('/');
  };

  const handleNext = () => {
    trackAskFriendResultCtaClick('teto-egen', 'create_my', false);
    router.push('/ask/teto-egen/my?from=friend');
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

  // 4초 무반응 시 scrollHint 펄스 — 사용자가 hero에 머물고 스크롤 가능을 모르는 케이스 환기.
  // 한 번이라도 스크롤하면 즉시 해제, 다시 트리거되지 않음.
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

  return (
    <div
      ref={frameRef}
      className={styles.frame}
      style={{
        ['--ambient-primary' as string]: colors.ambient.primary,
        ['--ambient-secondary' as string]: colors.ambient.secondary,
      }}
    >
      <section className={styles.hero}>
        <button type="button" className={styles.backButton} onClick={handleBack} aria-label="뒤로">
          <BackIcon className={styles.backIcon} />
        </button>
        <span className={styles.contextChip}>친구 평가</span>

        <div className={styles.heroMid}>
          <motion.p className={styles.pre} {...heroPreMotion} transition={baseTransition}>
            <strong>{ownerDisplayName}</strong>님은 친구들에게…
          </motion.p>

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
      </section>

      <section className={styles.detail}>
        <h2 className={styles.sectionTitle}>친구들의 답 분포</h2>
        <DistCard tetoCount={friendVotes.tetoCount} egenCount={friendVotes.egenCount} />
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>친구들 답</h2>
          <span className={styles.sectionCount}>
            <strong>{friendVotes.total}</strong>명
          </span>
        </div>
        <VoterList voters={friendVotes.voters} highlightSelfId={user?.id} />
        <div ref={ctaRef} className={styles.detailCta}>
          <p className={styles.ctaHook}>친구들은 나를 어떻게 볼까?</p>
          <button type="button" className={styles.ctaPrimary} onClick={handleNext}>
            나도 해보기
          </button>
        </div>
      </section>
    </div>
  );
};

export default FriendResultView;
