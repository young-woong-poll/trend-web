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
import { getTKUID } from '@/lib/tkuid';
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
    anchor?: string;
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
   *
   * anchor가 있으면 해당 아이템 주변 데이터를 로드하고
   * 양방향 스크롤(getPreviousPageParam)을 활성화합니다.
   */
  infiniteMain: (params?: {
    size?: number;
    sort?: 'latest' | 'popular';
    categoryCodes?: CategoryCode[];
    type?: HotpickType;
    anchor?: string;
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
        // pageParam이 음수이면 이전 페이지 요청 (prevCursor는 음수로 인코딩)
        const isPrev = pageParam !== undefined && pageParam < 0;
        const queryParams: Record<string, unknown> = {
          ...params,
          cursor: isPrev ? Math.abs(pageParam) : pageParam,
          size: params?.size ?? 20,
        };
        // anchor 파라미터 전달 (첫 로딩 시에만)
        if (params?.anchor && pageParam === undefined) {
          queryParams.anchor = params.anchor;
        }
        if (isPrev) {
          queryParams.direction = 'prev';
        }
        if (isServer()) {
          const response = await serverApi.getMainDisplay(queryParams, {
            next: { revalidate: 60 },
          });
          return response.status === 200 ? (response.data.data ?? null) : null;
        }
        const tkuId = getTKUID();
        return clientApi.getMainDisplay(queryParams, {
          headers: tkuId ? { 'x-tku-id': tkuId } : undefined,
        });
      },
      initialPageParam: undefined,
      getNextPageParam: (lastPage) => (lastPage?.hasMore ? lastPage.nextCursor : undefined),
      getPreviousPageParam: (firstPage) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prevCursor = (firstPage as any)?.prevCursor as number | undefined;
        // 음수로 인코딩하여 queryFn에서 direction=prev 판별
        return prevCursor !== undefined ? -prevCursor : undefined;
      },
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
 *
 * anchor는 queryKey에 포함하지 않고 queryFn에서만 사용합니다.
 * 이렇게 하면 anchor 소비 후 URL hash를 제거해도 queryKey가 변경되지 않아
 * 데이터 리페치 및 스크롤 리셋이 발생하지 않습니다.
 */
export const useInfiniteMainDisplay = (params?: {
  size?: number;
  sort?: 'latest' | 'popular';
  categoryCodes?: CategoryCode[];
  type?: HotpickType;
  anchor?: string;
  initialData?: DisplayMainResponse;
}) => {
  const { initialData: initData, anchor, ...queryKeyParams } = params ?? {};

  // queryKey에는 anchor 제외
  const baseOptions = displayQueries.infiniteMain(queryKeyParams);

  return useInfiniteQuery({
    ...baseOptions,
    queryFn: async ({ pageParam }) => {
      const isPrev = pageParam !== undefined && pageParam < 0;
      const queryParams: Record<string, unknown> = {
        ...queryKeyParams,
        cursor: isPrev ? Math.abs(pageParam) : pageParam,
        size: queryKeyParams.size ?? 20,
      };
      // anchor는 첫 로딩 시에만 전달 (pageParam이 undefined = 최초 요청)
      if (anchor && pageParam === undefined) {
        queryParams.anchor = anchor;
      }
      if (isPrev) {
        queryParams.direction = 'prev';
      }
      if (isServer()) {
        const response = await serverApi.getMainDisplay(queryParams, {
          next: { revalidate: 60 },
        });
        return response.status === 200 ? (response.data.data ?? null) : null;
      }
      const tkuId = getTKUID();
      return clientApi.getMainDisplay(queryParams, {
        headers: tkuId ? { 'x-tku-id': tkuId } : undefined,
      });
    },
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
