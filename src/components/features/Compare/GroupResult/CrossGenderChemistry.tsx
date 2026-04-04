'use client';

import { useMemo, type FC } from 'react';

import FemaleIcon from '@/assets/icon/FemaleIcon';
import MaleIcon from '@/assets/icon/MaleIcon';
import styles from '@/components/features/Compare/GroupResult/CrossGenderChemistry.module.scss';
import { getChemistryByRate } from '@/constants/bundle';
import { getGradientByIndex } from '@/constants/profileColors';
import type { PairChemistry } from '@/types/group-compare';

interface CrossGenderChemistryProps {
  currentUserId: string;
  members: Array<{
    userId: string;
    nickname: string;
    gender?: 'MALE' | 'FEMALE';
    birthYear?: number;
  }>;
  pairs: PairChemistry[];
}

const TOP_COUNT = 3;

export const CrossGenderChemistry: FC<CrossGenderChemistryProps> = ({ members, pairs }) => {
  const maleMembers = useMemo(() => members.filter((m) => m.gender === 'MALE'), [members]);
  const femaleMembers = useMemo(() => members.filter((m) => m.gender === 'FEMALE'), [members]);

  const maleIds = useMemo(() => new Set(maleMembers.map((m) => m.userId)), [maleMembers]);
  const femaleIds = useMemo(() => new Set(femaleMembers.map((m) => m.userId)), [femaleMembers]);

  /** Cross-gender pairs only, sorted by matchRate descending */
  const crossPairs = useMemo(() => {
    const filtered = pairs.filter((p) => {
      const aIsMale = maleIds.has(p.memberA);
      const aIsFemale = femaleIds.has(p.memberA);
      const bIsMale = maleIds.has(p.memberB);
      const bIsFemale = femaleIds.has(p.memberB);
      return (aIsMale && bIsFemale) || (aIsFemale && bIsMale);
    });
    return [...filtered].sort((a, b) => b.matchRate - a.matchRate);
  }, [pairs, maleIds, femaleIds]);

  /** BEST 3 cross-gender pairs */
  const best3 = useMemo(() => crossPairs.slice(0, TOP_COUNT), [crossPairs]);

  /** WORST 3 cross-gender pairs (lowest matchRate) */
  const worst3 = useMemo(() => {
    if (crossPairs.length <= TOP_COUNT) {
      return [];
    }
    return crossPairs.slice(-TOP_COUNT).reverse();
  }, [crossPairs]);

  // If either gender group is empty, don't render
  if (maleMembers.length === 0 || femaleMembers.length === 0) {
    return null;
  }

  const getGradient = (userId: string) => {
    const index = members.findIndex((m) => m.userId === userId);
    return getGradientByIndex(index);
  };

  const getGenderOfUser = (userId: string): 'MALE' | 'FEMALE' | undefined => {
    if (maleIds.has(userId)) {
      return 'MALE';
    }
    if (femaleIds.has(userId)) {
      return 'FEMALE';
    }
    return undefined;
  };

  /** Normalize a pair so male is always on the left */
  const normalizePair = (pair: PairChemistry) => {
    const aGender = getGenderOfUser(pair.memberA);
    if (aGender === 'MALE') {
      return {
        maleId: pair.memberA,
        maleNickname: pair.nicknameA,
        femaleId: pair.memberB,
        femaleNickname: pair.nicknameB,
        matchRate: pair.matchRate,
        matchCount: pair.matchCount,
      };
    }
    return {
      maleId: pair.memberB,
      maleNickname: pair.nicknameB,
      femaleId: pair.memberA,
      femaleNickname: pair.nicknameA,
      matchRate: pair.matchRate,
      matchCount: pair.matchCount,
    };
  };

  const renderCard = (pair: PairChemistry, i: number, variant: 'best' | 'worst') => {
    const normalized = normalizePair(pair);
    const grade = getChemistryByRate(pair.matchRate);
    return (
      <div key={`${normalized.maleId}-${normalized.femaleId}`} className={styles.topCard}>
        <span className={variant === 'best' ? styles.topRank : styles.worstRank}>{i + 1}</span>
        <div className={styles.pairAvatars}>
          <div className={styles.pairAvatarLeft}>
            <div
              className={styles.topAvatar}
              style={{ background: getGradient(normalized.maleId) }}
            >
              {normalized.maleNickname[0]}
            </div>
            <span className={styles.topGenderBadgeMale}>
              <MaleIcon size={8} />
            </span>
          </div>
          <div className={styles.pairAvatarRight}>
            <div
              className={styles.topAvatar}
              style={{ background: getGradient(normalized.femaleId) }}
            >
              {normalized.femaleNickname[0]}
            </div>
            <span className={styles.topGenderBadgeFemale}>
              <FemaleIcon size={8} />
            </span>
          </div>
        </div>
        <div className={styles.topInfo}>
          <span className={styles.topNames}>
            {normalized.maleNickname} & {normalized.femaleNickname}
          </span>
          <span className={styles.topGradeText}>
            {grade.grade} &middot; {grade.title}
          </span>
        </div>
        <span className={variant === 'best' ? styles.topGradeBadge : styles.worstGradeBadge}>
          {grade.grade}
        </span>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Section header */}
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>이성 궁합 랭킹</span>
        <div className={styles.sectionLine} />
      </div>

      {/* Gender count badges */}
      <div className={styles.genderBadgeRow}>
        <span className={styles.genderBadgeMale}>남 {maleMembers.length}명</span>
        <span className={styles.genderDot}>&middot;</span>
        <span className={styles.genderBadgeFemale}>여 {femaleMembers.length}명</span>
      </div>

      {/* 그룹 이성 궁합 BEST 3 */}
      <div className={styles.topSection}>
        <span className={styles.topLabel}>그룹 이성 궁합 BEST 3</span>
        <div className={styles.topList}>{best3.map((pair, i) => renderCard(pair, i, 'best'))}</div>
      </div>

      {/* 그룹 이성 궁합 WORST 3 */}
      {worst3.length > 0 && (
        <div className={styles.topSection}>
          <span className={styles.worstLabel}>그룹 이성 궁합 WORST 3</span>
          <div className={styles.topList}>
            {worst3.map((pair, i) => renderCard(pair, i, 'worst'))}
          </div>
        </div>
      )}
    </div>
  );
};
