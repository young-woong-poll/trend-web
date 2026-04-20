'use client';

import { useState, useMemo, useRef, useEffect, type FC } from 'react';

import styles from '@/components/features/Compare/GroupResult/ChemistryNetwork.module.scss';
import { GenderBadge } from '@/components/features/Compare/GroupResult/GenderBadge';
import { getChemistryByRate } from '@/constants/bundle';
import { getMemberGradient, getProfileColor, isGhostUser } from '@/constants/profileColors';
import type { PairChemistry } from '@/types/group-compare';

interface ChemistryNetworkProps {
  currentUserId: string;
  members: Array<{
    userId: string;
    nickname: string;
    gender?: 'MALE' | 'FEMALE';
    displayProfileColor?: string;
    isWithdrawn?: boolean;
  }>;
  pairs: PairChemistry[];
  /** 1:1 비교 요청 콜백 — targetUserId 전달 (없으면 패널 미노출) */
  onCompareRequest?: (targetUserId: string) => void;
  /** 내 프로필 편집 콜백 (없으면 편집 버튼 미노출) */
  onEditProfile?: () => void;
}

/** 등급별 색상 (SS~X, getChemistryByRate 기준과 동일) */
type MatchTier = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const TIER_COLORS = [
  '#E040FB', // SS (100%)
  '#3B82F6', // S (80~99%)
  '#22C55E', // A (60~79%)
  '#FACC15', // B (40~59%)
  '#F97316', // C (20~39%)
  '#EF4444', // D (1~19%)
  '#00E5FF', // X (0%)
];

const TIER_GRADES = ['SS', 'S', 'A', 'B', 'C', 'D', 'X'];

function getMatchTier(matchRate: number): MatchTier {
  if (matchRate === 100) {
    return 0;
  }
  if (matchRate >= 80) {
    return 1;
  }
  if (matchRate >= 60) {
    return 2;
  }
  if (matchRate >= 40) {
    return 3;
  }
  if (matchRate >= 20) {
    return 4;
  }
  if (matchRate === 0) {
    return 6;
  }
  return 5;
}

/** 등급별 선 굵기 — 높은 등급일수록 굵게 */
function getLineWidth(tier: MatchTier): number {
  const widths = [3.5, 3, 2.5, 2, 1.5, 1.2, 3.5];
  return widths[tier];
}

/** 등급별 기본 투명도 — 높은 등급일수록 진하게 */
function getBaseOpacity(tier: MatchTier): number {
  const opacities = [0.95, 0.85, 0.65, 0.45, 0.3, 0.2, 0.95];
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
  { grade: 'SS', range: '100%', title: '도플갱어' },
  { grade: 'S', range: '80~99%', title: '말 안 해도 통하는' },
  { grade: 'A', range: '60~79%', title: '꽤 잘 맞는' },
  { grade: 'B', range: '40~59%', title: '같을 때도 다를 때도' },
  { grade: 'C', range: '20~39%', title: '각자의 세계' },
  { grade: 'D', range: '1~19%', title: '정반대의 가치관' },
  { grade: 'X', range: '0%', title: '완벽한 반대' },
];

export const ChemistryNetwork: FC<ChemistryNetworkProps> = ({
  currentUserId,
  members,
  pairs,
  onCompareRequest,
  onEditProfile,
}) => {
  // "나"를 12시 방향(index 0)에 고정
  const sortedMembers = useMemo(() => {
    const myIdx = members.findIndex((m) => m.userId === currentUserId);
    if (myIdx <= 0) {
      return members;
    }
    return [members[myIdx], ...members.slice(0, myIdx), ...members.slice(myIdx + 1)];
  }, [members, currentUserId]);

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
    () => sortedMembers.map((_, i) => getCirclePosition(i, sortedMembers.length)),
    [sortedMembers]
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

  // 선택된 멤버와 "나"의 케미 정보 (하단 패널용)
  const selectedPairInfo = useMemo(() => {
    if (!selectedUserId || selectedUserId === currentUserId) {
      return null;
    }
    const pair = pairs.find(
      (p) =>
        (p.memberA === currentUserId && p.memberB === selectedUserId) ||
        (p.memberB === currentUserId && p.memberA === selectedUserId)
    );
    if (!pair) {
      return null;
    }
    const target = members.find((m) => m.userId === selectedUserId);
    if (!target) {
      return null;
    }
    const chemistry = getChemistryByRate(pair.matchRate);
    const tier = getMatchTier(pair.matchRate);
    return {
      nickname: target.nickname,
      chemistry,
      tier,
      isGhost: isGhostUser(target.userId),
      isWithdrawn: target.isWithdrawn === true,
    };
  }, [selectedUserId, currentUserId, pairs, members]);

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
            const idxA = sortedMembers.findIndex((m) => m.userId === pair.memberA);
            const idxB = sortedMembers.findIndex((m) => m.userId === pair.memberB);
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

        {sortedMembers.map((member, i) => {
          const pos = positions[i];
          const active = isNodeActive(member.userId);
          const isSelected = selectedUserId === member.userId;
          const isDimmed = isGhostUser(member.userId) || member.isWithdrawn === true;

          return (
            <button
              key={member.userId}
              type="button"
              className={`${styles.memberNode} ${isSelected ? styles.selected : ''} ${!active ? styles.inactive : ''} ${!selectedUserId ? styles.idle : ''}`}
              style={
                {
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  '--node-color': isDimmed
                    ? '#555'
                    : member.displayProfileColor
                      ? getProfileColor(member.displayProfileColor).start
                      : NODE_COLORS[i % NODE_COLORS.length].primary,
                  opacity: member.isWithdrawn ? 0.5 : undefined,
                } as React.CSSProperties
              }
              onClick={() => handleNodeClick(member.userId)}
            >
              <div className={styles.nodeCircleWrap}>
                <div
                  className={styles.nodeCircle}
                  style={{
                    background: isDimmed
                      ? '#444'
                      : active
                        ? getMemberGradient(
                            i,
                            member.userId,
                            member.displayProfileColor,
                            member.isWithdrawn
                          )
                        : '#333',
                  }}
                >
                  {member.nickname[0]}
                </div>
                <GenderBadge gender={member.gender} />
              </div>
              <span className={styles.nodeName}>
                {truncateName(member.nickname)}
                {member.userId === currentUserId && (
                  <span className={styles.nicknameBadgeMe}>나</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <p className={styles.hint}>
        {selectedUserId
          ? '다른 멤버를 탭하거나 다시 탭하면 전체 보기로 돌아갑니다'
          : '멤버를 탭하면 전체 비교를 확인할 수 있어요'}
      </p>

      {/* "나" 선택 시 프로필 편집 패널 */}
      {selectedUserId === currentUserId && onEditProfile && (
        <div className={styles.comparePanel}>
          <div className={styles.comparePanelText}>
            <span className={styles.comparePanelNames}>내 프로필</span>
            <span className={styles.comparePanelTitle}>표시 이름 · 프로필 색상</span>
          </div>
          <button type="button" className={styles.comparePanelBtn} onClick={onEditProfile}>
            수정하기
          </button>
        </div>
      )}

      {/* 선택된 멤버와의 케미 패널 (탈퇴 유저 제외) */}
      {selectedPairInfo &&
        onCompareRequest &&
        !selectedPairInfo.isGhost &&
        !selectedPairInfo.isWithdrawn && (
          <>
            <div className={styles.comparePanel}>
              <div className={styles.comparePanelInfo}>
                <span
                  className={styles.comparePanelGrade}
                  style={{ color: TIER_COLORS[selectedPairInfo.tier] }}
                >
                  {selectedPairInfo.chemistry.grade}
                </span>
                <div className={styles.comparePanelText}>
                  <span className={styles.comparePanelNames}>
                    나 × {truncateName(selectedPairInfo.nickname, 8)}
                  </span>
                  <span className={styles.comparePanelTitle}>
                    {selectedPairInfo.chemistry.title}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className={styles.comparePanelBtn}
                onClick={() => selectedUserId && onCompareRequest(selectedUserId)}
              >
                비교 상세보기
              </button>
            </div>
            <p className={styles.comparePanelNotice}>
              <span className={styles.noticeArrow}>‹‹</span>
              비교 결과 이력에 남지 않아요
            </p>
          </>
        )}
    </div>
  );
};
