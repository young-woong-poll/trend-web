import type {
  MainHotpickResponse,
  HotpickCardResponse,
  HotpickDetailResponse,
} from '@/generated/models';

// ──────────────────────────────────────────────────────────
// 메인피드 Mock 데이터 — 싱글/번들 혼합 피드
//
// 테스트 케이스:
// 1. SINGLE 인라인 투표 (투표 전/후 상태)
// 2. BUNDLE 카드 (상세페이지 이동)
// 3. 혼합 배치: 싱글 7~10개당 번들 1개
// 4. 카테고리 필터
// 5. 마감/CLOSED 상태
// ──────────────────────────────────────────────────────────

const now = new Date();
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000).toISOString();
const daysFromNow = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000).toISOString();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();

// ──────────────────────────────────────────────────────────
// 싱글 핫픽 투표 옵션 데이터
// ──────────────────────────────────────────────────────────

export interface MockSingleVote {
  electionId: string;
  options: { id: string; text: string; imageUrl?: string; voteCount: number | null }[];
  voted: boolean;
  myChoiceId: string | null;
  totalVotes: number | null;
}

/** 싱글 핫픽별 투표 옵션 매핑 */
export const singleVoteDataMap: Record<string, MockSingleVote> = {
  'single-love': {
    electionId: 's1',
    options: [
      { id: 's1-o1', text: '분위기 좋은 카페', voteCount: null },
      { id: 's1-o2', text: '놀이공원', voteCount: null },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: null,
  },
  'single-text-finance': {
    electionId: 'st1',
    options: [
      { id: 'st1-o1', text: '안전한 적금', voteCount: null },
      { id: 'st1-o2', text: '주식 투자', voteCount: null },
      { id: 'st1-o3', text: '코인 투자', voteCount: null },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: null,
  },
  'single-sports-urgent': {
    electionId: 'ss1',
    options: [
      { id: 'ss1-o1', text: '홈팀 승리', voteCount: null },
      { id: 'ss1-o2', text: '원정팀 승리', voteCount: null },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: null,
  },
  'single-food-closed': {
    electionId: 'sf1',
    options: [
      { id: 'sf1-o1', text: '짜장면', voteCount: 1600 },
      { id: 'sf1-o2', text: '짬뽕', voteCount: 1600 },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: 3200,
  },
  'single-work': {
    electionId: 'sw1',
    options: [
      { id: 'sw1-o1', text: '재택근무', voteCount: null },
      { id: 'sw1-o2', text: '사무실 출근', voteCount: null },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: null,
  },
  'single-trend': {
    electionId: 'str1',
    options: [
      { id: 'str1-o1', text: '대체한다', voteCount: null },
      { id: 'str1-o2', text: '공존한다', voteCount: null },
      { id: 'str1-o3', text: '불가능하다', voteCount: null },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: null,
  },
  'single-dating-sns': {
    electionId: 'sds1',
    options: [
      { id: 'sds1-o1', text: '괜찮다', voteCount: null },
      { id: 'sds1-o2', text: '절대 안 돼', voteCount: null },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: null,
  },
  'single-chicken': {
    electionId: 'sc1',
    options: [
      { id: 'sc1-o1', text: '후라이드', voteCount: null },
      { id: 'sc1-o2', text: '양념', voteCount: null },
      { id: 'sc1-o3', text: '반반', voteCount: null },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: null,
  },
  'single-salary': {
    electionId: 'ssa1',
    options: [
      { id: 'ssa1-o1', text: '연봉 올려주기', voteCount: null },
      { id: 'ssa1-o2', text: '복지 늘리기', voteCount: null },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: null,
  },
  // ── IMAGE 타입 싱글 (옵션별 이미지 포함) ──
  'single-img-coffee': {
    electionId: 'sic1',
    options: [
      {
        id: 'sic1-o1',
        text: '아메리카노',
        imageUrl: 'https://picsum.photos/200/200?random=sic1-a',
        voteCount: null,
      },
      {
        id: 'sic1-o2',
        text: '라떼',
        imageUrl: 'https://picsum.photos/200/200?random=sic1-b',
        voteCount: null,
      },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: null,
  },
  'single-img-pet': {
    electionId: 'sip1',
    options: [
      {
        id: 'sip1-o1',
        text: '강아지',
        imageUrl: 'https://picsum.photos/200/200?random=sip1-a',
        voteCount: null,
      },
      {
        id: 'sip1-o2',
        text: '고양이',
        imageUrl: 'https://picsum.photos/200/200?random=sip1-b',
        voteCount: null,
      },
      {
        id: 'sip1-o3',
        text: '햄스터',
        imageUrl: 'https://picsum.photos/200/200?random=sip1-c',
        voteCount: null,
      },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: null,
  },
  'single-img-travel': {
    electionId: 'sit1',
    options: [
      {
        id: 'sit1-o1',
        text: '산',
        imageUrl: 'https://picsum.photos/200/200?random=sit1-a',
        voteCount: null,
      },
      {
        id: 'sit1-o2',
        text: '바다',
        imageUrl: 'https://picsum.photos/200/200?random=sit1-b',
        voteCount: null,
      },
      {
        id: 'sit1-o3',
        text: '도시',
        imageUrl: 'https://picsum.photos/200/200?random=sit1-c',
        voteCount: null,
      },
      {
        id: 'sit1-o4',
        text: '시골',
        imageUrl: 'https://picsum.photos/200/200?random=sit1-d',
        voteCount: null,
      },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: null,
  },
  'single-img-car': {
    electionId: 'sicar1',
    options: [
      {
        id: 'sicar1-o1',
        text: '전기차',
        imageUrl: 'https://picsum.photos/200/200?random=sicar1-a',
        voteCount: null,
      },
      {
        id: 'sicar1-o2',
        text: '하이브리드',
        imageUrl: 'https://picsum.photos/200/200?random=sicar1-b',
        voteCount: null,
      },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: null,
  },
  'single-img-fashion': {
    electionId: 'sif1',
    options: [
      {
        id: 'sif1-o1',
        text: '캐주얼',
        imageUrl: 'https://picsum.photos/200/200?random=sif1-a',
        voteCount: null,
      },
      {
        id: 'sif1-o2',
        text: '포멀',
        imageUrl: 'https://picsum.photos/200/200?random=sif1-b',
        voteCount: null,
      },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: null,
  },
  // ── 무한스크롤용 추가 싱글 ──
  'single-movie': {
    electionId: 'smv1',
    options: [
      { id: 'smv1-o1', text: '극장', voteCount: null },
      { id: 'smv1-o2', text: 'OTT', voteCount: null },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: null,
  },
  'single-morning': {
    electionId: 'smr1',
    options: [
      { id: 'smr1-o1', text: '아침형', voteCount: null },
      { id: 'smr1-o2', text: '저녁형', voteCount: null },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: null,
  },
  'single-health': {
    electionId: 'shl1',
    options: [
      { id: 'shl1-o1', text: '헬스장', voteCount: null },
      { id: 'shl1-o2', text: '홈트레이닝', voteCount: null },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: null,
  },
  'single-vacation': {
    electionId: 'svc1',
    options: [
      { id: 'svc1-o1', text: '해외여행', voteCount: null },
      { id: 'svc1-o2', text: '국내여행', voteCount: null },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: null,
  },
  'single-sns': {
    electionId: 'ssn1',
    options: [
      { id: 'ssn1-o1', text: '인스타그램', voteCount: null },
      { id: 'ssn1-o2', text: '유튜브', voteCount: null },
      { id: 'ssn1-o3', text: '틱톡', voteCount: null },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: null,
  },
  'single-game': {
    electionId: 'sgm1',
    options: [
      { id: 'sgm1-o1', text: 'PC 게임', voteCount: null },
      { id: 'sgm1-o2', text: '모바일 게임', voteCount: null },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: null,
  },
  'single-music': {
    electionId: 'smu1',
    options: [
      { id: 'smu1-o1', text: 'K-POP', voteCount: null },
      { id: 'smu1-o2', text: '팝송', voteCount: null },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: null,
  },
  'single-beer': {
    electionId: 'sbr1',
    options: [
      { id: 'sbr1-o1', text: '맥주', voteCount: null },
      { id: 'sbr1-o2', text: '소주', voteCount: null },
      { id: 'sbr1-o3', text: '와인', voteCount: null },
      { id: 'sbr1-o4', text: '위스키', voteCount: null },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: null,
  },
  'single-apartment': {
    electionId: 'sap1',
    options: [
      { id: 'sap1-o1', text: '아파트', voteCount: null },
      { id: 'sap1-o2', text: '단독주택', voteCount: null },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: null,
  },
  'single-wedding': {
    electionId: 'swd1',
    options: [
      { id: 'swd1-o1', text: '스몰웨딩', voteCount: null },
      { id: 'swd1-o2', text: '대형 웨딩', voteCount: null },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: null,
  },
  'single-crypto': {
    electionId: 'scr1',
    options: [
      { id: 'scr1-o1', text: '비트코인', voteCount: null },
      { id: 'scr1-o2', text: '이더리움', voteCount: null },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: null,
  },
  'single-diet': {
    electionId: 'sdi1',
    options: [
      { id: 'sdi1-o1', text: '간헐적 단식', voteCount: null },
      { id: 'sdi1-o2', text: '식단 관리', voteCount: null },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: null,
  },
  'single-weekend': {
    electionId: 'swe1',
    options: [
      { id: 'swe1-o1', text: '집에서 쉬기', voteCount: null },
      { id: 'swe1-o2', text: '나가서 놀기', voteCount: null },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: null,
  },
  // ── 멀티 카테고리 싱글 ──
  'single-lovefinance': {
    electionId: 'slf1',
    options: [
      { id: 'slf1-o1', text: '같이 관리', voteCount: null },
      { id: 'slf1-o2', text: '따로 관리', voteCount: null },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: null,
  },
  'single-sportsfood': {
    electionId: 'ssf1',
    options: [
      { id: 'ssf1-o1', text: '닭가슴살', voteCount: null },
      { id: 'ssf1-o2', text: '프로틴 셰이크', voteCount: null },
    ],
    voted: false,
    myChoiceId: null,
    totalVotes: null,
  },
};

// ──────────────────────────────────────────────────────────
// 메인 피드 Mock — 혼합 배치 (싱글 + 번들)
// ──────────────────────────────────────────────────────────

/**
 * 메인 전시 Mock — 혼합 피드
 * 싱글 7~10개당 번들 1개 삽입
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockMainDisplayLegacy: any = {
  trends: [
    // ── 페이지 1: 싱글 #1~#7 ──
    {
      id: 201,
      alias: 'single-love',
      title: '첫 데이트 장소는?',
      label: '연애',
      imageUrls: ['https://picsum.photos/400/300?random=201'],
      createdAt: hoursAgo(6),
      participantsCount: 420,
    },
    {
      id: 202,
      alias: 'single-text-finance',
      title: '적금 vs 주식?',
      label: '재테크',
      imageUrls: [],
      createdAt: hoursAgo(2),
      participantsCount: 890,
    },
    {
      id: 301,
      alias: 'single-dating-sns',
      title: '연인의 전 연인 SNS 확인, 어떻게 생각해?',
      label: '연애',
      imageUrls: [],
      createdAt: hoursAgo(3),
      participantsCount: 1200,
    },
    // IMAGE 타입 싱글 — 커피
    {
      id: 401,
      alias: 'single-img-coffee',
      title: '아메리카노 vs 라떼?',
      label: '음식',
      imageUrls: ['https://picsum.photos/400/300?random=401'],
      createdAt: hoursAgo(1),
      participantsCount: 1850,
    },
    {
      id: 203,
      alias: 'single-sports-urgent',
      title: '오늘 경기 승자는?',
      label: '스포츠',
      imageUrls: [],
      createdAt: hoursAgo(20),
      participantsCount: 1500,
    },
    // IMAGE 타입 싱글 — 반려동물
    {
      id: 402,
      alias: 'single-img-pet',
      title: '강아지 vs 고양이, 당신의 반려동물은?',
      label: '라이프',
      imageUrls: ['https://picsum.photos/400/300?random=402'],
      createdAt: hoursAgo(4),
      participantsCount: 3100,
    },
    {
      id: 205,
      alias: 'single-work',
      title: '재택 vs 출근?',
      label: '직장',
      imageUrls: [],
      createdAt: hoursAgo(48),
      participantsCount: 670,
    },

    // ── 번들 #1 ──
    {
      id: 1,
      alias: 'love-dilemma',
      title: '대한민국 연애 난제',
      label: '당신의 문제라면?',
      imageUrls: [
        'https://picsum.photos/400/300?random=1',
        'https://picsum.photos/400/300?random=1-2',
      ],
      createdAt: hoursAgo(12),
      participantsCount: 1200,
    },

    // ── 페이지 2: 싱글 #8~#14 ──
    {
      id: 206,
      alias: 'single-trend',
      title: 'AI가 인간을 대체할까?',
      label: '트렌드',
      imageUrls: [],
      createdAt: hoursAgo(1),
      participantsCount: 2100,
    },
    {
      id: 302,
      alias: 'single-chicken',
      title: '치킨은 후라이드 vs 양념?',
      label: '음식',
      imageUrls: [],
      createdAt: hoursAgo(5),
      participantsCount: 760,
    },
    // IMAGE 타입 싱글 — 여행
    {
      id: 403,
      alias: 'single-img-travel',
      title: '여행지는 산 vs 바다?',
      label: '여행',
      imageUrls: ['https://picsum.photos/400/300?random=403'],
      createdAt: hoursAgo(7),
      participantsCount: 2400,
    },
    {
      id: 303,
      alias: 'single-salary',
      title: '회사에 바라는 것은?',
      label: '직장',
      imageUrls: [],
      createdAt: hoursAgo(10),
      participantsCount: 540,
    },
    // 멀티 카테고리 싱글 — 연애+재테크
    {
      id: 501,
      alias: 'single-lovefinance',
      title: '연인과 가계부 같이 쓰는 거 어때?',
      label: '연애 x 재테크',
      imageUrls: ['https://picsum.photos/400/300?random=501'],
      createdAt: hoursAgo(2),
      participantsCount: 980,
    },
    // IMAGE 타입 싱글 — 자동차
    {
      id: 404,
      alias: 'single-img-car',
      title: '다음 차는 전기차 vs 하이브리드?',
      label: '자동차',
      imageUrls: ['https://picsum.photos/400/300?random=404'],
      createdAt: hoursAgo(15),
      participantsCount: 1670,
    },
    {
      id: 204,
      alias: 'single-food-closed',
      title: '짜장 vs 짬뽕 (마감)',
      label: '음식',
      imageUrls: [],
      createdAt: hoursAgo(96),
      participantsCount: 3200,
    },

    // ── 번들 #2 ──
    {
      id: 2,
      alias: 'finance-picks',
      title: '재테크 이지선다',
      label: '투자 선택의 기로',
      imageUrls: [
        'https://picsum.photos/400/300?random=2',
        'https://picsum.photos/400/300?random=2-2',
      ],
      createdAt: hoursAgo(48),
      participantsCount: 3200,
    },

    // ── 페이지 3: 싱글 #15~#21 + 번들 ──
    // IMAGE 타입 싱글 — 패션
    {
      id: 405,
      alias: 'single-img-fashion',
      title: '데이트 패션: 캐주얼 vs 포멀?',
      label: '패션',
      imageUrls: ['https://picsum.photos/400/300?random=405'],
      createdAt: hoursAgo(9),
      participantsCount: 1320,
    },
    {
      id: 406,
      alias: 'single-movie',
      title: '영화는 극장 vs OTT?',
      label: '문화',
      imageUrls: [],
      createdAt: hoursAgo(11),
      participantsCount: 920,
    },
    {
      id: 407,
      alias: 'single-morning',
      title: '당신은 아침형 vs 저녁형?',
      label: '라이프',
      imageUrls: [],
      createdAt: hoursAgo(14),
      participantsCount: 1540,
    },
    {
      id: 408,
      alias: 'single-health',
      title: '운동은 헬스장 vs 홈트?',
      label: '건강',
      imageUrls: ['https://picsum.photos/400/300?random=408'],
      createdAt: hoursAgo(16),
      participantsCount: 1190,
    },
    // 멀티 카테고리 싱글 — 스포츠+음식
    {
      id: 502,
      alias: 'single-sportsfood',
      title: '운동 후 보충: 닭가슴살 vs 프로틴 셰이크?',
      label: '스포츠 x 음식',
      imageUrls: ['https://picsum.photos/400/300?random=502'],
      createdAt: hoursAgo(8),
      participantsCount: 2250,
    },
    {
      id: 409,
      alias: 'single-vacation',
      title: '올해 휴가는 해외 vs 국내?',
      label: '여행',
      imageUrls: [],
      createdAt: hoursAgo(22),
      participantsCount: 870,
    },
    {
      id: 410,
      alias: 'single-sns',
      title: '더 많이 보는 SNS는?',
      label: '트렌드',
      imageUrls: [],
      createdAt: hoursAgo(18),
      participantsCount: 2600,
    },

    // ── 번들 #3 (멀티 카테고리) ──
    {
      id: 3,
      alias: 'sports-urgent',
      title: '스포츠 긴급 투표',
      label: '마감 임박!',
      imageUrls: [
        'https://picsum.photos/400/300?random=3',
        'https://picsum.photos/400/300?random=3-2',
      ],
      createdAt: hoursAgo(72),
      participantsCount: 8900,
    },

    // ── 페이지 4: 싱글 #22~#28 + 번들 ──
    {
      id: 411,
      alias: 'single-game',
      title: 'PC 게임 vs 모바일 게임?',
      label: '게임',
      imageUrls: ['https://picsum.photos/400/300?random=411'],
      createdAt: hoursAgo(25),
      participantsCount: 3400,
    },
    {
      id: 412,
      alias: 'single-music',
      title: 'K-POP vs 팝송, 뭘 더 들어?',
      label: '음악',
      imageUrls: [],
      createdAt: hoursAgo(30),
      participantsCount: 1780,
    },
    {
      id: 413,
      alias: 'single-beer',
      title: '퇴근 후 한 잔: 맥주 vs 소주?',
      label: '음식',
      imageUrls: ['https://picsum.photos/400/300?random=413'],
      createdAt: hoursAgo(28),
      participantsCount: 4200,
    },
    {
      id: 414,
      alias: 'single-apartment',
      title: '내 집은 아파트 vs 단독주택?',
      label: '부동산',
      imageUrls: ['https://picsum.photos/400/300?random=414'],
      createdAt: hoursAgo(35),
      participantsCount: 1950,
    },
    {
      id: 415,
      alias: 'single-wedding',
      title: '결혼식은 스몰웨딩 vs 대형?',
      label: '결혼',
      imageUrls: [],
      createdAt: hoursAgo(40),
      participantsCount: 1120,
    },
    {
      id: 416,
      alias: 'single-crypto',
      title: '코인 투자한다면: 비트코인 vs 이더리움?',
      label: '재테크',
      imageUrls: [],
      createdAt: hoursAgo(50),
      participantsCount: 2890,
    },
    {
      id: 417,
      alias: 'single-diet',
      title: '다이어트 방법: 간헐적 단식 vs 식단 관리?',
      label: '건강',
      imageUrls: [],
      createdAt: hoursAgo(55),
      participantsCount: 1430,
    },

    // ── 번들 #4 ──
    {
      id: 5,
      alias: 'food-new',
      title: '오늘의 음식 대결',
      label: '뭐 먹을래?',
      imageUrls: [
        'https://picsum.photos/400/300?random=5',
        'https://picsum.photos/400/300?random=5-2',
      ],
      createdAt: hoursAgo(3),
      participantsCount: 150,
    },

    // ── 페이지 5: 싱글 #29~#30 + 번들 ──
    {
      id: 418,
      alias: 'single-weekend',
      title: '주말에는 집에서 쉬기 vs 나가서 놀기?',
      label: '라이프',
      imageUrls: [],
      createdAt: hoursAgo(60),
      participantsCount: 1650,
    },

    // ── 번들 #5 (마감) ──
    {
      id: 4,
      alias: 'work-closed',
      title: '직장인 고민 (마감)',
      label: '이미 끝난 투표입니다',
      imageUrls: [
        'https://picsum.photos/400/300?random=4',
        'https://picsum.photos/400/300?random=4-2',
      ],
      createdAt: hoursAgo(168),
      participantsCount: 2000,
    },

    // ── 번들 #6 ──
    {
      id: 6,
      alias: 'trend-weekly',
      title: '이번주 트렌드 핫이슈',
      label: '어떻게 생각하세요?',
      imageUrls: [
        'https://picsum.photos/400/300?random=6',
        'https://picsum.photos/400/300?random=6-2',
      ],
      createdAt: hoursAgo(24),
      participantsCount: 2300,
    },
  ],
  hasMore: true,
  nextCursor: undefined,
  totalCount: 40,
};

/**
 * Phase 2 확장 필드 — 핸들러에서 트렌드 데이터에 주입
 * categoryCodes: 복수 카테고리 지원 (연애+재테크, 스포츠+음식 등)
 */
interface TrendExtension {
  type?: string;
  categoryCode?: string;
  categoryCodes?: string[];
  deadline?: string;
  status?: string;
  electionCount?: number;
  voteType?: 'IMAGE' | 'TEXT';
  mainImageUrl?: string;
}

export const trendExtensions: Record<string, TrendExtension> = {
  // ── SINGLE (IMAGE 타입 — 옵션 이미지 포함) ──
  'single-love': {
    type: 'SINGLE',
    categoryCode: 'LOVE',
    categoryCodes: ['LOVE'],
    voteType: 'IMAGE',
    status: 'OPEN',
  },
  // ── SINGLE (TEXT 타입 — mainImageUrl 필요) ──
  'single-text-finance': {
    type: 'SINGLE',
    categoryCode: 'FINANCE',
    categoryCodes: ['FINANCE'],
    voteType: 'TEXT',
    mainImageUrl: 'https://picsum.photos/400/200?random=text-finance',
    status: 'OPEN',
  },
  'single-sports-urgent': {
    type: 'SINGLE',
    categoryCode: 'SPORTS',
    categoryCodes: ['SPORTS'],
    voteType: 'TEXT',
    mainImageUrl: 'https://picsum.photos/400/200?random=text-sports',
    deadline: hoursFromNow(2),
    status: 'OPEN',
  },
  'single-food-closed': {
    type: 'SINGLE',
    categoryCode: 'FOOD',
    categoryCodes: ['FOOD'],
    voteType: 'TEXT',
    mainImageUrl: 'https://picsum.photos/400/200?random=text-food-closed',
    deadline: hoursAgo(12),
    status: 'CLOSED',
  },
  'single-work': {
    type: 'SINGLE',
    categoryCode: 'WORK',
    categoryCodes: ['WORK'],
    voteType: 'TEXT',
    mainImageUrl: 'https://picsum.photos/400/200?random=text-work',
    deadline: daysFromNow(5),
    status: 'OPEN',
  },
  'single-trend': {
    type: 'SINGLE',
    categoryCode: 'TREND',
    categoryCodes: ['TREND'],
    voteType: 'TEXT',
    mainImageUrl: 'https://picsum.photos/400/200?random=text-trend',
    status: 'OPEN',
  },
  'single-dating-sns': {
    type: 'SINGLE',
    categoryCode: 'LOVE',
    categoryCodes: ['LOVE'],
    voteType: 'TEXT',
    mainImageUrl: 'https://picsum.photos/400/200?random=text-dating-sns',
    status: 'OPEN',
  },
  'single-chicken': {
    type: 'SINGLE',
    categoryCode: 'FOOD',
    categoryCodes: ['FOOD'],
    voteType: 'TEXT',
    mainImageUrl: 'https://picsum.photos/400/200?random=text-chicken',
    status: 'OPEN',
  },
  'single-salary': {
    type: 'SINGLE',
    categoryCode: 'WORK',
    categoryCodes: ['WORK'],
    voteType: 'TEXT',
    mainImageUrl: 'https://picsum.photos/400/200?random=text-salary',
    status: 'OPEN',
  },
  // ── SINGLE (IMAGE 타입 — 썸네일 포함) ──
  'single-img-coffee': {
    type: 'SINGLE',
    categoryCode: 'FOOD',
    categoryCodes: ['FOOD'],
    voteType: 'IMAGE',
    status: 'OPEN',
  },
  'single-img-pet': {
    type: 'SINGLE',
    categoryCode: 'TREND',
    categoryCodes: ['TREND'],
    voteType: 'IMAGE',
    status: 'OPEN',
  },
  'single-img-travel': {
    type: 'SINGLE',
    categoryCode: 'TREND',
    categoryCodes: ['TREND'],
    voteType: 'IMAGE',
    status: 'OPEN',
  },
  'single-img-car': {
    type: 'SINGLE',
    categoryCode: 'TREND',
    categoryCodes: ['TREND'],
    voteType: 'IMAGE',
    deadline: daysFromNow(10),
    status: 'OPEN',
  },
  'single-img-fashion': {
    type: 'SINGLE',
    categoryCode: 'TREND',
    categoryCodes: ['TREND'],
    voteType: 'IMAGE',
    status: 'OPEN',
  },
  // ── SINGLE (무한스크롤 추가 — TEXT 타입) ──
  'single-movie': {
    type: 'SINGLE',
    categoryCode: 'TREND',
    categoryCodes: ['TREND'],
    voteType: 'TEXT',
    mainImageUrl: 'https://picsum.photos/400/200?random=text-movie',
    status: 'OPEN',
  },
  'single-morning': {
    type: 'SINGLE',
    categoryCode: 'TREND',
    categoryCodes: ['TREND'],
    voteType: 'TEXT',
    mainImageUrl: 'https://picsum.photos/400/200?random=text-morning',
    status: 'OPEN',
  },
  'single-health': {
    type: 'SINGLE',
    categoryCode: 'SPORTS',
    categoryCodes: ['SPORTS'],
    voteType: 'TEXT',
    mainImageUrl: 'https://picsum.photos/400/200?random=text-health',
    status: 'OPEN',
  },
  'single-vacation': {
    type: 'SINGLE',
    categoryCode: 'TREND',
    categoryCodes: ['TREND'],
    voteType: 'TEXT',
    mainImageUrl: 'https://picsum.photos/400/200?random=text-vacation',
    status: 'OPEN',
  },
  'single-sns': {
    type: 'SINGLE',
    categoryCode: 'TREND',
    categoryCodes: ['TREND'],
    voteType: 'TEXT',
    mainImageUrl: 'https://picsum.photos/400/200?random=text-sns',
    status: 'OPEN',
  },
  'single-game': {
    type: 'SINGLE',
    categoryCode: 'TREND',
    categoryCodes: ['TREND'],
    voteType: 'TEXT',
    mainImageUrl: 'https://picsum.photos/400/200?random=text-game',
    status: 'OPEN',
  },
  'single-music': {
    type: 'SINGLE',
    categoryCode: 'TREND',
    categoryCodes: ['TREND'],
    voteType: 'TEXT',
    mainImageUrl: 'https://picsum.photos/400/200?random=text-music',
    status: 'OPEN',
  },
  'single-beer': {
    type: 'SINGLE',
    categoryCode: 'FOOD',
    categoryCodes: ['FOOD'],
    voteType: 'TEXT',
    mainImageUrl: 'https://picsum.photos/400/200?random=text-beer',
    status: 'OPEN',
  },
  'single-apartment': {
    type: 'SINGLE',
    categoryCode: 'FINANCE',
    categoryCodes: ['FINANCE'],
    voteType: 'TEXT',
    mainImageUrl: 'https://picsum.photos/400/200?random=text-apartment',
    status: 'OPEN',
  },
  'single-wedding': {
    type: 'SINGLE',
    categoryCode: 'LOVE',
    categoryCodes: ['LOVE', 'MARRIAGE'],
    voteType: 'TEXT',
    mainImageUrl: 'https://picsum.photos/400/200?random=text-wedding',
    status: 'OPEN',
  },
  'single-crypto': {
    type: 'SINGLE',
    categoryCode: 'FINANCE',
    categoryCodes: ['FINANCE'],
    voteType: 'TEXT',
    mainImageUrl: 'https://picsum.photos/400/200?random=text-crypto',
    status: 'OPEN',
  },
  'single-diet': {
    type: 'SINGLE',
    categoryCode: 'SPORTS',
    categoryCodes: ['SPORTS'],
    voteType: 'TEXT',
    mainImageUrl: 'https://picsum.photos/400/200?random=text-diet',
    status: 'OPEN',
  },
  'single-weekend': {
    type: 'SINGLE',
    categoryCode: 'TREND',
    categoryCodes: ['TREND'],
    voteType: 'TEXT',
    mainImageUrl: 'https://picsum.photos/400/200?random=text-weekend',
    status: 'OPEN',
  },
  // ── SINGLE (멀티 카테고리 — IMAGE 타입) ──
  'single-lovefinance': {
    type: 'SINGLE',
    categoryCode: 'LOVE',
    categoryCodes: ['LOVE', 'FINANCE'],
    voteType: 'IMAGE',
    status: 'OPEN',
  },
  'single-sportsfood': {
    type: 'SINGLE',
    categoryCode: 'SPORTS',
    categoryCodes: ['SPORTS', 'FOOD'],
    voteType: 'TEXT',
    mainImageUrl: 'https://picsum.photos/400/200?random=text-sportsfood',
    status: 'OPEN',
  },
  // ── BUNDLE ──
  'fixed-trend': {
    type: 'BUNDLE',
    categoryCode: 'TREND',
    categoryCodes: ['TREND'],
    electionCount: 2,
    status: 'OPEN',
  },
  'love-dilemma': {
    type: 'BUNDLE',
    categoryCode: 'LOVE',
    categoryCodes: ['LOVE'],
    electionCount: 5,
    status: 'OPEN',
  },
  'finance-picks': {
    type: 'BUNDLE',
    categoryCode: 'FINANCE',
    categoryCodes: ['FINANCE'],
    electionCount: 5,
    deadline: daysFromNow(2),
    status: 'OPEN',
  },
  'sports-urgent': {
    type: 'BUNDLE',
    categoryCode: 'SPORTS',
    categoryCodes: ['SPORTS', 'TREND'],
    electionCount: 2,
    deadline: hoursFromNow(1),
    status: 'OPEN',
  },
  'work-closed': {
    type: 'BUNDLE',
    categoryCode: 'WORK',
    categoryCodes: ['WORK'],
    electionCount: 2,
    deadline: hoursAgo(24),
    status: 'CLOSED',
  },
  'food-new': {
    type: 'BUNDLE',
    categoryCode: 'FOOD',
    categoryCodes: ['FOOD'],
    electionCount: 2,
    status: 'OPEN',
  },
  'trend-weekly': {
    type: 'BUNDLE',
    categoryCode: 'TREND',
    categoryCodes: ['TREND'],
    electionCount: 2,
    deadline: daysFromNow(7),
    status: 'OPEN',
  },
};

// ──────────────────────────────────────────────────────────
// 구 → 신 변환 유틸
// ──────────────────────────────────────────────────────────

interface LegacyTrend {
  id: number;
  alias: string;
  title: string;
  label?: string;
  imageUrls?: string[];
  createdAt?: string;
  participantsCount?: number;
}

/**
 * 구 mockMainDisplay 항목을 새 HotpickCardResponse 형태로 변환
 */
function convertToHotpickCard(item: LegacyTrend): HotpickCardResponse {
  const ext = trendExtensions[item.alias];
  const svData = singleVoteDataMap[item.alias];
  const type = ext?.type ?? 'SINGLE';
  const categories = (ext?.categoryCodes ?? []).map((code: string, i: number) => ({
    id: i + 1,
    name: code,
    slug: code,
  }));

  // SINGLE: election을 singleVoteData + extension에서 빌드
  if (type === 'SINGLE' && svData) {
    return {
      hotpickId: item.id,
      type: 'SINGLE',
      slug: item.alias,
      imageUrl: item.imageUrls?.[0] ?? ext?.mainImageUrl,
      expiredAt: ext?.deadline,
      likeCount: Math.floor(Math.random() * 50) + 5,
      liked: false,
      categories,
      election: {
        electionId: Number(svData.electionId.replace(/\D/g, '')) || item.id * 10,
        title: item.title,
        imageUrl: ext?.mainImageUrl,
        totalVoteCount: item.participantsCount ?? 0,
        totalCommentCount: 0,
        items: svData.options.map((opt, i) => ({
          electionItemId: Number(opt.id.replace(/\D/g, '')) || i + 1,
          displayOrder: i,
          title: opt.text,
          imageUrl: opt.imageUrl,
          voteCount: opt.voteCount ?? undefined,
          voteRate: undefined,
        })),
        voted: svData.voted,
        myElectionItemId: svData.myChoiceId
          ? Number(svData.myChoiceId.replace(/\D/g, '')) || undefined
          : undefined,
      },
    };
  }

  // BUNDLE: 간단한 카드 (election은 첫 번째 항목만 표시)
  return {
    hotpickId: item.id,
    type: 'BUNDLE',
    slug: item.alias,
    imageUrl: item.imageUrls?.[0],
    expiredAt: ext?.deadline,
    likeCount: Math.floor(Math.random() * 30) + 3,
    liked: false,
    categories,
    election: {
      title: item.title,
      totalVoteCount: item.participantsCount ?? 0,
      totalCommentCount: 0,
    },
  };
}

/**
 * 구 상세 데이터를 새 HotpickDetailResponse 형태로 변환
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertToHotpickDetail(detail: any): HotpickDetailResponse {
  const slug = detail.alias ?? '';
  const ext = trendExtensions[slug];
  const categories = (ext?.categoryCodes ?? []).map((code: string, i: number) => ({
    id: i + 1,
    name: code,
    slug: code,
  }));

  if (detail.type === 'SINGLE' && detail.items?.[0]) {
    const election = detail.items[0];
    const svData = singleVoteDataMap[slug];
    return {
      hotpick: {
        hotpickId: detail.trendId,
        type: 'SINGLE',
        slug,
        imageUrl: detail.imageUrls?.[0],
        expiredAt: ext?.deadline ?? detail.deadline,
        likeCount: Math.floor(Math.random() * 50) + 5,
        liked: false,
        categories,
        election: {
          electionId: Number(String(election.id).replace(/\D/g, '')) || detail.trendId * 10,
          title: election.title,
          imageUrl: election.mainImageUrl ?? election.imageUrl,
          totalVoteCount: detail.participantsCount ?? 0,
          totalCommentCount: 0,
          items: (election.options ?? []).map(
            (opt: { id: string; title: string; imageUrl?: string }, i: number) => ({
              electionItemId: Number(opt.id.replace(/\D/g, '')) || i + 1,
              displayOrder: i,
              title: opt.title,
              imageUrl: opt.imageUrl,
              voteCount: undefined,
              voteRate: undefined,
            })
          ),
          voted: svData?.voted ?? false,
          myElectionItemId: svData?.myChoiceId
            ? Number(svData.myChoiceId.replace(/\D/g, '')) || undefined
            : undefined,
        },
      },
      // relatedHotpicks는 빌드 후 lazy하게 채움 (아래 buildRelatedHotpicks)
      relatedHotpicks: [],
    };
  }

  // BUNDLE
  const firstItem = detail.items?.[0];
  return {
    hotpick: {
      hotpickId: detail.trendId,
      type: 'BUNDLE',
      slug,
      imageUrl: detail.imageUrls?.[0],
      expiredAt: ext?.deadline ?? detail.deadline,
      categories,
      election: firstItem
        ? {
            electionId: Number(String(firstItem.id).replace(/\D/g, '')) || detail.trendId * 10,
            title: firstItem.title,
            imageUrl: firstItem.mainImageUrl,
            totalVoteCount: 0,
            totalCommentCount: 0,
            items: (firstItem.options ?? []).map(
              (opt: { id: string; title: string; imageUrl?: string }, i: number) => ({
                electionItemId: Number(opt.id.replace(/\D/g, '')) || i + 1,
                displayOrder: i,
                title: opt.title,
                imageUrl: opt.imageUrl,
              })
            ),
          }
        : undefined,
    },
    relatedHotpicks: [],
  };
}

/**
 * 새 API 형태의 메인 핫픽 응답
 */
export const mockMainHotpicks: MainHotpickResponse = {
  hotpicks: (mockMainDisplayLegacy.trends ?? []).map(convertToHotpickCard),
  hasMore: true,
  nextCursor: undefined,
};

// ──────────────────────────────────────────────────────────
// Hotpick 상세 Mock (투표 페이지)
// ──────────────────────────────────────────────────────────

/** BUNDLE + IMAGE (기본, 5개 선거) */
export const mockHotpickDetailBundle = {
  trendId: 1,
  alias: 'love-dilemma',
  title: '대한민국 연애 난제',
  label: '당신의 연애 스타일은 무엇인가요?',
  imageUrls: [
    'https://picsum.photos/600/400?random=10',
    'https://picsum.photos/600/400?random=10-2',
  ],
  createdAt: hoursAgo(12),
  type: 'BUNDLE',
  status: 'OPEN',
  items: [
    {
      id: 'q1',
      title: '당신은 어떤 이성에게 끌리나요?',
      label: '연애 스타일',
      voteType: 'IMAGE',
      options: [
        {
          id: 'q1-o1',
          title: '안끌리는 모범생',
          imageUrl: 'https://picsum.photos/300/200?random=11',
        },
        {
          id: 'q1-o2',
          title: '끌리는 양아치',
          imageUrl: 'https://picsum.photos/300/200?random=12',
        },
      ],
    },
    {
      id: 'q2',
      title: '스킨십은 언제부터?',
      label: '스킨십 타이밍',
      voteType: 'IMAGE',
      options: [
        {
          id: 'q2-o1',
          title: '100일 지나고',
          imageUrl: 'https://picsum.photos/300/200?random=21',
        },
        {
          id: 'q2-o2',
          title: '사귀기 전에',
          imageUrl: 'https://picsum.photos/300/200?random=22',
        },
      ],
    },
    {
      id: 'q3',
      title: '연인에게 중요한 것은?',
      label: '가치관',
      voteType: 'IMAGE',
      options: [
        {
          id: 'q3-o1',
          title: '성격 좋은 평범남',
          imageUrl: 'https://picsum.photos/300/200?random=31',
        },
        {
          id: 'q3-o2',
          title: '성격보단 얼굴',
          imageUrl: 'https://picsum.photos/300/200?random=32',
        },
      ],
    },
    {
      id: 'q4',
      title: '어떤 남자를 선호?',
      label: '이상형',
      voteType: 'IMAGE',
      options: [
        {
          id: 'q4-o1',
          title: '가난한 진심남',
          imageUrl: 'https://picsum.photos/300/200?random=41',
        },
        {
          id: 'q4-o2',
          title: '돈많은 헌팅남',
          imageUrl: 'https://picsum.photos/300/200?random=42',
        },
      ],
    },
    {
      id: 'q5',
      title: '연락 빈도는?',
      label: '연락 빈도',
      voteType: 'IMAGE',
      options: [
        {
          id: 'q5-o1',
          title: '하루에 두번 전화',
          imageUrl: 'https://picsum.photos/300/200?random=51',
        },
        {
          id: 'q5-o2',
          title: '한달에 한번 전화',
          imageUrl: 'https://picsum.photos/300/200?random=52',
        },
      ],
    },
  ],
};

/** BUNDLE + TEXT 투표 혼합 */
export const mockHotpickDetailTextMixed = {
  trendId: 2,
  alias: 'finance-picks',
  title: '재테크 이지선다',
  label: '투자 선택의 기로에서 당신의 판단은?',
  imageUrls: [
    'https://picsum.photos/600/400?random=20',
    'https://picsum.photos/600/400?random=20-2',
  ],
  createdAt: hoursAgo(48),
  type: 'BUNDLE',
  deadline: daysFromNow(2),
  status: 'OPEN',
  items: [
    {
      id: 'f1',
      title: '여유자금 1억이 생겼다면?',
      label: '투자 전략',
      voteType: 'TEXT',
      mainImageUrl: 'https://picsum.photos/400/200?random=f1-main',
      options: [
        { id: 'f1-o1', title: '안전한 적금' },
        { id: 'f1-o2', title: '공격적인 주식' },
        { id: 'f1-o3', title: '부동산 투자' },
        { id: 'f1-o4', title: '비트코인 올인' },
      ],
    },
    {
      id: 'f2',
      title: '퇴직금 운용 방법은?',
      label: '퇴직 설계',
      voteType: 'TEXT',
      mainImageUrl: 'https://picsum.photos/400/200?random=f2-main',
      options: [
        { id: 'f2-o1', title: 'IRP 연금저축' },
        { id: 'f2-o2', title: 'ETF 분산투자' },
      ],
    },
    {
      id: 'f3',
      title: '내 집 마련 vs 전세?',
      label: '주거 선택',
      voteType: 'IMAGE',
      options: [
        {
          id: 'f3-o1',
          title: '내 집 마련',
          imageUrl: 'https://picsum.photos/300/200?random=f31',
        },
        {
          id: 'f3-o2',
          title: '전세로 투자',
          imageUrl: 'https://picsum.photos/300/200?random=f32',
        },
      ],
    },
    {
      id: 'f4',
      title: '월급관리 어떻게?',
      label: '가계부',
      voteType: 'TEXT',
      mainImageUrl: 'https://picsum.photos/400/200?random=f4-main',
      options: [
        { id: 'f4-o1', title: '50/30/20 법칙' },
        { id: 'f4-o2', title: '무지출 챌린지' },
      ],
    },
    {
      id: 'f5',
      title: '보험 가입 어떻게?',
      label: '보험',
      voteType: 'TEXT',
      mainImageUrl: 'https://picsum.photos/400/200?random=f5-main',
      options: [
        { id: 'f5-o1', title: '종합보험 하나로' },
        { id: 'f5-o2', title: '단품 조합' },
      ],
    },
  ],
};

/** BUNDLE + CLOSED */
export const mockHotpickDetailClosed = {
  trendId: 4,
  alias: 'work-closed',
  title: '직장인 고민 (마감)',
  label: '이미 끝난 투표입니다',
  imageUrls: [
    'https://picsum.photos/600/400?random=40',
    'https://picsum.photos/600/400?random=40-2',
  ],
  createdAt: hoursAgo(168),
  type: 'BUNDLE',
  deadline: hoursAgo(24),
  status: 'CLOSED',
  items: [
    {
      id: 'w1',
      title: '야근 vs 주말출근?',
      label: '근무 스타일',
      voteType: 'IMAGE',
      options: [
        {
          id: 'w1-o1',
          title: '야근 3시간',
          imageUrl: 'https://picsum.photos/300/200?random=w11',
        },
        {
          id: 'w1-o2',
          title: '토요일 출근',
          imageUrl: 'https://picsum.photos/300/200?random=w12',
        },
      ],
    },
    {
      id: 'w2',
      title: '상사에게 한마디?',
      label: '직장 생활',
      voteType: 'TEXT',
      mainImageUrl: 'https://picsum.photos/400/200?random=w2-main',
      options: [
        { id: 'w2-o1', title: '참고 넘깁니다' },
        { id: 'w2-o2', title: '직접 말합니다' },
      ],
    },
  ],
};

/** SINGLE + IMAGE */
export const mockHotpickDetailSingleImage = {
  trendId: 201,
  alias: 'single-love',
  title: '첫 데이트 장소는?',
  label: '연애',
  imageUrls: ['https://picsum.photos/600/400?random=s1-detail'],
  createdAt: hoursAgo(6),
  type: 'SINGLE',
  status: 'OPEN',
  items: [
    {
      id: 's1',
      title: '첫 데이트 어디로?',
      label: '데이트 장소',
      voteType: 'IMAGE',
      options: [
        {
          id: 's1-o1',
          title: '분위기 좋은 카페',
          imageUrl: 'https://picsum.photos/300/200?random=s11',
        },
        {
          id: 's1-o2',
          title: '놀이공원',
          imageUrl: 'https://picsum.photos/300/200?random=s12',
        },
      ],
    },
  ],
};

/** SINGLE + TEXT */
export const mockHotpickDetailSingleText = {
  trendId: 202,
  alias: 'single-text-finance',
  title: '적금 vs 주식?',
  label: '재테크',
  imageUrls: ['https://picsum.photos/600/400?random=s2-detail'],
  createdAt: hoursAgo(2),
  type: 'SINGLE',
  status: 'OPEN',
  items: [
    {
      id: 'st1',
      title: '여유자금이 생기면?',
      label: '투자 방법',
      voteType: 'TEXT',
      mainImageUrl: 'https://picsum.photos/400/200?random=st1-main',
      options: [
        { id: 'st1-o1', title: '안전한 적금' },
        { id: 'st1-o2', title: '주식 투자' },
        { id: 'st1-o3', title: '코인 투자' },
      ],
    },
  ],
};

/** SINGLE + 스포츠 긴급 */
export const mockHotpickDetailSingleSports = {
  trendId: 203,
  alias: 'single-sports-urgent',
  title: '오늘 경기 승자는?',
  label: '스포츠',
  imageUrls: ['https://picsum.photos/600/400?random=s3-detail'],
  createdAt: hoursAgo(20),
  type: 'SINGLE',
  deadline: hoursFromNow(2),
  status: 'OPEN',
  items: [
    {
      id: 'ss1',
      title: '오늘 경기 승자는?',
      label: '경기 예측',
      voteType: 'IMAGE',
      options: [
        {
          id: 'ss1-o1',
          title: '홈팀 승리',
          imageUrl: 'https://picsum.photos/300/200?random=ss11',
        },
        {
          id: 'ss1-o2',
          title: '원정팀 승리',
          imageUrl: 'https://picsum.photos/300/200?random=ss12',
        },
      ],
    },
  ],
};

/** SINGLE + 음식 (마감됨) */
export const mockHotpickDetailSingleFoodClosed = {
  trendId: 204,
  alias: 'single-food-closed',
  title: '짜장 vs 짬뽕 (마감)',
  label: '음식',
  imageUrls: ['https://picsum.photos/600/400?random=s4-detail'],
  createdAt: hoursAgo(96),
  type: 'SINGLE',
  deadline: hoursAgo(12),
  status: 'CLOSED',
  items: [
    {
      id: 'sf1',
      title: '짜장 vs 짬뽕?',
      label: '음식 대결',
      voteType: 'IMAGE',
      options: [
        {
          id: 'sf1-o1',
          title: '짜장면',
          imageUrl: 'https://picsum.photos/300/200?random=sf11',
        },
        {
          id: 'sf1-o2',
          title: '짬뽕',
          imageUrl: 'https://picsum.photos/300/200?random=sf12',
        },
      ],
    },
  ],
};

/** SINGLE + 직장 */
export const mockHotpickDetailSingleWork = {
  trendId: 205,
  alias: 'single-work',
  title: '재택 vs 출근?',
  label: '직장',
  imageUrls: ['https://picsum.photos/600/400?random=s5-detail'],
  createdAt: hoursAgo(48),
  type: 'SINGLE',
  deadline: daysFromNow(5),
  status: 'OPEN',
  items: [
    {
      id: 'sw1',
      title: '재택근무 vs 사무실 출근?',
      label: '근무 방식',
      voteType: 'IMAGE',
      options: [
        {
          id: 'sw1-o1',
          title: '재택근무',
          imageUrl: 'https://picsum.photos/300/200?random=sw11',
        },
        {
          id: 'sw1-o2',
          title: '사무실 출근',
          imageUrl: 'https://picsum.photos/300/200?random=sw12',
        },
      ],
    },
  ],
};

/** SINGLE + 트렌드 */
export const mockHotpickDetailSingleTrend = {
  trendId: 206,
  alias: 'single-trend',
  title: 'AI가 인간을 대체할까?',
  label: '트렌드',
  imageUrls: ['https://picsum.photos/600/400?random=s6-detail'],
  createdAt: hoursAgo(1),
  type: 'SINGLE',
  status: 'OPEN',
  items: [
    {
      id: 'str1',
      title: 'AI가 인간의 일자리를 대체할까?',
      label: 'AI 시대',
      voteType: 'TEXT',
      mainImageUrl: 'https://picsum.photos/400/200?random=str1-main',
      options: [
        { id: 'str1-o1', title: '대체한다' },
        { id: 'str1-o2', title: '공존한다' },
        { id: 'str1-o3', title: '불가능하다' },
      ],
    },
  ],
};

/** BUNDLE — 스포츠 긴급 상세 */
const mockHotpickDetailSportsUrgent = {
  trendId: 3,
  alias: 'sports-urgent',
  title: '스포츠 긴급 투표',
  label: '마감 임박!',
  imageUrls: [
    'https://picsum.photos/600/400?random=30',
    'https://picsum.photos/600/400?random=30-2',
  ],
  createdAt: hoursAgo(72),
  type: 'BUNDLE',
  deadline: hoursFromNow(1),
  status: 'OPEN',
  items: [
    {
      id: 'sp1',
      title: 'EPL 우승팀은?',
      label: '축구',
      voteType: 'IMAGE',
      options: [
        {
          id: 'sp1-o1',
          title: '아스날',
          imageUrl: 'https://picsum.photos/300/200?random=sp11',
        },
        {
          id: 'sp1-o2',
          title: '맨시티',
          imageUrl: 'https://picsum.photos/300/200?random=sp12',
        },
      ],
    },
    {
      id: 'sp2',
      title: 'KBO 올해 우승?',
      label: '야구',
      voteType: 'IMAGE',
      options: [
        {
          id: 'sp2-o1',
          title: 'LG 트윈스',
          imageUrl: 'https://picsum.photos/300/200?random=sp21',
        },
        {
          id: 'sp2-o2',
          title: '삼성 라이온즈',
          imageUrl: 'https://picsum.photos/300/200?random=sp22',
        },
      ],
    },
  ],
};

/** BUNDLE — 음식 새 트렌드 상세 */
const mockHotpickDetailFoodNew = {
  trendId: 5,
  alias: 'food-new',
  title: '오늘의 음식 대결',
  label: '뭐 먹을래?',
  imageUrls: [
    'https://picsum.photos/600/400?random=50',
    'https://picsum.photos/600/400?random=50-2',
  ],
  createdAt: hoursAgo(3),
  type: 'BUNDLE',
  status: 'OPEN',
  items: [
    {
      id: 'fd1',
      title: '점심 메뉴는?',
      label: '점심',
      voteType: 'IMAGE',
      options: [
        {
          id: 'fd1-o1',
          title: '한식',
          imageUrl: 'https://picsum.photos/300/200?random=fd11',
        },
        {
          id: 'fd1-o2',
          title: '양식',
          imageUrl: 'https://picsum.photos/300/200?random=fd12',
        },
      ],
    },
    {
      id: 'fd2',
      title: '야식은?',
      label: '야식',
      voteType: 'TEXT',
      mainImageUrl: 'https://picsum.photos/400/200?random=fd2-main',
      options: [
        { id: 'fd2-o1', title: '치킨' },
        { id: 'fd2-o2', title: '피자' },
        { id: 'fd2-o3', title: '족발' },
      ],
    },
  ],
};

/** BUNDLE — 이번주 트렌드 상세 */
const mockHotpickDetailTrendWeekly = {
  trendId: 6,
  alias: 'trend-weekly',
  title: '이번주 트렌드 핫이슈',
  label: '어떻게 생각하세요?',
  imageUrls: [
    'https://picsum.photos/600/400?random=60',
    'https://picsum.photos/600/400?random=60-2',
  ],
  createdAt: hoursAgo(24),
  type: 'BUNDLE',
  deadline: daysFromNow(7),
  status: 'OPEN',
  items: [
    {
      id: 'tw1',
      title: '올해 최고의 드라마는?',
      label: '문화',
      voteType: 'TEXT',
      mainImageUrl: 'https://picsum.photos/400/200?random=tw1-main',
      options: [
        { id: 'tw1-o1', title: '오징어게임3' },
        { id: 'tw1-o2', title: '더 글로리 시즌2' },
      ],
    },
    {
      id: 'tw2',
      title: 'MZ세대 트렌드?',
      label: '트렌드',
      voteType: 'IMAGE',
      options: [
        {
          id: 'tw2-o1',
          title: '갓생살기',
          imageUrl: 'https://picsum.photos/300/200?random=tw21',
        },
        {
          id: 'tw2-o2',
          title: '소확행',
          imageUrl: 'https://picsum.photos/300/200?random=tw22',
        },
      ],
    },
  ],
};

/** BUNDLE — 고정 트렌드 상세 */
const mockHotpickDetailFixed = {
  trendId: 100,
  alias: 'fixed-trend',
  title: '고정 트렌드: 2026 최고의 여행지는?',
  label: '당신의 선택은?',
  imageUrls: [
    'https://picsum.photos/600/400?random=fixed1-detail',
    'https://picsum.photos/600/400?random=fixed2-detail',
  ],
  createdAt: hoursAgo(2),
  type: 'BUNDLE',
  status: 'OPEN',
  items: [
    {
      id: 'fx1',
      title: '국내 여행지 최강은?',
      label: '국내',
      voteType: 'IMAGE',
      options: [
        {
          id: 'fx1-o1',
          title: '제주도',
          imageUrl: 'https://picsum.photos/300/200?random=fx11',
        },
        {
          id: 'fx1-o2',
          title: '부산',
          imageUrl: 'https://picsum.photos/300/200?random=fx12',
        },
      ],
    },
    {
      id: 'fx2',
      title: '해외는 어디로?',
      label: '해외',
      voteType: 'IMAGE',
      options: [
        {
          id: 'fx2-o1',
          title: '일본',
          imageUrl: 'https://picsum.photos/300/200?random=fx21',
        },
        {
          id: 'fx2-o2',
          title: '태국',
          imageUrl: 'https://picsum.photos/300/200?random=fx22',
        },
      ],
    },
  ],
};

/** alias → 구 상세 데이터 (내부용) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const legacyDetailMap: Record<string, any> = {
  // BUNDLE
  'fixed-trend': mockHotpickDetailFixed,
  'love-dilemma': mockHotpickDetailBundle,
  'finance-picks': mockHotpickDetailTextMixed,
  'sports-urgent': mockHotpickDetailSportsUrgent,
  'work-closed': mockHotpickDetailClosed,
  'food-new': mockHotpickDetailFoodNew,
  'trend-weekly': mockHotpickDetailTrendWeekly,
  // SINGLE
  'single-love': mockHotpickDetailSingleImage,
  'single-text-finance': mockHotpickDetailSingleText,
  'single-sports-urgent': mockHotpickDetailSingleSports,
  'single-food-closed': mockHotpickDetailSingleFoodClosed,
  'single-work': mockHotpickDetailSingleWork,
  'single-trend': mockHotpickDetailSingleTrend,
};

/** alias → 새 HotpickDetailResponse 형태 매핑 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mockHotpickDetailMap: Record<string, any> = Object.fromEntries(
  Object.entries(legacyDetailMap).map(([slug, detail]) => [slug, convertToHotpickDetail(detail)])
);

// relatedHotpicks 채우기: 각 상세 페이지에 자신을 제외한 SINGLE 핫픽 최대 2개
{
  const allCards: HotpickCardResponse[] = (mockMainDisplayLegacy.trends ?? []).map(
    (t: LegacyTrend) => convertToHotpickCard(t)
  );
  const singleCards = allCards.filter((c: HotpickCardResponse) => c.type === 'SINGLE');
  for (const [slug, detail] of Object.entries(mockHotpickDetailMap)) {
    const related = singleCards.filter((c: HotpickCardResponse) => c.slug !== slug).slice(0, 2);
    (detail as HotpickDetailResponse).relatedHotpicks = related;
  }
}

/** BUNDLE 기본 상세 (변환된 형태, handlers.ts 폴백용) */
export const mockHotpickDetailBundleConverted = convertToHotpickDetail(mockHotpickDetailBundle);

/** 선거별 투표 수 Mock */
export const mockVoteCountMap: Record<string, { options: { id: string; count: number }[] }> = {
  q1: {
    options: [
      { id: 'q1-o1', count: 450 },
      { id: 'q1-o2', count: 750 },
    ],
  },
  q2: {
    options: [
      { id: 'q2-o1', count: 680 },
      { id: 'q2-o2', count: 520 },
    ],
  },
  q3: {
    options: [
      { id: 'q3-o1', count: 890 },
      { id: 'q3-o2', count: 310 },
    ],
  },
  q4: {
    options: [
      { id: 'q4-o1', count: 420 },
      { id: 'q4-o2', count: 780 },
    ],
  },
  q5: {
    options: [
      { id: 'q5-o1', count: 950 },
      { id: 'q5-o2', count: 250 },
    ],
  },
  f1: {
    options: [
      { id: 'f1-o1', count: 320 },
      { id: 'f1-o2', count: 580 },
      { id: 'f1-o3', count: 440 },
      { id: 'f1-o4', count: 210 },
    ],
  },
  f2: {
    options: [
      { id: 'f2-o1', count: 670 },
      { id: 'f2-o2', count: 430 },
    ],
  },
  f3: {
    options: [
      { id: 'f3-o1', count: 550 },
      { id: 'f3-o2', count: 480 },
    ],
  },
  f4: {
    options: [
      { id: 'f4-o1', count: 710 },
      { id: 'f4-o2', count: 390 },
    ],
  },
  f5: {
    options: [
      { id: 'f5-o1', count: 600 },
      { id: 'f5-o2', count: 500 },
    ],
  },
  w1: {
    options: [
      { id: 'w1-o1', count: 1200 },
      { id: 'w1-o2', count: 800 },
    ],
  },
  w2: {
    options: [
      { id: 'w2-o1', count: 900 },
      { id: 'w2-o2', count: 1100 },
    ],
  },
  s1: {
    options: [
      { id: 's1-o1', count: 230 },
      { id: 's1-o2', count: 190 },
    ],
  },
  st1: {
    options: [
      { id: 'st1-o1', count: 340 },
      { id: 'st1-o2', count: 410 },
      { id: 'st1-o3', count: 140 },
    ],
  },
  ss1: {
    options: [
      { id: 'ss1-o1', count: 820 },
      { id: 'ss1-o2', count: 680 },
    ],
  },
  sf1: {
    options: [
      { id: 'sf1-o1', count: 1600 },
      { id: 'sf1-o2', count: 1600 },
    ],
  },
  sw1: {
    options: [
      { id: 'sw1-o1', count: 380 },
      { id: 'sw1-o2', count: 290 },
    ],
  },
  str1: {
    options: [
      { id: 'str1-o1', count: 700 },
      { id: 'str1-o2', count: 950 },
      { id: 'str1-o3', count: 450 },
    ],
  },
  fx1: {
    options: [
      { id: 'fx1-o1', count: 2800 },
      { id: 'fx1-o2', count: 2600 },
    ],
  },
  fx2: {
    options: [
      { id: 'fx2-o1', count: 3100 },
      { id: 'fx2-o2', count: 2300 },
    ],
  },
  sp1: {
    options: [
      { id: 'sp1-o1', count: 4500 },
      { id: 'sp1-o2', count: 4400 },
    ],
  },
  sp2: {
    options: [
      { id: 'sp2-o1', count: 3200 },
      { id: 'sp2-o2', count: 2100 },
    ],
  },
  fd1: {
    options: [
      { id: 'fd1-o1', count: 80 },
      { id: 'fd1-o2', count: 70 },
    ],
  },
  fd2: {
    options: [
      { id: 'fd2-o1', count: 60 },
      { id: 'fd2-o2', count: 50 },
      { id: 'fd2-o3', count: 40 },
    ],
  },
  tw1: {
    options: [
      { id: 'tw1-o1', count: 1100 },
      { id: 'tw1-o2', count: 1200 },
    ],
  },
  tw2: {
    options: [
      { id: 'tw2-o1', count: 900 },
      { id: 'tw2-o2', count: 800 },
    ],
  },
  // IMAGE 타입 싱글
  sic1: {
    options: [
      { id: 'sic1-o1', count: 920 },
      { id: 'sic1-o2', count: 930 },
    ],
  },
  sip1: {
    options: [
      { id: 'sip1-o1', count: 1700 },
      { id: 'sip1-o2', count: 1400 },
    ],
  },
  sit1: {
    options: [
      { id: 'sit1-o1', count: 1100 },
      { id: 'sit1-o2', count: 1300 },
    ],
  },
  sicar1: {
    options: [
      { id: 'sicar1-o1', count: 850 },
      { id: 'sicar1-o2', count: 820 },
    ],
  },
  sif1: {
    options: [
      { id: 'sif1-o1', count: 670 },
      { id: 'sif1-o2', count: 650 },
    ],
  },
  // 무한스크롤 추가 싱글
  smv1: {
    options: [
      { id: 'smv1-o1', count: 480 },
      { id: 'smv1-o2', count: 440 },
    ],
  },
  smr1: {
    options: [
      { id: 'smr1-o1', count: 790 },
      { id: 'smr1-o2', count: 750 },
    ],
  },
  shl1: {
    options: [
      { id: 'shl1-o1', count: 610 },
      { id: 'shl1-o2', count: 580 },
    ],
  },
  svc1: {
    options: [
      { id: 'svc1-o1', count: 430 },
      { id: 'svc1-o2', count: 440 },
    ],
  },
  ssn1: {
    options: [
      { id: 'ssn1-o1', count: 1400 },
      { id: 'ssn1-o2', count: 1200 },
    ],
  },
  sgm1: {
    options: [
      { id: 'sgm1-o1', count: 1800 },
      { id: 'sgm1-o2', count: 1600 },
    ],
  },
  smu1: {
    options: [
      { id: 'smu1-o1', count: 900 },
      { id: 'smu1-o2', count: 880 },
    ],
  },
  sbr1: {
    options: [
      { id: 'sbr1-o1', count: 2200 },
      { id: 'sbr1-o2', count: 2000 },
    ],
  },
  sap1: {
    options: [
      { id: 'sap1-o1', count: 1000 },
      { id: 'sap1-o2', count: 950 },
    ],
  },
  swd1: {
    options: [
      { id: 'swd1-o1', count: 560 },
      { id: 'swd1-o2', count: 560 },
    ],
  },
  scr1: {
    options: [
      { id: 'scr1-o1', count: 1500 },
      { id: 'scr1-o2', count: 1390 },
    ],
  },
  sdi1: {
    options: [
      { id: 'sdi1-o1', count: 720 },
      { id: 'sdi1-o2', count: 710 },
    ],
  },
  swe1: {
    options: [
      { id: 'swe1-o1', count: 830 },
      { id: 'swe1-o2', count: 820 },
    ],
  },
  // 멀티 카테고리 싱글
  slf1: {
    options: [
      { id: 'slf1-o1', count: 490 },
      { id: 'slf1-o2', count: 490 },
    ],
  },
  ssf1: {
    options: [
      { id: 'ssf1-o1', count: 1150 },
      { id: 'ssf1-o2', count: 1100 },
    ],
  },
};
