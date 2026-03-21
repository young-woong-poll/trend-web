'use client';

import { memo, useMemo, type RefObject } from 'react';

import { BundleCard } from '@/components/features/Main/BundleCard/BundleCard';
import styles from '@/components/features/Main/MainContent.module.scss';
import { SingleCard } from '@/components/features/Main/SingleCard/SingleCard';
import { SkeletonCard } from '@/components/features/Main/SkeletonCard/SkeletonCard';
import { useColumnCount } from '@/hooks/useColumnCount';
import type { CardModel } from '@/types/card';

const skeletonGroupInitial = (
  <div className={styles.skeletonGroup}>
    <SkeletonCard />
    <SkeletonCard />
    <SkeletonCard />
    <SkeletonCard />
    <SkeletonCard />
    <SkeletonCard />
  </div>
);

const skeletonGroupMore = (
  <div className={styles.skeletonGroup}>
    <SkeletonCard />
    <SkeletonCard />
    <SkeletonCard />
  </div>
);

interface CardListProps {
  cards: CardModel[];
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  error: Error | null;
  observerTarget: RefObject<HTMLDivElement | null>;
  onRetry: () => void;
}

// eslint-disable-next-line react/display-name
export const CardList = memo<CardListProps>(
  ({
    cards,
    isLoading,
    isError,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    error,
    observerTarget,
    onRetry,
  }) => {
    const columnCount = useColumnCount();

    // 카드를 행 우선 순서로 열에 분배 (0→col0, 1→col1, 2→col2, 3→col0, ...)
    const columns = useMemo(() => {
      const cols: CardModel[][] = Array.from({ length: columnCount }, () => []);
      cards.forEach((card, i) => {
        cols[i % columnCount].push(card);
      });
      return cols;
    }, [cards, columnCount]);

    if (isLoading && cards.length === 0) {
      return skeletonGroupInitial;
    }

    if (isError && cards.length === 0) {
      return (
        <div className={styles.statusContainer}>
          <p className={styles.errorText}>핫픽을 불러오는데 실패했습니다.</p>
          <p className={styles.errorHint}>잠시 후 다시 시도해주세요.</p>
        </div>
      );
    }

    if (!isFetching && cards.length === 0) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.icon}>📊</div>
          <h2 className={styles.title}>아직 진행중인 핫픽이 없어요</h2>
          <p className={styles.description}>
            새로운 핫픽 투표가 시작되면 여기에 표시됩니다.
            <br />곧 흥미로운 주제로 찾아뵙겠습니다!
          </p>
        </div>
      );
    }

    return (
      <>
        <div className={styles.cardGrid}>
          {columns.map((colCards, colIndex) => (
            <div key={colIndex} className={styles.cardColumn}>
              {colCards.map((card) =>
                card.type === 'SINGLE' ? (
                  <div key={card.data.slug} id={card.data.slug} className={styles.cardWrapper}>
                    <SingleCard data={card.data} />
                  </div>
                ) : (
                  <div key={card.data.slug} id={card.data.slug} className={styles.cardWrapper}>
                    <BundleCard data={card.data} />
                  </div>
                )
              )}
            </div>
          ))}
        </div>

        {/* 무한스크롤 트리거 */}
        <div ref={observerTarget} className={styles.observerTarget}>
          {isFetchingNextPage && skeletonGroupMore}
          {!isFetchingNextPage && error && hasNextPage && (
            <div className={styles.loadMoreError}>
              <p>불러오기 실패</p>
              <button type="button" onClick={onRetry} className={styles.retryButton}>
                다시 시도
              </button>
            </div>
          )}
        </div>
      </>
    );
  }
);
