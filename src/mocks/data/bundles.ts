import type { BundleDetail, BundleElection, BundleMyResult } from '@/types/bundle';

export const mockBundleDetails: Record<string, BundleDetail> = {
  'love-values': {
    bundleId: 1,
    slug: 'love-values',
    title: '연애 가치관 테스트',
    subtitle: '우리 연애 스타일 얼마나 통할까?',
    description:
      '연애에서 중요한 5가지 질문으로 나와 상대방의 가치관을 비교해보세요. 썸부터 싸움 해결까지, 우리는 얼마나 맞을까요?',
    category: '연애',
    questionCount: 5,
    status: 'ACTIVE',
    imageUrl: undefined,
    participantCount: 247,
  },
  'marriage-values': {
    bundleId: 2,
    slug: 'marriage-values',
    title: '결혼 가치관 테스트',
    subtitle: '우리 결혼하면 잘 살 수 있을까?',
    description:
      '혼수, 맞벌이, 신혼집, 명절, 교육까지. 결혼 전에 꼭 맞춰봐야 할 5가지 가치관을 비교합니다.',
    category: '결혼',
    questionCount: 5,
    status: 'ACTIVE',
    imageUrl: undefined,
    participantCount: 183,
  },
};

export const mockBundleElections: Record<string, BundleElection[]> = {
  'love-values': [
    { electionId: 'le-1', title: '썸 탈 때', optionA: '먼저 연락', optionB: '기다리기', order: 1 },
    {
      electionId: 'le-2',
      title: '연인의 전 애인 사진',
      optionA: '지워야 함',
      optionB: '상관없음',
      order: 2,
    },
    { electionId: 'le-3', title: '기념일', optionA: '챙기는 편', optionB: '별로', order: 3 },
    { electionId: 'le-4', title: '연인의 이성 친구 만남', optionA: 'OK', optionB: 'NO', order: 4 },
    {
      electionId: 'le-5',
      title: '싸우면',
      optionA: '바로 풀기',
      optionB: '혼자 정리하고 대화',
      order: 5,
    },
  ],
  'marriage-values': [
    { electionId: 'me-1', title: '혼수 비용', optionA: '각자 알아서', optionB: '반반', order: 1 },
    {
      electionId: 'me-2',
      title: '결혼 후 경제활동',
      optionA: '맞벌이',
      optionB: '한쪽이 집에',
      order: 2,
    },
    { electionId: 'me-3', title: '신혼집', optionA: '매매', optionB: '전세', order: 3 },
    { electionId: 'me-4', title: '시댁·처가 명절', optionA: '매년', optionB: '격년', order: 4 },
    { electionId: 'me-5', title: '아이 교육', optionA: '사교육', optionB: '자율', order: 5 },
  ],
};

/** 번들 답변 인메모리 저장소 (MSW용) */
export const bundleAnswerStore = new Map<
  string,
  Array<{ electionId: string; selected: 'A' | 'B' }>
>();

/** 질문별 투표 집계 (MSW용) */
export const bundleVoteStats = new Map<string, { optionACount: number; optionBCount: number }>();

export function recordBundleAnswers(
  userId: string,
  slug: string,
  answers: Array<{ electionId: string; selected: 'A' | 'B' }>
) {
  bundleAnswerStore.set(`${userId}_${slug}`, answers);
  for (const answer of answers) {
    const stats = bundleVoteStats.get(answer.electionId) ?? { optionACount: 0, optionBCount: 0 };
    if (answer.selected === 'A') {
      stats.optionACount++;
    } else {
      stats.optionBCount++;
    }
    bundleVoteStats.set(answer.electionId, stats);
  }
}

export function getBundleResult(userId: string, slug: string): BundleMyResult | null {
  const answers = bundleAnswerStore.get(`${userId}_${slug}`);
  if (!answers) {
    return null;
  }

  const elections = mockBundleElections[slug] as BundleElection[] | undefined;
  if (!elections) {
    return null;
  }

  const detail = mockBundleDetails[slug] as BundleDetail | undefined;

  return {
    bundleSlug: slug,
    bundleTitle: detail?.title ?? slug,
    totalQuestions: elections.length,
    myAnswers: answers.map((a) => {
      const election = elections.find((e) => e.electionId === a.electionId);
      return {
        electionId: a.electionId,
        title: election?.title ?? '',
        optionA: election?.optionA ?? '',
        optionB: election?.optionB ?? '',
        selected: a.selected,
      };
    }),
    questionStats: elections.map((e) => {
      const stats = bundleVoteStats.get(e.electionId) ?? { optionACount: 0, optionBCount: 0 };
      const total = stats.optionACount + stats.optionBCount;
      const seedRatios = [62, 45, 71, 38, 55, 48, 66, 33, 57, 42];
      const baseA = total > 0 ? stats.optionACount : (seedRatios[e.order - 1] ?? 50);
      const baseB = total > 0 ? stats.optionBCount : 100 - baseA;
      const sumAB = baseA + baseB;
      return {
        electionId: e.electionId,
        optionARate: Math.round((baseA / sumAB) * 100),
        optionBRate: Math.round((baseB / sumAB) * 100),
        totalVotes: total > 0 ? total : 80 + e.order * 15,
      };
    }),
  };
}
