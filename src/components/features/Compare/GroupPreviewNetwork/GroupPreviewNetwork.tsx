'use client';

import { useState, useEffect, useMemo, type FC } from 'react';

import styles from '@/components/features/Compare/GroupPreviewNetwork/GroupPreviewNetwork.module.scss';

/** 등급별 색상 */
const TIER_COLORS = ['#3B82F6', '#22C55E', '#FACC15', '#F97316', '#EF4444'];

/** 노드 그라데이션 */
const NODE_COLORS = [
  { gradient: 'linear-gradient(135deg, #ff00ff, #ff4500)', primary: '#ff00ff' },
  { gradient: 'linear-gradient(135deg, #4FC3F7, #00BCD4)', primary: '#4FC3F7' },
  { gradient: 'linear-gradient(135deg, #FFD700, #FFA500)', primary: '#FFD700' },
  { gradient: 'linear-gradient(135deg, #66BB6A, #00BCD4)', primary: '#66BB6A' },
  { gradient: 'linear-gradient(135deg, #8B5CF6, #EC4899)', primary: '#8B5CF6' },
];

interface MemberConfig {
  names: string[];
  /** [memberA, memberB, matchRate][] — "나"는 index 0 */
  pairs: [number, number, number][];
}

/** 3명 / 4명 / 5명 시나리오 */
const SCENARIOS: MemberConfig[] = [
  {
    names: ['나', '지우', '하은'],
    pairs: [
      [0, 1, 82],
      [0, 2, 45],
      [1, 2, 68],
    ],
  },
  {
    names: ['나', '태우', '서연', '민준'],
    pairs: [
      [0, 1, 91],
      [0, 2, 35],
      [0, 3, 62],
      [1, 2, 55],
      [1, 3, 78],
      [2, 3, 22],
    ],
  },
  {
    names: ['나', '지우', '하은', '태우', '서연'],
    pairs: [
      [0, 1, 75],
      [0, 2, 42],
      [0, 3, 88],
      [0, 4, 30],
      [1, 2, 65],
      [1, 3, 50],
      [1, 4, 80],
      [2, 3, 25],
      [2, 4, 58],
      [3, 4, 70],
    ],
  },
];

function getMatchTier(rate: number): number {
  if (rate >= 80) {
    return 0;
  }
  if (rate >= 60) {
    return 1;
  }
  if (rate >= 40) {
    return 2;
  }
  if (rate >= 20) {
    return 3;
  }
  return 4;
}

function getLineWidth(tier: number): number {
  return [2.5, 2, 1.5, 1, 0.6][tier];
}

function getLineOpacity(tier: number): number {
  return [0.8, 0.55, 0.3, 0.15, 0.08][tier];
}

function getCirclePosition(index: number, total: number, radius: number = 34) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return {
    x: 50 + radius * Math.cos(angle),
    y: 50 + radius * Math.sin(angle),
  };
}

interface GroupPreviewNetworkProps {
  /** true면 카드 배경 없이 내용만 렌더 */
  embedded?: boolean;
}

export const GroupPreviewNetwork: FC<GroupPreviewNetworkProps> = ({ embedded = false }) => {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % SCENARIOS.length);
        setFading(false);
      }, 400);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const scenario = SCENARIOS[index];

  const positions = useMemo(
    () => scenario.names.map((_, i) => getCirclePosition(i, scenario.names.length)),
    [scenario]
  );

  return (
    <div className={embedded ? styles.embedded : styles.card}>
      <div className={`${styles.networkWrap} ${fading ? styles.fadeOut : styles.fadeIn}`}>
        <svg className={styles.svgLayer} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          {scenario.pairs.map(([a, b, rate]) => {
            const posA = positions[a];
            const posB = positions[b];
            const tier = getMatchTier(rate);
            return (
              <line
                key={`${a}-${b}`}
                x1={posA.x}
                y1={posA.y}
                x2={posB.x}
                y2={posB.y}
                stroke={TIER_COLORS[tier]}
                strokeWidth={getLineWidth(tier)}
                strokeOpacity={getLineOpacity(tier)}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {scenario.names.map((name, i) => {
          const pos = positions[i];
          return (
            <div
              key={`${name}-${i}`}
              className={styles.node}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
              }}
            >
              <div
                className={styles.nodeCircle}
                style={{ background: NODE_COLORS[i % NODE_COLORS.length].gradient }}
              >
                {name[0]}
              </div>
              <span className={styles.nodeName}>
                {name}
                {i === 0 && <span className={styles.meBadge}>나</span>}
              </span>
            </div>
          );
        })}
      </div>

      <span className={styles.maxNote}>최대 50명까지 참여 가능</span>
    </div>
  );
};
