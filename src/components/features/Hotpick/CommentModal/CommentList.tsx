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
  /**
   * 답글 클릭 처리 — 지정 시 외부(CommentBottomSheet)가 답글 폼을 모드 전환으로 처리.
   * 미지정 시 기존 인라인 ReplyForm 토글 동작 (legacy / 다른 진입 케이스 대비).
   * content는 답글 폼 컨텍스트 칩 미리보기, profileColor는 칩 배경/border tint에 사용.
   */
  onReplyClick?: (target: {
    commentId: string;
    nickname: string;
    content: string;
    profileColor?: string | null;
    replyCount: number;
  }) => void;
}

export const CommentList: FC<CommentListProps> = ({
  slug,
  electionId,
  sort,
  onEditRequest,
  onDeleteRequest,
  onLikeClick,
  onReplyClick,
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
        const nickname = comment.nickname ?? '익명';
        const content = comment.content ?? '';
        const profileColor = comment.profileColor;
        const replyCount = comment.replyCount ?? 0;
        const isExpanded = expandedReplies.has(id);
        // onReplyClick이 외부에서 주어진 경우 — 외부가 답글 폼을 통합 관리하므로 내부 인라인 폼 비활성.
        const isFormOpen = openReplyForms.has(id) && !onReplyClick;
        const hasReplyArea = isFormOpen || replyCount > 0;

        const handleReplyTrigger = () => {
          if (onReplyClick) {
            onReplyClick({ commentId: id, nickname, content, profileColor, replyCount });
          } else {
            toggleReplyForm(id, replyCount);
          }
        };

        return (
          <div key={id} className={styles.commentGroup}>
            <CommentItem
              comment={comment}
              replyFormOpen={isFormOpen}
              onLikeClick={onLikeClick}
              onEditClick={onEditRequest}
              onDeleteClick={onDeleteRequest}
              onReplyClick={handleReplyTrigger}
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

                {/* 인라인 답글 폼 — onReplyClick 미지정 시(legacy)에만 노출 */}
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
