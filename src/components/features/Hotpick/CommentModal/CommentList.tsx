'use client';

import { useEffect, useRef, useState, type FC } from 'react';

import { CommentItem } from '@/components/features/Hotpick/CommentModal/CommentItem';
import { CommentItemSkeleton } from '@/components/features/Hotpick/CommentModal/CommentItemSkeleton';
import styles from '@/components/features/Hotpick/CommentModal/CommentList.module.scss';
import { RepliesList } from '@/components/features/Hotpick/CommentModal/RepliesList';
import { RepliesToggle } from '@/components/features/Hotpick/CommentModal/RepliesToggle';
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
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteComments({ slug, electionId, sort, size: 20, tkuId });

  // 댓글별 expand/form 토글 상태 (commentId set으로 관리)
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [openReplyForms, setOpenReplyForms] = useState<Set<string>>(new Set());

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

  const collapseReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      next.delete(commentId);
      return next;
    });
  };

  const expandReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      if (prev.has(commentId)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(commentId);
      return next;
    });
  };

  const toggleReplyForm = (commentId: string, replyCount: number) => {
    setOpenReplyForms((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
        // 폼 열릴 때 답글이 있으면 답글 리스트도 자동 펼침 (폼이 리스트 끝에 위치하도록)
        if (replyCount > 0) {
          expandReplies(commentId);
        }
      }
      return next;
    });
  };

  const handleReplySuccess = (commentId: string) => {
    // 답글 작성 성공 → 답글 폼 닫고 답글 목록 자동 펼침
    expandReplies(commentId);
    setOpenReplyForms((prev) => {
      const next = new Set(prev);
      next.delete(commentId);
      return next;
    });
  };

  if (isLoading) {
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
        const replyCount = comment.replyCount ?? 0;
        const isExpanded = expandedReplies.has(id);
        const isFormOpen = openReplyForms.has(id);
        const hasReplyArea = isFormOpen || replyCount > 0;

        return (
          <div key={id} className={styles.commentGroup}>
            <CommentItem
              comment={comment}
              replyFormOpen={isFormOpen}
              onLikeClick={onLikeClick}
              onEditClick={onEditRequest}
              onDeleteClick={onDeleteRequest}
              onReplyClick={() => toggleReplyForm(id, replyCount)}
            />

            {hasReplyArea && (
              <div className={styles.replyArea}>
                {/* 접힌 상태: "답글 N개" 토글 */}
                {replyCount > 0 && !isExpanded && (
                  <RepliesToggle
                    replyCount={replyCount}
                    expanded={false}
                    onClick={() => expandReplies(id)}
                  />
                )}

                {/* 답글 리스트 위: 폼 또는 "답글 달기" 트리거 */}
                {isFormOpen && (
                  <ReplyForm
                    commentId={id}
                    onSuccess={() => handleReplySuccess(id)}
                    onCancel={() =>
                      setOpenReplyForms((prev) => {
                        const next = new Set(prev);
                        next.delete(id);
                        return next;
                      })
                    }
                  />
                )}

                {/* 답글 리스트 + 끝의 답글 더보기/숨기기 (RepliesList 내부) */}
                {isExpanded && replyCount > 0 && (
                  <RepliesList
                    parentCommentId={id}
                    onLikeClick={onLikeClick}
                    onEditRequest={onEditRequest}
                    onDeleteRequest={onDeleteRequest}
                    onCollapse={() => collapseReplies(id)}
                  />
                )}
              </div>
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
