import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { TSelectedItemMap } from '@/components/features/Vote/VoteView';
import { VoteSubmissionError, VoteValidationError } from '@/lib/errors';
import { queryKeys } from '@/lib/react-query';
import { resultApi } from '@/services/api/result';
import type { CreateResultRequest } from '@/types/result';

/**
 * 투표 결과 제출 Hook
 */
export const useVoteSubmission = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: createResult, isPending } = useMutation({
    mutationFn: (data: CreateResultRequest) => resultApi.createResult(data),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.display.result(data.resultId) });
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

      const { resultId } = await createResult({
        trendId: Number(trendId),
        selectedItems,
      });

      return resultId;
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
