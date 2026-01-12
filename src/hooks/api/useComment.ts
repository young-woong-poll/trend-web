import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { commentListKeys, commentQueries } from '@/lib/react-query/queries';
import { commentApi } from '@/services/api/comment';
import type {
  CommentItem,
  CreateCommentRequest,
  UpdateCommentRequest,
  VerifyCommentRequest,
  DeleteCommentRequest,
} from '@/types/comment';

/**
 * Comment Query Keys
 * @deprecated commentListKeys를 @/lib/react-query/queries에서 import하세요
 */
export const commentKeys = {
  all: ['comment'] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (trendId: string, itemId: string, sort: string) =>
    [...commentKeys.lists(), trendId, itemId, sort] as const,
};

/**
 * 댓글 작성 Hook
 */
export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentRequest) => commentApi.createComment(data),
    onSuccess: async (responseData, variables) => {
      const { trendId, itemId } = variables;
      const newComment: CommentItem = {
        id: responseData.id,
        nickname: variables.nickname,
        content: variables.content,
        likeCount: 0,
        liked: false,
        createdAt: new Date().toISOString(),
      };

      const latestQueryKey = commentListKeys.list(String(trendId), itemId, 'latest');

      queryClient.setQueryData(latestQueryKey, (old: unknown) => {
        if (!old || typeof old !== 'object') {
          return old;
        }

        const oldData = old as {
          pages: Array<{
            comments: CommentItem[];
            totalSize: number;
            nextId: string | null;
          }>;
          pageParams: unknown[];
        };

        return {
          ...oldData,
          pages: oldData.pages.map((page, index) =>
            index === 0
              ? {
                  ...page,
                  comments: [newComment, ...page.comments],
                  totalSize: page.totalSize + 1,
                }
              : page
          ),
        };
      });

      void queryClient.invalidateQueries({
        queryKey: commentListKeys.list(String(trendId), itemId, 'popular'),
      });

      await queryClient.invalidateQueries({
        queryKey: commentQueries.count(trendId, itemId).queryKey,
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
    mutationFn: ({
      commentId,
      data,
    }: {
      commentId: string;
      data: UpdateCommentRequest;
      trendId: string;
      itemId: string;
    }) => commentApi.updateComment(commentId, data),
    onSuccess: (_, variables) => {
      ['latest', 'popular'].forEach((sort) => {
        const queryKey = commentListKeys.list(String(variables.trendId), variables.itemId, sort);

        queryClient.setQueryData(queryKey, (old: unknown) => {
          if (!old || typeof old !== 'object') {
            return old;
          }

          const oldData = old as {
            pages: Array<{
              comments: CommentItem[];
              totalSize: number;
              nextId: string | null;
            }>;
            pageParams: unknown[];
          };

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              comments: page.comments.map((comment) =>
                comment.id === variables.commentId
                  ? { ...comment, content: variables.data.content }
                  : comment
              ),
            })),
          };
        });
      });
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
      void queryClient.invalidateQueries({ queryKey: commentListKeys.all });
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
      void queryClient.invalidateQueries({ queryKey: commentListKeys.all });
    },
  });
};

/**
 * 댓글 삭제 Hook
 */
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commentId,
      data,
    }: {
      commentId: string;
      data: DeleteCommentRequest;
      trendId: string;
      itemId: string;
    }) => commentApi.deleteComment(commentId, data),
    onSuccess: async (_, variables) => {
      const { trendId, itemId } = variables;
      ['latest', 'popular'].forEach((sort) => {
        const queryKey = commentListKeys.list(trendId, itemId, sort);

        queryClient.setQueryData(queryKey, (old: unknown) => {
          if (!old || typeof old !== 'object') {
            return old;
          }

          const oldData = old as {
            pages: Array<{
              comments: CommentItem[];
              totalSize: number;
              nextId: string | null;
            }>;
            pageParams: unknown[];
          };

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              comments: page.comments.filter((comment) => comment.id !== variables.commentId),
              totalSize: page.totalSize - 1,
            })),
          };
        });
      });

      await queryClient.invalidateQueries({
        queryKey: commentQueries.count(Number(trendId), itemId).queryKey,
      });
    },
  });
};

/**
 * 댓글 개수 조회 Hook
 *
 * @example
 * ```tsx
 * const { data } = useCommentCountQuery('123', 'item1');
 *
 * // 쿼리키 접근
 * queryClient.invalidateQueries({ queryKey: commentQueries.count(123, 'item1').queryKey });
 * ```
 */
export const useCommentCountQuery = (trendId: string, itemId: string, enabled: boolean = true) =>
  useQuery({
    ...commentQueries.count(Number(trendId), itemId),
    enabled,
  });
