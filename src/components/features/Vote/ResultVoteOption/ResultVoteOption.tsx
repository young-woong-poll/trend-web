'use client';

import type { FC } from 'react';

import CrownIcon from '@/assets/icon/CrownIcon';
import styles from '@/components/features/Vote/ResultVoteOption/ResultVoteOption.module.scss';

interface ResultVoteOptionProps {
  title: string;
  imageUrl: string;
  voteCount: number;
  percentage: number;
  showCrown?: boolean;
}

export const ResultVoteOption: FC<ResultVoteOptionProps> = ({
  title,
  imageUrl,
  voteCount,
  percentage,
  showCrown = false,
}) => (
  <div className={styles.container}>
    {showCrown && (
      <div className={styles.crown}>
        <CrownIcon width={40} height={40} />
      </div>
    )}
    <div className={styles.image} style={{ backgroundImage: `url(${imageUrl})` }}>
      <div className={styles.overlay} />
      <span className={styles.title}>{title}</span>
    </div>

    <div className={styles.result}>
      <div className={styles.resultInfo}>
        <span className={styles.voteCount}>{voteCount.toLocaleString()}표</span>
        <span className={styles.percentage}>{percentage.toFixed(1)}%</span>
      </div>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  </div>
);
