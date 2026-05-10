'use client';

import { type FC } from 'react';

import LikeIcon from '@/assets/icon/LikeIcon';
import ProfileAvatar from '@/components/common/ProfileAvatar/ProfileAvatar';
import styles from '@/components/features/Hotpick/CommentModal/CommentItem.module.scss';
import { CommentMenu } from '@/components/features/Hotpick/CommentModal/CommentMenu';
import { getRelativeTime, sanitizeComment } from '@/lib/utils';
import type { CommentItem as CommentItemType } from '@/types/comment';

interface CommentItemProps {
  comment: CommentItemType;
  /** 'comment' (기본): 일반 댓글, 'reply': 대댓글 (들여쓰기) */
  variant?: 'comment' | 'reply';
  /** 답글 작성 폼 열린 상태 */
  replyFormOpen?: boolean;
  onLikeClick: (commentId: string, liked: boolean) => void;
  onEditClick: (comment: CommentItemType) => void;
  onDeleteClick: (comment: CommentItemType) => void;
  /** "답글" 버튼 — 댓글/답글 모두 노출 가능. 클릭 시 부모 commentId의 답글 폼 토글 */
  onReplyClick?: () => void;
}

export const CommentItem: FC<CommentItemProps> = ({
  comment,
  variant = 'comment',
  replyFormOpen = false,
  onLikeClick,
  onEditClick,
  onDeleteClick,
  onReplyClick,
}) => {
  const handleLikeClick = () => {
    onLikeClick(comment.id ?? '', comment.liked ?? false);
  };

  const formatLikeCount = (count: number | undefined): string =>
    (count ?? 0) > 999 ? '999+' : (count ?? 0).toString();

  const isRegisteredUser = comment.isUser ?? false;
  const isReply = variant === 'reply';
  const isWithdrawnUser = !comment.nickname;
  const canManage = !isRegisteredUser || (comment.mine ?? false);

  return (
    <div className={`${styles.commentItem} ${isReply ? styles.commentItemReply : ''}`}>
      <div className={styles.header}>
        {isRegisteredUser && (
          <ProfileAvatar
            nickname={comment.nickname ?? null}
            profileColor={comment.profileColor ?? ''}
            size={isReply ? 20 : 24}
          />
        )}
        <span className={`${styles.nickname} ${isWithdrawnUser ? styles.nicknameWithdrawn : ''}`}>
          {comment.nickname ?? '알수없음'}
        </span>
        <span className={styles.time}>
          {getRelativeTime(comment.createdAt ?? '')}
          {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
            <span className={styles.edited}> (수정됨)</span>
          )}
        </span>
        {canManage && (
          <CommentMenu
            onEdit={() => onEditClick(comment)}
            onDelete={() => onDeleteClick(comment)}
          />
        )}
      </div>

      <p className={styles.content}>{sanitizeComment(comment.content ?? '')}</p>

      <div className={styles.footer}>
        <button
          type="button"
          className={`${styles.likeButton} ${comment.liked ? styles.liked : ''}`}
          onClick={handleLikeClick}
          aria-label={comment.liked ? '좋아요 취소' : '좋아요'}
        >
          <LikeIcon filled={comment.liked ?? false} className={styles.likeIcon} />
          <span className={styles.likeCount}>{formatLikeCount(comment.likeCount)}</span>
        </button>

        {onReplyClick && (
          <button
            type="button"
            className={styles.replyButton}
            onClick={onReplyClick}
            aria-expanded={replyFormOpen}
          >
            {replyFormOpen ? '닫기' : '답글'}
          </button>
        )}
      </div>
    </div>
  );
};
