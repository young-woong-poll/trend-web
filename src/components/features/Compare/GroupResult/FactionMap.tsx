'use client';

import { useMemo, type FC } from 'react';

import styles from '@/components/features/Compare/GroupResult/FactionMap.module.scss';
import { getGradientByIndex } from '@/constants/profileColors';
import type { PairChemistry } from '@/types/group-compare';

interface FactionMapProps {
  members: Array<{ userId: string; nickname: string }>;
  pairs: PairChemistry[];
}

const FACTION_THRESHOLD = 70;

interface Faction {
  memberIds: string[];
  avgRate: number;
}

/**
 * Greedy clustering: 70%+ match rate 기준으로 파벌 생성
 * 1. 모든 페어를 matchRate 내림차순 정렬
 * 2. 둘 다 미배치면 새 클러스터 생성
 * 3. 한 명만 클러스터에 있고 matchRate >= 70% 이면 합류
 * 4. 나머지는 외톨이
 */
function buildFactions(
  members: Array<{ userId: string; nickname: string }>,
  pairs: PairChemistry[]
): { factions: Faction[]; lonerIds: string[] } {
  const sorted = [...pairs].sort((a, b) => b.matchRate - a.matchRate);

  // userId → factionIndex
  const memberFaction = new Map<string, number>();
  const factions: Faction[] = [];

  for (const pair of sorted) {
    if (pair.matchRate < FACTION_THRESHOLD) {
      break;
    }

    const fA = memberFaction.get(pair.memberA);
    const fB = memberFaction.get(pair.memberB);

    if (fA === undefined && fB === undefined) {
      // 둘 다 미배치 → 새 클러스터
      const idx = factions.length;
      factions.push({ memberIds: [pair.memberA, pair.memberB], avgRate: pair.matchRate });
      memberFaction.set(pair.memberA, idx);
      memberFaction.set(pair.memberB, idx);
    } else if (fA !== undefined && fB === undefined) {
      // A만 배치됨 → B를 A의 클러스터에 추가
      factions[fA].memberIds.push(pair.memberB);
      memberFaction.set(pair.memberB, fA);
    } else if (fA === undefined && fB !== undefined) {
      // B만 배치됨 → A를 B의 클러스터에 추가
      factions[fB].memberIds.push(pair.memberA);
      memberFaction.set(pair.memberA, fB);
    }
    // 둘 다 배치되어 있으면 스킵 (다른 클러스터 간 머지는 안 함)
  }

  // 각 팩션 내부 평균 matchRate 재계산
  for (const faction of factions) {
    const ids = faction.memberIds;
    if (ids.length < 2) {
      faction.avgRate = 0;
      continue;
    }
    let total = 0;
    let count = 0;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const p = pairs.find(
          (pr) =>
            (pr.memberA === ids[i] && pr.memberB === ids[j]) ||
            (pr.memberA === ids[j] && pr.memberB === ids[i])
        );
        if (p) {
          total += p.matchRate;
          count++;
        }
      }
    }
    faction.avgRate = count > 0 ? Math.round(total / count) : 0;
  }

  // 외톨이 식별
  const lonerIds = members.filter((m) => !memberFaction.has(m.userId)).map((m) => m.userId);

  return { factions, lonerIds };
}

/** 두 팩션 사이 평균 cross-faction matchRate */
function calcCrossRate(fA: Faction, fB: Faction, pairs: PairChemistry[]): number {
  let total = 0;
  let count = 0;

  for (const idA of fA.memberIds) {
    for (const idB of fB.memberIds) {
      const p = pairs.find(
        (pr) =>
          (pr.memberA === idA && pr.memberB === idB) || (pr.memberA === idB && pr.memberB === idA)
      );
      if (p) {
        total += p.matchRate;
        count++;
      }
    }
  }

  return count > 0 ? Math.round(total / count) : 0;
}

export const FactionMap: FC<FactionMapProps> = ({ members, pairs }) => {
  const { factions, lonerIds } = useMemo(() => buildFactions(members, pairs), [members, pairs]);

  /** 팩션 간 cross rate 매트릭스 (i < j 만 저장) */
  const crossRates = useMemo(() => {
    const rates: Array<{ factionA: number; factionB: number; rate: number }> = [];
    for (let i = 0; i < factions.length; i++) {
      for (let j = i + 1; j < factions.length; j++) {
        rates.push({
          factionA: i,
          factionB: j,
          rate: calcCrossRate(factions[i], factions[j], pairs),
        });
      }
    }
    return rates;
  }, [factions, pairs]);

  const getGradient = (userId: string) => {
    const idx = members.findIndex((m) => m.userId === userId);
    return getGradientByIndex(idx >= 0 ? idx : 0);
  };

  const getNickname = (userId: string) => members.find((m) => m.userId === userId)?.nickname ?? '?';

  if (factions.length === 0 && lonerIds.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      {/* Section header */}
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>파벌 지도</span>
        <div className={styles.sectionLine} />
      </div>

      {/* Faction cards */}
      {factions.length > 0 && (
        <div className={styles.factionList}>
          {factions.map((faction, idx) => (
            <div key={idx} className={styles.factionCard}>
              <div className={styles.factionHeader}>
                <span className={styles.factionName}>{idx + 1}팀</span>
                <span className={styles.factionRate}>내부 일치율 {faction.avgRate}%</span>
              </div>
              <div className={styles.avatarRow}>
                {faction.memberIds.map((id) => (
                  <div key={id} className={styles.avatarItem}>
                    <div className={styles.avatar} style={{ background: getGradient(id) }}>
                      {getNickname(id)[0]}
                    </div>
                    <span className={styles.avatarName}>{getNickname(id)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cross-faction rates */}
      {crossRates.length > 0 && (
        <div className={styles.crossSection}>
          <span className={styles.crossLabel}>팩션 간 일치율</span>
          <div className={styles.crossList}>
            {crossRates.map(({ factionA, factionB, rate }) => (
              <div key={`${factionA}-${factionB}`} className={styles.crossItem}>
                <span className={styles.crossPair}>
                  {factionA + 1}팀 ↔ {factionB + 1}팀
                </span>
                <span className={styles.crossRate}>{rate}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loners */}
      {lonerIds.length > 0 && (
        <div className={styles.lonerSection}>
          <span className={styles.lonerLabel}>어디에도 속하지 않는</span>
          <div className={styles.avatarRow}>
            {lonerIds.map((id) => (
              <div key={id} className={styles.avatarItem}>
                <div className={styles.avatar} style={{ background: getGradient(id) }}>
                  {getNickname(id)[0]}
                </div>
                <span className={styles.avatarName}>{getNickname(id)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
