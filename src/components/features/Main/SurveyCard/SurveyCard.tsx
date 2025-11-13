import type { FC } from 'react';

import StartArrowIcon from '@/assets/icon/StartArrowIcon';
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
        <StartArrowIcon />
      </Button>
    </div>
  );
};
