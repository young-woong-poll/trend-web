'use client';

import { useState, type FC, type ReactNode } from 'react';

import { useRouter } from 'next/navigation';

import { useQueries, useQuery } from '@tanstack/react-query';

import { ProgressBar } from '@/components/common/ProgressBar';
import { CommentBottomSheet } from '@/components/features/Vote/CommentModal';
import { VoteBottomButtons } from '@/components/features/Vote/VoteBottomButtons';
import { VoteCard } from '@/components/features/Vote/VoteCard';
import { VoteHeader } from '@/components/features/Vote/VoteHeader';
import styles from '@/components/features/Vote/VoteView.module.scss';
import type { DisplayTrendDetailResponse } from '@/generated/models';
import { commentQueries } from '@/hooks/api/useComment';
import { displayQueries } from '@/hooks/api/useDisplay';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useVoteSubmission } from '@/hooks/useVoteSubmission';

type TItemId = string;
type TOptionId = string;
export type TSelectedItemMap = Record<TItemId, TOptionId | null>;

type VoteViewProps = {
  trendAlias: string;
  initialData?: DisplayTrendDetailResponse;
  children: ReactNode;
};

const DEFAULT_NUM_OF_ITEMS = 5;

export const VoteView: FC<VoteViewProps> = ({ trendAlias, initialData, children }) => {
  const router = useRouter();

  const { data: trendData } = useQuery({
    ...displayQueries.trend(trendAlias),
    initialData,
  });

  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [selectedItemMap, setSelectedItemMap] = useState<TSelectedItemMap>({});

  const [selectedItemForComment, setSelectedItemForComment] = useState<string | null>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

  const { submit } = useVoteSubmission();
  const handleError = useErrorHandler();

  const items = trendData?.items ?? [];
  const trendId = trendData?.trendId;

  // 모든 아이템의 댓글 수를 한 번에 가져오기
  const commentCountQueries = useQueries({
    queries: items.map((item) => ({
      ...commentQueries.count(Number(trendId), item.id ?? ''),
      enabled: !!trendId,
    })),
  });

  // itemId를 키로 하는 댓글 수 맵 생성
  const commentCountMap = items.reduce<Record<string, number | undefined>>((acc, item, index) => {
    acc[item.id ?? ''] = commentCountQueries[index]?.data?.count;
    return acc;
  }, {});

  // HydrationBoundary로 prefetch되어 있으므로 trendData는 항상 존재
  if (!trendData || !trendId || !trendData.alias || !items.length) {
    return null;
  }

  const { alias, title } = trendData;

  const handleSubmit = async () => {
    try {
      const resultId = await submit(String(trendId), selectedItemMap, items.length);

      return router.replace(`/vote/${alias}/result?id=${resultId}`);
    } catch (err) {
      handleError(err);
    }
  };

  const handleNext = async () => {
    if (currentItemIndex < items.length - 1) {
      setCurrentItemIndex((prev) => prev + 1);

      return;
    }

    await handleSubmit();
  };

  const handleOpenCommentModal = (itemId: string) => {
    setSelectedItemForComment(itemId);
    setIsCommentModalOpen(true);
  };

  const handleCloseCommentModal = () => {
    setIsCommentModalOpen(false);
    setSelectedItemForComment(null);
  };

  return (
    <>
      {/* 서버에서 생성된 정적 HTML (SEO용) - children은 서버에서 렌더링됨 */}
      <noscript>{children}</noscript>

      <div className={styles.container}>
        <VoteHeader title={title ?? ''} />

        <ProgressBar
          currentStep={currentItemIndex}
          totalSteps={items.length || DEFAULT_NUM_OF_ITEMS}
        />

        <div className={styles.contentWrapper}>
          <div
            className={styles.content}
            style={{
              transform: `translateX(calc(-${currentItemIndex} * 100%))`,
            }}
          >
            {items.length > 0 &&
              items.map((item) => {
                const itemId = item.id ?? '';
                const selectedOptionId = selectedItemMap[itemId] || null;

                const handleOptionSelect = (optionId: string) => {
                  setSelectedItemMap((prev) => ({
                    ...prev,
                    [itemId]: optionId,
                  }));
                };

                return (
                  <div key={itemId} className={styles.cardContainer}>
                    <VoteCard
                      trendAlias={alias}
                      itemId={itemId}
                      title={item.title ?? ''}
                      options={item.options ?? []}
                      selectedOptionId={selectedOptionId}
                      handleOptionSelect={handleOptionSelect}
                    />

                    <VoteBottomButtons
                      commentCount={commentCountMap[itemId]}
                      commentDisabled={selectedOptionId === null}
                      nextDisabled={selectedOptionId === null}
                      onCommentClick={() => handleOpenCommentModal(itemId)}
                      onNextClick={handleNext}
                    />
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* 댓글 바텀시트 */}
      {selectedItemForComment && (
        <CommentBottomSheet
          isOpen={isCommentModalOpen}
          onClose={handleCloseCommentModal}
          trendId={String(trendId)}
          itemId={selectedItemForComment}
          trendAlias={alias}
        />
      )}
    </>
  );
};
