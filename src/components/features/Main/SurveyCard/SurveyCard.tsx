import type { FC } from 'react';

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
      <div className={styles.content}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.subtitle}>{subtitle}</p>

        <div className={styles.footer}>
          <div className={styles.participants}>
            <span className={styles.label}>참여자</span>
            <span className={styles.count}>{formatCount(participantCount)}</span>
          </div>

          <button type="button" className={styles.startButton} onClick={onStart}>
            시작하기
            <svg
              className={styles.arrow}
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
          </button>
        </div>
      </div>

      <div className={styles.branding}>
        <span className={styles.brandText}>Made with</span>
        <span className={styles.brandLogo}>Visily</span>
      </div>
    </div>
  );
};
