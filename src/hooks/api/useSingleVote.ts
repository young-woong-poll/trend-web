import { useCallback, useRef } from 'react';

import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { vote } from '@/generated/api/client/hotpick/hotpick';
import type { MainHotpickResponse, VoteResultResponse } from '@/generated/models';
import { displayKeys } from '@/hooks/api/useDisplay';
import { getTKUID } from '@/lib/tkuid';
import {
  voteResultToSingleVoteData,
  electionToSingleVoteData,
  type SingleVoteData,
} from '@/types/singleVote';

interface UseSingleVoteOptions {
  onError?: (error: unknown) => void;
}

/**
 * 싱글 핫픽 인라인 투표 훅
 *
 * 1. 낙관적 업데이트: infinite query 캐시에서 해당 아이템의 election 즉시 갱신
 * 2. 중복 클릭 방지: pendingRef 사용
 * 3. 실패 시 롤백
 */
export const useSingleVote = (options?: UseSingleVoteOptions) => {
  const queryClient = useQueryClient();
  const pendingRef = useRef<Set<string>>(new Set());
  const tkuIdRef = useRef<string>(getTKUID());

  /**
   * infinite query 캐시에서 특정 핫픽의 election을 SingleVoteData로 매핑하여 업데이트
   */
  const updateCacheOptimistically = useCallback(
    (slug: string, updater: (prev: SingleVoteData) => SingleVoteData) => {
      queryClient.setQueriesData<InfiniteData<MainHotpickResponse | null>>(
        { queryKey: [...displayKeys.all, 'mainInfinite'] },
        (oldData) => {
          if (!oldData) {
            return oldData;
          }

          const next = structuredClone(oldData);
          for (const page of next.pages) {
            if (!page) {
              continue;
            }
            for (const hotpick of page.hotpicks ?? []) {
              if (hotpick.slug !== slug || !hotpick.election) {
                continue;
              }
              const currentSingleVote = electionToSingleVoteData(hotpick.election);
              const updated = updater(currentSingleVote);
              const el = hotpick.election;
              el.voted = updated.voted;
              el.myElectionItemId = updated.myChoiceId ? Number(updated.myChoiceId) : undefined;
              el.totalVoteCount = updated.totalVotes ?? (el.totalVoteCount ?? 0) + 1;
              el.items?.forEach((item) => {
                const updatedOpt = updated.options.find(
                  (o) => o.id === String(item.electionItemId)
                );
                item.voteCount = updatedOpt?.voteCount ?? item.voteCount;
                item.selected = String(item.electionItemId) === updated.myChoiceId;
              });
            }
          }
          return next;
        }
      );
    },
    [queryClient]
  );

  /**
   * 투표 클릭 핸들러
   *
   * @param slug - 핫픽 slug
   * @param optionId - 선택한 옵션 ID (string)
   * @param singleVote - 현재 singleVote 상태
   */
  const handleVote = useCallback(
    async (slug: string, optionId: string, singleVote: SingleVoteData) => {
      if (pendingRef.current.has(slug)) {
        return;
      }

      // 낙관적 업데이트
      // 투표 전에는 voteCount/totalVotes가 null이므로 개별 합산하면 안 됨
      // updater에서 원본 election.totalVoteCount를 활용하도록 null로 전달
      const newOptions = singleVote.options.map((opt) => ({
        ...opt,
        voteCount: opt.id === optionId ? (opt.voteCount ?? 0) + 1 : opt.voteCount,
      }));

      updateCacheOptimistically(slug, () => ({
        ...singleVote,
        options: newOptions,
        voted: true,
        myChoiceId: optionId,
        totalVotes: null,
      }));

      pendingRef.current.add(slug);
      const tkuId = tkuIdRef.current;

      try {
        await vote(slug, { electionItemId: Number(optionId) }, { headers: { 'x-tku-id': tkuId } });
      } catch (error) {
        // 409 중복 투표: 서버 응답 데이터로 결과 표시
        if (isAxiosError(error) && error.response?.status === 409) {
          const responseData = error.response.data?.data as VoteResultResponse | undefined;
          if (responseData) {
            updateCacheOptimistically(slug, (prev) =>
              voteResultToSingleVoteData(prev, responseData)
            );
          }
          return;
        }

        console.error('싱글 투표 실패:', error);

        // 롤백
        updateCacheOptimistically(slug, () => singleVote);

        options?.onError?.(error);
      } finally {
        pendingRef.current.delete(slug);
      }
    },
    [updateCacheOptimistically, options]
  );

  return { handleVote };
};
