'use client';

import { useEffect, useRef, useState, type FC } from 'react';

import { usePathname } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import ClockIcon from '@/assets/icon/ClockIcon';
import UpIcon from '@/assets/icon/UpIcon';
import { Portal } from '@/components/common/Portal/Portal';
import styles from '@/components/features/Vote/CommentModal/CommentBottomSheet.module.scss';
import { CommentEditModal } from '@/components/features/Vote/CommentModal/CommentEditModal';
import { CommentForm } from '@/components/features/Vote/CommentModal/CommentForm';
import { CommentList } from '@/components/features/Vote/CommentModal/CommentList';
import { CommentPasswordModal } from '@/components/features/Vote/CommentModal/CommentPasswordModal';
import { useModal } from '@/contexts/ModalContext';
import { useDeleteComment } from '@/hooks/api/useComment';
import { useCommentLike } from '@/hooks/api/useCommentLike';
import { commentQueries } from '@/lib/react-query/queries';
import type { CommentItem } from '@/types/comment';

interface CommentBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  trendId: string;
  trendAlias: string;
  itemId: string;
}

export const CommentBottomSheet: FC<CommentBottomSheetProps> = ({
  isOpen,
  onClose,
  trendId,
  itemId,
}) => {
  const pathname = usePathname();
  const [sort, setSort] = useState<'popular' | 'latest'>('popular');

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<CommentItem | null>(null);
  const [editToken, setEditToken] = useState<string>('');
  const [actionType, setActionType] = useState<'edit' | 'delete'>('edit');

  const { data: commentCountData } = useQuery(commentQueries.count(Number(trendId), itemId));
  const commentCount = commentCountData?.count;

  const { showToast, showConfirm } = useModal();
  const { mutate: deleteComment } = useDeleteComment();
  const { handleLikeClick } = useCommentLike(trendId, itemId, sort, {
    onError: () => {
      showToast('좋아요 처리에 실패했습니다');
    },
  });

  // 이전 pathname을 추적하기 위한 ref
  const prevPathnameRef = useRef(pathname);
  // 댓글 목록 스크롤 컨테이너 ref
  const commentListContainerRef = useRef<HTMLDivElement>(null);
  // 스크롤 가능 여부 및 바닥 도달 여부
  const [canScroll, setCanScroll] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // 스크롤 상태 확인
  const checkScrollState = () => {
    const container = commentListContainerRef.current;
    if (!container) {
      return;
    }

    const hasScrollableContent = container.scrollHeight > container.clientHeight;
    const isBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 10;

    setCanScroll(hasScrollableContent);
    setIsAtBottom(isBottom || !hasScrollableContent);
  };

  // 스크롤 이벤트 및 리사이즈 감지
  useEffect(() => {
    const container = commentListContainerRef.current;
    if (!container || !isOpen) {
      return;
    }

    // 초기 상태 확인 (약간의 딜레이 후 확인)
    const initialCheck = setTimeout(() => {
      checkScrollState();
    }, 100);

    // ResizeObserver로 콘텐츠 크기 변화 감지
    const resizeObserver = new ResizeObserver(() => {
      checkScrollState();
    });
    resizeObserver.observe(container);

    // MutationObserver로 자식 요소 변화 감지 (댓글 로드 시)
    const mutationObserver = new MutationObserver(() => {
      checkScrollState();
    });
    mutationObserver.observe(container, { childList: true, subtree: true });

    // 스크롤 이벤트 리스너
    const handleScroll = () => {
      checkScrollState();
    };
    container.addEventListener('scroll', handleScroll);

    return () => {
      clearTimeout(initialCheck);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      container.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen]);

  // 라우터 변경 감지하여 모달 닫기
  useEffect(() => {
    // pathname이 실제로 변경되었을 때만 모달 닫기
    if (prevPathnameRef.current !== pathname && isOpen) {
      onClose();
    }
    prevPathnameRef.current = pathname;
  }, [pathname, isOpen, onClose]);

  // 모달이 열릴 때 body 스크롤 막기
  useEffect(() => {
    if (isOpen) {
      // 현재 스크롤 위치 저장
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // 원래 스크롤 위치로 복원
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleDimmedClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSortChange = (newSort: 'popular' | 'latest') => {
    setSort(newSort);
  };

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
      // 수정 모달 열기
      setIsEditModalOpen(true);
      return;
    }

    // 삭제 확인
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
              commentId: selectedComment.id,
              trendId,
              itemId,
              data: { verifyToken: token },
            },
            {
              onSuccess: () => {
                showToast('댓글이 삭제되었습니다');
                setSelectedComment(null);
                setEditToken('');
              },
              onError: () => {
                showToast('댓글 삭제에 실패했습니다');
              },
            }
          );
        },
        onCancel: () => {
          // 취소한 경우 상태 초기화
          setSelectedComment(null);
          setEditToken('');
        },
      });
    }
  };

  const handlePasswordModalClose = () => {
    setIsPasswordModalOpen(false);
    setSelectedComment(null);
    setActionType('edit');
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedComment(null);
    setEditToken('');
  };

  const handleCommentSuccess = () => {
    // 댓글 작성 성공 시 최신순으로 자동 전환 (사용자가 자신의 댓글을 즉시 확인 가능)
    setSort('latest');

    // 스크롤을 맨 위로 이동
    if (commentListContainerRef.current) {
      commentListContainerRef.current.scrollTop = 0;
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
                  onClick={() => handleSortChange('popular')}
                >
                  <UpIcon />
                  인기순
                </button>
                <button
                  type="button"
                  className={`${styles.tab} ${sort === 'latest' ? styles.active : ''}`}
                  onClick={() => handleSortChange('latest')}
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
            <div ref={commentListContainerRef} className={styles.commentListContainer}>
              <CommentList
                trendId={trendId}
                itemId={itemId}
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
            <CommentForm trendId={trendId} itemId={itemId} onSuccess={handleCommentSuccess} />
          </div>
        </div>
      </div>

      {/* 비밀번호 확인 모달 */}
      {selectedComment && (
        <CommentPasswordModal
          isOpen={isPasswordModalOpen}
          onClose={handlePasswordModalClose}
          commentId={selectedComment.id}
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
          trendId={trendId}
          itemId={itemId}
        />
      )}
    </Portal>
  );
};
