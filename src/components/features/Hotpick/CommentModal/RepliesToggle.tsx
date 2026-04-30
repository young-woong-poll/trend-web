'use client';

import { type FC } from 'react';

import ChevronDownIcon from '@/assets/icon/ChevronDownIcon';
import styles from '@/components/features/Hotpick/CommentModal/RepliesToggle.module.scss';

interface RepliesToggleProps {
  replyCount: number;
  expanded: boolean;
  onClick: () => void;
}

export const RepliesToggle: FC<RepliesToggleProps> = ({ replyCount, expanded, onClick }) => (
  <button type="button" className={styles.toggleReplies} onClick={onClick} aria-expanded={expanded}>
    <ChevronDownIcon
      className={`${styles.toggleChevron} ${expanded ? styles.expanded : ''}`}
      aria-hidden
    />
    {expanded ? '답글 숨기기' : `답글 ${replyCount}개`}
  </button>
);
