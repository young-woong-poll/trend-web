'use client';

import { useState, type FC, type ReactNode } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import StartArrowIcon from '@/assets/icon/StartArrowIcon';
import { Button } from '@/components/common/Button';
import { ProgressBar } from '@/components/common/ProgressBar';
import { ActionButtons } from '@/components/features/Vote/ActionButtons';
import { NicknameInputModal } from '@/components/features/Vote/NicknameInputModal';
import { VoteCard } from '@/components/features/Vote/VoteCard';
import styles from '@/components/features/Vote/VoteView.module.scss';
import { useModal } from '@/contexts/ModalContext';
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
  const searchParams = useSearchParams();
  const compare = searchParams.get('compare');

  const { trendId, alias, items } = trendData;

  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [selectedItemMap, setSelectedItemMap] = useState<TSelectedItemMap>({});

  const { showModal } = useModal();
  const { submit } = useVoteSubmission();
  const handleError = useErrorHandler();

  const handleSubmit = async (nickname?: string) => {
    try {
      const resultId = await submit(trendId, selectedItemMap, items.length, nickname);

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

  return (
    <>
      {/* 서버에서 생성된 정적 HTML (SEO용) - children은 서버에서 렌더링됨 */}
      <noscript>{children}</noscript>

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
            items.map((item) => {
              const selectedOptionId = selectedItemMap[item.id] || null;

              const handleOptionSelect = (optionId: string) => {
                setSelectedItemMap((prev) => ({
                  ...prev,
                  [item.id]: optionId,
                }));
              };

              return (
                <div key={item.id} className={styles.cardContainer}>
                  <VoteCard
                    trendAlias={trendData.alias}
                    itemId={item.id}
                    title={item.title}
                    label={item.label}
                    options={item.options}
                    selectedOptionId={selectedOptionId}
                    handleOptionSelect={handleOptionSelect}
                  />

                  <Button
                    variant="gradient"
                    height={48}
                    fullWidth
                    className={styles.button}
                    onClick={handleNext}
                    disabled={selectedOptionId === null}
                  >
                    다음
                    <StartArrowIcon />
                  </Button>

                  <ActionButtons commentDisabled={selectedOptionId === null} />
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
};
