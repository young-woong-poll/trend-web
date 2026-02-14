'use client';

import type { FC } from 'react';

import styles from '@/components/features/Hotpick/VoteOptionCard/VoteOptionCard.module.scss';
import type { DisplayTrendOptionResponse } from '@/generated/models';
import { useImagePreload } from '@/hooks/useImagePreload';

interface VoteOptionCardProps {
  option: DisplayTrendOptionResponse;
  isSelected: boolean;
  hasVoted: boolean;
  voteCount?: number;
  percentage?: number;
  onClick: () => void;
}

export const VoteOptionCard: FC<VoteOptionCardProps> = ({
  option,
  isSelected,
  hasVoted,
  voteCount = 0,
  percentage = 0,
  onClick,
}) => {
  const isImageLoaded = useImagePreload(option.imageUrl ?? '');

  return (
    <div className={`${styles.wrapper} ${isSelected && hasVoted ? styles.selected : ''}`}>
      {!isImageLoaded && <div className={styles.skeleton} />}

      <div
        className={`
          ${styles.imageCard}
          ${!isImageLoaded ? styles.loading : styles.loaded}
          ${!hasVoted ? styles.clickable : ''}
          ${hasVoted ? styles.hasVoted : ''}
        `}
        onClick={!hasVoted ? onClick : undefined}
      >
        <img
          src={option.imageUrl ?? ''}
          alt={option.title ?? ''}
          className={styles.backgroundImage}
        />

        <div className={styles.labelOverlay}>{option.title}</div>

        {hasVoted && (
          <div className={styles.voteResultBar}>
            <div className={styles.progressGradient}>
              <div className={styles.progressFill} style={{ width: `${percentage}%` }} />
            </div>
            <div className={styles.voteStats}>
              <span className={styles.voteCount}>{voteCount.toLocaleString()}표</span>
              <span className={styles.percentage}>{percentage.toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
