'use client';

import { type FC } from 'react';

import LikeIcon from '@/assets/icon/LikeIcon';
import styles from '@/components/features/Vote/CommentModal/CommentItem.module.scss';
import type { CommentItem as CommentItemType } from '@/generated/models';
import { getRelativeTime } from '@/lib/utils';

interface CommentItemProps {
  comment: CommentItemType;
  onLikeClick: (commentId: string, liked: boolean) => void;
  onEditClick: (comment: CommentItemType) => void;
  onDeleteClick: (comment: CommentItemType) => void;
}

export const CommentItem: FC<CommentItemProps> = ({
  comment,
  onLikeClick,
  onEditClick,
  onDeleteClick,
}) => {
  const handleLikeClick = () => {
    onLikeClick(comment.id ?? '', comment.liked ?? false);
  };

  const handleEditClick = () => {
    onEditClick(comment);
  };

  const handleDeleteClick = () => {
    onDeleteClick(comment);
  };

  const formatLikeCount = (count: number | undefined): string =>
    (count ?? 0) > 999 ? '999+' : (count ?? 0).toString();

  return (
    <div className={styles.commentItem}>
      {/* 헤더: 닉네임, 시간 */}
      <div className={styles.header}>
        <span className={styles.nickname}>{comment.nickname}</span>
        <span className={styles.time}>
          {getRelativeTime(comment.createdAt ?? '')}
          {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
            <span className={styles.edited}> (수정됨)</span>
          )}
        </span>
      </div>

      {/* 댓글 내용 */}
      <p className={styles.content}>{comment.content}</p>

      {/* 하단: 좋아요, 수정/삭제 버튼 */}
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

        <div className={styles.actionButtons}>
          <button
            type="button"
            className={styles.editButton}
            onClick={handleEditClick}
            aria-label="댓글 수정"
          >
            수정
          </button>

          <button
            type="button"
            className={styles.deleteButton}
            onClick={handleDeleteClick}
            aria-label="댓글 삭제"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
};
