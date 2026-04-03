import { useMemo, type FC } from 'react';

import styles from '@/components/features/Compare/GroupResult/ValueMap.module.scss';
import {
  calcValueMapCoordinates,
  calcGroupAverage,
  VALUE_MAP_CONFIGS,
} from '@/constants/group-compare';
import type { GroupCompareResult } from '@/types/group-compare';

interface ValueMapProps {
  result: GroupCompareResult;
}

function coordToPercent(coord: number): number {
  return 12 + ((coord + 1) / 2) * 76;
}

const DOT_GRADIENTS = [
  'linear-gradient(135deg, #ff00ff, #ff4500)',
  'linear-gradient(135deg, #4FC3F7, #00BCD4)',
  'linear-gradient(135deg, #FFD700, #FFA500)',
  'linear-gradient(135deg, #66BB6A, #00BCD4)',
  'linear-gradient(135deg, #8B5CF6, #EC4899)',
  'linear-gradient(135deg, #FF6B35, #FF00FF)',
];

export const ValueMap: FC<ValueMapProps> = ({ result }) => {
  const config = VALUE_MAP_CONFIGS[result.bundleSlug];
  const hasAxisQuestions = result.questionStats.some((s) => s.axis !== null);

  const coords = useMemo(() => calcValueMapCoordinates(result), [result]);
  const avgCoord = useMemo(() => calcGroupAverage(coords), [coords]);

  if (!config || !hasAxisQuestions) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>가치관 지도</span>
        <div className={styles.sectionLine} />
      </div>

      <div className={styles.mapWrapper}>
        <div className={`${styles.gridLine} ${styles.horizontalLine}`} />
        <div className={`${styles.gridLine} ${styles.verticalLine}`} />

        <span className={`${styles.axisLabel} ${styles.axisLeft}`}>{config.xAxisLeft}</span>
        <span className={`${styles.axisLabel} ${styles.axisRight}`}>{config.xAxisRight}</span>
        <span className={`${styles.axisLabel} ${styles.axisTop}`}>{config.yAxisTop}</span>
        <span className={`${styles.axisLabel} ${styles.axisBottom}`}>{config.yAxisBottom}</span>

        <span className={`${styles.quadrantLabel} ${styles.qTopLeft}`}>
          {config.quadrantLabels.topLeft}
        </span>
        <span className={`${styles.quadrantLabel} ${styles.qTopRight}`}>
          {config.quadrantLabels.topRight}
        </span>
        <span className={`${styles.quadrantLabel} ${styles.qBottomLeft}`}>
          {config.quadrantLabels.bottomLeft}
        </span>
        <span className={`${styles.quadrantLabel} ${styles.qBottomRight}`}>
          {config.quadrantLabels.bottomRight}
        </span>

        <div
          className={styles.groupAverage}
          style={{
            left: `${coordToPercent(avgCoord.x)}%`,
            top: `${coordToPercent(-avgCoord.y)}%`,
          }}
        />

        {coords.map((coord, i) => (
          <div
            key={coord.userId}
            className={styles.memberDot}
            style={{
              left: `${coordToPercent(coord.x)}%`,
              top: `${coordToPercent(-coord.y)}%`,
            }}
          >
            <div
              className={styles.dot}
              style={{ background: DOT_GRADIENTS[i % DOT_GRADIENTS.length] }}
            >
              {coord.nickname[0]}
            </div>
            <span className={styles.dotName}>{coord.nickname}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
