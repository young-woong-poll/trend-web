'use client';

import { type FC } from 'react';

import { useRouter } from 'next/navigation';

import { motion, useReducedMotion } from 'framer-motion';

import BackIcon from '@/assets/icon/BackIcon';
import DistCard from '@/components/features/TetoEgen/DistCard';
import styles from '@/components/features/TetoEgen/FriendResultView.module.scss';
import VoterList from '@/components/features/TetoEgen/VoterList';
import { useAuth } from '@/contexts/AuthContext';
import { useMyTetoEgenLink } from '@/hooks/api/useAskTetoEgen';
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
  // voter.userId(string)와 매치하기 위해 user.id(number)를 string 변환.
  // 로그인 안 한 경우는 null → 누구도 "나" 강조 X.
  const myId = typeof user?.id === 'number' ? String(user.id) : null;

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

  const handleBack = () => {
    router.push('/');
  };

  const handleNext = () => {
    if (myLink.data) {
      // 본인 링크 보유 — MyResult로 보내면 친구 결과 화면과 UI가 같아 컨텍스트 혼동.
      // 단순히 홈으로 보내 다른 콘텐츠 탐색 유도.
      router.push('/');
    } else {
      // 본인 링크 미보유 — 내 결과 만들기 플로우로 진입.
      // from=friend 쿼리로 친구 화면에서 넘어왔음을 표시 → /my에서 백 버튼 노출 트리거.
      router.push('/ask/teto-egen/my?from=friend');
    }
  };

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

  // myLink.isLoading 중에는 미보유 케이스로 가정 (가장 흔함). data 도착 후 자동 갱신.
  const ctaLabel = myLink.data ? '홈으로 가기' : '나도 평가 받아보기';

  return (
    <div
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

        <div className={styles.scrollHint} aria-hidden>
          <span>SCROLL</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
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
        <VoterList voters={friendVotes.voters} highlightSelfId={myId} />
        <div className={styles.detailCta}>
          {!myLink.data && <p className={styles.ctaHook}>친구들은 나를 어떻게 볼까?</p>}
          <button type="button" className={styles.ctaPrimary} onClick={handleNext}>
            {ctaLabel}
          </button>
        </div>
      </section>
    </div>
  );
};

export default FriendResultView;
