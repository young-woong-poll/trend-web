'use client';

import { useState, type FC } from 'react';

import { ResultVoteOption } from '@/components/features/Vote/ResultVoteOption';
import styles from '@/components/features/Vote/VoteCard/VoteCard.module.scss';
import { VoteOption } from '@/components/features/Vote/VoteOption';
import { useTrendItemOptionsCount } from '@/hooks/api/useTrend';
import type { TrendOption } from '@/types/trend';

interface VoteCardProps {
  trendAlias: string;
  itemId: string;
  title: string;
  label: string;
  options: TrendOption[];
  selectedOptionId: string | null;
  handleOptionSelect: (optionId: string) => void;
  voteCountMap?: Record<string, number>;
}

export const VoteCard: FC<VoteCardProps> = ({
  trendAlias,
  itemId,
  title,
  label,
  options,
  selectedOptionId,
  handleOptionSelect,
}) => {
  const [isFlipping, setIsFlipping] = useState(false);

  const { data: optionCountData } = useTrendItemOptionsCount({ trendAlias, itemId });
  const optionCounts = optionCountData?.options || [];

  const voteCounts = optionCounts.map((option) => option.count);
  const maxVoteCount = Math.max(...voteCounts, 0);
  const hasWinner =
    maxVoteCount > 0 && voteCounts.filter((count) => count === maxVoteCount).length === 1;
  const totalVotes =
    optionCounts.reduce((sum, opt) => sum + opt.count, 0) + (selectedOptionId ? 1 : 0);

  const handleOptionClick = (optionId: string) => {
    if (selectedOptionId || isFlipping) {
      return;
    }

    setIsFlipping(true);

    setTimeout(() => {
      handleOptionSelect(optionId);
    }, 300);
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.label}>{label}</p>
      </div>

      <div className={styles.options}>
        {options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          const isFlipped = isFlipping || !!selectedOptionId;
          const voteCount = optionCounts.find((opt) => opt.id === option.id)?.count || 0;
          const displayVoteCount = isSelected ? voteCount + 1 : voteCount;

          // 비율 계산: 전체 투표가 0이면 0%, 아니면 (현재 옵션 투표수 / 전체 투표수) * 100
          const percentage =
            totalVotes === 0 ? 0 : Math.round((displayVoteCount / totalVotes) * 100);

          return (
            <div key={option.id} className={styles.flipContainer}>
              <div className={`${styles.flipInner} ${isFlipped ? styles.flipped : ''}`}>
                {/* 앞면: VoteOption */}
                <div className={styles.flipFront}>
                  <VoteOption
                    title={option.title}
                    imageUrl={option.imageUrl}
                    isSelected={isSelected}
                    onClick={() => handleOptionClick(option.id)}
                  />
                </div>

                {/* 뒷면: ResultVoteOption */}
                <div className={styles.flipBack}>
                  <ResultVoteOption
                    title={option.title}
                    imageUrl={option.imageUrl}
                    voteCount={displayVoteCount}
                    percentage={percentage}
                    showCrown={hasWinner && voteCount === maxVoteCount}
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
