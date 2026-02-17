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
  trendExtensions,
  singleVoteDataMap,
} from '@/mocks/data/hotpicks';
import { mockResultDisplay } from '@/mocks/data/results';
import {
  recordVote,
  getVote,
  hasVoted,
  singleVoteCounts,
  incrementVoteCount,
} from '@/mocks/data/singleVotes';

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
   * 혼합 피드: 싱글 + 번들 통합 반환
   * x-tku-id 헤더로 기투표 상태 반영
   * categoryCodes → 카테고리 필터
   */
  http.get(`${baseURL}/api/v1/display/main`, ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    // axios는 배열을 categoryCodes[]=X 형태로 직렬화하므로 두 형태 모두 지원
    const categoryCodes = [
      ...url.searchParams.getAll('categoryCodes'),
      ...url.searchParams.getAll('categoryCodes[]'),
    ];
    const tkuId = request.headers.get('x-tku-id') ?? '';
    const anchor = url.searchParams.get('anchor');
    const direction = url.searchParams.get('direction');

    const source = type === 'SINGLE' ? mockSingleDisplay : mockMainDisplay;

    // 확장 필드 주입 (type, categoryCode, deadline, status, singleVote)
    let fixedTrends = injectExtensions(source.fixedTrends ?? []);
    let allTrends = injectExtensions(source.trends ?? []);

    // x-tku-id 기반 기투표 상태 반영
    if (tkuId) {
      const injectVoteState = <T extends { id?: number; alias?: string; singleVote?: unknown }>(
        items: T[]
      ): T[] =>
        items.map((item) => {
          const alias = item.alias ?? '';
          const svData = singleVoteDataMap[alias];
          if (!svData) {
            return item;
          }

          const hotpickId = String(item.id ?? '');
          const vote = getVote(tkuId, hotpickId);
          const counts = singleVoteCounts[hotpickId];

          if (vote && counts) {
            const isOptionA = vote.optionId === svData.optionA.id;
            return {
              ...item,
              singleVote: {
                ...svData,
                optionA: { ...svData.optionA, voteCount: counts.optionACount },
                optionB: { ...svData.optionB, voteCount: counts.optionBCount },
                voted: true,
                myChoice: isOptionA ? 'A' : 'B',
                totalVotes: counts.optionACount + counts.optionBCount,
              },
            };
          }

          return item;
        });

      fixedTrends = injectVoteState(fixedTrends);
      allTrends = injectVoteState(allTrends);
    }

    // 카테고리 필터링 (멀티 카테고리 지원)
    if (categoryCodes.length > 0) {
      const filterByCategory = <T extends { alias?: string }>(items: T[]): T[] =>
        items.filter((item) => {
          const ext = trendExtensions[item.alias ?? ''];
          if (!ext) {
            return false;
          }
          const itemCodes = ext.categoryCodes ?? (ext.categoryCode ? [ext.categoryCode] : []);
          return itemCodes.some((code) => categoryCodes.includes(code));
        });

      fixedTrends = filterByCategory(fixedTrends);
      allTrends = filterByCategory(allTrends);
    }

    // 커서 & 사이즈 파라미터
    const cursor = url.searchParams.get('cursor');
    const size = parseInt(url.searchParams.get('size') ?? '10', 10);

    // anchor 기반 슬라이싱 (해시 스크롤 진입)
    if (anchor) {
      const anchorIndex = allTrends.findIndex((t) => t.alias === anchor);

      if (anchorIndex === -1) {
        const result = {
          ...source,
          fixedTrends,
          trends: allTrends.slice(0, size),
          totalCount: allTrends.length,
          hasMore: allTrends.length > size,
          nextCursor: allTrends.length > size ? size : undefined,
          anchorNotFound: true,
        };
        return HttpResponse.json(wrapResponse(result));
      }

      const startIdx = Math.max(0, anchorIndex - 3);
      const endIdx = Math.min(allTrends.length, startIdx + size);
      const trends = allTrends.slice(startIdx, endIdx);
      const hasPrevious = startIdx > 0;
      const hasMore = endIdx < allTrends.length;

      const result = {
        ...source,
        fixedTrends: [],
        trends,
        totalCount: allTrends.length,
        anchorIndex: anchorIndex - startIdx,
        hasPrevious,
        prevCursor: hasPrevious ? startIdx : undefined,
        hasMore,
        nextCursor: hasMore ? endIdx : undefined,
      };
      return HttpResponse.json(wrapResponse(result));
    }

    // direction=prev → 이전 페이지
    if (direction === 'prev') {
      const cursorVal = parseInt(cursor ?? '0', 10);
      const startIdx = Math.max(0, cursorVal - size);
      const trends = allTrends.slice(startIdx, cursorVal);
      const hasPrevious = startIdx > 0;

      const result = {
        ...source,
        fixedTrends: [],
        trends,
        totalCount: allTrends.length,
        hasPrevious,
        prevCursor: hasPrevious ? startIdx : undefined,
      };
      return HttpResponse.json(wrapResponse(result));
    }

    // 일반 커서 기반 페이지네이션
    const cursorVal = cursor ? parseInt(cursor, 10) : 0;
    const pageStart = cursorVal;
    const pageEnd = Math.min(allTrends.length, pageStart + size);
    const pageTrends = allTrends.slice(pageStart, pageEnd);
    const hasMore = pageEnd < allTrends.length;

    const result = {
      ...source,
      fixedTrends: pageStart === 0 ? fixedTrends : [],
      trends: pageTrends,
      totalCount: allTrends.length,
      hasMore,
      nextCursor: hasMore ? pageEnd : undefined,
    };

    return HttpResponse.json(wrapResponse(result));
  }),

  /**
   * 싱글 핫픽 투표
   * POST /api/v1/single/:hotpickId/vote
   *
   * Headers: x-tku-id (필수)
   * Body: { optionId: string }
   * 성공: 200 + { voteCountA, voteCountB, totalVotes }
   * 중복: 409 + 현재 결과
   */
  http.post(`${baseURL}/api/v1/single/:hotpickId/vote`, async ({ request, params }) => {
    const tkuId = request.headers.get('x-tku-id');
    if (!tkuId) {
      return HttpResponse.json(
        { code: 'UNAUTHORIZED', message: 'x-tku-id 헤더가 필요합니다.', data: null },
        { status: 401 }
      );
    }

    const hotpickId = String(params.hotpickId);
    const body = (await request.json()) as { optionId: string };
    const { optionId } = body;

    // 해당 핫픽의 singleVote 데이터 찾기 (alias → id 매핑)
    const aliasEntry = Object.entries(singleVoteDataMap).find(
      ([, sv]) => sv.optionA.id === optionId || sv.optionB.id === optionId
    );

    if (!aliasEntry) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '유효하지 않은 옵션입니다.', data: null },
        { status: 404 }
      );
    }

    const [, svData] = aliasEntry;
    const counts = singleVoteCounts[hotpickId];
    if (!counts) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '핫픽을 찾을 수 없습니다.', data: null },
        { status: 404 }
      );
    }

    // 중복 투표 체크
    if (hasVoted(tkuId, hotpickId)) {
      const voteRecord = getVote(tkuId, hotpickId);
      const isOptionA = voteRecord?.optionId === svData.optionA.id;
      return HttpResponse.json(
        {
          code: 'ALREADY_VOTED',
          message: '이미 투표했습니다.',
          data: {
            voted: true,
            myChoice: isOptionA ? 'A' : 'B',
            voteCountA: counts.optionACount,
            voteCountB: counts.optionBCount,
            totalVotes: counts.optionACount + counts.optionBCount,
          },
        },
        { status: 409 }
      );
    }

    // 투표 기록 + 카운트 증가
    recordVote(tkuId, hotpickId, optionId);
    incrementVoteCount(hotpickId, optionId, svData.optionA.id);

    const isOptionA = optionId === svData.optionA.id;

    return HttpResponse.json(
      wrapResponse({
        voted: true,
        myChoice: isOptionA ? 'A' : 'B',
        voteCountA: counts.optionACount,
        voteCountB: counts.optionBCount,
        totalVotes: counts.optionACount + counts.optionBCount,
      })
    );
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
   * GET /api/v1/comment/:trendId/item/:itemId/count
   */
  http.get(`${baseURL}/api/v1/comment/:trendId/item/:itemId/count`, () =>
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
