'use client';

import { useState, type FC } from 'react';

import { useSearchParams } from 'next/navigation';

import CheckIcon from '@/assets/icon/CheckIcon';
import InfoIcon from '@/assets/icon/InfoIcon';
import StartArrowIcon from '@/assets/icon/StartArrowIcon';
import { Button } from '@/components/common/Button';
import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import { ProgressBar } from '@/components/common/ProgressBar';
import { ActionButtons } from '@/components/features/Vote/ActionButtons';
import { NicknameInputModal } from '@/components/features/Vote/NicknameInputModal';
import { VoteCard } from '@/components/features/Vote/VoteCard';
import styles from '@/components/features/Vote/VoteView.module.scss';
import { useModal } from '@/contexts/ModalContext';
import { useTrendDisplay, useTrendVoteCount } from '@/hooks/api';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useVoteSubmission } from '@/hooks/useVoteSubmission';

type TVoteViewProps = {
  trendId: string;
};

type TItemId = string;
type TOptionId = string;
export type TSelectedItemMap = Record<TItemId, TOptionId | null>;

const DEFAULT_NUM_OF_ITEMS = 5;

export const VoteView: FC<TVoteViewProps> = ({ trendId }) => {
  const searchParams = useSearchParams();

  const compare = searchParams.get('compare');

  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [selectedItemMap, setSelectedItemMap] = useState<TSelectedItemMap>({});
  const { showToast, showModal } = useModal();

  const { data: { items = [] } = {} } = useTrendDisplay(trendId);
  const { data: voteCountMap = {} } = useTrendVoteCount(trendId);

  const { submit } = useVoteSubmission();
  const handleError = useErrorHandler();

  const handleOptionSelect = (itemId: string, optionId: string) => {
    setSelectedItemMap((prev) => ({
      ...prev,
      [itemId]: optionId,
    }));
  };

  const handleNext = async () => {
    if (currentItemIndex < items.length - 1) {
      setCurrentItemIndex((prev) => prev + 1);

      return;
    }

    if (!!compare) {
      showModal(
        <NicknameInputModal
          onSubmit={(nickname) => handleSubmit(nickname)}
          onSkip={() => handleSubmit()}
        />
      );

      return;
    }

    await handleSubmit();
  };

  const handleSubmit = async (nickname?: string) => {
    try {
      await submit(selectedItemMap, items.length, nickname);
    } catch (err) {
      handleError(err);
    }
  };

  const handleCommentClick = () => {
    const currentItem = items[currentItemIndex];

    if (!selectedItemMap[currentItem.id]) {
      showToast('투표하면 댓글을 확인할 수 있습니다', <InfoIcon />);

      return;
    }
    // eslint-disable-next-line no-console
    console.log('댓글 버튼 클릭');
  };

  const handleLinkCopyClick = async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      showToast('투표 링크가 복사되었습니다', <CheckIcon />);
    } catch (_error) {
      showToast('링크 복사에 실패했습니다', <InfoIcon />);
    }
  };

  return (
    <FlexibleLayout>
      <div className={styles.container}>
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
            items.map((item) => (
              <div key={item.id} className={styles.cardContainer}>
                <VoteCard
                  title={item.title}
                  label={item.label}
                  options={item.options}
                  selectedOptionId={selectedItemMap[item.id] || null}
                  onOptionSelect={(optionId) => handleOptionSelect(item.id, optionId)}
                  voteCountMap={voteCountMap}
                />

                <Button
                  variant="gradient"
                  height={48}
                  onClick={handleNext}
                  fullWidth
                  className={styles.button}
                  disabled={!selectedItemMap[item.id]}
                >
                  다음
                  <StartArrowIcon />
                </Button>

                <ActionButtons
                  commentCount={101}
                  onCommentClick={handleCommentClick}
                  onLinkCopyClick={handleLinkCopyClick}
                  commentDisabled={!selectedItemMap[item.id]}
                />
              </div>
            ))}
        </div>
      </div>
    </FlexibleLayout>
  );
};
