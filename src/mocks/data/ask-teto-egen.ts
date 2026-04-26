// src/mocks/data/ask-teto-egen.ts
//
// H3 "테토/에겐" mock 데이터.

import type {
  TetoEgenAnswer,
  TetoEgenFriendVotes,
  TetoEgenVoter,
  MyTetoEgenLinkResponse,
} from '@/types/ask-teto-egen';

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
  { userId: 'u-2009', displayName: '하늘' },
  { userId: 'u-2010', displayName: '시우' },
  { userId: 'u-2011', displayName: '은채' },
  { userId: 'u-2012', displayName: '도현' },
  { userId: 'u-2013', displayName: '서윤' },
  { userId: 'u-2014', displayName: '재민' },
  { userId: 'u-2015', displayName: '예린' },
  { userId: 'u-2016', displayName: '현서' },
  { userId: 'u-2017', displayName: '주안' },
  { userId: 'u-2018', displayName: '나윤' },
  { userId: 'u-2019', displayName: '강민' },
  { userId: 'u-2020', displayName: '소율' },
  { userId: 'u-2021', displayName: '지호' },
  { userId: 'u-2022', displayName: '아인' },
  { userId: 'u-2023', displayName: '준영' },
  { userId: 'u-2024', displayName: '윤서' },
  { userId: 'u-2025', displayName: '하준' },
  { userId: 'u-2026', displayName: '예준' },
  { userId: 'u-2027', displayName: '리아' },
  { userId: 'u-2028', displayName: '이준' },
  { userId: 'u-2029', displayName: '채원' },
  { userId: 'u-2030', displayName: '동현' },
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

// 기본 친구 평가 집계 — TETO 15 / EGEN 9 (테스트 친화)
export const getDefaultFriendVotes = (): TetoEgenFriendVotes => buildFriendVotes(15, 9);

// /me 응답 빌더 — myLink 없으면 null (404), 있으면 그 데이터 + 기본 친구 집계
export const buildMyLinkResponse = (): MyTetoEgenLinkResponse | null => {
  if (!myLink) {
    return null;
  }
  return {
    token: myLink.token,
    shareUrl: `${SHARE_BASE_URL}/${myLink.token}`,
    displayName: myLink.displayName,
    selfAnswer: myLink.selfAnswer,
    selfPrediction: myLink.selfPrediction,
    friendVotes: getDefaultFriendVotes(),
  };
};

// 카운트 (mock 고정값)
export const getCountByScenario = (): number => 12_847;

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

// 친구 평가 제출 store
const submittedVotes: Record<string, Record<number, TetoEgenAnswer>> = {};

export const recordFriendVote = (token: string, userId: number, vote: TetoEgenAnswer): void => {
  if (!submittedVotes[token]) {
    submittedVotes[token] = {};
  }
  submittedVotes[token][userId] = vote;
};

export const hasFriendVoted = (token: string, userId: number): TetoEgenAnswer | null =>
  submittedVotes[token]?.[userId] ?? null;

// owner(공유자)의 자기 평가 selfAnswer. 친구 평가 응답에 포함된다.
// myLink가 있고 토큰이 일치하면 해당 selfAnswer, 외부 시드(demo-friend 등)는 'TETO' 기본값.
export const getOwnerSelfAnswer = (token: string): TetoEgenAnswer =>
  myLink && myLink.token === token ? myLink.selfAnswer : 'TETO';

export const buildFriendVoteResultResponse = (
  token: string,
  myVote: TetoEgenAnswer
): TetoEgenFriendVotes => {
  const base = getDefaultFriendVotes();
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
