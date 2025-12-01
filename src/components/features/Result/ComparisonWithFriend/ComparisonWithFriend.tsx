import { ComparisonCard } from '@/components/features/Result/ComparisonCard/ComparisonCard';
import type { ComparisonItem } from '@/components/features/Result/ResultView';
import type { ResultDisplayResponse } from '@/types/result';

export const ComparisonWithFriend = ({
  resultWithCompareId,
}: {
  resultWithCompareId: ResultDisplayResponse;
}) => {
  const { trend, selectedOptions, compareSelectedOptions } = resultWithCompareId;

  const idTitleMap = trend.items
    .flatMap((item) => item.options)
    .reduce<Record<string, string>>((acc, option) => {
      acc[option.id] = option.title;
      return acc;
    }, {});

  const comparisons: ComparisonItem[] = trend.items.map((item, index) => {
    const myOptionId = selectedOptions?.[index];
    const friendOptionId = compareSelectedOptions?.[index];

    const myAnswer = myOptionId ? (idTitleMap[myOptionId] ?? '') : '';
    const friendAnswer = friendOptionId ? (idTitleMap[friendOptionId] ?? '') : '';

    return {
      question: item.title ?? '',
      myAnswer,
      friendAnswer,
      isMatch: !!(myOptionId && friendOptionId && myOptionId === friendOptionId),
    };
  });
  return (
    <ComparisonCard
      myName={resultWithCompareId.nickname}
      friendNickname={resultWithCompareId.compareNickname}
      matchCount={resultWithCompareId.matchCount ?? 0}
      totalCount={resultWithCompareId.totalCount ?? 0}
      compareType={resultWithCompareId.compareType}
      comparisons={comparisons}
    />
  );
};
