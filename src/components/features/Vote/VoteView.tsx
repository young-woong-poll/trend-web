'use client';

import { useState, type FC } from 'react';

import { VOTE_DATA } from '@/assets/data/mock';
import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import { ProgressBar } from '@/components/common/ProgressBar';
import { VoteCard } from '@/components/features/Vote/VoteCard';
import styles from '@/components/features/Vote/VoteView.module.scss';

type TVoteViewProps = {
  type?: string;
};

const results = [
  {
    optionId: 1,
    voteCount: 23,
    percentage: 20,
  },
];

export const VoteView: FC<TVoteViewProps> = () => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number | null>>({});

  const handleOptionSelect = (cardId: number, optionId: number) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [cardId]: optionId,
    }));
  };

  const handleNext = () => {
    const currentCard = VOTE_DATA[currentCardIndex];
    if (!selectedOptions[currentCard.id]) {
      // eslint-disable-next-line no-alert
      alert('옵션을 선택해주세요');
      return;
    }

    if (currentCardIndex < VOTE_DATA.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      // eslint-disable-next-line no-console
      console.log('모든 투표 완료:', selectedOptions);
      // TODO: 결과 페이지로 이동
    }
  };

  const handleCommentClick = () => {
    // eslint-disable-next-line no-console
    console.log('댓글 버튼 클릭');
  };

  const handleLinkCopyClick = () => {
    // eslint-disable-next-line no-console
    console.log('링크 복사 버튼 클릭');
  };

  return (
    <FlexibleLayout>
      <div className={styles.container}>
        <ProgressBar currentStep={currentCardIndex + 1} totalSteps={VOTE_DATA.length} />
        <div className={styles.content}>
          {VOTE_DATA.map((card, index) => (
            <div
              key={card.id}
              className={`${styles.cardContainer} ${
                index === currentCardIndex ? styles.active : ''
              } ${index < currentCardIndex ? styles.previous : ''} ${
                index > currentCardIndex ? styles.next : ''
              }`}
            >
              <VoteCard
                title={card.title}
                subtitle={card.subtitle}
                options={card.options}
                selectedOptionId={selectedOptions[card.id] || null}
                onOptionSelect={(optionId) => handleOptionSelect(card.id, optionId)}
                onNext={handleNext}
                onCommentClick={handleCommentClick}
                onLinkCopyClick={handleLinkCopyClick}
                commentCount={card.commentCount}
                results={results}
              />
            </div>
          ))}
        </div>
      </div>
    </FlexibleLayout>
  );
};
