'use client';

import type { FC } from 'react';

import CrownIcon from '@/assets/icon/CrownIcon';
import styles from '@/components/features/Vote/ResultVoteOption/ResultVoteOption.module.scss';

interface ResultVoteOptionProps {
  /**
   * 옵션 텍스트
   */
  text: string;
  /**
   * 배경 이미지 URL
   */
  imageUrl: string;
  /**
   * 득표수
   */
  voteCount: number;
  /**
   * 득표율 (0-100)
   */
  percentage: number;
  /**
   * 사용자가 선택한 옵션인지 여부
   */
  isSelected?: boolean;
}

export const ResultVoteOption: FC<ResultVoteOptionProps> = ({
  text,
  imageUrl,
  voteCount,
  percentage,
  isSelected = true,
}) => (
  <div className={styles.container}>
    {isSelected && (
      <div className={styles.crown}>
        <CrownIcon width={40} height={40} />
      </div>
    )}
    <div className={styles.image} style={{ backgroundImage: `url(${imageUrl})` }}>
      <div className={styles.overlay} />
      <span className={styles.text}>{text}</span>
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
