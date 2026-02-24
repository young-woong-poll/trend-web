import { http, HttpResponse } from 'msw';

import { getMockCommentListResponse } from '@/mocks/data/comments';
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
    const tkuId = request.headers.get('x-tku-id') ?? '';

    let hotpicks = [...(mockMainHotpicks.hotpicks ?? [])];

    // 카테고리 필터링
    if (category) {
      hotpicks = hotpicks.filter((hp) => {
        const cats = hp.categories ?? [];
        return cats.some((c) => c.slug === category || c.name === category);
      });
    }

    // x-tku-id 기반 기투표 상태 반영
    if (tkuId) {
      hotpicks = hotpicks.map((hp) => {
        const slug = hp.slug ?? '';
        const hotpickId = String(hp.hotpickId ?? '');
        const election = hp.election;
        if (!election) {
          return hp;
        }

        const vote = getVote(tkuId, hotpickId);
        if (vote) {
          const optionCounts = getOptionCounts(hotpickId);
          const total = getTotalVotes(hotpickId);
          return {
            ...hp,
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
          return { ...hp, participated: true };
        }

        return hp;
      });
    }

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
   * 핫픽 상세 조회
   * GET /api/v1/hotpicks/:slug
   */
  http.get(`${baseURL}/api/v1/hotpicks/:slug`, ({ params, request }) => {
    const slug = String(params.slug);
    const detailData = mockHotpickDetailMap[slug] ?? mockHotpickDetailBundleConverted;

    const tkuId = request.headers.get('x-tku-id') ?? '';
    const hotpickId = String(detailData.hotpick?.hotpickId ?? '');

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

    return HttpResponse.json(wrapResponse(detailData));
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
            items: svData.options.map((opt) => {
              const sc = optionCounts.find((c) => c.id === opt.id);
              return {
                electionItemId: Number(opt.id.replace(/\D/g, '')) || 0,
                title: opt.text,
                imageUrl: opt.imageUrl,
                voteCount: sc?.count ?? opt.voteCount ?? 0,
                voteRate: total > 0 ? Math.round(((sc?.count ?? 0) / total) * 100) : 0,
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
        items: svData.options.map((opt) => {
          const sc = optionCounts.find((c) => c.id === opt.id);
          return {
            electionItemId: Number(opt.id.replace(/\D/g, '')) || 0,
            title: opt.text,
            imageUrl: opt.imageUrl,
            voteCount: sc?.count ?? opt.voteCount ?? 0,
            voteRate: total > 0 ? Math.round(((sc?.count ?? 0) / total) * 100) : 0,
          };
        }),
      })
    );
  }),

  /**
   * 카테고리 목록 조회
   * GET /api/v1/hotpicks/categories
   */
  http.get(`${baseURL}/api/v1/hotpicks/categories`, () =>
    HttpResponse.json(
      wrapResponse([
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
      ])
    )
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
  // Admin Hotpick CRUD
  // ──────────────────────────────────────────────────────────

  /**
   * 핫픽 목록 조회
   * GET /admin/api/v1/hotpicks
   */
  http.get(`${baseURL}/admin/api/v1/hotpicks`, () => {
    const summaries = (mockMainHotpicks.hotpicks ?? []).map((hp) => ({
      id: hp.hotpickId,
      type: hp.type,
      slug: hp.slug,
      visible: true,
      imageUrl: hp.imageUrl,
      createdAt: hp.expiredAt,
      expiredAt: hp.expiredAt,
      categories: hp.categories,
      electionId: hp.election?.electionId,
      electionTitle: hp.election?.title,
    }));
    return HttpResponse.json(wrapResponse(summaries));
  }),

  /**
   * Slug 중복 체크
   * GET /admin/api/v1/hotpicks/check-slug
   */
  http.get(`${baseURL}/admin/api/v1/hotpicks/check-slug`, ({ request }) => {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug') ?? '';
    const exists = (mockMainHotpicks.hotpicks ?? []).some((hp) => hp.slug === slug);
    return HttpResponse.json(wrapResponse({ exists }));
  }),

  /**
   * 핫픽 상세 조회
   * GET /admin/api/v1/hotpicks/:id
   */
  http.get(`${baseURL}/admin/api/v1/hotpicks/:id`, ({ params }) => {
    const id = Number(params.id);
    const hp = (mockMainHotpicks.hotpicks ?? []).find((h) => h.hotpickId === id);
    if (!hp) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '핫픽을 찾을 수 없습니다.', data: null },
        { status: 404 }
      );
    }
    const detail = {
      id: hp.hotpickId,
      type: hp.type,
      slug: hp.slug,
      visible: true,
      imageUrl: hp.imageUrl,
      createdAt: hp.expiredAt,
      expiredAt: hp.expiredAt,
      categories: (hp.categories ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      })),
      election: hp.election
        ? {
            id: hp.election.electionId,
            hotpickId: hp.hotpickId,
            title: hp.election.title,
            imageUrl: hp.election.imageUrl,
            totalVoteCount: hp.election.totalVoteCount,
            totalCommentCount: hp.election.totalCommentCount,
            items: (hp.election.items ?? []).map((item) => ({
              id: item.electionItemId,
              displayOrder: item.displayOrder,
              title: item.title,
              imageUrl: item.imageUrl,
              voteCount: item.voteCount,
            })),
          }
        : undefined,
    };
    return HttpResponse.json(wrapResponse(detail));
  }),

  /**
   * 핫픽 생성
   * POST /admin/api/v1/hotpicks
   */
  http.post(`${baseURL}/admin/api/v1/hotpicks`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(wrapResponse({ id: Date.now(), ...body }), { status: 201 });
  }),

  /**
   * 핫픽 수정
   * PUT /admin/api/v1/hotpicks/:id
   */
  http.put(`${baseURL}/admin/api/v1/hotpicks/:id`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(wrapResponse({ id: Number(params.id), ...body }));
  }),

  /**
   * 핫픽 삭제
   * DELETE /admin/api/v1/hotpicks/:id
   */
  http.delete(`${baseURL}/admin/api/v1/hotpicks/:id`, () => HttpResponse.json(wrapResponse(null))),
];
