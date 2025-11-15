'use client';

import { useState, type FC } from 'react';

import { FlexibleLayout } from '@/components/common/FlexibleLayout/FlexibleLayout';
import { ProgressBar } from '@/components/common/ProgressBar';

import { VoteCard } from './VoteCard';
import styles from './VoteView.module.scss';

type TVoteViewProps = {
  type?: string;
};

interface CardData {
  id: number;
  title: string;
  subtitle: string;
  options: Array<{
    id: number;
    text: string;
    imageUrl: string;
    // TODO : 제거
    show?: boolean;
  }>;
  commentCount: number;
}

// TODO: 실제 데이터는 API에서 가져와야 합니다
const CARDS_DATA: CardData[] = [
  {
    id: 1,
    title: '둘다 붙으면 어디감?',
    subtitle: '투표하면 결과가 나옵니다',
    options: [
      {
        id: 1,
        text: '아름다운 지방 연봉 6천',
        imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
        show: true,
      },
      {
        id: 2,
        text: '서울 연봉 5천',
        imageUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80',
        show: false,
      },
    ],
    commentCount: 101,
  },
  {
    id: 2,
    title: '근무 형태는?',
    subtitle: '투표하면 결과가 나옵니다',
    options: [
      {
        id: 3,
        text: '재택근무',
        imageUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80',
        show: false,
      },
      {
        id: 4,
        text: '출근',
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
        show: true,
      },
    ],
    commentCount: 85,
  },
  {
    id: 3,
    title: '회사 규모는?',
    subtitle: '투표하면 결과가 나옵니다',
    options: [
      {
        id: 5,
        text: '대기업',
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
        show: false,
      },
      {
        id: 6,
        text: '스타트업',
        imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
        show: true,
      },
    ],
    commentCount: 92,
  },
];

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
    const currentCard = CARDS_DATA[currentCardIndex];
    if (!selectedOptions[currentCard.id]) {
      // eslint-disable-next-line no-alert
      alert('옵션을 선택해주세요');
      return;
    }

    if (currentCardIndex < CARDS_DATA.length - 1) {
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
        <ProgressBar currentStep={currentCardIndex + 1} totalSteps={CARDS_DATA.length} />
        <div className={styles.content}>
          {CARDS_DATA.map((card, index) => (
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
