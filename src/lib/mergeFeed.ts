import type { BundleCardModel, CardModel } from '@/types/card';

/**
 * 싱글 카드 배열에 번들 카드를 규칙적으로 삽입한다.
 *
 * 배치 규칙:
 * - 첫 번째 번들: 싱글 index 1 (2번째 위치)
 * - 이후 번들: 싱글 6개 간격 (삽입 위치 기준 index 1, 8, 15, 22, ...)
 * - 번들이 부족하면 있는 만큼만 삽입
 */
export function mergeBundlesIntoFeed(
  singles: CardModel[],
  bundles: BundleCardModel[]
): CardModel[] {
  if (bundles.length === 0) {
    return singles;
  }

  const result: CardModel[] = [];
  let bundleIndex = 0;
  const FIRST_INSERT = 1; // 2번째 위치
  const INTERVAL = 7; // 이후 간격 (6 singles + 1 bundle slot)

  for (let i = 0; i < singles.length; i++) {
    // 현재 result 길이가 삽입 위치와 일치하면 번들 삽입
    if (
      bundleIndex < bundles.length &&
      result.length === (bundleIndex === 0 ? FIRST_INSERT : FIRST_INSERT + bundleIndex * INTERVAL)
    ) {
      result.push({ type: 'BUNDLE', data: bundles[bundleIndex] });
      bundleIndex++;
    }
    result.push(singles[i]);
  }

  return result;
}
