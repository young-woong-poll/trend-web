import type { GroupCompareResult } from '@/types/group-compare';

/** 소수답 임계 비율 — 이 이하를 고른 답을 "소수답"으로 취급 */
const MINORITY_THRESHOLD = 1 / 3; // 33%
/** 섹션 노출 최소 참여자 수 */
const MIN_PARTICIPANTS = 3;

export interface MyExtremeAnswer {
  electionId: string;
  questionTitle: string;
  myOptionTitle: string;
  pickedCount: number;
  totalCount: number;
  /** pickedCount / totalCount — 오름차순 정렬용 */
  ratio: number;
}

/**
 * 내가 답한 옵션 중 그룹 내 선택 비율이 낮은 소수답 Top 3.
 *
 * 스펙(2026-04-25):
 * - 참여자 수 < 3이면 빈 배열 반환 (섹션 숨김 트리거).
 * - ratio ≤ 1/3 인 항목만 포함. 임계 초과 항목만 있으면 빈 배열.
 * - 정렬: ratio 오름차순, 동률이면 pickedCount 오름차순.
 */
export function getMyExtremeAnswers(
  result: GroupCompareResult,
  currentUserId: string
): MyExtremeAnswer[] {
  const members = result.members ?? [];
  if (members.length < MIN_PARTICIPANTS) {
    return [];
  }

  const me = members.find((m) => m.userId === currentUserId);
  if (!me) {
    return [];
  }

  const myAnswers = me.answers ?? [];
  const questionStats = result.questionStats ?? [];

  const items: MyExtremeAnswer[] = [];

  for (const ans of myAnswers) {
    const stat = questionStats.find((s) => s.electionId === ans.electionId);
    if (!stat) {
      continue;
    }
    const option = (stat.optionStats ?? []).find((o) => o.electionItemId === ans.electionItemId);
    if (!option) {
      continue;
    }

    let pickedCount = 0;
    for (const m of members) {
      const ma = (m.answers ?? []).find((a) => a.electionId === ans.electionId);
      if (ma && ma.electionItemId === ans.electionItemId) {
        pickedCount++;
      }
    }
    const totalCount = members.filter((m) =>
      (m.answers ?? []).some((a) => a.electionId === ans.electionId)
    ).length;
    if (totalCount === 0) {
      continue;
    }

    const ratio = pickedCount / totalCount;
    if (ratio > MINORITY_THRESHOLD) {
      continue; // 소수답 아님
    }

    items.push({
      electionId: ans.electionId,
      questionTitle: stat.title ?? '',
      myOptionTitle: option.title ?? '',
      pickedCount,
      totalCount,
      ratio,
    });
  }

  items.sort((a, b) => a.ratio - b.ratio || a.pickedCount - b.pickedCount);
  return items.slice(0, 3);
}
