'use client';

import type { FC } from 'react';

import { Skeleton } from '@/components/common/Skeleton/Skeleton';
import styles from '@/components/features/Vote/VoteOptionCard/VoteOptionCard.module.scss';
import { useImagePreload } from '@/hooks/useImagePreload';
import type { TrendOption } from '@/types/trend';

interface VoteOptionCardProps {
  option: TrendOption;
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
  const isImageLoaded = useImagePreload(option.imageUrl);

  return (
    <div className={styles.wrapper}>
      {!isImageLoaded && <Skeleton height={400} borderRadius={16} className={styles.skeleton} />}

      <div
        className={`
          ${styles.imageCard}
          ${isSelected && hasVoted ? styles.selected : ''}
          ${!isImageLoaded ? styles.loading : styles.loaded}
          ${!hasVoted ? styles.clickable : ''}
        `}
        onClick={!hasVoted ? onClick : undefined}
      >
        <img src={option.imageUrl} alt={option.title} className={styles.backgroundImage} />

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
