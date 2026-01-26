'use client';

import { useEffect, useRef, type FC } from 'react';

import { CommentItem } from '@/components/features/Vote/CommentModal/CommentItem';
import { CommentItemSkeleton } from '@/components/features/Vote/CommentModal/CommentItemSkeleton';
import styles from '@/components/features/Vote/CommentModal/CommentList.module.scss';
import type { CommentItem as CommentItemType } from '@/generated/models';
import { useInfiniteComments } from '@/hooks/api';
import { getTKUID } from '@/lib/tkuid';

interface CommentListProps {
  trendId: string;
  itemId: string;
  sort: 'latest' | 'popular';
  onEditRequest: (comment: CommentItemType) => void;
  onDeleteRequest: (comment: CommentItemType) => void;
  onLikeClick: (commentId: string, liked: boolean) => void;
}

export const CommentList: FC<CommentListProps> = ({
  trendId,
  itemId,
  sort,
  onEditRequest,
  onDeleteRequest,
  onLikeClick,
}) => {
  const tkuId = getTKUID();
  const { data, isLoading, isFetching, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteComments({ trendId, itemId, sort, size: 20, tkuId });

  // 정렬 변경 시 로딩 상태 (초기 로딩 제외, 무한스크롤 제외)
  const isSortChanging = isFetching && !isLoading && !isFetchingNextPage;

  const observerTarget = useRef<HTMLDivElement>(null);

  // Intersection Observer로 무한스크롤 구현
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

  // 초기 로딩 또는 정렬 변경 시 Skeleton 표시
  if (isLoading || isSortChanging) {
    return (
      <div className={styles.commentList}>
        <CommentItemSkeleton count={5} />
      </div>
    );
  }

  // 에러 상태
  if (isError) {
    return (
      <div className={styles.statusContainer}>
        <p className={styles.errorText}>댓글을 불러오는데 실패했습니다.</p>
        <p className={styles.errorHint}>잠시 후 다시 시도해주세요.</p>
      </div>
    );
  }

  // 댓글 데이터 추출
  const comments = data?.pages.flatMap((page) => page.comments ?? []) ?? [];

  // 빈 목록
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
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onLikeClick={onLikeClick}
          onEditClick={onEditRequest}
          onDeleteClick={onDeleteRequest}
        />
      ))}

      {/* 무한스크롤 트리거 */}
      <div ref={observerTarget} className={styles.observerTarget}>
        {isFetchingNextPage && <CommentItemSkeleton count={2} />}
      </div>
    </div>
  );
};
