'use client';

import { useEffect, useRef, type FC, type ReactNode } from 'react';

import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

import styles from '@/components/features/Main/MainContent.module.scss';
import { PollCard } from '@/components/features/Main/PollCard/PollCard';
import { displayQueries } from '@/lib/react-query/queries';
import type { MainDisplayResponse } from '@/types/trend';

type TMainViewProps = {
  initialData?: MainDisplayResponse;
  children?: ReactNode;
};

const isValidImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

export const MainView: FC<TMainViewProps> = ({ initialData, children }) => {
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      ...displayQueries.infiniteMain({ size: 20, sort: 'popular' }),
      placeholderData: keepPreviousData,
    });

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
  const trends = data?.pages.flatMap((page) => page.trends) ?? initialData?.trends ?? [];

  // 초기 로딩 상태
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

  // 빈 상태
  if (trends.length === 0) {
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
        {trends.map((trend) => {
          const validImageUrl1 = isValidImageUrl(trend.imageUrl1)
            ? trend.imageUrl1
            : 'https://picsum.photos/400/300?random=placeholder1';
          const validImageUrl2 = isValidImageUrl(trend.imageUrl2)
            ? trend.imageUrl2
            : 'https://picsum.photos/400/300?random=placeholder2';

          return (
            <PollCard
              key={trend.id}
              alias={trend.alias}
              title={trend.title}
              subtitle={trend.label}
              createdAt={trend.createdAt}
              imageUrl1={validImageUrl1}
              imageUrl2={validImageUrl2}
              participantCount={trend.participantsCount}
            />
          );
        })}

        {/* 무한스크롤 트리거 */}
        <div ref={observerTarget} className={styles.observerTarget}>
          {isFetchingNextPage && <p className={styles.loadingMore}>트렌드를 더 불러오는 중...</p>}
        </div>
      </div>
    </>
  );
};
