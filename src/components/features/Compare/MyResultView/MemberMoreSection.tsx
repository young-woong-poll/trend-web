'use client';

import { useState, type FC } from 'react';

import styles from '@/components/features/Compare/MyResultView/MemberMoreSection.module.scss';
import type { PairChemistry } from '@/types/group-compare';

interface MemberMoreMember {
  userId: string;
  nickname: string;
  displayProfileColor?: string;
}

interface MemberMoreSectionProps {
  currentUserId: string;
  members: MemberMoreMember[];
  pairs: PairChemistry[];
  onMemberTap: (userId: string) => void;
}

export const MemberMoreSection: FC<MemberMoreSectionProps> = ({
  currentUserId,
  members,
  pairs,
  onMemberTap,
}) => {
  const [open, setOpen] = useState(false);

  const rows = members
    .filter((m) => m.userId !== currentUserId)
    .map((m) => {
      const p = pairs.find(
        (pp) =>
          (pp.memberA === currentUserId && pp.memberB === m.userId) ||
          (pp.memberB === currentUserId && pp.memberA === m.userId)
      );
      return { ...m, matchRate: p?.matchRate ?? 0 };
    })
    .sort((a, b) => b.matchRate - a.matchRate);

  if (rows.length === 0) {
    return null;
  }

  return (
    <section className={styles.section}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
        }}
      >
        모든 멤버 결과 자세히 보기 {open ? '▴' : '▾'}
      </button>
      {open && (
        <ul className={styles.list}>
          {rows.map((r) => (
            <li key={r.userId}>
              <button
                type="button"
                className={styles.row}
                onClick={() => {
                  onMemberTap(r.userId);
                }}
              >
                <span
                  className={styles.avatar}
                  style={{ background: r.displayProfileColor ?? '#8a8a8a' }}
                  aria-hidden
                >
                  {r.nickname.slice(0, 1)}
                </span>
                <span className={styles.name}>{r.nickname}</span>
                <span className={styles.rate}>{r.matchRate}%</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
