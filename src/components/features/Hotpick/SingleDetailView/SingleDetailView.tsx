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
import type { DisplayTrendDetailResponse } from '@/generated/models';
import { useCommentCount } from '@/hooks/api/useComment';
import { useHotpickDetail } from '@/hooks/api/useDisplay';
import axiosInstance from '@/lib/axios';
import { getTKUID } from '@/lib/tkuid';
import type { ExtendedHotpickDetail, ExtendedElectionItem } from '@/types/display';
import type { VoteType } from '@/types/election';
import {
  calcPercentage,
  OPTION_LABELS,
  type SingleVoteData,
  type SingleVoteResponse,
} from '@/types/singleVote';

interface SingleDetailViewProps {
  hotpickAlias: string;
  initialData?: DisplayTrendDetailResponse;
}

const formatCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

/**
 * 상세 데이터(election)에서 SingleVoteData를 구성
 */
const buildSingleVoteData = (election: ExtendedElectionItem): SingleVoteData => ({
  electionId: String(election.id),
  options: (election.options ?? []).map((opt) => ({
    id: String(opt.id),
    text: opt.title ?? '',
    imageUrl: opt.imageUrl,
    voteCount: null,
  })),
  voted: false,
  myChoiceId: null,
  totalVotes: null,
});

export const SingleDetailView: FC<SingleDetailViewProps> = ({ hotpickAlias, initialData }) => {
  const { data: queryData } = useHotpickDetail(hotpickAlias);
  const { showToast } = useModal();

  const rawData = (queryData ?? initialData) as ExtendedHotpickDetail | null;
  const election = rawData?.items?.[0] as ExtendedElectionItem | undefined;

  // 투표 상태 로컬 관리
  const [singleVote, setSingleVote] = useState<SingleVoteData>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingVote = (rawData as any)?.singleVote;
    if (existingVote) {
      return existingVote as SingleVoteData;
    }
    if (election) {
      return buildSingleVoteData(election);
    }
    return { electionId: '', options: [], voted: false, myChoiceId: null, totalVotes: null };
  });

  const pendingRef = useRef(false);
  const tkuIdRef = useRef(getTKUID());

  const hotpickId = String(rawData?.trendId ?? '');
  const title = election?.title ?? rawData?.title ?? '';
  const voteType = (election?.voteType ?? 'TEXT') as VoteType;
  const isImageType = voteType === 'IMAGE';
  const isClosed = rawData?.status === 'CLOSED';
  const logoUrl = !isImageType ? (election?.mainImageUrl ?? rawData?.imageUrls?.[0]) : undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categories: string[] = (rawData as any)?.categoryCodes ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const participantCount =
    singleVote.totalVotes ?? ((rawData as any)?.participantsCount as number) ?? 0;

  const { data: commentCountData } = useCommentCount(
    Number(rawData?.trendId ?? 0),
    singleVote.electionId
  );

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
        const { data } = await axiosInstance.post<SingleVoteResponse>(
          `/api/v1/single/${hotpickId}/vote`,
          { optionId },
          { headers: { 'x-tku-id': tkuIdRef.current } }
        );

        if (data) {
          setSingleVote((prev) => ({
            ...prev,
            options: prev.options.map((opt) => {
              const sc = data.optionCounts.find((c) => c.id === opt.id);
              return { ...opt, voteCount: sc?.count ?? opt.voteCount };
            }),
            voted: true,
            myChoiceId: data.myChoiceId,
            totalVotes: data.totalVotes,
          }));
        }
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 409) {
          const responseData = error.response.data?.data as SingleVoteResponse | undefined;
          if (responseData) {
            setSingleVote((prev) => ({
              ...prev,
              options: prev.options.map((opt) => {
                const sc = responseData.optionCounts.find((c) => c.id === opt.id);
                return { ...opt, voteCount: sc?.count ?? opt.voteCount };
              }),
              voted: true,
              myChoiceId: responseData.myChoiceId,
              totalVotes: responseData.totalVotes,
            }));
          }
          return;
        }
        // 롤백
        setSingleVote(prevVote);
      } finally {
        pendingRef.current = false;
      }
    },
    [singleVote, isClosed, hotpickId]
  );

  // ── 공유 핸들러 ──
  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/hotpick/${hotpickAlias}`;
    void navigator.clipboard.writeText(url).then(() => {
      showToast('링크가 복사되었습니다', <CheckIcon width={16} height={16} />);
    });
  }, [hotpickAlias, showToast]);

  if (!rawData || !election) {
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
          {rawData.deadline && (
            <div className={styles.deadlineArea}>
              <DeadlineBadge deadline={rawData.deadline} compact />
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
          {rawData.deadline && (
            <>
              <span className={styles.dot} />
              <DeadlineBadge deadline={rawData.deadline} compact />
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
      <SingleRecommendSection hotpickAlias={hotpickAlias} categoryCode={categories[0]} />

      {/* 인라인 댓글 섹션 (가장 마지막 — 무한 확장 가능) */}
      <InlineCommentSection
        hotpickId={hotpickId}
        electionId={singleVote.electionId}
        voted={singleVote.voted}
        isClosed={isClosed}
        commentCount={commentCountData?.count}
      />
    </div>
  );
};
