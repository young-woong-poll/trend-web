'use client';

import { useCallback, useRef, useMemo, useState, type FC } from 'react';

import styles from '@/components/features/Compare/PopularityBarGraph/PopularityBarGraph.module.scss';
import type { QuestionStat } from '@/generated/models/questionStat';

interface PopularityBarGraphProps {
  questionStats: QuestionStat[];
}

interface QuestionBarData {
  electionId: string;
  title: string;
  leftOption: { title: string; percent: number };
  rightOption: { title: string; percent: number };
}

function buildBarData(questionStats: QuestionStat[]): QuestionBarData[] {
  return questionStats
    .filter((q) => q.optionStats && q.optionStats.length >= 2)
    .map((q) => {
      const opts = q.optionStats!;
      const totalVotes = opts.reduce((sum, o) => sum + (o.voteCount ?? 0), 0);
      const left = opts[0];
      const right = opts[1];
      const leftPercent =
        totalVotes > 0 ? Math.round(((left.voteCount ?? 0) / totalVotes) * 100) : 50;
      return {
        electionId: q.electionId ?? '',
        title: q.title ?? '',
        leftOption: { title: left.title ?? '', percent: leftPercent },
        rightOption: { title: right.title ?? '', percent: 100 - leftPercent },
      };
    });
}

/** 개별 질문 카드 */
const QuestionCard: FC<{ q: QuestionBarData }> = ({ q }) => {
  const leftPercent = q.leftOption.percent;
  const leftWins = leftPercent > 50;
  const rightWins = q.rightOption.percent > 50;
  const even = leftPercent === 50;

  return (
    <div className={styles.card}>
      <div className={styles.qTitle}>{q.title}</div>
      <div className={styles.labelRow}>
        <span className={styles.optName}>{q.leftOption.title}</span>
        <span className={`${styles.optName} ${styles.optNameRight}`}>{q.rightOption.title}</span>
      </div>
      <div className={styles.barRow}>
        <span
          className={`${styles.percent} ${leftWins ? styles.winPercent : even ? '' : styles.losePercent}`}
        >
          {leftPercent}%
        </span>
        <div className={styles.barWrapper}>
          <div className={styles.barTrack}>
            <div
              className={`${styles.barFill} ${leftWins ? styles.winFill : ''}`}
              style={{ width: `${leftPercent}%` }}
            />
            <div className={`${styles.barRemain} ${rightWins ? styles.winFill : ''}`} />
          </div>
        </div>
        <span
          className={`${styles.percent} ${styles.percentRight} ${rightWins ? styles.winPercent : even ? '' : styles.losePercent}`}
        >
          {q.rightOption.percent}%
        </span>
      </div>
    </div>
  );
};

export const PopularityBarGraph: FC<PopularityBarGraphProps> = ({ questionStats }) => {
  const barData = useMemo(() => buildBarData(questionStats), [questionStats]);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const dragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0 });

  const handleScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    const cardWidth = el.scrollWidth / barData.length;
    const index = Math.round(el.scrollLeft / cardWidth);
    setActiveIndex(Math.min(index, barData.length - 1));
  }, [barData.length]);

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

  if (barData.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>질문별 대중성 지수</span>
        <div className={styles.sectionLine} />
      </div>
      <p className={styles.sectionDesc}>핫픽 전체 참여자의 투표 결과를 기준으로 산출해요</p>

      <div
        ref={scrollerRef}
        className={styles.cardScroller}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {barData.map((q) => (
          <QuestionCard key={q.electionId} q={q} />
        ))}
      </div>

      {barData.length > 1 && (
        <div className={styles.dots}>
          {barData.map((q, i) => (
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
