'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FC, type ReactNode } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { LazyMotion, domAnimation } from 'framer-motion';

import { CardList } from '@/components/features/Main/CardList/CardList';
import { ContentTabs } from '@/components/features/Main/ContentTabs';
import styles from '@/components/features/Main/MainContent.module.scss';
import { MyBundleList } from '@/components/features/Main/MyBundleList/MyBundleList';
import { MyLoginPrompt } from '@/components/features/Main/MyLoginPrompt/MyLoginPrompt';
import { MySubTabs } from '@/components/features/Main/MySubTabs/MySubTabs';
import { TopRankingList } from '@/components/features/Main/TopRankingList/TopRankingList';
import { TopSubFilter } from '@/components/features/Main/TopSubFilter/TopSubFilter';
import LikedHotpickList from '@/components/features/MyPage/LikedHotpickList';
import MyCommentList from '@/components/features/MyPage/MyCommentList';
import type { CategoryFilterItem } from '@/constants/category';
import {
  DEFAULT_TOP_PERIOD,
  DEFAULT_TAB,
  DEFAULT_MY_SUB_TAB_GUEST,
  DEFAULT_MY_SUB_TAB_LOGGED_IN,
  type TopPeriod,
  type TabSelection,
  type FilterTabType,
  type MySubTabType,
} from '@/constants/contentTab';
import { useAuth } from '@/contexts/AuthContext';
import { CardActionsProvider } from '@/contexts/CardActionsContext';
import type { CategoryTabResponse, HotpickCardResponse } from '@/generated/models';
import { useInfiniteMainDisplay, useCategories } from '@/hooks/api';
import { useMyBundles } from '@/hooks/api/useMyBundles';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { toCardModel } from '@/lib/mappers/cardMapper';

type TMainViewClientProps = {
  children?: ReactNode;
};

const FILTER_TAB_TYPES: FilterTabType[] = ['new', 'top', 'my'];

/**
 * URL 쿼리에서 탭 정보 파싱
 */
function parseTabFromQuery(
  searchParams: URLSearchParams,
  categories?: CategoryTabResponse[]
): TabSelection {
  const filter = searchParams.get('filter');
  const category = searchParams.get('category');

  // 카테고리 탭이 지정되었으면 우선 적용
  if (category) {
    const label = categories?.find((c) => c.slug === category)?.name ?? category;
    return { kind: 'category', slug: category, label };
  }

  // 필터 탭 (new, top, my)
  if (filter && FILTER_TAB_TYPES.includes(filter as FilterTabType)) {
    return { kind: 'filter', type: filter as FilterTabType };
  }

  return DEFAULT_TAB;
}

/**
 * 탭 정보를 URL 쿼리로 업데이트
 */
function buildUrlParams(tab: TabSelection): string {
  const params = new URLSearchParams();

  if (tab.kind === 'filter') {
    params.set('filter', tab.type);
  } else {
    params.set('category', tab.slug);
  }

  return `/?${params.toString()}`;
}

/**
 * TabSelection → API 파라미터 변환
 */
function buildQueryParams(tab: TabSelection, topPeriod: TopPeriod, topCategory: string | null) {
  if (tab.kind === 'filter') {
    switch (tab.type) {
      case 'new':
        return { size: 18, sort: 'latest', filter: 'new' };
      case 'top': {
        const params: Record<string, string | number> = {
          size: 15,
          sort: 'hot',
        };
        // 'all' → filter 없음 (전체 기간), 나머지 → hot_{period}
        if (topPeriod !== 'all') {
          params.filter = `hot_${topPeriod}`;
        }
        if (topCategory) {
          params.category = topCategory;
        }
        return params;
      }
      case 'my':
        return { size: 18, sort: 'latest', filter: 'voted' };
    }
  }

  // 카테고리 탭
  return { size: 18, category: tab.slug, sort: 'latest' };
}

/**
 * TabSelection → 빈 상태 메시지
 */
function getEmptyState(
  tab: TabSelection,
  topCategory: string | null,
  categoryLabel?: string
): { title: string; description: string } {
  if (tab.kind === 'filter') {
    switch (tab.type) {
      case 'new':
        return {
          title: '새로운 핫픽이 없어요',
          description: '곧 새로운 주제로 찾아뵙겠습니다!',
        };
      case 'top':
        if (topCategory && categoryLabel) {
          return {
            title: `'${categoryLabel}' TOP 핫픽이 없어요`,
            description: '해당 카테고리의 인기 투표가 생기면 표시됩니다.',
          };
        }
        return {
          title: '아직 TOP 핫픽이 없어요',
          description: '투표가 쌓이면 여기서 순위를 확인할 수 있어요.',
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

  const { data: apiCategories } = useCategories();

  // URL searchParams를 single source of truth로 사용
  const selectedTab = useMemo(
    () => parseTabFromQuery(searchParams, Array.isArray(apiCategories) ? apiCategories : undefined),
    [searchParams, apiCategories]
  );

  // TOP 서브필터 상태 (탭 전환해도 선택값 보존)
  const [topPeriod, setTopPeriod] = useState<TopPeriod>(DEFAULT_TOP_PERIOD);
  const [topCategory, setTopCategory] = useState<string | null>(null);

  // My 하위 탭 상태
  const { isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const [mySubTab, setMySubTab] = useState<MySubTabType>(DEFAULT_MY_SUB_TAB_GUEST);
  const mySubTabSynced = useRef(false);

  // auth 로딩 완료 후 로그인 상태에 맞게 기본 탭 동기화
  useEffect(() => {
    if (!isAuthLoading && !mySubTabSynced.current) {
      mySubTabSynced.current = true;
      setMySubTab(isLoggedIn ? DEFAULT_MY_SUB_TAB_LOGGED_IN : DEFAULT_MY_SUB_TAB_GUEST);
    }
  }, [isAuthLoading, isLoggedIn]);

  const isTopTab = selectedTab.kind === 'filter' && selectedTab.type === 'top';
  const isMyTab = selectedTab.kind === 'filter' && selectedTab.type === 'my';
  const { data: myBundles } = useMyBundles(isMyTab && isLoggedIn && mySubTab === 'compare');

  const dynamicCategories: CategoryFilterItem[] | undefined = Array.isArray(apiCategories)
    ? apiCategories
        .filter((c) => c.slug !== 'all') // "전체" 카테고리 제외 (NEW 탭이 대체)
        .map((c) => ({
          label: c.name ?? '',
          slug: c.slug ?? '',
        }))
    : undefined;

  const queryParams = useMemo(
    () => buildQueryParams(selectedTab, topPeriod, topCategory),
    [selectedTab, topPeriod, topCategory]
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
    hasNextPage: isTopTab ? false : hasNextPage, // TOP 탭은 무한스크롤 비활성
    isFetchingNextPage,
    fetchNextPage: () => void fetchNextPage(),
  });

  // 탭 변경 시 URL 업데이트 (replace로 히스토리 오염 방지)
  const handleTabChange = useCallback(
    (tab: TabSelection) => {
      router.replace(buildUrlParams(tab));
      window.scrollTo({ top: 0 });
    },
    [router]
  );

  // 페이지 데이터 병합 (hotpickId 기준 중복 제거)
  const hotpicks = useMemo(() => {
    const allHotpicks = data?.pages.flatMap((page) => page?.hotpicks ?? []) ?? [];
    return [...new Map(allHotpicks.map((h: HotpickCardResponse) => [h.hotpickId, h])).values()];
  }, [data?.pages]);

  // BE → UI model 변환 (한 번만)
  const cards = useMemo(() => hotpicks.map(toCardModel), [hotpicks]);

  // TOP 카테고리 라벨 찾기 (빈 상태 메시지용)
  const topCategoryLabel = topCategory
    ? dynamicCategories?.find((c) => c.slug === topCategory)?.label
    : undefined;

  const emptyState = useMemo(
    () => getEmptyState(selectedTab, topCategory, topCategoryLabel),
    [selectedTab, topCategory, topCategoryLabel]
  );

  return (
    <>
      <noscript>{children}</noscript>

      <ContentTabs
        selectedTab={selectedTab}
        onChange={handleTabChange}
        categories={dynamicCategories}
      />

      {/* TOP 서브필터 — TOP 탭 활성 시에만 표시 */}
      {isTopTab && (
        <TopSubFilter
          selectedPeriod={topPeriod}
          onPeriodChange={setTopPeriod}
          selectedCategory={topCategory}
          onCategoryChange={setTopCategory}
          categories={dynamicCategories}
        />
      )}

      {/* My 하위 탭 — MY 탭 활성 시에만 표시 */}
      {isMyTab && <MySubTabs activeTab={mySubTab} onChange={setMySubTab} />}

      <div
        className={`${styles.container} ${isTopTab ? styles.containerWithSubFilter : ''} ${isMyTab ? styles.containerWithMySubTabs : ''}`}
      >
        <LazyMotion features={domAnimation}>
          <CardActionsProvider>
            {isTopTab ? (
              <TopRankingList
                cards={cards}
                isLoading={isLoading}
                isError={isError}
                isFetching={isFetching}
                emptyState={emptyState}
              />
            ) : isMyTab && mySubTab !== 'vote' ? (
              // My 탭: 비교/댓글/좋아요 하위 탭
              mySubTab === 'compare' ? (
                isLoggedIn ? (
                  <MyBundleList bundles={myBundles ?? []} />
                ) : (
                  <MyLoginPrompt tab="compare" />
                )
              ) : mySubTab === 'comments' ? (
                isLoggedIn ? (
                  <MyCommentList />
                ) : (
                  <MyLoginPrompt tab="comments" />
                )
              ) : mySubTab === 'likes' ? (
                isLoggedIn ? (
                  <LikedHotpickList />
                ) : (
                  <MyLoginPrompt tab="likes" />
                )
              ) : null
            ) : (
              // NEW/카테고리/My+투표 탭: 기존 CardList
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
            )}
          </CardActionsProvider>
        </LazyMotion>
      </div>
    </>
  );
};
