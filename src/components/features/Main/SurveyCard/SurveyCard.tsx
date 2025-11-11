import type { FC } from 'react';

import { Button } from '@/components/common/Button/Button';

import styles from './SurveyCard.module.scss';

interface SurveyCardProps {
  title: string;
  subtitle: string;
  participantCount: number;
  onStart: () => void;
}

export const SurveyCard: FC<SurveyCardProps> = ({ title, subtitle, participantCount, onStart }) => {
  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.subtitle}>{subtitle}</p>

      <div className={styles.participants}>
        <span className={styles.label}>참여자</span>
        <span className={styles.count}>{formatCount(participantCount)}</span>
      </div>

      <Button variant="gradient" width={160} className={styles.startButton} onClick={onStart}>
        시작하기
        <svg
          data-arrow="true"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7.5 15L12.5 10L7.5 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Button>
    </div>
  );
};
