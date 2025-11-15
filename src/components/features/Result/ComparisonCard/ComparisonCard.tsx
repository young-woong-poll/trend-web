'use client';

import type { FC } from 'react';

import styles from './ComparisonCard.module.scss';

interface ComparisonItem {
  question: string;
  myAnswer: string;
  friendAnswer: string;
  isMatch: boolean;
}

interface ComparisonCardProps {
  friendNickname: string;
  matchCount: number;
  totalCount: number;
  comparisons: ComparisonItem[];
}

export const ComparisonCard: FC<ComparisonCardProps> = ({
  friendNickname,
  matchCount,
  totalCount,
  comparisons,
}) => (
  <div className={styles.container}>
    <div className={styles.header}>
      <h2 className={styles.subtitle}>
        <span className={styles.highlight}>사랑꾼 {friendNickname}</span>과
      </h2>
      <h3 className={styles.title}>연애프로 같이봐도 안싸움</h3>

      <div className={styles.matchInfo}>
        <span className={styles.matchLabel}>매칭률</span>
        <span className={styles.matchRate}>
          {matchCount}/{totalCount} 일치
        </span>
      </div>

      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${(matchCount / totalCount) * 100}%` }}
        />
      </div>
    </div>

    <div className={styles.comparisonList}>
      <div className={styles.tableHeader}>
        <span className={styles.tableHeaderLabel}>{'{닉네임}님'}</span>
        <span className={styles.tableHeaderLabel}>사랑꾼 {friendNickname}</span>
      </div>

      {comparisons.map((item, index) => (
        <div key={index} className={styles.comparisonItem}>
          <div className={styles.questionRow}>
            <span className={styles.questionText}>{item.question}</span>
            <div className={`${styles.matchIcon} ${item.isMatch ? styles.match : styles.mismatch}`}>
              {item.isMatch ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M6 10l2.5 2.5L14 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M7 7l6 6M13 7l-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
          </div>

          <div className={styles.answerRow}>
            <div className={`${styles.answer} ${!item.isMatch ? styles.matched : ''}`}>
              {item.myAnswer}
            </div>
            <div className={`${styles.answer} ${!item.isMatch ? styles.matched : ''}`}>
              {item.friendAnswer}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
