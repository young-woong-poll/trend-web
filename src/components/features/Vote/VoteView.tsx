'use client';

import { useState, type FC } from 'react';

import CheckIcon from '@/assets/icon/CheckIcon';
import InfoIcon from '@/assets/icon/InfoIcon';
import StartArrowIcon from '@/assets/icon/StartArrowIcon';
import { Button } from '@/components/common/Button';
import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Toast } from '@/components/common/Toast';
import { ActionButtons } from '@/components/features/Vote/ActionButtons';
import { VoteCard } from '@/components/features/Vote/VoteCard';
import styles from '@/components/features/Vote/VoteView.module.scss';
import { useTrendDisplay, useTrendVoteCount } from '@/hooks/api';
import { useToast } from '@/hooks/useToast';

type TVoteViewProps = {
  type: string;
};

const DEFAULT_NUM_OF_ITEMS = 5;

export const VoteView: FC<TVoteViewProps> = ({ type }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string | null>>({});
  const { toast, showToast, hideToast } = useToast();

  const { data: { items = [] } = {} } = useTrendDisplay(type);
  const { data: voteCountMap = {} } = useTrendVoteCount(type);

  console.log('items : ', items);
  console.log('voteCountMap : ', voteCountMap);

  const handleOptionSelect = (cardId: string, optionId: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [cardId]: optionId,
    }));
  };

  const handleNext = () => {
    if (currentCardIndex < items.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      // eslint-disable-next-line no-console
      console.log('모든 투표 완료:', selectedOptions);
      // TODO: 결과 페이지로 이동
    }
  };

  const handleCommentClick = () => {
    const currentItem = items[currentCardIndex];
    if (!selectedOptions[currentItem.id]) {
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
      <Toast
        message={toast.message}
        icon={toast.icon}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
      <div className={styles.container}>
        <ProgressBar
          currentStep={currentCardIndex}
          totalSteps={items.length || DEFAULT_NUM_OF_ITEMS}
        />
        <div className={styles.content}>
          {items.length > 0 &&
            items.map((item, index) => (
              <div
                key={item.id}
                className={`${styles.cardContainer} ${
                  index === currentCardIndex ? styles.active : ''
                } ${index < currentCardIndex ? styles.previous : ''} ${
                  index > currentCardIndex ? styles.next : ''
                }`}
              >
                <VoteCard
                  title={item.title}
                  label={item.label}
                  options={item.options}
                  selectedOptionId={selectedOptions[item.id] || null}
                  onOptionSelect={(optionId) => handleOptionSelect(item.id, optionId)}
                  voteCountMap={voteCountMap}
                />

                <Button
                  variant="gradient"
                  height={48}
                  onClick={handleNext}
                  fullWidth
                  className={styles.button}
                  disabled={!selectedOptions[item.id]}
                >
                  다음
                  <StartArrowIcon />
                </Button>

                <ActionButtons
                  commentCount={101}
                  onCommentClick={handleCommentClick}
                  onLinkCopyClick={handleLinkCopyClick}
                  commentDisabled={!selectedOptions[item.id]}
                />
              </div>
            ))}
        </div>
      </div>
    </FlexibleLayout>
  );
};
