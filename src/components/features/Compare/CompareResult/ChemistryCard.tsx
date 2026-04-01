import type { FC } from 'react';

import styles from '@/components/features/Compare/CompareResult/ChemistryCard.module.scss';
import { getCoupleType, IDENTITY_COLORS } from '@/constants/compare';
import { useCountUp } from '@/hooks/useCountUp';

interface ChemistryCardProps {
  matchRate: number;
  myNickname: string;
  targetNickname: string;
  bundleTitle: string;
  myPopularityScore: number;
  targetPopularityScore: number;
}

export const ChemistryCard: FC<ChemistryCardProps> = ({
  matchRate,
  myNickname,
  targetNickname,
  bundleTitle,
  myPopularityScore,
  targetPopularityScore,
}) => {
  const coupleType = getCoupleType(matchRate, myPopularityScore, targetPopularityScore);
  // 마지막 몇 칸에서 느려지는 긴장감 연출 (easeOutQuint + 긴 duration)
  const animatedRate = useCountUp(matchRate, 2000, 'easeOutQuint');

  return (
    <div className={styles.container}>
      <div className={styles.bundleTitle}>{bundleTitle}</div>

      {/* 닉네임 */}
      <div className={styles.names}>
        <span className={styles.myName} style={{ color: IDENTITY_COLORS.me.main }}>
          {myNickname}
        </span>
        <span className={styles.vs}>×</span>
        <span className={styles.targetName} style={{ color: IDENTITY_COLORS.target.main }}>
          {targetNickname}
        </span>
      </div>

      {/* 일치율 히어로 */}
      <div className={styles.matchRateArea}>
        <div className={styles.matchRateRow}>
          <span className={styles.matchRate}>{animatedRate}</span>
          <span className={styles.matchUnit}>%</span>
        </div>
        <span className={styles.matchLabel}>일치율</span>
      </div>

      {/* 커플 타입 */}
      <div className={styles.coupleType}>{coupleType.title}</div>
      <div className={styles.coupleDescription}>{coupleType.description}</div>
      <div className={styles.coupleSubtitle}>{coupleType.subtitle}</div>
    </div>
  );
};
