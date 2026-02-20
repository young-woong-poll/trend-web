'use client';

import { useCallback, useState, useEffect, useRef, type FC, type ReactNode } from 'react';

import { CommentBottomSheet } from '@/components/features/Hotpick/CommentModal';
import { BundleCard } from '@/components/features/Main/BundleCard/BundleCard';
import { CategoryFilter } from '@/components/features/Main/CategoryFilter';
import styles from '@/components/features/Main/MainContent.module.scss';
import { SingleCard } from '@/components/features/Main/SingleCard/SingleCard';
import { SkeletonCard } from '@/components/features/Main/SkeletonCard/SkeletonCard';
import { useModal } from '@/contexts/ModalContext';
import type { DisplayMainResponse } from '@/generated/models';
import { useInfiniteMainDisplay, useSingleVote } from '@/hooks/api';
import type { CategoryCode } from '@/types/hotpick';
import type { SingleVoteData } from '@/types/singleVote';

type TMainViewProps = {
  initialData?: DisplayMainResponse;
  children?: ReactNode;
};

export const MainView: FC<TMainViewProps> = ({ initialData, children }) => {
  const [categoryCodes, setCategoryCodes] = useState<CategoryCode[]>([]);
  const [commentTarget, setCommentTarget] = useState<{
    hotpickId: string;
    electionId: string;
  } | null>(null);
  const { handleVote } = useSingleVote();
  const { showToast } = useModal();

  const handleShare = useCallback(
    (alias: string) => {
      const url = `${window.location.origin}/hotpick/${alias}`;
      void navigator.clipboard.writeText(url).then(() => {
        showToast('링크가 복사되었습니다');
      });
    },
    [showToast]
  );

  const handleComment = useCallback((hotpickId: string, electionId: string) => {
    setCommentTarget({ hotpickId, electionId });
  }, []);

  const handleCloseComment = useCallback(() => {
    setCommentTarget(null);
  }, []);

  const {
    data,
    isLoading,
    isError,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    error,
  } = useInfiniteMainDisplay({
    size: 20,
    sort: 'popular',
    categoryCodes: categoryCodes.length > 0 ? categoryCodes : undefined,
    initialData: categoryCodes.length === 0 ? initialData : undefined,
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

  const handleCategoryChange = useCallback((codes: CategoryCode[]) => {
    setCategoryCodes(codes);
  }, []);

  // 페이지 데이터 병합 (id 기준 중복 제거)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const fixedHotpicks = data?.pages[0]?.fixedTrends ?? [];
  const fixedIds = new Set(fixedHotpicks.map((t) => t.id));
  const hotpicks = (() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const all = data?.pages.flatMap((page) => page?.trends ?? []) ?? [];
    const seen = new Set<number | undefined>();
    return all.filter((t) => {
      if (seen.has(t.id) || fixedIds.has(t.id)) {
        return false;
      }
      seen.add(t.id);
      return true;
    });
  })();

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

  // 빈 상태 (fetching 중이면 빈 상태 표시하지 않음)
  if (!isFetching && fixedHotpicks.length === 0 && hotpicks.length === 0) {
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
    // 멀티 카테고리 지원: categoryCodes 배열
    const codes = (item.categoryCodes as string[] | undefined) ?? [];
    const categoryList =
      codes.length > 0 ? codes : item.categoryCode ? [item.categoryCode as string] : [];

    // SINGLE 타입: 인라인 투표 카드
    if (item.type === 'SINGLE' && item.singleVote) {
      return (
        <div key={key} id={alias} className={styles.cardWrapper}>
          <SingleCard
            id={trend.id ?? 0}
            alias={alias}
            title={trend.title ?? ''}
            categories={categoryList}
            participantCount={trend.participantsCount}
            deadline={item.deadline}
            status={item.status}
            singleVote={item.singleVote as SingleVoteData}
            voteType={item.voteType}
            mainImageUrl={item.mainImageUrl ?? trend.imageUrls?.[0]}
            onVote={handleVote}
            onShare={handleShare}
            onComment={handleComment}
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
          categories={categoryList}
          createdAt={trend.createdAt}
          participantCount={trend.participantsCount}
          electionCount={item.electionCount}
          imageUrls={trend.imageUrls}
          deadline={item.deadline}
          status={item.status}
          participated={item.participated}
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

        {/* 고정 핫픽 */}
        {fixedHotpicks.map((trend) => renderTrend(trend, 'fixed'))}

        {/* 혼합 피드 (싱글 + 번들) */}
        {hotpicks.map((trend) => renderTrend(trend))}

        {/* 하향 무한스크롤 트리거 */}
        <div ref={observerTarget} className={styles.observerTarget}>
          {isFetchingNextPage && (
            <div className={styles.skeletonGroup}>
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}
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

      {/* 댓글 바텀시트 */}
      {commentTarget && (
        <CommentBottomSheet
          isOpen={!!commentTarget}
          onClose={handleCloseComment}
          hotpickId={commentTarget.hotpickId}
          electionId={commentTarget.electionId}
          hotpickAlias=""
        />
      )}
    </>
  );
};
