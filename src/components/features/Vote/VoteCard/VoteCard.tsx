'use client';

import { type FC } from 'react';

import styles from '@/components/features/Vote/VoteCard/VoteCard.module.scss';
import { VoteOptionCard } from '@/components/features/Vote/VoteOptionCard';
import type { DisplayTrendOptionResponse } from '@/generated/models';
import { useHotpickElectionOptionsCount } from '@/hooks/api/useHotpick';

interface VoteCardProps {
  hotpickAlias: string;
  electionId: string;
  title: string;
  options: DisplayTrendOptionResponse[];
  selectedOptionId: string | null;
  handleOptionSelect: (optionId: string) => void;
}

export const VoteCard: FC<VoteCardProps> = ({
  hotpickAlias,
  electionId,
  title,
  options,
  selectedOptionId,
  handleOptionSelect,
}) => {
  const { data: optionCountData } = useHotpickElectionOptionsCount({ hotpickAlias, electionId });
  const optionCounts = optionCountData?.options ?? [];

  const totalVotes =
    optionCounts.reduce((sum, opt) => sum + (opt.count ?? 0), 0) + (selectedOptionId ? 1 : 0);

  const handleOptionClick = (optionId: string) => {
    if (selectedOptionId) {
      return;
    }
    handleOptionSelect(optionId);
  };

  const hasVoted = !!selectedOptionId;

  return (
    <div className={styles.cardWrapper}>
      <div className={`${styles.card} ${hasVoted ? styles.cardFlipped : ''}`}>
        {/* 앞면: 투표 전 */}
        <div className={styles.cardFront}>
          <div className={styles.questionText}>{title}</div>
          <div className={styles.optionsContainer}>
            {options.map((option) => (
              <VoteOptionCard
                key={option.id}
                option={option}
                isSelected={false}
                hasVoted={false}
                voteCount={0}
                percentage={0}
                onClick={() => handleOptionClick(option.id ?? '')}
              />
            ))}
          </div>
        </div>

        {/* 뒷면: 투표 후 결과 */}
        <div className={styles.cardBack}>
          <div className={styles.questionText}>{title}</div>
          <div className={styles.optionsContainer}>
            {options.map((option) => {
              const isSelected = selectedOptionId === option.id;
              const voteCount = optionCounts.find((opt) => opt.id === option.id)?.count ?? 0;
              const displayVoteCount = isSelected ? voteCount + 1 : voteCount;
              const percentage =
                totalVotes === 0 ? 0 : Math.round((displayVoteCount / totalVotes) * 100);

              return (
                <VoteOptionCard
                  key={option.id}
                  option={option}
                  isSelected={isSelected}
                  hasVoted={true}
                  voteCount={displayVoteCount}
                  percentage={percentage}
                  onClick={() => {}}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
