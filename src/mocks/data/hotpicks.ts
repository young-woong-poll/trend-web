import type { DisplayMainResponse } from '@/generated/models';

// ──────────────────────────────────────────────────────────
// Phase 2 P0 기능 테스트를 위한 Mock 데이터
//
// 테스트 케이스:
// 1. BUNDLE + IMAGE (기존) — 5개 선거 묶음
// 2. BUNDLE + TEXT — TEXT 투표 포함 혼합 묶음
// 3. BUNDLE + 마감임박 (D-2) — DeadlineBadge isImminent
// 4. BUNDLE + 마감 1시간 전 — DeadlineBadge isUrgent (카운트다운)
// 5. BUNDLE + 마감됨 — CLOSED 상태
// 6. SINGLE + IMAGE — Single 탭용
// 7. SINGLE + TEXT — 텍스트 단일 투표
// 8. SINGLE + 마감됨
// 9. 카테고리별 — LOVE, FINANCE, WORK, SPORTS, FOOD, TREND
// ──────────────────────────────────────────────────────────

const now = new Date();
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000).toISOString();
const daysFromNow = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000).toISOString();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();

/**
 * 메인 전시 Mock — BUNDLE (트렌드 탭)
 */
export const mockMainDisplay: DisplayMainResponse = {
  fixedTrends: [
    {
      id: 100,
      alias: 'fixed-trend',
      title: '고정 트렌드: 2026 최고의 여행지는?',
      label: '당신의 선택은?',
      imageUrls: [
        'https://picsum.photos/400/300?random=fixed1',
        'https://picsum.photos/400/300?random=fixed2',
      ],
      createdAt: hoursAgo(2),
      participantsCount: 5400,
    },
  ],
  trends: [
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
    {
      id: 4,
      alias: 'work-closed',
      title: '직장인 고민 (마감)',
      label: '이미 끝난 투표',
      imageUrls: [
        'https://picsum.photos/400/300?random=4',
        'https://picsum.photos/400/300?random=4-2',
      ],
      createdAt: hoursAgo(168),
      participantsCount: 4500,
    },
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
  hasMore: false,
  nextCursor: undefined,
  totalCount: 6,
};

/**
 * 메인 전시 Mock — SINGLE (Single 탭)
 */
export const mockSingleDisplay: DisplayMainResponse = {
  fixedTrends: [],
  trends: [
    {
      id: 201,
      alias: 'single-love',
      title: '첫 데이트 장소는?',
      label: '연애',
      imageUrls: ['https://picsum.photos/400/300?random=s1'],
      createdAt: hoursAgo(6),
      participantsCount: 420,
    },
    {
      id: 202,
      alias: 'single-text-finance',
      title: '적금 vs 주식?',
      label: '재테크',
      imageUrls: ['https://picsum.photos/400/300?random=s2'],
      createdAt: hoursAgo(2),
      participantsCount: 890,
    },
    {
      id: 203,
      alias: 'single-sports-urgent',
      title: '오늘 경기 승자는?',
      label: '스포츠',
      imageUrls: ['https://picsum.photos/400/300?random=s3'],
      createdAt: hoursAgo(20),
      participantsCount: 1500,
    },
    {
      id: 204,
      alias: 'single-food-closed',
      title: '짜장 vs 짬뽕 (마감)',
      label: '음식',
      imageUrls: ['https://picsum.photos/400/300?random=s4'],
      createdAt: hoursAgo(96),
      participantsCount: 3200,
    },
    {
      id: 205,
      alias: 'single-work',
      title: '재택 vs 출근?',
      label: '직장',
      imageUrls: ['https://picsum.photos/400/300?random=s5'],
      createdAt: hoursAgo(48),
      participantsCount: 670,
    },
    {
      id: 206,
      alias: 'single-trend',
      title: 'AI가 인간을 대체할까?',
      label: '트렌드',
      imageUrls: ['https://picsum.photos/400/300?random=s6'],
      createdAt: hoursAgo(1),
      participantsCount: 2100,
    },
  ],
  hasMore: false,
  nextCursor: undefined,
  totalCount: 6,
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
};

/**
 * 트렌드 배열에 확장 필드를 주입하는 유틸
 */
export const injectExtensions = <T extends { alias?: string }>(trends: T[]): T[] =>
  trends.map((t) => {
    const ext = trendExtensions[t.alias ?? ''];
    return ext ? { ...t, ...ext } : t;
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

/** alias → 상세 데이터 매핑 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mockHotpickDetailMap: Record<string, any> = {
  'love-dilemma': mockHotpickDetailBundle,
  'finance-picks': mockHotpickDetailTextMixed,
  'work-closed': mockHotpickDetailClosed,
  'single-love': mockHotpickDetailSingleImage,
  'single-text-finance': mockHotpickDetailSingleText,
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
};
