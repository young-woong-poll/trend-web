/**
 * 투표 결과 제출 Hook — 스텁 처리
 *
 * BUNDLE 전용. createResult API 제거됨.
 */

import type { TSelectedElectionMap } from '@/components/features/Hotpick/VoteView';
import { VoteSubmissionError } from '@/lib/errors';

export const useHotpickSubmission = () => {
  const submit = async (
    _hotpickId: string,
    _selectedElectionMap: TSelectedElectionMap,
    _totalElectionCount: number
  ): Promise<string> => {
    throw new VoteSubmissionError('BUNDLE 투표는 준비 중입니다');
  };

  return { submit, isSubmitting: false };
};
