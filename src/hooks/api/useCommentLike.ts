import { useCallback, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { likeComment, unlikeComment } from '@/generated/api/client/comment/comment';
import type { CommentListResponse } from '@/generated/models';
import { getTKUID } from '@/lib/tkuid';

interface UseCommentLikeOptions {
  onError?: (error: unknown) => void;
}

/**
 * 댓글 좋아요 기능을 최적화한 커스텀 훅
 *
 * 특징:
 * 1. Optimistic Update: 클라이언트에서 즉시 UI 업데이트
 * 2. 즉시 전송 + 요청 중 무시: 서버 요청 중 중복 클릭 무시
 * 3. 자동 롤백: 서버 요청 실패 시 이전 상태로 복구
 */
export const useCommentLike = (
  hotpickId: string,
  electionId: string,
  sort: 'latest' | 'popular',
  options?: UseCommentLikeOptions
) => {
  const queryClient = useQueryClient();
  // 현재 요청 중인 댓글 ID를 추적
  const pendingRequestsRef = useRef<Set<string>>(new Set());
  const tkuIdRef = useRef<string>(getTKUID());

  /**
   * React Query 캐시를 직접 업데이트하여 UI를 즉시 반영
   * 최신순/인기순 모두 업데이트하여 탭 전환 시에도 좋아요 상태 동기화
   */
  const updateCacheOptimistically = useCallback(
    (commentId: string, liked: boolean, likeCountDelta: number) => {
      // 최신순과 인기순 모두 업데이트
      (['latest', 'popular'] as const).forEach((sortType) => {
        const queryKey = ['comment', 'list', hotpickId, electionId, sortType];

        queryClient.setQueryData<{ pages: CommentListResponse[]; pageParams: unknown[] }>(
          queryKey,
          (oldData) => {
            if (!oldData) {
              return oldData;
            }

            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                comments: (page.comments ?? []).map((comment) =>
                  comment.id === commentId
                    ? {
                        ...comment,
                        liked,
                        likeCount: Math.max(0, (comment.likeCount ?? 0) + likeCountDelta),
                      }
                    : comment
                ),
              })),
            };
          }
        );
      });
    },
    [queryClient, hotpickId, electionId]
  );

  /**
   * 좋아요 클릭 핸들러
   *
   * @param commentId - 댓글 ID
   * @param currentLiked - 현재 좋아요 상태
   */
  const handleLikeClick = useCallback(
    async (commentId: string, currentLiked: boolean) => {
      // 이미 요청 중이면 무시 (중복 클릭 방지)
      if (pendingRequestsRef.current.has(commentId)) {
        return;
      }

      const newLiked = !currentLiked;
      const likeCountDelta = newLiked ? 1 : -1;

      // 1. 즉시 UI 업데이트 (Optimistic Update)
      updateCacheOptimistically(commentId, newLiked, likeCountDelta);

      // 2. 요청 시작 표시
      pendingRequestsRef.current.add(commentId);

      const tkuId = tkuIdRef.current;

      try {
        // 3. 즉시 서버에 전송
        if (newLiked) {
          await likeComment(commentId, { headers: { 'x-tku-id': tkuId } });
        } else {
          await unlikeComment(commentId, { headers: { 'x-tku-id': tkuId } });
        }
      } catch (error) {
        // T0011 에러는 무시 (이미 좋아요/취소된 상태)
        if (isAxiosError(error) && error.response?.data?.code === 'T0011') {
          return;
        }

        console.error('좋아요 동기화 실패:', error);

        // 4. 실패 시 롤백 (이전 상태로 복구)
        updateCacheOptimistically(commentId, currentLiked, -likeCountDelta);

        // 에러 콜백 호출
        options?.onError?.(error);
      } finally {
        // 5. 요청 완료 표시
        pendingRequestsRef.current.delete(commentId);
      }
    },
    [updateCacheOptimistically, options]
  );

  return {
    handleLikeClick,
  };
};
