// src/constants/bundle.ts

import type { CategoryCode } from '@/types/hotpick';

/** 이성궁합/성별대결 컴포넌트를 표시할 카테고리 */
export const GENDER_CATEGORIES: CategoryCode[] = ['LOVE', 'MARRIAGE'];

/** 카테고리 코드가 이성 콘텐츠 대상인지 (대소문자 무시) */
export function isGenderCategory(categoryCode?: string | null): boolean {
  if (!categoryCode) {
    return false;
  }
  const upper = categoryCode.toUpperCase();
  return upper.includes('LOVE') || upper.includes('MARRIAGE');
}

/**
 * 케미 등급 매핑
 * matchRate(일치율) → 등급/타이틀/한줄평
 * 서버는 matchRate(숫자)만 리턴, 여기서 매핑
 */
export type ChemistryGrade = 'S' | 'A' | 'B' | 'C' | 'D';

export interface ChemistryInfo {
  grade: ChemistryGrade;
  title: string;
  description: string;
  gradient: string;
  /** 3D 캐릭터 이미지 경로 — 에셋 준비 전 null */
  imagePath: string | null;
}

export const CHEMISTRY_GRADES: ChemistryInfo[] = [
  {
    grade: 'S',
    title: '말 안 해도 통하는',
    description: '생각이 이렇게 같을 수가',
    gradient: 'linear-gradient(135deg, #FFD700, #FFA500)',
    imagePath: null,
  },
  {
    grade: 'A',
    title: '꽤 잘 맞는',
    description: '대부분 통하는데, 가끔 깜짝 놀랄 포인트가!',
    gradient: 'linear-gradient(135deg, #FF00FF, #8B5CF6)',
    imagePath: null,
  },
  {
    grade: 'B',
    title: '같을 때도 다를 때도',
    description: '반은 같고 반은 다르고, 이게 진짜 케미 아닐까?',
    gradient: 'linear-gradient(135deg, #FF6B35, #FF00FF)',
    imagePath: null,
  },
  {
    grade: 'C',
    title: '각자의 세계',
    description: '다른 점이 더 많아서 오히려 재밌는 사이',
    gradient: 'linear-gradient(135deg, #4FC3F7, #00BCD4)',
    imagePath: null,
  },
  {
    grade: 'D',
    title: '정반대의 가치관',
    description: '같은 세상 살고 있는 거 맞아? 오히려 흥미로운!',
    gradient: 'linear-gradient(135deg, #66BB6A, #00BCD4)',
    imagePath: null,
  },
];

export function getChemistryByRate(matchRate: number): ChemistryInfo {
  if (matchRate >= 80) {
    return CHEMISTRY_GRADES[0];
  } // S
  if (matchRate >= 60) {
    return CHEMISTRY_GRADES[1];
  } // A
  if (matchRate >= 40) {
    return CHEMISTRY_GRADES[2];
  } // B
  if (matchRate >= 20) {
    return CHEMISTRY_GRADES[3];
  } // C
  return CHEMISTRY_GRADES[4]; // D
}

/**
 * 대중성 등급 매핑
 * popularityScore → 등급/캐릭터/설명
 */
export type PopularityGrade = 'KING' | 'LEADER' | 'BALANCER' | 'REBEL' | 'UNICORN';

export interface PopularityInfo {
  grade: PopularityGrade;
  title: string;
  description: string;
  /** 3D 캐릭터 이미지 경로 — 에셋 준비 전 null */
  imagePath: string | null;
}

export const POPULARITY_GRADES: PopularityInfo[] = [
  {
    grade: 'KING',
    title: '여론의 사자왕',
    description: '대중의 마음을 꿰뚫어 봄',
    imagePath:
      'https://trend-image.votebox.kr/uploads/2026/03/31/d43a750515e84b68a4d419d2ac59e26a.png',
  },
  {
    grade: 'LEADER',
    title: '트렌드 여우',
    description: '시대를 읽는 눈이 있음',
    imagePath:
      'https://trend-image.votebox.kr/uploads/2026/03/31/3a05846c04944a98bcbc4551da6f6745.png',
  },
  {
    grade: 'BALANCER',
    title: '밸런스 판다',
    description: '어느 쪽이든 이해하는 균형파',
    imagePath:
      'https://trend-image.votebox.kr/uploads/2026/03/31/ead56ea9d0d94b7b92cd13063190fb2f.png',
  },
  {
    grade: 'REBEL',
    title: '소신 고양이',
    description: '남들과 다른 길을 가는 타입',
    imagePath:
      'https://trend-image.votebox.kr/uploads/2026/03/31/378c5b3b9e6a44d4964fe1c50431ad70.png',
  },
  {
    grade: 'UNICORN',
    title: '유니콘',
    description: '세상에 없는 독보적 가치관',
    imagePath:
      'https://trend-image.votebox.kr/uploads/2026/03/31/92d62e36e5cb4e1abde95ea7540e0604.png',
  },
];

export function getPopularityByScore(score: number): PopularityInfo {
  if (score >= 68) {
    return POPULARITY_GRADES[0];
  } // KING — 여론의 사자왕
  if (score >= 58) {
    return POPULARITY_GRADES[1];
  } // LEADER — 트렌드 여우
  if (score >= 48) {
    return POPULARITY_GRADES[2];
  } // BALANCER — 밸런스 판다
  if (score >= 38) {
    return POPULARITY_GRADES[3];
  } // REBEL — 소신 고양이
  return POPULARITY_GRADES[4]; // UNICORN — 유니콘
}

/**
 * 대중성 지수 계산 (가중 평균 방식)
 *
 * 각 질문에서 내가 고른 선택지의 투표 비율을 평균낸다.
 * 압도적 다수(예: 90%)를 고르면 높고, 아슬아슬한 다수(55%)를 고르면 낮게 반영된다.
 *
 * 예: [70, 45, 80, 40, 65] → 평균 60%
 */
export function calcPopularityScore(
  myAnswers: Array<{ electionId?: string; selectedElectionItemId?: string }>,
  questionStats: Array<{
    electionId?: string;
    optionStats?: Array<{ electionItemId?: string; voteCount?: number }>;
  }>
): number {
  if (!myAnswers || myAnswers.length === 0) {
    return 0;
  }

  let totalRate = 0;
  let matched = 0;

  for (const answer of myAnswers) {
    if (!answer.electionId || !answer.selectedElectionItemId) {
      continue;
    }
    const stat = questionStats.find((s) => s.electionId === answer.electionId);
    if (!stat?.optionStats || stat.optionStats.length === 0) {
      continue;
    }

    const totalVotes = stat.optionStats.reduce((sum, o) => sum + (o.voteCount ?? 0), 0);
    const selectedOption = stat.optionStats.find(
      (o) => o.electionItemId === answer.selectedElectionItemId
    );
    const selectedCount = selectedOption?.voteCount ?? 0;
    const rate = totalVotes > 0 ? Math.round((selectedCount / totalVotes) * 100) : 50;
    totalRate += rate;
    matched++;
  }

  if (matched === 0) {
    return 0;
  }

  return Math.round(totalRate / matched);
}

/**
 * 대중성 등급 경계 (가중 평균 기준)
 *
 * raw 점수가 40~70% 사이에 몰리므로 경계를 좁게 설정.
 * 실제 데이터가 쌓이면 등급별 분포를 보고 미세 조정.
 */
