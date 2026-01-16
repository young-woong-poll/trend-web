'use client';

import type { FC } from 'react';

import StartArrowIcon from '@/assets/icon/StartArrowIcon';
import styles from '@/components/features/Vote/VoteBottomButtons/VoteBottomButtons.module.scss';

interface VoteBottomButtonsProps {
  commentCount?: number;
  commentDisabled?: boolean;
  nextDisabled?: boolean;
  onCommentClick: () => void;
  onNextClick: () => void;
}

export const VoteBottomButtons: FC<VoteBottomButtonsProps> = ({
  commentCount,
  commentDisabled = false,
  nextDisabled = false,
  onCommentClick,
  onNextClick,
}) => (
  <div className={styles.bottomButtons}>
    <button
      type="button"
      className={styles.commentButton}
      onClick={onCommentClick}
      disabled={commentDisabled}
    >
      댓글{commentCount !== undefined && ` (${commentCount})`}
    </button>

    <button
      type="button"
      className={styles.nextButton}
      onClick={onNextClick}
      disabled={nextDisabled}
    >
      다음
      <StartArrowIcon />
    </button>
  </div>
);
