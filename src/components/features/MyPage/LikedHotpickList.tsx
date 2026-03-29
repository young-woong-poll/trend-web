'use client';

import Link from 'next/link';

import { CardListSkeleton } from '@/components/features/MyPage/MyPageSkeleton';
import styles from '@/components/features/MyPage/MyPageView.module.scss';
import { useLikedHotpicks } from '@/hooks/api/useMyPage';

const LikedHotpickList = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useLikedHotpicks();
  const likes = data?.pages.flatMap((p) => p.data) ?? [];

  if (isLoading) {
    return <CardListSkeleton />;
  }

  if (likes.length === 0) {
    return <div className={styles.emptyState}>아직 좋아요한 핫픽이 없어요</div>;
  }

  return (
    <div className={styles.listContainer}>
      {likes.map((item) => (
        <Link key={item.hotpickId} href={`/hotpick/${item.hotpickAlias}`} className={styles.card}>
          <p className={styles.cardTitle}>{item.hotpickTitle}</p>
          <p className={styles.cardSub}>{item.optionSummary}</p>
          <p className={styles.cardDate}>{new Date(item.likedAt).toLocaleDateString('ko-KR')}</p>
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

export default LikedHotpickList;
