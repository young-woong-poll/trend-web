'use client';

import { useState, type FC, type ReactNode } from 'react';

import { useRouter } from 'next/navigation';

import { useQueries, useQuery } from '@tanstack/react-query';

import { ProgressBar } from '@/components/common/ProgressBar';
import { CommentBottomSheet } from '@/components/features/Hotpick/CommentModal';
import { VoteBottomButtons } from '@/components/features/Hotpick/VoteBottomButtons';
import { VoteCard } from '@/components/features/Hotpick/VoteCard';
import { VoteHeader } from '@/components/features/Hotpick/VoteHeader';
import styles from '@/components/features/Hotpick/VoteView.module.scss';
import type { DisplayTrendDetailResponse } from '@/generated/models';
import { commentQueries } from '@/hooks/api/useComment';
import { displayQueries } from '@/hooks/api/useDisplay';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useHotpickSubmission } from '@/hooks/useVoteSubmission';

type TElectionId = string;
type TOptionId = string;
export type TSelectedElectionMap = Record<TElectionId, TOptionId | null>;

type HotpickViewProps = {
  hotpickAlias: string;
  initialData?: DisplayTrendDetailResponse;
  children: ReactNode;
};

const DEFAULT_NUM_OF_ELECTIONS = 5;

export const HotpickView: FC<HotpickViewProps> = ({ hotpickAlias, initialData, children }) => {
  const router = useRouter();

  const { data: hotpickData } = useQuery({
    ...displayQueries.hotpick(hotpickAlias),
    initialData,
  });

  const [currentElectionIndex, setCurrentElectionIndex] = useState(0);
  const [selectedElectionMap, setSelectedElectionMap] = useState<TSelectedElectionMap>({});

  const [selectedElectionForComment, setSelectedElectionForComment] = useState<string | null>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { submit } = useHotpickSubmission();
  const handleError = useErrorHandler();

  const elections = hotpickData?.items ?? [];
  const hotpickId = hotpickData?.trendId;

  // 모든 아이템의 댓글 수를 한 번에 가져오기
  const commentCountQueries = useQueries({
    queries: elections.map((election) => ({
      ...commentQueries.count(Number(hotpickId), election.id ?? ''),
      enabled: !!hotpickId,
    })),
  });

  // electionId를 키로 하는 댓글 수 맵 생성
  const commentCountMap = elections.reduce<Record<string, number | undefined>>(
    (acc, election, index) => {
      acc[election.id ?? ''] = commentCountQueries[index]?.data?.count;
      return acc;
    },
    {}
  );

  // HydrationBoundary로 prefetch되어 있으므로 hotpickData는 항상 존재
  if (!hotpickData || !hotpickId || !hotpickData.alias || !elections.length) {
    return null;
  }

  const { alias, title } = hotpickData;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const resultId = await submit(String(hotpickId), selectedElectionMap, elections.length);

      return router.replace(`/hotpick/${alias}/result?id=${resultId}`);
    } catch (err) {
      setIsSubmitting(false);
      handleError(err);
    }
  };

  const handleNext = async () => {
    if (currentElectionIndex < elections.length - 1) {
      setCurrentElectionIndex((prev) => prev + 1);

      return;
    }

    await handleSubmit();
  };

  const handleOpenCommentModal = (electionId: string) => {
    setSelectedElectionForComment(electionId);
    setIsCommentModalOpen(true);
  };

  const handleCloseCommentModal = () => {
    setIsCommentModalOpen(false);
    setSelectedElectionForComment(null);
  };

  return (
    <>
      {/* 서버에서 생성된 정적 HTML (SEO용) - children은 서버에서 렌더링됨 */}
      <noscript>{children}</noscript>

      <div className={styles.container}>
        <VoteHeader title={title ?? ''} />

        <ProgressBar
          currentStep={currentElectionIndex}
          totalSteps={elections.length || DEFAULT_NUM_OF_ELECTIONS}
        />

        <div className={styles.contentWrapper}>
          <div
            className={styles.content}
            style={{
              transform: `translateX(calc(-${currentElectionIndex} * 100%))`,
            }}
          >
            {elections.length > 0 &&
              elections.map((election) => {
                const electionId = election.id ?? '';
                const selectedOptionId = selectedElectionMap[electionId] || null;

                const handleOptionSelect = (optionId: string) => {
                  setSelectedElectionMap((prev) => ({
                    ...prev,
                    [electionId]: optionId,
                  }));
                };

                return (
                  <div key={electionId} className={styles.cardContainer}>
                    <VoteCard
                      hotpickAlias={alias}
                      electionId={electionId}
                      title={election.title ?? ''}
                      options={election.options ?? []}
                      selectedOptionId={selectedOptionId}
                      handleOptionSelect={handleOptionSelect}
                    />

                    <VoteBottomButtons
                      commentCount={commentCountMap[electionId]}
                      commentDisabled={selectedOptionId === null}
                      nextDisabled={selectedOptionId === null}
                      isSubmitting={isSubmitting}
                      onCommentClick={() => handleOpenCommentModal(electionId)}
                      onNextClick={handleNext}
                    />
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* 댓글 바텀시트 */}
      {selectedElectionForComment && (
        <CommentBottomSheet
          isOpen={isCommentModalOpen}
          onClose={handleCloseCommentModal}
          hotpickId={String(hotpickId)}
          electionId={selectedElectionForComment}
          hotpickAlias={alias}
        />
      )}
    </>
  );
};
