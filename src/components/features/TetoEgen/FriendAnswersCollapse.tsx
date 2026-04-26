'use client';

import { type FC, useState } from 'react';

import ChevronDownIcon from '@/assets/icon/ChevronDownIcon';
import styles from '@/components/features/TetoEgen/FriendAnswersCollapse.module.scss';
import type { TetoEgenFriendVotes } from '@/types/ask-teto-egen';

type FriendAnswersCollapseProps = {
  friendVotes: TetoEgenFriendVotes;
  highlightSelfId?: string | null;
};

const FriendAnswersCollapse: FC<FriendAnswersCollapseProps> = ({
  friendVotes,
  highlightSelfId,
}) => {
  const [open, setOpen] = useState(false);

  if (friendVotes.total === 0) {
    return null;
  }

  const tetoPercent = Math.round((friendVotes.tetoCount / friendVotes.total) * 100);
  const egenPercent = 100 - tetoPercent;
  const tetoVoters = friendVotes.voters.filter((v) => v.vote === 'TETO');
  const egenVoters = friendVotes.voters.filter((v) => v.vote === 'EGEN');
  const isMajorTeto = friendVotes.tetoCount > friendVotes.egenCount;
  const isMajorEgen = friendVotes.egenCount > friendVotes.tetoCount;

  return (
    <section className={styles.root}>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={styles.toggleText}>친구 {friendVotes.total}명 답변 보기</span>
        <ChevronDownIcon className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
      </button>

      {open && (
        <div className={styles.body}>
          <div className={styles.group}>
            <div className={styles.groupHeader}>
              <span className={styles.groupLabel}>테토</span>
              <span className={styles.groupCount}>
                {friendVotes.tetoCount}명 · {tetoPercent}%
              </span>
            </div>
            <div className={styles.barTrack}>
              <div
                className={`${styles.barFill} ${isMajorTeto ? styles.barFillMajor : ''}`}
                style={{ width: `${tetoPercent}%` }}
              />
            </div>
            <ul className={styles.chips}>
              {tetoVoters.map((v) => (
                <li
                  key={v.userId}
                  className={`${styles.chip} ${
                    v.userId === highlightSelfId ? styles.chipMine : ''
                  }`}
                >
                  {v.displayName}
                  {v.userId === highlightSelfId && (
                    <span className={styles.mineBadge}>내 선택</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.group}>
            <div className={styles.groupHeader}>
              <span className={styles.groupLabel}>에겐</span>
              <span className={styles.groupCount}>
                {friendVotes.egenCount}명 · {egenPercent}%
              </span>
            </div>
            <div className={styles.barTrack}>
              <div
                className={`${styles.barFill} ${isMajorEgen ? styles.barFillMajor : ''}`}
                style={{ width: `${egenPercent}%` }}
              />
            </div>
            <ul className={styles.chips}>
              {egenVoters.map((v) => (
                <li
                  key={v.userId}
                  className={`${styles.chip} ${
                    v.userId === highlightSelfId ? styles.chipMine : ''
                  }`}
                >
                  {v.displayName}
                  {v.userId === highlightSelfId && (
                    <span className={styles.mineBadge}>내 선택</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
};

export default FriendAnswersCollapse;
