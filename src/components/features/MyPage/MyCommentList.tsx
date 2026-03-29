'use client';

import Link from 'next/link';

import { CardListSkeleton } from '@/components/features/MyPage/MyPageSkeleton';
import styles from '@/components/features/MyPage/MyPageView.module.scss';
import { useMyComments } from '@/hooks/api/useMyPage';

const MyCommentList = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMyComments();
  const comments = data?.pages.flatMap((p) => p.data) ?? [];

  if (isLoading) {
    return <CardListSkeleton />;
  }

  if (comments.length === 0) {
    return <div className={styles.emptyState}>아직 작성한 댓글이 없어요</div>;
  }

  return (
    <div className={styles.listContainer}>
      {comments.map((comment) => (
        <Link
          key={`${comment.hotpickSlug}-${comment.createdAt}`}
          href={`/hotpick/${comment.hotpickSlug}`}
          className={styles.card}
        >
          <p className={styles.cardSub}>{comment.hotpickTitle}</p>
          <p className={styles.cardTitle}>{comment.content}</p>
          <p className={styles.cardDate}>
            {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
          </p>
        </Link>
      ))}
      {hasNextPage && (
        <button
          type="button"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className={styles.loadMoreButton}
        >
          {isFetchingNextPage ? '로딩 중...' : '더 보기'}
        </button>
      )}
    </div>
  );
};

export default MyCommentList;
