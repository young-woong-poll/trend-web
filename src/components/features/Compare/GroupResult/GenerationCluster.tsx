'use client';

import { useMemo, type FC } from 'react';

import styles from '@/components/features/Compare/GroupResult/GenerationCluster.module.scss';
import type { PairChemistry } from '@/types/group-compare';

interface GenerationClusterProps {
  members: Array<{ userId: string; nickname: string; birthYear?: number }>;
  pairs: PairChemistry[];
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #ff00ff, #ff4500)',
  'linear-gradient(135deg, #4FC3F7, #00BCD4)',
  'linear-gradient(135deg, #FFD700, #FFA500)',
  'linear-gradient(135deg, #66BB6A, #00BCD4)',
  'linear-gradient(135deg, #8B5CF6, #EC4899)',
  'linear-gradient(135deg, #FF6B35, #FF00FF)',
];

interface GenerationGroup {
  label: string;
  memberIds: string[];
  intraRate: number;
}

interface CrossRate {
  labelA: string;
  labelB: string;
  rate: number;
}

/** birthYear → 세대 라벨. unknown birthYear → null (skip) */
function getGenerationLabel(birthYear: number | undefined): string | null {
  if (birthYear === undefined) {
    return null;
  }
  if (birthYear >= 1990 && birthYear <= 1994) {
    return '90년대 초반';
  }
  if (birthYear >= 1995 && birthYear <= 1999) {
    return '90년대 후반';
  }
  if (birthYear >= 2000 && birthYear <= 2004) {
    return '00년대 초반';
  }
  if (birthYear >= 2005) {
    return '00년대 후반';
  }
  return null;
}

/** 두 userId 사이의 matchRate를 pairs에서 찾기 */
function findPairRate(pairs: PairChemistry[], idA: string, idB: string): number | null {
  const p = pairs.find(
    (pr) => (pr.memberA === idA && pr.memberB === idB) || (pr.memberA === idB && pr.memberB === idA)
  );
  return p ? p.matchRate : null;
}

/** 멤버 ID 배열 내부의 평균 matchRate */
function calcIntraRate(ids: string[], pairs: PairChemistry[]): number {
  if (ids.length < 2) {
    return 0;
  }
  let total = 0;
  let count = 0;
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const rate = findPairRate(pairs, ids[i], ids[j]);
      if (rate !== null) {
        total += rate;
        count++;
      }
    }
  }
  return count > 0 ? Math.round(total / count) : 0;
}

/** 두 그룹 사이의 평균 matchRate */
function calcCrossRate(idsA: string[], idsB: string[], pairs: PairChemistry[]): number {
  let total = 0;
  let count = 0;
  for (const idA of idsA) {
    for (const idB of idsB) {
      const rate = findPairRate(pairs, idA, idB);
      if (rate !== null) {
        total += rate;
        count++;
      }
    }
  }
  return count > 0 ? Math.round(total / count) : 0;
}

/** 싱크율 기반 색상 */
function getRateColor(rate: number): string {
  if (rate >= 70) {
    return '#66bb6a';
  }
  if (rate >= 50) {
    return '#FACC15';
  }
  return '#FF6B35';
}

const MAX_AVATARS = 5;

export const GenerationCluster: FC<GenerationClusterProps> = ({ members, pairs }) => {
  /** 세대별 그룹 생성 */
  const groups: GenerationGroup[] = useMemo(() => {
    const groupMap = new Map<string, string[]>();

    for (const member of members) {
      const label = getGenerationLabel(member.birthYear);
      if (label === null) {
        continue;
      }
      const existing = groupMap.get(label);
      if (existing) {
        existing.push(member.userId);
      } else {
        groupMap.set(label, [member.userId]);
      }
    }

    // 정렬: 세대 순서 고정
    const order = ['90년대 초반', '90년대 후반', '00년대 초반', '00년대 후반'];
    const result: GenerationGroup[] = [];

    for (const label of order) {
      const ids = groupMap.get(label);
      if (ids && ids.length > 0) {
        result.push({
          label,
          memberIds: ids,
          intraRate: calcIntraRate(ids, pairs),
        });
      }
    }

    return result;
  }, [members, pairs]);

  /** 세대 간 cross rate */
  const crossRates: CrossRate[] = useMemo(() => {
    const rates: CrossRate[] = [];
    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        rates.push({
          labelA: groups[i].label,
          labelB: groups[j].label,
          rate: calcCrossRate(groups[i].memberIds, groups[j].memberIds, pairs),
        });
      }
    }
    return rates;
  }, [groups, pairs]);

  /** 원본 members 배열에서 인덱스 → gradient */
  const getGradient = (userId: string) => {
    const idx = members.findIndex((m) => m.userId === userId);
    return AVATAR_GRADIENTS[idx >= 0 ? idx % AVATAR_GRADIENTS.length : 0];
  };

  const getNickname = (userId: string) => members.find((m) => m.userId === userId)?.nickname ?? '?';

  // 2개 미만의 세대 그룹이면 렌더링하지 않음
  if (groups.length < 2) {
    return null;
  }

  return (
    <div className={styles.container}>
      {/* Section header */}
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>세대별 가치관</span>
        <div className={styles.sectionLine} />
      </div>

      {/* Generation cards */}
      <div className={styles.groupList}>
        {groups.map((group) => {
          const overflow = group.memberIds.length - MAX_AVATARS;
          return (
            <div key={group.label} className={styles.groupCard}>
              <div className={styles.groupHeader}>
                <div className={styles.groupLabelRow}>
                  <span className={styles.groupLabel}>{group.label}</span>
                  <span className={styles.groupCount}>{group.memberIds.length}명</span>
                </div>
                {group.memberIds.length >= 2 && (
                  <span className={styles.groupRate}>내부 싱크율 {group.intraRate}%</span>
                )}
              </div>
              <div className={styles.avatarRow}>
                {group.memberIds.slice(0, MAX_AVATARS).map((id) => (
                  <div key={id} className={styles.avatar} style={{ background: getGradient(id) }}>
                    {getNickname(id)[0]}
                  </div>
                ))}
                {overflow > 0 && <span className={styles.avatarOverflow}>+{overflow}명</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cross-generation comparison */}
      {crossRates.length > 0 && (
        <div className={styles.crossSection}>
          <span className={styles.crossLabel}>세대 간 싱크율</span>
          <div className={styles.crossList}>
            {crossRates.map(({ labelA, labelB, rate }) => (
              <div key={`${labelA}-${labelB}`} className={styles.crossItem}>
                <span className={styles.crossPair}>
                  {labelA} ↔ {labelB}
                </span>
                <span className={styles.crossRate} style={{ color: getRateColor(rate) }}>
                  {rate}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
