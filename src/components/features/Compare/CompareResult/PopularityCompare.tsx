import { useState, type FC } from 'react';

import Image from 'next/image';

import { PersonDetailSheet } from '@/components/features/Compare/CompareResult/PersonDetailSheet';
import styles from '@/components/features/Compare/CompareResult/PopularityCompare.module.scss';
import { calcPopularityScore, getPopularityByScore } from '@/constants/bundle';
import { IDENTITY_COLORS } from '@/constants/compare';
import type { CompareResult } from '@/types/compare';

interface PopularityCompareProps {
  result: CompareResult;
}

export const PopularityCompare: FC<PopularityCompareProps> = ({ result }) => {
  const myScore = calcPopularityScore(result.me.answers, result.questionStats);
  const targetScore = calcPopularityScore(result.target.answers, result.questionStats);
  const myPopularity = getPopularityByScore(myScore);
  const targetPopularity = getPopularityByScore(targetScore);
  const [detailPerson, setDetailPerson] = useState<'me' | 'target' | null>(null);

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>대중성 비교</span>
        <div className={styles.sectionLine} />
      </div>

      <div className={styles.compareRow}>
        <div
          className={styles.personCard}
          style={{ borderTop: `2px solid ${IDENTITY_COLORS.me.main}` }}
          onClick={() => setDetailPerson('me')}
        >
          <span className={styles.personName} style={{ color: IDENTITY_COLORS.me.main }}>
            {result.me.nickname}
          </span>
          {myPopularity.imagePath ? (
            <Image
              src={myPopularity.imagePath}
              alt={myPopularity.title}
              width={64}
              height={64}
              className={styles.personImage}
            />
          ) : (
            <div
              className={styles.personPlaceholder}
              style={{ background: 'linear-gradient(135deg, #ff00ff, #ff4500)' }}
            >
              {myPopularity.grade[0]}
            </div>
          )}
          <div>
            <span className={styles.personScore}>{myScore}</span>
            <span className={styles.personScoreUnit}>%</span>
          </div>
          <span className={styles.personTitle}>{myPopularity.title}</span>
          <span className={styles.personDescription}>{myPopularity.description}</span>
        </div>

        <div
          className={styles.personCard}
          style={{ borderTop: `2px solid ${IDENTITY_COLORS.target.main}` }}
          onClick={() => setDetailPerson('target')}
        >
          <span className={styles.personName} style={{ color: IDENTITY_COLORS.target.main }}>
            {result.target.nickname}
          </span>
          {targetPopularity.imagePath ? (
            <Image
              src={targetPopularity.imagePath}
              alt={targetPopularity.title}
              width={64}
              height={64}
              className={styles.personImage}
            />
          ) : (
            <div
              className={styles.personPlaceholder}
              style={{ background: 'linear-gradient(135deg, #ff00ff, #ff4500)' }}
            >
              {targetPopularity.grade[0]}
            </div>
          )}
          <div>
            <span className={styles.personScore}>{targetScore}</span>
            <span className={styles.personScoreUnit}>%</span>
          </div>
          <span className={styles.personTitle}>{targetPopularity.title}</span>
          <span className={styles.personDescription}>{targetPopularity.description}</span>
        </div>
      </div>

      {detailPerson && (
        <PersonDetailSheet
          result={result}
          person={detailPerson}
          onClose={() => setDetailPerson(null)}
        />
      )}
    </div>
  );
};
