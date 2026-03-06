'use client';

import { useCallback, useRef, type FC } from 'react';

import Image from 'next/image';

import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';

import CheckIcon from '@/assets/icon/CheckIcon';
import LikeIcon from '@/assets/icon/LikeIcon';
import LinkIcon from '@/assets/icon/LinkIcon';
import { Button } from '@/components/common/Button';
import { DeadlineBadge } from '@/components/common/DeadlineBadge';
// NOTE: 카카오 공유하기 바텀시트 비활성화 (코드 보존)
// import { ShareBottomSheet } from '@/components/features/Hotpick/ShareBottomSheet';
import { InlineCommentSection } from '@/components/features/Hotpick/SingleDetailView/InlineCommentSection';
import { SingleDetailSkeleton } from '@/components/features/Hotpick/SingleDetailView/SingleDetailSkeleton';
import styles from '@/components/features/Hotpick/SingleDetailView/SingleDetailView.module.scss';
import { SingleRecommendSection } from '@/components/features/Hotpick/SingleDetailView/SingleRecommendSection';
import {
  buttonTapVariants,
  barFillVariants,
  fadeInVariants,
} from '@/components/features/Main/SingleCard/voteAnimations';
import { useModal } from '@/contexts/ModalContext';
import { vote } from '@/generated/api/client/hotpick/hotpick';
import { displayKeys, useHotpickDetail } from '@/hooks/api/useDisplay';
import { useLike } from '@/hooks/api/useLike';
import { getTKUID } from '@/lib/tkuid';
import { formatCount } from '@/lib/utils';
import { calcPercentage, OPTION_LABELS } from '@/types/singleVote';

interface SingleDetailViewProps {
  hotpickAlias: string;
}

export const SingleDetailView: FC<SingleDetailViewProps> = ({ hotpickAlias }) => {
  const queryClient = useQueryClient();
  const { data: rawData, isLoading } = useHotpickDetail(hotpickAlias);

  const { handleLike } = useLike();
  const { showToast } = useModal();
  const pendingRef = useRef(false);
  const tkuIdRef = useRef(getTKUID());
  // NOTE: 카카오 공유하기 바텀시트 비활성화 (코드 보존)
  // const [isShareOpen, setIsShareOpen] = useState(false);

  const hotpickCard = rawData?.hotpick;
  const election = hotpickCard?.election;
  const items = election?.items ?? [];

  const voted = election?.voted ?? false;
  const myElectionItemId = election?.myElectionItemId;
  const electionId = String(election?.electionId ?? '');
  const totalVoteCount = election?.totalVoteCount ?? 0;
  const title = election?.title ?? '';
  const isImageType = items.some((item) => !!item.imageUrl);
  const isExpired = hotpickCard?.expiredAt ? new Date(hotpickCard.expiredAt) < new Date() : false;
  const logoUrl = !isImageType ? (election?.imageUrl ?? hotpickCard?.imageUrl) : undefined;
  const categories: string[] = (hotpickCard?.categories ?? []).map((c) => c.name ?? '');
  const commentCount = election?.totalCommentCount ?? 0;
  const liked = hotpickCard?.liked ?? false;
  const likeCount = hotpickCard?.likeCount ?? 0;
  const showResult = voted || isExpired;
  const buttonGroupClass = items.length === 2 ? styles.buttonGroupTwo : styles.buttonGroupMulti;

  const handleVote = useCallback(
    async (optionId: number) => {
      if (isExpired || voted || pendingRef.current) {
        return;
      }

      pendingRef.current = true;

      try {
        await vote(
          hotpickAlias,
          { electionItemId: optionId },
          { headers: { 'x-tku-id': tkuIdRef.current } }
        );
      } catch (error) {
        // 409(이미 투표) 등 API 에러가 아닌 경우에만 토스트 표시
        if (!(error && typeof error === 'object' && 'response' in error)) {
          showToast('투표에 실패했습니다');
        }
      } finally {
        await queryClient.invalidateQueries({
          queryKey: displayKeys.hotpick(hotpickAlias),
        });
        pendingRef.current = false;
      }
    },
    [isExpired, voted, hotpickAlias, queryClient, showToast]
  );

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/hotpick/${hotpickAlias}`;
    void navigator.clipboard.writeText(url).then(() => {
      showToast('링크가 복사되었습니다');
    });

    // NOTE: 카카오 공유하기 바텀시트 비활성화 (코드 보존)
    // setIsShareOpen(true);
  }, [hotpickAlias, showToast]);

  if (isLoading || !rawData || !hotpickCard || !election) {
    return <SingleDetailSkeleton />;
  }

  return (
    <div className={styles.container}>
      <motion.div
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
          {hotpickCard.expiredAt && (
            <div className={styles.deadlineArea}>
              <DeadlineBadge deadline={hotpickCard.expiredAt} compact />
            </div>
          )}
        </div>

        <div className={styles.questionRow}>
          {logoUrl && (
            <Image
              src={logoUrl}
              alt={title}
              width={48}
              height={48}
              className={styles.questionLogo}
            />
          )}
          <h1 className={styles.question}>{title}</h1>
        </div>

        <div className={styles.voteArea}>
          <AnimatePresence mode="wait">
            {!showResult ? (
              <motion.div
                key="buttons"
                className={buttonGroupClass}
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              >
                {items.map((item, i) => (
                  <motion.button
                    key={item.electionItemId}
                    className={styles.optionButton}
                    onClick={() => handleVote(item.electionItemId ?? 0)}
                    variants={buttonTapVariants}
                    whileTap="tap"
                    disabled={isExpired}
                  >
                    {isImageType && item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.title ?? ''}
                        width={28}
                        height={28}
                        className={styles.optionImage}
                      />
                    )}
                    <span className={styles.optionLabel}>{OPTION_LABELS[i]}</span>
                    <span className={styles.optionText}>{item.title}</span>
                  </motion.button>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="results"
                className={styles.resultGroup}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }}
              >
                {items.map((item, i) => {
                  const isSelected = myElectionItemId === item.electionItemId;
                  const percentage =
                    totalVoteCount > 0 ? calcPercentage(item.voteCount ?? 0, totalVoteCount) : 0;

                  return (
                    <div
                      key={item.electionItemId}
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
                        {isImageType && item.imageUrl && (
                          <Image
                            src={item.imageUrl}
                            alt={item.title ?? ''}
                            width={28}
                            height={28}
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
                              <CheckIcon width={14} height={14} />
                            </span>
                          )}
                          <span className={styles.barLabel}>{OPTION_LABELS[i]}</span> {item.title}
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

        <div className={styles.metaActionRow}>
          <div className={styles.metaRow}>
            <span className={styles.participants}>{formatCount(totalVoteCount)}명 참여</span>
            {hotpickCard.expiredAt && (
              <>
                <span className={styles.dot} />
                <DeadlineBadge deadline={hotpickCard.expiredAt} compact />
              </>
            )}
          </div>
          <button
            type="button"
            className={styles.likeButton}
            onClick={() => handleLike(hotpickAlias, liked, likeCount)}
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
      </motion.div>

      <SingleRecommendSection
        hotpickAlias={hotpickAlias}
        relatedHotpicks={rawData.relatedHotpicks}
      />

      <InlineCommentSection
        slug={hotpickAlias}
        electionId={electionId}
        voted={voted}
        isClosed={isExpired}
        commentCount={commentCount}
      />

      {/* NOTE: 카카오 공유하기 바텀시트 비활성화 (코드 보존) */}
      {/* <ShareBottomSheet
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        hotpickAlias={hotpickAlias}
        title={title}
        options={items.map((item) => item.title ?? '')}
        imageUrl={election.imageUrl ?? hotpickCard.imageUrl}
      /> */}
    </div>
  );
};
