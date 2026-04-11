'use client';

import { memo, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { AnimatePresence, m } from 'framer-motion';

import CheckIcon from '@/assets/icon/CheckIcon';
import CommentIcon from '@/assets/icon/CommentIcon';
import LikeIcon from '@/assets/icon/LikeIcon';
import ShareIcon from '@/assets/icon/ShareIcon';
import { DeadlineBadge } from '@/components/common/DeadlineBadge';
import { ImageViewer } from '@/components/common/ImageViewer/ImageViewer';
import styles from '@/components/features/Main/SingleCard/SingleCard.module.scss';
import {
  VOTE_EASING,
  buttonTapVariants,
  fadeInVariants,
} from '@/components/features/Main/SingleCard/voteAnimations';
import { useCardActions } from '@/contexts/CardActionsContext';
import { formatCount } from '@/lib/utils';
import type { SingleCardModel } from '@/types/card';
import { calcPercentage, OPTION_LABELS } from '@/types/singleVote';

const EMPTY_CATEGORIES: string[] = [];

interface SingleCardProps {
  data: SingleCardModel;
}

// eslint-disable-next-line react/display-name
export const SingleCard = memo<SingleCardProps>(({ data }) => {
  const {
    slug,
    title,
    categories = EMPTY_CATEGORIES,
    status,
    voteType,
    vote,
    totalVoteCount,
    totalCommentCount,
    expiredAt,
    likeCount,
    liked,
    mainImageUrl,
    topComment,
  } = data;

  const actions = useCardActions();
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const isClosed = status === 'CLOSED';
  const { voted, myChoiceId, options, totalVotes } = vote;
  const showResult = voted || isClosed;
  const total = totalVotes ?? 0;
  const isImageType = voteType === 'IMAGE';
  const logoUrl = !isImageType ? mainImageUrl : undefined;
  const buttonGroupClass = options.length === 2 ? styles.buttonGroupTwo : styles.buttonGroupMulti;

  const handleOptionClick = (optionId: string) => {
    if (isClosed || voted) {
      return;
    }
    actions.vote(slug, optionId, vote);
  };

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
              actions.share(slug);
            }}
            aria-label="공유"
          >
            <ShareIcon />
          </button>
        </div>
      </div>

      {/* 질문: 로고 이미지 + 텍스트 */}
      <Link href={`/hotpick/${slug}`} className={styles.questionRow}>
        {logoUrl && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setViewerImage(logoUrl);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                setViewerImage(logoUrl);
              }
            }}
            className={styles.zoomable}
          >
            <Image
              src={logoUrl}
              alt={title}
              width={62}
              height={62}
              className={styles.questionLogo}
            />
          </span>
        )}
        <h3 className={styles.question}>{title}</h3>
      </Link>

      {/* 투표 영역 */}
      <div className={styles.voteArea}>
        <AnimatePresence mode="wait">
          {!showResult ? (
            <m.div
              key="buttons"
              className={`${buttonGroupClass} ${isImageType ? styles.imageType : ''}`}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              {options.map((option, i) => (
                <m.button
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
                      width={44}
                      height={44}
                      className={styles.optionImage}
                    />
                  )}
                  <span className={styles.optionLabelText}>
                    <span className={styles.optionLabel}>{OPTION_LABELS[i]}</span>
                    <span className={styles.optionText}>{option.text}</span>
                  </span>
                </m.button>
              ))}
            </m.div>
          ) : (
            <m.div
              key="results"
              className={styles.resultGroup}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }}
            >
              {options.map((option, i) => {
                const isSelected = myChoiceId === option.id;
                const percentage = showResult ? calcPercentage(option.voteCount, total) : 0;

                return (
                  <div
                    key={option.id}
                    className={`${styles.resultBar} ${isSelected ? styles.myChoice : ''}`}
                  >
                    <m.div
                      className={styles.barFill}
                      initial={{ width: '0%' }}
                      animate={{
                        width: `${percentage}%`,
                        transition: { duration: 0.5, ease: VOTE_EASING },
                      }}
                    />
                    <div className={styles.barContent}>
                      {isImageType && option.imageUrl && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (option.imageUrl) {
                              setViewerImage(option.imageUrl);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.stopPropagation();
                              if (option.imageUrl) {
                                setViewerImage(option.imageUrl);
                              }
                            }
                          }}
                          className={styles.zoomable}
                        >
                          <Image
                            src={option.imageUrl}
                            alt={option.text}
                            width={44}
                            height={44}
                            className={styles.barImage}
                          />
                        </span>
                      )}
                      <m.span
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
                      </m.span>
                      <m.span
                        className={styles.barPercent}
                        variants={fadeInVariants}
                        initial="initial"
                        animate="animate"
                      >
                        {percentage}%
                      </m.span>
                    </div>
                  </div>
                );
              })}
            </m.div>
          )}
        </AnimatePresence>
      </div>

      {/* 하단: 메타 + 액션 버튼 */}
      <div className={styles.bottomRow}>
        <div className={styles.metaRow}>
          <span className={styles.participants}>{formatCount(totalVoteCount)}명 참여</span>
          {expiredAt && (
            <>
              <span className={styles.dot} />
              <DeadlineBadge deadline={expiredAt} compact />
            </>
          )}
        </div>
        <div className={styles.bottomActions}>
          <button
            type="button"
            className={styles.iconButtonWithCount}
            onClick={(e) => {
              e.stopPropagation();
              actions.like(slug, liked, likeCount);
            }}
            aria-label="좋아요"
          >
            <LikeIcon width={18} height={18} filled={liked} />
            {likeCount > 0 && <span className={styles.iconCount}>{formatCount(likeCount)}</span>}
          </button>
          <button
            type="button"
            className={styles.iconButtonWithCount}
            onClick={(e) => {
              e.stopPropagation();
              if (showResult) {
                actions.openComment(slug, vote.electionId);
              } else {
                actions.blockComment();
              }
            }}
            aria-label="댓글"
          >
            <CommentIcon />
            <span className={styles.iconCount}>
              {totalCommentCount > 0 ? formatCount(totalCommentCount) : ''}
            </span>
          </button>
        </div>
      </div>

      {/* topComment 미리보기 — 투표 완료 시에만 노출 */}
      {showResult && topComment?.content && (
        <button
          type="button"
          className={styles.topCommentPreview}
          data-testid="top-comment-preview"
          onClick={(e) => {
            e.stopPropagation();
            actions.openComment(slug, vote.electionId);
          }}
        >
          <span className={styles.topCommentNickname}>{topComment.nickname}</span>
          <span className={styles.topCommentText}>{topComment.content}</span>
        </button>
      )}

      <ImageViewer src={viewerImage} alt={title} onClose={() => setViewerImage(null)} />
    </div>
  );
});
