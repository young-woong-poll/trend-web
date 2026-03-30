import { useInfiniteQuery } from '@tanstack/react-query';

import { getMyComments, getMyLikes } from '@/generated/api/client/user-controller/user-controller';
import type {
  CursorPageResponseMyCommentResponse,
  CursorPageResponseMyLikeResponse,
} from '@/generated/models';

export const myPageKeys = {
  comments: ['myPage', 'comments'] as const,
  likes: ['myPage', 'likes'] as const,
};

export const useMyComments = () =>
  useInfiniteQuery({
    queryKey: myPageKeys.comments,
    queryFn: async ({ pageParam }) => {
      const res = (await getMyComments({
        cursor: pageParam,
        size: 20,
      })) as CursorPageResponseMyCommentResponse;
      return res;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
  });

export const useLikedHotpicks = () =>
  useInfiniteQuery({
    queryKey: myPageKeys.likes,
    queryFn: async ({ pageParam }) => {
      const res = (await getMyLikes({
        cursor: pageParam,
        size: 20,
      })) as CursorPageResponseMyLikeResponse;
      return res;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
  });
