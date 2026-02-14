import { http, HttpResponse } from 'msw';

import { getMockCommentListResponse } from '@/mocks/data/comments';
import { mockElectionDetail } from '@/mocks/data/elections';
import { mockMainDisplay, mockHotpickDisplay, mockHotpickVoteCount } from '@/mocks/data/hotpicks';
import { mockResultDisplay } from '@/mocks/data/results';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://hotpick-api.votebox.kr';

/**
 * BaseResponse 형식으로 응답 래핑
 */
const wrapResponse = <T>(data: T) => ({
  code: 'SUCCESS',
  message: '성공',
  data,
});

/**
 * MSW Handlers
 * API 엔드포인트별로 Mock 응답을 정의합니다
 */
export const handlers = [
  /**
   * 메인 전시 조회
   * GET /api/v1/display/main
   */
  http.get(`${baseURL}/api/v1/display/main`, () =>
    HttpResponse.json(wrapResponse(mockMainDisplay))
  ),

  /**
   * Hotpick 전시 조회
   * GET /api/v1/display/hotpick/:hotpickId
   */
  http.get(`${baseURL}/api/v1/display/hotpick/:hotpickId`, () =>
    HttpResponse.json(wrapResponse(mockHotpickDisplay))
  ),

  /**
   * Hotpick 선거 옵션 카운트 조회
   * GET /api/v1/hotpick/:hotpickAlias/election/:electionId
   * NOTE: 더 구체적인 패턴이므로 /api/v1/hotpick/:hotpickId 보다 먼저 정의해야 함
   */
  http.get(`${baseURL}/api/v1/hotpick/:hotpickAlias/election/:electionId`, ({ params }) => {
    const { electionId } = params;
    // 해당 electionId에 맞는 옵션들만 필터링
    const filteredOptions = mockHotpickVoteCount.options.filter((option) =>
      option.id.startsWith(String(electionId))
    );
    return HttpResponse.json(wrapResponse({ options: filteredOptions }));
  }),

  /**
   * Hotpick 현재 투표 수 조회
   * GET /api/v1/hotpick/:hotpickId
   */
  http.get(`${baseURL}/api/v1/hotpick/:hotpickId`, () =>
    HttpResponse.json(wrapResponse(mockHotpickVoteCount))
  ),

  /**
   * 댓글 개수 조회
   * GET /api/v1/comment/:hotpickId/election/:electionId/count
   */
  http.get(`${baseURL}/api/v1/comment/:hotpickId/election/:electionId/count`, () =>
    HttpResponse.json(wrapResponse({ count: Math.floor(Math.random() * 50) + 5 }))
  ),

  /**
   * Result 생성
   * POST /api/v1/result
   */
  http.post(`${baseURL}/api/v1/result`, async () =>
    HttpResponse.json(
      wrapResponse({
        resultId: `result-${Date.now()}`,
      })
    )
  ),

  /**
   * Result 전시 조회
   * GET /api/v1/display/result/:resultId
   */
  http.get(`${baseURL}/api/v1/display/result/:resultId`, () =>
    HttpResponse.json(wrapResponse(mockResultDisplay))
  ),

  /**
   * 핫픽 선거 댓글 조회
   * GET /api/v1/display/hotpick/:hotpickId/election/:electionId/comment
   */
  http.get(
    `${baseURL}/api/v1/display/hotpick/:hotpickId/election/:electionId/comment`,
    ({ request }) => {
      const url = new URL(request.url);
      const cursor = url.searchParams.get('cursor') ?? undefined;
      const size = parseInt(url.searchParams.get('size') ?? '10', 10);
      const sort = (url.searchParams.get('sort') ?? 'latest') as 'latest' | 'popular';

      const response = getMockCommentListResponse(cursor, size, sort);
      return HttpResponse.json(wrapResponse(response));
    }
  ),

  /**
   * Admin: 선거 상세 조회
   * GET /admin/api/v1/elections/:electionId
   */
  http.get(`${baseURL}/admin/api/v1/elections/:electionId`, () =>
    HttpResponse.json(wrapResponse(mockElectionDetail))
  ),
];
