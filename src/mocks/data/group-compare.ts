// src/mocks/data/group-compare.ts
import { bundleAnswerStore, mockBundleElections, mockBundleDetails } from '@/mocks/data/bundles';
import type { GroupCompareResult } from '@/types/group-compare';

/** Mock 성별/생년 데이터 */
const MOCK_PROFILES: Record<string, { gender: 'MALE' | 'FEMALE'; birthYear: number }> = {
  'mock-user-1': { gender: 'MALE', birthYear: 1995 },
  'mock-user-2': { gender: 'FEMALE', birthYear: 1997 },
  'mock-user-3': { gender: 'MALE', birthYear: 1993 },
  'mock-user-4': { gender: 'FEMALE', birthYear: 1998 },
  'mock-user-5': { gender: 'MALE', birthYear: 1996 },
};

/** 대인원 mock 프로필 생성 (시드 기반 유사 랜덤) */
function getMockProfile(userId: string): { gender: 'MALE' | 'FEMALE'; birthYear: number } {
  if (MOCK_PROFILES[userId]) {
    return MOCK_PROFILES[userId];
  }
  const num = parseInt(userId.replace('mock-user-', ''), 10) || 0;
  return {
    gender: num % 2 === 0 ? 'FEMALE' : 'MALE',
    birthYear: 1990 + (num % 12),
  };
}

/**
 * 그룹 비교 결과 생성
 */
export function getGroupCompareResult(
  bundleSlug: string,
  groupName: string,
  memberInfos: Array<{
    userId: string;
    nickname: string;
    displayName?: string;
    displayProfileColor?: string;
  }>,
  currentUserId: string,
  showGenderContent: boolean,
  creatorUserId: string,
  isClosed: boolean
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
      const profile = getMockProfile(info.userId);
      return {
        userId: info.userId,
        nickname: info.nickname,
        displayName: info.displayName ?? info.nickname,
        displayProfileColor: info.displayProfileColor,
        gender: profile.gender,
        birthYear: profile.birthYear,
        answers: answers.map((a) => ({ electionId: a.electionId, selected: a.selected })),
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  if (members.length < 1) {
    return null;
  }

  // 질문별 대중 투표 수 — 편차를 크게 줘서 대중성 점수 분포를 넓힘
  const seedRatios = [85, 25, 78, 30, 72];

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
    myUserId: currentUserId,
    myBundleCompleted: bundleAnswerStore.has(`${currentUserId}_${bundleSlug}`),
    categoryCode: detail.categoryCode,
    showGenderContent,
    isClosed,
    creatorUserId,
    members,
    // seedRatios는 "전체 대중의 투표 비율"을 시뮬레이션 (그룹 멤버 투표와 무관)
    questionStats: elections.map((e, i) => {
      const aRate = seedRatios[i] ?? 50;
      const totalVotes = 500 + i * 100;
      return {
        electionId: e.electionId,
        title: e.title,
        optionA: e.optionA,
        optionB: e.optionB,
        optionACount: Math.round((aRate / 100) * totalVotes),
        optionBCount: Math.round(((100 - aRate) / 100) * totalVotes),
        axis: axisMap[e.electionId] ?? null,
      };
    }),
  };
}
