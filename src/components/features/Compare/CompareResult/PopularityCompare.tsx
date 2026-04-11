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
  const me = result.me ?? {};
  const target = result.target ?? {};
  const questionStats = result.questionStats ?? [];
  const myScore = calcPopularityScore(me.answers ?? [], questionStats);
  const targetScore = calcPopularityScore(target.answers ?? [], questionStats);
  const myPopularity = getPopularityByScore(myScore);
  const targetPopularity = getPopularityByScore(targetScore);
  const [detailPerson, setDetailPerson] = useState<'me' | 'target' | null>(null);

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>대중성 비교</span>
        <div className={styles.sectionLine} />
      </div>
      <p className={styles.sectionSub}>
        각 질문 득표율 평균으로, 높을수록 다수파 · 낮을수록 소수파
        <br />* 현재{' '}
        {questionStats[0]
          ? (questionStats[0].optionACount ?? 0) + (questionStats[0].optionBCount ?? 0)
          : 0}
        명 참여 기준 · 참여자가 늘면 업데이트 돼요
      </p>

      <div className={styles.compareRow}>
        <div
          className={styles.personCard}
          style={{ borderTop: `2px solid ${IDENTITY_COLORS.me.main}` }}
          onClick={() => setDetailPerson('me')}
        >
          <span className={styles.personName} style={{ color: IDENTITY_COLORS.me.main }}>
            {me.nickname ?? ''}
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
          <span className={styles.personTitle}>{myPopularity.title}</span>
          <span className={styles.personDescription}>{myPopularity.description}</span>
        </div>

        <div
          className={styles.personCard}
          style={{ borderTop: `2px solid ${IDENTITY_COLORS.target.main}` }}
          onClick={() => setDetailPerson('target')}
        >
          <span className={styles.personName} style={{ color: IDENTITY_COLORS.target.main }}>
            {target.nickname ?? ''}
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
