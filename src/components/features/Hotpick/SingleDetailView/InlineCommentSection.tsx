'use client';

import { useState, type FC } from 'react';

import ClockIcon from '@/assets/icon/ClockIcon';
import CommentIcon from '@/assets/icon/CommentIcon';
import UpIcon from '@/assets/icon/UpIcon';
import { CommentEditModal } from '@/components/features/Hotpick/CommentModal/CommentEditModal';
import { CommentItem as CommentItemComponent } from '@/components/features/Hotpick/CommentModal/CommentItem';
import { CommentItemSkeleton } from '@/components/features/Hotpick/CommentModal/CommentItemSkeleton';
import { CommentPasswordModal } from '@/components/features/Hotpick/CommentModal/CommentPasswordModal';
import { InlineCommentForm } from '@/components/features/Hotpick/SingleDetailView/InlineCommentForm';
import styles from '@/components/features/Hotpick/SingleDetailView/SingleDetailView.module.scss';
import { useModal } from '@/contexts/ModalContext';
import { useInfiniteComments, useDeleteComment } from '@/hooks/api';
import { useCommentLike } from '@/hooks/api/useCommentLike';
import { getTKUID } from '@/lib/tkuid';
import type { CommentItem } from '@/types/comment';

interface InlineCommentSectionProps {
  hotpickId: string;
  electionId: string;
  voted: boolean;
  isClosed: boolean;
  commentCount?: number;
}

export const InlineCommentSection: FC<InlineCommentSectionProps> = ({
  hotpickId,
  electionId,
  voted,
  isClosed,
  commentCount,
}) => {
  const [sort, setSort] = useState<'popular' | 'latest'>('popular');
  const canViewComments = voted || isClosed;

  const tkuId = getTKUID();
  const { data, isLoading, isFetching, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteComments({ hotpickId, electionId, sort, size: 5, tkuId });

  const isSortChanging = isFetching && !isLoading && !isFetchingNextPage;

  // ── 댓글 수정/삭제 상태 ──
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<CommentItem | null>(null);
  const [editToken, setEditToken] = useState('');
  const [actionType, setActionType] = useState<'edit' | 'delete'>('edit');

  const { showToast, showConfirm } = useModal();
  const { mutate: deleteComment } = useDeleteComment();
  const { handleLikeClick } = useCommentLike(hotpickId, electionId, sort, {
    onError: () => showToast('좋아요 처리에 실패했습니다'),
  });

  const comments = data?.pages.flatMap((page) => page.comments ?? []) ?? [];

  // ── 핸들러 ──
  const handleEditRequest = (comment: CommentItem) => {
    setSelectedComment(comment);
    setActionType('edit');
    setIsPasswordModalOpen(true);
  };

  const handleDeleteRequest = (comment: CommentItem) => {
    setSelectedComment(comment);
    setActionType('delete');
    setIsPasswordModalOpen(true);
  };

  const handlePasswordVerified = (token: string) => {
    setEditToken(token);
    setIsPasswordModalOpen(false);

    if (actionType === 'edit') {
      setIsEditModalOpen(true);
      return;
    }

    if (actionType === 'delete') {
      showConfirm('댓글 삭제', {
        message: '정말로 이 댓글을 삭제하시겠습니까?',
        confirmText: '삭제',
        cancelText: '취소',
        onConfirm: () => {
          if (!selectedComment) {
            return;
          }
          deleteComment(
            {
              commentId: selectedComment.id ?? '',
              hotpickId,
              electionId,
              data: { verifyToken: token },
            },
            {
              onSuccess: () => {
                showToast('댓글이 삭제되었습니다');
                setSelectedComment(null);
                setEditToken('');
              },
              onError: () => showToast('댓글 삭제에 실패했습니다'),
            }
          );
        },
        onCancel: () => {
          setSelectedComment(null);
          setEditToken('');
        },
      });
    }
  };

  const handleCommentSuccess = () => {
    setSort('latest');
  };

  // ── 댓글 목록 렌더링 ──
  const renderCommentList = () => {
    if (isLoading || isSortChanging) {
      return <CommentItemSkeleton count={3} />;
    }

    if (isError) {
      return (
        <p style={{ color: 'var(--text-tertiary)', textAlign: 'center' }}>
          댓글을 불러오는데 실패했습니다.
        </p>
      );
    }

    if (comments.length === 0) {
      return (
        <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '16px 0' }}>
          아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
        </p>
      );
    }

    return (
      <>
        {comments.map((comment) => (
          <CommentItemComponent
            key={comment.id}
            comment={comment}
            onLikeClick={handleLikeClick}
            onEditClick={handleEditRequest}
            onDeleteClick={handleDeleteRequest}
          />
        ))}
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
    <div className={styles.commentSection}>
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

      {/* 댓글 작성 폼 (목록 위에 배치) */}
      <div className={styles.commentFormArea}>
        {canViewComments ? (
          <InlineCommentForm
            hotpickId={hotpickId}
            electionId={electionId}
            onSuccess={handleCommentSuccess}
          />
        ) : (
          <p className={styles.commentDisabledHint}>투표 후 댓글을 작성할 수 있습니다</p>
        )}
      </div>

      {/* 댓글 목록 (투표 전 플레이스홀더 / 무한 확장) */}
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
          onClose={() => {
            setIsPasswordModalOpen(false);
            setSelectedComment(null);
          }}
          commentId={selectedComment.id ?? ''}
          onVerified={handlePasswordVerified}
        />
      )}

      {/* 댓글 수정 모달 */}
      {selectedComment && (
        <CommentEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedComment(null);
            setEditToken('');
          }}
          comment={selectedComment}
          editToken={editToken}
          hotpickId={hotpickId}
          electionId={electionId}
        />
      )}
    </div>
  );
};
