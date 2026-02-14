'use client';

import type { FC } from 'react';

import styles from '@/components/features/Hotpick/TextVoteOption/TextVoteOption.module.scss';

interface TextVoteOptionProps {
  title: string;
  isSelected: boolean;
  hasVoted: boolean;
  voteCount?: number;
  percentage?: number;
  onClick: () => void;
}

export const TextVoteOption: FC<TextVoteOptionProps> = ({
  title,
  isSelected,
  hasVoted,
  voteCount = 0,
  percentage = 0,
  onClick,
}) => (
  <div
    className={`${styles.optionButton} ${isSelected && hasVoted ? styles.selected : ''} ${!hasVoted ? styles.clickable : ''}`}
    onClick={!hasVoted ? onClick : undefined}
  >
    <span className={styles.optionTitle}>{title}</span>

    {hasVoted && (
      <div className={styles.resultArea}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${percentage}%` }} />
        </div>
        <div className={styles.voteStats}>
          <span className={styles.voteCount}>{voteCount.toLocaleString()}표</span>
          <span className={styles.percentage}>{percentage.toFixed(1)}%</span>
        </div>
      </div>
    )}
  </div>
);
