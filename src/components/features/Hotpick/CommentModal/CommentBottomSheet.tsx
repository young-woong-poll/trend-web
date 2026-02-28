'use client';

import { useEffect, useRef, useState, type FC } from 'react';

import { usePathname } from 'next/navigation';

import ClockIcon from '@/assets/icon/ClockIcon';
import UpIcon from '@/assets/icon/UpIcon';
import { Portal } from '@/components/common/Portal/Portal';
import styles from '@/components/features/Hotpick/CommentModal/CommentBottomSheet.module.scss';
import { CommentEditModal } from '@/components/features/Hotpick/CommentModal/CommentEditModal';
import { CommentForm } from '@/components/features/Hotpick/CommentModal/CommentForm';
import { CommentList } from '@/components/features/Hotpick/CommentModal/CommentList';
import { CommentPasswordModal } from '@/components/features/Hotpick/CommentModal/CommentPasswordModal';
import { useModal } from '@/contexts/ModalContext';
import { useCommentCount } from '@/hooks/api';
import { useCommentLike } from '@/hooks/api/useCommentLike';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useCommentActions } from '@/hooks/useCommentActions';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useScrollObserver } from '@/hooks/useScrollObserver';

interface CommentBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  electionId: string;
}

export const CommentBottomSheet: FC<CommentBottomSheetProps> = ({
  isOpen,
  onClose,
  slug,
  electionId,
}) => {
  const pathname = usePathname();
  const [sort, setSort] = useState<'popular' | 'latest'>('popular');

  const { data: commentCountData } = useCommentCount(slug, electionId);
  const commentCount = commentCountData?.count;

  const { showToast } = useModal();
  const { handleLikeClick } = useCommentLike(slug, electionId, sort, {
    onError: () => showToast('좋아요 처리에 실패했습니다'),
  });

  // 커스텀 훅으로 분리된 로직
  const { containerRef, canScroll, isAtBottom } = useScrollObserver(isOpen);
  useBodyScrollLock(isOpen);
  useEscapeKey(isOpen, onClose);

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

  // 라우터 변경 감지하여 모달 닫기
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname && isOpen) {
      onClose();
    }
    prevPathnameRef.current = pathname;
  }, [pathname, isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleDimmedClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCommentSuccess = () => {
    setSort('latest');
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  };

  return (
    <Portal>
      <div className={styles.dimmed} onClick={handleDimmedClick}>
        <div className={styles.bottomSheet}>
          {/* 헤더 */}
          <div className={styles.header}>
            <div className={styles.titleRow}>
              <h2 className={styles.title}>댓글 {commentCount}개</h2>

              {/* 정렬 탭 */}
              <div className={styles.sortTabs}>
                <button
                  type="button"
                  className={`${styles.tab} ${sort === 'popular' ? styles.active : ''}`}
                  onClick={() => setSort('popular')}
                >
                  <UpIcon />
                  인기순
                </button>
                <button
                  type="button"
                  className={`${styles.tab} ${sort === 'latest' ? styles.active : ''}`}
                  onClick={() => setSort('latest')}
                >
                  <ClockIcon />
                  최신순
                </button>
              </div>

              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 댓글 목록 (스크롤 영역) */}
          <div className={styles.commentListWrapper}>
            <div ref={containerRef} className={styles.commentListContainer}>
              <CommentList
                slug={slug}
                electionId={electionId}
                sort={sort}
                onEditRequest={handleEditRequest}
                onDeleteRequest={handleDeleteRequest}
                onLikeClick={handleLikeClick}
              />
            </div>

            {/* 스크롤 가능 시 blur 오버레이 */}
            <div
              className={styles.scrollBlurOverlay}
              style={{ opacity: canScroll && !isAtBottom ? 1 : 0 }}
            />
          </div>

          {/* 댓글 작성 폼 (고정 하단) */}
          <div className={styles.commentFormContainer}>
            <CommentForm slug={slug} electionId={electionId} onSuccess={handleCommentSuccess} />
          </div>
        </div>
      </div>

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
    </Portal>
  );
};
