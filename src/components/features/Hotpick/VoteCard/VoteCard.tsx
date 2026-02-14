'use client';

import { type FC } from 'react';

import Image from 'next/image';

import { TextVoteOption } from '@/components/features/Hotpick/TextVoteOption';
import styles from '@/components/features/Hotpick/VoteCard/VoteCard.module.scss';
import { VoteOptionCard } from '@/components/features/Hotpick/VoteOptionCard';
import type { DisplayTrendOptionResponse } from '@/generated/models';
import { useHotpickElectionOptionsCount } from '@/hooks/api/useHotpick';
import type { VoteType } from '@/types/election';

interface VoteCardProps {
  hotpickAlias: string;
  electionId: string;
  title: string;
  options: DisplayTrendOptionResponse[];
  selectedOptionId: string | null;
  handleOptionSelect: (optionId: string) => void;
  voteType?: VoteType;
  mainImageUrl?: string;
}

export const VoteCard: FC<VoteCardProps> = ({
  hotpickAlias,
  electionId,
  title,
  options,
  selectedOptionId,
  handleOptionSelect,
  voteType = 'IMAGE',
  mainImageUrl,
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

  const isTextType = voteType === 'TEXT';

  return (
    <div className={styles.cardWrapper}>
      <div className={`${styles.card} ${hasVoted ? styles.cardFlipped : ''}`}>
        {/* 앞면: 투표 전 */}
        <div className={styles.cardFront}>
          {isTextType && mainImageUrl && (
            <Image
              src={mainImageUrl}
              alt={title}
              width={400}
              height={200}
              className={styles.mainImage}
            />
          )}
          <div className={styles.questionText}>{title}</div>
          <div className={isTextType ? styles.textOptionsContainer : styles.optionsContainer}>
            {options.map((option) =>
              isTextType ? (
                <TextVoteOption
                  key={option.id}
                  title={option.title ?? ''}
                  isSelected={false}
                  hasVoted={false}
                  onClick={() => handleOptionClick(option.id ?? '')}
                />
              ) : (
                <VoteOptionCard
                  key={option.id}
                  option={option}
                  isSelected={false}
                  hasVoted={false}
                  voteCount={0}
                  percentage={0}
                  onClick={() => handleOptionClick(option.id ?? '')}
                />
              )
            )}
          </div>
        </div>

        {/* 뒷면: 투표 후 결과 */}
        <div className={styles.cardBack}>
          {isTextType && mainImageUrl && (
            <Image
              src={mainImageUrl}
              alt={title}
              width={400}
              height={140}
              className={styles.mainImageSmall}
            />
          )}
          <div className={styles.questionText}>{title}</div>
          <div className={isTextType ? styles.textOptionsContainer : styles.optionsContainer}>
            {options.map((option) => {
              const isSelected = selectedOptionId === option.id;
              const voteCount = optionCounts.find((opt) => opt.id === option.id)?.count ?? 0;
              const displayVoteCount = isSelected ? voteCount + 1 : voteCount;
              const percentage =
                totalVotes === 0 ? 0 : Math.round((displayVoteCount / totalVotes) * 100);

              return isTextType ? (
                <TextVoteOption
                  key={option.id}
                  title={option.title ?? ''}
                  isSelected={isSelected}
                  hasVoted={true}
                  voteCount={displayVoteCount}
                  percentage={percentage}
                  onClick={() => {}}
                />
              ) : (
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
