'use client';

import { useState, type FC, type ReactNode } from 'react';

import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import StartArrowIcon from '@/assets/icon/StartArrowIcon';
import { ProgressBar } from '@/components/common/ProgressBar';
import { CommentBottomSheet } from '@/components/features/Hotpick/CommentModal';
import { VoteCard } from '@/components/features/Hotpick/VoteCard';
import styles from '@/components/features/Hotpick/VoteView.module.scss';
import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';
import type { HotpickDetailResponse } from '@/generated/models';
import { displayQueries } from '@/hooks/api/useDisplay';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useHotpickSubmission } from '@/hooks/useVoteSubmission';

type TElectionId = string;
type TOptionId = string;
export type TSelectedElectionMap = Record<TElectionId, TOptionId | null>;

type HotpickViewProps = {
  hotpickAlias: string;
  initialData?: HotpickDetailResponse;
  children: ReactNode;
};

const DEFAULT_NUM_OF_ELECTIONS = 5;

/**
 * BUNDLE 핫픽 투표 뷰 — BE 개발 보류로 현재 스텁 상태
 */
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

  const hotpickCard = hotpickData?.hotpick;
  const election = hotpickCard?.election;
  // BUNDLE은 현재 지원되지 않으므로 빈 배열
  const elections = election ? [election] : [];
  const hotpickId = hotpickCard?.hotpickId;
  const slug = hotpickCard?.slug ?? hotpickAlias;
  const isExpired = hotpickCard?.expiredAt ? new Date(hotpickCard.expiredAt) < new Date() : false;
  const isClosed = isExpired;

  if (!hotpickData || !hotpickId || !slug || !elections.length) {
    return null;
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const resultId = await submit(String(hotpickId), selectedElectionMap, elections.length);

      return router.replace(`/hotpick/${slug}/result?id=${resultId}`);
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
      {/* 서버에서 생성된 정적 HTML (SEO용) */}
      <noscript>{children}</noscript>

      <div className={styles.container}>
        <div className={styles.headerRow}>
          <MainHeader />
        </div>

        {isClosed && <p className={styles.closedNotice}>마감된 투표입니다</p>}

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
            {elections.map((elec) => {
              const electionId = String(elec.electionId ?? '');
              const selectedOptionId = selectedElectionMap[electionId] || null;
              const options = (elec.items ?? []).map((item) => ({
                id:
                  item.electionItemId !== null && item.electionItemId !== undefined
                    ? String(item.electionItemId)
                    : undefined,
                title: item.title,
                imageUrl: item.imageUrl,
              }));

              // voteType 추론
              const hasImages = (elec.items ?? []).some((item) => !!item.imageUrl);
              const voteType = hasImages ? ('IMAGE' as const) : ('TEXT' as const);

              const handleOptionSelect = (optionId: string) => {
                if (isClosed) {
                  return;
                }
                setSelectedElectionMap((prev) => ({
                  ...prev,
                  [electionId]: optionId,
                }));
              };

              return (
                <div key={electionId} className={styles.cardContainer}>
                  <VoteCard
                    hotpickAlias={slug}
                    electionId={electionId}
                    title={elec.title ?? ''}
                    options={options}
                    selectedOptionId={selectedOptionId}
                    handleOptionSelect={handleOptionSelect}
                    voteType={voteType}
                    mainImageUrl={!hasImages ? (elec.imageUrl ?? hotpickCard?.imageUrl) : undefined}
                    commentCount={elec.totalCommentCount}
                    commentDisabled={selectedOptionId === null}
                    onCommentClick={() => handleOpenCommentModal(electionId)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 하단 고정 다음 버튼 */}
      <div className={styles.fixedBottom}>
        <button
          type="button"
          className={styles.nextButton}
          onClick={handleNext}
          disabled={
            !selectedElectionMap[String(elections[currentElectionIndex]?.electionId ?? '')] ||
            isSubmitting
          }
        >
          {isSubmitting ? (
            <div className={styles.loadingDots}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </div>
          ) : (
            <>
              다음
              <StartArrowIcon />
            </>
          )}
        </button>
      </div>

      {/* 댓글 바텀시트 */}
      {selectedElectionForComment && (
        <CommentBottomSheet
          isOpen={isCommentModalOpen}
          onClose={handleCloseCommentModal}
          slug={slug}
          electionId={selectedElectionForComment}
        />
      )}
    </>
  );
};
