/**
 * Comment API hooks — 스텁 처리
 *
 * Comment API가 새 swagger에서 제거됨 (need-api.md 참고).
 * BE에서 댓글 API 제공 시 복구 예정.
 */

import { queryOptions, useQuery, useInfiniteQuery, useMutation } from '@tanstack/react-query';

import type { CommentItem, CommentVerifyResponse } from '@/types/comment';

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
  count: (hotpickId: number, electionId: string) =>
    queryOptions<{ count: number }>({
      queryKey: commentKeys.count(hotpickId, electionId),
      queryFn: () => Promise.resolve({ count: 0 }),
      staleTime: 30 * 1000,
    }),
};

/**
 * 댓글 개수 조회 Hook (스텁 — 0 반환)
 */
export const useCommentCount = (hotpickId: number, electionId: string) =>
  useQuery(commentQueries.count(hotpickId, electionId));

/**
 * 댓글 목록 무한 스크롤 Hook (스텁)
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
    queryFn: () =>
      Promise.resolve({ comments: [] as CommentItem[], nextId: undefined, totalSize: 0 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: () => undefined,
    staleTime: 30 * 1000,
  });

/**
 * 댓글 작성 Hook (스텁 — no-op)
 */
export const useCreateComment = () =>
  useMutation({
    mutationFn: async (_data: {
      trendId: number;
      itemId: string;
      nickname: string;
      password: string;
      content: string;
    }) => ({ id: '' }),
  });

/**
 * 댓글 수정 Hook (스텁)
 */
export const useUpdateComment = () =>
  useMutation({
    mutationFn: async (_params: {
      commentId: string;
      data: { verifyToken: string; content: string };
      hotpickId: string;
      electionId: string;
    }) => undefined,
  });

/**
 * 댓글 수정 검증 Hook (스텁)
 */
export const useVerifyComment = () =>
  useMutation({
    mutationFn: async (_params: {
      commentId: string;
      data: { password: string };
    }): Promise<CommentVerifyResponse> => ({
      editToken: '',
      expiresIn: 0,
      expiresAt: '',
    }),
  });

/**
 * 댓글 좋아요 Hook (스텁)
 */
export const useLikeComment = () =>
  useMutation({
    mutationFn: async (_params: { commentId: string; tkuId: string }) => undefined,
  });

/**
 * 댓글 좋아요 취소 Hook (스텁)
 */
export const useUnlikeComment = () =>
  useMutation({
    mutationFn: async (_params: { commentId: string; tkuId: string }) => undefined,
  });

/**
 * 댓글 삭제 Hook (스텁)
 */
export const useDeleteComment = () =>
  useMutation({
    mutationFn: async (_params: {
      commentId: string;
      data: { verifyToken: string };
      hotpickId: string;
      electionId: string;
    }) => undefined,
  });
