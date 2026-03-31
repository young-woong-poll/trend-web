'use client';

import type { FC } from 'react';

import styles from '@/components/features/Bundle/BundlePlay/QuestionCard.module.scss';
import type { BundleElection } from '@/types/bundle';

interface QuestionCardProps {
  election: BundleElection;
  selected: 'A' | 'B' | null;
  onSelect: (choice: 'A' | 'B') => void;
}

export const QuestionCard: FC<QuestionCardProps> = ({ election, selected, onSelect }) => (
  <div className={styles.container}>
    <h2 className={styles.question}>{election.title}</h2>

    <div className={styles.options}>
      <button
        type="button"
        className={`${styles.optionButton} ${selected === 'A' ? styles.selected : ''}`}
        onClick={() => onSelect('A')}
      >
        <div className={styles.optionLabel}>A</div>
        {election.optionA}
      </button>

      <button
        type="button"
        className={`${styles.optionButton} ${selected === 'B' ? styles.selected : ''}`}
        onClick={() => onSelect('B')}
      >
        <div className={styles.optionLabel}>B</div>
        {election.optionB}
      </button>
    </div>
  </div>
);
