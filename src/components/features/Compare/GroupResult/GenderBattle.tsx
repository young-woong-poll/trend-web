'use client';

import { useCallback, useMemo, useRef, useState, type FC } from 'react';

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

/** 개별 질문 카드 — 옵션명은 상단에 한 번만, 남/여 바를 바짝 붙여 비교 */
const GenderCard: FC<{ q: GenderQuestionStat }> = ({ q }) => (
  <div className={styles.card}>
    <div className={styles.cardHeader}>
      <span className={styles.questionTitle}>{q.title}</span>
      {q.genderGap >= 30 && <span className={styles.badgeExtreme}>극심한 차이!</span>}
      {q.genderGap >= 15 && q.genderGap < 30 && <span className={styles.badgeDiff}>의견 차이</span>}
    </div>

    {/* 옵션명 한 번만 노출 */}
    <div className={styles.labelRow}>
      <span className={styles.optName}>{q.optionA}</span>
      <span className={`${styles.optName} ${styles.optNameRight}`}>{q.optionB}</span>
    </div>

    {/* 남녀 바를 한 그룹으로 묶어 좁은 간격 유지 */}
    <div className={styles.barGroup}>
      <div className={styles.genderRow}>
        <MaleIcon size={14} className={styles.genderIconMale} />
        <span
          className={`${styles.percent} ${q.maleRatioA >= 50 ? styles.percentWinMale : styles.percentLose}`}
        >
          {Math.round(q.maleRatioA)}%
        </span>
        <div className={styles.barTrack}>
          <div className={styles.barMaleA} style={{ width: `${q.maleRatioA}%` }} />
          <div className={styles.barMaleB} style={{ width: `${q.maleRatioB}%` }} />
        </div>
        <span
          className={`${styles.percent} ${styles.percentRight} ${q.maleRatioB >= 50 ? styles.percentWinMale : styles.percentLose}`}
        >
          {Math.round(q.maleRatioB)}%
        </span>
      </div>

      <div className={styles.genderRow}>
        <FemaleIcon size={14} className={styles.genderIconFemale} />
        <span
          className={`${styles.percent} ${q.femaleRatioA >= 50 ? styles.percentWinFemale : styles.percentLose}`}
        >
          {Math.round(q.femaleRatioA)}%
        </span>
        <div className={styles.barTrack}>
          <div className={styles.barFemaleA} style={{ width: `${q.femaleRatioA}%` }} />
          <div className={styles.barFemaleB} style={{ width: `${q.femaleRatioB}%` }} />
        </div>
        <span
          className={`${styles.percent} ${styles.percentRight} ${q.femaleRatioB >= 50 ? styles.percentWinFemale : styles.percentLose}`}
        >
          {Math.round(q.femaleRatioB)}%
        </span>
      </div>
    </div>
  </div>
);

export const GenderBattle: FC<GenderBattleProps> = ({ result }) => {
  const sortedQuestions = useMemo(() => {
    const males = (result.members ?? []).filter((m) => m.gender === 'MALE');
    const females = (result.members ?? []).filter((m) => m.gender === 'FEMALE');

    if (males.length < 2 || females.length < 2) {
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

  // ─── 슬라이드 스크롤 로직 (PopularityBarGraph와 동일) ───
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const dragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0 });

  const total = sortedQuestions?.length ?? 0;

  const handleScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || total === 0) {
      return;
    }
    const cardWidth = el.scrollWidth / total;
    const index = Math.round(el.scrollLeft / cardWidth);
    setActiveIndex(Math.min(index, total - 1));
  }, [total]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    dragState.current = { isDragging: true, startX: e.pageX, scrollLeft: el.scrollLeft };
    el.style.scrollSnapType = 'none';
    el.style.scrollBehavior = 'auto';
    el.style.cursor = 'grabbing';
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.current.isDragging) {
      return;
    }
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    e.preventDefault();
    el.scrollLeft = dragState.current.scrollLeft - (e.pageX - dragState.current.startX);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!dragState.current.isDragging) {
      return;
    }
    dragState.current.isDragging = false;
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    el.style.scrollBehavior = 'smooth';
    el.style.scrollSnapType = 'x mandatory';
    el.style.cursor = '';
    const onEnd = () => {
      el.style.scrollBehavior = '';
      el.removeEventListener('scrollend', onEnd);
    };
    el.addEventListener('scrollend', onEnd);
    setTimeout(() => {
      el.style.scrollBehavior = '';
      el.removeEventListener('scrollend', onEnd);
    }, 400);
  }, []);

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

      <div
        ref={scrollerRef}
        className={styles.cardScroller}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {sortedQuestions.map((q) => (
          <GenderCard key={q.electionId} q={q} />
        ))}
      </div>

      {sortedQuestions.length > 1 && (
        <div className={styles.dots}>
          {sortedQuestions.map((q, i) => (
            <div
              key={q.electionId}
              className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ''}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
