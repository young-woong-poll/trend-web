/**
 * Comment API hooks
 *
 * 새 Comment API (swagger 2차) 기반 실제 API 호출.
 * - 목록/생성/카운트: slug + electionId 기반
 * - 수정/삭제/검증: commentId 기반
 */

import {
  queryOptions,
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  verifyComment,
  countComments,
  getCommentDetail,
} from '@/generated/api/client/comment/comment';
import type {
  BaseResponseCommentDetailResponse,
  CommentDetailResponse,
  CommentItem,
  CommentListResponse,
  CommentVerifyResponse,
  CommentCountResponse,
} from '@/generated/models';
import { getTKUID } from '@/lib/tkuid';

/**
 * Comment Query Keys
 */
export const commentKeys = {
  all: ['comment'] as const,
  count: (slug: string, electionId: string) =>
    [...commentKeys.all, 'count', slug, electionId] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (slug: string, electionId: string, sort: string) =>
    [...commentKeys.lists(), slug, electionId, sort] as const,
  detail: (commentId: string) => [...commentKeys.all, 'detail', commentId] as const,
};

/**
 * Comment Query Options (서버 pre-fetch용)
 */
export const commentQueries = {
  count: (slug: string, electionId: string, options?: { isLoggedIn?: boolean }) =>
    queryOptions<CommentCountResponse>({
      queryKey: commentKeys.count(slug, electionId),
      queryFn: () => {
        const tkuId =
          typeof window !== 'undefined' ? getTKUID({ isLoggedIn: options?.isLoggedIn }) : '';
        return countComments(slug, Number(electionId), {
          headers: { 'x-tku-id': tkuId },
        }) as Promise<CommentCountResponse>;
      },
      staleTime: 30 * 1000,
    }),
};

/**
 * 댓글 개수 조회 Hook
 */
export const useCommentCount = (slug: string, electionId: string) =>
  useQuery(commentQueries.count(slug, electionId));

/**
 * 댓글 목록 무한 스크롤 Hook
 */
export const useInfiniteComments = (params: {
  slug: string;
  electionId: string;
  sort?: 'latest' | 'popular';
  size?: number;
  tkuId?: string;
}) =>
  useInfiniteQuery({
    queryKey: commentKeys.list(params.slug, params.electionId, params.sort ?? 'latest'),
    queryFn: async ({ pageParam }) => {
      const result = await getComments(
        params.slug,
        Number(params.electionId),
        {
          sort: params.sort,
          cursor: pageParam,
          size: params.size ?? 20,
        },
        {
          headers: params.tkuId ? { 'x-tku-id': params.tkuId } : undefined,
        }
      );
      return result as CommentListResponse;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    staleTime: 30 * 1000,
  });

/**
 * 댓글 작성 Hook
 */
export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      slug: string;
      electionId: string;
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

      const result = await createComment(data.slug, Number(data.electionId), body as any, {
        headers: tkuId ? { 'x-tku-id': tkuId } : undefined,
      });
      return result;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: commentKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: commentKeys.count(variables.slug, variables.electionId),
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
    mutationFn: async (params: {
      commentId: string;
      data: { verifyToken: string; content: string };
      slug: string;
      electionId: string;
    }) => {
      const result = await updateComment(params.commentId, {
        verifyToken: params.data.verifyToken,
        content: params.data.content,
      });
      return result;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: commentKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: ['replies'] });
      void queryClient.invalidateQueries({
        queryKey: commentKeys.count(variables.slug, variables.electionId),
      });
    },
  });
};

/**
 * 댓글 수정 검증 Hook
 */
export const useVerifyComment = () =>
  useMutation({
    mutationFn: async (params: { commentId: string; data: { password: string } }) => {
      const result = await verifyComment(params.commentId, {
        password: params.data.password,
      });
      return result as CommentVerifyResponse;
    },
  });

/**
 * 댓글 삭제 Hook
 */
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      commentId: string;
      data: { verifyToken: string };
      slug: string;
      electionId: string;
    }) => {
      const result = await deleteComment(params.commentId, {
        verifyToken: params.data.verifyToken,
      });
      return result;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: commentKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: ['replies'] });
      void queryClient.invalidateQueries({
        queryKey: commentKeys.count(variables.slug, variables.electionId),
      });
    },
  });
};

/**
 * 단건 댓글 상세 조회 (핀 영역용 — comment + parent).
 *
 * 알림에서 진입 시 commentId가 query에 실려 오는 케이스에 사용.
 * 댓글이 삭제되었거나 권한이 없으면 BE 응답이 비어 있을 수 있어 caller에서 빈 처리.
 */
export const useCommentDetail = (commentId: string | null | undefined, enabled = true) =>
  useQuery({
    queryKey: commentId ? commentKeys.detail(commentId) : ['comment', 'detail', 'idle'],
    queryFn: async (): Promise<CommentDetailResponse | null> => {
      if (!commentId) {
        return null;
      }
      const result = (await getCommentDetail(commentId)) as BaseResponseCommentDetailResponse;
      return result.data ?? null;
    },
    enabled: Boolean(commentId) && enabled,
    // 핀은 진입 1회 조회로 충분 — 정렬/페이지네이션과 무관하게 최신 한 번만.
    staleTime: 60 * 1000,
    retry: false,
  });

export type { CommentItem, CommentVerifyResponse, CommentDetailResponse };
