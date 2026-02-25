import {
  queryOptions,
  infiniteQueryOptions,
  useQuery,
  useInfiniteQuery,
  type InfiniteData,
} from '@tanstack/react-query';

import * as clientApi from '@/generated/api/client/hotpick/hotpick';
import * as serverApi from '@/generated/api/server/hotpick/hotpick';
import type {
  CategoryTabResponse,
  MainHotpickResponse,
  HotpickDetailResponse,
} from '@/generated/models';
import { getTKUID } from '@/lib/tkuid';

/**
 * 서버/클라이언트 환경 구분 유틸리티
 */
const isServer = () => typeof window === 'undefined';

/**
 * Display Query Keys
 */
export const displayKeys = {
  all: ['display'] as const,
  categories: () => [...displayKeys.all, 'categories'] as const,
  main: (params?: { size?: number; cursor?: number }) =>
    [...displayKeys.all, 'main', params] as const,
  mainInfinite: (params?: { size?: number; category?: string }) =>
    [...displayKeys.all, 'mainInfinite', params] as const,
  hotpick: (slug: string) => [...displayKeys.all, 'hotpick', slug] as const,
  result: (id: string) => [...displayKeys.all, 'result', id] as const,
};

/**
 * Query Options (서버 pre-fetch + 클라이언트 사용)
 */
export const displayQueries = {
  /**
   * 카테고리 탭 목록 쿼리 옵션
   */
  categories: () =>
    queryOptions<CategoryTabResponse[] | null>({
      queryKey: displayKeys.categories(),
      queryFn: async () => {
        if (isServer()) {
          const response = await serverApi.getCategories1(undefined, {
            next: { revalidate: 300 },
          });
          return response.status === 200 ? (response.data.data ?? null) : null;
        }
        return clientApi.getCategories1();
      },
      staleTime: 5 * 60 * 1000,
    }),

  /**
   * 메인 전시 쿼리 옵션
   */
  main: (params?: { size?: number; cursor?: number }) =>
    queryOptions<MainHotpickResponse | null>({
      queryKey: displayKeys.main(params),
      queryFn: async () => {
        if (isServer()) {
          const response = await serverApi.getMain(params, { next: { revalidate: 60 } });
          return response.status === 200 ? (response.data.data ?? null) : null;
        }
        return clientApi.getMain(params);
      },
      staleTime: 60 * 1000,
    }),

  /**
   * 핫픽 상세 쿼리 옵션
   */
  hotpick: (slug: string) =>
    queryOptions<HotpickDetailResponse | null>({
      queryKey: displayKeys.hotpick(slug),
      queryFn: async () => {
        if (isServer()) {
          const response = await serverApi.getDetail(slug, {
            next: { revalidate: 60 },
          });
          return response.status === 200 ? (response.data.data ?? null) : null;
        }
        return clientApi.getDetail(slug);
      },
      staleTime: 60 * 1000,
    }),

  /**
   * 결과 상세 쿼리 옵션 (BUNDLE 전용 — 현재 스텁)
   */
  result: (resultId: string) =>
    queryOptions<null>({
      queryKey: displayKeys.result(resultId),
      queryFn: () => null,
      staleTime: 60 * 60 * 1000,
    }),

  /**
   * 메인 전시 무한 스크롤 쿼리 옵션
   */
  infiniteMain: (params?: { size?: number; category?: string }) =>
    infiniteQueryOptions<
      MainHotpickResponse | null,
      Error,
      InfiniteData<MainHotpickResponse | null>,
      ReturnType<typeof displayKeys.mainInfinite>,
      number | undefined
    >({
      queryKey: displayKeys.mainInfinite(params),
      queryFn: async ({ pageParam }) => {
        const queryParams = {
          category: params?.category,
          cursor: pageParam,
          size: params?.size ?? 20,
        };
        if (isServer()) {
          const response = await serverApi.getMain(queryParams, {
            next: { revalidate: 60 },
          });
          return response.status === 200 ? (response.data.data ?? null) : null;
        }
        const tkuId = getTKUID();
        return clientApi.getMain(queryParams, {
          headers: tkuId ? { 'x-tku-id': tkuId } : undefined,
        });
      },
      initialPageParam: undefined,
      getNextPageParam: (lastPage) => (lastPage?.hasMore ? lastPage.nextCursor : undefined),
      staleTime: 60 * 1000,
    }),
};

/**
 * 카테고리 탭 목록 Hook
 */
export const useCategories = () => useQuery(displayQueries.categories());

/**
 * 메인 전시 Hook
 */
export const useMainDisplay = (params?: { size?: number; cursor?: number }) =>
  useQuery(displayQueries.main(params));

/**
 * 메인 전시 무한 스크롤 Hook
 */
export const useInfiniteMainDisplay = (params?: {
  size?: number;
  category?: string;
  initialData?: MainHotpickResponse;
}) => {
  const { initialData: initData, ...queryKeyParams } = params ?? {};

  const baseOptions = displayQueries.infiniteMain(queryKeyParams);

  return useInfiniteQuery({
    ...baseOptions,
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
export const useHotpickDetail = (slug: string) =>
  useQuery({ ...displayQueries.hotpick(slug), enabled: !!slug });

/**
 * 결과 상세 Hook (BUNDLE 전용 — 스텁)
 */
export const useResultDetail = (resultId: string) =>
  useQuery({ ...displayQueries.result(resultId), enabled: !!resultId });
