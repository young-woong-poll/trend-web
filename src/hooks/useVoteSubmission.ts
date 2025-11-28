import { useParams, useRouter, useSearchParams } from 'next/navigation';

import type { TSelectedItemMap } from '@/components/features/Vote/VoteView';
import { useCreateResult } from '@/hooks/api';
import { VoteSubmissionError, VoteValidationError } from '@/lib/errors';

/**
 * 투표 결과 제출 Hook
 */
export const useVoteSubmission = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const trendId = params.trendId as string;
  const invitationId = searchParams.get('compare') || undefined;
  const { mutateAsync: createResult, isPending } = useCreateResult();

  const submit = async (
    selectedItemMap: TSelectedItemMap,
    totalItemCount: number,
    nickname?: string
  ) => {
    try {
      // selectedItemMap을 API 요청 형식으로 변환
      const selectedItems = Object.entries(selectedItemMap)
        .filter((entry): entry is [string, string] => !!entry[1])
        .map(([itemId, optionId]) => ({ itemId, optionId }));

      // 모든 항목이 선택되었는지 검증
      if (selectedItems.length < totalItemCount) {
        throw new VoteValidationError('예상치 못한 오류가 발생했습니다.');
      }

      const { resultId } = await createResult({
        trendId,
        selectedItems,
        invitationId,
        nickname,
      });

      router.replace(`/vote/${trendId}/result?id=${resultId}`);
    } catch (error) {
      // VoteValidationError는 그대로 전파
      if (error instanceof VoteValidationError) {
        throw error;
      }

      // 그 외 에러는 VoteSubmissionError로 래핑
      throw new VoteSubmissionError(
        error instanceof Error ? error.message : '투표 제출 중 오류가 발생했습니다'
      );
    }
  };

  return { submit, isSubmitting: isPending };
};
