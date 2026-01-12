import { queryOptions, infiniteQueryOptions } from '@tanstack/react-query';

import { queryKeys } from '@/lib/react-query/query-keys';
import { CACHE_TIMES } from '@/services/api/constants/cache';
import { commentApi } from '@/services/api/comment';
import { displayApi } from '@/services/api/display';
import type { CommentCountResponse, CommentListResponse } from '@/types/comment';

/**
 * Comment Query Keys (commentList용)
 */
export const commentListKeys = {
  all: ['commentList'] as const,
  list: (trendId: string, itemId: string, sort: string) =>
    [...commentListKeys.all, trendId, itemId, sort] as const,
};

/**
 * Comment Query Options Factory
 *
 * 사용법:
 * - 클라이언트: useQuery(commentQueries.count('trendId', 'itemId'))
 * - 무한 스크롤: useInfiniteQuery(commentQueries.infiniteList(...))
 * - 쿼리키 접근: commentQueries.count('trendId', 'itemId').queryKey
 */
export const commentQueries = {
  /**
   * 댓글 개수 조회 쿼리 옵션
   */
  count: (trendId: number, itemId: string) =>
    queryOptions<CommentCountResponse>({
      queryKey: queryKeys.comment.count(trendId, itemId),
      queryFn: () => commentApi.countComments(trendId, itemId),
      staleTime: CACHE_TIMES.COMMENT.COUNT * 1000,
    }),

  /**
   * 댓글 무한 스크롤 목록 쿼리 옵션
   */
  infiniteList: (params: {
    trendId: string;
    itemId: string;
    sort?: 'latest' | 'popular';
    size?: number;
    tkuId?: string;
  }) =>
    infiniteQueryOptions<CommentListResponse>({
      queryKey: commentListKeys.list(params.trendId, params.itemId, params.sort ?? 'latest'),
      queryFn: async ({ pageParam }) =>
        displayApi.getComments({
          trendId: Number(params.trendId),
          itemId: params.itemId,
          sort: params.sort ?? 'latest',
          cursor: pageParam as string | undefined,
          size: params.size ?? 20,
          tkuId: params.tkuId,
        }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextId ?? undefined,
      staleTime: CACHE_TIMES.COMMENT.LIST * 1000,
    }),
} as const;

export type CommentQueries = typeof commentQueries;
