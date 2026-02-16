'use client';

import { useState, useEffect, useRef, type FC, type ReactNode } from 'react';

import { CategoryFilter } from '@/components/features/Main/CategoryFilter';
import styles from '@/components/features/Main/MainContent.module.scss';
import { PollCard } from '@/components/features/Main/PollCard/PollCard';
import { SingleCard } from '@/components/features/Main/SingleCard/SingleCard';
import { HOTPICK_SORT } from '@/constants';
import type { DisplayMainResponse } from '@/generated/models';
import { useInfiniteMainDisplay, useSingleVote } from '@/hooks/api';
import type { CategoryCode } from '@/types/hotpick';
import type { SingleVoteData } from '@/types/singleVote';

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
  const [categoryCodes, setCategoryCodes] = useState<CategoryCode[]>([]);
  const { handleVote } = useSingleVote();

  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage, error } =
    useInfiniteMainDisplay({
      size: 20,
      sort: HOTPICK_SORT,
      categoryCodes: categoryCodes.length > 0 ? categoryCodes : undefined,
      initialData: categoryCodes.length === 0 ? initialData : undefined,
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
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const fixedHotpicks = data?.pages[0]?.fixedTrends ?? [];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const hotpicks = data?.pages.flatMap((page) => page?.trends ?? []) ?? [];

  // 초기 로딩 상태
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (isLoading && hotpicks.length === 0) {
    return (
      <div className={styles.container}>
        <CategoryFilter selectedCodes={categoryCodes} onChange={setCategoryCodes} />
        <div className={styles.statusContainer}>
          <p className={styles.statusText}>핫픽을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (isError && hotpicks.length === 0) {
    return (
      <div className={styles.container}>
        <CategoryFilter selectedCodes={categoryCodes} onChange={setCategoryCodes} />
        <div className={styles.statusContainer}>
          <p className={styles.errorText}>핫픽을 불러오는데 실패했습니다.</p>
          <p className={styles.errorHint}>잠시 후 다시 시도해주세요.</p>
        </div>
      </div>
    );
  }

  // 빈 상태
  if (fixedHotpicks.length === 0 && hotpicks.length === 0) {
    return (
      <div className={styles.container}>
        <CategoryFilter selectedCodes={categoryCodes} onChange={setCategoryCodes} />
        <div className={styles.emptyState}>
          <div className={styles.icon}>📊</div>
          <h2 className={styles.title}>아직 진행중인 핫픽이 없어요</h2>
          <p className={styles.description}>
            새로운 핫픽 투표가 시작되면 여기에 표시됩니다.
            <br />곧 흥미로운 주제로 찾아뵙겠습니다!
          </p>
        </div>
      </div>
    );
  }

  const renderTrend = (trend: (typeof hotpicks)[number], keyPrefix?: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item = trend as any;
    const alias = trend.alias ?? '';
    const key = keyPrefix ? `${keyPrefix}-${trend.id}` : trend.id;

    // SINGLE 타입: 인라인 투표 카드
    if (item.type === 'SINGLE' && item.singleVote) {
      return (
        <div key={key} id={alias}>
          <SingleCard
            id={trend.id ?? 0}
            alias={alias}
            title={trend.title ?? ''}
            categoryLabel={item.categoryCode}
            participantCount={trend.participantsCount}
            status={item.status}
            singleVote={item.singleVote as SingleVoteData}
            onVote={handleVote}
          />
        </div>
      );
    }

    // BUNDLE 타입: 기존 PollCard
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
      <div key={key} id={alias}>
        <PollCard
          alias={alias}
          title={trend.title ?? ''}
          subtitle={trend.label}
          createdAt={trend.createdAt}
          imageUrls={validImageUrls}
          participantCount={trend.participantsCount}
        />
      </div>
    );
  };

  return (
    <>
      <noscript>{children}</noscript>

      <div className={styles.container}>
        <CategoryFilter selectedCodes={categoryCodes} onChange={setCategoryCodes} />

        {/* 고정 핫픽 */}
        {fixedHotpicks.map((trend) => renderTrend(trend, 'fixed'))}

        {/* 혼합 피드 (싱글 + 번들) */}
        {hotpicks.map((trend) => renderTrend(trend))}

        {/* 무한스크롤 트리거 */}
        <div ref={observerTarget} className={styles.observerTarget}>
          {isFetchingNextPage && <p className={styles.loadingMore}>핫픽을 더 불러오는 중...</p>}
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
