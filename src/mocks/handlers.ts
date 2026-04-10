import { http, HttpResponse } from 'msw';

import {
  bundleAnswerStore,
  mockBundleDetails,
  mockBundleElections,
  recordBundleAnswers,
  getBundleResult,
} from '@/mocks/data/bundles';
import { getMockCommentListResponse, addMockComment } from '@/mocks/data/comments';
import {
  createCompareLink,
  getCompareLink,
  joinCompareLink,
  getCompareResult,
  getMyCompareLinks,
  compareLinkStore,
} from '@/mocks/data/compare';
import { getMockElectionSeries } from '@/mocks/data/electionSeries';
import { getGroupCompareResult } from '@/mocks/data/group-compare';
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
import { mockSuggestions } from '@/mocks/data/suggestions';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://hotpick-api.votebox.kr';

/**
 * Mock 인증 사용자 데이터
 */
let mockUser: {
  id: number;
  nickname: string | null;
  profileColor: string;
  lastNicknameChangedAt: string | null;
} | null = {
  id: 1001,
  nickname: '테스트유저',
  profileColor: 'purple',
  lastNicknameChangedAt: null,
};
const usedNicknames = new Set<string>();

const nicknameAdjectives = [
  '용감한',
  '빛나는',
  '귀여운',
  '멋진',
  '즐거운',
  '활발한',
  '따뜻한',
  '신나는',
];
const nicknameNouns = ['호랑이', '고양이', '강아지', '토끼', '판다', '여우', '사자', '돌고래'];

function generateRandomNickname(): string {
  const adj = nicknameAdjectives[Math.floor(Math.random() * nicknameAdjectives.length)];
  const noun = nicknameNouns[Math.floor(Math.random() * nicknameNouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}${noun}${num}`;
}

/**
 * Mock 카테고리 데이터 (Admin CRUD + Public 탭 공유)
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
  // Auth API (카카오 로그인 / 사용자 인증)
  // ──────────────────────────────────────────────────────────

  /**
   * 카카오 로그인
   * POST /api/auth/kakao
   */
  http.post(`${baseURL}/api/v1/auth/kakao`, async ({ request }) => {
    const body = (await request.json()) as { code: string; redirectUri: string };
    const isSignUp = body.code.includes('new');
    mockUser = {
      id: 1001,
      nickname: isSignUp ? null : '테스트유저',
      profileColor: 'purple',
      lastNicknameChangedAt: null,
    };
    return HttpResponse.json(
      wrapResponse({
        user: mockUser,
        isSignUp,
      })
    );
  }),

  /**
   * 내 정보 조회
   * GET /api/auth/me
   */
  http.get(`${baseURL}/api/v1/auth/me`, () => {
    if (!mockUser) {
      return HttpResponse.json(
        { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.', data: null },
        { status: 401 }
      );
    }
    return HttpResponse.json(wrapResponse(mockUser));
  }),

  /**
   * 토큰 갱신
   * POST /api/auth/refresh
   */
  http.post(`${baseURL}/api/v1/auth/refresh`, () => {
    if (!mockUser) {
      return HttpResponse.json(
        { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.', data: null },
        { status: 401 }
      );
    }
    return HttpResponse.json(wrapResponse(null));
  }),

  /**
   * 로그아웃
   * POST /api/auth/logout
   */
  http.post(`${baseURL}/api/v1/auth/logout`, () => {
    mockUser = null;
    return HttpResponse.json(wrapResponse(null));
  }),

  /**
   * 익명 투표 연동
   * POST /api/auth/link
   */
  http.post(`${baseURL}/api/v1/auth/link`, async ({ request }) => {
    const body = (await request.json()) as { tkuId: string };
    return HttpResponse.json(
      wrapResponse({
        linked: true,
        votesCount: Math.floor(Math.random() * 10) + 1,
        tkuId: body.tkuId,
      })
    );
  }),

  /**
   * 회원 탈퇴
   * DELETE /api/auth/me
   */
  http.delete(`${baseURL}/api/v1/auth/me`, () => {
    mockUser = null;
    return HttpResponse.json(wrapResponse(null));
  }),

  /**
   * 닉네임 추천
   * GET /api/auth/nickname/suggest
   */
  http.get(`${baseURL}/api/v1/auth/nickname/suggest`, () => {
    const nickname = generateRandomNickname();
    return HttpResponse.json(wrapResponse({ nickname }));
  }),

  /**
   * 닉네임 중복 체크
   * GET /api/auth/nickname/check
   */
  http.get(`${baseURL}/api/v1/auth/nickname/check`, ({ request }) => {
    const url = new URL(request.url);
    const nickname = url.searchParams.get('nickname') ?? '';
    const isDuplicate = usedNicknames.has(nickname);
    return HttpResponse.json(wrapResponse({ nickname, available: !isDuplicate }));
  }),

  /**
   * 프로필 설정 (회원가입/닉네임 변경)
   * PATCH /api/auth/me
   */
  http.patch(`${baseURL}/api/v1/auth/me`, async ({ request }) => {
    // MSW 환경: 카카오 리다이렉트로 mockUser가 초기화된 경우 복원
    const currentUser = mockUser ?? {
      id: 1001,
      nickname: null,
      profileColor: 'purple',
      lastNicknameChangedAt: null,
    };
    const body = (await request.json()) as {
      nickname?: string;
      gender?: string | null;
      birthYear?: number | null;
      profileColor?: string;
    };
    if (body.nickname) {
      usedNicknames.add(body.nickname);
      currentUser.nickname = body.nickname;
    }
    if (body.profileColor) {
      currentUser.profileColor = body.profileColor;
    }
    mockUser = currentUser;
    // 회원가입 시 needsLink 반환 (닉네임 설정 = 회원가입)
    const isSignup = body.nickname && currentUser.nickname === body.nickname;
    return HttpResponse.json(
      wrapResponse({
        user: currentUser,
        ...(isSignup ? { needsLink: true } : {}),
      })
    );
  }),

  /**
   * 내 투표 목록 조회
   * GET /api/users/me/votes
   */
  http.get(`${baseURL}/api/v1/users/me/votes`, ({ request }) => {
    if (!mockUser) {
      return HttpResponse.json(
        { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.', data: null },
        { status: 401 }
      );
    }
    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor');
    const size = parseInt(url.searchParams.get('size') ?? '10', 10);

    const mockVotes = Array.from({ length: size }, (_, i) => ({
      hotpickId: 100 + i + (cursor ? parseInt(cursor, 10) : 0),
      slug: `mock-vote-${100 + i}`,
      title: `투표한 핫픽 ${100 + i}`,
      myElectionItemId: i % 2 === 0 ? 1 : 2,
      votedAt: new Date(Date.now() - i * 86400000).toISOString(),
    }));

    return HttpResponse.json(
      wrapResponse({
        votes: mockVotes,
        hasMore: true,
        nextCursor: String((cursor ? parseInt(cursor, 10) : 0) + size),
      })
    );
  }),

  /**
   * 내 댓글 목록 조회
   * GET /api/users/me/comments
   * cursor 기반 페이지네이션 (CursorPageResponseMyCommentResponse)
   */
  http.get(`${baseURL}/api/v1/users/me/comments`, ({ request }) => {
    if (!mockUser) {
      return HttpResponse.json(
        { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.', data: null },
        { status: 401 }
      );
    }
    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor');
    const size = parseInt(url.searchParams.get('size') ?? '20', 10);

    // 실제 핫픽 slug/title을 참조하는 리얼리스틱 댓글 데이터
    const allComments = [
      {
        hotpickSlug: 'single-love',
        hotpickTitle: '첫 데이트 장소는?',
        content: '카페가 좋죠! 조용하게 대화하면서 서로를 알아갈 수 있어서',
        createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
      },
      {
        hotpickSlug: 'single-text-finance',
        hotpickTitle: '적금 vs 주식?',
        content: '요즘 금리가 높아져서 적금도 나쁘지 않은데... 주식이 장기적으로는 낫지 않나요?',
        createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
      },
      {
        hotpickSlug: 'single-img-coffee',
        hotpickTitle: '아메리카노 vs 라떼?',
        content: '아아는 진리입니다. 여름이든 겨울이든 아이스 아메리카노!',
        createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
      },
      {
        hotpickSlug: 'single-chicken',
        hotpickTitle: '치킨은 후라이드 vs 양념?',
        content: '양념 치킨 없이 못 삽니다. 매콤달콤 양념이 최고예요',
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
      {
        hotpickSlug: 'single-work',
        hotpickTitle: '재택 vs 출근?',
        content: '재택이 좋은데 자기관리가 안 되면 출근이 나을 수도... 하지만 재택!',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        hotpickSlug: 'single-trend',
        hotpickTitle: 'AI가 인간을 대체할까?',
        content: 'AI가 보조 도구로는 좋지만 완전 대체는 아직 먼 얘기인 것 같아요',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        hotpickSlug: 'single-movie',
        hotpickTitle: '영화는 극장 vs OTT?',
        content: '극장의 큰 화면과 사운드를 OTT가 따라올 수 있나요? 극장파입니다',
        createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
      {
        hotpickSlug: 'single-beer',
        hotpickTitle: '퇴근 후 한 잔: 맥주 vs 소주?',
        content: '치맥의 나라에서 맥주를 안 고를 수가 없죠 ㅋㅋ',
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
      {
        hotpickSlug: 'single-img-pet',
        hotpickTitle: '강아지 vs 고양이, 당신의 반려동물은?',
        content: '강아지! 퇴근하면 달려오는 강아지한테 힐링 받아요',
        createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      },
      {
        hotpickSlug: 'single-img-travel',
        hotpickTitle: '여행지는 산 vs 바다?',
        content: '바다 앞에서 맥주 한 잔이면 그게 천국이죠',
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
      {
        hotpickSlug: 'single-morning',
        hotpickTitle: '당신은 아침형 vs 저녁형?',
        content: '저녁형인데 아침형이 되고 싶은 사람 여기 있습니다...',
        createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      },
      {
        hotpickSlug: 'single-game',
        hotpickTitle: 'PC 게임 vs 모바일 게임?',
        content: 'PC 게임이 몰입감은 최고인데 출퇴근에는 모바일이 편하고...',
        createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
      },
    ];

    const cursorIdx = cursor ? parseInt(cursor, 10) : 0;
    const pageData = allComments.slice(cursorIdx, cursorIdx + size);
    const nextIdx = cursorIdx + size;
    const hasMore = nextIdx < allComments.length;

    return HttpResponse.json(
      wrapResponse({
        data: pageData,
        nextCursor: hasMore ? String(nextIdx) : undefined,
        hasMore,
      })
    );
  }),

  /**
   * 좋아요한 핫픽 목록 조회
   * GET /api/users/me/likes
   * cursor 기반 페이지네이션 (CursorPageResponseMyLikeResponse)
   */
  http.get(`${baseURL}/api/v1/users/me/likes`, ({ request }) => {
    if (!mockUser) {
      return HttpResponse.json(
        { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.', data: null },
        { status: 401 }
      );
    }
    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor');
    const size = parseInt(url.searchParams.get('size') ?? '20', 10);

    // 실제 핫픽을 참조하는 좋아요 목 데이터
    const allLikes = [
      {
        hotpickId: 201,
        hotpickAlias: 'single-love',
        hotpickTitle: '첫 데이트 장소는?',
        optionSummary: '분위기 좋은 카페 vs 놀이공원',
        likedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
      {
        hotpickId: 401,
        hotpickAlias: 'single-img-coffee',
        hotpickTitle: '아메리카노 vs 라떼?',
        optionSummary: '아메리카노 vs 라떼',
        likedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
      },
      {
        hotpickId: 302,
        hotpickAlias: 'single-chicken',
        hotpickTitle: '치킨은 후라이드 vs 양념?',
        optionSummary: '후라이드 vs 양념 vs 반반',
        likedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
      {
        hotpickId: 206,
        hotpickAlias: 'single-trend',
        hotpickTitle: 'AI가 인간을 대체할까?',
        optionSummary: '대체한다 vs 공존한다 vs 불가능하다',
        likedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        hotpickId: 402,
        hotpickAlias: 'single-img-pet',
        hotpickTitle: '강아지 vs 고양이, 당신의 반려동물은?',
        optionSummary: '강아지 vs 고양이 vs 햄스터',
        likedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        hotpickId: 413,
        hotpickAlias: 'single-beer',
        hotpickTitle: '퇴근 후 한 잔: 맥주 vs 소주?',
        optionSummary: '맥주 vs 소주 vs 와인 vs 위스키',
        likedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
      {
        hotpickId: 403,
        hotpickAlias: 'single-img-travel',
        hotpickTitle: '여행지는 산 vs 바다?',
        optionSummary: '산 vs 바다 vs 도시 vs 시골',
        likedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
      {
        hotpickId: 411,
        hotpickAlias: 'single-game',
        hotpickTitle: 'PC 게임 vs 모바일 게임?',
        optionSummary: 'PC 게임 vs 모바일 게임',
        likedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      },
      {
        hotpickId: 205,
        hotpickAlias: 'single-work',
        hotpickTitle: '재택 vs 출근?',
        optionSummary: '재택근무 vs 사무실 출근',
        likedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
      {
        hotpickId: 406,
        hotpickAlias: 'single-movie',
        hotpickTitle: '영화는 극장 vs OTT?',
        optionSummary: '극장 vs OTT',
        likedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      },
    ];

    const cursorIdx = cursor ? parseInt(cursor, 10) : 0;
    const pageData = allLikes.slice(cursorIdx, cursorIdx + size);
    const nextIdx = cursorIdx + size;
    const hasMore = nextIdx < allLikes.length;

    return HttpResponse.json(
      wrapResponse({
        data: pageData,
        nextCursor: hasMore ? String(nextIdx) : undefined,
        hasMore,
      })
    );
  }),

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

    // closed 필터는 상태 병합 전에 적용 가능
    if (filter === 'closed') {
      hotpicks = hotpicks.filter((hp) => hp.isExpired === true);
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

    // voted 필터는 상태 병합 후에 적용 (voteStore 반영 필요)
    if (filter === 'voted') {
      hotpicks = hotpicks.filter((hp) => hp.election?.voted === true);
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

  // ─── 번들 API ───

  /** GET /api/v1/bundles — 번들 목록 */
  http.get(`${baseURL}/api/v1/bundles`, ({ request }) => {
    const url = new URL(request.url);
    const filter = url.searchParams.get('filter');
    const allBundles = Object.values(mockBundleDetails);

    if (filter === 'completed') {
      // mock-user-1이 완료한 번들만
      const completed = allBundles.filter((b) => bundleAnswerStore.has(`mock-user-1_${b.slug}`));
      return HttpResponse.json({ code: 'SUCCESS', message: '성공', data: completed });
    }

    return HttpResponse.json({ code: 'SUCCESS', message: '성공', data: allBundles });
  }),

  /** GET /api/v1/bundles/{slug}/my-compare-links — 내 비교 링크 목록 */
  http.get(`${baseURL}/api/v1/bundles/:slug/my-compare-links`, ({ params }) => {
    const slug = params.slug as string;
    const links = getMyCompareLinks(slug, 'mock-user-1');
    return HttpResponse.json({ code: 'SUCCESS', message: '성공', data: links });
  }),

  /** GET /api/v1/bundles/{slug}/elections — 번들 질문 목록 */
  http.get(`${baseURL}/api/v1/bundles/:slug/elections`, ({ params }) => {
    const slug = params.slug as string;
    const elections = mockBundleElections[slug];
    if (!elections) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '번들을 찾을 수 없습니다', data: null },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      code: 'SUCCESS',
      message: '성공',
      data: elections,
    });
  }),

  /** GET /api/v1/bundles/{slug} — 번들 상세 (인트로) */
  http.get(`${baseURL}/api/v1/bundles/:slug`, ({ params }) => {
    const slug = params.slug as string;
    const bundle = mockBundleDetails[slug];
    if (!bundle) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '번들을 찾을 수 없습니다', data: null },
        { status: 404 }
      );
    }
    const userId = 'mock-user-1';
    const completed = !!getBundleResult(userId, slug);
    return HttpResponse.json({
      code: 'SUCCESS',
      message: '성공',
      data: { ...bundle, completed },
    });
  }),

  /** POST /api/v1/bundles/{slug}/answers — 답변 제출 */
  http.post(`${baseURL}/api/v1/bundles/:slug/answers`, async ({ params, request }) => {
    const slug = params.slug as string;
    const body = (await request.json()) as {
      answers: Array<{ electionId: string; selected: 'A' | 'B' }>;
    };
    const userId = 'mock-user-1';
    recordBundleAnswers(userId, slug, body.answers);
    return HttpResponse.json({
      code: 'SUCCESS',
      message: '답변이 제출되었습니다',
      data: { completed: true },
    });
  }),

  /** GET /api/v1/bundles/{slug}/my-result — 내 결과 조회 */
  http.get(`${baseURL}/api/v1/bundles/:slug/my-result`, ({ params }) => {
    const slug = params.slug as string;
    const userId = 'mock-user-1';
    const isGradeTest = slug.startsWith('grade-');
    let result = isGradeTest ? null : getBundleResult(userId, slug);
    // DEV: 결과가 없거나 등급 테스트이면 하드코딩 목업 반환 (디자인 확인용)
    if (!result) {
      const elections = mockBundleElections[slug];
      if (elections) {
        const detail = mockBundleDetails[slug];

        // 등급 테스트: 유저는 항상 A, A 득표율로 대중성 결정
        // 가중 평균 = seedRatios 평균 → 등급 경계: 68/58/48/38
        const gradeSeeds: Record<string, number[]> = {
          'grade-king': [80, 72, 65, 75, 68], // 평균 72% → 사자왕
          'grade-leader': [65, 58, 62, 55, 70], // 평균 62% → 여우
          'grade-balancer': [55, 48, 52, 45, 60], // 평균 52% → 판다
          'grade-rebel': [45, 38, 42, 40, 50], // 평균 43% → 고양이
          'grade-unicorn': [30, 25, 35, 28, 32], // 평균 30% → 유니콘
        };
        const seedRatios = gradeSeeds[slug] ?? [62, 45, 71, 38, 55];
        const isGradeTest = slug.startsWith('grade-');

        result = {
          bundleSlug: slug,
          bundleTitle: detail?.title ?? slug,
          totalQuestions: elections.length,
          myAnswers: elections.map((e, i) => ({
            electionId: e.electionId,
            title: e.title,
            optionA: e.optionA,
            optionB: e.optionB,
            selected: (isGradeTest ? 'A' : i % 2 === 0 ? 'A' : 'B') as 'A' | 'B',
          })),
          questionStats: elections.map((e, i) => ({
            electionId: e.electionId,
            optionACount: seedRatios[i] ?? 50,
            optionBCount: 100 - (seedRatios[i] ?? 50),
          })),
        };
      }
    }
    if (!result) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '결과를 찾을 수 없습니다', data: null },
        { status: 404 }
      );
    }
    return HttpResponse.json({ code: 'SUCCESS', message: '성공', data: result });
  }),

  // ─── 비교 API ───

  /** POST /api/v1/bundles/{slug}/compare-links — 비교 링크 생성 */
  http.post(`${baseURL}/api/v1/bundles/:slug/compare-links`, async ({ params, request }) => {
    const slug = params.slug as string;
    const body = (await request.json()) as {
      type: 'ONE_TO_ONE' | 'GROUP';
      groupName?: string;
      showGenderContent?: boolean;
    };
    const result = createCompareLink(
      'mock-user-1',
      '웅이',
      slug,
      body.type,
      body.showGenderContent ?? false
    );
    // 그룹 생성 시 생성자를 자동으로 멤버에 추가
    if (body.type === 'GROUP') {
      const link = compareLinkStore.get(result.token);
      if (link) {
        link.groupName = body.groupName ?? null;
        link.groupMembers.push({ userId: 'mock-user-1', nickname: '웅이' });
        link.status = 'COMPLETED';
      }
    }
    return HttpResponse.json({
      code: 'SUCCESS',
      message: '비교 링크가 생성되었습니다',
      data: result,
    });
  }),

  /** GET /api/v1/compare-links/{token} — 비교 링크 정보 조회 */
  http.get(`${baseURL}/api/v1/compare-links/:token`, ({ params }) => {
    const token = params.token as string;
    // 비로그인 유저 시뮬레이션
    const ANONYMOUS_TOKENS = ['invite2', 'guest-loggedout'];
    const currentUserId = ANONYMOUS_TOKENS.includes(token) ? 'anonymous' : 'mock-user-1';
    const link = getCompareLink(token, currentUserId);
    if (!link) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '비교 링크를 찾을 수 없습니다', data: null },
        { status: 404 }
      );
    }
    return HttpResponse.json({ code: 'SUCCESS', message: '성공', data: link });
  }),

  /** POST /api/v1/compare-links/{token}/join — 비교 링크 참여 */
  http.post(`${baseURL}/api/v1/compare-links/:token/join`, async ({ params, request }) => {
    const token = params.token as string;
    const body = (await request.json().catch(() => ({}))) as {
      displayName?: string;
      profileColor?: string;
    };
    // MSW에서는 mock-user-2로 참여 시뮬레이션
    const result = joinCompareLink(
      token,
      'mock-user-2',
      body.displayName ?? '수진',
      body.profileColor
    );
    if (!result.success) {
      return HttpResponse.json(
        { code: 'BAD_REQUEST', message: result.message, data: null },
        { status: 400 }
      );
    }
    return HttpResponse.json({ code: 'SUCCESS', message: result.message, data: { joined: true } });
  }),

  /** GET /api/v1/compare-links/{token}/result — 1:1 비교 결과 */
  http.get(`${baseURL}/api/v1/compare-links/:token/result`, ({ params }) => {
    const token = params.token as string;
    const result = getCompareResult(token, 'mock-user-1');
    if (!result) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '비교 결과를 찾을 수 없습니다', data: null },
        { status: 404 }
      );
    }
    return HttpResponse.json({ code: 'SUCCESS', message: '성공', data: result });
  }),

  // ─── 그룹 비교 API ───

  /** GET /api/v1/compare-links/{token}/group-result — 그룹 비교 결과 */
  http.get(`${baseURL}/api/v1/compare-links/:token/group-result`, ({ params }) => {
    const token = params.token as string;
    const link = compareLinkStore.get(token);
    if (!link || link.type !== 'GROUP') {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '그룹 비교 결과를 찾을 수 없습니다', data: null },
        { status: 404 }
      );
    }
    if (link.groupMembers.length < 1) {
      return HttpResponse.json(
        { code: 'BAD_REQUEST', message: '참여 인원이 부족합니다', data: null },
        { status: 400 }
      );
    }
    const ANONYMOUS_GROUP_TOKENS = ['guest-loggedout'];
    const myUserId = ANONYMOUS_GROUP_TOKENS.includes(token) ? 'anonymous' : 'mock-user-1';
    const result = getGroupCompareResult(
      link.bundleSlug,
      link.groupName ?? '그룹',
      link.groupMembers,
      myUserId,
      link.showGenderContent,
      link.creatorUserId,
      link.isClosed
    );
    if (!result) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '그룹 비교 결과를 찾을 수 없습니다', data: null },
        { status: 404 }
      );
    }
    return HttpResponse.json({ code: 'SUCCESS', message: '성공', data: result });
  }),

  /** PATCH /api/v1/compare-links/{token}/my-profile — 그룹 내 내 프로필 수정 */
  http.patch(`${baseURL}/api/v1/compare-links/:token/my-profile`, async ({ params, request }) => {
    const token = params.token as string;
    const link = compareLinkStore.get(token);
    if (!link || link.type !== 'GROUP') {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '그룹을 찾을 수 없습니다', data: null },
        { status: 404 }
      );
    }
    const body = (await request.json()) as {
      displayName?: string;
      displayProfileColor?: string;
    };
    const member = link.groupMembers.find((m) => m.userId === 'mock-user-1');
    if (!member) {
      return HttpResponse.json(
        { code: 'FORBIDDEN', message: '그룹 멤버가 아닙니다', data: null },
        { status: 403 }
      );
    }
    if (body.displayName) {
      member.nickname = body.displayName;
    }
    if (body.displayProfileColor) {
      member.displayProfileColor = body.displayProfileColor;
    }
    return HttpResponse.json({ code: 'SUCCESS', message: '프로필 수정 완료', data: null });
  }),

  /** PATCH /api/v1/compare-links/{token}/settings — 그룹 설정 수정 */
  http.patch(`${baseURL}/api/v1/compare-links/:token/settings`, async ({ params, request }) => {
    const token = params.token as string;
    const link = compareLinkStore.get(token);
    if (!link || link.type !== 'GROUP') {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '그룹을 찾을 수 없습니다', data: null },
        { status: 404 }
      );
    }
    if (link.creatorUserId !== 'mock-user-1') {
      return HttpResponse.json(
        { code: 'FORBIDDEN', message: '그룹 생성자만 설정을 변경할 수 있습니다', data: null },
        { status: 403 }
      );
    }
    const body = (await request.json()) as { groupName?: string; showGenderContent?: boolean };
    if (body.groupName !== undefined) {
      link.groupName = body.groupName;
    }
    if (body.showGenderContent !== undefined) {
      link.showGenderContent = body.showGenderContent;
    }
    return HttpResponse.json({ code: 'SUCCESS', message: '설정이 변경되었습니다', data: null });
  }),

  /** PATCH /api/v1/compare-links/{token}/close — 그룹 마감 */
  http.patch(`${baseURL}/api/v1/compare-links/:token/close`, ({ params }) => {
    const token = params.token as string;
    const link = compareLinkStore.get(token);
    if (!link || link.type !== 'GROUP') {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '그룹을 찾을 수 없습니다', data: null },
        { status: 404 }
      );
    }
    if (link.creatorUserId !== 'mock-user-1') {
      return HttpResponse.json(
        { code: 'FORBIDDEN', message: '그룹 생성자만 마감할 수 있습니다', data: null },
        { status: 403 }
      );
    }
    link.isClosed = true;
    return HttpResponse.json({
      code: 'SUCCESS',
      message: '그룹이 마감되었습니다',
      data: { closed: true },
    });
  }),

  /** PATCH /api/v1/compare-links/{token}/reopen — 그룹 재오픈 */
  http.patch(`${baseURL}/api/v1/compare-links/:token/reopen`, ({ params }) => {
    const token = params.token as string;
    const link = compareLinkStore.get(token);
    if (!link || link.type !== 'GROUP') {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '그룹을 찾을 수 없습니다', data: null },
        { status: 404 }
      );
    }
    if (link.creatorUserId !== 'mock-user-1') {
      return HttpResponse.json(
        { code: 'FORBIDDEN', message: '그룹 생성자만 재오픈할 수 있습니다', data: null },
        { status: 403 }
      );
    }
    link.isClosed = false;
    return HttpResponse.json({
      code: 'SUCCESS',
      message: '그룹이 재오픈되었습니다',
      data: { closed: false },
    });
  }),

  /** POST /api/v1/compare-links/{groupToken}/pair — 그룹 내 1:1 비교 즉시 생성 */
  http.post(`${baseURL}/api/v1/compare-links/:token/pair`, async ({ params, request }) => {
    const { token } = params;
    const body = (await request.json()) as { targetUserId: string };
    const link = compareLinkStore.get(token as string);
    if (!link) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '그룹을 찾을 수 없습니다', data: null },
        { status: 404 }
      );
    }
    // mock: 기존 1:1 compare link를 생성하고 토큰 반환
    const pairToken = `pair-${token}-${body.targetUserId}`.slice(0, 24);
    // 기존 compare mock 데이터 재활용을 위해 store에 등록
    if (!compareLinkStore.has(pairToken)) {
      compareLinkStore.set(pairToken, {
        token: pairToken,
        type: 'ONE_TO_ONE' as const,
        bundleSlug: link.bundleSlug,
        creatorUserId: 'mock-user-1',
        creatorNickname: '나',
        participantUserId: body.targetUserId,
        participantNickname: body.targetUserId,
        status: 'COMPLETED' as const,
        groupName: null,
        groupMembers: [],
        isClosed: false,
        showGenderContent: false,
      });
    }
    return HttpResponse.json({
      code: 'SUCCESS',
      message: '1:1 비교 링크가 생성되었습니다',
      data: { token: pairToken },
    });
  }),

  // ──────────────────────────────────────────────────────────
  // Suggestion API
  // ──────────────────────────────────────────────────────────

  /**
   * 핫픽 제안 제출
   * POST /api/v1/suggestions
   */
  http.post(`${baseURL}/api/v1/suggestions`, () => HttpResponse.json(wrapResponse(null))),

  /**
   * 어드민: 제안 목록 조회
   * GET /admin/api/v1/suggestions
   */
  http.get(`${baseURL}/admin/api/v1/suggestions`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const filtered = status ? mockSuggestions.filter((s) => s.status === status) : mockSuggestions;
    return HttpResponse.json(wrapResponse(filtered));
  }),

  /**
   * 어드민: 제안 상세 조회
   * GET /admin/api/v1/suggestions/:id
   */
  http.get(`${baseURL}/admin/api/v1/suggestions/:id`, ({ params }) => {
    const id = Number(params.id);
    const suggestion = mockSuggestions.find((s) => s.id === id);
    if (!suggestion) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '제안을 찾을 수 없습니다', data: null },
        { status: 404 }
      );
    }
    return HttpResponse.json(wrapResponse(suggestion));
  }),

  /**
   * 어드민: 제안 승인
   * POST /admin/api/v1/suggestions/:id/approve
   */
  http.post(`${baseURL}/admin/api/v1/suggestions/:id/approve`, ({ params }) => {
    const id = Number(params.id);
    const suggestion = mockSuggestions.find((s) => s.id === id);
    if (suggestion) {
      suggestion.status = 'APPROVED';
      suggestion.reviewedAt = new Date().toISOString();
    }
    return HttpResponse.json(wrapResponse(suggestion));
  }),

  /**
   * 어드민: 제안 거절
   * POST /admin/api/v1/suggestions/:id/reject
   */
  http.post(`${baseURL}/admin/api/v1/suggestions/:id/reject`, ({ params }) => {
    const id = Number(params.id);
    const suggestion = mockSuggestions.find((s) => s.id === id);
    if (suggestion) {
      suggestion.status = 'REJECTED';
      suggestion.reviewedAt = new Date().toISOString();
    }
    return HttpResponse.json(wrapResponse(suggestion));
  }),
];
