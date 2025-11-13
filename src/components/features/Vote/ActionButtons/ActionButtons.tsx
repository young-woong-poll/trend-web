'use client';

import type { FC } from 'react';

import CommentIcon from '@/assets/icon/CommentIcon';
import LinkIcon from '@/assets/icon/LinkIcon';

import styles from './ActionButtons.module.scss';

interface ActionButtonsProps {
  /**
   * 댓글 수
   */
  commentCount: number;
  /**
   * 댓글 버튼 클릭 핸들러
   */
  onCommentClick?: () => void;
  /**
   * 링크 복사 버튼 클릭 핸들러
   */
  onLinkCopyClick?: () => void;
}

export const ActionButtons: FC<ActionButtonsProps> = ({
  commentCount,
  onCommentClick,
  onLinkCopyClick,
}) => (
  <div className={styles.container}>
    <button type="button" className={styles.button} onClick={onCommentClick}>
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
