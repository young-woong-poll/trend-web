'use client';

import styles from '@/components/features/MyPage/MyPageView.module.scss';
import { useMyVotes } from '@/hooks/api/useMyPage';

const MyVoteList = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useMyVotes();
  const votes = data?.pages.flatMap((p) => p.data) ?? [];

  if (votes.length === 0) {
    return <div className={styles.emptyState}>아직 참여한 투표가 없어요</div>;
  }

  return (
    <div>
      {votes.map((vote) => (
        <div key={`${vote.hotpickSlug}-${vote.votedAt}`} className={styles.listItem}>
          <p className={styles.listItemTitle}>{vote.hotpickTitle}</p>
          <p className={styles.listItemSub}>
            {vote.selectedOption} 선택 · {new Date(vote.votedAt).toLocaleDateString('ko-KR')}
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

export default MyVoteList;
