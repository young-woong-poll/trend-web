/**
 * 댓글 좋아요 Hook
 *
 * 새 Comment API 기반 좋아요/좋아요 취소 처리.
 * 낙관적 업데이트로 즉시 UI 반영 후 서버 동기화.
 */

import { useCallback } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { likeComment, unlikeComment } from '@/generated/api/client/comment/comment';
import type { CommentItem, CommentLikeResponse, CommentListResponse } from '@/generated/models';
import { commentKeys } from '@/hooks/api/useComment';
import { getTKUID } from '@/lib/tkuid';

interface UseCommentLikeOptions {
  onError?: (error: unknown) => void;
}

export const useCommentLike = (
  slug: string,
  electionId: string,
  sort: 'latest' | 'popular',
  options?: UseCommentLikeOptions
) => {
  const queryClient = useQueryClient();
  const queryKey = commentKeys.list(slug, electionId, sort);

  const handleLikeClick = useCallback(
    async (commentId: string, currentLiked: boolean) => {
      // 낙관적 업데이트
      const previousData = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: { pages: CommentListResponse[] } | undefined) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            comments: (page.comments ?? []).map((comment: CommentItem) =>
              comment.id === commentId
                ? {
                    ...comment,
                    liked: !currentLiked,
                    likeCount: (comment.likeCount ?? 0) + (currentLiked ? -1 : 1),
                  }
                : comment
            ),
          })),
        };
      });

      try {
        const tkuId = getTKUID();
        const apiOptions = tkuId ? { headers: { 'x-tku-id': tkuId } } : undefined;

        const result = currentLiked
          ? await unlikeComment(commentId, apiOptions)
          : await likeComment(commentId, apiOptions);

        // 서버 응답으로 실제 값 갱신
        const likeResult = result as CommentLikeResponse;
        queryClient.setQueryData(queryKey, (old: { pages: CommentListResponse[] } | undefined) => {
          if (!old) {
            return old;
          }
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              comments: (page.comments ?? []).map((comment: CommentItem) =>
                comment.id === commentId
                  ? {
                      ...comment,
                      liked: likeResult.liked ?? !currentLiked,
                      likeCount: likeResult.likeCount ?? comment.likeCount,
                    }
                  : comment
              ),
            })),
          };
        });
      } catch (error) {
        // 롤백
        queryClient.setQueryData(queryKey, previousData);
        options?.onError?.(error);
      }
    },
    [queryClient, queryKey, options]
  );

  return {
    handleLikeClick,
  };
};
