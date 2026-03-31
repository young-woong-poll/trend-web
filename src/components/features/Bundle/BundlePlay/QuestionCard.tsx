'use client';

import type { FC } from 'react';

import BackIcon from '@/assets/icon/BackIcon';
import styles from '@/components/features/Bundle/BundlePlay/QuestionCard.module.scss';
import type { BundleElection } from '@/types/bundle';

interface QuestionCardProps {
  election: BundleElection;
  selected: 'A' | 'B' | null;
  onSelect: (choice: 'A' | 'B') => void;
  onBack?: () => void;
}

export const QuestionCard: FC<QuestionCardProps> = ({ election, selected, onSelect, onBack }) => (
  <div className={styles.container}>
    <div className={styles.questionArea}>
      {onBack && (
        <button type="button" className={styles.backButton} onClick={onBack} aria-label="이전 질문">
          <BackIcon />
        </button>
      )}
      <span className={styles.questionNumber}>Q{election.order}</span>
      <h2 className={styles.question}>{election.title}</h2>
    </div>

    <div className={styles.options}>
      <button
        type="button"
        className={`${styles.option} ${selected === 'A' ? styles.optionSelected : ''}`}
        onClick={() => onSelect('A')}
      >
        <span className={styles.optionText}>{election.optionA}</span>
      </button>

      <span className={styles.or}>or</span>

      <button
        type="button"
        className={`${styles.option} ${selected === 'B' ? styles.optionSelected : ''}`}
        onClick={() => onSelect('B')}
      >
        <span className={styles.optionText}>{election.optionB}</span>
      </button>
    </div>
  </div>
);
