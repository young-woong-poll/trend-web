'use client';

import { useEffect, useRef, type FC } from 'react';

import { SingleCard } from '@/components/features/Main/SingleCard';
import styles from '@/components/features/Main/SingleView/SingleView.module.scss';
import { HOTPICK_SORT } from '@/constants';
import { useInfiniteMainDisplay } from '@/hooks/api';
import type { CategoryCode } from '@/types/hotpick';

interface SingleViewProps {
  categoryCodes?: CategoryCode[];
}

export const SingleView: FC<SingleViewProps> = ({ categoryCodes }) => {
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage, error } =
    useInfiniteMainDisplay({
      size: 20,
      sort: HOTPICK_SORT,
      type: 'SINGLE',
      categoryCodes: categoryCodes && categoryCodes.length > 0 ? categoryCodes : undefined,
    });

  const observerTarget = useRef<HTMLDivElement>(null);

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

  const hotpicks = data.pages.flatMap((page) => page?.trends ?? []);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (isLoading && hotpicks.length === 0) {
    return (
      <div className={styles.statusContainer}>
        <p className={styles.statusText}>Single 투표를 불러오는 중...</p>
      </div>
    );
  }

  if (isError && hotpicks.length === 0) {
    return (
      <div className={styles.statusContainer}>
        <p className={styles.errorText}>Single 투표를 불러오는데 실패했습니다.</p>
      </div>
    );
  }

  if (hotpicks.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyText}>아직 Single 투표가 없어요</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.grid}>
        {hotpicks.map((trend) => {
          const imageUrl = trend.imageUrls?.[0] ?? undefined;

          return (
            <SingleCard
              key={trend.id}
              alias={trend.alias ?? ''}
              title={trend.title ?? ''}
              imageUrl={imageUrl}
              participantCount={trend.participantsCount}
              createdAt={trend.createdAt}
            />
          );
        })}
      </div>

      <div ref={observerTarget} className={styles.observerTarget}>
        {isFetchingNextPage && <p className={styles.loadingMore}>더 불러오는 중...</p>}
        {!isFetchingNextPage && error && hasNextPage && (
          <div className={styles.loadMoreError}>
            <p>불러오기 실패</p>
            <button type="button" onClick={() => fetchNextPage()} className={styles.retryButton}>
              다시 시도
            </button>
          </div>
        )}
      </div>
    </>
  );
};
