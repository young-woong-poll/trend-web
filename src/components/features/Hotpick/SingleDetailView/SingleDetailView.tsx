'use client';

import { useCallback, useRef, useState, type FC } from 'react';

import Image from 'next/image';

import { isAxiosError } from 'axios';
import { AnimatePresence, motion } from 'framer-motion';

import CheckIcon from '@/assets/icon/CheckIcon';
import LinkIcon from '@/assets/icon/LinkIcon';
import { Button } from '@/components/common/Button';
import { DeadlineBadge } from '@/components/common/DeadlineBadge';
import { InlineCommentSection } from '@/components/features/Hotpick/SingleDetailView/InlineCommentSection';
import styles from '@/components/features/Hotpick/SingleDetailView/SingleDetailView.module.scss';
import { SingleRecommendSection } from '@/components/features/Hotpick/SingleDetailView/SingleRecommendSection';
import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';
import {
  buttonTapVariants,
  barFillVariants,
  fadeInVariants,
} from '@/components/features/Main/SingleCard/voteAnimations';
import { useModal } from '@/contexts/ModalContext';
import { vote } from '@/generated/api/client/hotpick/hotpick';
import type { HotpickDetailResponse, VoteResultResponse } from '@/generated/models';
import { useHotpickDetail } from '@/hooks/api/useDisplay';
import { getTKUID } from '@/lib/tkuid';
import type { VoteType } from '@/types/election';
import {
  calcPercentage,
  OPTION_LABELS,
  type SingleVoteData,
  electionToSingleVoteData,
  voteResultToSingleVoteData,
} from '@/types/singleVote';

interface SingleDetailViewProps {
  hotpickAlias: string;
  initialData?: HotpickDetailResponse;
}

const formatCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

export const SingleDetailView: FC<SingleDetailViewProps> = ({ hotpickAlias, initialData }) => {
  const { data: queryData } = useHotpickDetail(hotpickAlias);
  const { showToast } = useModal();

  const rawData = queryData ?? initialData;
  const hotpickCard = rawData?.hotpick;
  const election = hotpickCard?.election;

  // 투표 상태 로컬 관리
  const [singleVote, setSingleVote] = useState<SingleVoteData>(() => {
    if (election) {
      return electionToSingleVoteData(election);
    }
    return { electionId: '', options: [], voted: false, myChoiceId: null, totalVotes: null };
  });

  const pendingRef = useRef(false);
  const tkuIdRef = useRef(getTKUID());

  const title = election?.title ?? '';
  // voteType 추론: election items에 imageUrl이 있으면 IMAGE
  const hasOptionImages = (election?.items ?? []).some((item) => !!item.imageUrl);
  const voteType: VoteType = hasOptionImages ? 'IMAGE' : 'TEXT';
  const isImageType = voteType === 'IMAGE';
  const isExpired = hotpickCard?.expiredAt ? new Date(hotpickCard.expiredAt) < new Date() : false;
  const isClosed = isExpired;
  const logoUrl = !isImageType ? (election?.imageUrl ?? hotpickCard?.imageUrl) : undefined;
  const categories: string[] = (hotpickCard?.categories ?? []).map((c) => c.name ?? '');
  const participantCount = singleVote.totalVotes ?? election?.totalVoteCount ?? 0;
  const commentCount = election?.totalCommentCount ?? 0;

  const showResult = singleVote.voted || isClosed;
  const total = singleVote.totalVotes ?? 0;
  const buttonGroupClass =
    singleVote.options.length === 2 ? styles.buttonGroupTwo : styles.buttonGroupMulti;

  // ── 투표 핸들러 ──
  const handleVote = useCallback(
    async (optionId: string) => {
      if (isClosed || singleVote.voted || pendingRef.current) {
        return;
      }

      // 낙관적 업데이트
      const optimisticOptions = singleVote.options.map((opt) => ({
        ...opt,
        voteCount: opt.id === optionId ? (opt.voteCount ?? 0) + 1 : (opt.voteCount ?? 0),
      }));
      const optimisticTotal = optimisticOptions.reduce((sum, opt) => sum + (opt.voteCount ?? 0), 0);

      const prevVote = singleVote;
      setSingleVote({
        ...singleVote,
        options: optimisticOptions,
        voted: true,
        myChoiceId: optionId,
        totalVotes: optimisticTotal,
      });

      pendingRef.current = true;

      try {
        const result = await vote(
          hotpickAlias,
          { electionItemId: Number(optionId) },
          { headers: { 'x-tku-id': tkuIdRef.current } }
        );

        if (result) {
          const voteResult = result as unknown as VoteResultResponse;
          setSingleVote((prev) => voteResultToSingleVoteData(prev, voteResult));
        }
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 409) {
          const responseData = error.response.data?.data as VoteResultResponse | undefined;
          if (responseData) {
            setSingleVote((prev) => voteResultToSingleVoteData(prev, responseData));
          }
          return;
        }
        // 롤백
        setSingleVote(prevVote);
      } finally {
        pendingRef.current = false;
      }
    },
    [singleVote, isClosed, hotpickAlias]
  );

  // ── 공유 핸들러 ──
  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/hotpick/${hotpickAlias}`;
    void navigator.clipboard.writeText(url).then(() => {
      showToast('링크가 복사되었습니다', <CheckIcon width={16} height={16} />);
    });
  }, [hotpickAlias, showToast]);

  if (!rawData || !hotpickCard || !election) {
    return null;
  }

  return (
    <div className={styles.container}>
      <MainHeader />

      {/* 투표 카드 */}
      <motion.div
        className={styles.voteCard}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* 상단: 카테고리 + 마감 배지 */}
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

        {/* 질문 */}
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

        {/* 투표 영역 */}
        <div className={styles.voteArea}>
          <AnimatePresence mode="wait">
            {!showResult ? (
              <motion.div
                key="buttons"
                className={buttonGroupClass}
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              >
                {singleVote.options.map((option, i) => (
                  <motion.button
                    key={option.id}
                    className={styles.optionButton}
                    onClick={() => handleVote(option.id)}
                    variants={buttonTapVariants}
                    whileTap="tap"
                    disabled={isClosed}
                  >
                    {isImageType && option.imageUrl && (
                      <Image
                        src={option.imageUrl}
                        alt={option.text}
                        width={28}
                        height={28}
                        className={styles.optionImage}
                      />
                    )}
                    <span className={styles.optionLabel}>{OPTION_LABELS[i]}</span>
                    <span className={styles.optionText}>{option.text}</span>
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
                {singleVote.options.map((option, i) => {
                  const isSelected = singleVote.myChoiceId === option.id;
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

        {/* 메타 정보 */}
        <div className={styles.metaRow}>
          <span className={styles.participants}>{formatCount(participantCount)}명 참여</span>
          {hotpickCard.expiredAt && (
            <>
              <span className={styles.dot} />
              <DeadlineBadge deadline={hotpickCard.expiredAt} compact />
            </>
          )}
        </div>

        {/* 공유 CTA */}
        <div className={styles.shareCta}>
          {showResult ? (
            <Button variant="gradient" fullWidth height={48} onClick={handleShare}>
              <LinkIcon />
              투표 공유하기
            </Button>
          ) : (
            <div className={styles.voteHint}>
              <span className={styles.voteHintText}>투표하고 결과 확인하기</span>
              <span className={styles.voteHintArrow}>▲</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* 추천 섹션 */}
      <SingleRecommendSection
        hotpickAlias={hotpickAlias}
        relatedHotpicks={rawData.relatedHotpicks}
      />

      {/* 인라인 댓글 섹션 (가장 마지막 — 무한 확장 가능) */}
      <InlineCommentSection
        hotpickId={String(hotpickCard.hotpickId ?? '')}
        electionId={singleVote.electionId}
        voted={singleVote.voted}
        isClosed={isClosed}
        commentCount={commentCount}
      />
    </div>
  );
};
