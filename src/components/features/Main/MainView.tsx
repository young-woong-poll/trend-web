'use client';

import { useCallback, useMemo, useState, type FC, type ReactNode } from 'react';

import { LazyMotion, domAnimation } from 'framer-motion';

import { CardList } from '@/components/features/Main/CardList/CardList';
import { CategoryFilter } from '@/components/features/Main/CategoryFilter';
import styles from '@/components/features/Main/MainContent.module.scss';
import type { CategoryFilterItem } from '@/constants/category';
import { CardActionsProvider } from '@/contexts/CardActionsContext';
import type { HotpickCardResponse } from '@/generated/models';
import { useInfiniteMainDisplay, useCategories } from '@/hooks/api';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { toCardModel } from '@/lib/mappers/cardMapper';

type TMainViewProps = {
  children?: ReactNode;
};

export const MainView: FC<TMainViewProps> = ({ children }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>('all');
  const { data: apiCategories, isLoading: isCategoriesLoading } = useCategories();

  const dynamicCategories: CategoryFilterItem[] | undefined = Array.isArray(apiCategories)
    ? apiCategories.map((c) => ({
        label: c.name ?? '',
        slug: c.slug ?? '',
      }))
    : undefined;

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
    return [...new Map(allHotpicks.map((h: HotpickCardResponse) => [h.hotpickId, h])).values()];
  }, [data?.pages]);

  // BE → UI model 변환 (한 번만)
  const cards = useMemo(() => hotpicks.map(toCardModel), [hotpicks]);

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

        <LazyMotion features={domAnimation}>
          <CardActionsProvider>
            <CardList
              cards={cards}
              isLoading={isLoading}
              isError={isError}
              isFetching={isFetching}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage ?? false}
              error={error}
              observerTarget={observerTarget}
              onRetry={() => fetchNextPage()}
            />
          </CardActionsProvider>
        </LazyMotion>
      </div>
    </>
  );
};
