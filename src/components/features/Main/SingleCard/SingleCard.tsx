'use client';

import type { FC } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import ShareIcon from '@/assets/icon/ShareIcon';
import { DeadlineBadge } from '@/components/common/DeadlineBadge';
import styles from '@/components/features/Main/SingleCard/SingleCard.module.scss';
import {
  buttonTapVariants,
  layoutTransition,
  barFillVariants,
  fadeInVariants,
  cardVariants,
} from '@/components/features/Main/SingleCard/voteAnimations';
import { calcPercentage, type SingleVoteData } from '@/types/singleVote';

interface SingleCardProps {
  id: number | string;
  alias: string;
  title: string;
  categoryLabel?: string;
  participantCount?: number;
  deadline?: string;
  status?: string;
  singleVote: SingleVoteData;
  isHighlighted?: boolean;
  onVote: (hotpickId: string, optionId: string, singleVote: SingleVoteData) => void;
  onShare?: (alias: string) => void;
}

const formatCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

export const SingleCard: FC<SingleCardProps> = ({
  id,
  alias,
  title,
  categoryLabel,
  participantCount = 0,
  deadline,
  status,
  singleVote,
  isHighlighted,
  onVote,
  onShare,
}) => {
  const isClosed = status === 'CLOSED';
  const { voted, myChoice, optionA, optionB, totalVotes } = singleVote;

  const showResult = voted || isClosed;
  const total = totalVotes ?? 0;
  const percentA =
    showResult && optionA.voteCount !== null ? calcPercentage(optionA.voteCount, total) : 0;
  const percentB =
    showResult && optionB.voteCount !== null ? calcPercentage(optionB.voteCount, total) : 0;

  const hotpickId = String(id);

  const handleOptionClick = (optionId: string) => {
    if (isClosed || voted) {
      return;
    }
    onVote(hotpickId, optionId, singleVote);
  };

  return (
    <motion.div
      className={`${styles.card} ${isHighlighted ? styles.highlighted : ''}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      layout
    >
      {/* 헤더: 카테고리 + 참여자 수 + 공유 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {categoryLabel && <span className={styles.category}>{categoryLabel}</span>}
          <span className={styles.participants}>{formatCount(participantCount)}명 참여</span>
          {deadline && <DeadlineBadge deadline={deadline} compact />}
        </div>
        <button
          type="button"
          className={styles.shareButton}
          onClick={(e) => {
            e.stopPropagation();
            onShare?.(alias);
          }}
          aria-label="공유"
        >
          <ShareIcon />
        </button>
      </div>

      {/* 질문 텍스트 */}
      <h3 className={styles.question}>{title}</h3>

      {/* 투표 영역 */}
      <div className={styles.voteArea}>
        <AnimatePresence mode="wait">
          {!showResult ? (
            /* 투표 전: A/B 선택 버튼 */
            <motion.div
              key="buttons"
              className={styles.buttonGroup}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              layout
              transition={layoutTransition}
            >
              <motion.button
                className={styles.optionButton}
                onClick={() => handleOptionClick(optionA.id)}
                variants={buttonTapVariants}
                whileTap="tap"
                disabled={isClosed}
              >
                <span className={styles.optionLabel}>A</span>
                <span className={styles.optionText}>{optionA.text}</span>
              </motion.button>
              <motion.button
                className={styles.optionButton}
                onClick={() => handleOptionClick(optionB.id)}
                variants={buttonTapVariants}
                whileTap="tap"
                disabled={isClosed}
              >
                <span className={styles.optionLabel}>B</span>
                <span className={styles.optionText}>{optionB.text}</span>
              </motion.button>
            </motion.div>
          ) : (
            /* 투표 후: 결과 바 */
            <motion.div
              key="results"
              className={styles.resultGroup}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }}
              layout
              transition={layoutTransition}
            >
              {/* Option A 바 */}
              <div className={`${styles.resultBar} ${myChoice === 'A' ? styles.myChoice : ''}`}>
                <motion.div
                  className={styles.barFill}
                  variants={barFillVariants}
                  initial="initial"
                  animate="animate"
                  custom={percentA}
                />
                <div className={styles.barContent}>
                  <motion.span
                    className={styles.barText}
                    variants={fadeInVariants}
                    initial="initial"
                    animate="animate"
                  >
                    <span className={styles.barLabel}>A</span> {optionA.text}
                  </motion.span>
                  <motion.span
                    className={styles.barPercent}
                    variants={fadeInVariants}
                    initial="initial"
                    animate="animate"
                  >
                    {percentA}%
                  </motion.span>
                </div>
              </div>

              {/* Option B 바 */}
              <div className={`${styles.resultBar} ${myChoice === 'B' ? styles.myChoice : ''}`}>
                <motion.div
                  className={styles.barFill}
                  variants={barFillVariants}
                  initial="initial"
                  animate="animate"
                  custom={percentB}
                />
                <div className={styles.barContent}>
                  <motion.span
                    className={styles.barText}
                    variants={fadeInVariants}
                    initial="initial"
                    animate="animate"
                  >
                    <span className={styles.barLabel}>B</span> {optionB.text}
                  </motion.span>
                  <motion.span
                    className={styles.barPercent}
                    variants={fadeInVariants}
                    initial="initial"
                    animate="animate"
                  >
                    {percentB}%
                  </motion.span>
                </div>
              </div>

              {/* 투표 완료 텍스트 */}
              <motion.div
                className={styles.votedFooter}
                variants={fadeInVariants}
                initial="initial"
                animate="animate"
              >
                <span className={styles.votedText}>투표 완료</span>
                <span className={styles.totalVotes}>{formatCount(total)}명 참여</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
