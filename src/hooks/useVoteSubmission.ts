import { useRef } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { TSelectedElectionMap } from '@/components/features/Hotpick/VoteView';
import { createResult } from '@/generated/api/client/result/result';
import type { CreateResultRequest } from '@/generated/models';
import { displayKeys } from '@/hooks/api/useDisplay';
import { VoteSubmissionError, VoteValidationError } from '@/lib/errors';
import { getTKUID } from '@/lib/tkuid';

/**
 * 투표 결과 제출 Hook
 */
export const useHotpickSubmission = () => {
  const queryClient = useQueryClient();
  const tkuIdRef = useRef(getTKUID());

  const { mutateAsync: submitResult, isPending } = useMutation({
    mutationFn: (data: CreateResultRequest) =>
      createResult(data, {
        headers: { 'x-tku-id': tkuIdRef.current },
      }),
    onSuccess: (data) => {
      // 메인 피드 캐시 무효화 (participated 상태 반영)
      void queryClient.invalidateQueries({ queryKey: displayKeys.all });
      void queryClient.invalidateQueries({
        queryKey: displayKeys.result(data?.resultId ?? ''),
      });
    },
  });

  const submit = async (
    hotpickId: string,
    selectedElectionMap: TSelectedElectionMap,
    totalElectionCount: number
  ) => {
    try {
      const selectedItems = Object.entries(selectedElectionMap)
        .filter((entry): entry is [string, string] => !!entry[1])
        .map(([itemId, optionId]) => ({ itemId, optionId }));

      if (selectedItems.length < totalElectionCount) {
        throw new VoteValidationError('예상치 못한 오류가 발생했습니다.');
      }

      const result = await submitResult({
        trendId: Number(hotpickId),
        selectedItems,
      });

      return result?.resultId ?? '';
    } catch (error) {
      if (error instanceof VoteValidationError) {
        throw error;
      }

      throw new VoteSubmissionError(
        error instanceof Error ? error.message : '투표 제출 중 오류가 발생했습니다'
      );
    }
  };

  return { submit, isSubmitting: isPending };
};
