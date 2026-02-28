'use client';

import type { FC } from 'react';

import Image from 'next/image';

import { AnimatePresence, motion } from 'framer-motion';

import CheckIcon from '@/assets/icon/CheckIcon';
import CommentIcon from '@/assets/icon/CommentIcon';
import ShareIcon from '@/assets/icon/ShareIcon';
import { DeadlineBadge } from '@/components/common/DeadlineBadge';
import styles from '@/components/features/Main/SingleCard/SingleCard.module.scss';
import {
  buttonTapVariants,
  barFillVariants,
  fadeInVariants,
} from '@/components/features/Main/SingleCard/voteAnimations';
import type { TopCommentResponse } from '@/generated/models';
import { formatCount } from '@/lib/utils';
import type { VoteType } from '@/types/hotpick';
import { calcPercentage, OPTION_LABELS, type SingleVoteData } from '@/types/singleVote';

interface SingleCardProps {
  id: number | string;
  alias: string;
  title: string;
  categories?: string[];
  participantCount?: number;
  commentCount?: number;
  deadline?: string;
  status?: string;
  singleVote: SingleVoteData;
  voteType?: VoteType;
  mainImageUrl?: string;
  topComment?: TopCommentResponse;
  onVote: (slug: string, optionId: string, singleVote: SingleVoteData) => void;
  onShare?: (alias: string) => void;
  onComment: (slug: string, electionId: string) => void;
  onCommentBlocked?: () => void;
}

export const SingleCard: FC<SingleCardProps> = ({
  id: _id,
  alias,
  title,
  categories = [],
  participantCount = 0,
  commentCount,
  deadline,
  status,
  singleVote,
  voteType,
  mainImageUrl,
  topComment,
  onVote,
  onShare,
  onComment,
  onCommentBlocked,
}) => {
  const isClosed = status === 'CLOSED';
  const { voted, myChoiceId, options, totalVotes } = singleVote;

  const showResult = voted || isClosed;
  const total = totalVotes ?? 0;
  const isImageType = voteType === 'IMAGE';

  const handleOptionClick = (optionId: string) => {
    if (isClosed || voted) {
      return;
    }
    onVote(alias, optionId, singleVote);
  };

  // TEXT 타입만 질문 옆 로고 표시, IMAGE 타입은 옵션 이미지로 대체
  const logoUrl = !isImageType ? mainImageUrl : undefined;

  // 2개 옵션: 2열 그리드, 3~4개: 세로 배치
  const buttonGroupClass = options.length === 2 ? styles.buttonGroupTwo : styles.buttonGroupMulti;

  return (
    <div className={`${styles.card} ${isClosed ? styles.closed : ''}`} data-testid="single-card">
      {/* 상단: 카테고리 + 공유 */}
      <div className={styles.topRow}>
        <div className={styles.categoryRow}>
          {categories.map((code, i) => (
            <span key={code}>
              {i > 0 && <span className={styles.categorySeparator}>·</span>}
              <span className={styles.categoryTag}>{code}</span>
            </span>
          ))}
        </div>
        <div className={styles.actionButtons}>
          {isClosed && (
            <span className={styles.closedBadge} data-testid="closed-badge">
              마감
            </span>
          )}
          <button
            type="button"
            className={styles.iconButton}
            onClick={(e) => {
              e.stopPropagation();
              onShare?.(alias);
            }}
            aria-label="공유"
          >
            <ShareIcon />
          </button>
        </div>
      </div>

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
          {!showResult ? (
            /* 투표 전: 옵션 버튼 */
            <motion.div
              key="buttons"
              className={buttonGroupClass}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              {options.map((option, i) => (
                <motion.button
                  key={option.id}
                  className={styles.optionButton}
                  onClick={() => handleOptionClick(option.id)}
                  variants={buttonTapVariants}
                  whileTap="tap"
                  disabled={isClosed}
                >
                  {isImageType && option.imageUrl && (
                    <Image
                      src={option.imageUrl}
                      alt={option.text}
                      width={24}
                      height={24}
                      className={styles.optionImage}
                    />
                  )}
                  <span className={styles.optionLabel}>{OPTION_LABELS[i]}</span>
                  <span className={styles.optionText}>{option.text}</span>
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
                const isSelected = myChoiceId === option.id;
                const percentage =
                  showResult && option.voteCount !== null
                    ? calcPercentage(option.voteCount, total)
                    : 0;

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
                          alt={option.text}
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
                        {isSelected && (
                          <span className={styles.votedBadge}>
                            <CheckIcon width={12} height={12} />
                          </span>
                        )}
                        <span className={styles.barLabel}>{OPTION_LABELS[i]}</span> {option.text}
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 하단: 메타 + 액션 버튼 */}
      <div className={styles.bottomRow}>
        <div className={styles.metaRow}>
          <span className={styles.participants}>{formatCount(participantCount)}명 참여</span>
          {deadline && (
            <>
              <span className={styles.dot} />
              <DeadlineBadge deadline={deadline} compact />
            </>
          )}
        </div>
        <button
          type="button"
          className={styles.iconButtonWithCount}
          onClick={(e) => {
            e.stopPropagation();
            if (showResult) {
              onComment(alias, singleVote.electionId);
            } else {
              onCommentBlocked?.();
            }
          }}
          aria-label="댓글"
        >
          <CommentIcon />
          <span className={styles.iconCount}>
            {commentCount !== undefined ? formatCount(commentCount) : ''}
          </span>
        </button>
      </div>

      {/* topComment 미리보기 — 투표 완료 시에만 노출 */}
      {showResult && topComment?.content && (
        <button
          type="button"
          className={styles.topCommentPreview}
          data-testid="top-comment-preview"
          onClick={(e) => {
            e.stopPropagation();
            onComment(alias, singleVote.electionId);
          }}
        >
          <span className={styles.topCommentNickname}>{topComment.nickname}</span>
          <span className={styles.topCommentText}>{topComment.content}</span>
        </button>
      )}
    </div>
  );
};
