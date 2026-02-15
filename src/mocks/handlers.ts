import { http, HttpResponse } from 'msw';

import { getMockCommentListResponse } from '@/mocks/data/comments';
import {
  getMockElectionList,
  getMockElection,
  createMockElection,
  updateMockElection,
  deleteMockElection,
} from '@/mocks/data/elections';
import {
  mockMainDisplay,
  mockSingleDisplay,
  mockHotpickDetailMap,
  mockHotpickDetailBundle,
  mockVoteCountMap,
  injectExtensions,
} from '@/mocks/data/hotpicks';
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
 *
 * Phase 2 P0 기능 테스트 케이스:
 * - 트렌드 탭: BUNDLE 목록 (deadline, status, categoryCode 확장 필드 포함)
 * - Single 탭: SINGLE 목록 (type=SINGLE 필터)
 * - 투표 페이지: alias별 상세 데이터 (IMAGE/TEXT/CLOSED)
 * - 카테고리 필터: categoryCodes 파라미터 필터링
 * - Admin Election CRUD: 목록/상세/생성/수정/삭제
 */
export const handlers = [
  // ──────────────────────────────────────────────────────────
  // Display API (사용자 화면)
  // ──────────────────────────────────────────────────────────

  /**
   * 메인 전시 조회
   * GET /api/v1/display/main
   *
   * type=SINGLE → Single 탭 데이터
   * type 없음/BUNDLE → 트렌드 탭 데이터
   * categoryCodes → 카테고리 필터 (간이 구현)
   */
  http.get(`${baseURL}/api/v1/display/main`, ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');

    const source = type === 'SINGLE' ? mockSingleDisplay : mockMainDisplay;

    // 확장 필드 주입 (type, categoryCode, deadline, status)
    const result = {
      ...source,
      fixedTrends: injectExtensions(source.fixedTrends ?? []),
      trends: injectExtensions(source.trends ?? []),
    };

    return HttpResponse.json(wrapResponse(result));
  }),

  /**
   * Hotpick 상세 조회 (투표 페이지)
   * GET /api/v1/display/trend/:trendAlias
   *
   * alias에 따라 다른 상세 데이터 반환:
   * - love-dilemma → BUNDLE + IMAGE (5개 선거)
   * - finance-picks → BUNDLE + TEXT 혼합 (마감임박 D-2)
   * - work-closed → BUNDLE + CLOSED
   * - single-love → SINGLE + IMAGE
   * - single-text-finance → SINGLE + TEXT
   * - 기타 → 기본 BUNDLE
   */
  http.get(`${baseURL}/api/v1/display/trend/:trendAlias`, ({ params }) => {
    const alias = String(params.trendAlias);
    const detailData = mockHotpickDetailMap[alias] ?? mockHotpickDetailBundle;
    return HttpResponse.json(wrapResponse(detailData));
  }),

  /**
   * 선거 옵션 투표 수 조회
   * GET /api/v1/trend/:trendAlias/item/:itemId
   *
   * electionId(itemId)별 투표 수 반환
   */
  http.get(`${baseURL}/api/v1/trend/:trendAlias/item/:itemId`, ({ params }) => {
    const itemId = String(params.itemId);
    const voteData = mockVoteCountMap[itemId] ?? { options: [] };
    return HttpResponse.json(wrapResponse(voteData));
  }),

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
  http.post(`${baseURL}/api/v1/result`, () =>
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
   * GET /api/v1/display/trend/:trendId/item/:itemId/comment
   */
  http.get(`${baseURL}/api/v1/display/trend/:trendId/item/:itemId/comment`, ({ request }) => {
    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor') ?? undefined;
    const size = parseInt(url.searchParams.get('size') ?? '10', 10);
    const sort = (url.searchParams.get('sort') ?? 'latest') as 'latest' | 'popular';

    const response = getMockCommentListResponse(cursor, size, sort);
    return HttpResponse.json(wrapResponse(response));
  }),

  // ──────────────────────────────────────────────────────────
  // Admin Election CRUD
  // ──────────────────────────────────────────────────────────

  /**
   * 선거 목록 조회
   * GET /admin/api/v1/election
   */
  http.get(`${baseURL}/admin/api/v1/election`, ({ request }) => {
    const url = new URL(request.url);
    const params = {
      keyword: url.searchParams.get('keyword') ?? undefined,
      voteType: url.searchParams.get('voteType') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
      page: url.searchParams.has('page') ? Number(url.searchParams.get('page')) : undefined,
      size: url.searchParams.has('size') ? Number(url.searchParams.get('size')) : undefined,
    };
    return HttpResponse.json(wrapResponse(getMockElectionList(params)));
  }),

  /**
   * 선거 상세 조회
   * GET /admin/api/v1/election/:electionId
   */
  http.get(`${baseURL}/admin/api/v1/election/:electionId`, ({ params }) => {
    const election = getMockElection(String(params.electionId));
    if (!election) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '선거를 찾을 수 없습니다.', data: null },
        { status: 404 }
      );
    }
    return HttpResponse.json(wrapResponse(election));
  }),

  /**
   * 선거 생성
   * POST /admin/api/v1/election
   */
  http.post(`${baseURL}/admin/api/v1/election`, async ({ request }) => {
    const body = (await request.json()) as {
      title: string;
      voteType: string;
      mainImageUrl?: string;
      options: { title: string; imageUrl?: string; order: number }[];
    };
    const created = createMockElection(body);
    return HttpResponse.json(wrapResponse(created), { status: 201 });
  }),

  /**
   * 선거 수정
   * PUT /admin/api/v1/election/:electionId
   */
  http.put(`${baseURL}/admin/api/v1/election/:electionId`, async ({ params, request }) => {
    const body = (await request.json()) as {
      title: string;
      voteType: string;
      mainImageUrl?: string;
      options: { title: string; imageUrl?: string; order: number }[];
    };
    const updated = updateMockElection(String(params.electionId), body);
    if (!updated) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '선거를 찾을 수 없습니다.', data: null },
        { status: 404 }
      );
    }
    return HttpResponse.json(wrapResponse(updated));
  }),

  /**
   * 선거 삭제
   * DELETE /admin/api/v1/election/:electionId
   */
  http.delete(`${baseURL}/admin/api/v1/election/:electionId`, ({ params }) => {
    const success = deleteMockElection(String(params.electionId));
    if (!success) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '선거를 찾을 수 없습니다.', data: null },
        { status: 404 }
      );
    }
    return HttpResponse.json(wrapResponse(null));
  }),
];
