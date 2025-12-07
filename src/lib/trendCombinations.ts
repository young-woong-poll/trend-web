import type { ElectionDetail } from '@/types/election';

/**
 * 조합의 각 옵션 정보
 */
export interface CombinationItem {
  electionId: string;
  electionTitle: string;
  optionId: string;
  optionTitle: string;
}

/**
 * 선거 옵션 조합을 생성하는 함수
 * @param elections - 선거 상세 정보 배열 (순서대로)
 * @returns 모든 가능한 조합의 배열
 */
export const generateCombinations = (elections: ElectionDetail[]): CombinationItem[][] => {
  if (elections.length === 0) {
    return [];
  }

  // 재귀적으로 조합 생성
  const combine = (index: number): CombinationItem[][] => {
    if (index === elections.length) {
      return [[]];
    }

    const currentElection = elections[index];
    const restCombinations = combine(index + 1);

    const result: CombinationItem[][] = [];
    for (const option of currentElection.options) {
      for (const restCombination of restCombinations) {
        const combinationOption: CombinationItem = {
          electionId: String(currentElection.id),
          electionTitle: currentElection.title,
          optionId: String(option.id),
          optionTitle: option.title,
        };
        result.push([combinationOption, ...restCombination]);
      }
    }

    return result;
  };

  return combine(0);
};
