import { useCallback, useRef, useEffect } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { getTKUID } from '@/lib/tkuid';
import { commentApi } from '@/services/api/comment';
import type { CommentListResponse } from '@/types/comment';

interface PendingLike {
  commentId: string;
  liked: boolean;
  timerId: NodeJS.Timeout;
}

interface UseCommentLikeOptions {
  onError?: (error: unknown) => void;
}

/**
 * 댓글 좋아요 기능을 최적화한 커스텀 훅
 *
 * 특징:
 * 1. Optimistic Update: 클라이언트에서 즉시 UI 업데이트
 * 2. Debouncing (3초): 연속 클릭 시 마지막 상태만 서버에 전송
 * 3. 자동 롤백: 서버 요청 실패 시 이전 상태로 복구
 */
export const useCommentLike = (
  trendId: string,
  itemId: string,
  sort: 'latest' | 'popular',
  options?: UseCommentLikeOptions
) => {
  const queryClient = useQueryClient();
  const pendingLikesRef = useRef<Map<string, PendingLike>>(new Map());
  const tkuIdRef = useRef<string>(getTKUID());

  // 컴포넌트 언마운트 시 모든 타이머 정리
  useEffect(() => {
    const currentPendingLikes = pendingLikesRef.current;

    return () => {
      currentPendingLikes.forEach((pending) => {
        clearTimeout(pending.timerId);
      });
      currentPendingLikes.clear();
    };
  }, []);

  /**
   * React Query 캐시를 직접 업데이트하여 UI를 즉시 반영
   */
  const updateCacheOptimistically = useCallback(
    (commentId: string, liked: boolean, likeCountDelta: number) => {
      const queryKey = ['commentList', trendId, itemId, sort];

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
              comments: page.comments.map((comment) =>
                comment.id === commentId
                  ? {
                      ...comment,
                      liked,
                      likeCount: Math.max(0, comment.likeCount + likeCountDelta),
                    }
                  : comment
              ),
            })),
          };
        }
      );
    },
    [queryClient, trendId, itemId, sort]
  );

  /**
   * 서버에 좋아요 상태 동기화
   */
  const syncToServer = useCallback(
    async (commentId: string, liked: boolean) => {
      const tkuId = tkuIdRef.current;

      try {
        if (liked) {
          await commentApi.likeComment(commentId, tkuId);
        } else {
          await commentApi.unlikeComment(commentId, tkuId);
        }
      } catch (error) {
        // T0011 에러는 무시 (좋아요를 누른 상태에서, 취소했다 다시 누르면 발생할 수 있음)
        if (isAxiosError(error) && error.response?.data?.code === 'T0011') {
          return;
        }

        console.error('좋아요 동기화 실패:', error);

        // 실패 시 캐시를 다시 불러와서 서버 상태와 동기화
        const queryKey = ['commentList', trendId, itemId, sort];
        await queryClient.invalidateQueries({ queryKey });

        // 에러 콜백 호출
        options?.onError?.(error);

        throw error;
      } finally {
        // 펜딩 맵에서 제거
        pendingLikesRef.current.delete(commentId);
      }
    },
    [queryClient, trendId, itemId, sort, options]
  );

  /**
   * 좋아요 클릭 핸들러
   *
   * @param commentId - 댓글 ID
   * @param currentLiked - 현재 좋아요 상태
   */
  const handleLikeClick = useCallback(
    (commentId: string, currentLiked: boolean) => {
      const newLiked = !currentLiked;
      const likeCountDelta = newLiked ? 1 : -1;

      // 1. 즉시 UI 업데이트 (Optimistic Update)
      updateCacheOptimistically(commentId, newLiked, likeCountDelta);

      // 2. 기존 타이머가 있으면 취소
      const existingPending = pendingLikesRef.current.get(commentId);
      if (existingPending) {
        clearTimeout(existingPending.timerId);
      }

      // 3. 새로운 디바운스 타이머 설정 (3000ms)
      const timerId = setTimeout(() => {
        void syncToServer(commentId, newLiked);
      }, 3000);

      // 4. 펜딩 맵에 저장
      pendingLikesRef.current.set(commentId, {
        commentId,
        liked: newLiked,
        timerId,
      });
    },
    [updateCacheOptimistically, syncToServer]
  );

  return {
    handleLikeClick,
  };
};
