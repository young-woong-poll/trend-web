import { http, HttpResponse } from 'msw';

import { getMockCommentListResponse } from '@/mocks/data/comments';
import { mockElectionDetail } from '@/mocks/data/elections';
import {
  mockResultDisplay,
  mockResultDisplayWithInvite,
  mockResultInviteeList,
} from '@/mocks/data/results';
import { mockMainDisplay, mockTrendDisplay, mockTrendVoteCount } from '@/mocks/data/trends';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://trend-api.votebox.kr';

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
   * Trend 항목 옵션 카운트 조회
   * GET /api/v1/trend/:trendAlias/item/:itemId
   * NOTE: 더 구체적인 패턴이므로 /api/v1/trend/:trendId 보다 먼저 정의해야 함
   */
  http.get(`${baseURL}/api/v1/trend/:trendAlias/item/:itemId`, ({ params }) => {
    const { itemId } = params;
    // 해당 itemId에 맞는 옵션들만 필터링
    const filteredOptions = mockTrendVoteCount.options.filter((option) =>
      option.id.startsWith(String(itemId))
    );
    return HttpResponse.json({ options: filteredOptions });
  }),

  /**
   * Trend 현재 투표 수 조회
   * GET /api/v1/trend/:trendId
   */
  http.get(`${baseURL}/api/v1/trend/:trendId`, () => HttpResponse.json(mockTrendVoteCount)),

  /**
   * 댓글 개수 조회
   * GET /api/v1/comment/:trendId/item/:itemId/count
   */
  http.get(`${baseURL}/api/v1/comment/:trendId/item/:itemId/count`, () =>
    HttpResponse.json({ count: Math.floor(Math.random() * 50) + 5 })
  ),

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
  http.get(`${baseURL}/api/v1/display/result/:resultId`, ({ request }) => {
    const url = new URL(request.url);
    const compareId = url.searchParams.get('compareId');

    if (compareId) {
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
   * 트렌드 아이템 댓글 조회
   * GET /api/v1/display/trend/:trendId/item/:itemId/comment
   */
  http.get(`${baseURL}/api/v1/display/trend/:trendId/item/:itemId/comment`, ({ request }) => {
    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor') ?? undefined;
    const size = parseInt(url.searchParams.get('size') ?? '10', 10);
    const sort = (url.searchParams.get('sort') ?? 'latest') as 'latest' | 'popular';

    const response = getMockCommentListResponse(cursor, size, sort);
    return HttpResponse.json(response);
  }),

  /**
   * Admin: 선거 상세 조회
   * GET /admin/api/v1/elections/:electionId
   */
  http.get(`${baseURL}/admin/api/v1/elections/:electionId`, () =>
    HttpResponse.json(mockElectionDetail)
  ),
];
