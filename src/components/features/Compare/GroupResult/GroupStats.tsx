import type { FC } from 'react';

import styles from '@/components/features/Compare/GroupResult/GroupStats.module.scss';
import { findUnanimousQuestions, findControversyPoints } from '@/constants/group-compare';
import type { GroupCompareResult } from '@/types/group-compare';

interface GroupStatsProps {
  result: GroupCompareResult;
}

export const GroupStats: FC<GroupStatsProps> = ({ result }) => {
  const unanimous = findUnanimousQuestions(result);
  const controversy = findControversyPoints(result);

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>그룹 통계</span>
        <div className={styles.sectionLine} />
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div>
            <span className={styles.statValue}>{result.groupSyncRate}</span>
            <span className={styles.statUnit}>%</span>
          </div>
          <span className={styles.statLabel}>그룹 싱크율</span>
        </div>
        <div className={styles.statCard}>
          <div>
            <span className={styles.statValue}>{result.memberCount}</span>
            <span className={styles.statUnit}>명</span>
          </div>
          <span className={styles.statLabel}>참여 인원</span>
        </div>
        <div className={styles.statCard}>
          <div>
            <span className={styles.statValue}>{unanimous.length}</span>
            <span className={styles.statUnit}>개</span>
          </div>
          <span className={styles.statLabel}>만장일치</span>
        </div>
        <div className={styles.statCard}>
          <div>
            <span className={styles.statValue}>{controversy.length}</span>
            <span className={styles.statUnit}>개</span>
          </div>
          <span className={styles.statLabel}>논쟁 포인트</span>
        </div>
      </div>

      {unanimous.length > 0 && (
        <div className={styles.questionList}>
          {unanimous.map((q) => (
            <div key={q.electionId} className={styles.questionItem}>
              <span className={styles.questionTitle}>{q.title}</span>
              <span className={`${styles.badge} ${styles.unanimousBadge}`}>
                만장일치: {q.unanimousAnswer}
              </span>
            </div>
          ))}
        </div>
      )}

      {controversy.length > 0 && (
        <div className={styles.questionList}>
          {controversy.map((q) => (
            <div key={q.electionId} className={styles.questionItem}>
              <div style={{ flex: 1 }}>
                <span className={styles.questionTitle}>{q.title}</span>
                <div className={styles.ratioBar}>
                  <div className={styles.ratioA} style={{ width: `${q.ratioA}%` }} />
                  <div className={styles.ratioB} style={{ width: `${q.ratioB}%` }} />
                </div>
                <div className={styles.ratioLabels}>
                  <span>
                    {q.optionA} {q.ratioA}%
                  </span>
                  <span>
                    {q.optionB} {q.ratioB}%
                  </span>
                </div>
              </div>
              <span className={`${styles.badge} ${styles.controversyBadge}`}>논쟁</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
