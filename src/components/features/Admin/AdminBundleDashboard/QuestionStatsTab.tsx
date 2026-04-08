import styles from '@/components/features/Admin/AdminBundleDashboard/AdminBundleDashboard.module.scss';
import type { AdminQuestionStat } from '@/types/admin-bundle';

interface QuestionStatsTabProps {
  questionStats: AdminQuestionStat[];
}

export default function QuestionStatsTab({ questionStats }: QuestionStatsTabProps) {
  return (
    <div className={styles.questionList}>
      {questionStats.map((q, index) => {
        const isAWinning = q.optionARate > q.optionBRate;
        return (
          <div key={q.electionId} className={styles.questionCard}>
            <div className={styles.questionTitle}>
              <strong>Q{index + 1}.</strong> {q.title}
            </div>
            <div className={styles.optionRow}>
              <span className={styles.optionLabel}>{q.optionA}</span>
              <div className={styles.barTrack}>
                <div
                  className={`${styles.barFill} ${isAWinning ? styles.barWinning : ''}`}
                  style={{ width: `${q.optionARate}%` }}
                >
                  <span className={styles.barPercent}>{q.optionARate}%</span>
                </div>
              </div>
              <span className={styles.optionCount}>{q.optionACount}명</span>
            </div>
            <div className={styles.optionRow}>
              <span className={styles.optionLabel}>{q.optionB}</span>
              <div className={styles.barTrack}>
                <div
                  className={`${styles.barFill} ${!isAWinning ? styles.barWinning : ''}`}
                  style={{ width: `${q.optionBRate}%` }}
                >
                  <span className={styles.barPercent}>{q.optionBRate}%</span>
                </div>
              </div>
              <span className={styles.optionCount}>{q.optionBCount}명</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
