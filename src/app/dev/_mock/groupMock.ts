import type { CompareLink } from '@/types/compare';
import type { GroupCompareResult } from '@/types/group-compare';

const BUNDLE_SLUG = 'image-test-bundle';
const TOTAL_QUESTIONS = 4;

/** 질문별 선택지 ID (실제 BE 응답 그대로) */
const ELECTIONS = [
  { id: '80', title: '더 귀여운 놈은?', a: '194', b: '195' },
  { id: '81', title: '더 귀여운 놈은2?', a: '196', b: '197' },
  { id: '82', title: '더 잘만든 심볼은?', a: '198', b: '199' },
  { id: '83', title: '더 잘만든 심볼2', a: '200', b: '201' },
];

/** 프로필 색상 팔레트 — 실제 응답이 대문자이므로 일치시킴 */
const COLORS = [
  'RED',
  'FLAME',
  'CORAL',
  'PEACH',
  'AMBER',
  'GOLD',
  'LIME',
  'GREEN',
  'FOREST',
  'TEAL',
  'MINT',
  'CYAN',
  'SKY',
  'BLUE',
  'OCEAN',
  'SAPPHIRE',
  'INDIGO',
  'GRAPE',
  'PURPLE',
  'LAVENDER',
  'MAGENTA',
  'PINK',
  'ROSE',
  'SUNSET',
];

const NICKNAME_POOL = [
  '웅쓰',
  '지민',
  '수현',
  '도현',
  '예린',
  '민재',
  '서연',
  '하준',
  '유진',
  '지우',
  '현우',
  '채원',
  '태윤',
  '나은',
  '건우',
  '소율',
  '시우',
  '다영',
  '준영',
  '혜원',
  '승민',
  '가연',
  '우진',
  '예은',
  '정우',
  '서진',
  '민혁',
  '은우',
  '현수',
  '아린',
  '준호',
  '유나',
  '지훈',
  '수빈',
  '주원',
  '세은',
  '태민',
  '해린',
  '원준',
  '아름',
];

/** 질문 4개이므로 길이 4 비트 조합 16가지 — 케미 분포를 다양하게 뽑기 위해 반복 순환 사용 */
const ANSWER_PATTERNS: ReadonlyArray<readonly [number, number, number, number]> = [
  [0, 0, 0, 0],
  [0, 0, 0, 1],
  [0, 0, 1, 0],
  [0, 0, 1, 1],
  [0, 1, 0, 0],
  [0, 1, 0, 1],
  [0, 1, 1, 0],
  [0, 1, 1, 1],
  [1, 0, 0, 0],
  [1, 0, 0, 1],
  [1, 0, 1, 0],
  [1, 0, 1, 1],
  [1, 1, 0, 0],
  [1, 1, 0, 1],
  [1, 1, 1, 0],
  [1, 1, 1, 1],
];

interface MemberDef {
  userId: string;
  nickname: string;
  displayName: string;
  displayProfileColor: string;
  gender: 'MALE' | 'FEMALE';
  answers: Array<{ electionId: string; electionItemId: string }>;
}

export interface MockGroupOptions {
  token: string;
  groupName: string;
  maleCount: number;
  femaleCount: number;
  /** 내 userId — 멤버 배열 0번 자리에 배치됨 */
  myUserIdSuffix?: string;
}

function buildMembers(opts: MockGroupOptions): MemberDef[] {
  const total = opts.maleCount + opts.femaleCount;
  const myUserId = `${opts.token}-me`;

  // 성별 배열 — MALE 먼저 채우고 FEMALE 채운 뒤 섞음 (나는 0번, 남성 고정)
  const genders: Array<'MALE' | 'FEMALE'> = [];
  for (let i = 0; i < opts.maleCount; i++) {
    genders.push('MALE');
  }
  for (let i = 0; i < opts.femaleCount; i++) {
    genders.push('FEMALE');
  }
  // 0번 MALE 고정한 채 나머지는 index 기반 alternating (결정적 분포)
  const arranged: Array<'MALE' | 'FEMALE'> = new Array(total);
  arranged[0] = 'MALE';
  let maleRemain = opts.maleCount - 1;
  let femaleRemain = opts.femaleCount;
  for (let i = 1; i < total; i++) {
    // 짝수 index는 가능한 한 FEMALE, 홀수는 MALE — 교대 배치
    if (i % 2 === 1 && maleRemain > 0) {
      arranged[i] = 'MALE';
      maleRemain--;
    } else if (femaleRemain > 0) {
      arranged[i] = 'FEMALE';
      femaleRemain--;
    } else if (maleRemain > 0) {
      arranged[i] = 'MALE';
      maleRemain--;
    } else {
      arranged[i] = 'FEMALE';
      femaleRemain--;
    }
  }

  return arranged.map((gender, i) => {
    const isMe = i === 0;
    const userId = isMe ? myUserId : `${opts.token}-user-${i}`;
    const pattern = ANSWER_PATTERNS[i % ANSWER_PATTERNS.length];
    const answers = pattern.map((choice, qIdx) => ({
      electionId: ELECTIONS[qIdx].id,
      electionItemId: choice === 0 ? ELECTIONS[qIdx].a : ELECTIONS[qIdx].b,
    }));
    return {
      userId,
      nickname: NICKNAME_POOL[i % NICKNAME_POOL.length],
      displayName: NICKNAME_POOL[i % NICKNAME_POOL.length],
      displayProfileColor: COLORS[i % COLORS.length],
      gender,
      answers,
    };
  });
}

function buildQuestionStats(members: MemberDef[]) {
  return ELECTIONS.map((e) => {
    const aCount = members.filter((m) =>
      m.answers.some((ans) => ans.electionId === e.id && ans.electionItemId === e.a)
    ).length;
    const bCount = members.length - aCount;
    return {
      electionId: e.id,
      title: e.title,
      optionStats: [
        {
          electionItemId: e.a,
          title: `${e.title} · A`,
          imageUrl:
            'https://trend-image.votebox.kr/uploads/2026/04/13/06e62c210bf24d47ad48d2ba92eb1ecc.png',
          voteCount: aCount,
        },
        {
          electionItemId: e.b,
          title: `${e.title} · B`,
          imageUrl:
            'https://trend-image.votebox.kr/uploads/2026/04/13/b6ff0b43c0e54e3681a011cab8fc2643.png',
          voteCount: bCount,
        },
      ],
    };
  });
}

export function buildMockGroupResult(opts: MockGroupOptions): GroupCompareResult {
  const members = buildMembers(opts);
  const myUserId = members[0].userId;
  return {
    bundleSlug: BUNDLE_SLUG,
    bundleTitle: '이미지 테스트 번들임당',
    totalQuestions: TOTAL_QUESTIONS,
    groupName: opts.groupName,
    memberCount: members.length,
    myUserId,
    myBundleCompleted: true,
    category: '연애/결혼',
    categoryCode: 'LOVE',
    categoryMeta:
      '{"categoryCode":"FINANCE","theme":{"start":"#56AB2F","end":"#A8E063","startRgb":"86, 171, 47","endRgb":"168, 224, 99","emoji":"💰","label":"재테크"}}',
    showGenderContent: true,
    isClosed: false,
    creatorUserId: myUserId,
    members,
    questionStats: buildQuestionStats(members),
  };
}

export function buildMockCompareLink(result: GroupCompareResult): CompareLink {
  return {
    token: '',
    type: 'GROUP',
    bundleSlug: result.bundleSlug ?? BUNDLE_SLUG,
    bundleTitle: result.bundleTitle,
    category: result.category,
    categoryCode: result.categoryCode,
    categoryMeta: result.categoryMeta,
    groupName: result.groupName,
    memberCount: result.memberCount,
    myBundleCompleted: true,
    myUserId: result.myUserId,
    creatorUserId: result.creatorUserId,
    isClosed: false,
  } as unknown as CompareLink;
}
