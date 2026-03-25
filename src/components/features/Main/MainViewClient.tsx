'use client';

import { useEffect, useCallback, useMemo, useState, type FC, type ReactNode } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { LazyMotion, domAnimation } from 'framer-motion';

import { CardList } from '@/components/features/Main/CardList/CardList';
import { ContentTabs } from '@/components/features/Main/ContentTabs';
import styles from '@/components/features/Main/MainContent.module.scss';
import type { CategoryFilterItem } from '@/constants/category';
import {
  DEFAULT_HOT_PERIOD,
  DEFAULT_TAB,
  type HotPeriod,
  type TabSelection,
  type FilterTabType,
} from '@/constants/contentTab';
import { CardActionsProvider } from '@/contexts/CardActionsContext';
import type { HotpickCardResponse } from '@/generated/models';
import { useInfiniteMainDisplay, useCategories } from '@/hooks/api';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { toCardModel } from '@/lib/mappers/cardMapper';

type TMainViewClientProps = {
  children?: ReactNode;
};

/**
 * URL 쿼리에서 탭 정보 파싱
 */
function parseTabFromQuery(searchParams: URLSearchParams): TabSelection {
  const filter = searchParams.get('filter');
  const category = searchParams.get('category');

  // 카테고리 탭이 지정되었으면 우선 적용
  if (category) {
    const categoryLabel = searchParams.get('categoryLabel');
    return {
      kind: 'category',
      slug: category,
      label: categoryLabel || category,
    };
  }

  // 필터 탭 (new, hot, my)
  if (filter && ['new', 'hot', 'my'].includes(filter)) {
    return {
      kind: 'filter',
      type: filter as FilterTabType,
    };
  }

  return DEFAULT_TAB;
}

/**
 * URL 쿼리에서 HOT 기간 파싱
 */
function parseHotPeriodFromQuery(searchParams: URLSearchParams): HotPeriod {
  const period = searchParams.get('period');
  if (period && ['1d', '1w', '1m', '1y'].includes(period)) {
    return period as HotPeriod;
  }
  return DEFAULT_HOT_PERIOD;
}

/**
 * 탭 정보를 URL 쿼리로 업데이트
 */
function updateUrlWithTab(
  tab: TabSelection,
  period: HotPeriod,
  router: ReturnType<typeof useRouter>
) {
  const params = new URLSearchParams();

  if (tab.kind === 'filter') {
    params.set('filter', tab.type);
  } else {
    params.set('category', tab.slug);
    params.set('categoryLabel', tab.label);
  }

  if (tab.kind === 'filter' && tab.type === 'hot') {
    params.set('period', period);
  }

  router.push(`/?${params.toString()}`);
}

/**
 * TabSelection → API 파라미터 변환
 */
function buildQueryParams(tab: TabSelection, hotPeriod: HotPeriod) {
  const base = { size: 18 };

  if (tab.kind === 'filter') {
    switch (tab.type) {
      case 'new':
        return { ...base, sort: 'latest', filter: 'new' };
      case 'hot':
        return { ...base, sort: 'hot', filter: `hot_${hotPeriod}` };
      case 'my':
        return { ...base, sort: 'latest', filter: 'voted' };
    }
  }

  // 카테고리 탭
  return { ...base, category: tab.slug, sort: 'latest' };
}

/**
 * TabSelection → 빈 상태 메시지
 */
function getEmptyState(tab: TabSelection): { title: string; description: string } {
  if (tab.kind === 'filter') {
    switch (tab.type) {
      case 'new':
        return {
          title: '새로운 핫픽이 없어요',
          description: '곧 새로운 주제로 찾아뵙겠습니다!',
        };
      case 'hot':
        return {
          title: '아직 HOT 핫픽이 없어요',
          description: '투표가 활발해지면 여기에 표시됩니다.',
        };
      case 'my':
        return {
          title: '투표한 핫픽이 없어요',
          description: '관심 있는 주제에 투표해 보세요!',
        };
    }
  }

  return {
    title: `'${tab.label}' 핫픽이 없어요`,
    description: '해당 카테고리에 핫픽이 등록되면 표시됩니다.',
  };
}

export const MainViewClient: FC<TMainViewClientProps> = ({ children }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedTab, setSelectedTab] = useState<TabSelection>(DEFAULT_TAB);
  const [hotPeriod, setHotPeriod] = useState<HotPeriod>(DEFAULT_HOT_PERIOD);

  const { data: apiCategories } = useCategories();

  // 마운트 후 URL 쿼리에서 초기값 로드
  useEffect(() => {
    const initialTab = parseTabFromQuery(searchParams);
    const initialPeriod = parseHotPeriodFromQuery(searchParams);

    setSelectedTab(initialTab);
    setHotPeriod(initialPeriod);
  }, [searchParams]);

  const dynamicCategories: CategoryFilterItem[] | undefined = Array.isArray(apiCategories)
    ? apiCategories
        .filter((c) => c.slug !== 'all') // "전체" 카테고리 제외 (NEW 탭이 대체)
        .map((c) => ({
          label: c.name ?? '',
          slug: c.slug ?? '',
        }))
    : undefined;

  const queryParams = useMemo(
    () => buildQueryParams(selectedTab, hotPeriod),
    [selectedTab, hotPeriod]
  );

  const {
    data,
    isLoading,
    isError,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    error,
  } = useInfiniteMainDisplay(queryParams);

  const observerTarget = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage: () => void fetchNextPage(),
  });

  // 탭 변경 시 URL 업데이트
  const handleTabChange = useCallback(
    (tab: TabSelection) => {
      setSelectedTab(tab);
      updateUrlWithTab(tab, hotPeriod, router);
      window.scrollTo({ top: 0 });
    },
    [hotPeriod, router]
  );

  // HOT 기간 변경 시 URL 업데이트
  const handleHotPeriodChange = useCallback(
    (period: HotPeriod) => {
      setHotPeriod(period);
      if (selectedTab.kind === 'filter' && selectedTab.type === 'hot') {
        updateUrlWithTab(selectedTab, period, router);
      }
    },
    [selectedTab, router]
  );

  // 페이지 데이터 병합 (hotpickId 기준 중복 제거)
  const hotpicks = useMemo(() => {
    const allHotpicks = data?.pages.flatMap((page) => page?.hotpicks ?? []) ?? [];
    return [...new Map(allHotpicks.map((h: HotpickCardResponse) => [h.hotpickId, h])).values()];
  }, [data?.pages]);

  // BE → UI model 변환 (한 번만)
  const cards = useMemo(() => hotpicks.map(toCardModel), [hotpicks]);

  const emptyState = useMemo(() => getEmptyState(selectedTab), [selectedTab]);

  return (
    <>
      <noscript>{children}</noscript>

      <ContentTabs
        selectedTab={selectedTab}
        onChange={handleTabChange}
        categories={dynamicCategories}
        hotPeriod={hotPeriod}
        onHotPeriodChange={handleHotPeriodChange}
      />

      <div className={styles.container}>
        <LazyMotion features={domAnimation}>
          <CardActionsProvider>
            <CardList
              cards={cards}
              isLoading={isLoading}
              isError={isError}
              isFetching={isFetching}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage}
              error={error}
              observerTarget={observerTarget}
              onRetry={() => fetchNextPage()}
              emptyState={emptyState}
            />
          </CardActionsProvider>
        </LazyMotion>
      </div>
    </>
  );
};
