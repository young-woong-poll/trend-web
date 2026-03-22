import { useInfiniteQuery } from '@tanstack/react-query';

import axiosInstance from '@/lib/axios';

interface MyVoteItem {
  hotpickSlug: string;
  hotpickTitle: string;
  selectedOption: string;
  votedAt: string;
}

interface MyCommentItem {
  hotpickSlug: string;
  hotpickTitle: string;
  content: string;
  createdAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; totalPages: number };
}

export const myPageKeys = {
  votes: ['myPage', 'votes'] as const,
  comments: ['myPage', 'comments'] as const,
};

export const useMyVotes = () =>
  useInfiniteQuery({
    queryKey: myPageKeys.votes,
    queryFn: async ({ pageParam = 1 }) => {
      const res = await axiosInstance.get('/api/users/me/votes', {
        params: { page: pageParam, size: 20 },
      });
      return res as unknown as PaginatedResponse<MyVoteItem>;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
  });

export const useMyComments = () =>
  useInfiniteQuery({
    queryKey: myPageKeys.comments,
    queryFn: async ({ pageParam = 1 }) => {
      const res = await axiosInstance.get('/api/users/me/comments', {
        params: { page: pageParam, size: 20 },
      });
      return res as unknown as PaginatedResponse<MyCommentItem>;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
  });
