'use client';

import { useState, type FC } from 'react';

import styles from '@/components/features/Compare/CompareResult/AnswerComparison.module.scss';
import { IDENTITY_COLORS, type AnswerStoryData } from '@/constants/compare';

interface AnswerComparisonProps {
  data: AnswerStoryData;
  myNickname: string;
  targetNickname: string;
}

export const AnswerComparison: FC<AnswerComparisonProps> = ({
  data,
  myNickname,
  targetNickname,
}) => {
  const [sameOpen, setSameOpen] = useState(true);
  const [diffOpen, setDiffOpen] = useState(true);

  return (
    <div className={styles.container}>
      {/* 같은 편인 순간 */}
      {data.same.length > 0 && (
        <div className={styles.accordion}>
          <div className={styles.accordionHeader} onClick={() => setSameOpen(!sameOpen)}>
            <div>
              <span className={`${styles.accordionTitle} ${styles.sameColor}`}>같은 편인 순간</span>
              <span className={styles.accordionCount}>({data.same.length})</span>
            </div>
            <span className={`${styles.chevron} ${sameOpen ? styles.open : ''}`}>▼</span>
          </div>
          <div className={`${styles.accordionContent} ${sameOpen ? styles.expanded : ''}`}>
            {data.same.map((item) => (
              <div key={item.electionId} className={styles.sameItem}>
                <span className={styles.sameQuestion}>{item.title}</span>
                <div className={styles.sameAnswer}>
                  <span className={styles.sameAnswerText}>{item.selected}</span>
                  <span
                    className={`${styles.sameRate} ${item.selectedRate >= 50 ? styles.majorityRate : styles.minorityRate}`}
                  >
                    대중성 지수 {item.selectedRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 갈린 순간 */}
      {data.different.length > 0 && (
        <div className={styles.accordion}>
          <div className={styles.accordionHeader} onClick={() => setDiffOpen(!diffOpen)}>
            <div>
              <span className={`${styles.accordionTitle} ${styles.diffColor}`}>갈린 순간</span>
              <span className={styles.accordionCount}>({data.different.length})</span>
            </div>
            <span className={`${styles.chevron} ${diffOpen ? styles.open : ''}`}>▼</span>
          </div>
          <div className={`${styles.accordionContent} ${diffOpen ? styles.expanded : ''}`}>
            {data.different.map((item) => (
              <div key={item.electionId} className={styles.diffItem}>
                <span className={styles.diffQuestion}>{item.title}</span>
                <div className={styles.diffVersus}>
                  <div className={styles.diffSide}>
                    <span
                      className={styles.diffNickname}
                      style={{ color: IDENTITY_COLORS.me.main }}
                    >
                      {myNickname}
                    </span>
                    <span className={styles.diffPillLeft}>
                      {item.myOptionText}
                      <span className={styles.diffRate}>대중성 지수 {item.myRate}%</span>
                    </span>
                  </div>
                  <span className={styles.diffVsIcon}>VS</span>
                  <div className={styles.diffSide}>
                    <span
                      className={styles.diffNickname}
                      style={{ color: IDENTITY_COLORS.target.main }}
                    >
                      {targetNickname}
                    </span>
                    <span className={styles.diffPillRight}>
                      {item.targetOptionText}
                      <span className={styles.diffRate}>대중성 지수 {item.targetRate}%</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
