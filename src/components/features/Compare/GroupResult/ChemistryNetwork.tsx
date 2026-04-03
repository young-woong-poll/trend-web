'use client';

import { useState, useMemo, type FC } from 'react';

import styles from '@/components/features/Compare/GroupResult/ChemistryNetwork.module.scss';
import type { PairChemistry } from '@/types/group-compare';

interface ChemistryNetworkProps {
  members: Array<{ userId: string; nickname: string }>;
  pairs: PairChemistry[];
}

/** 일치율 → 5단계 색상 (등급 라벨 없이 색만 사용) */
type MatchTier = 0 | 1 | 2 | 3 | 4;

const TIER_COLORS = [
  '#FFD700', // 80%+ — gold
  '#FF00FF', // 60~79% — magenta
  '#FF6B35', // 40~59% — orange
  '#4FC3F7', // 20~39% — sky blue
  '#66BB6A', // 0~19% — green
];

const TIER_LABELS = ['80%+', '60~79%', '40~59%', '20~39%', '~19%'];

function getMatchTier(matchRate: number): MatchTier {
  if (matchRate >= 80) {
    return 0;
  }
  if (matchRate >= 60) {
    return 1;
  }
  if (matchRate >= 40) {
    return 2;
  }
  if (matchRate >= 20) {
    return 3;
  }
  return 4;
}

function getLineWidth(tier: MatchTier): number {
  const widths: Record<MatchTier, number> = { 0: 4, 1: 3, 2: 2, 3: 1.5, 4: 1 };
  return widths[tier];
}

function getCirclePosition(index: number, total: number, radius: number = 38) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return {
    x: 50 + radius * Math.cos(angle),
    y: 50 + radius * Math.sin(angle),
  };
}

const NODE_GRADIENTS = [
  'linear-gradient(135deg, #ff00ff, #ff4500)',
  'linear-gradient(135deg, #4FC3F7, #00BCD4)',
  'linear-gradient(135deg, #FFD700, #FFA500)',
  'linear-gradient(135deg, #66BB6A, #00BCD4)',
  'linear-gradient(135deg, #8B5CF6, #EC4899)',
  'linear-gradient(135deg, #FF6B35, #FF00FF)',
];

const INACTIVE_COLOR = 'rgba(255, 255, 255, 0.08)';

export const ChemistryNetwork: FC<ChemistryNetworkProps> = ({ members, pairs }) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const positions = useMemo(
    () => members.map((_, i) => getCirclePosition(i, members.length)),
    [members.length]
  );

  const pairsWithTier = useMemo(
    () =>
      pairs.map((pair) => ({
        ...pair,
        tier: getMatchTier(pair.matchRate),
      })),
    [pairs]
  );

  const handleNodeClick = (userId: string) => {
    setSelectedUserId((prev) => (prev === userId ? null : userId));
  };

  // 선택된 멤버와 연결된 쌍인지
  const isPairActive = (pair: PairChemistry) => {
    if (!selectedUserId) {
      return true;
    }
    return pair.memberA === selectedUserId || pair.memberB === selectedUserId;
  };

  // 선택된 멤버와 연결된 노드인지
  const isNodeActive = (userId: string) => {
    if (!selectedUserId) {
      return true;
    }
    if (userId === selectedUserId) {
      return true;
    }
    return pairs.some(
      (p) =>
        (p.memberA === selectedUserId && p.memberB === userId) ||
        (p.memberB === selectedUserId && p.memberA === userId)
    );
  };

  return (
    <div className={styles.container}>
      {/* 범례 */}
      <div className={styles.legend}>
        {TIER_COLORS.map((color, i) => (
          <div key={i} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: color }} />
            <span className={styles.legendLabel}>{TIER_LABELS[i]}</span>
          </div>
        ))}
      </div>

      <div className={styles.networkCanvas}>
        <svg className={styles.svgLayer} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          {pairsWithTier.map((pair) => {
            const idxA = members.findIndex((m) => m.userId === pair.memberA);
            const idxB = members.findIndex((m) => m.userId === pair.memberB);
            if (idxA === -1 || idxB === -1) {
              return null;
            }

            const posA = positions[idxA];
            const posB = positions[idxB];
            const active = isPairActive(pair);

            return (
              <g key={`${pair.memberA}-${pair.memberB}`}>
                <line
                  x1={posA.x}
                  y1={posA.y}
                  x2={posB.x}
                  y2={posB.y}
                  stroke={active ? TIER_COLORS[pair.tier] : INACTIVE_COLOR}
                  strokeWidth={getLineWidth(pair.tier) * 0.3}
                  strokeOpacity={active ? 0.7 : 0.2}
                  strokeLinecap="round"
                  style={{ transition: 'stroke 0.3s, stroke-opacity 0.3s' }}
                />
                {/* 연결선 중간에 일치율 표시 (활성 상태에서만) */}
                {active && selectedUserId && (
                  <text
                    x={(posA.x + posB.x) / 2}
                    y={(posA.y + posB.y) / 2 - 1.5}
                    textAnchor="middle"
                    fill={TIER_COLORS[pair.tier]}
                    fontSize="3"
                    fontWeight="700"
                    style={{ pointerEvents: 'none' }}
                  >
                    {pair.matchRate}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {members.map((member, i) => {
          const pos = positions[i];
          const active = isNodeActive(member.userId);
          const isSelected = selectedUserId === member.userId;

          return (
            <button
              key={member.userId}
              type="button"
              className={`${styles.memberNode} ${isSelected ? styles.selected : ''} ${!active ? styles.inactive : ''}`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              onClick={() => handleNodeClick(member.userId)}
            >
              <div
                className={styles.nodeCircle}
                style={{
                  background: active ? NODE_GRADIENTS[i % NODE_GRADIENTS.length] : '#333',
                }}
              >
                {member.nickname[0]}
              </div>
              <span className={styles.nodeName}>{member.nickname}</span>
            </button>
          );
        })}
      </div>

      {selectedUserId && (
        <p className={styles.hint}>다른 멤버를 탭하거나 다시 탭하면 전체 보기로 돌아갑니다</p>
      )}
    </div>
  );
};
