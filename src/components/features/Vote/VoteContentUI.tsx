'use client';

import type { FC } from 'react';

import StartArrowIcon from '@/assets/icon/StartArrowIcon';
import { Button } from '@/components/common/Button';
import { ProgressBar } from '@/components/common/ProgressBar';
import { ActionButtons } from '@/components/features/Vote/ActionButtons';
import { VoteCard } from '@/components/features/Vote/VoteCard';
import { useVoteState } from '@/components/features/Vote/VoteStateManager';
import styles from '@/components/features/Vote/VoteView.module.scss';
import type { TrendItem } from '@/types/trend';

type VoteContentUIProps = {
  items: TrendItem[];
};

const DEFAULT_NUM_OF_ITEMS = 5;

export const VoteContentUI: FC<VoteContentUIProps> = ({ items }) => {
  const {
    currentItemIndex,
    selectedItemMap,
    voteCountMap,
    handleOptionSelect,
    handleNext,
    handleCommentClick,
    handleLinkCopyClick,
  } = useVoteState();

  return (
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
  );
};
