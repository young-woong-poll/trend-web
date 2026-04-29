'use client';

import { type FC } from 'react';

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
}

export const RepliesList: FC<RepliesListProps> = ({
  parentCommentId,
  onLikeClick,
  onEditRequest,
  onDeleteRequest,
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
    return <div className={styles.empty}>아직 답글이 없습니다.</div>;
  }

  // 누적 로드된 개수 — "더 보기"는 정확한 잔여 개수가 아니라 단순 표시
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
      {hasNextPage && (
        <button
          type="button"
          className={styles.loadMoreButton}
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? '불러오는 중...' : '답글 더 보기'}
        </button>
      )}
    </div>
  );
};
