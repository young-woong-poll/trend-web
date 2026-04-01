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

      {/* 분포 곡선 — 별도 카드 */}
      <div className={styles.distributionCard}>
        <div className={styles.distributionHeader}>
          <span className={styles.distributionLabel}>우리는</span>
          <span className={styles.distributionHighlight}>
            {matchRate >= 70 ? '상위권' : matchRate >= 40 ? '중간쯤' : '독특한 편'}
          </span>
        </div>

        <div className={styles.curveWrap}>
          <svg viewBox="0 0 200 80" className={styles.curveSvg}>
            <defs>
              <linearGradient id="curveFill" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ff00ff" stopOpacity="0.06" />
                <stop offset="50%" stopColor="#ff4500" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#ff00ff" stopOpacity="0.06" />
              </linearGradient>
            </defs>
            <path
              d="M0,75 C30,72 50,48 75,22 C90,8 100,3 100,3 C100,3 110,8 125,22 C150,48 170,72 200,75 L200,80 L0,80 Z"
              fill="url(#curveFill)"
            />
            <path
              d="M0,75 C30,72 50,48 75,22 C90,8 100,3 100,3 C100,3 110,8 125,22 C150,48 170,72 200,75"
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1.5"
            />
            <line
              x1={matchRate * 2}
              y1={
                (() => {
                  const x = matchRate * 2;
                  const n = (x - 100) / 50;
                  return 3 + 72 * (1 - Math.exp((-n * n) / 2));
                })() - 8
              }
              x2={matchRate * 2}
              y2="80"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
            <circle
              cx={matchRate * 2}
              cy={(() => {
                const x = matchRate * 2;
                const n = (x - 100) / 50;
                return 3 + 72 * (1 - Math.exp((-n * n) / 2));
              })()}
              r="5"
              fill="#fff"
            />
          </svg>
          <div className={styles.curveAxis}>
            <span>불일치</span>
            <span>일치</span>
          </div>
        </div>
      </div>
    </div>
  );
};
