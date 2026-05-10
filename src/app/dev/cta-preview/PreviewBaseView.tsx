'use client';

import { type FC, type ReactNode, useEffect, useRef, useState } from 'react';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import styles from '@/app/dev/cta-preview/PreviewBaseView.module.scss';
import BackIcon from '@/assets/icon/BackIcon';
import DistCard from '@/components/features/TetoEgen/DistCard';
import VoterList from '@/components/features/TetoEgen/VoterList';
import { getBigword, getResultAdjective } from '@/lib/tetoEgenAdjective';
import { getResultColorTokens } from '@/lib/tetoEgenColor';
import type { TetoEgenAnswer, TetoEgenFriendVotes } from '@/types/ask-teto-egen';

const labelOf = (a: TetoEgenAnswer) => (a === 'TETO' ? '테토' : '에겐');

type PreviewBaseViewProps = {
  ownerDisplayName: string;
  ownerSelfAnswer: TetoEgenAnswer;
  myVote: TetoEgenAnswer;
  friendVotes: TetoEgenFriendVotes;
  /** detail 섹션 내부 inline CTA 자리. method별로 다르게 렌더. */
  inlineCtaSlot: ReactNode;
  /** Hero 영역 scrollHint 자리(또는 sticky overlay). method별로 다르게 렌더. */
  heroOverlaySlot?: ReactNode;
  /** frame 외부에 fixed로 띄울 sticky CTA. method별로 다르게 렌더. */
  fixedOverlaySlot?: ReactNode;
  /** frame ref를 외부에 노출 (IntersectionObserver root용). */
  onFrameMount?: (el: HTMLDivElement | null) => void;
  /** detail section ref를 외부에 노출 (smooth scroll target / observe target). */
  onDetailMount?: (el: HTMLDivElement | null) => void;
};

const PreviewBaseView: FC<PreviewBaseViewProps> = ({
  ownerDisplayName,
  ownerSelfAnswer,
  myVote,
  friendVotes,
  inlineCtaSlot,
  heroOverlaySlot,
  fixedOverlaySlot,
  onFrameMount,
  onDetailMount,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const adj = getResultAdjective(friendVotes.tetoCount, friendVotes.egenCount, ownerSelfAnswer);
  const colors = getResultColorTokens(adj.result);
  const bigword = getBigword(adj);

  const verdictCopy = myVote === ownerSelfAnswer ? '같은 생각이에요' : '조금 다르게 봤어요';

  const frameRef = useRef<HTMLDivElement | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);
  const [inDetail, setInDetail] = useState(false);

  useEffect(() => {
    onFrameMount?.(frameRef.current);
  }, [onFrameMount]);

  useEffect(() => {
    onDetailMount?.(detailRef.current);
  }, [onDetailMount]);

  // 실제 컴포넌트와 동일한 시각 시뮬을 위해 자체적으로 inDetail 추적.
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

  const handleScrollToHero = () => {
    frameRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.wrap}>
      <button type="button" className={styles.floatingBack} aria-label="뒤로">
        <BackIcon className={styles.backIcon} />
      </button>

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

            <motion.p
              className={styles.verdictSub}
              {...heroLateMotion}
              transition={{ ...baseTransition, delay: 0.6 }}
            >
              {ownerDisplayName}님과 <strong>{verdictCopy}</strong>
            </motion.p>

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
          </div>

          {heroOverlaySlot}
        </section>

        <section ref={detailRef} className={styles.detail}>
          <DistCard tetoCount={friendVotes.tetoCount} egenCount={friendVotes.egenCount} />
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>친구 목록</h2>
            <span className={styles.sectionCount}>
              <strong>{friendVotes.total}</strong>명
            </span>
          </div>
          <p className={styles.sectionHint}>눌러서 친구 결과도 구경하기</p>
          <VoterList voters={friendVotes.voters} enableProfileLink />
          <div className={styles.detailCta}>{inlineCtaSlot}</div>
        </section>
      </div>

      {fixedOverlaySlot}
    </div>
  );
};

export default PreviewBaseView;
