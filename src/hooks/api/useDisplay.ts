import {
  queryOptions,
  infiniteQueryOptions,
  useQuery,
  useInfiniteQuery,
  type InfiniteData,
} from '@tanstack/react-query';

import * as clientApi from '@/generated/api/client/display/display';
import * as serverApi from '@/generated/api/server/display/display';
import type {
  DisplayMainResponse,
  DisplayTrendDetailResponse,
  DisplayResultResponse,
} from '@/generated/models';
// [DEPRECATED] CategoryCode, HotpickType — BE API에 categoryCodes/type 파라미터가 반영되면
// Orval 생성 타입으로 교체하고 이 import를 제거하세요.
import type { CategoryCode, HotpickType } from '@/types/hotpick';

/**
 * 서버/클라이언트 환경 구분 유틸리티
 */
const isServer = () => typeof window === 'undefined';

/**
 * Display Query Keys
 */
export const displayKeys = {
  all: ['display'] as const,
  main: (params?: { size?: number; cursor?: number; sort?: 'latest' | 'popular' }) =>
    [...displayKeys.all, 'main', params] as const,
  mainInfinite: (params?: {
    size?: number;
    sort?: 'latest' | 'popular';
    categoryCodes?: CategoryCode[];
    type?: HotpickType;
  }) => [...displayKeys.all, 'mainInfinite', params] as const,
  hotpick: (alias: string) => [...displayKeys.all, 'hotpick', alias] as const,
  result: (id: string) => [...displayKeys.all, 'result', id] as const,
  navigation: (alias: string, sort?: string) =>
    [...displayKeys.all, 'navigation', alias, sort] as const,
};

/**
 * Query Options (서버 pre-fetch + 클라이언트 사용)
 */
export const displayQueries = {
  /**
   * 메인 전시 쿼리 옵션
   */
  main: (params?: { size?: number; cursor?: number; sort?: 'latest' | 'popular' }) =>
    queryOptions<DisplayMainResponse | null>({
      queryKey: displayKeys.main(params),
      queryFn: async () => {
        if (isServer()) {
          const response = await serverApi.getMainDisplay(params, { next: { revalidate: 60 } });
          return response.status === 200 ? (response.data.data ?? null) : null;
        }
        return clientApi.getMainDisplay(params);
      },
      staleTime: 60 * 1000,
    }),

  /**
   * 핫픽 상세 쿼리 옵션
   */
  hotpick: (hotpickAlias: string) =>
    queryOptions<DisplayTrendDetailResponse | null>({
      queryKey: displayKeys.hotpick(hotpickAlias),
      queryFn: async () => {
        if (isServer()) {
          const response = await serverApi.getTrendDetail(hotpickAlias, {
            next: { revalidate: 60 },
          });
          return response.status === 200 ? (response.data.data ?? null) : null;
        }
        return clientApi.getTrendDetail(hotpickAlias);
      },
      staleTime: 60 * 1000,
    }),

  /**
   * 결과 상세 쿼리 옵션
   */
  result: (resultId: string) =>
    queryOptions<DisplayResultResponse | null>({
      queryKey: displayKeys.result(resultId),
      queryFn: async () => {
        if (isServer()) {
          const response = await serverApi.getResultDetail(resultId, {
            next: { revalidate: 3600 },
          });
          return response.status === 200 ? (response.data.data ?? null) : null;
        }
        return clientApi.getResultDetail(resultId);
      },
      staleTime: 60 * 60 * 1000,
    }),

  /**
   * 메인 전시 무한 스크롤 쿼리 옵션
   */
  infiniteMain: (params?: {
    size?: number;
    sort?: 'latest' | 'popular';
    categoryCodes?: CategoryCode[];
    type?: HotpickType;
  }) =>
    infiniteQueryOptions<
      DisplayMainResponse | null,
      Error,
      InfiniteData<DisplayMainResponse | null>,
      ReturnType<typeof displayKeys.mainInfinite>,
      number | undefined
    >({
      queryKey: displayKeys.mainInfinite(params),
      queryFn: async ({ pageParam }) => {
        const queryParams = { ...params, cursor: pageParam, size: params?.size ?? 20 };
        if (isServer()) {
          const response = await serverApi.getMainDisplay(queryParams, {
            next: { revalidate: 60 },
          });
          return response.status === 200 ? (response.data.data ?? null) : null;
        }
        return clientApi.getMainDisplay(queryParams);
      },
      initialPageParam: undefined,
      getNextPageParam: (lastPage) => (lastPage?.hasMore ? lastPage.nextCursor : undefined),
      staleTime: 60 * 1000,
    }),
};

/**
 * 메인 전시 Hook
 */
export const useMainDisplay = (params?: {
  size?: number;
  cursor?: number;
  sort?: 'latest' | 'popular';
}) => useQuery(displayQueries.main(params));

/**
 * 메인 전시 무한 스크롤 Hook
 */
export const useInfiniteMainDisplay = (params?: {
  size?: number;
  sort?: 'latest' | 'popular';
  categoryCodes?: CategoryCode[];
  type?: HotpickType;
  initialData?: DisplayMainResponse;
}) => {
  const { initialData: initData, ...queryParams } = params ?? {};

  return useInfiniteQuery({
    ...displayQueries.infiniteMain(queryParams),
    initialData: initData
      ? {
          pages: [initData],
          pageParams: [undefined],
        }
      : undefined,
  });
};

/**
 * 핫픽 상세 Hook
 */
export const useHotpickDetail = (hotpickAlias: string) =>
  useQuery({ ...displayQueries.hotpick(hotpickAlias), enabled: !!hotpickAlias });

/**
 * 결과 상세 Hook
 */
export const useResultDetail = (resultId: string) =>
  useQuery({ ...displayQueries.result(resultId), enabled: !!resultId });

/**
 * 핫픽 네비게이션 Hook
 */
export const useHotpickNavigation = (hotpickAlias: string, sort?: 'latest' | 'popular') =>
  useQuery({
    queryKey: displayKeys.navigation(hotpickAlias, sort),
    queryFn: () => clientApi.getTrendNavigation(hotpickAlias, { sort }),
    enabled: !!hotpickAlias,
    staleTime: 60 * 1000,
  });
