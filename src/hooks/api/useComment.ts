import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { commentListKeys } from '@/hooks/api/useCommentList';
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
 * @deprecated commentListKeys를 사용하세요
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
      // 서버 응답(id만 있음)과 요청 데이터를 조합하여 완전한 CommentItem 생성
      const newComment: CommentItem = {
        id: responseData.id,
        nickname: variables.nickname,
        content: variables.content,
        likeCount: 0, // 새 댓글은 좋아요 0개
        liked: false, // 새 댓글은 좋아요 안 한 상태
        createdAt: new Date().toISOString(), // 현재 시간
      };

      // 최신순: 캐시를 직접 업데이트 (즉시 반영, 로딩 없음)
      const latestQueryKey = commentListKeys.list(trendId, itemId, 'latest');

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

      // 인기순: 무효화하여 서버에서 다시 계산된 순서로 불러옴
      void queryClient.invalidateQueries({
        queryKey: commentListKeys.list(trendId, itemId, 'popular'),
      });

      await queryClient.invalidateQueries({
        queryKey: ['commentCount', trendId, itemId],
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
      // 최신순과 인기순 모두 캐시 직접 업데이트 (즉시 반영)
      ['latest', 'popular'].forEach((sort) => {
        const queryKey = commentListKeys.list(variables.trendId, variables.itemId, sort);

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
      // 모든 댓글 목록 쿼리 무효화
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
      // 모든 댓글 목록 쿼리 무효화
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
      // 최신순과 인기순 모두 캐시에서 삭제된 댓글 제거 (즉시 반영)
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
        queryKey: ['commentCount', trendId, itemId],
      });
    },
  });
};

/**
 * 댓글 개수 조회 Hook
 */
export const useCommentCountQuery = (trendId: string, itemId: string, enabled: boolean = true) =>
  useQuery({
    queryKey: ['commentCount', trendId, itemId],
    queryFn: () => commentApi.countComments(trendId, itemId),
    enabled,
    staleTime: 1000 * 60, // 1분
  });
