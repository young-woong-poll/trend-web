import type { DisplayMainResponse } from '@/generated/models';

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
  optionA: { id: string; text: string; voteCount: number | null };
  optionB: { id: string; text: string; voteCount: number | null };
  voted: boolean;
  myChoice: 'A' | 'B' | null;
  totalVotes: number | null;
}

/** 싱글 핫픽별 투표 옵션 매핑 */
export const singleVoteDataMap: Record<string, MockSingleVote> = {
  'single-love': {
    electionId: 's1',
    optionA: { id: 's1-o1', text: '분위기 좋은 카페', voteCount: null },
    optionB: { id: 's1-o2', text: '놀이공원', voteCount: null },
    voted: false,
    myChoice: null,
    totalVotes: null,
  },
  'single-text-finance': {
    electionId: 'st1',
    optionA: { id: 'st1-o1', text: '안전한 적금', voteCount: null },
    optionB: { id: 'st1-o2', text: '주식 투자', voteCount: null },
    voted: false,
    myChoice: null,
    totalVotes: null,
  },
  'single-sports-urgent': {
    electionId: 'ss1',
    optionA: { id: 'ss1-o1', text: '홈팀 승리', voteCount: null },
    optionB: { id: 'ss1-o2', text: '원정팀 승리', voteCount: null },
    voted: false,
    myChoice: null,
    totalVotes: null,
  },
  'single-food-closed': {
    electionId: 'sf1',
    optionA: { id: 'sf1-o1', text: '짜장면', voteCount: 1600 },
    optionB: { id: 'sf1-o2', text: '짬뽕', voteCount: 1600 },
    voted: false,
    myChoice: null,
    totalVotes: 3200,
  },
  'single-work': {
    electionId: 'sw1',
    optionA: { id: 'sw1-o1', text: '재택근무', voteCount: null },
    optionB: { id: 'sw1-o2', text: '사무실 출근', voteCount: null },
    voted: false,
    myChoice: null,
    totalVotes: null,
  },
  'single-trend': {
    electionId: 'str1',
    optionA: { id: 'str1-o1', text: '대체한다', voteCount: null },
    optionB: { id: 'str1-o2', text: '공존한다', voteCount: null },
    voted: false,
    myChoice: null,
    totalVotes: null,
  },
  'single-dating-sns': {
    electionId: 'sds1',
    optionA: { id: 'sds1-o1', text: '괜찮다', voteCount: null },
    optionB: { id: 'sds1-o2', text: '절대 안 돼', voteCount: null },
    voted: false,
    myChoice: null,
    totalVotes: null,
  },
  'single-chicken': {
    electionId: 'sc1',
    optionA: { id: 'sc1-o1', text: '후라이드', voteCount: null },
    optionB: { id: 'sc1-o2', text: '양념', voteCount: null },
    voted: false,
    myChoice: null,
    totalVotes: null,
  },
  'single-salary': {
    electionId: 'ssa1',
    optionA: { id: 'ssa1-o1', text: '연봉 올려주기', voteCount: null },
    optionB: { id: 'ssa1-o2', text: '복지 늘리기', voteCount: null },
    voted: false,
    myChoice: null,
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
export const mockMainDisplay: DisplayMainResponse = {
  fixedTrends: [],
  trends: [
    // ── 싱글 #1~#7 ──
    {
      id: 201,
      alias: 'single-love',
      title: '첫 데이트 장소는?',
      label: '연애',
      imageUrls: ['https://picsum.photos/400/300?random=2'],
      createdAt: hoursAgo(6),
      participantsCount: 420,
    },
    {
      id: 202,
      alias: 'single-text-finance',
      title: '적금 vs 주식?',
      label: '재테크',
      imageUrls: [
        'https://picsum.photos/400/300?random=2',
        'https://picsum.photos/400/300?random=2-2',
      ],
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
    {
      id: 203,
      alias: 'single-sports-urgent',
      title: '오늘 경기 승자는?',
      label: '스포츠',
      imageUrls: [],
      createdAt: hoursAgo(20),
      participantsCount: 1500,
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

    // ── 싱글 #8~#14 ──
    {
      id: 303,
      alias: 'single-salary',
      title: '회사에 바라는 것은?',
      label: '직장',
      imageUrls: [],
      createdAt: hoursAgo(10),
      participantsCount: 540,
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
  ],
  hasMore: false,
  nextCursor: undefined,
  totalCount: 12,
};

/**
 * Phase 2 확장 필드 — 핸들러에서 트렌드 데이터에 주입
 */
interface TrendExtension {
  type?: string;
  categoryCode?: string;
  deadline?: string;
  status?: string;
}

export const trendExtensions: Record<string, TrendExtension> = {
  // SINGLE
  'single-love': { type: 'SINGLE', categoryCode: 'LOVE', status: 'OPEN' },
  'single-text-finance': { type: 'SINGLE', categoryCode: 'FINANCE', status: 'OPEN' },
  'single-sports-urgent': {
    type: 'SINGLE',
    categoryCode: 'SPORTS',
    deadline: hoursFromNow(2),
    status: 'OPEN',
  },
  'single-food-closed': {
    type: 'SINGLE',
    categoryCode: 'FOOD',
    deadline: hoursAgo(12),
    status: 'CLOSED',
  },
  'single-work': {
    type: 'SINGLE',
    categoryCode: 'WORK',
    deadline: daysFromNow(5),
    status: 'OPEN',
  },
  'single-trend': { type: 'SINGLE', categoryCode: 'TREND', status: 'OPEN' },
  'single-dating-sns': { type: 'SINGLE', categoryCode: 'LOVE', status: 'OPEN' },
  'single-chicken': { type: 'SINGLE', categoryCode: 'FOOD', status: 'OPEN' },
  'single-salary': { type: 'SINGLE', categoryCode: 'WORK', status: 'OPEN' },
  // BUNDLE
  'fixed-trend': { type: 'BUNDLE', categoryCode: 'TREND', status: 'OPEN' },
  'love-dilemma': { type: 'BUNDLE', categoryCode: 'LOVE', status: 'OPEN' },
  'finance-picks': {
    type: 'BUNDLE',
    categoryCode: 'FINANCE',
    deadline: daysFromNow(2),
    status: 'OPEN',
  },
  'sports-urgent': {
    type: 'BUNDLE',
    categoryCode: 'SPORTS',
    deadline: hoursFromNow(1),
    status: 'OPEN',
  },
  'work-closed': {
    type: 'BUNDLE',
    categoryCode: 'WORK',
    deadline: hoursAgo(24),
    status: 'CLOSED',
  },
  'food-new': { type: 'BUNDLE', categoryCode: 'FOOD', status: 'OPEN' },
  'trend-weekly': {
    type: 'BUNDLE',
    categoryCode: 'TREND',
    deadline: daysFromNow(7),
    status: 'OPEN',
  },
};

/**
 * 메인 전시 Mock — SINGLE만 (하위호환용)
 */
export const mockSingleDisplay: DisplayMainResponse = {
  fixedTrends: [],
  trends:
    mockMainDisplay.trends?.filter((t) => {
      const ext = trendExtensions[t.alias ?? ''];
      return ext?.type === 'SINGLE';
    }) ?? [],
  hasMore: false,
  nextCursor: undefined,
  totalCount: 0,
};

/**
 * 트렌드 배열에 확장 필드를 주입하는 유틸
 */
export const injectExtensions = <T extends { alias?: string }>(trends: T[]): T[] =>
  trends.map((t) => {
    const ext = trendExtensions[t.alias ?? ''];
    const singleVote = singleVoteDataMap[t.alias ?? ''];
    return ext ? { ...t, ...ext, ...(singleVote ? { singleVote } : {}) } : t;
  });

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

/** alias → 상세 데이터 매핑 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mockHotpickDetailMap: Record<string, any> = {
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
};
