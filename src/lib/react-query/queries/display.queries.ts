import { queryOptions } from '@tanstack/react-query';

import { queryKeys } from '@/lib/react-query/query-keys';
import { CACHE_TIMES } from '@/services/api/constants/cache';
import { displayApi } from '@/services/api/display';
import { serverDisplayApi } from '@/services/api/server/display';
import type { CommentListResponse } from '@/types/comment';
import type { InviteeResultResponse, ResultDisplayResponse } from '@/types/result';
import type { MainDisplayResponse, TrendDisplayResponse } from '@/types/trend';

/**
 * 서버/클라이언트 환경 구분 유틸리티
 */
const isServer = () => typeof window === 'undefined';

export const displayQueries = {
  /**
   * 메인 전시 쿼리 옵션
   */
  main: (size?: number) =>
    queryOptions<MainDisplayResponse>({
      queryKey: queryKeys.display.main(size),
      queryFn: () =>
        isServer() ? serverDisplayApi.getMainDisplay() : displayApi.getMainDisplay(size),
      staleTime: CACHE_TIMES.DISPLAY.MAIN * 1000,
    }),

  /**
   * Trend 전시 쿼리 옵션
   */
  trend: (trendAlias: string) =>
    queryOptions<TrendDisplayResponse>({
      queryKey: queryKeys.display.trend(trendAlias),
      queryFn: () =>
        isServer()
          ? serverDisplayApi.getTrendDisplay(trendAlias)
          : displayApi.getTrendDisplay(trendAlias),
      staleTime: CACHE_TIMES.DISPLAY.TREND * 1000,
    }),

  /**
   * Result 전시 쿼리 옵션
   */
  result: (resultId: string, compareId?: string) =>
    queryOptions<ResultDisplayResponse>({
      queryKey: queryKeys.display.result(resultId, compareId),
      queryFn: () =>
        isServer()
          ? serverDisplayApi.getResultDisplay({ resultId, compareId })
          : displayApi.getResultDisplay({ resultId, compareId }),
      staleTime: CACHE_TIMES.DISPLAY.RESULT * 1000,
    }),

  /**
   * Result Invitee 쿼리 옵션
   */
  resultInvitee: (resultId: string) =>
    queryOptions<InviteeResultResponse>({
      queryKey: queryKeys.display.resultInvitee(resultId),
      queryFn: () =>
        isServer()
          ? serverDisplayApi.getResultDisplayInvitee(resultId)
          : displayApi.getResultDisplayInvitee(resultId),
      staleTime: CACHE_TIMES.DISPLAY.RESULT_INVITEE * 1000,
    }),

  /**
   * Comments 쿼리 옵션
   * 참고: 서버 prefetch가 필요 없어서 클라이언트 전용
   */
  comments: (params: {
    trendId: string;
    itemId: string;
    sort?: 'latest' | 'popular';
    cursor?: string;
    size?: number;
    tkuId?: string;
  }) =>
    queryOptions<CommentListResponse>({
      queryKey: queryKeys.display.comments(params.trendId, params.itemId, params.sort ?? 'latest'),
      queryFn: () =>
        displayApi.getComments({
          trendId: Number(params.trendId),
          itemId: params.itemId,
          sort: params.sort ?? 'latest',
          cursor: params.cursor,
          size: params.size,
          tkuId: params.tkuId,
        }),
      staleTime: CACHE_TIMES.COMMENT.LIST * 1000,
    }),
} as const;

export type DisplayQueries = typeof displayQueries;
