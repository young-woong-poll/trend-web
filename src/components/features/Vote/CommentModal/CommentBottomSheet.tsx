'use client';

import { useEffect, useState, type FC } from 'react';

import { usePathname } from 'next/navigation';

import { Portal } from '@/components/common/Portal/Portal';
import styles from '@/components/features/Vote/CommentModal/CommentBottomSheet.module.scss';
import { CommentList } from '@/components/features/Vote/CommentModal/CommentList';
import { useCommentCount } from '@/hooks/api/useCommentList';
import type { CommentItem } from '@/types/comment';

interface CommentBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  trendId: number;
  itemId: string;
  trendAlias: string;
}

export const CommentBottomSheet: FC<CommentBottomSheetProps> = ({
  isOpen,
  onClose,
  trendId,
  itemId,
}) => {
  const pathname = usePathname();
  const [sort, setSort] = useState<'popular' | 'latest'>('popular');

  // 실제 댓글 개수 가져오기
  const commentCount = useCommentCount(trendId, itemId);

  // 라우터 변경 감지하여 모달 닫기
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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

  // ESC 키로 닫기
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

  // 좋아요 클릭 핸들러 (Step 6에서 실제 구현)
  const handleLikeClick = (commentId: string, liked: boolean) => {
    // TODO: Step 6에서 좋아요/취소 API 호출 구현
    // Placeholder for like/unlike functionality
    void commentId;
    void liked;
  };

  // 댓글 수정 요청 핸들러 (Step 5에서 실제 구현)
  const handleEditRequest = (comment: CommentItem) => {
    // TODO: Step 5에서 비밀번호 확인 모달 → 수정 모달 플로우 구현
    // Placeholder for edit functionality
    void comment;
  };

  return (
    <Portal>
      <div className={styles.dimmed} onClick={handleDimmedClick}>
        <div className={styles.bottomSheet}>
          {/* 헤더 */}
          <div className={styles.header}>
            <div className={styles.titleRow}>
              <h2 className={styles.title}>댓글 {commentCount}개</h2>
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            {/* 정렬 탭 */}
            <div className={styles.sortTabs}>
              <button
                type="button"
                className={`${styles.tab} ${sort === 'popular' ? styles.active : ''}`}
                onClick={() => handleSortChange('popular')}
              >
                인기순
              </button>
              <button
                type="button"
                className={`${styles.tab} ${sort === 'latest' ? styles.active : ''}`}
                onClick={() => handleSortChange('latest')}
              >
                최신순
              </button>
            </div>
          </div>

          {/* 댓글 목록 (스크롤 영역) */}
          <div className={styles.commentListContainer}>
            <CommentList
              trendId={trendId}
              itemId={itemId}
              sort={sort}
              onEditRequest={handleEditRequest}
              onLikeClick={handleLikeClick}
            />
          </div>

          {/* 댓글 작성 폼 (고정 하단) */}
          <div className={styles.commentFormContainer}>
            {/* TODO: CommentForm 컴포넌트 추가 */}
            <div className={styles.placeholder}>
              <p>댓글 작성 폼이 여기에 표시됩니다.</p>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};
