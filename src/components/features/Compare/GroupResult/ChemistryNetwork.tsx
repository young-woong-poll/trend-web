'use client';

import { useState, useMemo, useRef, useEffect, type FC } from 'react';

import styles from '@/components/features/Compare/GroupResult/ChemistryNetwork.module.scss';
import { getChemistryByRate } from '@/constants/bundle';
import type { PairChemistry } from '@/types/group-compare';

interface ChemistryNetworkProps {
  members: Array<{ userId: string; nickname: string }>;
  pairs: PairChemistry[];
}

/** 등급별 색상 (S~D, getChemistryByRate 기준과 동일) */
type MatchTier = 0 | 1 | 2 | 3 | 4;

const TIER_COLORS = [
  '#3B82F6', // S (90%+)
  '#22C55E', // A (70~89%)
  '#FACC15', // B (50~69%)
  '#F97316', // C (30~49%)
  '#EF4444', // D (~29%)
];

const TIER_GRADES = ['S', 'A', 'B', 'C', 'D'];

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

/** 등급별 선 굵기 — 높은 등급일수록 굵게 */
function getLineWidth(tier: MatchTier): number {
  const widths = [3, 2.5, 1.8, 1.2, 0.8];
  return widths[tier];
}

/** 등급별 기본 투명도 — 높은 등급일수록 진하게 */
function getBaseOpacity(tier: MatchTier): number {
  const opacities = [0.8, 0.6, 0.3, 0.12, 0.05];
  return opacities[tier];
}

function getCirclePosition(index: number, total: number, radius: number = 38) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return {
    x: 50 + radius * Math.cos(angle),
    y: 50 + radius * Math.sin(angle),
  };
}

const NODE_COLORS = [
  { gradient: 'linear-gradient(135deg, #ff00ff, #ff4500)', primary: '#ff00ff' },
  { gradient: 'linear-gradient(135deg, #4FC3F7, #00BCD4)', primary: '#4FC3F7' },
  { gradient: 'linear-gradient(135deg, #FFD700, #FFA500)', primary: '#FFD700' },
  { gradient: 'linear-gradient(135deg, #66BB6A, #00BCD4)', primary: '#66BB6A' },
  { gradient: 'linear-gradient(135deg, #8B5CF6, #EC4899)', primary: '#8B5CF6' },
  { gradient: 'linear-gradient(135deg, #FF6B35, #FF00FF)', primary: '#FF6B35' },
];

function truncateName(name: string, max: number = 5): string {
  return name.length > max ? `${name.slice(0, max)}..` : name;
}

const GRADE_DESCRIPTIONS = [
  { grade: 'S', range: '80% 이상', title: '말 안 해도 통하는' },
  { grade: 'A', range: '60~79%', title: '꽤 잘 맞는' },
  { grade: 'B', range: '40~59%', title: '같을 때도 다를 때도' },
  { grade: 'C', range: '20~39%', title: '각자의 세계' },
  { grade: 'D', range: '19% 이하', title: '정반대의 가치관' },
];

export const ChemistryNetwork: FC<ChemistryNetworkProps> = ({ members, pairs }) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showGradeInfo, setShowGradeInfo] = useState(false);
  const gradeInfoRef = useRef<HTMLDivElement>(null);
  const gradeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showGradeInfo) {
      return;
    }
    const handleOutside = (e: MouseEvent) => {
      if (gradeBtnRef.current?.contains(e.target as Node)) {
        return;
      }
      if (gradeInfoRef.current?.contains(e.target as Node)) {
        return;
      }
      setShowGradeInfo(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showGradeInfo]);

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
  const isPairSelected = (pair: PairChemistry) => {
    if (!selectedUserId) {
      return false;
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
      <div className={styles.legendRow}>
        <div className={styles.legend}>
          {TIER_COLORS.map((color, i) => (
            <div key={i} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: color }} />
              <span className={styles.legendLabel} style={{ color }}>
                {TIER_GRADES[i]}
              </span>
            </div>
          ))}
        </div>
        <div className={styles.gradeInfoWrap}>
          <button
            ref={gradeBtnRef}
            type="button"
            className={styles.gradeInfoBtn}
            onClick={() => setShowGradeInfo((v) => !v)}
            aria-label="등급 기준 보기"
          >
            ?
          </button>
          {showGradeInfo && (
            <div ref={gradeInfoRef} className={styles.gradeInfoTooltip}>
              <span className={styles.gradeInfoTitle}>등급 기준</span>
              <span className={styles.gradeInfoSub}>그룹 멤버 간 답변 일치율로 산출</span>
              {GRADE_DESCRIPTIONS.map((g) => (
                <div key={g.grade} className={styles.gradeInfoRow}>
                  <span
                    className={styles.gradeInfoGrade}
                    style={{ color: TIER_COLORS[TIER_GRADES.indexOf(g.grade)] }}
                  >
                    {g.grade}
                  </span>
                  <span className={styles.gradeInfoRange}>{g.range}</span>
                  <span className={styles.gradeInfoLabel}>{g.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
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
            const selected = isPairSelected(pair);

            // 선택 모드: 선택된 멤버 연결은 진하게, 나머지는 거의 숨김
            // 기본 모드: 등급별 투명도 차등
            const opacity = selectedUserId ? (selected ? 0.8 : 0.03) : getBaseOpacity(pair.tier);

            const width = selectedUserId
              ? selected
                ? getLineWidth(pair.tier) * 0.4
                : 0.2
              : getLineWidth(pair.tier) * 0.3;

            return (
              <g key={`${pair.memberA}-${pair.memberB}`}>
                <line
                  x1={posA.x}
                  y1={posA.y}
                  x2={posB.x}
                  y2={posB.y}
                  stroke={TIER_COLORS[pair.tier]}
                  strokeWidth={width}
                  strokeOpacity={opacity}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-opacity 0.3s, stroke-width 0.3s' }}
                />
                {/* 연결선 중간에 일치율 표시 (선택 상태에서만) */}
                {selected && selectedUserId && (
                  <text
                    x={(posA.x + posB.x) / 2}
                    y={(posA.y + posB.y) / 2 - 1.5}
                    textAnchor="middle"
                    fill={TIER_COLORS[pair.tier]}
                    fontSize="3"
                    fontWeight="700"
                    style={{ pointerEvents: 'none' }}
                  >
                    {getChemistryByRate(pair.matchRate).grade}
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
              className={`${styles.memberNode} ${isSelected ? styles.selected : ''} ${!active ? styles.inactive : ''} ${!selectedUserId ? styles.idle : ''}`}
              style={
                {
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  '--node-color': NODE_COLORS[i % NODE_COLORS.length].primary,
                } as React.CSSProperties
              }
              onClick={() => handleNodeClick(member.userId)}
            >
              <div
                className={styles.nodeCircle}
                style={{
                  background: active ? NODE_COLORS[i % NODE_COLORS.length].gradient : '#333',
                }}
              >
                {member.nickname[0]}
              </div>
              <span className={styles.nodeName}>{truncateName(member.nickname)}</span>
            </button>
          );
        })}
      </div>

      <p className={styles.hint}>
        {selectedUserId
          ? '다른 멤버를 탭하거나 다시 탭하면 전체 보기로 돌아갑니다'
          : '멤버를 탭하면 전체 케미를 확인할 수 있어요'}
      </p>
    </div>
  );
};
