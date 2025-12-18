'use client';

import type { FC } from 'react';

import CheckIcon from '@/assets/icon/CheckIcon';
import CommentIcon from '@/assets/icon/CommentIcon';
import InfoIcon from '@/assets/icon/InfoIcon';
import LinkIcon from '@/assets/icon/LinkIcon';
import styles from '@/components/features/Vote/ActionButtons/ActionButtons.module.scss';
import { useModal } from '@/contexts/ModalContext';
import { useCommentCountQuery } from '@/hooks/api/useComment';

interface ActionButtonsProps {
  trendId: string;
  itemId: string;
  commentDisabled?: boolean;
  onCommentClick: () => void;
}

export const ActionButtons: FC<ActionButtonsProps> = ({
  trendId,
  itemId,
  commentDisabled = false,
  onCommentClick,
}) => {
  // TODO : 전체 댓글 개수 가져오는 API 로 변경필요
  const { data: commentCountData } = useCommentCountQuery(trendId, itemId);
  const commentCount = commentCountData?.count;

  const { showToast } = useModal();

  const handleCommentClick = () => {
    if (commentDisabled) {
      showToast('투표하면 댓글을 확인할 수 있습니다', <InfoIcon />);

      return;
    }

    onCommentClick();
  };

  const handleLinkCopyClick = async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);

      showToast('투표 링크가 복사되었습니다', <CheckIcon />);
    } catch (_error) {
      showToast('링크 복사에 실패했습니다', <InfoIcon />);
    }
  };

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.button}
        onClick={handleCommentClick}
        disabled={commentDisabled}
      >
        <div className={styles.icon}>
          <CommentIcon />
        </div>
        <span className={styles.label}>
          {commentCount || commentCount === 0 ? commentCount : '?'}
        </span>
      </button>

      <button type="button" className={styles.button} onClick={handleLinkCopyClick}>
        <div className={styles.icon}>
          <LinkIcon />
        </div>
        <span className={styles.label}>링크복사</span>
      </button>
    </div>
  );
};
