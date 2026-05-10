'use client';

import { type FC, type ReactNode } from 'react';

import Link from 'next/link';

import styles from '@/components/features/TetoEgen/VoterList.module.scss';
import { getProfileGradient } from '@/constants/profileColors';
import { ensureUtcIsoString, getRelativeTime } from '@/lib/utils';
import type { TetoEgenVoter } from '@/types/ask-teto-egen';

type VoterListProps = {
  voters: TetoEgenVoter[];
  // FriendResult에서 자기 자신 row 강조 ("me" sentinel은 BE 계약).
  highlightSelfId?: string | null;
  // true이면 token 있는 voter는 그 친구의 결과 페이지로 이동 가능.
  // 본인(highlightSelfId 일치) 행은 자기 자신 결과로 가는 게 무의미하므로 항상 비활성.
  enableProfileLink?: boolean;
  // 클릭 가능한 행을 누르기 직전 호출. 사용처에서 history state에 복귀 위치를 새기는 용도.
  onProfileLinkClick?: () => void;
};

const VoterList: FC<VoterListProps> = ({
  voters,
  highlightSelfId = null,
  enableProfileLink = false,
  onProfileLinkClick,
}) => {
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
        const isClickable = enableProfileLink && !isMe && Boolean(v.tetoEgenToken);

        // 본인 행은 기존 teto-blue 강조(rowMe avatar 스타일)를 유지하기 위해 gradient 미적용.
        // 다른 voter는 BE가 내려준 profileColor(없으면 기본값 fallback)로 그라데이션.
        const avatarStyle =
          !isMe && v.profileColor ? { background: getProfileGradient(v.profileColor) } : undefined;

        const rowInner: ReactNode = (
          <>
            <div className={styles.avatar} style={avatarStyle} aria-hidden>
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
            {/* chevron 슬롯은 클릭 가능 여부와 무관하게 항상 자리 차지 — 행 간 세로 정렬 일관성. */}
            <span className={styles.chevronSlot} aria-hidden>
              {isClickable && (
                <svg
                  className={styles.chevron}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
          </>
        );

        const rowClass = `${styles.row} ${isMe ? styles.rowMe : ''} ${isClickable ? styles.rowClickable : ''}`;

        return (
          <li key={v.userId} className={rowClass}>
            {isClickable ? (
              <Link
                href={`/ask/teto-egen/friend/${v.tetoEgenToken}`}
                className={styles.rowLink}
                aria-label={`${v.displayName}님의 결과 보기`}
                onClick={onProfileLinkClick}
              >
                {rowInner}
              </Link>
            ) : (
              rowInner
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default VoterList;
