'use client';

import { useMemo, type FC } from 'react';

import styles from '@/components/features/Compare/GroupResult/CrossGenderChemistry.module.scss';
import { getChemistryByRate } from '@/constants/bundle';
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

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #ff00ff, #ff4500)',
  'linear-gradient(135deg, #4FC3F7, #00BCD4)',
  'linear-gradient(135deg, #FFD700, #FFA500)',
  'linear-gradient(135deg, #66BB6A, #00BCD4)',
  'linear-gradient(135deg, #8B5CF6, #EC4899)',
  'linear-gradient(135deg, #FF6B35, #FF00FF)',
];

const TOP_COUNT = 3;

export const CrossGenderChemistry: FC<CrossGenderChemistryProps> = ({
  currentUserId,
  members,
  pairs,
}) => {
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

  /** TOP 3 cross-gender pairs */
  const top3 = useMemo(() => crossPairs.slice(0, TOP_COUNT), [crossPairs]);

  /** Current user's gender */
  const currentMember = members.find((m) => m.userId === currentUserId);
  const currentGender = currentMember?.gender;

  /** "나와 가장 잘 맞는 이성" — best cross-gender pair involving currentUserId */
  const myBestMatch = useMemo(() => {
    if (!currentGender) {
      return null;
    }
    const myPairs = crossPairs.filter(
      (p) => p.memberA === currentUserId || p.memberB === currentUserId
    );
    if (myPairs.length === 0) {
      return null;
    }
    const best = myPairs[0]; // already sorted desc
    const isA = best.memberA === currentUserId;
    return {
      myNickname: isA ? best.nicknameA : best.nicknameB,
      myId: currentUserId,
      targetId: isA ? best.memberB : best.memberA,
      targetNickname: isA ? best.nicknameB : best.nicknameA,
      matchRate: best.matchRate,
    };
  }, [crossPairs, currentUserId, currentGender]);

  // If either gender group is empty, don't render
  if (maleMembers.length === 0 || femaleMembers.length === 0) {
    return null;
  }

  const getGradient = (userId: string) => {
    const index = members.findIndex((m) => m.userId === userId);
    return AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
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
      };
    }
    return {
      maleId: pair.memberB,
      maleNickname: pair.nicknameB,
      femaleId: pair.memberA,
      femaleNickname: pair.nicknameA,
      matchRate: pair.matchRate,
    };
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

      {/* 나의 이성 베스트 매치 */}
      {myBestMatch && (
        <div className={styles.myBestSection}>
          <span className={styles.myBestLabel}>나의 이성 베스트 매치</span>
          <div className={styles.myBestCard}>
            {/* My avatar (left) */}
            <div className={styles.myBestAvatarWrap}>
              <div
                className={styles.myBestAvatar}
                style={{ background: getGradient(myBestMatch.myId) }}
              >
                {myBestMatch.myNickname[0]}
              </div>
              <span
                className={
                  currentGender === 'MALE' ? styles.genderIconMale : styles.genderIconFemale
                }
              >
                {currentGender === 'MALE' ? '\u2642' : '\u2640'}
              </span>
              <span className={styles.myBestName}>{myBestMatch.myNickname}</span>
            </div>

            {/* Match rate center */}
            <div className={styles.myBestCenter}>
              <span className={styles.myBestRate}>{myBestMatch.matchRate}</span>
              <span className={styles.myBestUnit}>%</span>
              <span className={styles.myBestGrade}>
                {getChemistryByRate(myBestMatch.matchRate).title}
              </span>
            </div>

            {/* Target avatar (right) */}
            <div className={styles.myBestAvatarWrap}>
              <div
                className={styles.myBestAvatar}
                style={{ background: getGradient(myBestMatch.targetId) }}
              >
                {myBestMatch.targetNickname[0]}
              </div>
              <span
                className={
                  currentGender === 'MALE' ? styles.genderIconFemale : styles.genderIconMale
                }
              >
                {currentGender === 'MALE' ? '\u2640' : '\u2642'}
              </span>
              <span className={styles.myBestName}>{myBestMatch.targetNickname}</span>
            </div>
          </div>
        </div>
      )}

      {/* 그룹 이성 궁합 TOP 3 */}
      <div className={styles.topSection}>
        <span className={styles.topLabel}>그룹 이성 궁합 TOP 3</span>
        <div className={styles.topList}>
          {top3.map((pair, i) => {
            const normalized = normalizePair(pair);
            const grade = getChemistryByRate(pair.matchRate);
            return (
              <div key={`${normalized.maleId}-${normalized.femaleId}`} className={styles.topCard}>
                <span className={styles.topRank}>{i + 1}</span>
                {/* Male avatar (left) */}
                <div
                  className={styles.topAvatar}
                  style={{ background: getGradient(normalized.maleId) }}
                >
                  {normalized.maleNickname[0]}
                </div>
                <span className={styles.topGenderIconMale}>{'\u2642'}</span>
                <div className={styles.topInfo}>
                  <span className={styles.topNames}>
                    {normalized.maleNickname} & {normalized.femaleNickname}
                  </span>
                  <span className={styles.topGrade}>
                    {grade.grade} &middot; {grade.title}
                  </span>
                </div>
                <span className={styles.topGenderIconFemale}>{'\u2640'}</span>
                {/* Female avatar (right) */}
                <div
                  className={styles.topAvatar}
                  style={{ background: getGradient(normalized.femaleId) }}
                >
                  {normalized.femaleNickname[0]}
                </div>
                <div className={styles.topRate}>
                  <span className={styles.topRateValue}>{pair.matchRate}</span>
                  <span className={styles.topRateUnit}>%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
