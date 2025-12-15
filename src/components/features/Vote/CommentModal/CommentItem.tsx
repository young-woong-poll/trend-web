'use client';

import { type FC } from 'react';

import styles from '@/components/features/Vote/CommentModal/CommentItem.module.scss';
import { getRelativeTime } from '@/lib/utils';
import type { CommentItem as CommentItemType } from '@/types/comment';

interface CommentItemProps {
  comment: CommentItemType;
  onLikeClick: (commentId: string, liked: boolean) => void;
  onEditClick: (comment: CommentItemType) => void;
}

export const CommentItem: FC<CommentItemProps> = ({ comment, onLikeClick, onEditClick }) => {
  const handleLikeClick = () => {
    onLikeClick(comment.id, comment.liked);
  };

  const handleEditClick = () => {
    onEditClick(comment);
  };

  return (
    <div className={styles.commentItem}>
      {/* 헤더: 닉네임, 시간 */}
      <div className={styles.header}>
        <span className={styles.nickname}>{comment.nickname}</span>
        <span className={styles.time}>
          {getRelativeTime(comment.createdAt)}
          {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
            <span className={styles.edited}> (수정됨)</span>
          )}
        </span>
      </div>

      {/* 댓글 내용 */}
      <p className={styles.content}>{comment.content}</p>

      {/* 하단: 좋아요, 수정 버튼 */}
      <div className={styles.footer}>
        <button
          type="button"
          className={`${styles.likeButton} ${comment.liked ? styles.liked : ''}`}
          onClick={handleLikeClick}
          aria-label={comment.liked ? '좋아요 취소' : '좋아요'}
        >
          <span className={styles.likeIcon}>👍</span>
          <span className={styles.likeCount}>{comment.likeCount}</span>
        </button>

        <button
          type="button"
          className={styles.editButton}
          onClick={handleEditClick}
          aria-label="댓글 수정"
        >
          수정
        </button>
      </div>
    </div>
  );
};
