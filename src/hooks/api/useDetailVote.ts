import { useCallback, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useModal } from '@/contexts/ModalContext';
import { vote } from '@/generated/api/client/hotpick/hotpick';
import type { HotpickDetailResponse } from '@/generated/models';
import { displayKeys } from '@/hooks/api/useDisplay';
import { electionSeriesKeys } from '@/hooks/api/useElectionSeries';
import { getTKUID } from '@/lib/tkuid';

interface UseDetailVoteReturn {
  handleVote: (optionId: number) => void;
}

export const useDetailVote = (
  slug: string,
  isExpired: boolean,
  voted: boolean
): UseDetailVoteReturn => {
  const queryClient = useQueryClient();
  const { showToast } = useModal();
  const pendingRef = useRef(false);
  const tkuIdRef = useRef(getTKUID());

  const handleVote = useCallback(
    async (optionId: number) => {
      if (isExpired || voted || pendingRef.current) {
        return;
      }

      pendingRef.current = true;

      const queryKey = displayKeys.hotpick(slug);
      const prevData = queryClient.getQueryData<HotpickDetailResponse | null>(queryKey);

      // Optimistic update
      queryClient.setQueryData<HotpickDetailResponse | null>(queryKey, (old) => {
        if (!old?.hotpick?.election) {
          return old;
        }
        const next = structuredClone(old);
        const el = next.hotpick?.election;
        if (!el) {
          return old;
        }
        el.voted = true;
        el.myElectionItemId = optionId;
        el.totalVoteCount = (el.totalVoteCount ?? 0) + 1;
        el.items?.forEach((item) => {
          if (item.electionItemId === optionId) {
            item.voteCount = (item.voteCount ?? 0) + 1;
          }
        });
        return next;
      });

      try {
        await vote(
          slug,
          { electionItemId: optionId },
          { headers: { 'x-tku-id': tkuIdRef.current } }
        );
        // 투표 성공 후 그래프 데이터 갱신 — 내 투표가 반영된 최신 추이 표시
        void queryClient.invalidateQueries({ queryKey: electionSeriesKeys.all });
      } catch (error) {
        // 409 (already voted): keep optimistic state
        if (error && typeof error === 'object' && 'response' in error) {
          const res = (error as { response?: { status?: number } }).response;
          if (res?.status === 409) {
            return;
          }
        }
        // Other errors: rollback
        queryClient.setQueryData(queryKey, prevData);
        showToast('투표에 실패했습니다');
      } finally {
        pendingRef.current = false;
      }
    },
    [isExpired, voted, slug, queryClient, showToast]
  );

  return { handleVote: (optionId: number) => void handleVote(optionId) };
};
