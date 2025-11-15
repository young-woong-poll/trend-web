'use client';

import type { FC } from 'react';

import styles from './QuestionSection.module.scss';

interface QuestionSectionProps {
  question: string;
  options: [string, string];
  selectedIndex: number;
}

export const QuestionSection: FC<QuestionSectionProps> = ({ question, options, selectedIndex }) => (
  <div className={styles.section}>
    <p className={styles.question}>{question}</p>
    <div className={styles.options}>
      {options.map((option, index) => (
        <button
          key={option}
          className={`${styles.option} ${index === selectedIndex ? styles.selected : ''}`}
        >
          {option}
        </button>
      ))}
    </div>
  </div>
);
