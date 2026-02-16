import { useCallback, useRef } from 'react';

import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import type { DisplayMainResponse } from '@/generated/models';
import { displayKeys } from '@/hooks/api/useDisplay';
import axiosInstance from '@/lib/axios';
import { getTKUID } from '@/lib/tkuid';
import type { SingleVoteData, SingleVoteResponse } from '@/types/singleVote';

interface UseSingleVoteOptions {
  onError?: (error: unknown) => void;
}

/**
 * 싱글 핫픽 인라인 투표 훅
 *
 * useCommentLike 패턴 기반:
 * 1. 낙관적 업데이트: infinite query 캐시에서 해당 아이템의 singleVote 즉시 갱신
 * 2. 중복 클릭 방지: pendingRef 사용
 * 3. 실패 시 롤백
 */
export const useSingleVote = (options?: UseSingleVoteOptions) => {
  const queryClient = useQueryClient();
  const pendingRef = useRef<Set<string>>(new Set());
  const tkuIdRef = useRef<string>(getTKUID());

  /**
   * infinite query 캐시에서 특정 핫픽의 singleVote 필드를 업데이트
   */
  const updateCacheOptimistically = useCallback(
    (hotpickId: string, updater: (prev: SingleVoteData) => SingleVoteData) => {
      // 모든 mainInfinite 쿼리 캐시를 순회하며 업데이트
      queryClient.setQueriesData<InfiniteData<DisplayMainResponse | null>>(
        { queryKey: displayKeys.all },
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
                trends: (page.trends ?? []).map((trend) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const item = trend as any;
                  if (String(item.id) === hotpickId && item.singleVote) {
                    return {
                      ...item,
                      singleVote: updater(item.singleVote),
                    };
                  }
                  return trend;
                }),
              };
            }),
          };
        }
      );
    },
    [queryClient]
  );

  /**
   * 투표 클릭 핸들러
   *
   * @param hotpickId - 핫픽 ID (숫자 → 문자열)
   * @param optionId - 선택한 옵션 ID
   * @param singleVote - 현재 singleVote 상태
   */
  const handleVote = useCallback(
    async (hotpickId: string, optionId: string, singleVote: SingleVoteData) => {
      // 중복 클릭 방지
      if (pendingRef.current.has(hotpickId)) {
        return;
      }

      const isOptionA = optionId === singleVote.optionA.id;
      const prevVoteCountA = singleVote.optionA.voteCount ?? 0;
      const prevVoteCountB = singleVote.optionB.voteCount ?? 0;
      const newVoteCountA = isOptionA ? prevVoteCountA + 1 : prevVoteCountA;
      const newVoteCountB = isOptionA ? prevVoteCountB : prevVoteCountB + 1;
      const newTotalVotes = newVoteCountA + newVoteCountB;

      // 1. 낙관적 업데이트
      updateCacheOptimistically(hotpickId, () => ({
        ...singleVote,
        optionA: { ...singleVote.optionA, voteCount: newVoteCountA },
        optionB: { ...singleVote.optionB, voteCount: newVoteCountB },
        voted: true,
        myChoice: isOptionA ? 'A' : 'B',
        totalVotes: newTotalVotes,
      }));

      // 2. 요청 시작
      pendingRef.current.add(hotpickId);
      const tkuId = tkuIdRef.current;

      try {
        // 3. 서버에 투표 전송
        const { data } = await axiosInstance.post<SingleVoteResponse>(
          `/api/v1/single/${hotpickId}/vote`,
          { optionId },
          { headers: { 'x-tku-id': tkuId } }
        );

        // 서버 응답으로 정확한 값 반영 (axios 인터셉터가 BaseResponse.data를 추출)
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (data) {
          updateCacheOptimistically(hotpickId, (prev) => ({
            ...prev,
            optionA: { ...prev.optionA, voteCount: data.voteCountA },
            optionB: { ...prev.optionB, voteCount: data.voteCountB },
            voted: true,
            myChoice: data.myChoice,
            totalVotes: data.totalVotes,
          }));
        }
      } catch (error) {
        // 409 중복 투표: 서버 응답 데이터로 결과 표시
        if (isAxiosError(error) && error.response?.status === 409) {
          const responseData = error.response.data?.data as SingleVoteResponse | undefined;
          if (responseData) {
            updateCacheOptimistically(hotpickId, (prev) => ({
              ...prev,
              optionA: { ...prev.optionA, voteCount: responseData.voteCountA },
              optionB: { ...prev.optionB, voteCount: responseData.voteCountB },
              voted: true,
              myChoice: responseData.myChoice,
              totalVotes: responseData.totalVotes,
            }));
          }
          return;
        }

        console.error('싱글 투표 실패:', error);

        // 롤백: 이전 상태로 복구
        updateCacheOptimistically(hotpickId, () => singleVote);

        options?.onError?.(error);
      } finally {
        pendingRef.current.delete(hotpickId);
      }
    },
    [updateCacheOptimistically, options]
  );

  return { handleVote };
};
