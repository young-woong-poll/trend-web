// src/types/ask-teto-egen.ts
//
// H3 검증 사이클 1차 콘텐츠 "테토/에겐" 도메인 타입.
// 관련 스펙: docs/api/ask-teto-egen-api-spec.md

export type TetoEgenAnswer = 'TETO' | 'EGEN';
// 사용자가 예상한 친구들의 시선. selfAnswer와 같은 도메인 값을 그대로 사용.
// UI에서 "친구들도 ㅇㅇ라고 생각할까?" → 그렇다=selfAnswer와 동일, 아니다=반대 값으로 FE 변환.
export type TetoEgenPrediction = TetoEgenAnswer;

export type TetoEgenVoter = {
  userId: string;
  displayName: string;
  vote: TetoEgenAnswer;
  votedAt: string;
};

export type TetoEgenFriendVotes = {
  total: number;
  tetoCount: number;
  egenCount: number;
  voters: TetoEgenVoter[];
};

// API: GET /api/v1/ask/teto-egen/count
export type TetoEgenCountResponse = {
  count: number;
};

// API: POST /api/v1/ask/teto-egen/links
export type CreateTetoEgenLinkRequest = {
  displayName: string;
  selfAnswer: TetoEgenAnswer;
  selfPrediction: TetoEgenPrediction;
};

export type CreateTetoEgenLinkResponse = {
  token: string;
  shareUrl: string;
};

// API: GET /api/v1/ask/teto-egen/links/me
export type MyTetoEgenLinkResponse = {
  token: string;
  shareUrl: string;
  displayName: string;
  selfAnswer: TetoEgenAnswer;
  selfPrediction: TetoEgenPrediction;
  friendVotes: TetoEgenFriendVotes;
};

// API: GET /api/v1/ask/teto-egen/friend/{token}
export type FriendTetoEgenMetaResponse = {
  token: string;
  displayName: string;
  isOwn: boolean;
};

// API: POST /api/v1/ask/teto-egen/friend/{token}/vote
export type SubmitFriendVoteRequest = {
  vote: TetoEgenAnswer;
};

export type SubmitFriendVoteResponse = {
  myVote: TetoEgenAnswer;
  ownerDisplayName: string;
  friendVotes: TetoEgenFriendVotes;
};

export type TetoEgenErrorCode =
  | 'LINK_ALREADY_EXISTS'
  | 'CANNOT_VOTE_SELF'
  | 'ALREADY_VOTED'
  | 'LINK_NOT_FOUND'
  | 'NOT_LOGGED_IN';
