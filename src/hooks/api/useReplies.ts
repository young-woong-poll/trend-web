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
      void queryClient.invalidateQueries({ queryKey: replyKeys.list(variables.commentId) });
      // 부모 댓글 목록의 replyCount 갱신을 위해 lists 전체 invalidate
      void queryClient.invalidateQueries({ queryKey: commentKeys.lists() });
    },
  });
};
