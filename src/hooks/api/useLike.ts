/**
 * 핫픽 좋아요 Hook
 *
 * 메인 피드(infinite query)와 상세 페이지(detail query) 캐시를
 * 낙관적으로 업데이트한 뒤 서버 동기화.
 */

import { useCallback, useRef } from 'react';

import { useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { likeHotpick, unlikeHotpick } from '@/generated/api/client/hotpick/hotpick';
import type { HotpickLikeResponse, MainHotpickResponse } from '@/generated/models';
import { displayKeys } from '@/hooks/api/useDisplay';
import { getTKUID } from '@/lib/tkuid';

export const useLike = () => {
  const queryClient = useQueryClient();
  const pendingRef = useRef<Set<string>>(new Set());
  const tkuIdRef = useRef<string>(getTKUID());

  /** infinite main 캐시에서 특정 핫픽의 liked / likeCount 업데이트 */
  const updateInfiniteCache = useCallback(
    (slug: string, liked: boolean, likeCount: number) => {
      queryClient.setQueriesData<InfiniteData<MainHotpickResponse | null>>(
        { queryKey: [...displayKeys.all, 'mainInfinite'] },
        (oldData) => {
          if (!oldData) {
            return oldData;
          }

          return {
            ...oldData,
            pages: oldData.pages.map((page) => {
              if (!page) {
                return page;
              }
              return {
                ...page,
                hotpicks: (page.hotpicks ?? []).map((hotpick) => {
                  if (hotpick.slug === slug) {
                    return { ...hotpick, liked, likeCount };
                  }
                  return hotpick;
                }),
              };
            }),
          };
        }
      );
    },
    [queryClient]
  );

  /** detail 캐시 업데이트 */
  const updateDetailCache = useCallback(
    (slug: string, liked: boolean, likeCount: number) => {
      queryClient.setQueryData(displayKeys.hotpick(slug), (old: unknown) => {
        if (!old || typeof old !== 'object') {
          return old;
        }
        const data = old as Record<string, unknown>;
        const hotpick = data.hotpick as Record<string, unknown> | undefined;
        if (!hotpick) {
          return old;
        }
        return { ...data, hotpick: { ...hotpick, liked, likeCount } };
      });
    },
    [queryClient]
  );

  const handleLike = useCallback(
    async (slug: string, currentLiked: boolean, currentLikeCount: number) => {
      if (pendingRef.current.has(slug)) {
        return;
      }

      const nextLiked = !currentLiked;
      const nextCount = currentLikeCount + (nextLiked ? 1 : -1);

      // 낙관적 업데이트
      updateInfiniteCache(slug, nextLiked, nextCount);
      updateDetailCache(slug, nextLiked, nextCount);

      pendingRef.current.add(slug);

      try {
        const tkuId = tkuIdRef.current;
        const apiOptions = tkuId ? { headers: { 'x-tku-id': tkuId } } : undefined;

        const result = currentLiked
          ? await unlikeHotpick(slug, apiOptions)
          : await likeHotpick(slug, apiOptions);

        // 서버 응답으로 실제 값 갱신
        const likeResult = result as HotpickLikeResponse;
        const serverLiked = likeResult.liked ?? nextLiked;
        const serverCount = likeResult.likeCount ?? nextCount;

        updateInfiniteCache(slug, serverLiked, serverCount);
        updateDetailCache(slug, serverLiked, serverCount);
      } catch {
        // 롤백
        updateInfiniteCache(slug, currentLiked, currentLikeCount);
        updateDetailCache(slug, currentLiked, currentLikeCount);
      } finally {
        pendingRef.current.delete(slug);
      }
    },
    [updateInfiniteCache, updateDetailCache]
  );

  return { handleLike };
};
