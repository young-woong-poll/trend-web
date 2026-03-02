'use client';

import { useCallback, useMemo, useState, type FC, type ReactNode } from 'react';

import { CommentBottomSheet } from '@/components/features/Hotpick/CommentModal';
import { ShareBottomSheet } from '@/components/features/Hotpick/ShareBottomSheet';
import { BundleCard } from '@/components/features/Main/BundleCard/BundleCard';
import { CategoryFilter } from '@/components/features/Main/CategoryFilter';
import styles from '@/components/features/Main/MainContent.module.scss';
import { SingleCard } from '@/components/features/Main/SingleCard/SingleCard';
import { SkeletonCard } from '@/components/features/Main/SkeletonCard/SkeletonCard';
import type { CategoryFilterItem } from '@/constants/category';
import { useModal } from '@/contexts/ModalContext';
import type { HotpickCardResponse } from '@/generated/models';
import { useInfiniteMainDisplay, useCategories, useSingleVote } from '@/hooks/api';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { electionToSingleVoteData } from '@/types/singleVote';

type TMainViewProps = {
  children?: ReactNode;
};

export const MainView: FC<TMainViewProps> = ({ children }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>('all');
  const [commentTarget, setCommentTarget] = useState<{
    slug: string;
    electionId: string;
  } | null>(null);
  const [shareTarget, setShareTarget] = useState<{
    slug: string;
    title: string;
    options: string[];
    imageUrl?: string;
  } | null>(null);
  const { handleVote } = useSingleVote();
  const { showToast } = useModal();
  const { data: apiCategories, isLoading: isCategoriesLoading } = useCategories();

  const dynamicCategories: CategoryFilterItem[] | undefined = Array.isArray(apiCategories)
    ? apiCategories.map((c) => ({
        label: c.name ?? '',
        slug: c.slug ?? '',
      }))
    : undefined;

  const handleComment = useCallback((slug: string, electionId: string) => {
    setCommentTarget({ slug, electionId });
  }, []);

  const handleCommentBlocked = useCallback(() => {
    showToast('댓글은 투표 후 확인 가능합니다');
  }, [showToast]);

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
  });

  const observerTarget = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage: () => void fetchNextPage(),
  });

  const handleCategoryChange = useCallback((slug: string | null) => {
    setSelectedCategory(slug);
  }, []);

  // 페이지 데이터 병합 (hotpickId 기준 중복 제거)
  const hotpicks = useMemo(() => {
    const allHotpicks = data?.pages.flatMap((page) => page?.hotpicks ?? []) ?? [];
    return [...new Map(allHotpicks.map((h) => [h.hotpickId, h])).values()];
  }, [data?.pages]);

  const handleShare = useCallback(
    (slug: string) => {
      const hotpick = hotpicks.find((h) => h.slug === slug);
      const election = hotpick?.election;
      setShareTarget({
        slug,
        title: election?.title ?? '',
        options: (election?.items ?? []).map((item) => item.title ?? ''),
        imageUrl: election?.imageUrl ?? hotpick?.imageUrl,
      });
    },
    [hotpicks]
  );

  const renderHotpick = (hotpick: HotpickCardResponse, keyPrefix?: string) => {
    const slug = hotpick.slug ?? '';
    const key = keyPrefix ? `${keyPrefix}-${hotpick.hotpickId}` : hotpick.hotpickId;
    const election = hotpick.election;
    const categoryList = (hotpick.categories ?? []).map((c) => c.name ?? '');
    const status = hotpick.isExpired ? 'CLOSED' : 'OPEN';
    const hasOptionImages = (election?.items ?? []).some((item) => !!item.imageUrl);

    if (hotpick.type === 'SINGLE' && election) {
      return (
        <div key={key} id={slug} className={styles.cardWrapper}>
          <SingleCard
            id={hotpick.hotpickId ?? 0}
            alias={slug}
            title={election.title ?? ''}
            categories={categoryList}
            participantCount={election.totalVoteCount}
            commentCount={election.totalCommentCount}
            deadline={hotpick.expiredAt}
            status={status}
            singleVote={electionToSingleVoteData(election)}
            voteType={hasOptionImages ? 'IMAGE' : 'TEXT'}
            mainImageUrl={!hasOptionImages ? (election.imageUrl ?? hotpick.imageUrl) : undefined}
            topComment={hotpick.topComment}
            onVote={handleVote}
            onShare={handleShare}
            onComment={handleComment}
            onCommentBlocked={handleCommentBlocked}
          />
        </div>
      );
    }

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

  const renderContent = () => {
    if (isLoading && hotpicks.length === 0) {
      return (
        <div className={styles.skeletonGroup}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      );
    }

    if (isError && hotpicks.length === 0) {
      return (
        <div className={styles.statusContainer}>
          <p className={styles.errorText}>핫픽을 불러오는데 실패했습니다.</p>
          <p className={styles.errorHint}>잠시 후 다시 시도해주세요.</p>
        </div>
      );
    }

    if (!isFetching && hotpicks.length === 0) {
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
      </>
    );
  };

  return (
    <>
      <noscript>{children}</noscript>

      <div className={styles.container}>
        <CategoryFilter
          selectedSlug={selectedCategory}
          onChange={handleCategoryChange}
          categories={dynamicCategories}
          isLoading={isCategoriesLoading}
        />

        {renderContent()}
      </div>

      {/* 댓글 바텀시트 */}
      {commentTarget && (
        <CommentBottomSheet
          isOpen
          onClose={handleCloseComment}
          slug={commentTarget.slug}
          electionId={commentTarget.electionId}
        />
      )}

      {/* 공유하기 바텀시트 */}
      {shareTarget && (
        <ShareBottomSheet
          isOpen
          onClose={() => setShareTarget(null)}
          hotpickAlias={shareTarget.slug}
          title={shareTarget.title}
          options={shareTarget.options}
          imageUrl={shareTarget.imageUrl}
        />
      )}
    </>
  );
};
