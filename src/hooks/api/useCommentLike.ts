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
import { replyKeys } from '@/hooks/api/useReplies';
import { getTKUID } from '@/lib/tkuid';

interface UseCommentLikeOptions {
  onError?: (error: unknown) => void;
}

export const useCommentLike = (
  slug: string,
  electionId: string,
  sort: 'latest' | 'popular',
  options?: UseCommentLikeOptions & { isLoggedIn?: boolean }
) => {
  const queryClient = useQueryClient();
  const allSorts: Array<'latest' | 'popular'> = ['latest', 'popular'];

  /** 모든 sort 캐시 + 답글 캐시에 대해 댓글 좋아요 상태를 업데이트 */
  const updateAllSortCaches = (
    commentId: string,
    updater: (comment: CommentItem) => CommentItem
  ) => {
    // 1) 댓글 목록 캐시 (sort별)
    for (const s of allSorts) {
      const key = commentKeys.list(slug, electionId, s);
      queryClient.setQueryData(key, (old: { pages: CommentListResponse[] } | undefined) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            comments: (page.comments ?? []).map((comment: CommentItem) =>
              comment.id === commentId ? updater(comment) : comment
            ),
          })),
        };
      });
    }

    // 2) 답글 목록 캐시 (모든 부모별)
    const replyCaches = queryClient.getQueriesData<{ pages: CommentListResponse[] }>({
      queryKey: replyKeys.all,
    });
    replyCaches.forEach(([key, oldData]) => {
      if (!oldData) {
        return;
      }
      queryClient.setQueryData(key, {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          comments: (page.comments ?? []).map((comment: CommentItem) =>
            comment.id === commentId ? updater(comment) : comment
          ),
        })),
      });
    });
  };

  const handleLikeClick = useCallback(
    async (commentId: string, currentLiked: boolean) => {
      // 롤백용 스냅샷 (모든 sort + 답글 캐시)
      const replyCacheSnapshots = queryClient
        .getQueriesData<{ pages: CommentListResponse[] }>({ queryKey: replyKeys.all })
        .map(([key, data]) => ({ key, data }));

      const snapshots = [
        ...allSorts.map((s) => ({
          key: commentKeys.list(slug, electionId, s),
          data: queryClient.getQueryData(commentKeys.list(slug, electionId, s)),
        })),
        ...replyCacheSnapshots,
      ];

      // 낙관적 업데이트 — 모든 sort 캐시 반영
      updateAllSortCaches(commentId, (comment) => ({
        ...comment,
        liked: !currentLiked,
        likeCount: (comment.likeCount ?? 0) + (currentLiked ? -1 : 1),
      }));

      try {
        const tkuId = getTKUID({ isLoggedIn: options?.isLoggedIn });
        const apiOptions = tkuId ? { headers: { 'x-tku-id': tkuId } } : {};

        const result = currentLiked
          ? await unlikeComment(commentId, apiOptions)
          : await likeComment(commentId, apiOptions);

        // 서버 응답으로 실제 값 갱신 — 모든 sort 캐시 반영
        const likeResult = result as CommentLikeResponse;
        updateAllSortCaches(commentId, (comment) => ({
          ...comment,
          liked: likeResult.liked ?? !currentLiked,
          likeCount: likeResult.likeCount ?? comment.likeCount,
        }));
      } catch (error) {
        // 롤백 — 모든 sort 캐시 복원
        for (const { key, data } of snapshots) {
          queryClient.setQueryData(key, data);
        }
        options?.onError?.(error);
      }
    },
    [queryClient, slug, electionId, options]
  );

  return {
    handleLikeClick,
  };
};
