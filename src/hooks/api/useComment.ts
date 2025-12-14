import { useMutation, useQueryClient } from '@tanstack/react-query';

import { commentApi } from '@/services/api/comment';
import type {
  CreateCommentRequest,
  UpdateCommentRequest,
  VerifyCommentRequest,
} from '@/types/comment';

/**
 * Comment Query Keys
 */
export const commentKeys = {
  all: ['comment'] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (trendId: number, itemId: string, sort: string) =>
    [...commentKeys.lists(), trendId, itemId, sort] as const,
};

/**
 * 댓글 작성 Hook
 */
export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentRequest) => commentApi.createComment(data),
    onSuccess: (_, variables) => {
      // 댓글 목록 쿼리 무효화
      void queryClient.invalidateQueries({
        queryKey: commentKeys.list(variables.trendId, variables.itemId, 'latest'),
      });
    },
  });
};

/**
 * 댓글 수정 Hook
 */
export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, data }: { commentId: string; data: UpdateCommentRequest }) =>
      commentApi.updateComment(commentId, data),
    onSuccess: () => {
      // 모든 댓글 목록 쿼리 무효화
      void queryClient.invalidateQueries({ queryKey: commentKeys.lists() });
    },
  });
};

/**
 * 댓글 수정 검증 Hook
 */
export const useVerifyComment = () =>
  useMutation({
    mutationFn: ({ commentId, data }: { commentId: string; data: VerifyCommentRequest }) =>
      commentApi.verifyComment(commentId, data),
  });

/**
 * 댓글 좋아요 Hook
 */
export const useLikeComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, tkuId }: { commentId: string; tkuId: string }) =>
      commentApi.likeComment(commentId, tkuId),
    onSuccess: () => {
      // 모든 댓글 목록 쿼리 무효화
      void queryClient.invalidateQueries({ queryKey: commentKeys.lists() });
    },
  });
};

/**
 * 댓글 좋아요 취소 Hook
 */
export const useUnlikeComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, tkuId }: { commentId: string; tkuId: string }) =>
      commentApi.unlikeComment(commentId, tkuId),
    onSuccess: () => {
      // 모든 댓글 목록 쿼리 무효화
      void queryClient.invalidateQueries({ queryKey: commentKeys.lists() });
    },
  });
};
