'use client';

import styles from '@/components/features/MyPage/MyPageView.module.scss';
import { useMyComments } from '@/hooks/api/useMyPage';

const MyCommentList = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useMyComments();
  const comments = data?.pages.flatMap((p) => p.data) ?? [];

  if (comments.length === 0) {
    return <div className={styles.emptyState}>아직 작성한 댓글이 없어요</div>;
  }

  return (
    <div>
      {comments.map((comment) => (
        <div key={`${comment.hotpickSlug}-${comment.createdAt}`} className={styles.listItem}>
          <p className={styles.listItemTitle}>{comment.hotpickTitle}</p>
          <p className={styles.listItemSub}>
            {comment.content} · {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
          </p>
        </div>
      ))}
      {hasNextPage && (
        <button
          type="button"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className={styles.logoutButton}
        >
          {isFetchingNextPage ? '로딩 중...' : '더 보기'}
        </button>
      )}
    </div>
  );
};

export default MyCommentList;
