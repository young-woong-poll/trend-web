import { useInfiniteQuery } from '@tanstack/react-query';

import axiosInstance from '@/lib/axios';

interface MyCommentItem {
  hotpickSlug: string;
  hotpickTitle: string;
  content: string;
  createdAt: string;
}

interface LikedHotpickItem {
  hotpickId: number;
  hotpickAlias: string;
  hotpickTitle: string;
  optionSummary: string;
  likedAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; totalPages: number };
}

export const myPageKeys = {
  comments: ['myPage', 'comments'] as const,
  likes: ['myPage', 'likes'] as const,
};

export const useMyComments = () =>
  useInfiniteQuery({
    queryKey: myPageKeys.comments,
    queryFn: async ({ pageParam = 1 }) => {
      const res = await axiosInstance.get<PaginatedResponse<MyCommentItem>>(
        '/api/users/me/comments',
        { params: { page: pageParam, size: 20 } }
      );
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
  });

export const useLikedHotpicks = () =>
  useInfiniteQuery({
    queryKey: myPageKeys.likes,
    queryFn: async ({ pageParam = 1 }) => {
      const res = await axiosInstance.get<PaginatedResponse<LikedHotpickItem>>(
        '/api/users/me/likes',
        { params: { page: pageParam, size: 20 } }
      );
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
  });
