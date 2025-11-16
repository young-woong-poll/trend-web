'use client';

import type { FC } from 'react';

import CommentIcon from '@/assets/icon/CommentIcon';
import LinkIcon from '@/assets/icon/LinkIcon';
import styles from '@/components/features/Vote/ActionButtons/ActionButtons.module.scss';

interface ActionButtonsProps {
  commentCount: number;
  onCommentClick?: () => void;
  onLinkCopyClick?: () => void;
  commentDisabled?: boolean;
}

export const ActionButtons: FC<ActionButtonsProps> = ({
  commentCount,
  onCommentClick,
  onLinkCopyClick,
  commentDisabled = false,
}) => (
  <div className={styles.container}>
    <button
      type="button"
      className={styles.button}
      onClick={onCommentClick}
      disabled={commentDisabled}
    >
      <div className={styles.icon}>
        <CommentIcon />
      </div>
      <span className={styles.label}>{commentCount}</span>
    </button>

    <button type="button" className={styles.button} onClick={onLinkCopyClick}>
      <div className={styles.icon}>
        <LinkIcon />
      </div>
      <span className={styles.label}>링크복사</span>
    </button>
  </div>
);
