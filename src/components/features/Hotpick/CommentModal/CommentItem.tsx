'use client';

import { type FC } from 'react';

import LikeIcon from '@/assets/icon/LikeIcon';
import ProfileAvatar from '@/components/common/ProfileAvatar/ProfileAvatar';
import styles from '@/components/features/Hotpick/CommentModal/CommentItem.module.scss';
import { getRelativeTime, sanitizeComment } from '@/lib/utils';
import type { CommentItem as CommentItemType } from '@/types/comment';

interface CommentItemProps {
  comment: CommentItemType;
  /** 'comment' (기본): 일반 댓글, 'reply': 대댓글 (들여쓰기 + 답글 버튼 숨김) */
  variant?: 'comment' | 'reply';
  /** 답글 목록 펼친 상태 */
  repliesExpanded?: boolean;
  /** 답글 작성 폼 열린 상태 */
  replyFormOpen?: boolean;
  onLikeClick: (commentId: string, liked: boolean) => void;
  onEditClick: (comment: CommentItemType) => void;
  onDeleteClick: (comment: CommentItemType) => void;
  /** "답글 N개 보기" 토글 — 댓글이고 replyCount > 0일 때만 노출 */
  onToggleReplies?: () => void;
  /** "답글" 버튼 — 댓글일 때만 노출 (대댓글의 대댓글은 미지원) */
  onReplyClick?: () => void;
}

export const CommentItem: FC<CommentItemProps> = ({
  comment,
  variant = 'comment',
  repliesExpanded = false,
  replyFormOpen = false,
  onLikeClick,
  onEditClick,
  onDeleteClick,
  onToggleReplies,
  onReplyClick,
}) => {
  const handleLikeClick = () => {
    onLikeClick(comment.id ?? '', comment.liked ?? false);
  };

  const formatLikeCount = (count: number | undefined): string =>
    (count ?? 0) > 999 ? '999+' : (count ?? 0).toString();

  const isRegisteredUser = !!comment.profileColor;
  const replyCount = comment.replyCount ?? 0;
  const isReply = variant === 'reply';

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
        <span className={styles.nickname}>{comment.nickname}</span>
        <span className={styles.time}>
          {getRelativeTime(comment.createdAt ?? '')}
          {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
            <span className={styles.edited}> (수정됨)</span>
          )}
        </span>
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

        <div className={styles.actionButtons}>
          {!isReply && onReplyClick && (
            <button
              type="button"
              className={styles.replyButton}
              onClick={onReplyClick}
              aria-expanded={replyFormOpen}
            >
              {replyFormOpen ? '닫기' : '답글'}
            </button>
          )}
          {(!isRegisteredUser || comment.isMine) && (
            <>
              <button
                type="button"
                className={styles.editButton}
                onClick={() => onEditClick(comment)}
                aria-label="댓글 수정"
              >
                수정
              </button>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={() => onDeleteClick(comment)}
                aria-label="댓글 삭제"
              >
                삭제
              </button>
            </>
          )}
        </div>
      </div>

      {!isReply && replyCount > 0 && onToggleReplies && (
        <button
          type="button"
          className={styles.toggleReplies}
          onClick={onToggleReplies}
          aria-expanded={repliesExpanded}
        >
          <span className={styles.toggleLine} aria-hidden />
          <span className={styles.toggleText}>
            {repliesExpanded ? '답글 숨기기' : `답글 ${replyCount}개 보기`}
          </span>
        </button>
      )}
    </div>
  );
};
