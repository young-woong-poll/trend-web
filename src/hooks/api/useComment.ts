import {
  useMutation,
  useQuery,
  useInfiniteQuery,
  useQueryClient,
  queryOptions,
} from '@tanstack/react-query';

import {
  createComment,
  updateComment,
  verifyComment,
  deleteComment,
  likeComment,
  unlikeComment,
  countComments,
} from '@/generated/api/client/comment/comment';
import { getComments } from '@/generated/api/client/display/display';
import type {
  CommentCountResponse,
  CommentItem,
  CommentListResponse,
  CreateCommentRequest,
  UpdateCommentRequest,
  VerifyCommentRequest,
  DeleteCommentRequest,
} from '@/generated/models';

/**
 * Comment Query Keys
 */
export const commentKeys = {
  all: ['comment'] as const,
  count: (hotpickId: number, electionId: string) =>
    [...commentKeys.all, 'count', hotpickId, electionId] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (hotpickId: string, electionId: string, sort: string) =>
    [...commentKeys.lists(), hotpickId, electionId, sort] as const,
};

/**
 * Comment Query Options (서버 pre-fetch용)
 */
export const commentQueries = {
  /**
   * 댓글 개수 쿼리 옵션
   */
  count: (hotpickId: number, electionId: string) =>
    queryOptions<CommentCountResponse>({
      queryKey: commentKeys.count(hotpickId, electionId),
      queryFn: () => countComments(hotpickId, electionId),
      staleTime: 30 * 1000,
    }),
};

/**
 * 댓글 개수 조회 Hook
 */
export const useCommentCount = (hotpickId: number, electionId: string) =>
  useQuery(commentQueries.count(hotpickId, electionId));

/**
 * 댓글 목록 무한 스크롤 Hook
 */
export const useInfiniteComments = (params: {
  hotpickId: string;
  electionId: string;
  sort?: 'latest' | 'popular';
  size?: number;
  tkuId?: string;
}) =>
  useInfiniteQuery({
    queryKey: commentKeys.list(params.hotpickId, params.electionId, params.sort ?? 'latest'),
    queryFn: ({ pageParam }) =>
      getComments(
        Number(params.hotpickId),
        params.electionId,
        { sort: params.sort, cursor: pageParam, size: params.size ?? 20 },
        params.tkuId ? { headers: { 'x-tku-id': params.tkuId } } : undefined
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage?.nextId ?? undefined,
    staleTime: 30 * 1000,
  });

/**
 * 댓글 작성 Hook
 */
export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentRequest) => createComment(data),
    onSuccess: async (responseData, variables) => {
      // NOTE: trendId/itemId are generated model field names (will be renamed after BE migration)
      const hotpickId = variables.trendId;
      const electionId = variables.itemId;
      const newComment: CommentItem = {
        id: responseData?.id,
        nickname: variables.nickname,
        content: variables.content,
        likeCount: 0,
        liked: false,
        createdAt: new Date().toISOString(),
      };

      const latestQueryKey = commentKeys.list(String(hotpickId), electionId, 'latest');

      queryClient.setQueryData(latestQueryKey, (old: unknown) => {
        if (!old || typeof old !== 'object') {
          return old;
        }

        const oldData = old as {
          pages: Array<CommentListResponse>;
          pageParams: unknown[];
        };

        return {
          ...oldData,
          pages: oldData.pages.map((page, index) =>
            index === 0
              ? {
                  ...page,
                  comments: [newComment, ...(page.comments ?? [])],
                  totalSize: (page.totalSize ?? 0) + 1,
                }
              : page
          ),
        };
      });

      void queryClient.invalidateQueries({
        queryKey: commentKeys.list(String(hotpickId), electionId, 'popular'),
      });

      await queryClient.invalidateQueries({
        queryKey: commentKeys.count(hotpickId, electionId),
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
      hotpickId: string;
      electionId: string;
    }) => updateComment(commentId, data),
    onSuccess: (_, variables) => {
      ['latest', 'popular'].forEach((sort) => {
        const queryKey = commentKeys.list(String(variables.hotpickId), variables.electionId, sort);

        queryClient.setQueryData(queryKey, (old: unknown) => {
          if (!old || typeof old !== 'object') {
            return old;
          }

          const oldData = old as {
            pages: Array<CommentListResponse>;
            pageParams: unknown[];
          };

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              comments: (page.comments ?? []).map((comment) =>
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
      verifyComment(commentId, data),
  });

/**
 * 댓글 좋아요 Hook
 */
export const useLikeComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, tkuId }: { commentId: string; tkuId: string }) =>
      likeComment(commentId, { headers: { 'x-tku-id': tkuId } }),
    onSuccess: () => {
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
      unlikeComment(commentId, { headers: { 'x-tku-id': tkuId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commentKeys.lists() });
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
      hotpickId: string;
      electionId: string;
    }) => deleteComment(commentId, data),
    onSuccess: async (_, variables) => {
      const { hotpickId, electionId } = variables;
      ['latest', 'popular'].forEach((sort) => {
        const queryKey = commentKeys.list(hotpickId, electionId, sort);

        queryClient.setQueryData(queryKey, (old: unknown) => {
          if (!old || typeof old !== 'object') {
            return old;
          }

          const oldData = old as {
            pages: Array<CommentListResponse>;
            pageParams: unknown[];
          };

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              comments: (page.comments ?? []).filter(
                (comment) => comment.id !== variables.commentId
              ),
              totalSize: (page.totalSize ?? 1) - 1,
            })),
          };
        });
      });

      await queryClient.invalidateQueries({
        queryKey: commentKeys.count(Number(hotpickId), electionId),
      });
    },
  });
};
