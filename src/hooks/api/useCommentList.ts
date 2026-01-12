import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

import { commentListKeys, commentQueries } from '@/lib/react-query/queries';
import { getTKUID } from '@/lib/tkuid';

// commentListKeys를 @/lib/react-query/queries에서 re-export
export { commentListKeys };

/**
 * 댓글 무한 스크롤 목록 조회 Hook
 *
 * @example
 * ```tsx
 * const { data, fetchNextPage, hasNextPage } = useInfiniteCommentList('123', 'item1', 'latest');
 *
 * // 쿼리키 접근
 * queryClient.invalidateQueries({
 *   queryKey: commentQueries.infiniteList({ trendId: '123', itemId: 'item1', sort: 'latest' }).queryKey
 * });
 * ```
 */
export const useInfiniteCommentList = (
  trendId: string,
  itemId: string,
  sort: 'latest' | 'popular' = 'latest',
  enabled: boolean = true
) => {
  const tkuId = getTKUID();

  return useInfiniteQuery({
    ...commentQueries.infiniteList({ trendId, itemId, sort, size: 20, tkuId }),
    placeholderData: keepPreviousData,
    enabled,
    gcTime: 1000 * 60 * 5,
  });
};
