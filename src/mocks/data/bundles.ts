import type { BundleDetail, BundleElection, BundleMyResult } from '@/types/bundle';

export const mockBundleDetails: Record<string, BundleDetail> = {
  'love-values': {
    bundleId: 1,
    slug: 'love-values',
    title: '연애 가치관 테스트',
    subtitle: '우리 연애 스타일 얼마나 통할까?',
    description:
      '연애에서 중요한 5가지 질문으로 나와 상대방의 가치관을 비교해보세요. 썸부터 싸움 해결까지, 우리는 얼마나 맞을까요?',
    category: '연애',
    questionCount: 5,
    status: 'ACTIVE',
    imageUrl:
      'https://trend-image.votebox.kr/uploads/2026/03/12/8632bb8173cf44f5a9e5ac4f2017924e.jpg',
    participantCount: 247,
    completed: false,
  },
  'marriage-values': {
    bundleId: 2,
    slug: 'marriage-values',
    title: '결혼 가치관 테스트',
    subtitle: '우리 결혼하면 잘 살 수 있을까?',
    description:
      '혼수, 맞벌이, 신혼집, 명절, 교육까지. 결혼 전에 꼭 맞춰봐야 할 5가지 가치관을 비교합니다.',
    category: '결혼',
    questionCount: 5,
    status: 'ACTIVE',
    imageUrl: undefined,
    participantCount: 183,
    completed: false,
  },
  // ─── 등급 확인용 mock 번들 ───
  'grade-king': {
    bundleId: 10,
    slug: 'grade-king',
    title: '등급 테스트: 사자왕',
    subtitle: '대중성 68%+ → 여론의 사자왕',
    description: '등급 확인용',
    category: '테스트',
    questionCount: 5,
    status: 'ACTIVE',
    imageUrl: undefined,
    participantCount: 100,
    completed: true,
  },
  'grade-leader': {
    bundleId: 11,
    slug: 'grade-leader',
    title: '등급 테스트: 트렌드 여우',
    subtitle: '대중성 58~67% → 트렌드 여우',
    description: '등급 확인용',
    category: '테스트',
    questionCount: 5,
    status: 'ACTIVE',
    imageUrl: undefined,
    participantCount: 100,
    completed: true,
  },
  'grade-balancer': {
    bundleId: 12,
    slug: 'grade-balancer',
    title: '등급 테스트: 밸런스 판다',
    subtitle: '대중성 48~57% → 밸런스 판다',
    description: '등급 확인용',
    category: '테스트',
    questionCount: 5,
    status: 'ACTIVE',
    imageUrl: undefined,
    participantCount: 100,
    completed: true,
  },
  'grade-rebel': {
    bundleId: 13,
    slug: 'grade-rebel',
    title: '등급 테스트: 소신 고양이',
    subtitle: '대중성 38~47% → 소신 고양이',
    description: '등급 확인용',
    category: '테스트',
    questionCount: 5,
    status: 'ACTIVE',
    imageUrl: undefined,
    participantCount: 100,
    completed: true,
  },
  'grade-unicorn': {
    bundleId: 14,
    slug: 'grade-unicorn',
    title: '등급 테스트: 유니콘',
    subtitle: '대중성 ~37% → 유니콘',
    description: '등급 확인용',
    category: '테스트',
    questionCount: 5,
    status: 'ACTIVE',
    imageUrl: undefined,
    participantCount: 100,
    completed: true,
  },
};

// 등급 테스트용 공통 질문
const gradeTestElections: BundleElection[] = [
  { electionId: 'gt-1', title: '테스트 질문 1', optionA: '선택 A', optionB: '선택 B' },
  { electionId: 'gt-2', title: '테스트 질문 2', optionA: '선택 A', optionB: '선택 B' },
  { electionId: 'gt-3', title: '테스트 질문 3', optionA: '선택 A', optionB: '선택 B' },
  { electionId: 'gt-4', title: '테스트 질문 4', optionA: '선택 A', optionB: '선택 B' },
  { electionId: 'gt-5', title: '테스트 질문 5', optionA: '선택 A', optionB: '선택 B' },
];

export const mockBundleElections: Record<string, BundleElection[]> = {
  'love-values': [
    { electionId: 'le-1', title: '썸 탈 때', optionA: '먼저 연락', optionB: '기다리기' },
    {
      electionId: 'le-2',
      title: '연인의 전 애인 사진',
      optionA: '지워야 함',
      optionB: '상관없음',
    },
    { electionId: 'le-3', title: '기념일', optionA: '챙기는 편', optionB: '별로' },
    { electionId: 'le-4', title: '연인의 이성 친구 만남', optionA: 'OK', optionB: 'NO' },
    {
      electionId: 'le-5',
      title: '싸우면',
      optionA: '바로 풀기',
      optionB: '혼자 정리하고 대화',
    },
  ],
  'marriage-values': [
    { electionId: 'me-1', title: '혼수 비용', optionA: '각자 알아서', optionB: '반반' },
    {
      electionId: 'me-2',
      title: '결혼 후 경제활동',
      optionA: '맞벌이',
      optionB: '한쪽이 집에',
    },
    { electionId: 'me-3', title: '신혼집', optionA: '매매', optionB: '전세' },
    { electionId: 'me-4', title: '시댁·처가 명절', optionA: '매년', optionB: '격년' },
    { electionId: 'me-5', title: '아이 교육', optionA: '사교육', optionB: '자율' },
  ],
  'grade-king': gradeTestElections,
  'grade-leader': gradeTestElections,
  'grade-balancer': gradeTestElections,
  'grade-rebel': gradeTestElections,
  'grade-unicorn': gradeTestElections,
};

/** 번들 답변 인메모리 저장소 (MSW용) */
export const bundleAnswerStore = new Map<
  string,
  Array<{ electionId: string; selected: 'A' | 'B' }>
>();

/** 질문별 투표 집계 (MSW용) */
export const bundleVoteStats = new Map<string, { optionACount: number; optionBCount: number }>();

export function recordBundleAnswers(
  userId: string,
  slug: string,
  answers: Array<{ electionId: string; selected: 'A' | 'B' }>
) {
  bundleAnswerStore.set(`${userId}_${slug}`, answers);
  for (const answer of answers) {
    const stats = bundleVoteStats.get(answer.electionId) ?? { optionACount: 0, optionBCount: 0 };
    if (answer.selected === 'A') {
      stats.optionACount++;
    } else {
      stats.optionBCount++;
    }
    bundleVoteStats.set(answer.electionId, stats);
  }
}

/**
 * 비교용 mock 유저 — mock-user-1, mock-user-2 love-values 번들 미리 답변
 * compare 결과 페이지 테스트용
 */
export function seedSecondUser() {
  const slug = 'love-values';

  // mock-user-1 (생성자) 답변 시드
  if (!bundleAnswerStore.has(`mock-user-1_${slug}`)) {
    recordBundleAnswers('mock-user-1', slug, [
      { electionId: 'le-1', selected: 'A' },
      { electionId: 'le-2', selected: 'A' },
      { electionId: 'le-3', selected: 'B' },
      { electionId: 'le-4', selected: 'A' },
      { electionId: 'le-5', selected: 'A' },
    ]);
  }

  // mock-user-2 (참여자) 답변 시드
  if (!bundleAnswerStore.has(`mock-user-2_${slug}`)) {
    recordBundleAnswers('mock-user-2', slug, [
      { electionId: 'le-1', selected: 'B' },
      { electionId: 'le-2', selected: 'A' },
      { electionId: 'le-3', selected: 'A' },
      { electionId: 'le-4', selected: 'B' },
      { electionId: 'le-5', selected: 'A' },
    ]);
  }

  // mock-user-2 marriage-values 답변 시드 (invite2 링크 생성자용)
  const marriageSlug = 'marriage-values';
  if (!bundleAnswerStore.has(`mock-user-2_${marriageSlug}`)) {
    recordBundleAnswers('mock-user-2', marriageSlug, [
      { electionId: 'me-1', selected: 'A' },
      { electionId: 'me-2', selected: 'B' },
      { electionId: 'me-3', selected: 'A' },
      { electionId: 'me-4', selected: 'B' },
      { electionId: 'me-5', selected: 'A' },
    ]);
  }
}

/**
 * 그룹 비교용 다수 유저 답변 시드
 * mock-user-3 ~ mock-user-6 으로 love-values 미리 답변
 */
export function seedGroupUsers() {
  const slug = 'love-values';
  // seedRatios=[85,25,78,30,72] 기준 대중성 점수 분포:
  // user-3: 전부 대중 선택(A,B,A,B,A) → 85,75,78,70,72 → avg 76 (트렌드 여우)
  // user-4: 전부 소신 선택(B,A,B,A,B) → 15,25,22,30,28 → avg 24 (유니콘)
  // user-5: 대중 4개(A,B,A,B,B) → 85,75,78,70,28 → avg 67 (트렌드 여우)
  // user-6: 소신 3개(B,A,B,A,A) → 15,25,22,30,72 → avg 33 (유니콘)
  const groupAnswers: Record<string, Array<{ electionId: string; selected: 'A' | 'B' }>> = {
    // le-2: 전원 A → 만장일치, le-4: 4:1 → 압도적, le-1: 3:2 → 논쟁
    'mock-user-3': [
      { electionId: 'le-1', selected: 'A' },
      { electionId: 'le-2', selected: 'A' },
      { electionId: 'le-3', selected: 'A' },
      { electionId: 'le-4', selected: 'A' },
      { electionId: 'le-5', selected: 'A' },
    ],
    'mock-user-4': [
      { electionId: 'le-1', selected: 'B' },
      { electionId: 'le-2', selected: 'A' },
      { electionId: 'le-3', selected: 'B' },
      { electionId: 'le-4', selected: 'A' },
      { electionId: 'le-5', selected: 'B' },
    ],
    'mock-user-5': [
      { electionId: 'le-1', selected: 'A' },
      { electionId: 'le-2', selected: 'A' },
      { electionId: 'le-3', selected: 'A' },
      { electionId: 'le-4', selected: 'A' },
      { electionId: 'le-5', selected: 'B' },
    ],
    'mock-user-6': [
      { electionId: 'le-1', selected: 'B' },
      { electionId: 'le-2', selected: 'A' },
      { electionId: 'le-3', selected: 'B' },
      { electionId: 'le-4', selected: 'A' },
      { electionId: 'le-5', selected: 'A' },
    ],
  };

  for (const [userId, answers] of Object.entries(groupAnswers)) {
    if (bundleAnswerStore.has(`${userId}_${slug}`)) {
      continue;
    }
    recordBundleAnswers(userId, slug, answers);
  }
}

/**
 * 대인원 그룹 테스트용 유저 답변 시드
 * mock-user-7 ~ mock-user-{6+count} 까지 love-values 랜덤 답변 생성
 */
export function seedLargeGroupUsers(count: number) {
  const slug = 'love-values';
  const electionIds = ['le-1', 'le-2', 'le-3', 'le-4', 'le-5'];

  for (let i = 7; i < 7 + count; i++) {
    const userId = `mock-user-${i}`;
    if (bundleAnswerStore.has(`${userId}_${slug}`)) {
      continue;
    }
    // 시드 기반 — 다양한 대중성 분포를 만들기 위해 유저마다 대중 선택 비율이 다름
    // seedRatios=[85,25,78,30,72]에서 대중 선택: le-1→A, le-2→B, le-3→A, le-4→B, le-5→A
    const popularChoices = ['A', 'B', 'A', 'B', 'A'];
    const hash = i * 31;
    const answers = electionIds.map((electionId, j) => {
      // 유저별로 대중 선택 확률을 다르게 (0%~100%)
      const threshold = (hash + j * 17) % 100;
      const cutoff = (i % 5) * 25; // 0, 25, 50, 75, 100
      const isPopular = threshold >= cutoff;
      return {
        electionId,
        selected: (isPopular ? popularChoices[j] : popularChoices[j] === 'A' ? 'B' : 'A') as
          | 'A'
          | 'B',
      };
    });
    recordBundleAnswers(userId, slug, answers);
  }
}

export function getBundleResult(userId: string, slug: string): BundleMyResult | null {
  const answers = bundleAnswerStore.get(`${userId}_${slug}`);
  if (!answers) {
    return null;
  }

  const elections = mockBundleElections[slug] as BundleElection[] | undefined;
  if (!elections) {
    return null;
  }

  const detail = mockBundleDetails[slug] as BundleDetail | undefined;

  return {
    bundleSlug: slug,
    bundleTitle: detail?.title ?? slug,
    totalQuestions: elections.length,
    myAnswers: answers.map((a) => {
      const election = elections.find((e) => e.electionId === a.electionId);
      return {
        electionId: a.electionId,
        title: election?.title ?? '',
        optionA: election?.optionA ?? '',
        optionB: election?.optionB ?? '',
        selected: a.selected,
      };
    }),
    questionStats: elections.map((e, i) => {
      const stats = bundleVoteStats.get(e.electionId) ?? { optionACount: 0, optionBCount: 0 };
      const total = stats.optionACount + stats.optionBCount;
      const seedRatios = [62, 45, 71, 38, 55, 48, 66, 33, 57, 42];
      const seedA = seedRatios[i] ?? 50;
      const seedB = 100 - seedA;
      return {
        electionId: e.electionId,
        optionACount: total > 0 ? stats.optionACount : seedA,
        optionBCount: total > 0 ? stats.optionBCount : seedB,
      };
    }),
  };
}
