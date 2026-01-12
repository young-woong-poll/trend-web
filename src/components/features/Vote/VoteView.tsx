'use client';

import { useState, type FC, type ReactNode } from 'react';

import { useRouter } from 'next/navigation';

import { ProgressBar } from '@/components/common/ProgressBar';
import { CommentBottomSheet } from '@/components/features/Vote/CommentModal';
import { VoteBottomButtons } from '@/components/features/Vote/VoteBottomButtons';
import { VoteCard } from '@/components/features/Vote/VoteCard';
import { VoteHeader } from '@/components/features/Vote/VoteHeader';
import styles from '@/components/features/Vote/VoteView.module.scss';
import { useCommentCountQuery } from '@/hooks/api/useComment';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useVoteSubmission } from '@/hooks/useVoteSubmission';
import type { TrendDisplayResponse } from '@/types/trend';

type TItemId = string;
type TOptionId = string;
export type TSelectedItemMap = Record<TItemId, TOptionId | null>;

type VoteContentClientProps = {
  trendData: TrendDisplayResponse;
  children: ReactNode;
};

const DEFAULT_NUM_OF_ITEMS = 5;

export const VoteView: FC<VoteContentClientProps> = ({ trendData, children }) => {
  const router = useRouter();

  const { trendId, alias, items } = trendData;

  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [selectedItemMap, setSelectedItemMap] = useState<TSelectedItemMap>({});

  const [selectedItemForComment, setSelectedItemForComment] = useState<string | null>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

  const { submit } = useVoteSubmission();
  const handleError = useErrorHandler();

  const handleSubmit = async () => {
    try {
      const resultId = await submit(trendId, selectedItemMap, items.length);

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
        <VoteHeader title={trendData.title} />

        <ProgressBar
          currentStep={currentItemIndex}
          totalSteps={items.length || DEFAULT_NUM_OF_ITEMS}
        />

        <div
          className={styles.content}
          style={{
            transform: `translateX(calc(-${currentItemIndex} * 100%))`,
          }}
        >
          {items.length > 0 &&
            items.map((item) => {
              const selectedOptionId = selectedItemMap[item.id] || null;

              const handleOptionSelect = (optionId: string) => {
                setSelectedItemMap((prev) => ({
                  ...prev,
                  [item.id]: optionId,
                }));
              };

              // eslint-disable-next-line react-hooks/rules-of-hooks
              const { data: commentCountData } = useCommentCountQuery(trendId, item.id);

              return (
                <div key={item.id} className={styles.cardContainer}>
                  <VoteCard
                    trendAlias={trendData.alias}
                    itemId={item.id}
                    title={item.title}
                    options={item.options}
                    selectedOptionId={selectedOptionId}
                    handleOptionSelect={handleOptionSelect}
                  />

                  <VoteBottomButtons
                    commentCount={commentCountData?.count}
                    commentDisabled={selectedOptionId === null}
                    nextDisabled={selectedOptionId === null}
                    onCommentClick={() => handleOpenCommentModal(item.id)}
                    onNextClick={handleNext}
                  />
                </div>
              );
            })}
        </div>
      </div>

      {/* 댓글 바텀시트 */}
      {selectedItemForComment && (
        <CommentBottomSheet
          isOpen={isCommentModalOpen}
          onClose={handleCloseCommentModal}
          trendId={trendId}
          itemId={selectedItemForComment}
          trendAlias={alias}
        />
      )}
    </>
  );
};
