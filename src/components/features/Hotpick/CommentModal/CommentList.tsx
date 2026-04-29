'use client';

import { useEffect, useRef, useState, type FC } from 'react';

import { CommentItem } from '@/components/features/Hotpick/CommentModal/CommentItem';
import { CommentItemSkeleton } from '@/components/features/Hotpick/CommentModal/CommentItemSkeleton';
import styles from '@/components/features/Hotpick/CommentModal/CommentList.module.scss';
import { RepliesList } from '@/components/features/Hotpick/CommentModal/RepliesList';
import { ReplyForm } from '@/components/features/Hotpick/CommentModal/ReplyForm';
import { useAuth } from '@/contexts/AuthContext';
import { useInfiniteComments } from '@/hooks/api';
import { getTKUID } from '@/lib/tkuid';
import type { CommentItem as CommentItemType } from '@/types/comment';

interface CommentListProps {
  slug: string;
  electionId: string;
  sort: 'latest' | 'popular';
  onEditRequest: (comment: CommentItemType) => void;
  onDeleteRequest: (comment: CommentItemType) => void;
  onLikeClick: (commentId: string, liked: boolean) => void;
}

export const CommentList: FC<CommentListProps> = ({
  slug,
  electionId,
  sort,
  onEditRequest,
  onDeleteRequest,
  onLikeClick,
}) => {
  const { isLoggedIn } = useAuth();
  const tkuId = getTKUID({ isLoggedIn });
  const { data, isLoading, isFetching, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteComments({ slug, electionId, sort, size: 20, tkuId });

  // 댓글별 expand/form 토글 상태 (commentId set으로 관리)
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [openReplyForms, setOpenReplyForms] = useState<Set<string>>(new Set());

  const isSortChanging = isFetching && !isLoading && !isFetchingNextPage;
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }
    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const toggleReplyForm = (commentId: string) => {
    setOpenReplyForms((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const handleReplySuccess = (commentId: string) => {
    // 답글 작성 성공 → 답글 폼 닫고 답글 목록 자동 펼침
    setExpandedReplies((prev) => new Set(prev).add(commentId));
    setOpenReplyForms((prev) => {
      const next = new Set(prev);
      next.delete(commentId);
      return next;
    });
  };

  if (isLoading || isSortChanging) {
    return (
      <div className={styles.commentList}>
        <CommentItemSkeleton count={5} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.statusContainer}>
        <p className={styles.errorText}>댓글을 불러오는데 실패했습니다.</p>
        <p className={styles.errorHint}>잠시 후 다시 시도해주세요.</p>
      </div>
    );
  }

  const comments = data?.pages.flatMap((page) => page.comments ?? []) ?? [];

  if (comments.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyText}>아직 댓글이 없습니다.</p>
        <p className={styles.emptyHint}>첫 댓글을 작성해보세요!</p>
      </div>
    );
  }

  return (
    <div className={styles.commentList}>
      {comments.map((comment) => {
        const id = comment.id ?? '';
        const isExpanded = expandedReplies.has(id);
        const isFormOpen = openReplyForms.has(id);

        return (
          <div key={id}>
            <CommentItem
              comment={comment}
              repliesExpanded={isExpanded}
              replyFormOpen={isFormOpen}
              onLikeClick={onLikeClick}
              onEditClick={onEditRequest}
              onDeleteClick={onDeleteRequest}
              onToggleReplies={() => toggleReplies(id)}
              onReplyClick={() => toggleReplyForm(id)}
            />

            {isFormOpen && (
              <ReplyForm
                commentId={id}
                onSuccess={() => handleReplySuccess(id)}
                onCancel={() => toggleReplyForm(id)}
              />
            )}

            {isExpanded && (
              <RepliesList
                parentCommentId={id}
                onLikeClick={onLikeClick}
                onEditRequest={onEditRequest}
                onDeleteRequest={onDeleteRequest}
              />
            )}
          </div>
        );
      })}

      <div ref={observerTarget} className={styles.observerTarget}>
        {isFetchingNextPage && <CommentItemSkeleton count={2} />}
      </div>
    </div>
  );
};
