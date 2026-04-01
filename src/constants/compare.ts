import type { CompareResult } from '@/types/compare';

/**
 * 번들 시작 화면 비교 기능 후킹 문구
 * slug별로 관리, 없으면 폴백 사용
 * 나중에 BE 응답(compareHook)으로 이관 가능
 */
interface CompareHookTexts {
  oneToOne: string;
  group: string;
}

const COMPARE_HOOKS: Record<string, CompareHookTexts> = {
  'love-values': {
    oneToOne: '두 사람의 연애 가치관, 진짜 같을까?',
    group: '우리 중 연애하면 찰떡인 조합은?',
  },
  'marriage-values': {
    oneToOne: '결혼하면 잘 살 수 있을까? 가치관부터 맞춰봐',
    group: '이 중에 절대 같이 살면 안 되는 조합은?',
  },
};

const DEFAULT_COMPARE_HOOK: CompareHookTexts = {
  oneToOne: '같은 생각일까? 확인해봐',
  group: '누구랑 제일 통하고, 누구랑 가장 다를까?',
};

export function getCompareHook(bundleSlug: string): CompareHookTexts {
  return COMPARE_HOOKS[bundleSlug] ?? DEFAULT_COMPARE_HOOK;
}

/**
 * 닉네임 컬러 아이덴티티
 * 페이지 전체에서 "나"와 "상대"를 시각적으로 구분
 */
export const IDENTITY_COLORS = {
  me: { main: '#a89eff', bg: 'rgba(108, 99, 255, 0.15)', border: 'rgba(108, 99, 255, 0.3)' },
  target: { main: '#ff9a6c', bg: 'rgba(255, 107, 53, 0.15)', border: 'rgba(255, 107, 53, 0.3)' },
} as const;

/**
 * 번들별 비교 결과 한줄평
 * matchRate → 등급 → 번들별 맞춤 문구
 */
interface CompareOneLiner {
  headline: string;
  body: string;
}

const BUNDLE_ONE_LINERS: Record<string, Record<string, CompareOneLiner>> = {
  'love-values': {
    S: { headline: '이상형이 서로인 거 아닌가요?', body: '연애 가치관이 거의 완벽히 일치해요' },
    A: { headline: '같이 있으면 편한 사이', body: '대부분 통하는데 가끔 새로운 면이 보여요' },
    B: { headline: '밀당이 재밌는 관계', body: '반은 같고 반은 달라서 지루할 틈이 없어요' },
    C: { headline: '서로에게 배울 게 많은 사이', body: '다른 시각이 오히려 자극이 돼요' },
    D: { headline: '밀당의 신이 탄생했습니다', body: '완전 다른 연애관, 그래서 더 흥미로워요' },
  },
  'marriage-values': {
    S: { headline: '이 정도면 혼인신고 바로 가능', body: '결혼 가치관이 놀라울 정도로 같아요' },
    A: { headline: '큰 그림은 같은 부부', body: '핵심은 통하고 디테일에서 조율이 필요해요' },
    B: { headline: '대화가 필요한 커플', body: '맞는 부분도 있지만 꼭 얘기해야 할 것들이 있어요' },
    C: { headline: '진지한 대화가 필요할지도', body: '생각보다 다른 부분이 많아서 놀랄 수 있어요' },
    D: {
      headline: '결혼 전 진지한 대화가 필요할지도...',
      body: '거의 모든 항목에서 의견이 달라요',
    },
  },
};

const DEFAULT_ONE_LINERS: Record<string, CompareOneLiner> = {
  S: { headline: '소울메이트 확정!', body: '생각이 이렇게 같을 수가' },
  A: { headline: '꽤 잘 통하는 사이', body: '대부분의 가치관이 비슷해요' },
  B: { headline: '반반의 매력', body: '같은 점과 다른 점이 적절히 섞여 있어요' },
  C: { headline: '다름이 매력인 관계', body: '서로 다른 시각이 새로운 발견이 돼요' },
  D: { headline: '평행우주에서 온 두 사람', body: '완전히 다르지만 그게 매력이에요' },
};

export function getCompareOneLiner(bundleSlug: string, matchRate: number): CompareOneLiner {
  const grade =
    matchRate >= 90
      ? 'S'
      : matchRate >= 70
        ? 'A'
        : matchRate >= 50
          ? 'B'
          : matchRate >= 30
            ? 'C'
            : 'D';
  return BUNDLE_ONE_LINERS[bundleSlug]?.[grade] ?? DEFAULT_ONE_LINERS[grade];
}

/**
 * 커플 타입 시스템 (2×2 매트릭스)
 * 축1: 일치율 (비슷한 생각 vs 다른 생각)
 * 축2: 대중성 평균 (둘 다 대중적 vs 둘 다 독특)
 */
export type CoupleTypeKey = 'TREND_TWINS' | 'OUR_WORLD' | 'HEALTHY_TENSION' | 'PARALLEL_EXPLORERS';

export interface CoupleType {
  key: CoupleTypeKey;
  title: string;
  description: string;
  subtitle: string; // 하단 요약 (예: "일치율 60% · 둘 다 다수파")
}

const COUPLE_TYPES: Record<CoupleTypeKey, Omit<CoupleType, 'subtitle'>> = {
  TREND_TWINS: {
    key: 'TREND_TWINS',
    title: '트렌드 쌍둥이',
    description: '대세를 읽는 눈도, 생각도 같은 커플',
  },
  OUR_WORLD: {
    key: 'OUR_WORLD',
    title: '우리만의 세계',
    description: '둘만 통하는 코드가 있는 커플. 남들은 이해 못해도 우린 안다',
  },
  HEALTHY_TENSION: {
    key: 'HEALTHY_TENSION',
    title: '건강한 긴장감',
    description: '서로 다른 시각이 대화를 만드는 커플',
  },
  PARALLEL_EXPLORERS: {
    key: 'PARALLEL_EXPLORERS',
    title: '평행우주 탐험가',
    description: '각자의 길을 가는 두 사람, 그래서 재밌다',
  },
};

export function getCoupleType(
  matchRate: number,
  myPopularityScore: number,
  targetPopularityScore: number
): CoupleType {
  const isSimilar = matchRate >= 50;
  const avgPopularity = (myPopularityScore + targetPopularityScore) / 2;
  const isMainstream = avgPopularity >= 55;

  let key: CoupleTypeKey;
  let popularityLabel: string;

  if (isSimilar && isMainstream) {
    key = 'TREND_TWINS';
    popularityLabel = '둘 다 다수파';
  } else if (isSimilar && !isMainstream) {
    key = 'OUR_WORLD';
    popularityLabel = '둘 다 소수파';
  } else if (!isSimilar && isMainstream) {
    key = 'HEALTHY_TENSION';
    popularityLabel = '다른 생각, 대중적 감각';
  } else {
    key = 'PARALLEL_EXPLORERS';
    popularityLabel = '각자의 소신';
  }

  const type = COUPLE_TYPES[key];
  return {
    ...type,
    subtitle: popularityLabel,
  };
}

/**
 * 충격 포인트 — 가장 극단적으로 갈린 질문 선별
 *
 * 조건: 둘이 다른 답을 골랐고, 대중 투표에서 비율 차이가 가장 큰 질문
 * "상대방이 다수파인데 나는 소수파" 일수록 더 충격적
 */
export interface ShockPointData {
  electionId: string;
  title: string;
  optionA: string;
  optionB: string;
  mySelected: 'A' | 'B';
  targetSelected: 'A' | 'B';
  myRate: number;
  targetRate: number;
  comment: string;
}

export function findShockPoint(result: CompareResult): ShockPointData | null {
  const differentAnswers = result.questionStats.filter((stat) => {
    const myAnswer = result.me.answers.find((a) => a.electionId === stat.electionId);
    const targetAnswer = result.target.answers.find((a) => a.electionId === stat.electionId);
    return myAnswer && targetAnswer && myAnswer.selected !== targetAnswer.selected;
  });

  if (differentAnswers.length === 0) {
    return null;
  }

  // 비율 차이가 가장 큰 질문
  let maxDiff = -1;
  let shockStat = differentAnswers[0];

  for (const stat of differentAnswers) {
    const diff = Math.abs(stat.optionARate - stat.optionBRate);
    if (diff > maxDiff) {
      maxDiff = diff;
      shockStat = stat;
    }
  }

  const myAnswer = result.me.answers.find((a) => a.electionId === shockStat.electionId)!;
  const targetAnswer = result.target.answers.find((a) => a.electionId === shockStat.electionId)!;
  const myRate = myAnswer.selected === 'A' ? shockStat.optionARate : shockStat.optionBRate;
  const targetRate = targetAnswer.selected === 'A' ? shockStat.optionARate : shockStat.optionBRate;

  // 코멘트 생성: 소수파인 쪽에 재미 코멘트
  const meMinority = myRate < targetRate;
  const minorityName = meMinority ? '나' : result.target.nickname;
  const comment = `${minorityName}${meMinority ? '는' : '님은'} 좀 양보하셔야...`;

  return {
    electionId: shockStat.electionId,
    title: shockStat.title,
    optionA: shockStat.optionA,
    optionB: shockStat.optionB,
    mySelected: myAnswer.selected,
    targetSelected: targetAnswer.selected,
    myRate,
    targetRate,
    comment,
  };
}

/**
 * "같은 편인 순간" / "갈린 순간" 분류
 */
export interface AnswerStoryData {
  same: Array<{
    electionId: string;
    title: string;
    selected: string;
    /** 두 사람이 고른 선택지의 대중 득표율 */
    selectedRate: number;
  }>;
  different: Array<{
    electionId: string;
    title: string;
    mySelected: string;
    targetSelected: string;
    myOptionText: string;
    targetOptionText: string;
    /** 내 선택지의 대중 득표율 */
    myRate: number;
    /** 상대 선택지의 대중 득표율 */
    targetRate: number;
  }>;
}

export function classifyAnswers(result: CompareResult): AnswerStoryData {
  const same: AnswerStoryData['same'] = [];
  const different: AnswerStoryData['different'] = [];

  for (const stat of result.questionStats) {
    const myAnswer = result.me.answers.find((a) => a.electionId === stat.electionId);
    const targetAnswer = result.target.answers.find((a) => a.electionId === stat.electionId);
    if (!myAnswer || !targetAnswer) {
      continue;
    }

    const myRate = myAnswer.selected === 'A' ? stat.optionARate : stat.optionBRate;
    const targetRate = targetAnswer.selected === 'A' ? stat.optionARate : stat.optionBRate;

    if (myAnswer.selected === targetAnswer.selected) {
      same.push({
        electionId: stat.electionId,
        title: stat.title,
        selected: myAnswer.selected === 'A' ? stat.optionA : stat.optionB,
        selectedRate: myRate,
      });
    } else {
      different.push({
        electionId: stat.electionId,
        title: stat.title,
        mySelected: myAnswer.selected,
        targetSelected: targetAnswer.selected,
        myOptionText: myAnswer.selected === 'A' ? stat.optionA : stat.optionB,
        targetOptionText: targetAnswer.selected === 'A' ? stat.optionA : stat.optionB,
        myRate,
        targetRate,
      });
    }
  }

  return { same, different };
}
