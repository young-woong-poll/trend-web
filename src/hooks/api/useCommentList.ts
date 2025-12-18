import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

import { getTKUID } from '@/lib/tkuid';
import { displayApi } from '@/services/api/display';
import type { CommentListResponse } from '@/types/comment';

export const commentListKeys = {
  all: ['commentList'] as const,
  list: (trendId: string, itemId: string, sort: string) =>
    [...commentListKeys.all, trendId, itemId, sort] as const,
};

export const useInfiniteCommentList = (
  trendId: string,
  itemId: string,
  sort: 'latest' | 'popular' = 'latest',
  enabled: boolean = true
) => {
  const tkuId = getTKUID();

  return useInfiniteQuery<CommentListResponse, Error>({
    queryKey: commentListKeys.list(trendId, itemId, sort),
    queryFn: async ({ pageParam }) =>
      displayApi.getComments({
        trendId,
        itemId,
        sort,
        cursor: pageParam as string | undefined,
        size: 20, // 20개씩 로드
        tkuId,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextId ?? undefined,
    placeholderData: keepPreviousData, // 정렬 변경 시 이전 데이터 유지
    enabled,
    staleTime: 1000 * 60, // 1분
    gcTime: 1000 * 60 * 5, // 5분 (구 cacheTime)
  });
};
