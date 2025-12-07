'use client';

import { type FC, type ReactNode } from 'react';

import StartArrowIcon from '@/assets/icon/StartArrowIcon';
import { Button } from '@/components/common/Button';
import { ProgressBar } from '@/components/common/ProgressBar';
import { ActionButtons } from '@/components/features/Vote/ActionButtons';
import { VoteCard } from '@/components/features/Vote/VoteCard';
import { VoteStateManager, useVoteState } from '@/components/features/Vote/VoteStateManager';
import styles from '@/components/features/Vote/VoteView.module.scss';
import type { TrendDisplayResponse } from '@/types/trend';

type VoteContentClientProps = {
  initialTrendData: TrendDisplayResponse;
  trendId: string;
  children: ReactNode; // 서버에서 렌더링된 정적 HTML을 children으로 받음
};

const DEFAULT_NUM_OF_ITEMS = 5;

const VoteContentInteractive: FC = () => {
  const {
    currentItemIndex,
    selectedItemMap,
    voteCountMap,
    handleOptionSelect,
    handleNext,
    handleCommentClick,
    handleLinkCopyClick,
  } = useVoteState();

  const items = useVoteState().items;

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

export const VoteContentClient: FC<VoteContentClientProps> = ({
  initialTrendData,
  trendId,
  children, // 서버에서 렌더링된 정적 HTML
}) => {
  const items = initialTrendData.items;

  return (
    <VoteStateManager trendId={trendId} items={items}>
      {/* 서버에서 생성된 정적 HTML (SEO용) - children은 서버에서 렌더링됨 */}
      <noscript>{children}</noscript>

      {/* 클라이언트 인터랙티브 버전 */}
      <VoteContentInteractive />
    </VoteStateManager>
  );
};
