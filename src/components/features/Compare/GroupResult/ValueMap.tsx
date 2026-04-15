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

/** 겹치는 점들을 서로 밀어내서 최소 간격을 확보한다 */
function resolveOverlaps(
  points: Array<{ x: number; y: number }>,
  minDist: number = 10
): Array<{ dx: number; dy: number }> {
  const offsets = points.map(() => ({ dx: 0, dy: 0 }));

  // 반복적으로 밀어내기 (최대 10회)
  for (let iter = 0; iter < 10; iter++) {
    let moved = false;
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const ax = coordToPercent(points[i].x) + offsets[i].dx;
        const ay = coordToPercent(-points[i].y) + offsets[i].dy;
        const bx = coordToPercent(points[j].x) + offsets[j].dx;
        const by = coordToPercent(-points[j].y) + offsets[j].dy;

        const dist = Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
        if (dist < minDist) {
          moved = true;
          const overlap = (minDist - dist) / 2;
          // 완전히 같은 위치면 대각선으로 밀기
          let ndx = ax - bx;
          let ndy = ay - by;
          if (dist === 0) {
            ndx = 1;
            ndy = 1;
          }
          const len = Math.sqrt(ndx ** 2 + ndy ** 2);
          ndx /= len;
          ndy /= len;

          offsets[i].dx += ndx * overlap;
          offsets[i].dy += ndy * overlap;
          offsets[j].dx -= ndx * overlap;
          offsets[j].dy -= ndy * overlap;
        }
      }
    }
    if (!moved) {
      break;
    }
  }

  return offsets;
}

function truncateName(name: string, max: number = 5): string {
  return name.length > max ? `${name.slice(0, max)}..` : name;
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
  const config = VALUE_MAP_CONFIGS[result.bundleSlug ?? ''];
  const hasAxisQuestions = (result.questionStats ?? []).some((s) => s.axis !== null);

  const coords = useMemo(() => calcValueMapCoordinates(result), [result]);
  const avgCoord = useMemo(() => calcGroupAverage(coords), [coords]);
  const offsets = useMemo(() => resolveOverlaps(coords), [coords]);

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

        {coords.map((coord, i) => {
          const offset = offsets[i];
          return (
            <div
              key={coord.userId}
              className={styles.memberDot}
              style={{
                left: `${coordToPercent(coord.x) + offset.dx}%`,
                top: `${coordToPercent(-coord.y) + offset.dy}%`,
              }}
            >
              <div
                className={styles.dot}
                style={{ background: DOT_GRADIENTS[i % DOT_GRADIENTS.length] }}
              >
                {coord.nickname[0]}
              </div>
              <span className={styles.dotName}>{truncateName(coord.nickname)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
