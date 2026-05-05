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
// 로그인 사용자가 이미 평가한 경우 myVote/ownerSelfAnswer/friendVotes를 함께 반환해
// 클라이언트가 평가 화면을 건너뛰고 즉시 결과 화면을 그릴 수 있도록 한다.
export type FriendTetoEgenMetaResponse = {
  token: string;
  ownerDisplayName: string;
  isOwn: boolean;
  myVote?: TetoEgenAnswer;
  ownerSelfAnswer?: TetoEgenAnswer;
  friendVotes?: TetoEgenFriendVotes;
};

// API: POST /api/v1/ask/teto-egen/friend/{token}/vote
export type SubmitFriendVoteRequest = {
  vote: TetoEgenAnswer;
};

export type SubmitFriendVoteResponse = {
  myVote: TetoEgenAnswer;
  ownerDisplayName: string;
  // 공유한 본인의 자기 평가. 친구 평가 결과 화면에서 "{owner}는 본인을 X로 봤다"를 보여주기 위해 필요.
  ownerSelfAnswer: TetoEgenAnswer;
  friendVotes: TetoEgenFriendVotes;
};

export type TetoEgenErrorCode =
  | 'LINK_ALREADY_EXISTS'
  | 'CANNOT_VOTE_SELF'
  | 'ALREADY_VOTED'
  | 'LINK_NOT_FOUND'
  | 'NOT_LOGGED_IN';

// BE의 shareUrl(절대 URL) 대신 FE에서 현재 도메인 + token으로 직접 친구 공유 URL을 조립.
// SSR 단계에서는 location 접근 불가 → 빈 문자열 반환. 컴포넌트는 client mount 이후에 호출.
export const buildFriendShareUrl = (token: string): string => {
  if (typeof window === 'undefined') {
    return '';
  }
  return `${window.location.origin}/ask/teto-egen/friend/${token}`;
};
