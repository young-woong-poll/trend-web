'use client';

import { useState, type FC } from 'react';

import { ResultVoteOption } from '@/components/features/Vote/ResultVoteOption';
import styles from '@/components/features/Vote/VoteCard/VoteCard.module.scss';
import { VoteOption } from '@/components/features/Vote/VoteOption';
import type { TrendOption } from '@/types/trend';

interface VoteCardProps {
  title: string;
  label: string;
  options: TrendOption[];
  selectedOptionId: string | null;
  onOptionSelect: (id: string) => void;
  voteCountMap: Record<string, number>;
}

export const VoteCard: FC<VoteCardProps> = ({
  title,
  label,
  options,
  selectedOptionId,
  onOptionSelect,
  voteCountMap,
}) => {
  const [isFlipping, setIsFlipping] = useState(false);

  const handleOptionClick = (optionId: string) => {
    if (selectedOptionId || isFlipping) {
      return;
    } // 이미 선택한 경우 또는 애니메이션 중인 경우 무시

    // 모든 카드 뒤집기 시작
    setIsFlipping(true);

    // 애니메이션 완료 후 선택 처리
    setTimeout(() => {
      onOptionSelect(optionId);
    }, 300); // flip 애니메이션 시간과 맞춤
  };

  const voteCounts = options.map((option) => voteCountMap[option.id] || 0);
  const maxVoteCount = Math.max(...voteCounts);
  const hasWinner = voteCounts.filter((count) => count === maxVoteCount).length === 1;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.label}>{label}</p>
      </div>

      <div className={styles.options}>
        {options.map((option) => {
          const isFlipped = isFlipping || !!selectedOptionId;

          return (
            <div key={option.id} className={styles.flipContainer}>
              <div className={`${styles.flipInner} ${isFlipped ? styles.flipped : ''}`}>
                {/* 앞면: VoteOption */}
                <div className={styles.flipFront}>
                  <VoteOption
                    title={option.title}
                    imageUrl={option.imageUrl}
                    isSelected={false}
                    onClick={() => handleOptionClick(option.id)}
                  />
                </div>

                {/* 뒷면: ResultVoteOption */}
                <div className={styles.flipBack}>
                  <ResultVoteOption
                    title={option.title}
                    imageUrl={option.imageUrl}
                    voteCount={voteCountMap[option.id] || 0}
                    percentage={50}
                    showCrown={hasWinner && (voteCountMap[option.id] || 0) === maxVoteCount}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
