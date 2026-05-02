/**
 * 대댓글 API 훅
 *
 * - 목록: cursor 무한 스크롤 (commentId 기준)
 * - 작성: 성공 시 부모 댓글의 replyCount, 부모 목록 캐시 무효화
 */

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { createReply, getReplies } from '@/generated/api/client/comment/comment';
import type { CommentListResponse } from '@/generated/models';
import { commentKeys } from '@/hooks/api/useComment';
import { getTKUID } from '@/lib/tkuid';

export const replyKeys = {
  all: ['replies'] as const,
  list: (commentId: string) => [...replyKeys.all, 'list', commentId] as const,
};

export const useInfiniteReplies = (params: {
  commentId: string;
  size?: number;
  enabled?: boolean;
  isLoggedIn?: boolean;
}) =>
  useInfiniteQuery({
    queryKey: replyKeys.list(params.commentId),
    queryFn: async ({ pageParam }) => {
      const tkuId =
        typeof window !== 'undefined' ? getTKUID({ isLoggedIn: params.isLoggedIn }) : '';
      const result = await getReplies(
        params.commentId,
        { cursor: pageParam, size: params.size ?? 20 },
        { headers: tkuId ? { 'x-tku-id': tkuId } : undefined }
      );
      return result as CommentListResponse;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    enabled: params.enabled ?? true,
    staleTime: 30 * 1000,
  });

export const useCreateReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      commentId: string;
      nickname?: string;
      password?: string;
      content: string;
      isLoggedIn?: boolean;
    }) => {
      const tkuId = typeof window !== 'undefined' ? getTKUID({ isLoggedIn: data.isLoggedIn }) : '';
      const body: Record<string, string> = { content: data.content };
      if (data.nickname) {
        body.nickname = data.nickname;
      }
      if (data.password) {
        body.password = data.password;
      }
      return createReply(data.commentId, body as never, {
        headers: tkuId ? { 'x-tku-id': tkuId } : undefined,
      });
    },
    onSuccess: (_data, variables) => {
      // 답글 목록 invalidate
      void queryClient.invalidateQueries({ queryKey: replyKeys.list(variables.commentId) });

      // 부모 댓글의 replyCount를 모든 sort 캐시에서 +1 (낙관적 패치)
      const lists = queryClient.getQueriesData<{ pages: CommentListResponse[] }>({
        queryKey: commentKeys.lists(),
      });

      lists.forEach(([key, oldData]) => {
        if (!oldData) {
          return;
        }
        queryClient.setQueryData(key, {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            comments: (page.comments ?? []).map((c) =>
              c.id === variables.commentId ? { ...c, replyCount: (c.replyCount ?? 0) + 1 } : c
            ),
          })),
        });
      });
    },
  });
};
