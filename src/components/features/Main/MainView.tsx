'use client';

import { useEffect, useRef, type FC, type ReactNode } from 'react';

import styles from '@/components/features/Main/MainContent.module.scss';
import { PollCard } from '@/components/features/Main/PollCard/PollCard';
import { TREND_SORT } from '@/constants';
import type { DisplayMainResponse } from '@/generated/models';
import { useInfiniteMainDisplay } from '@/hooks/api';

type TMainViewProps = {
  initialData?: DisplayMainResponse;
  children?: ReactNode;
};

const isValidImageUrl = (url: string | undefined): boolean => {
  if (!url) {
    return false;
  }
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

export const MainView: FC<TMainViewProps> = ({ initialData, children }) => {
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage, error } =
    useInfiniteMainDisplay({ size: 20, sort: TREND_SORT, initialData });

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

  // 페이지 데이터 병합
  // initialData가 useInfiniteQuery에 주입되므로 data만 사용
  const fixedTrends = data.pages[0]?.fixedTrends ?? [];
  const trends = data.pages.flatMap((page) => page?.trends ?? []);

  // 초기 로딩 상태 (initialData가 없는 경우 대비)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (isLoading && trends.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.statusContainer}>
          <p className={styles.statusText}>트렌드를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (isError && trends.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.statusContainer}>
          <p className={styles.errorText}>트렌드를 불러오는데 실패했습니다.</p>
          <p className={styles.errorHint}>잠시 후 다시 시도해주세요.</p>
        </div>
      </div>
    );
  }

  // 빈 상태 (고정 트렌드와 일반 트렌드 모두 없을 때)
  if (fixedTrends.length === 0 && trends.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.icon}>📊</div>
          <h2 className={styles.title}>아직 진행중인 트렌드가 없어요</h2>
          <p className={styles.description}>
            새로운 트렌드 투표가 시작되면 여기에 표시됩니다.
            <br />곧 흥미로운 주제로 찾아뵙겠습니다!
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 서버에서 생성된 정적 HTML (SEO용) - children은 서버에서 렌더링됨 */}
      <noscript>{children}</noscript>

      <div className={styles.container}>
        {/* 고정 트렌드 먼저 노출 */}
        {fixedTrends.map((trend) => {
          const rawImageUrls = trend.imageUrls ?? [];
          const validImageUrls = [
            isValidImageUrl(rawImageUrls[0])
              ? rawImageUrls[0]
              : 'https://picsum.photos/400/300?random=placeholder1',
            isValidImageUrl(rawImageUrls[1])
              ? rawImageUrls[1]
              : 'https://picsum.photos/400/300?random=placeholder2',
          ];

          return (
            <PollCard
              key={`fixed-${trend.id}`}
              alias={trend.alias ?? ''}
              title={trend.title ?? ''}
              subtitle={trend.label}
              createdAt={trend.createdAt}
              imageUrls={validImageUrls}
              participantCount={trend.participantsCount}
            />
          );
        })}
        {/* 일반 트렌드 */}
        {trends.map((trend) => {
          const rawImageUrls = trend.imageUrls ?? [];
          const validImageUrls = [
            isValidImageUrl(rawImageUrls[0])
              ? rawImageUrls[0]
              : 'https://picsum.photos/400/300?random=placeholder1',
            isValidImageUrl(rawImageUrls[1])
              ? rawImageUrls[1]
              : 'https://picsum.photos/400/300?random=placeholder2',
          ];

          return (
            <PollCard
              key={trend.id}
              alias={trend.alias ?? ''}
              title={trend.title ?? ''}
              subtitle={trend.label}
              createdAt={trend.createdAt}
              imageUrls={validImageUrls}
              participantCount={trend.participantsCount}
            />
          );
        })}

        {/* 무한스크롤 트리거 */}
        <div ref={observerTarget} className={styles.observerTarget}>
          {isFetchingNextPage && <p className={styles.loadingMore}>트렌드를 더 불러오는 중...</p>}
          {!isFetchingNextPage && error && hasNextPage && (
            <div className={styles.loadMoreError}>
              <p>불러오기 실패</p>
              <button type="button" onClick={() => fetchNextPage()} className={styles.retryButton}>
                다시 시도
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
