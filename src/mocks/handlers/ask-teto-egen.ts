// src/mocks/handlers/ask-teto-egen.ts
//
// MSW 핸들러 — H3 "테토/에겐" 5개 엔드포인트.

import { http, HttpResponse } from 'msw';

import {
  buildFriendVoteResultResponse,
  buildMyLinkResponse,
  getCountByScenario,
  getFriendMeta,
  getOwnerSelfAnswer,
  hasFriendVoted,
  recordFriendVote,
  SHARE_BASE_URL,
  tetoEgenStore,
} from '@/mocks/data/ask-teto-egen';
import type { CreateTetoEgenLinkRequest, SubmitFriendVoteRequest } from '@/types/ask-teto-egen';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://hotpick-api.votebox.kr';

const wrapResponse = <T>(data: T) => ({ code: 'SUCCESS', message: 'OK', data });

const wrapError = (code: string, message: string, data: unknown = null) => ({
  code,
  message,
  data,
});

// MSW 환경에서 현재 로그인 사용자 (handlers.ts의 mockUser와 별도 — 결합 시 props로 받게)
// 단순화를 위해 카카오 mock 로그인 후 ID 1001로 가정.
const MOCK_OWNER_USER_ID = 1001;

const generateToken = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 10; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
};

export const askTetoEgenHandlers = [
  // 1. GET /api/v1/ask/teto-egen/count
  http.get(`${baseURL}/api/v1/ask/teto-egen/count`, () =>
    HttpResponse.json(wrapResponse({ count: getCountByScenario() }))
  ),

  // 2. POST /api/v1/ask/teto-egen/links
  http.post(`${baseURL}/api/v1/ask/teto-egen/links`, async ({ request }) => {
    const body = (await request.json()) as CreateTetoEgenLinkRequest;
    const trimmed = body.displayName?.trim();
    if (!trimmed || trimmed.length < 1 || trimmed.length > 12) {
      return HttpResponse.json(wrapError('VALIDATION_ERROR', '이름은 1~12자로 입력해주세요.'), {
        status: 400,
      });
    }
    if (body.selfAnswer !== 'TETO' && body.selfAnswer !== 'EGEN') {
      return HttpResponse.json(wrapError('VALIDATION_ERROR', '잘못된 답변입니다.'), {
        status: 400,
      });
    }
    if (body.selfPrediction !== 'TETO' && body.selfPrediction !== 'EGEN') {
      return HttpResponse.json(wrapError('VALIDATION_ERROR', '잘못된 예측입니다.'), {
        status: 400,
      });
    }

    const existing = tetoEgenStore.getMyLink();
    if (existing && existing.ownerUserId === MOCK_OWNER_USER_ID) {
      return HttpResponse.json(
        wrapError('LINK_ALREADY_EXISTS', '이미 링크가 존재합니다.', {
          token: existing.token,
          shareUrl: `${SHARE_BASE_URL}/${existing.token}`,
        }),
        { status: 409 }
      );
    }

    const token = generateToken();
    tetoEgenStore.setMyLink({
      token,
      ownerUserId: MOCK_OWNER_USER_ID,
      displayName: trimmed,
      selfAnswer: body.selfAnswer,
      selfPrediction: body.selfPrediction,
      createdAt: new Date().toISOString(),
    });

    return HttpResponse.json(wrapResponse({ token, shareUrl: `${SHARE_BASE_URL}/${token}` }), {
      status: 201,
    });
  }),

  // 3. GET /api/v1/ask/teto-egen/links/me
  http.get(`${baseURL}/api/v1/ask/teto-egen/links/me`, () => {
    const data = buildMyLinkResponse();
    if (!data) {
      return HttpResponse.json(wrapError('LINK_NOT_FOUND', '링크가 없습니다.'), { status: 404 });
    }
    return HttpResponse.json(wrapResponse(data));
  }),

  // 4. GET /api/v1/ask/teto-egen/friend/{token}
  http.get(`${baseURL}/api/v1/ask/teto-egen/friend/:token`, ({ params }) => {
    const token = params.token as string;
    const meta = getFriendMeta(token, MOCK_OWNER_USER_ID);
    if (!meta) {
      return HttpResponse.json(wrapError('LINK_NOT_FOUND', '링크가 더 이상 유효하지 않아요.'), {
        status: 404,
      });
    }

    // 로그인 사용자가 이미 참여한 경우: 결과 데이터 함께 반환 (자기 토큰은 제외)
    const previous = !meta.isOwn ? hasFriendVoted(token, MOCK_OWNER_USER_ID) : null;
    if (previous) {
      return HttpResponse.json(
        wrapResponse({
          token,
          displayName: meta.displayName,
          isOwn: meta.isOwn,
          myVote: previous,
          ownerSelfAnswer: getOwnerSelfAnswer(token),
          friendVotes: buildFriendVoteResultResponse(token, previous),
        })
      );
    }

    return HttpResponse.json(
      wrapResponse({
        token,
        displayName: meta.displayName,
        isOwn: meta.isOwn,
      })
    );
  }),

  // 5. POST /api/v1/ask/teto-egen/friend/{token}/vote
  http.post(`${baseURL}/api/v1/ask/teto-egen/friend/:token/vote`, async ({ params, request }) => {
    const token = params.token as string;
    const body = (await request.json()) as SubmitFriendVoteRequest;

    const meta = getFriendMeta(token, MOCK_OWNER_USER_ID);
    if (!meta) {
      return HttpResponse.json(wrapError('LINK_NOT_FOUND', '링크가 더 이상 유효하지 않아요.'), {
        status: 404,
      });
    }
    if (meta.isOwn) {
      return HttpResponse.json(wrapError('CANNOT_VOTE_SELF', '자신에게 투표할 수 없습니다.'), {
        status: 403,
      });
    }
    const previous = hasFriendVoted(token, MOCK_OWNER_USER_ID);
    if (previous) {
      return HttpResponse.json(
        wrapError('ALREADY_VOTED', '이미 참여했습니다.', { myVote: previous }),
        { status: 409 }
      );
    }
    if (body.vote !== 'TETO' && body.vote !== 'EGEN') {
      return HttpResponse.json(wrapError('VALIDATION_ERROR', '잘못된 답변입니다.'), {
        status: 400,
      });
    }

    recordFriendVote(token, MOCK_OWNER_USER_ID, body.vote);

    return HttpResponse.json(
      wrapResponse({
        myVote: body.vote,
        ownerDisplayName: meta.displayName,
        ownerSelfAnswer: getOwnerSelfAnswer(token),
        friendVotes: buildFriendVoteResultResponse(token, body.vote),
      }),
      { status: 201 }
    );
  }),
];
