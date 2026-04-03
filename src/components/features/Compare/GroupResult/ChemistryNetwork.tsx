'use client';

import { useState, useMemo, type FC } from 'react';

import styles from '@/components/features/Compare/GroupResult/ChemistryNetwork.module.scss';
import { getChemistryByRate, type ChemistryGrade } from '@/constants/bundle';
import { CHEMISTRY_NETWORK_COLORS } from '@/constants/group-compare';
import type { PairChemistry } from '@/types/group-compare';

interface ChemistryNetworkProps {
  members: Array<{ userId: string; nickname: string }>;
  pairs: PairChemistry[];
}

function getCirclePosition(index: number, total: number, radius: number = 38) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return {
    x: 50 + radius * Math.cos(angle),
    y: 50 + radius * Math.sin(angle),
  };
}

function getLineWidth(grade: ChemistryGrade): number {
  const widths: Record<ChemistryGrade, number> = { S: 4, A: 3, B: 2, C: 1.5, D: 1 };
  return widths[grade];
}

const CHIP_COLOR_RGB: Record<ChemistryGrade, string> = {
  S: '255, 215, 0',
  A: '255, 0, 255',
  B: '255, 107, 53',
  C: '79, 195, 247',
  D: '102, 187, 106',
};

const NODE_GRADIENTS = [
  'linear-gradient(135deg, #ff00ff, #ff4500)',
  'linear-gradient(135deg, #4FC3F7, #00BCD4)',
  'linear-gradient(135deg, #FFD700, #FFA500)',
  'linear-gradient(135deg, #66BB6A, #00BCD4)',
  'linear-gradient(135deg, #8B5CF6, #EC4899)',
  'linear-gradient(135deg, #FF6B35, #FF00FF)',
];

const ALL_GRADES: ChemistryGrade[] = ['S', 'A', 'B', 'C', 'D'];

export const ChemistryNetwork: FC<ChemistryNetworkProps> = ({ members, pairs }) => {
  const [activeGrades, setActiveGrades] = useState<Set<ChemistryGrade>>(new Set(ALL_GRADES));

  const toggleGrade = (grade: ChemistryGrade) => {
    setActiveGrades((prev) => {
      const next = new Set(prev);
      if (next.has(grade)) {
        next.delete(grade);
      } else {
        next.add(grade);
      }
      return next;
    });
  };

  const positions = useMemo(
    () => members.map((_, i) => getCirclePosition(i, members.length)),
    [members.length]
  );

  const pairsWithGrade = useMemo(
    () =>
      pairs.map((pair) => ({
        ...pair,
        grade: getChemistryByRate(pair.matchRate).grade,
      })),
    [pairs]
  );

  return (
    <div className={styles.container}>
      <div className={styles.filterBar}>
        {ALL_GRADES.map((grade) => (
          <button
            key={grade}
            type="button"
            className={`${styles.filterChip} ${activeGrades.has(grade) ? styles.active : ''}`}
            style={
              {
                '--chip-color': CHEMISTRY_NETWORK_COLORS[grade],
                '--chip-color-rgb': CHIP_COLOR_RGB[grade],
              } as React.CSSProperties
            }
            onClick={() => toggleGrade(grade)}
          >
            {grade}
          </button>
        ))}
      </div>

      <div className={styles.networkCanvas}>
        <svg className={styles.svgLayer} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          {pairsWithGrade
            .filter((p) => activeGrades.has(p.grade))
            .map((pair) => {
              const idxA = members.findIndex((m) => m.userId === pair.memberA);
              const idxB = members.findIndex((m) => m.userId === pair.memberB);
              if (idxA === -1 || idxB === -1) {
                return null;
              }
              const posA = positions[idxA];
              const posB = positions[idxB];
              return (
                <line
                  key={`${pair.memberA}-${pair.memberB}`}
                  x1={posA.x}
                  y1={posA.y}
                  x2={posB.x}
                  y2={posB.y}
                  stroke={CHEMISTRY_NETWORK_COLORS[pair.grade]}
                  strokeWidth={getLineWidth(pair.grade) * 0.3}
                  strokeOpacity={0.6}
                  strokeLinecap="round"
                />
              );
            })}
        </svg>

        {members.map((member, i) => {
          const pos = positions[i];
          return (
            <div
              key={member.userId}
              className={styles.memberNode}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <div
                className={styles.nodeCircle}
                style={{ background: NODE_GRADIENTS[i % NODE_GRADIENTS.length] }}
              >
                {member.nickname[0]}
              </div>
              <span className={styles.nodeName}>{member.nickname}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
