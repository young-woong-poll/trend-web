'use client';

import { useCallback, useState, useEffect, useRef, type FC, type ReactNode } from 'react';

import { CommentBottomSheet } from '@/components/features/Hotpick/CommentModal';
import { BundleCard } from '@/components/features/Main/BundleCard/BundleCard';
import { CategoryFilter } from '@/components/features/Main/CategoryFilter';
import styles from '@/components/features/Main/MainContent.module.scss';
import { SingleCard } from '@/components/features/Main/SingleCard/SingleCard';
import { SkeletonCard } from '@/components/features/Main/SkeletonCard/SkeletonCard';
import { useModal } from '@/contexts/ModalContext';
import type { MainHotpickResponse, HotpickCardResponse } from '@/generated/models';
import { useInfiniteMainDisplay, useSingleVote } from '@/hooks/api';
import { electionToSingleVoteData } from '@/types/singleVote';

type TMainViewProps = {
  initialData?: MainHotpickResponse;
  children?: ReactNode;
};

export const MainView: FC<TMainViewProps> = ({ initialData, children }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [commentTarget, setCommentTarget] = useState<{
    hotpickId: string;
    electionId: string;
  } | null>(null);
  const { handleVote } = useSingleVote();
  const { showToast } = useModal();

  const handleShare = useCallback(
    (slug: string) => {
      const url = `${window.location.origin}/hotpick/${slug}`;
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
    category: selectedCategory ?? undefined,
    initialData: selectedCategory === null ? initialData : undefined,
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

  const handleCategoryChange = useCallback((slug: string | null) => {
    setSelectedCategory(slug);
  }, []);

  // 페이지 데이터 병합 (hotpickId 기준 중복 제거)
  const hotpicks = (() => {
    const all = data?.pages.flatMap((page) => page?.hotpicks ?? []) ?? [];
    const seen = new Set<number | undefined>();
    return all.filter((h) => {
      if (seen.has(h.hotpickId)) {
        return false;
      }
      seen.add(h.hotpickId);
      return true;
    });
  })();

  // 초기 로딩 상태
  if (isLoading && hotpicks.length === 0) {
    return (
      <div className={styles.container}>
        <CategoryFilter selectedSlug={selectedCategory} onChange={handleCategoryChange} />
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
        <CategoryFilter selectedSlug={selectedCategory} onChange={handleCategoryChange} />
        <div className={styles.statusContainer}>
          <p className={styles.errorText}>핫픽을 불러오는데 실패했습니다.</p>
          <p className={styles.errorHint}>잠시 후 다시 시도해주세요.</p>
        </div>
      </div>
    );
  }

  // 빈 상태 (fetching 중이면 빈 상태 표시하지 않음)
  if (!isFetching && hotpicks.length === 0) {
    return (
      <div className={styles.container}>
        <CategoryFilter selectedSlug={selectedCategory} onChange={handleCategoryChange} />
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

  const renderHotpick = (hotpick: HotpickCardResponse, keyPrefix?: string) => {
    const slug = hotpick.slug ?? '';
    const key = keyPrefix ? `${keyPrefix}-${hotpick.hotpickId}` : hotpick.hotpickId;
    const election = hotpick.election;
    const categoryList = (hotpick.categories ?? []).map((c) => c.name ?? '');

    // expiredAt 기반 상태 판단
    const isExpired = hotpick.expiredAt ? new Date(hotpick.expiredAt) < new Date() : false;
    const status = isExpired ? 'CLOSED' : 'OPEN';

    // voteType 추론: election items에 imageUrl이 있으면 IMAGE
    const hasOptionImages = (election?.items ?? []).some((item) => !!item.imageUrl);
    const voteType = hasOptionImages ? 'IMAGE' : 'TEXT';

    // SINGLE 타입 + election 존재: 인라인 투표 카드
    if (hotpick.type === 'SINGLE' && election) {
      const singleVote = electionToSingleVoteData(election);
      const mainImageUrl = !hasOptionImages ? (election.imageUrl ?? hotpick.imageUrl) : undefined;

      return (
        <div key={key} id={slug} className={styles.cardWrapper}>
          <SingleCard
            id={hotpick.hotpickId ?? 0}
            alias={slug}
            title={election.title ?? ''}
            categories={categoryList}
            participantCount={election.totalVoteCount}
            deadline={hotpick.expiredAt}
            status={status}
            singleVote={singleVote}
            voteType={voteType}
            mainImageUrl={mainImageUrl}
            onVote={handleVote}
            onShare={handleShare}
            onComment={handleComment}
          />
        </div>
      );
    }

    // BUNDLE 타입: BundleCard
    return (
      <div key={key} id={slug} className={styles.cardWrapper}>
        <BundleCard
          alias={slug}
          title={election?.title ?? ''}
          categories={categoryList}
          participantCount={election?.totalVoteCount}
          imageUrls={hotpick.imageUrl ? [hotpick.imageUrl] : undefined}
          deadline={hotpick.expiredAt}
          status={status}
          onShare={handleShare}
        />
      </div>
    );
  };

  return (
    <>
      <noscript>{children}</noscript>

      <div className={styles.container}>
        <CategoryFilter selectedSlug={selectedCategory} onChange={handleCategoryChange} />

        {/* 핫픽 피드 */}
        {hotpicks.map((hotpick) => renderHotpick(hotpick))}

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
