import { http, HttpResponse } from 'msw';

import { getMockCommentListResponse, addMockComment } from '@/mocks/data/comments';
import { getMockElectionSeries } from '@/mocks/data/electionSeries';
import {
  mockMainHotpicks,
  mockHotpickDetailMap,
  mockHotpickDetailBundleConverted,
  singleVoteDataMap,
  trendExtensions,
} from '@/mocks/data/hotpicks';
import { mockResultDisplay } from '@/mocks/data/results';
import {
  recordVote,
  getVote,
  hasVoted,
  incrementVoteCount,
  getOptionCounts,
  getTotalVotes,
  recordBundleVote,
  hasBundleVoted,
  setLike,
  getLikeState,
  initLikeCount,
} from '@/mocks/data/singleVotes';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://hotpick-api.votebox.kr';

/**
 * Mock 카테고리 데이터 (Public 탭)
 */
const mockCategories = [
  { id: 1, name: '연애', slug: 'LOVE' },
  { id: 2, name: '결혼', slug: 'MARRIAGE' },
  { id: 3, name: '재테크', slug: 'FINANCE' },
  { id: 4, name: '직장', slug: 'WORK' },
  { id: 5, name: '스포츠', slug: 'SPORTS' },
  { id: 6, name: '음식', slug: 'FOOD' },
  { id: 7, name: '게임', slug: 'GAME' },
  { id: 8, name: '자동차', slug: 'CAR' },
  { id: 9, name: '건강', slug: 'HEALTH' },
  { id: 10, name: '트렌드', slug: 'TREND' },
];
/**
 * BaseResponse 형식으로 응답 래핑
 */
const wrapResponse = <T>(data: T) => ({
  code: 'SUCCESS',
  message: '성공',
  data,
});

/**
 * MSW Handlers — 새 Hotpick API 기반
 */
export const handlers = [
  // ──────────────────────────────────────────────────────────
  // Hotpick API (사용자 화면)
  // ──────────────────────────────────────────────────────────

  /**
   * 메인 핫픽 목록 조회
   * GET /api/v1/hotpicks/main
   */
  http.get(`${baseURL}/api/v1/hotpicks/main`, ({ request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const filter = url.searchParams.get('filter');
    const sort = url.searchParams.get('sort');
    const _period = url.searchParams.get('period'); // BE 구현 시 기간별 필터링 적용 예정
    const tkuId = request.headers.get('x-tku-id') ?? '';

    let hotpicks = [...(mockMainHotpicks.hotpicks ?? [])];

    // 콘텐츠 필터: voted (투표한 핫픽만), closed (마감된 핫픽만)
    if (filter === 'voted') {
      hotpicks = hotpicks.filter((hp) => hp.election?.voted === true);
    } else if (filter === 'closed') {
      hotpicks = hotpicks.filter((hp) => hp.isExpired === true);
    }

    // 정렬
    if (sort === 'hot' || sort === 'popular') {
      hotpicks = [...hotpicks].sort(
        (a, b) => (b.election?.totalVoteCount ?? 0) - (a.election?.totalVoteCount ?? 0)
      );
    } else if (sort === 'latest') {
      hotpicks = [...hotpicks].sort(
        (a, b) => new Date(b.expiredAt ?? 0).getTime() - new Date(a.expiredAt ?? 0).getTime()
      );
    }

    // 카테고리 필터링 ("all" 또는 빈값은 전체 조회)
    if (category && category !== 'all') {
      hotpicks = hotpicks.filter((hp) => {
        const cats = hp.categories ?? [];
        return cats.some((c) => c.slug === category || c.name === category);
      });
    }

    // 좋아요 초기 카운트 설정 + x-tku-id 기반 상태 반영
    hotpicks = hotpicks.map((hp) => {
      const slug = hp.slug ?? '';
      const hotpickId = String(hp.hotpickId ?? '');
      const election = hp.election;

      // 좋아요 초기 카운트 등록
      initLikeCount(slug, hp.likeCount ?? 0);
      const likeState = tkuId
        ? getLikeState(tkuId, slug)
        : { liked: false, likeCount: hp.likeCount ?? 0 };
      let updated = { ...hp, liked: likeState.liked, likeCount: likeState.likeCount };

      if (!election || !tkuId) {
        return updated;
      }

      const vote = getVote(tkuId, hotpickId);
      if (vote) {
        const optionCounts = getOptionCounts(hotpickId);
        const total = getTotalVotes(hotpickId);
        updated = {
          ...updated,
          election: {
            ...election,
            voted: true,
            myElectionItemId: Number(vote.optionId) || undefined,
            totalVoteCount: total,
            items: (election.items ?? []).map((item) => {
              const sc = optionCounts.find((c) => c.id === String(item.electionItemId));
              return {
                ...item,
                voteCount: sc?.count ?? item.voteCount,
                voteRate: total > 0 ? Math.round(((sc?.count ?? 0) / total) * 100) : 0,
              };
            }),
          },
        };
      }

      // Bundle 참여 상태
      const ext = trendExtensions[slug];
      if (ext?.type === 'BUNDLE' && hasBundleVoted(tkuId, hotpickId)) {
        updated = { ...updated, participated: true } as typeof updated;
      }

      return updated;
    });

    // 커서 기반 페이지네이션
    const cursor = url.searchParams.get('cursor');
    const size = parseInt(url.searchParams.get('size') ?? '10', 10);
    const cursorVal = cursor ? parseInt(cursor, 10) : 0;
    const pageStart = cursorVal;
    const pageEnd = Math.min(hotpicks.length, pageStart + size);
    const pageHotpicks = hotpicks.slice(pageStart, pageEnd);
    const hasMore = pageEnd < hotpicks.length;

    return HttpResponse.json(
      wrapResponse({
        hotpicks: pageHotpicks,
        hasMore,
        nextCursor: hasMore ? pageEnd : undefined,
      })
    );
  }),

  /**
   * 검색
   * GET /api/v1/hotpicks/search
   * ⚠️ :slug 핸들러보다 앞에 위치해야 함 (MSW는 순서대로 매칭)
   */
  http.get(`${baseURL}/api/v1/hotpicks/search`, ({ request }) => {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').trim();
    const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

    if (q.length < 2) {
      return HttpResponse.json(
        wrapResponse({
          hits: [],
          query: q,
          processingTimeMs: 1,
          limit,
          offset,
          estimatedTotalHits: 0,
        })
      );
    }

    const allHotpicks = mockMainHotpicks.hotpicks ?? [];

    // 제목에서 검색어 포함 여부로 필터 (Meilisearch 시뮬레이션)
    const hits = allHotpicks
      .filter((hp) => {
        const title = hp.election?.title ?? '';
        return title.includes(q) || q.length >= 2; // mock에서는 2글자 이상이면 전체 반환
      })
      .slice(offset, offset + limit)
      .map((hp) => ({
        id: hp.hotpickId,
        hotpickId: hp.hotpickId,
        type: hp.type,
        slug: hp.slug,
        isExpired: hp.expiredAt ? new Date(hp.expiredAt) < new Date() : false,
        likeCount: hp.likeCount ?? 0,
        categories: hp.categories ?? [],
        election: hp.election
          ? {
              electionId: hp.election.electionId,
              title: hp.election.title,
              totalVoteCount: hp.election.totalVoteCount ?? 0,
              totalCommentCount: hp.election.totalCommentCount ?? 0,
              items: hp.election.items ?? [],
              imageUrl: hp.election.imageUrl,
            }
          : undefined,
        imageUrl: hp.imageUrl,
      }));

    return HttpResponse.json(
      wrapResponse({
        hits,
        query: q,
        processingTimeMs: 5,
        limit,
        offset,
        estimatedTotalHits: hits.length,
      })
    );
  }),

  /**
   * 핫픽 상세 조회
   * GET /api/v1/hotpicks/:slug
   */
  http.get(`${baseURL}/api/v1/hotpicks/:slug`, ({ params, request }) => {
    const slug = String(params.slug);
    const detailData = mockHotpickDetailMap[slug] ?? mockHotpickDetailBundleConverted;

    const tkuId = request.headers.get('x-tku-id') ?? '';
    const hotpickId = String(detailData.hotpick?.hotpickId ?? '');

    // 좋아요 초기 카운트 등록 + 상태 반영
    initLikeCount(slug, detailData.hotpick?.likeCount ?? 0);
    const likeState = tkuId
      ? getLikeState(tkuId, slug)
      : { liked: false, likeCount: detailData.hotpick?.likeCount ?? 0 };

    // 기투표 상태 반영
    if (tkuId && detailData.hotpick?.election) {
      const vote = getVote(tkuId, hotpickId);
      if (vote) {
        const optionCounts = getOptionCounts(hotpickId);
        const total = getTotalVotes(hotpickId);
        const election = detailData.hotpick.election;
        return HttpResponse.json(
          wrapResponse({
            ...detailData,
            hotpick: {
              ...detailData.hotpick,
              liked: likeState.liked,
              likeCount: likeState.likeCount,
              election: {
                ...election,
                voted: true,
                myElectionItemId: Number(vote.optionId) || undefined,
                totalVoteCount: total,
                items: (election.items ?? []).map(
                  (item: { electionItemId?: number; voteCount?: number }) => {
                    const sc = optionCounts.find((c) => c.id === String(item.electionItemId));
                    return {
                      ...item,
                      voteCount: sc?.count ?? item.voteCount,
                      voteRate: total > 0 ? Math.round(((sc?.count ?? 0) / total) * 100) : 0,
                    };
                  }
                ),
              },
            },
          })
        );
      }
    }

    return HttpResponse.json(
      wrapResponse({
        ...detailData,
        hotpick: {
          ...detailData.hotpick,
          liked: likeState.liked,
          likeCount: likeState.likeCount,
        },
      })
    );
  }),

  /**
   * 핫픽 투표
   * POST /api/v1/hotpicks/:slug/votes
   *
   * Headers: x-tku-id (필수)
   * Body: { electionItemId: number }
   */
  http.post(`${baseURL}/api/v1/hotpicks/:slug/votes`, async ({ request, params }) => {
    const tkuId = request.headers.get('x-tku-id');
    if (!tkuId) {
      return HttpResponse.json(
        { code: 'UNAUTHORIZED', message: 'x-tku-id 헤더가 필요합니다.', data: null },
        { status: 401 }
      );
    }

    const slug = String(params.slug);
    const body = (await request.json()) as { electionItemId: number };
    const optionId = String(body.electionItemId);

    // 해당 핫픽의 singleVote 데이터 찾기
    const svData = singleVoteDataMap[slug];
    if (!svData) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '유효하지 않은 핫픽입니다.', data: null },
        { status: 404 }
      );
    }

    // hotpickId는 상세 데이터에서 가져오기
    const detailData = mockHotpickDetailMap[slug];
    const hotpickId = String(detailData?.hotpick?.hotpickId ?? '');

    // 중복 투표 체크
    if (hasVoted(tkuId, hotpickId)) {
      const voteRecord = getVote(tkuId, hotpickId);
      const optionCounts = getOptionCounts(hotpickId);
      const total = getTotalVotes(hotpickId);
      return HttpResponse.json(
        {
          code: 'ALREADY_VOTED',
          message: '이미 투표했습니다.',
          data: {
            hotpickId: Number(hotpickId),
            hotpickSlug: slug,
            electionId: svData.electionId,
            voted: true,
            myElectionItemId: Number(voteRecord?.optionId ?? optionId),
            totalVoteCount: total,
            items: svData.options.map((opt, idx) => {
              const sc = optionCounts.find((c) => c.id === opt.id);
              return {
                electionItemId: Number(opt.id.replace(/\D/g, '')) || 0,
                displayOrder: idx + 1,
                title: opt.text,
                imageUrl: opt.imageUrl,
                voteCount: sc?.count ?? opt.voteCount ?? 0,
                voteRate: total > 0 ? Math.round(((sc?.count ?? 0) / total) * 100) : 0,
                selected: opt.id === (voteRecord?.optionId ?? optionId),
              };
            }),
          },
        },
        { status: 409 }
      );
    }

    // 투표 기록 + 카운트 증가
    recordVote(tkuId, hotpickId, optionId);
    incrementVoteCount(hotpickId, optionId);

    const optionCounts = getOptionCounts(hotpickId);
    const total = getTotalVotes(hotpickId);

    return HttpResponse.json(
      wrapResponse({
        hotpickId: Number(hotpickId),
        hotpickSlug: slug,
        electionId: svData.electionId,
        voted: true,
        myElectionItemId: Number(optionId),
        totalVoteCount: total,
        items: svData.options.map((opt, idx) => {
          const sc = optionCounts.find((c) => c.id === opt.id);
          return {
            electionItemId: Number(opt.id.replace(/\D/g, '')) || 0,
            displayOrder: idx + 1,
            title: opt.text,
            imageUrl: opt.imageUrl,
            voteCount: sc?.count ?? opt.voteCount ?? 0,
            voteRate: total > 0 ? Math.round(((sc?.count ?? 0) / total) * 100) : 0,
            selected: opt.id === optionId,
          };
        }),
      })
    );
  }),

  /**
   * 핫픽 좋아요
   * POST /api/v1/hotpicks/:slug/like
   */
  http.post(`${baseURL}/api/v1/hotpicks/:slug/like`, ({ request, params }) => {
    const slug = String(params.slug);
    const tkuId = request.headers.get('x-tku-id') ?? 'anonymous';
    const result = setLike(tkuId, slug, true);
    return HttpResponse.json(wrapResponse(result));
  }),

  /**
   * 핫픽 좋아요 취소
   * DELETE /api/v1/hotpicks/:slug/like
   */
  http.delete(`${baseURL}/api/v1/hotpicks/:slug/like`, ({ request, params }) => {
    const slug = String(params.slug);
    const tkuId = request.headers.get('x-tku-id') ?? 'anonymous';
    const result = setLike(tkuId, slug, false);
    return HttpResponse.json(wrapResponse(result));
  }),

  /**
   * 투표 시계열 데이터 조회
   * GET /api/v1/hotpicks/:slug/election-series
   */
  http.get(`${baseURL}/api/v1/hotpicks/:slug/election-series`, ({ params, request }) => {
    const slug = String(params.slug);
    const url = new URL(request.url);
    const interval = url.searchParams.get('interval') ?? '1d';
    const voteData = singleVoteDataMap[slug];
    const series = getMockElectionSeries(slug, voteData, interval);
    if (!series) {
      return HttpResponse.json(wrapResponse(null), { status: 404 });
    }
    return HttpResponse.json(wrapResponse({ ...series, hotpickSlug: slug }));
  }),

  /**
   * 카테고리 목록 조회
   * GET /api/v1/hotpicks/categories
   */
  http.get(`${baseURL}/api/v1/hotpicks/categories`, () =>
    HttpResponse.json(wrapResponse(mockCategories))
  ),

  // ──────────────────────────────────────────────────────────
  // Comment API
  // ──────────────────────────────────────────────────────────

  /**
   * 댓글 목록 조회
   * GET /api/v1/hotpicks/:slug/elections/:electionId/comments
   */
  http.get(`${baseURL}/api/v1/hotpicks/:slug/elections/:electionId/comments`, ({ request }) => {
    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor') ?? undefined;
    const size = parseInt(url.searchParams.get('size') ?? '10', 10);
    const sort = (url.searchParams.get('sort') ?? 'latest') as 'latest' | 'popular';

    const response = getMockCommentListResponse(cursor, size, sort);
    return HttpResponse.json(wrapResponse(response));
  }),

  /**
   * 댓글 생성
   * POST /api/v1/hotpicks/:slug/elections/:electionId/comments
   */
  http.post(
    `${baseURL}/api/v1/hotpicks/:slug/elections/:electionId/comments`,
    async ({ request }) => {
      const body = (await request.json()) as {
        nickname: string;
        password: string;
        content: string;
      };
      const newComment = {
        id: `comment-${Date.now()}`,
        nickname: body.nickname,
        content: body.content,
        likeCount: 0,
        liked: false,
        edited: false,
        createdAt: new Date().toISOString(),
      };
      addMockComment(newComment);
      return HttpResponse.json(wrapResponse(newComment), { status: 201 });
    }
  ),

  /**
   * 댓글 개수 조회
   * GET /api/v1/hotpicks/:slug/elections/:electionId/comments/count
   */
  http.get(`${baseURL}/api/v1/hotpicks/:slug/elections/:electionId/comments/count`, () =>
    HttpResponse.json(wrapResponse({ count: Math.floor(Math.random() * 50) + 5 }))
  ),

  /**
   * 댓글 수정
   * PUT /api/v1/comments/:commentId
   */
  http.put(`${baseURL}/api/v1/comments/:commentId`, async ({ request, params }) => {
    const commentId = String(params.commentId);
    const body = (await request.json()) as { verifyToken: string; content: string };
    return HttpResponse.json(
      wrapResponse({
        id: commentId,
        content: body.content,
        edited: true,
        updatedAt: new Date().toISOString(),
      })
    );
  }),

  /**
   * 댓글 삭제
   * DELETE /api/v1/comments/:commentId
   */
  http.delete(`${baseURL}/api/v1/comments/:commentId`, () => HttpResponse.json(wrapResponse(null))),

  /**
   * 댓글 비밀번호 검증
   * POST /api/v1/comments/:commentId/verify
   */
  http.post(`${baseURL}/api/v1/comments/:commentId/verify`, async () =>
    HttpResponse.json(
      wrapResponse({
        verifyToken: `mock-token-${Date.now()}`,
        expiresIn: 300,
        expiredAt: new Date(Date.now() + 300_000).toISOString(),
      })
    )
  ),

  /**
   * 댓글 좋아요
   * POST /api/v1/comments/:commentId/like
   */
  http.post(`${baseURL}/api/v1/comments/:commentId/like`, () =>
    HttpResponse.json(wrapResponse({ liked: true, likeCount: Math.floor(Math.random() * 100) + 1 }))
  ),

  /**
   * 댓글 좋아요 취소
   * DELETE /api/v1/comments/:commentId/like
   */
  http.delete(`${baseURL}/api/v1/comments/:commentId/like`, () =>
    HttpResponse.json(wrapResponse({ liked: false, likeCount: Math.floor(Math.random() * 100) }))
  ),

  /**
   * Result 생성 (BUNDLE 전용 — 스텁)
   * POST /api/v1/result
   */
  http.post(`${baseURL}/api/v1/result`, async ({ request }) => {
    const tkuId = request.headers.get('x-tku-id') ?? '';
    const body = (await request.json()) as { trendId: number; selectedItems: unknown[] };
    const resultId = `result-${Date.now()}`;

    if (tkuId && body.trendId) {
      recordBundleVote(tkuId, String(body.trendId), resultId);
    }

    return HttpResponse.json(wrapResponse({ resultId }));
  }),

  /**
   * Result 전시 조회 (BUNDLE 전용 — 스텁)
   * GET /api/v1/display/result/:resultId
   */
  http.get(`${baseURL}/api/v1/display/result/:resultId`, () =>
    HttpResponse.json(wrapResponse(mockResultDisplay))
  ),

  // ──────────────────────────────────────────────────────────
  // Server Meta API (오프라인 투표)
  // ──────────────────────────────────────────────────────────

  /**
   * 서버 메타 조회
   * GET /api/v1/server-metas/:id
   */
  http.get(`${baseURL}/api/v1/server-metas/:id`, ({ params }) => {
    const id = String(params.id);

    // 테스트용 고정 서버 메타
    if (id === 'test-server-meta-001') {
      return HttpResponse.json(
        wrapResponse({
          id: 'test-server-meta-001',
          meta: {
            location: {
              code: '1100000000',
              sido: '서울특별시',
              sigungu: '강남구',
              eupmyeondong: '역삼동',
            },
            from: '2026-01-01',
            to: '2026-12-31',
          },
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        })
      );
    }

    // 위치 정보 없는 메타
    if (id === 'test-server-meta-no-location') {
      return HttpResponse.json(
        wrapResponse({
          id: 'test-server-meta-no-location',
          meta: {},
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        })
      );
    }

    // 존재하지 않는 ID
    return HttpResponse.json(
      { code: 'NOT_FOUND', message: '서버 메타를 찾을 수 없습니다.', data: null },
      { status: 404 }
    );
  }),
];
