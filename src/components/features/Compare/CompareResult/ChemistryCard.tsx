import type { FC } from 'react';

import Image from 'next/image';

import styles from '@/components/features/Compare/CompareResult/ChemistryCard.module.scss';
import type { PopularityInfo } from '@/constants/bundle';
import { getCoupleType, IDENTITY_COLORS } from '@/constants/compare';

interface ChemistryCardProps {
  matchRate: number;
  matchCount: number;
  totalQuestions: number;
  myNickname: string;
  targetNickname: string;
  bundleTitle: string;
  myPopularityScore: number;
  targetPopularityScore: number;
  myPopularity: PopularityInfo;
  targetPopularity: PopularityInfo;
}

export const ChemistryCard: FC<ChemistryCardProps> = ({
  matchRate,
  matchCount,
  totalQuestions,
  myNickname,
  targetNickname,
  bundleTitle,
  myPopularityScore,
  targetPopularityScore,
  myPopularity,
  targetPopularity,
}) => {
  const coupleType = getCoupleType(matchRate, myPopularityScore, targetPopularityScore);

  return (
    <div className={styles.container}>
      <div className={styles.bundleTitle}>{bundleTitle}</div>

      {/* 두 캐릭터 나란히 */}
      <div className={styles.characterRow}>
        <div className={styles.characterSide}>
          <span className={styles.characterName} style={{ color: IDENTITY_COLORS.me.main }}>
            {myNickname}
          </span>
          {myPopularity.imagePath ? (
            <Image
              src={myPopularity.imagePath}
              alt={myPopularity.title}
              width={72}
              height={72}
              className={styles.characterImage}
            />
          ) : (
            <div className={styles.characterPlaceholder}>{myPopularity.title[0]}</div>
          )}
          <span className={styles.characterTitle}>{myPopularity.title}</span>
        </div>

        <span className={styles.vs}>×</span>

        <div className={styles.characterSide}>
          <span className={styles.characterName} style={{ color: IDENTITY_COLORS.target.main }}>
            {targetNickname}
          </span>
          {targetPopularity.imagePath ? (
            <Image
              src={targetPopularity.imagePath}
              alt={targetPopularity.title}
              width={72}
              height={72}
              className={styles.characterImage}
            />
          ) : (
            <div className={styles.characterPlaceholder}>{targetPopularity.title[0]}</div>
          )}
          <span className={styles.characterTitle}>{targetPopularity.title}</span>
        </div>
      </div>

      {/* 커플 타입 */}
      <div className={styles.coupleType}>{coupleType.title}</div>
      <div className={styles.coupleDescription}>{coupleType.description}</div>
      <div className={styles.coupleSubtitle}>{coupleType.subtitle}</div>
      <div className={styles.matchCountLabel}>
        {totalQuestions}개 중 {matchCount}개 일치
      </div>
    </div>
  );
};
