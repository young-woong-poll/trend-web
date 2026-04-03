// src/constants/group-compare.ts
import type {
  GroupCompareResult,
  PairChemistry,
  GroupAward,
  GroupAwardType,
  ValueMapCoordinate,
  ValueMapConfig,
} from '@/types/group-compare';

/** Rate 기반 questionStats에서 대중성 지수를 계산 (group-compare 전용) */
function calcPopularityScoreFromRate(
  myAnswers: Array<{ electionId: string; selected: 'A' | 'B' }>,
  questionStats: Array<{ electionId: string; optionARate: number; optionBRate: number }>
): number {
  if (myAnswers.length === 0) {
    return 0;
  }

  let totalRate = 0;
  let matched = 0;

  for (const answer of myAnswers) {
    const stat = questionStats.find((s) => s.electionId === answer.electionId);
    if (!stat) {
      continue;
    }
    totalRate += answer.selected === 'A' ? stat.optionARate : stat.optionBRate;
    matched++;
  }

  return matched === 0 ? 0 : Math.round(totalRate / matched);
}

/**
 * 모든 멤버 쌍의 케미(일치율) 계산
 * n명 → C(n,2) 쌍
 */
export function calcAllPairChemistry(result: GroupCompareResult): PairChemistry[] {
  const pairs: PairChemistry[] = [];
  const { members } = result;

  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const a = members[i];
      const b = members[j];

      let matchCount = 0;
      for (const ansA of a.answers) {
        const ansB = b.answers.find((ab) => ab.electionId === ansA.electionId);
        if (ansB && ansA.selected === ansB.selected) {
          matchCount++;
        }
      }

      const totalQ = Math.max(a.answers.length, 1);
      pairs.push({
        memberA: a.userId,
        memberB: b.userId,
        nicknameA: a.nickname,
        nicknameB: b.nickname,
        matchCount,
        matchRate: Math.round((matchCount / totalQ) * 100),
      });
    }
  }

  return pairs;
}

/**
 * 멤버별 평균 일치율 (그룹 내 다른 모든 멤버와의 평균)
 */
function calcMemberAvgMatchRate(userId: string, pairs: PairChemistry[]): number {
  const myPairs = pairs.filter((p) => p.memberA === userId || p.memberB === userId);
  if (myPairs.length === 0) {
    return 0;
  }
  const sum = myPairs.reduce((acc, p) => acc + p.matchRate, 0);
  return Math.round(sum / myPairs.length);
}

/**
 * 만장일치 질문 찾기 (모든 멤버가 같은 답 선택)
 */
export function findUnanimousQuestions(
  result: GroupCompareResult
): Array<{ electionId: string; title: string; unanimousAnswer: string }> {
  const { members, questionStats } = result;
  const unanimous: Array<{ electionId: string; title: string; unanimousAnswer: string }> = [];

  for (const stat of questionStats) {
    const answers = members.map(
      (m) => m.answers.find((a) => a.electionId === stat.electionId)?.selected
    );
    if (answers.length === 0 || answers.some((a) => a === undefined)) {
      continue;
    }

    const allSame = answers.every((a) => a === answers[0]);
    if (allSame) {
      unanimous.push({
        electionId: stat.electionId,
        title: stat.title,
        unanimousAnswer: answers[0] === 'A' ? stat.optionA : stat.optionB,
      });
    }
  }

  return unanimous;
}

/**
 * 논쟁 포인트 찾기 (의견이 가장 갈린 질문)
 * 기준: A/B 선택 비율이 50:50에 가장 가까운 질문
 */
export function findControversyPoints(result: GroupCompareResult): Array<{
  electionId: string;
  title: string;
  optionA: string;
  optionB: string;
  ratioA: number;
  ratioB: number;
}> {
  const { members, questionStats } = result;

  const scored = questionStats.map((stat) => {
    const answers = members
      .map((m) => m.answers.find((a) => a.electionId === stat.electionId)?.selected)
      .filter((a): a is 'A' | 'B' => a !== undefined);

    const countA = answers.filter((a) => a === 'A').length;
    const total = answers.length;
    const ratioA = total > 0 ? Math.round((countA / total) * 100) : 50;
    const ratioB = 100 - ratioA;
    const distanceFrom50 = Math.abs(ratioA - 50);

    return {
      electionId: stat.electionId,
      title: stat.title,
      optionA: stat.optionA,
      optionB: stat.optionB,
      ratioA,
      ratioB,
      distanceFrom50,
    };
  });

  // 50:50에 가까운 순 정렬, 상위 3개
  return scored
    .sort((a, b) => a.distanceFrom50 - b.distanceFrom50)
    .slice(0, 3)
    .map(({ distanceFrom50: _, ...rest }) => rest);
}

/**
 * 그룹 어워드 전체 계산
 */
const AWARD_META: Record<GroupAwardType, { title: string; description: string; oneLiner: string }> =
  {
    GROUP_LEADER: {
      title: '그룹 대장',
      description: '그룹 평균과 가장 비슷한 사람',
      oneLiner: '이 그룹의 가치관을 대표합니다',
    },
    GROUP_OUTSIDER: {
      title: '그룹 이단아',
      description: '그룹 평균에서 가장 먼 사람',
      oneLiner: '혼자만 다른 세계에 사는 중',
    },
    SOUL_CONNECTION: {
      title: '소울 커넥션',
      description: '그룹 내 최고 케미 조합',
      oneLiner: '통하는 게 느껴지나요?',
    },
    POLAR_OPPOSITES: {
      title: '극과 극',
      description: '그룹 내 최저 케미 조합',
      oneLiner: '토론하면 밤새겠다',
    },
    CONTROVERSY_MAKER: {
      title: '논쟁 메이커',
      description: '소수 의견을 가장 많이 고른 사람',
      oneLiner: '매번 반대편에 서는 당신, 혹시 일부러?',
    },
    PEOPLES_CHAMPION: {
      title: '대중의 왕',
      description: '대중성 지수가 가장 높은 사람',
      oneLiner: '세상이 어떻게 돌아가는지 정확히 아는 사람',
    },
  };

export function calcGroupAwards(result: GroupCompareResult, pairs: PairChemistry[]): GroupAward[] {
  const { members, questionStats } = result;
  const awards: GroupAward[] = [];

  if (members.length < 2) {
    return awards;
  }

  // 1. GROUP_LEADER: 평균 일치율이 가장 높은 멤버
  let maxAvg = -1;
  let leader = members[0];
  for (const m of members) {
    const avg = calcMemberAvgMatchRate(m.userId, pairs);
    if (avg > maxAvg) {
      maxAvg = avg;
      leader = m;
    }
  }
  awards.push({
    ...AWARD_META.GROUP_LEADER,
    type: 'GROUP_LEADER',
    winners: [leader.userId],
    winnerNicknames: [leader.nickname],
    value: maxAvg,
  });

  // 2. GROUP_OUTSIDER: 평균 일치율이 가장 낮은 멤버
  let minAvg = 101;
  let outsider = members[0];
  for (const m of members) {
    const avg = calcMemberAvgMatchRate(m.userId, pairs);
    if (avg < minAvg) {
      minAvg = avg;
      outsider = m;
    }
  }
  awards.push({
    ...AWARD_META.GROUP_OUTSIDER,
    type: 'GROUP_OUTSIDER',
    winners: [outsider.userId],
    winnerNicknames: [outsider.nickname],
    value: minAvg,
  });

  // 3. SOUL_CONNECTION: 최고 케미 쌍
  const bestPair = pairs.reduce((best, p) => (p.matchRate > best.matchRate ? p : best), pairs[0]);
  awards.push({
    ...AWARD_META.SOUL_CONNECTION,
    type: 'SOUL_CONNECTION',
    winners: [bestPair.memberA, bestPair.memberB],
    winnerNicknames: [bestPair.nicknameA, bestPair.nicknameB],
    value: bestPair.matchRate,
  });

  // 4. POLAR_OPPOSITES: 최저 케미 쌍
  const worstPair = pairs.reduce(
    (worst, p) => (p.matchRate < worst.matchRate ? p : worst),
    pairs[0]
  );
  awards.push({
    ...AWARD_META.POLAR_OPPOSITES,
    type: 'POLAR_OPPOSITES',
    winners: [worstPair.memberA, worstPair.memberB],
    winnerNicknames: [worstPair.nicknameA, worstPair.nicknameB],
    value: worstPair.matchRate,
  });

  // 5. CONTROVERSY_MAKER: 그룹 내에서 소수 의견을 가장 많이 고른 멤버
  let maxMinorityCount = -1;
  let controversyMaker = members[0];
  for (const m of members) {
    let minorityCount = 0;
    for (const stat of questionStats) {
      const myAnswer = m.answers.find((a) => a.electionId === stat.electionId)?.selected;
      if (!myAnswer) {
        continue;
      }

      // 그룹 내에서 소수파인지 판단
      const groupAnswers = members
        .map((gm) => gm.answers.find((a) => a.electionId === stat.electionId)?.selected)
        .filter((a): a is 'A' | 'B' => a !== undefined);
      const countA = groupAnswers.filter((a) => a === 'A').length;
      const isMinority =
        (myAnswer === 'A' && countA < groupAnswers.length / 2) ||
        (myAnswer === 'B' && countA > groupAnswers.length / 2);
      if (isMinority) {
        minorityCount++;
      }
    }
    if (minorityCount > maxMinorityCount) {
      maxMinorityCount = minorityCount;
      controversyMaker = m;
    }
  }
  awards.push({
    ...AWARD_META.CONTROVERSY_MAKER,
    type: 'CONTROVERSY_MAKER',
    winners: [controversyMaker.userId],
    winnerNicknames: [controversyMaker.nickname],
    value: maxMinorityCount,
  });

  // 6. PEOPLES_CHAMPION: 대중성 지수 최고
  let maxPopularity = -1;
  let champion = members[0];
  for (const m of members) {
    const score = calcPopularityScoreFromRate(m.answers, questionStats);
    if (score > maxPopularity) {
      maxPopularity = score;
      champion = m;
    }
  }
  awards.push({
    ...AWARD_META.PEOPLES_CHAMPION,
    type: 'PEOPLES_CHAMPION',
    winners: [champion.userId],
    winnerNicknames: [champion.nickname],
    value: maxPopularity,
  });

  return awards;
}

/**
 * 가치관 지도 좌표 계산
 *
 * X = (X축 질문 중 rightAnswer 수 / X축 질문 수) × 2 - 1
 * Y = (Y축 질문 중 upAnswer 수 / Y축 질문 수) × 2 - 1
 * 범위: -1 ~ +1
 *
 * axis 컨벤션:
 *   X축 질문: optionB → right(+1 방향), optionA → left(-1 방향)
 *   Y축 질문: optionB → up(+1 방향), optionA → down(-1 방향)
 */
export function calcValueMapCoordinates(result: GroupCompareResult): ValueMapCoordinate[] {
  const xQuestions = result.questionStats.filter((s) => s.axis === 'X');
  const yQuestions = result.questionStats.filter((s) => s.axis === 'Y');

  return result.members.map((member) => {
    let xRight = 0;
    for (const q of xQuestions) {
      const ans = member.answers.find((a) => a.electionId === q.electionId);
      if (ans?.selected === 'B') {
        xRight++;
      }
    }

    let yUp = 0;
    for (const q of yQuestions) {
      const ans = member.answers.find((a) => a.electionId === q.electionId);
      if (ans?.selected === 'B') {
        yUp++;
      }
    }

    const x = xQuestions.length > 0 ? (xRight / xQuestions.length) * 2 - 1 : 0;
    const y = yQuestions.length > 0 ? (yUp / yQuestions.length) * 2 - 1 : 0;

    return {
      userId: member.userId,
      nickname: member.nickname,
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
    };
  });
}

/**
 * 그룹 평균 좌표 계산
 */
export function calcGroupAverage(coords: ValueMapCoordinate[]): { x: number; y: number } {
  if (coords.length === 0) {
    return { x: 0, y: 0 };
  }
  const avgX = coords.reduce((sum, c) => sum + c.x, 0) / coords.length;
  const avgY = coords.reduce((sum, c) => sum + c.y, 0) / coords.length;
  return {
    x: Math.round(avgX * 100) / 100,
    y: Math.round(avgY * 100) / 100,
  };
}

/**
 * 번들별 가치관 지도 설정
 * Phase 2에서는 하드코딩, 추후 어드민 설정 연동
 */
export const VALUE_MAP_CONFIGS: Record<string, ValueMapConfig> = {
  'love-values': {
    xAxisLeft: '현실주의',
    xAxisRight: '이상주의',
    yAxisBottom: '개인 중심',
    yAxisTop: '관계 중심',
    quadrantLabels: {
      topLeft: '현실적 헌신파',
      topRight: '이상적 로맨티스트',
      bottomLeft: '현실적 독립파',
      bottomRight: '이상적 자유주의자',
    },
  },
  'marriage-values': {
    xAxisLeft: '현실주의',
    xAxisRight: '이상주의',
    yAxisBottom: '개인 중심',
    yAxisTop: '가정 중심',
    quadrantLabels: {
      topLeft: '현실적 가정인',
      topRight: '이상적 가정인',
      bottomLeft: '현실적 개인주의자',
      bottomRight: '이상적 개인주의자',
    },
  },
};

/**
 * 케미 등급별 네트워크 선 색상
 */
export const CHEMISTRY_NETWORK_COLORS: Record<string, string> = {
  S: '#FFD700',
  A: '#FF00FF',
  B: '#FF6B35',
  C: '#4FC3F7',
  D: '#66BB6A',
};
