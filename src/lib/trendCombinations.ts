import type { ElectionDetail } from '@/types/election';

/**
 * 선거 옵션 조합을 생성하는 함수
 * @param elections - 선거 상세 정보 배열 (순서대로)
 * @returns 모든 가능한 조합의 배열
 */
export const generateCombinations = (elections: ElectionDetail[]): string[][] => {
  if (elections.length === 0) {
    return [];
  }

  // 각 선거의 옵션 ID 배열 추출
  const optionSets = elections.map((election) =>
    election.options.map((option) => String(option.id))
  );

  // 재귀적으로 조합 생성
  const combine = (index: number): string[][] => {
    if (index === optionSets.length) {
      return [[]];
    }

    const currentOptions = optionSets[index];
    const restCombinations = combine(index + 1);

    const result: string[][] = [];
    for (const option of currentOptions) {
      for (const restCombination of restCombinations) {
        result.push([option, ...restCombination]);
      }
    }

    return result;
  };

  return combine(0);
};

/**
 * 옵션 ID로 타이틀 찾기
 * @param elections - 선거 상세 정보 배열
 * @param electionIndex - 선거 인덱스
 * @param optionId - 옵션 ID
 * @returns 옵션 타이틀
 */
export const getOptionTitle = (
  elections: ElectionDetail[],
  electionIndex: number,
  optionId: string
): string => {
  const election = elections[electionIndex];

  if (!election) {
    return optionId;
  }

  const option = election.options.find((opt) => String(opt.id) === optionId);
  return option?.title || optionId;
};
