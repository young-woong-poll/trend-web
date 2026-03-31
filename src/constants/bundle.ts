// src/constants/bundle.ts

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
    title: '소울메이트',
    description: '전생에 한 몸이었나? 생각이 이렇게 같을 수가',
    gradient: 'linear-gradient(135deg, #FFD700, #FFA500)',
    imagePath: null,
  },
  {
    grade: 'A',
    title: '찰떡궁합',
    description: '대부분 통하는데, 가끔 깜짝 놀랄 포인트가!',
    gradient: 'linear-gradient(135deg, #FF00FF, #8B5CF6)',
    imagePath: null,
  },
  {
    grade: 'B',
    title: '밀당 케미',
    description: '반은 같고 반은 다르고, 이게 진짜 케미 아닐까?',
    gradient: 'linear-gradient(135deg, #FF6B35, #FF00FF)',
    imagePath: null,
  },
  {
    grade: 'C',
    title: '반전 매력',
    description: '다른 점이 더 많아서 오히려 재밌는 사이',
    gradient: 'linear-gradient(135deg, #4FC3F7, #00BCD4)',
    imagePath: null,
  },
  {
    grade: 'D',
    title: '평행우주',
    description: '같은 세상 살고 있는 거 맞아? 그래도 그게 매력!',
    gradient: 'linear-gradient(135deg, #66BB6A, #00BCD4)',
    imagePath: null,
  },
];

export function getChemistryByRate(matchRate: number): ChemistryInfo {
  if (matchRate >= 90) {
    return CHEMISTRY_GRADES[0];
  } // S
  if (matchRate >= 70) {
    return CHEMISTRY_GRADES[1];
  } // A
  if (matchRate >= 50) {
    return CHEMISTRY_GRADES[2];
  } // B
  if (matchRate >= 30) {
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
  { grade: 'KING', title: '여론 장악자', description: '대중의 마음을 꿰뚫어 봄', imagePath: null },
  { grade: 'LEADER', title: '트렌드 리더', description: '시대를 읽는 눈이 있음', imagePath: null },
  {
    grade: 'BALANCER',
    title: '밸런서',
    description: '어느 쪽이든 이해하는 균형파',
    imagePath: null,
  },
  { grade: 'REBEL', title: '소신파', description: '남들과 다른 길을 가는 타입', imagePath: null },
  { grade: 'UNICORN', title: '유니콘', description: '세상에 없는 독보적 가치관', imagePath: null },
];

export function getPopularityByScore(score: number): PopularityInfo {
  if (score >= 90) {
    return POPULARITY_GRADES[0];
  } // KING
  if (score >= 70) {
    return POPULARITY_GRADES[1];
  } // LEADER
  if (score >= 50) {
    return POPULARITY_GRADES[2];
  } // BALANCER
  if (score >= 30) {
    return POPULARITY_GRADES[3];
  } // REBEL
  return POPULARITY_GRADES[4]; // UNICORN
}

/**
 * 대중성 지수 계산
 * questionStats + myAnswers → 다수파 일치 비율
 */
export function calcPopularityScore(
  myAnswers: Array<{ electionId: string; selected: 'A' | 'B' }>,
  questionStats: Array<{ electionId: string; optionARate: number; optionBRate: number }>
): number {
  if (myAnswers.length === 0) {
    return 0;
  }

  let majorityCount = 0;
  for (const answer of myAnswers) {
    const stat = questionStats.find((s) => s.electionId === answer.electionId);
    if (!stat) {
      continue;
    }

    const myRate = answer.selected === 'A' ? stat.optionARate : stat.optionBRate;
    if (myRate > 50) {
      majorityCount++;
    }
  }

  return Math.round((majorityCount / myAnswers.length) * 100);
}
