import styles from '@/components/features/Admin/AdminBundleDashboard/AdminBundleDashboard.module.scss';
import type { DailyStat } from '@/types/admin-bundle';

interface ParticipationTabProps {
  participation: {
    totalParticipants: number;
    completionRate: number;
    dailyStats: DailyStat[];
  };
  compareLinkCount: number;
}

export default function ParticipationTab({
  participation,
  compareLinkCount,
}: ParticipationTabProps) {
  const maxCount = Math.max(...participation.dailyStats.map((d) => d.count), 1);

  return (
    <div>
      <div className={styles.statCards}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{participation.totalParticipants.toLocaleString()}</div>
          <div className={styles.statLabel}>총 참여자</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{participation.completionRate}%</div>
          <div className={styles.statLabel}>완료율</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{compareLinkCount}</div>
          <div className={styles.statLabel}>비교 링크</div>
        </div>
      </div>

      <div className={styles.chartSection}>
        <div className={styles.chartTitle}>일별 참여자 추이 (최근 14일)</div>
        <div className={styles.barChart}>
          {participation.dailyStats.map((stat) => (
            <div key={stat.date} className={styles.barWrapper}>
              <div
                className={styles.bar}
                style={{ height: `${(stat.count / maxCount) * 100}%` }}
                title={`${stat.date}: ${stat.count}명`}
              />
            </div>
          ))}
        </div>
        <div className={styles.chartXAxis}>
          <span>{participation.dailyStats[0]?.date.slice(5)}</span>
          <span>
            {participation.dailyStats[participation.dailyStats.length - 1]?.date.slice(5)}
          </span>
        </div>
      </div>
    </div>
  );
}
