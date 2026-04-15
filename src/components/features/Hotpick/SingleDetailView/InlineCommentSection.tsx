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
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { useInfiniteComments } from '@/hooks/api';
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
  const canViewComments = voted || isClosed;

  const { isLoggedIn } = useAuth();
  const tkuId = getTKUID({ isLoggedIn });
  const { data, isLoading, isFetching, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteComments({ slug, electionId, sort, size: 5, tkuId });

  const isSortChanging = isFetching && !isLoading && !isFetchingNextPage;

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
    if (isLoading || isSortChanging) {
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
    <div className={styles.commentSection} data-testid="comment-section">
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
