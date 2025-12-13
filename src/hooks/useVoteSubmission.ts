import { useSearchParams } from 'next/navigation';

import type { TSelectedItemMap } from '@/components/features/Vote/VoteView';
import { useCreateResult } from '@/hooks/api';
import { VoteSubmissionError, VoteValidationError } from '@/lib/errors';

/**
 * 투표 결과 제출 Hook
 */
export const useVoteSubmission = () => {
  const searchParams = useSearchParams();

  const invitationId = searchParams.get('compare') || '';
  const { mutateAsync: createResult, isPending } = useCreateResult();

  const submit = async (
    trendId: string,
    selectedItemMap: TSelectedItemMap,
    totalItemCount: number,
    nickname: string = ''
  ) => {
    try {
      const selectedItems = Object.entries(selectedItemMap)
        .filter((entry): entry is [string, string] => !!entry[1])
        .map(([itemId, optionId]) => ({ itemId, optionId }));

      if (selectedItems.length < totalItemCount) {
        throw new VoteValidationError('예상치 못한 오류가 발생했습니다.');
      }

      const { resultId } = await createResult({
        trendId,
        selectedItems,
        invitationId,
        nickname,
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
