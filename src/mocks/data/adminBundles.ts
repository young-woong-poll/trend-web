// src/mocks/data/adminBundles.ts
import { mockBundleDetails, mockBundleElections, bundleVoteStats } from '@/mocks/data/bundles';
import { compareLinkStore } from '@/mocks/data/compare';
import type {
  AdminBundleSummary,
  AdminBundleStats,
  AdminCompareLink,
  AdminQuestionStat,
  DailyStat,
} from '@/types/admin-bundle';

/** 번들 목록 생성 — mockBundleDetails에서 파생 */
export function getAdminBundleList(): AdminBundleSummary[] {
  return Object.values(mockBundleDetails)
    .filter((b) => b.categoryCode) // 등급 테스트용(categoryCode 없음) 제외
    .map((b) => {
      // compareLinkStore에서 해당 번들의 링크 수 집계
      let compareLinkCount = 0;
      compareLinkStore.forEach((link) => {
        if (link.bundleSlug === b.slug) {
          compareLinkCount++;
        }
      });

      return {
        bundleId: b.bundleId,
        hotpickId: b.bundleId + 100, // TODO: BE 구현 시 실제 hotpickId로 교체
        slug: b.slug,
        title: b.title,
        category: b.category,
        categoryCode: b.categoryCode!,
        questionCount: b.questionCount,
        participantCount: b.participantCount,
        compareLinkCount,
        status: b.status as 'ACTIVE' | 'CLOSED',
        createdAt: '2026-03-15T09:00:00Z',
      };
    });
}

/** 일별 참여 통계 mock 생성 (최근 14일) */
function generateDailyStats(): DailyStat[] {
  const stats: DailyStat[] = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    stats.push({
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 80) + 10,
    });
  }
  return stats;
}

/** 번들 상세 통계 생성 */
export function getAdminBundleStats(slug: string): AdminBundleStats | null {
  const bundle = mockBundleDetails[slug];
  if (!bundle || !bundle.categoryCode) {
    return null;
  }

  const elections = mockBundleElections[slug] ?? [];

  // 비교 링크 집계
  const links: AdminCompareLink[] = [];
  compareLinkStore.forEach((link) => {
    if (link.bundleSlug === slug) {
      links.push({
        token: link.token,
        type: link.type,
        creatorNickname: link.creatorNickname,
        groupName: link.groupName,
        memberCount: link.groupMembers.length,
        isClosed: link.isClosed,
        createdAt: '2026-04-05T14:30:00Z',
      });
    }
  });

  const oneToOneCount = links.filter((l) => l.type === 'ONE_TO_ONE').length;
  const groupCount = links.filter((l) => l.type === 'GROUP').length;
  const activeGroupCount = links.filter((l) => l.type === 'GROUP' && !l.isClosed).length;

  // 질문별 통계
  const seedRatios = [62, 45, 71, 38, 55];
  const questionStats: AdminQuestionStat[] = elections.map((e, i) => {
    const stats = bundleVoteStats.get(e.electionId) ?? { optionACount: 0, optionBCount: 0 };
    const total = stats.optionACount + stats.optionBCount;
    const aCount = total > 0 ? stats.optionACount : (seedRatios[i] ?? 50);
    const bCount = total > 0 ? stats.optionBCount : 100 - (seedRatios[i] ?? 50);
    const sum = aCount + bCount;
    return {
      electionId: e.electionId,
      title: e.title,
      optionA: e.optionA,
      optionB: e.optionB,
      optionACount: aCount,
      optionBCount: bCount,
      optionARate: sum > 0 ? Math.round((aCount / sum) * 1000) / 10 : 50,
      optionBRate: sum > 0 ? Math.round((bCount / sum) * 1000) / 10 : 50,
    };
  });

  return {
    bundleId: bundle.bundleId,
    slug: bundle.slug,
    title: bundle.title,
    hotpickId: bundle.bundleId + 100,
    categoryCode: bundle.categoryCode!,
    status: bundle.status as 'ACTIVE' | 'CLOSED',
    participation: {
      totalParticipants: bundle.participantCount,
      completionRate: 92.3,
      dailyStats: generateDailyStats(),
    },
    compareLinks: {
      totalCount: links.length,
      oneToOneCount,
      groupCount,
      activeGroupCount,
      links,
    },
    questionStats,
  };
}
