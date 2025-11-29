import { http, HttpResponse } from 'msw';

import { mockElectionDetail } from '@/mocks/data/elections';
import {
  mockResultDisplay,
  mockResultDisplayWithInvite,
  mockResultInviteeList,
} from '@/mocks/data/results';
import { mockMainDisplay, mockTrendDisplay, mockTrendVoteCount } from '@/mocks/data/trends';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

/**
 * MSW Handlers
 * API 엔드포인트별로 Mock 응답을 정의합니다
 */
export const handlers = [
  /**
   * 메인 전시 조회
   * GET /api/v1/display/main
   */
  http.get(`${baseURL}/api/v1/display/main`, () => HttpResponse.json(mockMainDisplay)),

  /**
   * Trend 전시 조회
   * GET /api/v1/display/trend/:trendId
   */
  http.get(`${baseURL}/api/v1/display/trend/:trendId`, () => HttpResponse.json(mockTrendDisplay)),

  /**
   * Trend 현재 투표 수 조회
   * GET /api/v1/trend/:trendId
   */
  http.get(`${baseURL}/api/v1/trend/:trendId`, () => HttpResponse.json(mockTrendVoteCount)),

  /**
   * Result 생성
   * POST /api/v1/result
   */
  http.post(`${baseURL}/api/v1/result`, async () =>
    // invitationId가 있으면 새로운 resultId 생성
    HttpResponse.json({
      resultId: `result-${Date.now()}`,
    })
  ),

  http.post(`${baseURL}/api/v1/result/:resultId/nickname`, () => HttpResponse.json(true)),

  /**
   * Result 전시 조회
   * GET /api/v1/display/result/:resultId
   */
  http.get(`${baseURL}/api/v1/display/result/:resultId`, ({ params }) => {
    const { resultId } = params;

    // resultId에 'invite'가 포함되어 있으면 초대 비교 결과 반환
    if (String(resultId).includes('invite')) {
      return HttpResponse.json(mockResultDisplayWithInvite);
    }

    // 기본 결과 반환
    return HttpResponse.json(mockResultDisplay);
  }),

  /**
   * 초대한 친구 결과 목록 조회
   * GET /api/v1/display/result/:resultId/invitee
   */
  http.get(`${baseURL}/api/v1/display/result/:resultId/invitee`, () =>
    // 기본 결과 반환
    HttpResponse.json(mockResultInviteeList)
  ),

  /**
   * Admin: 선거 상세 조회
   * GET /admin/api/v1/elections/:electionId
   */
  http.get(`${baseURL}/admin/api/v1/elections/:electionId`, () =>
    HttpResponse.json(mockElectionDetail)
  ),
];
