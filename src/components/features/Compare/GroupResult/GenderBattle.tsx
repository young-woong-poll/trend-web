'use client';

import { useMemo, type FC } from 'react';

import FemaleIcon from '@/assets/icon/FemaleIcon';
import MaleIcon from '@/assets/icon/MaleIcon';
import styles from '@/components/features/Compare/GroupResult/GenderBattle.module.scss';
import type { GroupCompareResult } from '@/types/group-compare';

interface GenderBattleProps {
  result: GroupCompareResult;
}

interface GenderQuestionStat {
  electionId: string;
  title: string;
  optionA: string;
  optionB: string;
  maleRatioA: number;
  maleRatioB: number;
  femaleRatioA: number;
  femaleRatioB: number;
  genderGap: number;
}

export const GenderBattle: FC<GenderBattleProps> = ({ result }) => {
  const sortedQuestions = useMemo(() => {
    const males = (result.members ?? []).filter((m) => m.gender === 'MALE');
    const females = (result.members ?? []).filter((m) => m.gender === 'FEMALE');

    if (males.length === 0 || females.length === 0) {
      return null;
    }

    const stats: GenderQuestionStat[] = (result.questionStats ?? []).map((q) => {
      const options = q.optionStats ?? [];
      const optA = options[0];
      const optB = options[1];

      const maleAnswers = males
        .map((m) => (m.answers ?? []).find((a) => a.electionId === q.electionId))
        .filter(Boolean);
      const femaleAnswers = females
        .map((m) => (m.answers ?? []).find((a) => a.electionId === q.electionId))
        .filter(Boolean);

      const maleACount = maleAnswers.filter(
        (a) => a?.electionItemId === optA?.electionItemId
      ).length;
      const femaleACount = femaleAnswers.filter(
        (a) => a?.electionItemId === optA?.electionItemId
      ).length;

      const maleTotal = maleAnswers.length;
      const femaleTotal = femaleAnswers.length;

      const maleRatioA = maleTotal > 0 ? (maleACount / maleTotal) * 100 : 0;
      const maleRatioB = maleTotal > 0 ? 100 - maleRatioA : 0;
      const femaleRatioA = femaleTotal > 0 ? (femaleACount / femaleTotal) * 100 : 0;
      const femaleRatioB = femaleTotal > 0 ? 100 - femaleRatioA : 0;

      const genderGap = Math.abs(maleRatioA - femaleRatioA);

      return {
        electionId: q.electionId ?? '',
        title: q.title ?? '',
        optionA: optA?.title ?? '',
        optionB: optB?.title ?? '',
        maleRatioA,
        maleRatioB,
        femaleRatioA,
        femaleRatioB,
        genderGap,
      };
    });

    return stats.sort((a, b) => b.genderGap - a.genderGap);
  }, [result.members, result.questionStats]);

  const genderComment = useMemo(() => {
    if (!sortedQuestions || sortedQuestions.length === 0) {
      return null;
    }
    const avgGap =
      sortedQuestions.reduce((sum, q) => sum + q.genderGap, 0) / sortedQuestions.length;
    if (avgGap >= 30) {
      return '이 그룹은 남녀 의견이 꽤 갈리는 편';
    }
    if (avgGap >= 15) {
      return '남녀 의견 차이가 적당히 있는 편';
    }
    return '남녀 생각이 비슷한 그룹';
  }, [sortedQuestions]);

  if (!sortedQuestions) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>성별 대결</span>
        <div className={styles.sectionLine} />
      </div>

      {genderComment && <p className={styles.subtitle}>{genderComment}</p>}

      <div className={styles.questionList}>
        {sortedQuestions.map((q) => (
          <div key={q.electionId} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.questionTitle}>{q.title}</span>
              {q.genderGap >= 30 && <span className={styles.badgeExtreme}>극심한 차이!</span>}
              {q.genderGap >= 15 && q.genderGap < 30 && (
                <span className={styles.badgeDiff}>의견 차이</span>
              )}
            </div>

            {/* Male row */}
            <div className={styles.genderRow}>
              <div className={styles.genderLabel}>
                <MaleIcon size={14} className={styles.genderIconMale} />
              </div>
              <div className={styles.barArea}>
                <div className={styles.barLabels}>
                  <span className={styles.barLabelLeft}>
                    {q.optionA} {Math.round(q.maleRatioA)}%
                  </span>
                  <span className={styles.barLabelRight}>
                    {q.optionB} {Math.round(q.maleRatioB)}%
                  </span>
                </div>
                <div className={styles.barTrack}>
                  <div className={styles.barMaleA} style={{ width: `${q.maleRatioA}%` }} />
                  <div className={styles.barMaleB} style={{ width: `${q.maleRatioB}%` }} />
                </div>
              </div>
            </div>

            {/* Female row */}
            <div className={styles.genderRow}>
              <div className={styles.genderLabel}>
                <FemaleIcon size={14} className={styles.genderIconFemale} />
              </div>
              <div className={styles.barArea}>
                <div className={styles.barLabels}>
                  <span className={styles.barLabelLeft}>
                    {q.optionA} {Math.round(q.femaleRatioA)}%
                  </span>
                  <span className={styles.barLabelRight}>
                    {q.optionB} {Math.round(q.femaleRatioB)}%
                  </span>
                </div>
                <div className={styles.barTrack}>
                  <div className={styles.barFemaleA} style={{ width: `${q.femaleRatioA}%` }} />
                  <div className={styles.barFemaleB} style={{ width: `${q.femaleRatioB}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
