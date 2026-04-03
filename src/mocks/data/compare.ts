// src/mocks/data/compare.ts
import { getPopularityByScore } from '@/constants/bundle';
import {
  bundleAnswerStore,
  bundleVoteStats,
  mockBundleDetails,
  mockBundleElections,
  seedSecondUser,
} from '@/mocks/data/bundles';
import type { CompareLink, CompareResult, CreateCompareLinkResponse } from '@/types/compare';

/** 비교 링크 인메모리 저장소 */
interface StoredCompareLink {
  token: string;
  type: 'ONE_TO_ONE' | 'GROUP';
  bundleSlug: string;
  creatorUserId: string;
  creatorNickname: string;
  participantUserId: string | null;
  participantNickname: string | null;
  status: 'WAITING' | 'COMPLETED' | 'CLOSED';
}

const compareLinkStore = new Map<string, StoredCompareLink>();

// 시드: mock-user-1이 love-values에 대한 1:1 비교 링크 생성
seedSecondUser();

// abc123: 내가 보낸 링크 (생성자=mock-user-1, 참여완료)
const seedLink: StoredCompareLink = {
  token: 'abc123',
  type: 'ONE_TO_ONE',
  bundleSlug: 'love-values',
  creatorUserId: 'mock-user-1',
  creatorNickname: '웅이',
  participantUserId: 'mock-user-2',
  participantNickname: '수진',
  status: 'COMPLETED',
};
compareLinkStore.set('abc123', seedLink);

// invite1: 내가 받은 링크 (생성자=mock-user-2, 참여완료)
const seedInviteCompleted: StoredCompareLink = {
  token: 'invite1',
  type: 'ONE_TO_ONE',
  bundleSlug: 'love-values',
  creatorUserId: 'mock-user-2',
  creatorNickname: '수진',
  participantUserId: 'mock-user-1',
  participantNickname: '웅이',
  status: 'COMPLETED',
};
compareLinkStore.set('invite1', seedInviteCompleted);

// invite2: 내가 받은 링크 — 아직 번들 미완료 상태 테스트용
const seedInviteWaiting: StoredCompareLink = {
  token: 'invite2',
  type: 'ONE_TO_ONE',
  bundleSlug: 'marriage-values',
  creatorUserId: 'mock-user-2',
  creatorNickname: '수진',
  participantUserId: null,
  participantNickname: null,
  status: 'WAITING',
};
compareLinkStore.set('invite2', seedInviteWaiting);

// waiting1: 내가 보낸 링크 — 상대방 아직 미참여 (생성자 대기 화면 테스트)
const seedCreatorWaiting: StoredCompareLink = {
  token: 'waiting1',
  type: 'ONE_TO_ONE',
  bundleSlug: 'love-values',
  creatorUserId: 'mock-user-1',
  creatorNickname: '웅이',
  participantUserId: null,
  participantNickname: null,
  status: 'WAITING',
};
compareLinkStore.set('waiting1', seedCreatorWaiting);

/** 토큰 생성 */
function generateToken(): string {
  return Math.random().toString(36).substring(2, 10);
}

/** 비교 링크 생성 (항상 새 토큰 발급) */
export function createCompareLink(
  userId: string,
  nickname: string,
  bundleSlug: string,
  type: 'ONE_TO_ONE' | 'GROUP'
): CreateCompareLinkResponse {
  const token = generateToken();
  compareLinkStore.set(token, {
    token,
    type,
    bundleSlug,
    creatorUserId: userId,
    creatorNickname: nickname,
    participantUserId: null,
    participantNickname: null,
    status: 'WAITING',
  });
  return { token };
}

/** 비교 링크 조회 */
export function getCompareLink(token: string, currentUserId: string): CompareLink | null {
  const link = compareLinkStore.get(token);
  if (!link) {
    return null;
  }

  const detail = mockBundleDetails[link.bundleSlug];
  const myCompleted = !!bundleAnswerStore.get(`${currentUserId}_${link.bundleSlug}`);

  // 생성자의 대중성 캐릭터 이미지 계산
  const creatorAnswers = bundleAnswerStore.get(`${link.creatorUserId}_${link.bundleSlug}`);
  const elections = mockBundleElections[link.bundleSlug];
  let creatorImageUrl: string | null = null;
  if (creatorAnswers && elections) {
    let totalRate = 0;
    let matched = 0;
    for (const answer of creatorAnswers) {
      const stats = bundleVoteStats.get(answer.electionId);
      if (stats) {
        const total = stats.optionACount + stats.optionBCount;
        if (total > 0) {
          const rate =
            answer.selected === 'A'
              ? Math.round((stats.optionACount / total) * 100)
              : Math.round((stats.optionBCount / total) * 100);
          totalRate += rate;
          matched++;
        }
      }
    }
    const score = matched > 0 ? Math.round(totalRate / matched) : 50;
    const popularity = getPopularityByScore(score);
    creatorImageUrl = popularity.imagePath;
  }

  return {
    token: link.token,
    type: link.type,
    bundleSlug: link.bundleSlug,
    bundleTitle: detail?.title ?? link.bundleSlug,
    creatorNickname: link.creatorNickname,
    creatorImageUrl,
    participantNickname: link.participantNickname,
    isCreator: link.creatorUserId === currentUserId,
    isParticipant: link.participantUserId === currentUserId,
    myBundleCompleted: myCompleted,
    compareReady: link.status === 'COMPLETED',
    status: link.status,
    questionCount: detail?.questionCount ?? 5,
    participantCount: detail?.participantCount ?? 0,
  };
}

/** 비교 링크에 참여 */
export function joinCompareLink(
  token: string,
  userId: string,
  nickname: string
): { success: boolean; message: string } {
  const link = compareLinkStore.get(token);
  if (!link) {
    return { success: false, message: '링크를 찾을 수 없습니다' };
  }
  if (link.creatorUserId === userId) {
    return { success: false, message: '자신의 링크에 참여할 수 없습니다' };
  }
  if (link.participantUserId && link.participantUserId !== userId) {
    return { success: false, message: '이미 다른 사람이 참여한 링크입니다' };
  }

  // 번들 완료 확인
  if (!bundleAnswerStore.has(`${userId}_${link.bundleSlug}`)) {
    return { success: false, message: '번들을 먼저 완료해주세요' };
  }

  link.participantUserId = userId;
  link.participantNickname = nickname;
  link.status = 'COMPLETED';
  return { success: true, message: '참여 완료' };
}

/** 1:1 비교 결과 생성 */
export function getCompareResult(token: string, currentUserId: string): CompareResult | null {
  const link = compareLinkStore.get(token);
  if (!link || link.status !== 'COMPLETED') {
    return null;
  }
  if (!link.participantUserId) {
    return null;
  }

  const elections = mockBundleElections[link.bundleSlug];
  if (!elections) {
    return null;
  }

  const detail = mockBundleDetails[link.bundleSlug];

  const creatorAnswers = bundleAnswerStore.get(`${link.creatorUserId}_${link.bundleSlug}`);
  const participantAnswers = bundleAnswerStore.get(`${link.participantUserId}_${link.bundleSlug}`);
  if (!creatorAnswers || !participantAnswers) {
    return null;
  }

  // 현재 유저 기준으로 me/target 설정
  const isCreator = currentUserId === link.creatorUserId;
  const meAnswers = isCreator ? creatorAnswers : participantAnswers;
  const targetAnswers = isCreator ? participantAnswers : creatorAnswers;
  const meNickname = isCreator ? link.creatorNickname : link.participantNickname!;
  const targetNickname = isCreator ? link.participantNickname! : link.creatorNickname;

  // 일치 수 계산
  let matchCount = 0;
  for (const me of meAnswers) {
    const target = targetAnswers.find((t) => t.electionId === me.electionId);
    if (target && me.selected === target.selected) {
      matchCount++;
    }
  }

  const seedRatios = [62, 45, 71, 38, 55, 48, 66, 33, 57, 42];

  return {
    bundleSlug: link.bundleSlug,
    bundleTitle: detail?.title ?? link.bundleSlug,
    totalQuestions: elections.length,
    me: {
      nickname: meNickname,
      answers: meAnswers.map((a) => ({ electionId: a.electionId, selected: a.selected })),
    },
    target: {
      nickname: targetNickname,
      answers: targetAnswers.map((a) => ({ electionId: a.electionId, selected: a.selected })),
    },
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
      };
    }),
    matchCount,
    matchRate: Math.round((matchCount / elections.length) * 100),
    gradeDistribution: mockGradeDistributions[link.bundleSlug] ?? defaultGradeDistribution,
  };
}

/** 번들별 커플 등급 분포 mock 데이터 */
const mockGradeDistributions: Record<string, CompareResult['gradeDistribution']> = {
  'love-values': { S: 8, A: 18, B: 35, C: 27, D: 12 },
  'marriage-values': { S: 5, A: 15, B: 32, C: 30, D: 18 },
};

const defaultGradeDistribution: CompareResult['gradeDistribution'] = {
  S: 7,
  A: 20,
  B: 33,
  C: 28,
  D: 12,
};
