import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { TSelectedItemMap } from '@/components/features/Vote/VoteView';
import { createResult } from '@/generated/api/client/result/result';
import type { CreateResultRequest } from '@/generated/models';
import { displayKeys } from '@/hooks/api/useDisplay';
import { VoteSubmissionError, VoteValidationError } from '@/lib/errors';

/**
 * 투표 결과 제출 Hook
 */
export const useVoteSubmission = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: submitResult, isPending } = useMutation({
    mutationFn: (data: CreateResultRequest) => createResult(data),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: displayKeys.result(data?.resultId ?? ''),
      });
    },
  });

  const submit = async (
    trendId: string,
    selectedItemMap: TSelectedItemMap,
    totalItemCount: number
  ) => {
    try {
      const selectedItems = Object.entries(selectedItemMap)
        .filter((entry): entry is [string, string] => !!entry[1])
        .map(([itemId, optionId]) => ({ itemId, optionId }));

      if (selectedItems.length < totalItemCount) {
        throw new VoteValidationError('예상치 못한 오류가 발생했습니다.');
      }

      const result = await submitResult({
        trendId: Number(trendId),
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
