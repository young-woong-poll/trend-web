'use client';

import { type FC } from 'react';

import ChevronDownIcon from '@/assets/icon/ChevronDownIcon';
import { CommentItem } from '@/components/features/Hotpick/CommentModal/CommentItem';
import styles from '@/components/features/Hotpick/CommentModal/RepliesList.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import { useInfiniteReplies } from '@/hooks/api';
import type { CommentItem as CommentItemType } from '@/types/comment';

interface RepliesListProps {
  parentCommentId: string;
  onLikeClick: (commentId: string, liked: boolean) => void;
  onEditRequest: (comment: CommentItemType) => void;
  onDeleteRequest: (comment: CommentItemType) => void;
  /** 답글 리스트 접기 — `hasNextPage`가 false일 때 노출되는 "답글 숨기기" 핸들러 */
  onCollapse: () => void;
}

export const RepliesList: FC<RepliesListProps> = ({
  parentCommentId,
  onLikeClick,
  onEditRequest,
  onDeleteRequest,
  onCollapse,
}) => {
  const { isLoggedIn } = useAuth();
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteReplies({
    commentId: parentCommentId,
    isLoggedIn,
    size: 5,
  });

  if (isLoading) {
    return <div className={styles.loading}>답글을 불러오는 중...</div>;
  }

  const replies = data?.pages.flatMap((page) => page.comments ?? []) ?? [];

  if (replies.length === 0) {
    return null;
  }

  return (
    <div className={styles.repliesList}>
      {replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          variant="reply"
          onLikeClick={onLikeClick}
          onEditClick={onEditRequest}
          onDeleteClick={onDeleteRequest}
        />
      ))}
      {hasNextPage ? (
        <button
          type="button"
          className={styles.toggleButton}
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          <ChevronDownIcon className={styles.toggleChevron} aria-hidden />
          {isFetchingNextPage ? '불러오는 중...' : '답글 더보기'}
        </button>
      ) : (
        <button type="button" className={styles.toggleButton} onClick={onCollapse}>
          <ChevronDownIcon className={`${styles.toggleChevron} ${styles.expanded}`} aria-hidden />
          답글 숨기기
        </button>
      )}
    </div>
  );
};
