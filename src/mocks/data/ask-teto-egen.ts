// src/mocks/data/ask-teto-egen.ts
//
// H3 "테토/에겐" mock 데이터 + 시나리오 분기 헬퍼.
// URL 쿼리 ?mock=empty|hit|miss|tie 로 결과 시나리오 전환.

import type {
  TetoEgenAnswer,
  TetoEgenFriendVotes,
  TetoEgenVoter,
  MyTetoEgenLinkResponse,
} from '@/types/ask-teto-egen';

export type MockScenario = 'default' | 'empty' | 'hit' | 'miss' | 'tie';

export const SHARE_BASE_URL = 'https://hotpick.votebox.kr/ask/teto-egen/friend';

// 본인이 만든 링크 (MSW 환경 전역 상태)
export type MockLinkRecord = {
  token: string;
  ownerUserId: number;
  displayName: string;
  selfAnswer: TetoEgenAnswer;
  selfPrediction: TetoEgenAnswer;
  createdAt: string;
};

let myLink: MockLinkRecord | null = null;

export const tetoEgenStore = {
  getMyLink: () => myLink,
  setMyLink: (record: MockLinkRecord) => {
    myLink = record;
  },
  clearMyLink: () => {
    myLink = null;
  },
};

// 친구 N명 mock 닉네임
const friendPool = [
  { userId: 'u-2001', displayName: '다림' },
  { userId: 'u-2002', displayName: '지영' },
  { userId: 'u-2003', displayName: '수비' },
  { userId: 'u-2004', displayName: '민수' },
  { userId: 'u-2005', displayName: '현우' },
  { userId: 'u-2006', displayName: '지원' },
  { userId: 'u-2007', displayName: '영훈' },
  { userId: 'u-2008', displayName: '태규' },
];

const baseVotedAt = (idx: number) =>
  new Date(Date.now() - (idx + 1) * 1000 * 60 * 17).toISOString();

const buildVoters = (tetoCount: number, egenCount: number): TetoEgenVoter[] => {
  const voters: TetoEgenVoter[] = [];
  for (let i = 0; i < tetoCount; i++) {
    const f = friendPool[i % friendPool.length];
    voters.push({
      userId: f.userId,
      displayName: f.displayName,
      vote: 'TETO',
      votedAt: baseVotedAt(i),
    });
  }
  for (let i = 0; i < egenCount; i++) {
    const f = friendPool[(tetoCount + i) % friendPool.length];
    voters.push({
      userId: f.userId,
      displayName: f.displayName,
      vote: 'EGEN',
      votedAt: baseVotedAt(tetoCount + i),
    });
  }
  return voters;
};

const buildFriendVotes = (tetoCount: number, egenCount: number): TetoEgenFriendVotes => ({
  total: tetoCount + egenCount,
  tetoCount,
  egenCount,
  voters: buildVoters(tetoCount, egenCount),
});

// 시나리오별 친구 평가 집계
export const getFriendVotesByScenario = (
  scenario: MockScenario,
  selfAnswer: TetoEgenAnswer
): TetoEgenFriendVotes => {
  switch (scenario) {
    case 'empty':
      return buildFriendVotes(0, 0);
    case 'hit':
      // 자기 평가와 다수파 일치
      return selfAnswer === 'TETO' ? buildFriendVotes(5, 3) : buildFriendVotes(3, 5);
    case 'miss':
      // 자기 평가와 다수파 불일치
      return selfAnswer === 'TETO' ? buildFriendVotes(2, 6) : buildFriendVotes(6, 2);
    case 'tie':
      return buildFriendVotes(4, 4);
    case 'default':
    default:
      return buildFriendVotes(5, 3);
  }
};

// /me 응답 빌더
export const buildMyLinkResponse = (scenario: MockScenario): MyTetoEgenLinkResponse | null => {
  // mock 시나리오(?mock=hit|miss|empty|tie)로 결과 화면을 직접 진입할 때는
  // POST /links 없이도 시드 응답을 반환해 디자인 점검이 가능하도록 처리.
  if (!myLink) {
    if (scenario === 'default') {
      return null;
    }
    const seedSelfAnswer: TetoEgenAnswer = 'TETO';
    return {
      token: 'mock-token',
      shareUrl: `${SHARE_BASE_URL}/mock-token`,
      displayName: '웅일',
      selfAnswer: seedSelfAnswer,
      selfPrediction: 'EGEN',
      friendVotes: getFriendVotesByScenario(scenario, seedSelfAnswer),
    };
  }
  return {
    token: myLink.token,
    shareUrl: `${SHARE_BASE_URL}/${myLink.token}`,
    displayName: myLink.displayName,
    selfAnswer: myLink.selfAnswer,
    selfPrediction: myLink.selfPrediction,
    friendVotes: getFriendVotesByScenario(scenario, myLink.selfAnswer),
  };
};

// 카운트 시나리오
export const getCountByScenario = (scenario: MockScenario): number => {
  switch (scenario) {
    case 'empty':
      return 0;
    case 'hit':
    case 'miss':
    case 'tie':
      return 12_900;
    default:
      return 12_847;
  }
};

// /friend/{token} mock — 토큰별 표시이름
const friendOwnerByToken: Record<string, { ownerUserId: number; displayName: string }> = {
  // 본인이 만든 링크는 동적으로 처리, 외부 가짜 토큰만 사전 등록
  'demo-friend': { ownerUserId: 9999, displayName: '데모' },
};

export const getFriendMeta = (
  token: string,
  currentUserId: number | null
): { displayName: string; isOwn: boolean } | null => {
  if (myLink && myLink.token === token) {
    return {
      displayName: myLink.displayName,
      isOwn: currentUserId === myLink.ownerUserId,
    };
  }
  const seeded = friendOwnerByToken[token];
  if (seeded) {
    return {
      displayName: seeded.displayName,
      isOwn: currentUserId === seeded.ownerUserId,
    };
  }
  return null;
};

// 친구 평가 제출 store (시나리오별 응답에 본인 답을 합쳐서 반환)
const submittedVotes: Record<string, Record<number, TetoEgenAnswer>> = {};

export const recordFriendVote = (token: string, userId: number, vote: TetoEgenAnswer): void => {
  if (!submittedVotes[token]) {
    submittedVotes[token] = {};
  }
  submittedVotes[token][userId] = vote;
};

export const hasFriendVoted = (token: string, userId: number): TetoEgenAnswer | null =>
  submittedVotes[token]?.[userId] ?? null;

export const buildFriendVoteResultResponse = (
  token: string,
  myVote: TetoEgenAnswer,
  scenario: MockScenario
): TetoEgenFriendVotes => {
  // 본인 답을 시나리오 기반 집계에 더함
  const ownerSelfAnswer = myLink && myLink.token === token ? myLink.selfAnswer : 'TETO';
  const base = getFriendVotesByScenario(scenario, ownerSelfAnswer);
  // myVote 본인 칩이 voters 맨 위에 오게
  const myVoter: TetoEgenVoter = {
    userId: 'me',
    displayName: '나',
    vote: myVote,
    votedAt: new Date().toISOString(),
  };
  return {
    total: base.total + 1,
    tetoCount: base.tetoCount + (myVote === 'TETO' ? 1 : 0),
    egenCount: base.egenCount + (myVote === 'EGEN' ? 1 : 0),
    voters: [myVoter, ...base.voters],
  };
};
