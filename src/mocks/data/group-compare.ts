// src/mocks/data/group-compare.ts
import {
  bundleAnswerStore,
  bundleVoteStats,
  mockBundleElections,
  mockBundleDetails,
} from '@/mocks/data/bundles';
import type { GroupCompareResult } from '@/types/group-compare';

/**
 * 그룹 비교 결과 생성
 */
export function getGroupCompareResult(
  bundleSlug: string,
  groupName: string,
  memberInfos: Array<{ userId: string; nickname: string }>,
  _currentUserId: string
): GroupCompareResult | null {
  const elections = mockBundleElections[bundleSlug];
  const detail = mockBundleDetails[bundleSlug];
  if (!elections || !detail) {
    return null;
  }

  const members = memberInfos
    .map((info) => {
      const answers = bundleAnswerStore.get(`${info.userId}_${bundleSlug}`);
      if (!answers) {
        return null;
      }
      return {
        userId: info.userId,
        nickname: info.nickname,
        answers: answers.map((a) => ({ electionId: a.electionId, selected: a.selected })),
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  if (members.length < 2) {
    return null;
  }

  // 그룹 싱크율 계산
  let totalMatchRate = 0;
  let pairCount = 0;
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      let matchCount = 0;
      for (const ansA of members[i].answers) {
        const ansB = members[j].answers.find((b) => b.electionId === ansA.electionId);
        if (ansB && ansA.selected === ansB.selected) {
          matchCount++;
        }
      }
      totalMatchRate += (matchCount / elections.length) * 100;
      pairCount++;
    }
  }
  const groupSyncRate = pairCount > 0 ? Math.round(totalMatchRate / pairCount) : 0;

  const seedRatios = [62, 45, 71, 38, 55];

  // love-values 축 배정: le-1,le-3,le-5 → X축, le-2,le-4 → Y축
  const axisMap: Record<string, 'X' | 'Y' | null> = {
    'le-1': 'X',
    'le-2': 'Y',
    'le-3': 'X',
    'le-4': 'Y',
    'le-5': 'X',
  };

  return {
    bundleSlug,
    bundleTitle: detail.title,
    totalQuestions: elections.length,
    groupName,
    memberCount: members.length,
    members,
    questionStats: elections.map((e, i) => {
      const stats = bundleVoteStats.get(e.electionId) ?? { optionACount: 0, optionBCount: 0 };
      const total = stats.optionACount + stats.optionBCount;
      const seedA = seedRatios[i] ?? 50;
      const seedB = 100 - seedA;
      return {
        electionId: e.electionId,
        title: e.title,
        optionA: e.optionA,
        optionB: e.optionB,
        optionACount: total > 0 ? stats.optionACount : seedA,
        optionBCount: total > 0 ? stats.optionBCount : seedB,
        axis: axisMap[e.electionId] ?? null,
      };
    }),
    groupSyncRate,
  };
}
