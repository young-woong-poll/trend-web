import { ComparisonCard } from '@/components/features/Result/ComparisonCard/ComparisonCard';
import { fNameRes } from '@/lib/utils';
import type { ResultDisplayResponse } from '@/types/result';

export interface ComparisonItem {
  myAnswer: string;
  friendAnswer: string;
  isMatch: boolean;
  question: string;
}

export const ComparisonWithFriend = ({
  resultWithCompareId,
  compareId,
}: {
  resultWithCompareId: ResultDisplayResponse;
  compareId: string;
}) => {
  const {
    nickname,
    compareNickname,
    trend,
    selectedOptions,
    compareSelectedOptions,
    compareType,
    totalCount,
    matchCount,
  } = resultWithCompareId;

  const idTitleMap = trend.items
    .flatMap((item) => item.options)
    .reduce<Record<string, string>>((acc, option) => {
      acc[option.id] = option.title;
      return acc;
    }, {});

  if (
    !compareSelectedOptions ||
    !selectedOptions ||
    !totalCount ||
    !matchCount ||
    !nickname ||
    compareSelectedOptions.filter((i) => !i).length > 0 ||
    selectedOptions.filter((i) => !i).length > 0
  ) {
    return <p>hasError</p>;
  }

  const comparisons: ComparisonItem[] = trend.items.map((item, index) => {
    const myOptionId = selectedOptions[index];
    const friendOptionId = compareSelectedOptions[index];

    const myAnswer = idTitleMap[myOptionId];
    const friendAnswer = idTitleMap[friendOptionId];

    return {
      question: item.title,
      myAnswer,
      friendAnswer,
      isMatch: myOptionId === friendOptionId,
    };
  });
  return (
    <ComparisonCard
      myName={nickname}
      friendNickname={fNameRes(compareNickname, compareId)}
      matchCount={matchCount}
      totalCount={totalCount}
      compareType={compareType}
      comparisons={comparisons}
    />
  );
};
