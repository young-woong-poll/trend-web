'use client';

import { useEffect, useLayoutEffect, useRef, useState, type FC } from 'react';

import { createPortal } from 'react-dom';

import styles from '@/components/features/Compare/GroupResult/GroupStats.module.scss';
import {
  findUnanimousQuestions,
  findControversyPoints,
  type ControversyMember,
} from '@/constants/group-compare';
import type { GroupCompareResult } from '@/types/group-compare';

const MEMBER_GRADIENTS = [
  'linear-gradient(135deg, #ff00ff, #ff4500)',
  'linear-gradient(135deg, #4FC3F7, #00BCD4)',
  'linear-gradient(135deg, #FFD700, #FFA500)',
  'linear-gradient(135deg, #66BB6A, #00BCD4)',
  'linear-gradient(135deg, #8B5CF6, #EC4899)',
  'linear-gradient(135deg, #FF6B35, #FF00FF)',
];

interface GroupStatsProps {
  result: GroupCompareResult;
}

/** 겹치는 아바타 스택 + 클릭 시 인라인 툴팁 */
const AvatarStack: FC<{ members: ControversyMember[] }> = ({ members }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [ready, setReady] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const MAX_SHOW = 4;
  const visible = members.slice(0, MAX_SHOW);
  const overflow = members.length - MAX_SHOW;

  // paint 전에 위치 계산 → 튀기 방지
  useLayoutEffect(() => {
    if (!open || !btnRef.current) {
      setReady(false);
      return;
    }
    const rect = btnRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX + rect.width / 2,
    });
    setReady(true);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleOutside = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) {
        return;
      }
      if (tooltipRef.current?.contains(e.target as Node)) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside as EventListener);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside as EventListener);
    };
  }, [open]);

  return (
    <div className={styles.stackWrapper}>
      <button
        ref={btnRef}
        type="button"
        className={styles.stack}
        onClick={() => setOpen((v) => !v)}
      >
        {visible.map((m, i) => (
          <div
            key={m.memberIndex}
            className={styles.stackCircle}
            style={{
              background: MEMBER_GRADIENTS[m.memberIndex % MEMBER_GRADIENTS.length],
              zIndex: MAX_SHOW - i,
            }}
          >
            {m.nickname[0]}
          </div>
        ))}
      </button>
      {overflow > 0 && <span className={styles.stackOverflow}>+{overflow}</span>}

      {open &&
        ready &&
        createPortal(
          <div
            ref={tooltipRef}
            className={styles.stackTooltip}
            style={{ top: pos.top, left: pos.left }}
          >
            {members.map((m) => (
              <div key={m.memberIndex} className={styles.stackTooltipRow}>
                <div
                  className={styles.stackTooltipCircle}
                  style={{
                    background: MEMBER_GRADIENTS[m.memberIndex % MEMBER_GRADIENTS.length],
                  }}
                >
                  {m.nickname[0]}
                </div>
                <span className={styles.stackTooltipName}>{m.nickname}</span>
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
};

export const GroupStats: FC<GroupStatsProps> = ({ result }) => {
  const unanimous = findUnanimousQuestions(result);
  const controversy = findControversyPoints(result);

  if (unanimous.length === 0 && controversy.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      {unanimous.length > 0 && (
        <>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>만장일치</span>
            <div className={styles.sectionLine} />
          </div>
          <div className={styles.questionList}>
            {unanimous.map((q) => (
              <div key={q.electionId} className={styles.questionItem}>
                <span className={styles.questionTitle}>{q.title}</span>
                <span className={`${styles.badge} ${styles.unanimousBadge}`}>
                  만장일치: {q.unanimousAnswer}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {controversy.length > 0 && (
        <>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>논쟁이 되는 투표</span>
            <div className={styles.sectionLine} />
          </div>
          <div className={styles.controversyList}>
            {controversy.map((q) => (
              <div key={q.electionId} className={styles.controversyCard}>
                <span className={styles.controversyTitle}>{q.title}</span>
                <div className={styles.stanceRow}>
                  <div className={styles.stanceSide}>
                    <span className={styles.stanceOption}>{q.optionA}</span>
                    <span className={styles.stanceRatio}>{q.membersA.length}명</span>
                    <AvatarStack members={q.membersA} />
                  </div>
                  <span className={styles.vsLabel}>VS</span>
                  <div className={`${styles.stanceSide} ${styles.stanceSideRight}`}>
                    <span className={styles.stanceOption}>{q.optionB}</span>
                    <span className={styles.stanceRatio}>{q.membersB.length}명</span>
                    <AvatarStack members={q.membersB} />
                  </div>
                </div>
                <div className={styles.ratioBar}>
                  <div className={styles.ratioA} style={{ width: `${q.ratioA}%` }} />
                  <div className={styles.ratioB} style={{ width: `${q.ratioB}%` }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
