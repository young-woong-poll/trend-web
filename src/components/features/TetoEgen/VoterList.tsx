'use client';

import { type FC } from 'react';

import styles from '@/components/features/TetoEgen/VoterList.module.scss';
import { ensureUtcIsoString, getRelativeTime } from '@/lib/utils';
import type { TetoEgenVoter } from '@/types/ask-teto-egen';

type VoterListProps = {
  voters: TetoEgenVoter[];
  // FriendResult에서 자기 자신 row 강조 ("me" sentinel은 BE 계약).
  highlightSelfId?: string | null;
};

const VoterList: FC<VoterListProps> = ({ voters, highlightSelfId = null }) => {
  if (voters.length === 0) {
    return null;
  }

  // 최신순 (votedAt 기준 desc) — BE 정렬을 신뢰하지 않고 FE에서 다시 정렬.
  // votedAt이 timezone designator 없이 내려올 수 있어 UTC로 정규화 후 비교.
  const sorted = [...voters].sort((a, b) => {
    const aTime = new Date(ensureUtcIsoString(a.votedAt)).getTime();
    const bTime = new Date(ensureUtcIsoString(b.votedAt)).getTime();
    return bTime - aTime;
  });

  return (
    <ul className={styles.list} aria-label={`친구 답변 ${voters.length}명`}>
      {sorted.map((v) => {
        const isMe = highlightSelfId !== null && v.userId === highlightSelfId;
        const initial = v.displayName.charAt(0);
        const voteLabel = v.vote === 'TETO' ? '테토' : '에겐';
        const utcVotedAt = ensureUtcIsoString(v.votedAt);
        return (
          <li key={v.userId} className={`${styles.row} ${isMe ? styles.rowMe : ''}`}>
            <div className={styles.avatar} aria-hidden>
              {isMe ? '나' : initial}
            </div>
            <span className={styles.name}>
              {v.displayName}
              {isMe && <span className={styles.tag}>내 답</span>}
            </span>
            <span
              className={`${styles.vote} ${v.vote === 'TETO' ? styles.voteTeto : styles.voteEgen}`}
            >
              {voteLabel}
            </span>
            <time className={styles.time} dateTime={utcVotedAt}>
              {getRelativeTime(utcVotedAt)}
            </time>
          </li>
        );
      })}
    </ul>
  );
};

export default VoterList;
