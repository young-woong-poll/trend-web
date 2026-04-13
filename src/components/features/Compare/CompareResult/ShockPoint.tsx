import type { FC } from 'react';

import styles from '@/components/features/Compare/CompareResult/ShockPoint.module.scss';
import { IDENTITY_COLORS, type ShockPointData } from '@/constants/compare';

interface ShockPointProps {
  data: ShockPointData;
  myNickname: string;
  targetNickname: string;
}

export const ShockPoint: FC<ShockPointProps> = ({ data, myNickname, targetNickname }) => {
  const myOptionText = data.myOptionText;
  const targetOptionText = data.targetOptionText;

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>가장 충격적인 차이</span>
        <div className={styles.sectionLine} />
      </div>

      <div className={styles.card}>
        <div className={styles.questionTitle}>{data.title}</div>

        <div className={styles.answers}>
          <div
            className={styles.answerRow}
            style={{ borderLeft: `3px solid ${IDENTITY_COLORS.me.main}` }}
          >
            <span className={styles.personName} style={{ color: IDENTITY_COLORS.me.main }}>
              {myNickname}
            </span>
            <span className={styles.answerText}>
              {myOptionText}
              <span
                className={`${styles.answerRate} ${data.myRate >= 50 ? styles.majorityRate : styles.minorityRate}`}
              >
                ({data.myRate}%)
              </span>
            </span>
          </div>
          <div
            className={styles.answerRow}
            style={{ borderLeft: `3px solid ${IDENTITY_COLORS.target.main}` }}
          >
            <span className={styles.personName} style={{ color: IDENTITY_COLORS.target.main }}>
              {targetNickname}
            </span>
            <span className={styles.answerText}>
              {targetOptionText}
              <span
                className={`${styles.answerRate} ${data.targetRate >= 50 ? styles.majorityRate : styles.minorityRate}`}
              >
                ({data.targetRate}%)
              </span>
            </span>
          </div>
        </div>

        <div className={styles.comment}>&ldquo;{data.comment}&rdquo;</div>
      </div>
    </div>
  );
};
