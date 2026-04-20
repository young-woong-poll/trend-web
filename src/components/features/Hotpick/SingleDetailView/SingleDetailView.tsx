'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import Image from 'next/image';

import { AnimatePresence, m } from 'framer-motion';

import CheckIcon from '@/assets/icon/CheckIcon';
import LikeIcon from '@/assets/icon/LikeIcon';
import LinkIcon from '@/assets/icon/LinkIcon';
import { Button } from '@/components/common/Button';
import { DeadlineBadge } from '@/components/common/DeadlineBadge';
import { ImageViewer } from '@/components/common/ImageViewer/ImageViewer';
import { InlineCommentSection } from '@/components/features/Hotpick/SingleDetailView/InlineCommentSection';
import { SingleDetailSkeleton } from '@/components/features/Hotpick/SingleDetailView/SingleDetailSkeleton';
import styles from '@/components/features/Hotpick/SingleDetailView/SingleDetailView.module.scss';
import { SingleRecommendSection } from '@/components/features/Hotpick/SingleDetailView/SingleRecommendSection';
import { VoteTrendChart } from '@/components/features/Hotpick/SingleDetailView/VoteTrendChart';
import {
  buttonTapVariants,
  barFillVariants,
  fadeInVariants,
} from '@/components/features/Main/SingleCard/voteAnimations';
import { useModal } from '@/contexts/ModalContext';
import { useDetailVote } from '@/hooks/api/useDetailVote';
import { useHotpickDetail } from '@/hooks/api/useDisplay';
import { useLike } from '@/hooks/api/useLike';
import { trackSingleView } from '@/lib/analytics';
import { toSingleDetailModel } from '@/lib/mappers/cardMapper';
import { formatCount } from '@/lib/utils';
import { calcPercentage, OPTION_LABELS } from '@/types/singleVote';

const detailSkeleton = <SingleDetailSkeleton />;

interface SingleDetailViewProps {
  hotpickAlias: string;
}

export const SingleDetailView = ({ hotpickAlias }: SingleDetailViewProps) => {
  const { data: rawData, isLoading } = useHotpickDetail(hotpickAlias);
  const { handleLike } = useLike();
  const { showToast } = useModal();

  const effectiveData = rawData;

  const detail = useMemo(
    () => (effectiveData ? toSingleDetailModel(effectiveData, hotpickAlias) : null),
    [effectiveData, hotpickAlias]
  );

  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const { handleVote } = useDetailVote(
    hotpickAlias,
    detail?.isExpired ?? false,
    detail?.voted ?? false
  );

  const viewTrackedRef = useRef(false);
  useEffect(() => {
    if (viewTrackedRef.current || !detail) {
      return;
    }
    viewTrackedRef.current = true;
    const voteStatus = detail.isExpired ? 'expired' : detail.voted ? 'voted' : 'not_voted';
    trackSingleView(hotpickAlias, {
      category: detail.categories[0],
      vote_status: voteStatus,
    });
  }, [detail, hotpickAlias]);

  if (isLoading && !detail) {
    return detailSkeleton;
  }

  if (!detail) {
    return detailSkeleton;
  }

  const {
    slug,
    title,
    expiredAt,
    likeCount,
    liked,
    electionId,
    totalVoteCount,
    totalCommentCount,
    voted,
    myElectionItemId,
    items,
    categories,
    isExpired,
    voteType,
    logoUrl,
    relatedHotpicks,
  } = detail;

  const showResult = voted || isExpired;
  const isImageType = voteType === 'IMAGE';
  const buttonGroupClass = items.length === 2 ? styles.buttonGroupTwo : styles.buttonGroupMulti;

  const handleShare = () => {
    const url = `${window.location.origin}/hotpick/${slug}`;
    void navigator.clipboard.writeText(url).then(() => {
      showToast('링크가 복사되었습니다');
    });
  };

  return (
    <div className={styles.container}>
      <m.div
        className={styles.voteCard}
        data-testid="vote-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={styles.topRow}>
          <div className={styles.categoryRow}>
            {categories.map((code) => (
              <span key={code} className={styles.categoryTag}>
                {code}
              </span>
            ))}
          </div>
          {expiredAt && (
            <div className={styles.deadlineArea}>
              <DeadlineBadge deadline={expiredAt} compact />
            </div>
          )}
        </div>

        <div className={styles.questionRow}>
          {logoUrl && (
            <span
              role="button"
              tabIndex={0}
              onClick={() => setViewerImage(logoUrl)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
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
          <h1 className={styles.question}>{title}</h1>
        </div>

        <div className={styles.voteArea}>
          <AnimatePresence mode="wait">
            {!showResult ? (
              <m.div
                key="buttons"
                className={`${buttonGroupClass} ${isImageType ? styles.imageType : ''}`}
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              >
                {items.map((item, i) => (
                  <m.button
                    key={item.electionItemId}
                    className={styles.optionButton}
                    onClick={() => handleVote(item.electionItemId)}
                    variants={buttonTapVariants}
                    whileTap="tap"
                    disabled={isExpired}
                  >
                    {isImageType && item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        width={44}
                        height={44}
                        className={styles.optionImage}
                      />
                    )}
                    <span className={styles.optionLabelText}>
                      <span className={styles.optionLabel}>{OPTION_LABELS[i]}</span>
                      <span className={styles.optionText}>{item.title}</span>
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
                {items.map((item, i) => {
                  const isSelected = myElectionItemId === item.electionItemId;
                  const percentage =
                    totalVoteCount > 0 ? calcPercentage(item.voteCount, totalVoteCount) : 0;

                  return (
                    <div
                      key={item.electionItemId}
                      className={`${styles.resultBar} ${isSelected ? styles.myChoice : ''}`}
                    >
                      <m.div
                        className={styles.barFill}
                        variants={barFillVariants}
                        initial="initial"
                        animate="animate"
                        custom={percentage}
                      />
                      <div className={styles.barContent}>
                        {isImageType && item.imageUrl && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.imageUrl) {
                                setViewerImage(item.imageUrl);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.stopPropagation();
                                if (item.imageUrl) {
                                  setViewerImage(item.imageUrl);
                                }
                              }
                            }}
                            className={styles.zoomable}
                          >
                            <Image
                              src={item.imageUrl}
                              alt={item.title}
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
                              <CheckIcon width={14} height={14} />
                            </span>
                          )}
                          <span className={styles.barLabel}>{OPTION_LABELS[i]}</span> {item.title}
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

        <div className={styles.metaActionRow}>
          <div className={styles.metaRow}>
            <span className={styles.participants}>{formatCount(totalVoteCount)}명 참여</span>
            {expiredAt && (
              <>
                <span className={styles.dot} />
                <DeadlineBadge deadline={expiredAt} compact />
              </>
            )}
          </div>
          <button
            type="button"
            className={styles.likeButton}
            onClick={() => handleLike(slug, liked, likeCount)}
            aria-label="좋아요"
          >
            <LikeIcon width={20} height={20} filled={liked} />
            {likeCount > 0 && <span className={styles.likeCount}>{formatCount(likeCount)}</span>}
          </button>
        </div>

        {showResult && (
          <div className={styles.shareCta}>
            <Button variant="gradient" fullWidth height={48} onClick={handleShare}>
              <LinkIcon />
              투표 공유하기
            </Button>
          </div>
        )}
      </m.div>

      <VoteTrendChart hotpickAlias={hotpickAlias} voted={voted} isExpired={isExpired} />

      <SingleRecommendSection hotpickAlias={hotpickAlias} relatedHotpicks={relatedHotpicks} />

      <InlineCommentSection
        slug={slug}
        electionId={electionId}
        voted={voted}
        isClosed={isExpired}
        commentCount={totalCommentCount}
      />

      <ImageViewer src={viewerImage} alt={title} onClose={() => setViewerImage(null)} />
    </div>
  );
};
