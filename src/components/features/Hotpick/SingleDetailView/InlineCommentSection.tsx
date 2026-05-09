'use client';

import { useEffect, useRef, useState, type FC } from 'react';

import { usePathname, useSearchParams } from 'next/navigation';

import ClockIcon from '@/assets/icon/ClockIcon';
import CommentIcon from '@/assets/icon/CommentIcon';
import UpIcon from '@/assets/icon/UpIcon';
import { CommentEditModal } from '@/components/features/Hotpick/CommentModal/CommentEditModal';
import { CommentItem as CommentItemComponent } from '@/components/features/Hotpick/CommentModal/CommentItem';
import { CommentItemSkeleton } from '@/components/features/Hotpick/CommentModal/CommentItemSkeleton';
import { CommentPasswordModal } from '@/components/features/Hotpick/CommentModal/CommentPasswordModal';
import { PinnedCommentCard } from '@/components/features/Hotpick/CommentModal/PinnedCommentCard';
import { RepliesList } from '@/components/features/Hotpick/CommentModal/RepliesList';
import { RepliesToggle } from '@/components/features/Hotpick/CommentModal/RepliesToggle';
import { ReplyForm } from '@/components/features/Hotpick/CommentModal/ReplyForm';
import { InlineCommentForm } from '@/components/features/Hotpick/SingleDetailView/InlineCommentForm';
import styles from '@/components/features/Hotpick/SingleDetailView/SingleDetailView.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { useCommentDetail, useInfiniteComments } from '@/hooks/api';
import { useCommentLike } from '@/hooks/api/useCommentLike';
import { useCommentActions } from '@/hooks/useCommentActions';
import { getTKUID } from '@/lib/tkuid';

interface InlineCommentSectionProps {
  slug: string;
  electionId: string;
  voted: boolean;
  isClosed: boolean;
  commentCount?: number;
}

export const InlineCommentSection: FC<InlineCommentSectionProps> = ({
  slug,
  electionId,
  voted,
  isClosed,
  commentCount,
}) => {
  const [sort, setSort] = useState<'popular' | 'latest'>('popular');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [openReplyForms, setOpenReplyForms] = useState<Set<string>>(new Set());

  // ── 알림 진입 핀 영역 ──
  // 알림에서 commentId가 query에 실려 오면 getCommentDetail로 핀 카드 표시.
  // jump 시 무한 리스트의 해당 댓글로 scroll + 짧은 highlight.
  // 부모가 있으면 답글 자동 펼침으로 컨텍스트 함께 보이게.
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pinnedCommentId = searchParams.get('commentId');
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pinAutoExpandedRef = useRef(false);

  const { data: pinnedDetail } = useCommentDetail(pinnedCommentId);

  const handlePinJump = (targetId: string) => {
    // 부모 댓글 펼침 — 답글이라면 부모 commentGroup 안에서 답글이 보이도록.
    const parentId = pinnedDetail?.parent?.id;
    if (parentId) {
      setExpandedReplies((prev) => {
        if (prev.has(parentId)) {
          return prev;
        }
        const next = new Set(prev);
        next.add(parentId);
        return next;
      });
    }
    // 다음 frame에 DOM이 그려진 뒤 scroll. 답글 expand로 새로 그려질 수도 있어 살짝 지연.
    window.setTimeout(() => {
      const node = sectionRef.current?.querySelector<HTMLElement>(
        `[data-comment-id="${targetId}"]`
      );
      if (node) {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setHighlightedId(targetId);
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
      highlightTimerRef.current = setTimeout(() => setHighlightedId(null), 1800);
    }, 80);
  };

  // 핀 데이터 로드 후 1회: 부모가 있으면 답글 자동 펼침. (사용자가 별도 jump 안 눌러도)
  useEffect(() => {
    if (pinAutoExpandedRef.current) {
      return;
    }
    const parentId = pinnedDetail?.parent?.id;
    if (!parentId) {
      return;
    }
    pinAutoExpandedRef.current = true;
    setExpandedReplies((prev) => {
      if (prev.has(parentId)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(parentId);
      return next;
    });
  }, [pinnedDetail]);

  // 핀 query는 진입 1회 의미만 — 새로고침 시 깜빡임/중복 동작 방지를 위해 url에서 정리.
  // detail 데이터 로드 또는 not-found 결과가 나온 직후 한 번만 replaceState.
  const pinCleanedRef = useRef(false);
  useEffect(() => {
    if (pinCleanedRef.current || !pinnedCommentId) {
      return;
    }
    if (pinnedDetail === undefined) {
      return;
    }
    pinCleanedRef.current = true;
    if (typeof window === 'undefined') {
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete('commentId');
    params.delete('parentCommentId');
    params.delete('electionId');
    const qs = params.toString();
    window.history.replaceState({}, '', qs ? `${pathname}?${qs}` : pathname);
  }, [pinnedDetail, pinnedCommentId, pathname, searchParams]);

  useEffect(
    () => () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    },
    []
  );

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

  const collapseReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      next.delete(commentId);
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
        if (replyCount > 0) {
          expandReplies(commentId);
        }
      }
      return next;
    });
  };

  const handleReplySuccess = (commentId: string) => {
    expandReplies(commentId);
    setOpenReplyForms((prev) => {
      const next = new Set(prev);
      next.delete(commentId);
      return next;
    });
  };

  const canViewComments = voted || isClosed;

  const { isLoggedIn } = useAuth();
  const tkuId = getTKUID({ isLoggedIn });
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteComments({ slug, electionId, sort, size: 5, tkuId });

  const { showToast } = useModal();
  const { handleLikeClick } = useCommentLike(slug, electionId, sort, {
    onError: () => showToast('좋아요 처리에 실패했습니다'),
  });

  const {
    selectedComment,
    editToken,
    isPasswordModalOpen,
    isEditModalOpen,
    handleEditRequest,
    handleDeleteRequest,
    handlePasswordVerified,
    handlePasswordModalClose,
    handleEditModalClose,
  } = useCommentActions({ slug, electionId });

  const comments = data?.pages.flatMap((page) => page.comments ?? []) ?? [];

  const handleCommentSuccess = () => {
    setSort('latest');
  };

  // ── 댓글 목록 렌더링 ──
  const renderCommentList = () => {
    if (isLoading) {
      return <CommentItemSkeleton count={3} />;
    }

    if (isError) {
      return <p className={styles.commentDisabledHint}>댓글을 불러오는데 실패했습니다.</p>;
    }

    if (comments.length === 0) {
      return (
        <p className={styles.commentDisabledHint}>아직 댓글이 없습니다. 첫 댓글을 작성해보세요!</p>
      );
    }

    return (
      <>
        {comments.map((comment) => {
          const id = comment.id ?? '';
          const replyCount = comment.replyCount ?? 0;
          const isExpanded = expandedReplies.has(id);
          const isFormOpen = openReplyForms.has(id);
          const hasReplyArea = isFormOpen || replyCount > 0;
          const showAddReplyTrigger = isExpanded && replyCount > 0 && !isFormOpen;

          return (
            <div
              key={id}
              className={`${styles.commentGroup} ${highlightedId === id ? styles.commentHighlight : ''}`}
              data-comment-id={id}
            >
              <CommentItemComponent
                comment={comment}
                replyFormOpen={isFormOpen}
                onLikeClick={handleLikeClick}
                onEditClick={handleEditRequest}
                onDeleteClick={handleDeleteRequest}
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
                  {isFormOpen ? (
                    <ReplyForm commentId={id} onSuccess={() => handleReplySuccess(id)} />
                  ) : (
                    showAddReplyTrigger && (
                      <button
                        type="button"
                        className={styles.addReplyButton}
                        onClick={() => toggleReplyForm(id, replyCount)}
                      >
                        답글 달기
                      </button>
                    )
                  )}

                  {/* 답글 리스트 + 끝의 답글 더보기/숨기기 (RepliesList 내부) */}
                  {isExpanded && replyCount > 0 && (
                    <RepliesList
                      parentCommentId={id}
                      onLikeClick={handleLikeClick}
                      onEditRequest={handleEditRequest}
                      onDeleteRequest={handleDeleteRequest}
                      onCollapse={() => collapseReplies(id)}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
        {hasNextPage && (
          <button
            type="button"
            className={styles.loadMoreButton}
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? '불러오는 중...' : '댓글 더보기'}
          </button>
        )}
      </>
    );
  };

  return (
    <div ref={sectionRef} className={styles.commentSection} data-testid="comment-section">
      {/* 알림 진입 핀 — query에 commentId가 있으면 노출 */}
      {pinnedCommentId && (
        <PinnedCommentCard
          comment={pinnedDetail?.comment}
          parent={pinnedDetail?.parent}
          onJump={handlePinJump}
        />
      )}

      {/* 헤더 */}
      <div className={styles.commentHeader}>
        <h2 className={styles.commentTitle}>
          댓글
          {commentCount !== undefined && (
            <span className={styles.commentCount}>{commentCount}</span>
          )}
        </h2>
        <div className={styles.sortTabs}>
          <button
            type="button"
            className={`${styles.sortTab} ${sort === 'popular' ? styles.active : ''}`}
            onClick={() => setSort('popular')}
          >
            <UpIcon />
            인기순
          </button>
          <button
            type="button"
            className={`${styles.sortTab} ${sort === 'latest' ? styles.active : ''}`}
            onClick={() => setSort('latest')}
          >
            <ClockIcon />
            최신순
          </button>
        </div>
      </div>

      {/* 댓글 작성 폼 */}
      <div className={styles.commentFormArea}>
        {canViewComments ? (
          <InlineCommentForm slug={slug} electionId={electionId} onSuccess={handleCommentSuccess} />
        ) : (
          <p className={styles.commentDisabledHint}>투표 후 댓글을 작성할 수 있습니다</p>
        )}
      </div>

      {/* 댓글 목록 */}
      {!canViewComments ? (
        <div className={styles.commentBlurPlaceholder}>
          <div className={styles.fakeLine} />
          <div className={styles.fakeLine} />
          <div className={styles.fakeLine} />
          <div className={styles.fakeLine} />
          <div className={styles.fakeLine} />
          <div className={styles.fakeLine} />
          <div className={styles.fakeLine} />
          <div className={styles.blurOverlay}>
            <CommentIcon width={24} height={24} className={styles.blurIcon} />
            <span className={styles.blurText}>투표 후 댓글을 확인할 수 있습니다</span>
          </div>
        </div>
      ) : (
        <div className={styles.commentListArea}>{renderCommentList()}</div>
      )}

      {/* 비밀번호 확인 모달 */}
      {selectedComment && (
        <CommentPasswordModal
          isOpen={isPasswordModalOpen}
          onClose={handlePasswordModalClose}
          commentId={selectedComment.id ?? ''}
          onVerified={handlePasswordVerified}
        />
      )}

      {/* 댓글 수정 모달 */}
      {selectedComment && (
        <CommentEditModal
          isOpen={isEditModalOpen}
          onClose={handleEditModalClose}
          comment={selectedComment}
          editToken={editToken}
          slug={slug}
          electionId={electionId}
        />
      )}
    </div>
  );
};
