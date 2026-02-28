'use client';

import { type FC } from 'react';

import Image from 'next/image';

import { AnimatePresence, motion } from 'framer-motion';

import CommentIcon from '@/assets/icon/CommentIcon';
import styles from '@/components/features/Hotpick/VoteCard/VoteCard.module.scss';
import { useHotpickElectionOptionsCount } from '@/hooks/api/useHotpick';
import { formatCount } from '@/lib/utils';
import type { VoteType } from '@/types/hotpick';
import { OPTION_LABELS } from '@/types/singleVote';

/** 투표 옵션 (구 DisplayTrendOptionResponse 대체) */
interface VoteOption {
  id?: string;
  title?: string;
  imageUrl?: string;
}

interface VoteCardProps {
  hotpickAlias: string;
  electionId: string;
  title: string;
  options: VoteOption[];
  selectedOptionId: string | null;
  handleOptionSelect: (optionId: string) => void;
  voteType?: VoteType;
  mainImageUrl?: string;
  commentCount?: number;
  commentDisabled?: boolean;
  onCommentClick?: () => void;
}

const VOTE_EASING = [0.22, 1, 0.36, 1] as const;

const buttonTapVariants = {
  idle: { scale: 1 },
  tap: { scale: 0.97 },
};

const barFillVariants = {
  initial: { width: '0%' },
  animate: (percentage: number) => ({
    width: `${percentage}%`,
    transition: { duration: 0.3, delay: 0.15, ease: VOTE_EASING },
  }),
};

const fadeInVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { delay: 0.25, duration: 0.2 },
  },
};

export const VoteCard: FC<VoteCardProps> = ({
  hotpickAlias,
  electionId,
  title,
  options,
  selectedOptionId,
  handleOptionSelect,
  voteType = 'IMAGE',
  mainImageUrl,
  commentCount,
  commentDisabled = false,
  onCommentClick,
}) => {
  const { data: optionCountData } = useHotpickElectionOptionsCount({ hotpickAlias, electionId });
  const optionCounts = optionCountData?.options ?? [];

  const totalVotes =
    optionCounts.reduce((sum, opt) => sum + (opt.count ?? 0), 0) + (selectedOptionId ? 1 : 0);

  const handleOptionClick = (optionId: string) => {
    if (selectedOptionId) {
      return;
    }
    handleOptionSelect(optionId);
  };

  const hasVoted = !!selectedOptionId;
  const isImageType = voteType === 'IMAGE';

  // TEXT 타입만 질문 옆 로고 표시, IMAGE 타입은 옵션 이미지로 대체
  const logoUrl = !isImageType ? mainImageUrl : undefined;

  return (
    <div className={styles.card}>
      {/* 질문: 로고 이미지 + 텍스트 */}
      <div className={styles.questionRow}>
        {logoUrl && (
          <Image src={logoUrl} alt={title} width={40} height={40} className={styles.questionLogo} />
        )}
        <h3 className={styles.question}>{title}</h3>
      </div>

      {/* 투표 영역 */}
      <div className={styles.voteArea}>
        <AnimatePresence mode="wait">
          {!hasVoted ? (
            /* 투표 전: 옵션 버튼 */
            <motion.div
              key="buttons"
              className={options.length === 2 ? styles.buttonGroupTwo : styles.buttonGroupMulti}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              {options.map((option, i) => (
                <motion.button
                  key={option.id}
                  className={styles.optionButton}
                  onClick={() => handleOptionClick(option.id ?? '')}
                  variants={buttonTapVariants}
                  whileTap="tap"
                >
                  {isImageType && option.imageUrl && (
                    <Image
                      src={option.imageUrl}
                      alt={option.title ?? ''}
                      width={24}
                      height={24}
                      className={styles.optionImage}
                    />
                  )}
                  <span className={styles.optionLabel}>{OPTION_LABELS[i]}</span>
                  <span className={styles.optionText}>{option.title}</span>
                </motion.button>
              ))}
            </motion.div>
          ) : (
            /* 투표 후: 결과 바 */
            <motion.div
              key="results"
              className={styles.resultGroup}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }}
            >
              {options.map((option, i) => {
                const isSelected = selectedOptionId === option.id;
                const voteCount = optionCounts.find((opt) => opt.id === option.id)?.count ?? 0;
                const displayVoteCount = isSelected ? voteCount + 1 : voteCount;
                const percentage =
                  totalVotes === 0 ? 0 : Math.round((displayVoteCount / totalVotes) * 100);

                return (
                  <div
                    key={option.id}
                    className={`${styles.resultBar} ${isSelected ? styles.myChoice : ''}`}
                  >
                    <motion.div
                      className={styles.barFill}
                      variants={barFillVariants}
                      initial="initial"
                      animate="animate"
                      custom={percentage}
                    />
                    <div className={styles.barContent}>
                      {isImageType && option.imageUrl && (
                        <Image
                          src={option.imageUrl}
                          alt={option.title ?? ''}
                          width={24}
                          height={24}
                          className={styles.barImage}
                        />
                      )}
                      <motion.span
                        className={styles.barText}
                        variants={fadeInVariants}
                        initial="initial"
                        animate="animate"
                      >
                        <span className={styles.barLabel}>{OPTION_LABELS[i]}</span> {option.title}
                      </motion.span>
                      <motion.span
                        className={styles.barPercent}
                        variants={fadeInVariants}
                        initial="initial"
                        animate="animate"
                      >
                        {percentage}%
                      </motion.span>
                    </div>
                  </div>
                );
              })}

              {/* 투표 완료 푸터 */}
              <motion.div
                className={styles.votedFooter}
                variants={fadeInVariants}
                initial="initial"
                animate="animate"
              >
                <span className={styles.votedText}>투표 완료</span>
                <span className={styles.totalVotes}>{formatCount(totalVotes)}명 참여</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 하단: 댓글 버튼 */}
      <div className={styles.bottomRow}>
        <button
          type="button"
          className={styles.iconButtonWithCount}
          onClick={onCommentClick}
          disabled={commentDisabled}
          aria-label="댓글"
        >
          <CommentIcon />
          <span className={styles.iconCount}>
            {commentCount !== undefined ? formatCount(commentCount) : ''}
          </span>
        </button>
      </div>
    </div>
  );
};
