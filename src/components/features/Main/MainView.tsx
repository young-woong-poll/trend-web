'use client';

import { useCallback, useState, useEffect, useRef, type FC, type ReactNode } from 'react';

import { BundleCard } from '@/components/features/Main/BundleCard/BundleCard';
import { CategoryFilter } from '@/components/features/Main/CategoryFilter';
import styles from '@/components/features/Main/MainContent.module.scss';
import { SingleCard } from '@/components/features/Main/SingleCard/SingleCard';
import { SortToggle } from '@/components/features/Main/SortToggle/SortToggle';
import { HOTPICK_SORT } from '@/constants';
import type { HotpickSortOption } from '@/constants/sort';
import { useModal } from '@/contexts/ModalContext';
import type { DisplayMainResponse } from '@/generated/models';
import { useInfiniteMainDisplay, useSingleVote } from '@/hooks/api';
import { useHashAnchor } from '@/hooks/useHashAnchor';
import type { CategoryCode } from '@/types/hotpick';
import type { SingleVoteData } from '@/types/singleVote';

type TMainViewProps = {
  initialData?: DisplayMainResponse;
  children?: ReactNode;
};

const HIGHLIGHT_DURATION = 1500;

export const MainView: FC<TMainViewProps> = ({ initialData, children }) => {
  const [categoryCodes, setCategoryCodes] = useState<CategoryCode[]>([]);
  const [sortOption, setSortOption] = useState<HotpickSortOption>(HOTPICK_SORT);
  const [highlightedAlias, setHighlightedAlias] = useState<string | null>(null);
  const { handleVote } = useSingleVote();
  const { showToast } = useModal();
  const { anchor, clearAnchor } = useHashAnchor();
  const scrolledRef = useRef(false);
  const topObserverTarget = useRef<HTMLDivElement>(null);

  const handleShare = useCallback(
    (alias: string) => {
      const url = `${window.location.origin}/#${alias}`;
      void navigator.clipboard.writeText(url).then(() => {
        showToast('링크가 복사되었습니다');
      });
    },
    [showToast]
  );

  // anchor가 있으면 카테고리 필터 "전체"로 초기화
  const activeAnchor = anchor && categoryCodes.length === 0 ? anchor : undefined;

  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    hasPreviousPage,
    fetchNextPage,
    fetchPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    error,
  } = useInfiniteMainDisplay({
    size: 20,
    sort: sortOption,
    categoryCodes: categoryCodes.length > 0 ? categoryCodes : undefined,
    anchor: activeAnchor,
    initialData: categoryCodes.length === 0 && !activeAnchor ? initialData : undefined,
  });

  const observerTarget = useRef<HTMLDivElement>(null);

  // 하향 무한스크롤
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

  // 상향 무한스크롤 (anchor 진입 시)
  useEffect(() => {
    if (!hasPreviousPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasPreviousPage && !isFetchingPreviousPage) {
          void fetchPreviousPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = topObserverTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasPreviousPage, isFetchingPreviousPage, fetchPreviousPage]);

  // 해시 스크롤 + 하이라이트
  useEffect(() => {
    if (!anchor || scrolledRef.current || !data) {
      return;
    }

    // anchorNotFound 체크
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const firstPage = data.pages[0] as any;
    if (firstPage?.anchorNotFound) {
      showToast('해당 핫픽을 찾을 수 없습니다');
      clearAnchor();
      return;
    }

    // 해당 엘리먼트 찾기
    const el = document.getElementById(anchor);
    if (!el) {
      return;
    }

    scrolledRef.current = true;

    // 약간의 딜레이 후 스크롤 (렌더링 완료 보장)
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // 하이라이트 적용
      setHighlightedAlias(anchor);
      setTimeout(() => {
        setHighlightedAlias(null);
        clearAnchor();
      }, HIGHLIGHT_DURATION);
    });
  }, [anchor, data, clearAnchor, showToast]);

  // anchor 변경 시 scrolledRef 리셋
  useEffect(() => {
    scrolledRef.current = false;
  }, [anchor]);

  // 카테고리 변경 시 anchor 초기화
  const handleCategoryChange = useCallback(
    (codes: CategoryCode[]) => {
      setCategoryCodes(codes);
      if (anchor) {
        clearAnchor();
      }
    },
    [anchor, clearAnchor]
  );

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
        <CategoryFilter selectedCodes={categoryCodes} onChange={handleCategoryChange} />
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
        <CategoryFilter selectedCodes={categoryCodes} onChange={handleCategoryChange} />
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
        <CategoryFilter selectedCodes={categoryCodes} onChange={handleCategoryChange} />
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
        <div key={key} id={alias} className={styles.cardWrapper}>
          <SingleCard
            id={trend.id ?? 0}
            alias={alias}
            title={trend.title ?? ''}
            categoryLabel={item.categoryCode}
            participantCount={trend.participantsCount}
            deadline={item.deadline}
            status={item.status}
            singleVote={item.singleVote as SingleVoteData}
            isHighlighted={highlightedAlias === alias}
            onVote={handleVote}
            onShare={handleShare}
          />
        </div>
      );
    }

    // BUNDLE 타입: BundleCard
    return (
      <div key={key} id={alias} className={styles.cardWrapper}>
        <BundleCard
          alias={alias}
          title={trend.title ?? ''}
          subtitle={trend.label}
          categoryLabel={item.categoryCode}
          createdAt={trend.createdAt}
          participantCount={trend.participantsCount}
          electionCount={item.electionCount}
          imageUrls={trend.imageUrls}
          deadline={item.deadline}
          status={item.status}
          onShare={handleShare}
        />
      </div>
    );
  };

  return (
    <>
      <noscript>{children}</noscript>

      <div className={styles.container}>
        <CategoryFilter selectedCodes={categoryCodes} onChange={handleCategoryChange} />
        <SortToggle value={sortOption} onChange={setSortOption} />

        {/* 상향 무한스크롤 트리거 */}
        {hasPreviousPage && (
          <div ref={topObserverTarget} className={styles.observerTarget}>
            {isFetchingPreviousPage && (
              <p className={styles.loadingMore}>이전 핫픽을 불러오는 중...</p>
            )}
          </div>
        )}

        {/* 고정 핫픽 */}
        {fixedHotpicks.map((trend) => renderTrend(trend, 'fixed'))}

        {/* 혼합 피드 (싱글 + 번들) */}
        {hotpicks.map((trend) => renderTrend(trend))}

        {/* 하향 무한스크롤 트리거 */}
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
