# 번들 그룹 비교 시스템 구현 계획 (Plan 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 번들 그룹 비교(3인+) 시스템 — 그룹 링크 생성/참여/마감 → 그룹 비교 결과(케미 네트워크, 그룹 통계, 가치관 지도, 어워드) → 멤버 간 1:1 비교까지의 Phase 2 전체 플로우를 MSW 기반으로 구현

**Architecture:** 기존 1:1 비교 시스템(Plan 2) 위에 그룹 전용 타입/상수/MSW/훅/페이지를 확장. `CompareLink.type === 'GROUP'`일 때 분기. 서버는 멤버 답변 배열 + 질문별 투표 비율 + groupSyncRate만 리턴하고, 케미 네트워크/어워드/가치관 지도 좌표 계산은 모두 FE 상수로 관리.

**Plan 분할:** Plan 1(완료) 번들 코어 플로우, Plan 2(완료) 1:1 비교 시스템. 이 Plan 3에서 그룹 비교 시스템 구현.

**Tech Stack:** Next.js 14 (App Router), TypeScript, SCSS Modules, React Query v5, MSW, framer-motion

**참조 문서:**

- 기획서: `docs/specs/bundle-compare.md` (섹션 4.3, 5.2, 7, 8, 10, 11-Phase2)
- 기존 코드: `src/types/compare.ts`, `src/constants/compare.ts`, `src/hooks/api/useCompare.ts`
- 기존 MSW: `src/mocks/data/compare.ts`, `src/mocks/handlers.ts`

---

## 파일 구조

### 신규 생성

```
src/types/group-compare.ts                                             — 그룹 비교 전용 타입
src/constants/group-compare.ts                                         — 그룹 어워드/가치관 지도/케미 네트워크 FE 매핑
src/mocks/data/group-compare.ts                                        — 그룹 비교 MSW 목 데이터
src/app/compare/[token]/group/page.tsx                                 — 그룹 비교 결과 페이지 라우트
src/components/features/Compare/GroupResult/GroupResult.tsx             — 그룹 결과 메인 컴포넌트
src/components/features/Compare/GroupResult/GroupResult.module.scss
src/components/features/Compare/GroupResult/ChemistryNetwork.tsx        — 케미 네트워크 관계도 그래프
src/components/features/Compare/GroupResult/ChemistryNetwork.module.scss
src/components/features/Compare/GroupResult/GroupStats.tsx              — 그룹 통계 (싱크율, 만장일치, 논쟁)
src/components/features/Compare/GroupResult/GroupStats.module.scss
src/components/features/Compare/GroupResult/ValueMap.tsx                — 가치관 지도 (4분면)
src/components/features/Compare/GroupResult/ValueMap.module.scss
src/components/features/Compare/GroupResult/GroupAwards.tsx             — 그룹 어워드 자동 칭호
src/components/features/Compare/GroupResult/GroupAwards.module.scss
src/components/features/Compare/GroupResult/MemberList.tsx              — 멤버 1:1 비교 리스트
src/components/features/Compare/GroupResult/MemberList.module.scss
src/components/features/Bundle/BundleResult/CreateGroupLink.tsx         — 그룹 링크 생성 모달
src/components/features/Bundle/BundleResult/CreateGroupLink.module.scss
src/components/common/FloatingCta/FloatingCta.tsx                       — 하단 플로팅 CTA 공통 컴포넌트
src/components/common/FloatingCta/FloatingCta.module.scss
```

### 수정

```
src/types/compare.ts                       — CompareLink에 그룹 전용 필드 추가 (groupName, memberCount, isClosed)
src/hooks/api/useCompare.ts                — 그룹 결과 훅 + 마감/재오픈 뮤테이션 추가
src/mocks/handlers.ts                      — 그룹 비교 API 핸들러 추가
src/mocks/data/compare.ts                  — 그룹 시드 데이터 추가
src/mocks/data/bundles.ts                  — 그룹용 다수 유저 답변 시드 추가
src/components/features/Bundle/BundleResult/BundleResult.tsx       — 그룹 비교 CTA 추가
src/components/features/Compare/CompareLanding/CompareLanding.tsx  — 그룹 타입 분기 처리
src/components/features/Compare/CompareResult/CompareResult.tsx    — 플로팅 CTA 추가
```

---

## Task 1: 그룹 비교 타입 정의

**Files:**

- Create: `src/types/group-compare.ts`
- Modify: `src/types/compare.ts`

- [ ] **Step 1: CompareLink 타입에 그룹 전용 필드 추가**

`src/types/compare.ts`의 `CompareLink` 인터페이스에 다음 필드를 추가 (기존 `participantCount` 뒤):

```typescript
/** 그룹 이름 (GROUP 타입 전용) */
groupName: string | null;
/** 현재 참여 멤버 수 (GROUP 타입 전용) */
memberCount: number;
/** 그룹 마감 여부 */
isClosed: boolean;
```

- [ ] **Step 2: 그룹 비교 타입 파일 생성**

```typescript
// src/types/group-compare.ts

/**
 * 그룹 비교 결과 (서버 응답)
 * 서버는 숫자만 리턴. 어워드/네트워크/가치관 지도는 FE에서 계산.
 */
export interface GroupCompareResult {
  bundleSlug: string;
  bundleTitle: string;
  totalQuestions: number;
  groupName: string;
  memberCount: number;

  /** 그룹 멤버 답변 */
  members: Array<{
    userId: string;
    nickname: string;
    answers: Array<{ electionId: string; selected: 'A' | 'B' }>;
  }>;

  /** 각 질문별 현재 투표 비율 (번들 전체 참여자 기준) */
  questionStats: Array<{
    electionId: string;
    title: string;
    optionA: string;
    optionB: string;
    optionARate: number;
    optionBRate: number;
    totalVotes: number;
    /** 가치관 지도 축 배정 (null = 미배정) */
    axis: 'X' | 'Y' | null;
  }>;

  /** 그룹 싱크율 (모든 멤버 쌍 일치율 평균) */
  groupSyncRate: number;
}

/**
 * 멤버 간 1:1 케미 정보 (FE 계산)
 */
export interface PairChemistry {
  memberA: string;
  memberB: string;
  nicknameA: string;
  nicknameB: string;
  matchCount: number;
  matchRate: number;
}

/**
 * 그룹 어워드 종류
 */
export type GroupAwardType =
  | 'GROUP_LEADER'
  | 'GROUP_OUTSIDER'
  | 'SOUL_CONNECTION'
  | 'POLAR_OPPOSITES'
  | 'CONTROVERSY_MAKER'
  | 'PEOPLES_CHAMPION';

/**
 * 그룹 어워드 결과 (FE 계산)
 */
export interface GroupAward {
  type: GroupAwardType;
  title: string;
  description: string;
  oneLiner: string;
  /** 수상자 (개인 또는 쌍) */
  winners: string[];
  winnerNicknames: string[];
  /** 수치 (일치율, 점수 등) */
  value: number;
}

/**
 * 가치관 지도 좌표 (FE 계산)
 */
export interface ValueMapCoordinate {
  userId: string;
  nickname: string;
  x: number; // -1 ~ +1
  y: number; // -1 ~ +1
}

/**
 * 가치관 지도 설정 (어드민 → 서버 → FE)
 * Phase 2에서는 MSW 하드코딩, 추후 어드민 UI 연동
 */
export interface ValueMapConfig {
  xAxisLeft: string;
  xAxisRight: string;
  yAxisBottom: string;
  yAxisTop: string;
  quadrantLabels: {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
  };
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/types/group-compare.ts src/types/compare.ts
git commit -m "feat(group-compare): 그룹 비교 전용 타입 정의"
```

---

## Task 2: 그룹 어워드/가치관 지도/케미 네트워크 FE 계산 유틸

**Files:**

- Create: `src/constants/group-compare.ts`

- [ ] **Step 1: 그룹 비교 상수 및 계산 유틸 파일 생성**

```typescript
// src/constants/group-compare.ts
import type {
  GroupCompareResult,
  PairChemistry,
  GroupAward,
  GroupAwardType,
  ValueMapCoordinate,
  ValueMapConfig,
} from '@/types/group-compare';
import { calcPopularityScore } from '@/constants/bundle';

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
        if (ansB && ansA.selected === ansB.selected) matchCount++;
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
  if (myPairs.length === 0) return 0;
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
    if (answers.length === 0 || answers.some((a) => a === undefined)) continue;

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

  if (members.length < 2) return awards;

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
      if (!myAnswer) continue;

      // 그룹 내에서 소수파인지 판단
      const groupAnswers = members
        .map((gm) => gm.answers.find((a) => a.electionId === stat.electionId)?.selected)
        .filter((a): a is 'A' | 'B' => a !== undefined);
      const countA = groupAnswers.filter((a) => a === 'A').length;
      const isMinority =
        (myAnswer === 'A' && countA < groupAnswers.length / 2) ||
        (myAnswer === 'B' && countA > groupAnswers.length / 2);
      if (isMinority) minorityCount++;
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
    const score = calcPopularityScore(m.answers, questionStats);
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
      if (ans?.selected === 'B') xRight++;
    }

    let yUp = 0;
    for (const q of yQuestions) {
      const ans = member.answers.find((a) => a.electionId === q.electionId);
      if (ans?.selected === 'B') yUp++;
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
  if (coords.length === 0) return { x: 0, y: 0 };
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
```

- [ ] **Step 2: 커밋**

```bash
git add src/constants/group-compare.ts
git commit -m "feat(group-compare): 그룹 어워드/가치관 지도/케미 네트워크 FE 계산 유틸"
```

---

## Task 3: MSW 그룹 비교 목 데이터

**Files:**

- Create: `src/mocks/data/group-compare.ts`
- Modify: `src/mocks/data/bundles.ts`
- Modify: `src/mocks/data/compare.ts`

- [ ] **Step 1: bundles.ts에 그룹용 다수 유저 답변 시드 추가**

`src/mocks/data/bundles.ts` 파일에서 기존 `seedSecondUser()` 함수 뒤에 추가:

```typescript
/**
 * 그룹 비교용 다수 유저 답변 시드
 * mock-user-3 ~ mock-user-6 으로 love-values 미리 답변
 */
export function seedGroupUsers() {
  const slug = 'love-values';
  const groupAnswers: Record<string, Array<{ electionId: string; selected: 'A' | 'B' }>> = {
    'mock-user-3': [
      { electionId: 'le-1', selected: 'A' },
      { electionId: 'le-2', selected: 'B' },
      { electionId: 'le-3', selected: 'A' },
      { electionId: 'le-4', selected: 'A' },
      { electionId: 'le-5', selected: 'B' },
    ],
    'mock-user-4': [
      { electionId: 'le-1', selected: 'B' },
      { electionId: 'le-2', selected: 'B' },
      { electionId: 'le-3', selected: 'B' },
      { electionId: 'le-4', selected: 'A' },
      { electionId: 'le-5', selected: 'A' },
    ],
    'mock-user-5': [
      { electionId: 'le-1', selected: 'A' },
      { electionId: 'le-2', selected: 'A' },
      { electionId: 'le-3', selected: 'B' },
      { electionId: 'le-4', selected: 'B' },
      { electionId: 'le-5', selected: 'B' },
    ],
    'mock-user-6': [
      { electionId: 'le-1', selected: 'B' },
      { electionId: 'le-2', selected: 'A' },
      { electionId: 'le-3', selected: 'A' },
      { electionId: 'le-4', selected: 'A' },
      { electionId: 'le-5', selected: 'A' },
    ],
  };

  for (const [userId, answers] of Object.entries(groupAnswers)) {
    if (bundleAnswerStore.has(`${userId}_${slug}`)) continue;
    recordBundleAnswers(userId, slug, answers);
  }
}
```

- [ ] **Step 2: compare.ts의 StoredCompareLink에 그룹 필드 추가**

`src/mocks/data/compare.ts` 의 `StoredCompareLink` 인터페이스에 추가:

```typescript
groupName: string | null;
/** 그룹 참여 멤버 목록 */
groupMembers: Array<{ userId: string; nickname: string }>;
isClosed: boolean;
```

기존 `seedLink` 및 `createCompareLink`, `getCompareLink`, `joinCompareLink` 함수들에도 새 필드 반영 필요. `seedLink`에 `groupName: null`, `groupMembers: []`, `isClosed: false` 추가.

- [ ] **Step 3: group-compare.ts 목 데이터 생성**

```typescript
// src/mocks/data/group-compare.ts
import type { GroupCompareResult } from '@/types/group-compare';
import {
  bundleAnswerStore,
  bundleVoteStats,
  mockBundleElections,
  mockBundleDetails,
  seedGroupUsers,
} from './bundles';

// 그룹 유저 시드
seedGroupUsers();

/** 그룹 참여 멤버 닉네임 맵 */
const MOCK_NICKNAMES: Record<string, string> = {
  'mock-user-1': '웅이',
  'mock-user-2': '수진',
  'mock-user-3': '민수',
  'mock-user-4': '지은',
  'mock-user-5': '현우',
  'mock-user-6': '서영',
};

/**
 * 그룹 비교 결과 생성
 */
export function getGroupCompareResult(
  bundleSlug: string,
  groupName: string,
  memberInfos: Array<{ userId: string; nickname: string }>,
  currentUserId: string
): GroupCompareResult | null {
  const elections = mockBundleElections[bundleSlug];
  const detail = mockBundleDetails[bundleSlug];
  if (!elections || !detail) return null;

  const members = memberInfos
    .map((info) => {
      const answers = bundleAnswerStore.get(`${info.userId}_${bundleSlug}`);
      if (!answers) return null;
      return {
        userId: info.userId,
        nickname: info.nickname,
        answers: answers.map((a) => ({ electionId: a.electionId, selected: a.selected })),
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  if (members.length < 2) return null;

  // 그룹 싱크율 계산
  let totalMatchRate = 0;
  let pairCount = 0;
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      let matchCount = 0;
      for (const ansA of members[i].answers) {
        const ansB = members[j].answers.find((b) => b.electionId === ansA.electionId);
        if (ansB && ansA.selected === ansB.selected) matchCount++;
      }
      totalMatchRate += (matchCount / elections.length) * 100;
      pairCount++;
    }
  }
  const groupSyncRate = pairCount > 0 ? Math.round(totalMatchRate / pairCount) : 0;

  const seedRatios = [62, 45, 71, 38, 55];

  // love-values 축 배정: le-1,le-3,le-5 → X축, le-2,le-4 → Y축
  const axisMap: Record<string, 'X' | 'Y' | null> = {
    'le-1': 'X',
    'le-2': 'Y',
    'le-3': 'X',
    'le-4': 'Y',
    'le-5': 'X',
  };

  return {
    bundleSlug,
    bundleTitle: detail.title,
    totalQuestions: elections.length,
    groupName,
    memberCount: members.length,
    members,
    questionStats: elections.map((e, i) => {
      const stats = bundleVoteStats.get(e.electionId) ?? { optionACount: 0, optionBCount: 0 };
      const total = stats.optionACount + stats.optionBCount;
      const baseA = total > 0 ? stats.optionACount : (seedRatios[i] ?? 50);
      const baseB = total > 0 ? stats.optionBCount : 100 - baseA;
      const sumAB = baseA + baseB;
      return {
        electionId: e.electionId,
        title: e.title,
        optionA: e.optionA,
        optionB: e.optionB,
        optionARate: Math.round((baseA / sumAB) * 100),
        optionBRate: Math.round((baseB / sumAB) * 100),
        totalVotes: total > 0 ? total : 80 + i * 15,
        axis: axisMap[e.electionId] ?? null,
      };
    }),
    groupSyncRate,
  };
}
```

- [ ] **Step 4: compare.ts에 그룹 시드 링크 추가**

`src/mocks/data/compare.ts`에서 기존 시드 링크 셋업 블록 뒤에 그룹 시드 추가:

```typescript
// 그룹 시드: mock-user-1이 love-values에 대한 그룹 비교 링크 생성
const groupSeedLink: StoredCompareLink = {
  token: 'group-abc',
  type: 'GROUP',
  bundleSlug: 'love-values',
  creatorUserId: 'mock-user-1',
  creatorNickname: '웅이',
  participantUserId: null,
  participantNickname: null,
  status: 'COMPLETED',
  groupName: '마케팅팀',
  groupMembers: [
    { userId: 'mock-user-1', nickname: '웅이' },
    { userId: 'mock-user-2', nickname: '수진' },
    { userId: 'mock-user-3', nickname: '민수' },
    { userId: 'mock-user-4', nickname: '지은' },
    { userId: 'mock-user-5', nickname: '현우' },
  ],
  isClosed: false,
};
compareLinkStore.set('group-abc', groupSeedLink);
```

`getCompareLink` 함수에서 리턴 객체에 그룹 필드 추가:

```typescript
    groupName: link.groupName,
    memberCount: link.groupMembers.length,
    isClosed: link.isClosed,
```

`joinCompareLink` 함수에서 그룹 타입 분기 추가:

```typescript
// 그룹 링크인 경우 여러 명 참여 가능 (최대 50명)
if (link.type === 'GROUP') {
  if (link.isClosed) return { success: false, message: '마감된 그룹입니다' };
  if (link.groupMembers.length >= 50)
    return { success: false, message: '그룹 인원이 가득 찼습니다' };
  if (link.groupMembers.some((m) => m.userId === userId)) {
    return { success: true, message: '이미 참여한 그룹입니다' };
  }
  if (!bundleAnswerStore.has(`${userId}_${link.bundleSlug}`)) {
    return { success: false, message: '번들을 먼저 완료해주세요' };
  }
  link.groupMembers.push({ userId, nickname });
  link.status = 'COMPLETED';
  return { success: true, message: '그룹 참여 완료' };
}
```

- [ ] **Step 5: 커밋**

```bash
git add src/mocks/data/group-compare.ts src/mocks/data/bundles.ts src/mocks/data/compare.ts
git commit -m "feat(group-compare): MSW 그룹 비교 목 데이터 및 시드"
```

---

## Task 4: MSW 그룹 비교 API 핸들러

**Files:**

- Modify: `src/mocks/handlers.ts`

- [ ] **Step 1: handlers.ts 상단에 import 추가**

기존 compare import 블록 뒤에 추가:

```typescript
import { getGroupCompareResult } from '@/mocks/data/group-compare';
```

- [ ] **Step 2: 핸들러 배열에 그룹 전용 API 핸들러 추가**

비교 API 핸들러 블록 뒤에 추가:

```typescript
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
    if (link.groupMembers.length < 2) {
      return HttpResponse.json(
        { code: 'BAD_REQUEST', message: '참여 인원이 부족합니다', data: null },
        { status: 400 }
      );
    }
    const result = getGroupCompareResult(
      link.bundleSlug,
      link.groupName ?? '그룹',
      link.groupMembers,
      'mock-user-1'
    );
    if (!result) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '그룹 비교 결과를 찾을 수 없습니다', data: null },
        { status: 404 }
      );
    }
    return HttpResponse.json({ code: 'SUCCESS', message: '성공', data: result });
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
    return HttpResponse.json({ code: 'SUCCESS', message: '그룹이 마감되었습니다', data: { closed: true } });
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
    return HttpResponse.json({ code: 'SUCCESS', message: '그룹이 재오픈되었습니다', data: { closed: false } });
  }),
```

핸들러에서 `compareLinkStore`에 접근하려면 `compare.ts`에서 export 필요. `src/mocks/data/compare.ts`에서 `compareLinkStore`를 export:

```typescript
export const compareLinkStore = new Map<string, StoredCompareLink>();
```

그리고 handlers.ts에서 import:

```typescript
import {
  createCompareLink,
  getCompareLink,
  joinCompareLink,
  getCompareResult,
  compareLinkStore,
} from '@/mocks/data/compare';
```

- [ ] **Step 3: 커밋**

```bash
git add src/mocks/handlers.ts src/mocks/data/compare.ts
git commit -m "feat(group-compare): MSW 그룹 비교 API 핸들러"
```

---

## Task 5: 그룹 비교 React Query 훅

**Files:**

- Modify: `src/hooks/api/useCompare.ts`

- [ ] **Step 1: 그룹 비교 타입 import 추가**

`src/hooks/api/useCompare.ts` 상단에 import 추가:

```typescript
import type { GroupCompareResult } from '@/types/group-compare';
```

- [ ] **Step 2: compareKeys에 그룹 키 추가**

```typescript
export const compareKeys = {
  all: ['compare'] as const,
  link: (token: string) => [...compareKeys.all, 'link', token] as const,
  result: (token: string) => [...compareKeys.all, 'result', token] as const,
  groupResult: (token: string) => [...compareKeys.all, 'group-result', token] as const,
};
```

- [ ] **Step 3: compareQueries에 그룹 결과 쿼리 추가**

```typescript
  groupResult: (token: string) =>
    queryOptions<GroupCompareResult | null>({
      queryKey: compareKeys.groupResult(token),
      queryFn: () =>
        customInstance<GroupCompareResult>({
          url: `/api/v1/compare-links/${token}/group-result`,
          method: 'GET',
        }),
      staleTime: 0,
    }),
```

- [ ] **Step 4: 그룹 훅 추가**

기존 `useJoinCompareLink` 뒤에 추가:

```typescript
export const useGroupCompareResult = (token: string) =>
  useQuery({
    ...compareQueries.groupResult(token),
    enabled: !!token,
  });

export const useCloseGroup = (token: string) =>
  useMutation({
    mutationFn: () =>
      customInstance({
        url: `/api/v1/compare-links/${token}/close`,
        method: 'PATCH',
      }),
  });

export const useReopenGroup = (token: string) =>
  useMutation({
    mutationFn: () =>
      customInstance({
        url: `/api/v1/compare-links/${token}/reopen`,
        method: 'PATCH',
      }),
  });
```

- [ ] **Step 5: 커밋**

```bash
git add src/hooks/api/useCompare.ts
git commit -m "feat(group-compare): 그룹 비교 React Query 훅"
```

---

## Task 6: 하단 플로팅 CTA 공통 컴포넌트

**Files:**

- Create: `src/components/common/FloatingCta/FloatingCta.tsx`
- Create: `src/components/common/FloatingCta/FloatingCta.module.scss`

- [ ] **Step 1: FloatingCta SCSS 생성**

```scss
// src/components/common/FloatingCta/FloatingCta.module.scss
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;

.container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: $z-index-sticky;
  padding: $spacing-12 $spacing-16;
  padding-bottom: calc($spacing-12 + env(safe-area-inset-bottom, 0px));
  background: linear-gradient(to top, rgba($bg-primary, 0.95) 70%, transparent);
  backdrop-filter: blur(12px);
}

.button {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: $border-radius-lg;
  background: $primary-gradient;
  color: $white;
  font-size: $font-size-16;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    opacity 0.2s;

  &:hover {
    transform: scale(1.01);
  }

  &:active {
    transform: scale(0.99);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
```

- [ ] **Step 2: FloatingCta 컴포넌트 생성**

```tsx
// src/components/common/FloatingCta/FloatingCta.tsx
import type { FC, ReactNode } from 'react';

import styles from './FloatingCta.module.scss';

interface FloatingCtaProps {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export const FloatingCta: FC<FloatingCtaProps> = ({ children, onClick, disabled }) => {
  return (
    <div className={styles.container}>
      <button type="button" className={styles.button} onClick={onClick} disabled={disabled}>
        {children}
      </button>
    </div>
  );
};
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/common/FloatingCta/
git commit -m "feat(common): 하단 플로팅 CTA 공통 컴포넌트"
```

---

## Task 7: 결과 페이지에 그룹 비교 CTA 추가

**Files:**

- Create: `src/components/features/Bundle/BundleResult/CreateGroupLink.tsx`
- Create: `src/components/features/Bundle/BundleResult/CreateGroupLink.module.scss`
- Modify: `src/components/features/Bundle/BundleResult/BundleResult.tsx`

- [ ] **Step 1: CreateGroupLink SCSS 생성**

```scss
// src/components/features/Bundle/BundleResult/CreateGroupLink.module.scss
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: $z-index-modal-backdrop;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-16;
}

.modal {
  @include flex-column;
  gap: 20px;
  width: 100%;
  max-width: 360px;
  padding: $spacing-24;
  background: $bg-secondary;
  border: 1px solid #333;
  border-radius: $border-radius-lg;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.title {
  font-size: $font-size-18;
  font-weight: 700;
  color: $white;
  text-align: center;
}

.description {
  font-size: $font-size-14;
  color: $text-secondary;
  text-align: center;
  line-height: 1.5;
}

.inputLabel {
  font-size: $font-size-12;
  color: $text-tertiary;
  margin-bottom: 4px;
}

.groupNameInput {
  width: 100%;
  padding: 12px;
  background: $bg-tertiary;
  border: 1px solid #3a3a3a;
  border-radius: $border-radius-md;
  color: $white;
  font-size: $font-size-14;

  &::placeholder {
    color: $text-tertiary;
  }

  &:focus {
    outline: none;
    border-color: $text-tertiary;
  }
}

.linkBox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: $bg-tertiary;
  border: 1px solid #3a3a3a;
  border-radius: $border-radius-md;
}

.linkText {
  flex: 1;
  font-size: 13px;
  color: $text-secondary;
  @include text-ellipsis;
}

.copyButton {
  flex-shrink: 0;
  padding: 8px 12px;
  border: 1px solid $border-placeholder;
  border-radius: $border-radius-md;
  background: $bg-tertiary;
  color: $white;
  font-size: $font-size-12;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: rgba(#fff, 0.08);
  }
}

.actions {
  @include flex-column;
  gap: 8px;
}

.createButton {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: $border-radius-lg;
  background: $primary-gradient;
  color: $white;
  font-size: $font-size-14;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.closeButton {
  width: 100%;
  padding: 14px;
  border: 1px solid #333;
  border-radius: $border-radius-lg;
  background: transparent;
  color: $text-secondary;
  font-size: $font-size-14;
  cursor: pointer;

  &:hover {
    background: $bg-tertiary;
  }
}
```

- [ ] **Step 2: CreateGroupLink 컴포넌트 생성**

```tsx
// src/components/features/Bundle/BundleResult/CreateGroupLink.tsx
'use client';

import { useState, type FC } from 'react';

import { Toast } from '@/components/common/Toast/Toast';
import { useCreateCompareLink } from '@/hooks/api/useCompare';
import { useToast } from '@/hooks/useToast';

import styles from './CreateGroupLink.module.scss';

interface CreateGroupLinkProps {
  slug: string;
  onClose: () => void;
}

export const CreateGroupLink: FC<CreateGroupLinkProps> = ({ slug, onClose }) => {
  const createMutation = useCreateCompareLink(slug);
  const [groupName, setGroupName] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const { toast, showToast } = useToast();

  const handleCreate = async () => {
    if (!groupName.trim()) {
      showToast('그룹 이름을 입력해주세요');
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        type: 'GROUP',
        groupName: groupName.trim(),
      });
      setShareUrl(result.shareUrl || `${window.location.origin}/compare/${result.token}`);
    } catch {
      showToast('링크 생성에 실패했습니다');
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('링크가 복사되었습니다');
    } catch {
      showToast('복사에 실패했습니다');
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {!shareUrl ? (
          <>
            <h2 className={styles.title}>그룹 비교 만들기</h2>
            <p className={styles.description}>
              그룹 이름을 정하고 링크를 공유하면
              <br />
              여러 명의 가치관을 한눈에 비교할 수 있어요!
            </p>
            <div>
              <label className={styles.inputLabel}>그룹 이름</label>
              <input
                type="text"
                className={styles.groupNameInput}
                placeholder="예: 마케팅팀, 대학 친구들"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={20}
              />
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.createButton}
                onClick={handleCreate}
                disabled={createMutation.isPending || !groupName.trim()}
              >
                {createMutation.isPending ? '생성 중...' : '그룹 링크 만들기'}
              </button>
              <button type="button" className={styles.closeButton} onClick={onClose}>
                닫기
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className={styles.title}>그룹 링크가 생성되었어요!</h2>
            <p className={styles.description}>
              아래 링크를 단체 채팅방에 보내면
              <br />
              함께 비교 결과를 확인할 수 있어요 (최대 50명)
            </p>
            <div className={styles.linkBox}>
              <span className={styles.linkText}>{shareUrl}</span>
              <button type="button" className={styles.copyButton} onClick={handleCopy}>
                복사
              </button>
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.closeButton} onClick={onClose}>
                닫기
              </button>
            </div>
          </>
        )}
      </div>
      <Toast message={toast.message} isVisible={toast.isVisible} />
    </div>
  );
};
```

- [ ] **Step 3: BundleResult.tsx에 그룹 비교 CTA 추가**

`src/components/features/Bundle/BundleResult/BundleResult.tsx`에서:

1. import 추가:

```typescript
import { CreateGroupLink } from './CreateGroupLink';
```

2. 기존 `showCompareModal` state 뒤에 추가:

```typescript
const [showGroupModal, setShowGroupModal] = useState(false);
```

3. CTA 섹션에서 기존 "메인으로 돌아가기" 버튼 앞에 그룹 CTA 추가:

```tsx
<button type="button" className={styles.secondaryCta} onClick={() => setShowGroupModal(true)}>
  그룹 비교하기
</button>
```

4. `showCompareModal` 모달 렌더 블록 뒤에 추가:

```tsx
{
  showGroupModal && <CreateGroupLink slug={slug} onClose={() => setShowGroupModal(false)} />;
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/components/features/Bundle/BundleResult/
git commit -m "feat(group-compare): 결과 페이지에 그룹 비교 링크 생성 CTA/모달 추가"
```

---

## Task 8: CompareLanding 그룹 타입 분기 처리

**Files:**

- Modify: `src/components/features/Compare/CompareLanding/CompareLanding.tsx`

- [ ] **Step 1: 그룹 타입 분기 추가**

`CompareLanding` 컴포넌트에서 `handleAction` 함수 내에 그룹 타입 분기를 추가. 기존 로직은 1:1과 그룹 모두에 적용되므로, 결과 페이지 이동 부분만 분기:

기존 `router.push(`/compare/${token}/result`)` 를 다음으로 교체:

```typescript
const resultPath = link.type === 'GROUP' ? `/compare/${token}/group` : `/compare/${token}/result`;
```

모든 `router.push(\`/compare/${token}/result\`)`를`router.push(resultPath)` 로 교체 (3곳).

- [ ] **Step 2: 초대 메시지 그룹 분기**

inviteMessage 부분을 그룹 타입에 맞게 분기:

```tsx
<p className={styles.inviteMessage}>
  {link.isCreator
    ? link.compareReady
      ? link.type === 'GROUP'
        ? `${link.memberCount}명이 참여한 그룹 결과가 준비되었어요!`
        : '비교 결과가 준비되었어요!'
      : link.type === 'GROUP'
        ? '멤버들이 참여하면 그룹 비교 결과를 볼 수 있어요'
        : '상대방이 참여하면 비교할 수 있어요'
    : link.type === 'GROUP'
      ? `${link.creatorNickname}님의 '${link.groupName}' 그룹에 참여하세요!`
      : `${link.creatorNickname}님이 비교를 기다리고 있어요!`}
</p>
```

- [ ] **Step 3: 그룹 멤버 수 표시**

`participantNickname` 표시 부분 뒤에 그룹 멤버 수 표시 추가:

```tsx
{
  link.type === 'GROUP' && link.memberCount > 0 && (
    <p className={styles.errorMessage}>
      현재 {link.memberCount}명 참여 중{link.isClosed && ' (마감됨)'}
    </p>
  );
}
```

- [ ] **Step 4: CTA 텍스트 그룹 분기**

`getCtaText` 함수를 그룹 분기 추가:

```typescript
const getCtaText = () => {
  if (!isLoggedIn) return '로그인하고 비교하기';
  if (link.isCreator && !link.compareReady) {
    return link.type === 'GROUP' ? '아직 참여 인원이 부족해요...' : '상대방 참여 대기 중...';
  }
  if (link.compareReady) {
    return link.type === 'GROUP' ? '그룹 비교 결과 보기' : '비교 결과 보기';
  }
  if (!link.myBundleCompleted) return '번들 풀고 비교하기';
  return '참여하기';
};
```

그룹의 경우 `compareReady` 판단: 2명 이상 참여하면 compareReady=true (서버에서 처리).

- [ ] **Step 5: 커밋**

```bash
git add src/components/features/Compare/CompareLanding/
git commit -m "feat(group-compare): 랜딩 페이지 그룹 타입 분기 처리"
```

---

## Task 9: 케미 네트워크 관계도 그래프 컴포넌트

**Files:**

- Create: `src/components/features/Compare/GroupResult/ChemistryNetwork.tsx`
- Create: `src/components/features/Compare/GroupResult/ChemistryNetwork.module.scss`

- [ ] **Step 1: ChemistryNetwork SCSS 생성**

```scss
// src/components/features/Compare/GroupResult/ChemistryNetwork.module.scss
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.container {
  @include flex-column;
  gap: 16px;
  width: 100%;
  animation: fadeSlideUp 0.6s ease-out both;
}

.networkCanvas {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  max-width: 360px;
  margin: 0 auto;
}

.svgLayer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.memberNode {
  position: absolute;
  @include flex-column;
  align-items: center;
  gap: 4px;
  transform: translate(-50%, -50%);
  z-index: 1;
}

.nodeCircle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  @include flex-center;
  font-size: $font-size-14;
  font-weight: 700;
  color: $white;
  border: 2px solid rgba(#fff, 0.1);
}

.nodeName {
  font-size: 11px;
  color: $text-secondary;
  font-weight: 500;
  white-space: nowrap;
}

.filterBar {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filterChip {
  padding: 6px 14px;
  border-radius: $border-rounded;
  font-size: $font-size-12;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid rgba(#fff, 0.08);
  background: transparent;
  color: $text-tertiary;

  &.active {
    border-color: var(--chip-color);
    color: var(--chip-color);
    background: rgba(var(--chip-color-rgb), 0.1);
  }
}
```

- [ ] **Step 2: ChemistryNetwork 컴포넌트 생성**

```tsx
// src/components/features/Compare/GroupResult/ChemistryNetwork.tsx
'use client';

import { useState, useMemo, type FC } from 'react';

import { getChemistryByRate, type ChemistryGrade } from '@/constants/bundle';
import { CHEMISTRY_NETWORK_COLORS } from '@/constants/group-compare';
import type { PairChemistry } from '@/types/group-compare';

import styles from './ChemistryNetwork.module.scss';

interface ChemistryNetworkProps {
  members: Array<{ userId: string; nickname: string }>;
  pairs: PairChemistry[];
}

/** 원형 배치 좌표 계산 (중심 기준 %) */
function getCirclePosition(index: number, total: number, radius: number = 38) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return {
    x: 50 + radius * Math.cos(angle),
    y: 50 + radius * Math.sin(angle),
  };
}

/** 등급별 선 두께 */
function getLineWidth(grade: ChemistryGrade): number {
  const widths: Record<ChemistryGrade, number> = { S: 4, A: 3, B: 2, C: 1.5, D: 1 };
  return widths[grade];
}

/** 등급별 칩 색상 RGB */
const CHIP_COLOR_RGB: Record<ChemistryGrade, string> = {
  S: '255, 215, 0',
  A: '255, 0, 255',
  B: '255, 107, 53',
  C: '79, 195, 247',
  D: '102, 187, 106',
};

/** 노드 배경 그라디언트 */
const NODE_GRADIENTS = [
  'linear-gradient(135deg, #ff00ff, #ff4500)',
  'linear-gradient(135deg, #4FC3F7, #00BCD4)',
  'linear-gradient(135deg, #FFD700, #FFA500)',
  'linear-gradient(135deg, #66BB6A, #00BCD4)',
  'linear-gradient(135deg, #8B5CF6, #EC4899)',
  'linear-gradient(135deg, #FF6B35, #FF00FF)',
];

const ALL_GRADES: ChemistryGrade[] = ['S', 'A', 'B', 'C', 'D'];

export const ChemistryNetwork: FC<ChemistryNetworkProps> = ({ members, pairs }) => {
  const [activeGrades, setActiveGrades] = useState<Set<ChemistryGrade>>(new Set(ALL_GRADES));

  const toggleGrade = (grade: ChemistryGrade) => {
    setActiveGrades((prev) => {
      const next = new Set(prev);
      if (next.has(grade)) {
        next.delete(grade);
      } else {
        next.add(grade);
      }
      return next;
    });
  };

  const positions = useMemo(
    () => members.map((_, i) => getCirclePosition(i, members.length)),
    [members.length]
  );

  const pairsWithGrade = useMemo(
    () =>
      pairs.map((pair) => ({
        ...pair,
        grade: getChemistryByRate(pair.matchRate).grade,
      })),
    [pairs]
  );

  return (
    <div className={styles.container}>
      {/* 등급 필터 */}
      <div className={styles.filterBar}>
        {ALL_GRADES.map((grade) => (
          <button
            key={grade}
            type="button"
            className={`${styles.filterChip} ${activeGrades.has(grade) ? styles.active : ''}`}
            style={
              {
                '--chip-color': CHEMISTRY_NETWORK_COLORS[grade],
                '--chip-color-rgb': CHIP_COLOR_RGB[grade],
              } as React.CSSProperties
            }
            onClick={() => toggleGrade(grade)}
          >
            {grade}
          </button>
        ))}
      </div>

      {/* 네트워크 그래프 */}
      <div className={styles.networkCanvas}>
        {/* 관계선 (SVG) */}
        <svg className={styles.svgLayer} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          {pairsWithGrade
            .filter((p) => activeGrades.has(p.grade))
            .map((pair) => {
              const idxA = members.findIndex((m) => m.userId === pair.memberA);
              const idxB = members.findIndex((m) => m.userId === pair.memberB);
              if (idxA === -1 || idxB === -1) return null;
              const posA = positions[idxA];
              const posB = positions[idxB];
              return (
                <line
                  key={`${pair.memberA}-${pair.memberB}`}
                  x1={posA.x}
                  y1={posA.y}
                  x2={posB.x}
                  y2={posB.y}
                  stroke={CHEMISTRY_NETWORK_COLORS[pair.grade]}
                  strokeWidth={getLineWidth(pair.grade) * 0.3}
                  strokeOpacity={0.6}
                  strokeLinecap="round"
                />
              );
            })}
        </svg>

        {/* 멤버 노드 */}
        {members.map((member, i) => {
          const pos = positions[i];
          return (
            <div
              key={member.userId}
              className={styles.memberNode}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <div
                className={styles.nodeCircle}
                style={{ background: NODE_GRADIENTS[i % NODE_GRADIENTS.length] }}
              >
                {member.nickname[0]}
              </div>
              <span className={styles.nodeName}>{member.nickname}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/features/Compare/GroupResult/ChemistryNetwork*
git commit -m "feat(group-compare): 케미 네트워크 관계도 그래프 컴포넌트"
```

---

## Task 10: 그룹 통계 컴포넌트

**Files:**

- Create: `src/components/features/Compare/GroupResult/GroupStats.tsx`
- Create: `src/components/features/Compare/GroupResult/GroupStats.module.scss`

- [ ] **Step 1: GroupStats SCSS 생성**

```scss
// src/components/features/Compare/GroupResult/GroupStats.module.scss
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.container {
  @include flex-column;
  gap: 16px;
  width: 100%;
  animation: fadeSlideUp 0.5s ease-out 0.3s both;
}

.sectionHeader {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sectionTitle {
  font-size: $font-size-12;
  font-weight: 700;
  color: $text-tertiary;
  text-transform: uppercase;
  letter-spacing: 2px;
  white-space: nowrap;
}

.sectionLine {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, #333 0%, transparent 100%);
}

.statsGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.statCard {
  @include flex-column;
  align-items: center;
  gap: 4px;
  padding: 16px 12px;
  background: rgba(#1e1e1e, 0.6);
  backdrop-filter: blur(16px);
  border-radius: $border-radius-lg;
  border: 1px solid rgba(#fff, 0.04);
  text-align: center;
}

.statValue {
  font-size: $font-size-28;
  font-weight: 700;
  color: $white;
  line-height: 1;
}

.statUnit {
  font-size: $font-size-14;
  color: $text-tertiary;
}

.statLabel {
  font-size: $font-size-12;
  color: $text-tertiary;
}

.questionList {
  @include flex-column;
  gap: 8px;
}

.questionItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(#1e1e1e, 0.4);
  border-radius: $border-radius-md;
  border: 1px solid rgba(#fff, 0.04);
}

.questionTitle {
  font-size: 13px;
  color: $text-secondary;
  flex: 1;
}

.badge {
  padding: 4px 8px;
  border-radius: $border-rounded;
  font-size: 11px;
  font-weight: 600;
}

.unanimousBadge {
  background: rgba(102, 187, 106, 0.1);
  color: #66bb6a;
  border: 1px solid rgba(102, 187, 106, 0.2);
}

.controversyBadge {
  background: rgba(255, 107, 53, 0.1);
  color: #ff6b35;
  border: 1px solid rgba(255, 107, 53, 0.2);
}

.ratioBar {
  display: flex;
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
  background: rgba(#fff, 0.05);
  margin-top: 4px;
}

.ratioA {
  background: #a89eff;
  transition: width 0.3s ease;
}

.ratioB {
  background: #ff9a6c;
  transition: width 0.3s ease;
}

.ratioLabels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: $text-tertiary;
  margin-top: 2px;
}
```

- [ ] **Step 2: GroupStats 컴포넌트 생성**

```tsx
// src/components/features/Compare/GroupResult/GroupStats.tsx
import type { FC } from 'react';

import { findUnanimousQuestions, findControversyPoints } from '@/constants/group-compare';
import type { GroupCompareResult } from '@/types/group-compare';

import styles from './GroupStats.module.scss';

interface GroupStatsProps {
  result: GroupCompareResult;
}

export const GroupStats: FC<GroupStatsProps> = ({ result }) => {
  const unanimous = findUnanimousQuestions(result);
  const controversy = findControversyPoints(result);

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>그룹 통계</span>
        <div className={styles.sectionLine} />
      </div>

      {/* 핵심 지표 */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div>
            <span className={styles.statValue}>{result.groupSyncRate}</span>
            <span className={styles.statUnit}>%</span>
          </div>
          <span className={styles.statLabel}>그룹 싱크율</span>
        </div>
        <div className={styles.statCard}>
          <div>
            <span className={styles.statValue}>{result.memberCount}</span>
            <span className={styles.statUnit}>명</span>
          </div>
          <span className={styles.statLabel}>참여 인원</span>
        </div>
        <div className={styles.statCard}>
          <div>
            <span className={styles.statValue}>{unanimous.length}</span>
            <span className={styles.statUnit}>개</span>
          </div>
          <span className={styles.statLabel}>만장일치</span>
        </div>
        <div className={styles.statCard}>
          <div>
            <span className={styles.statValue}>{controversy.length}</span>
            <span className={styles.statUnit}>개</span>
          </div>
          <span className={styles.statLabel}>논쟁 포인트</span>
        </div>
      </div>

      {/* 만장일치 질문 */}
      {unanimous.length > 0 && (
        <div className={styles.questionList}>
          {unanimous.map((q) => (
            <div key={q.electionId} className={styles.questionItem}>
              <span className={styles.questionTitle}>{q.title}</span>
              <span className={`${styles.badge} ${styles.unanimousBadge}`}>
                만장일치: {q.unanimousAnswer}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 논쟁 포인트 */}
      {controversy.length > 0 && (
        <div className={styles.questionList}>
          {controversy.map((q) => (
            <div key={q.electionId} className={styles.questionItem}>
              <div style={{ flex: 1 }}>
                <span className={styles.questionTitle}>{q.title}</span>
                <div className={styles.ratioBar}>
                  <div className={styles.ratioA} style={{ width: `${q.ratioA}%` }} />
                  <div className={styles.ratioB} style={{ width: `${q.ratioB}%` }} />
                </div>
                <div className={styles.ratioLabels}>
                  <span>
                    {q.optionA} {q.ratioA}%
                  </span>
                  <span>
                    {q.optionB} {q.ratioB}%
                  </span>
                </div>
              </div>
              <span className={`${styles.badge} ${styles.controversyBadge}`}>논쟁</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/features/Compare/GroupResult/GroupStats*
git commit -m "feat(group-compare): 그룹 통계 컴포넌트"
```

---

## Task 11: 가치관 지도 (4분면) 컴포넌트

**Files:**

- Create: `src/components/features/Compare/GroupResult/ValueMap.tsx`
- Create: `src/components/features/Compare/GroupResult/ValueMap.module.scss`

- [ ] **Step 1: ValueMap SCSS 생성**

```scss
// src/components/features/Compare/GroupResult/ValueMap.module.scss
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.container {
  @include flex-column;
  gap: 16px;
  width: 100%;
  animation: fadeSlideUp 0.5s ease-out 0.5s both;
}

.sectionHeader {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sectionTitle {
  font-size: $font-size-12;
  font-weight: 700;
  color: $text-tertiary;
  text-transform: uppercase;
  letter-spacing: 2px;
  white-space: nowrap;
}

.sectionLine {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, #333 0%, transparent 100%);
}

.mapWrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  max-width: 360px;
  margin: 0 auto;
  background: rgba(#1e1e1e, 0.4);
  border-radius: $border-radius-lg;
  border: 1px solid rgba(#fff, 0.04);
  overflow: hidden;
}

.gridLine {
  position: absolute;
  background: rgba(#fff, 0.06);
}

.horizontalLine {
  top: 50%;
  left: 8%;
  right: 8%;
  height: 1px;
}

.verticalLine {
  left: 50%;
  top: 8%;
  bottom: 8%;
  width: 1px;
}

.axisLabel {
  position: absolute;
  font-size: 11px;
  color: $text-tertiary;
  font-weight: 500;
}

.axisLeft {
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.axisRight {
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.axisTop {
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
}

.axisBottom {
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
}

.quadrantLabel {
  position: absolute;
  font-size: 10px;
  color: rgba(#fff, 0.15);
  font-weight: 600;
}

.qTopLeft {
  top: 12%;
  left: 12%;
}

.qTopRight {
  top: 12%;
  right: 12%;
  text-align: right;
}

.qBottomLeft {
  bottom: 12%;
  left: 12%;
}

.qBottomRight {
  bottom: 12%;
  right: 12%;
  text-align: right;
}

.memberDot {
  position: absolute;
  transform: translate(-50%, -50%);
  @include flex-column;
  align-items: center;
  gap: 2px;
  z-index: 2;
}

.dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  @include flex-center;
  font-size: 11px;
  font-weight: 700;
  color: $white;
  border: 2px solid rgba(#fff, 0.2);
}

.dotName {
  font-size: 10px;
  color: $text-secondary;
  white-space: nowrap;
}

.groupAverage {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px dashed rgba(#fff, 0.3);
  z-index: 1;
}
```

- [ ] **Step 2: ValueMap 컴포넌트 생성**

```tsx
// src/components/features/Compare/GroupResult/ValueMap.tsx
import { useMemo, type FC } from 'react';

import {
  calcValueMapCoordinates,
  calcGroupAverage,
  VALUE_MAP_CONFIGS,
} from '@/constants/group-compare';
import type { GroupCompareResult } from '@/types/group-compare';

import styles from './ValueMap.module.scss';

interface ValueMapProps {
  result: GroupCompareResult;
}

/** 좌표(-1~+1)를 % 위치(12%~88%)로 변환 */
function coordToPercent(coord: number): number {
  return 12 + ((coord + 1) / 2) * 76;
}

const DOT_GRADIENTS = [
  'linear-gradient(135deg, #ff00ff, #ff4500)',
  'linear-gradient(135deg, #4FC3F7, #00BCD4)',
  'linear-gradient(135deg, #FFD700, #FFA500)',
  'linear-gradient(135deg, #66BB6A, #00BCD4)',
  'linear-gradient(135deg, #8B5CF6, #EC4899)',
  'linear-gradient(135deg, #FF6B35, #FF00FF)',
];

export const ValueMap: FC<ValueMapProps> = ({ result }) => {
  const config = VALUE_MAP_CONFIGS[result.bundleSlug];
  const hasAxisQuestions = result.questionStats.some((s) => s.axis !== null);

  const coords = useMemo(() => calcValueMapCoordinates(result), [result]);
  const avgCoord = useMemo(() => calcGroupAverage(coords), [coords]);

  // 축 배정된 질문이 없으면 렌더링하지 않음
  if (!config || !hasAxisQuestions) return null;

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>가치관 지도</span>
        <div className={styles.sectionLine} />
      </div>

      <div className={styles.mapWrapper}>
        {/* 그리드 라인 */}
        <div className={`${styles.gridLine} ${styles.horizontalLine}`} />
        <div className={`${styles.gridLine} ${styles.verticalLine}`} />

        {/* 축 라벨 */}
        <span className={`${styles.axisLabel} ${styles.axisLeft}`}>{config.xAxisLeft}</span>
        <span className={`${styles.axisLabel} ${styles.axisRight}`}>{config.xAxisRight}</span>
        <span className={`${styles.axisLabel} ${styles.axisTop}`}>{config.yAxisTop}</span>
        <span className={`${styles.axisLabel} ${styles.axisBottom}`}>{config.yAxisBottom}</span>

        {/* 4분면 라벨 */}
        <span className={`${styles.quadrantLabel} ${styles.qTopLeft}`}>
          {config.quadrantLabels.topLeft}
        </span>
        <span className={`${styles.quadrantLabel} ${styles.qTopRight}`}>
          {config.quadrantLabels.topRight}
        </span>
        <span className={`${styles.quadrantLabel} ${styles.qBottomLeft}`}>
          {config.quadrantLabels.bottomLeft}
        </span>
        <span className={`${styles.quadrantLabel} ${styles.qBottomRight}`}>
          {config.quadrantLabels.bottomRight}
        </span>

        {/* 그룹 평균 (점선 원) */}
        <div
          className={styles.groupAverage}
          style={{
            left: `${coordToPercent(avgCoord.x)}%`,
            top: `${coordToPercent(-avgCoord.y)}%`,
          }}
        />

        {/* 멤버 점 */}
        {coords.map((coord, i) => (
          <div
            key={coord.userId}
            className={styles.memberDot}
            style={{
              left: `${coordToPercent(coord.x)}%`,
              top: `${coordToPercent(-coord.y)}%`,
            }}
          >
            <div
              className={styles.dot}
              style={{ background: DOT_GRADIENTS[i % DOT_GRADIENTS.length] }}
            >
              {coord.nickname[0]}
            </div>
            <span className={styles.dotName}>{coord.nickname}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/features/Compare/GroupResult/ValueMap*
git commit -m "feat(group-compare): 가치관 지도 4분면 컴포넌트"
```

---

## Task 12: 그룹 어워드 컴포넌트

**Files:**

- Create: `src/components/features/Compare/GroupResult/GroupAwards.tsx`
- Create: `src/components/features/Compare/GroupResult/GroupAwards.module.scss`

- [ ] **Step 1: GroupAwards SCSS 생성**

```scss
// src/components/features/Compare/GroupResult/GroupAwards.module.scss
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.container {
  @include flex-column;
  gap: 16px;
  width: 100%;
  animation: fadeSlideUp 0.5s ease-out 0.7s both;
}

.sectionHeader {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sectionTitle {
  font-size: $font-size-12;
  font-weight: 700;
  color: $text-tertiary;
  text-transform: uppercase;
  letter-spacing: 2px;
  white-space: nowrap;
}

.sectionLine {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, #333 0%, transparent 100%);
}

.awardGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.awardCard {
  @include flex-column;
  align-items: center;
  gap: 6px;
  padding: 16px 12px;
  background: rgba(#1e1e1e, 0.6);
  backdrop-filter: blur(16px);
  border-radius: $border-radius-lg;
  border: 1px solid rgba(#fff, 0.04);
  text-align: center;
}

.awardIcon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  @include flex-center;
  font-size: $font-size-20;
  font-weight: 700;
  color: $white;
}

.awardTitle {
  font-size: $font-size-14;
  font-weight: 700;
  color: $white;
}

.awardWinners {
  font-size: $font-size-12;
  color: $text-secondary;
  font-weight: 500;
}

.awardOneLiner {
  font-size: 11px;
  color: $text-tertiary;
  line-height: 1.4;
}

.awardValue {
  font-size: 11px;
  color: $text-tertiary;
}
```

- [ ] **Step 2: GroupAwards 컴포넌트 생성**

```tsx
// src/components/features/Compare/GroupResult/GroupAwards.tsx
import type { FC } from 'react';

import type { GroupAward, GroupAwardType } from '@/types/group-compare';

import styles from './GroupAwards.module.scss';

interface GroupAwardsProps {
  awards: GroupAward[];
}

const AWARD_GRADIENTS: Record<GroupAwardType, string> = {
  GROUP_LEADER: 'linear-gradient(135deg, #FFD700, #FFA500)',
  GROUP_OUTSIDER: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
  SOUL_CONNECTION: 'linear-gradient(135deg, #FF00FF, #FF4500)',
  POLAR_OPPOSITES: 'linear-gradient(135deg, #4FC3F7, #00BCD4)',
  CONTROVERSY_MAKER: 'linear-gradient(135deg, #FF6B35, #FF00FF)',
  PEOPLES_CHAMPION: 'linear-gradient(135deg, #66BB6A, #FFD700)',
};

const AWARD_ICONS: Record<GroupAwardType, string> = {
  GROUP_LEADER: '👑',
  GROUP_OUTSIDER: '🌀',
  SOUL_CONNECTION: '💫',
  POLAR_OPPOSITES: '⚡',
  CONTROVERSY_MAKER: '🔥',
  PEOPLES_CHAMPION: '🦁',
};

export const GroupAwards: FC<GroupAwardsProps> = ({ awards }) => {
  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>그룹 어워드</span>
        <div className={styles.sectionLine} />
      </div>

      <div className={styles.awardGrid}>
        {awards.map((award) => (
          <div key={award.type} className={styles.awardCard}>
            <div className={styles.awardIcon} style={{ background: AWARD_GRADIENTS[award.type] }}>
              {AWARD_ICONS[award.type]}
            </div>
            <span className={styles.awardTitle}>{award.title}</span>
            <span className={styles.awardWinners}>{award.winnerNicknames.join(' & ')}</span>
            <span className={styles.awardOneLiner}>{award.oneLiner}</span>
            {award.type === 'SOUL_CONNECTION' || award.type === 'POLAR_OPPOSITES' ? (
              <span className={styles.awardValue}>일치율 {award.value}%</span>
            ) : award.type === 'PEOPLES_CHAMPION' ? (
              <span className={styles.awardValue}>대중성 {award.value}%</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/features/Compare/GroupResult/GroupAwards*
git commit -m "feat(group-compare): 그룹 어워드 컴포넌트"
```

---

## Task 13: 멤버 1:1 비교 리스트 컴포넌트

**Files:**

- Create: `src/components/features/Compare/GroupResult/MemberList.tsx`
- Create: `src/components/features/Compare/GroupResult/MemberList.module.scss`

- [ ] **Step 1: MemberList SCSS 생성**

```scss
// src/components/features/Compare/GroupResult/MemberList.module.scss
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.container {
  @include flex-column;
  gap: 16px;
  width: 100%;
  animation: fadeSlideUp 0.5s ease-out 0.9s both;
}

.sectionHeader {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sectionTitle {
  font-size: $font-size-12;
  font-weight: 700;
  color: $text-tertiary;
  text-transform: uppercase;
  letter-spacing: 2px;
  white-space: nowrap;
}

.sectionLine {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, #333 0%, transparent 100%);
}

.memberCards {
  @include flex-column;
  gap: 8px;
}

.memberCard {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(#1e1e1e, 0.6);
  backdrop-filter: blur(16px);
  border-radius: $border-radius-lg;
  border: 1px solid rgba(#fff, 0.04);
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(#1e1e1e, 0.8);
  }
}

.memberAvatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  @include flex-center;
  font-size: $font-size-14;
  font-weight: 700;
  color: $white;
  flex-shrink: 0;
}

.memberInfo {
  flex: 1;
  @include flex-column;
  gap: 2px;
}

.memberName {
  font-size: $font-size-14;
  font-weight: 600;
  color: $white;
}

.memberGrade {
  font-size: $font-size-12;
  color: $text-tertiary;
}

.memberRate {
  font-size: $font-size-18;
  font-weight: 700;
  color: $white;
}

.memberRateUnit {
  font-size: $font-size-12;
  color: $text-tertiary;
}

.arrow {
  font-size: $font-size-12;
  color: $text-tertiary;
  margin-left: 4px;
}
```

- [ ] **Step 2: MemberList 컴포넌트 생성**

```tsx
// src/components/features/Compare/GroupResult/MemberList.tsx
'use client';

import type { FC } from 'react';

import { useRouter } from 'next/navigation';

import { getChemistryByRate } from '@/constants/bundle';
import type { PairChemistry } from '@/types/group-compare';

import styles from './MemberList.module.scss';

interface MemberListProps {
  currentUserId: string;
  members: Array<{ userId: string; nickname: string }>;
  pairs: PairChemistry[];
  token: string;
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #ff00ff, #ff4500)',
  'linear-gradient(135deg, #4FC3F7, #00BCD4)',
  'linear-gradient(135deg, #FFD700, #FFA500)',
  'linear-gradient(135deg, #66BB6A, #00BCD4)',
  'linear-gradient(135deg, #8B5CF6, #EC4899)',
  'linear-gradient(135deg, #FF6B35, #FF00FF)',
];

export const MemberList: FC<MemberListProps> = ({ currentUserId, members, pairs, token }) => {
  const router = useRouter();

  const otherMembers = members.filter((m) => m.userId !== currentUserId);

  const getMemberChemistry = (targetUserId: string): PairChemistry | undefined => {
    return pairs.find(
      (p) =>
        (p.memberA === currentUserId && p.memberB === targetUserId) ||
        (p.memberB === currentUserId && p.memberA === targetUserId)
    );
  };

  const handleMemberClick = (targetUserId: string) => {
    // 1:1 비교 결과 페이지로 이동 (targetUserId 쿼리 파라미터)
    router.push(`/compare/${token}/result?targetUserId=${targetUserId}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>멤버별 1:1 비교</span>
        <div className={styles.sectionLine} />
      </div>

      <div className={styles.memberCards}>
        {otherMembers.map((member, i) => {
          const chemistry = getMemberChemistry(member.userId);
          const matchRate = chemistry?.matchRate ?? 0;
          const grade = getChemistryByRate(matchRate);

          return (
            <div
              key={member.userId}
              className={styles.memberCard}
              onClick={() => handleMemberClick(member.userId)}
            >
              <div
                className={styles.memberAvatar}
                style={{ background: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length] }}
              >
                {member.nickname[0]}
              </div>
              <div className={styles.memberInfo}>
                <span className={styles.memberName}>{member.nickname}</span>
                <span className={styles.memberGrade}>
                  {grade.grade} · {grade.title}
                </span>
              </div>
              <div>
                <span className={styles.memberRate}>{matchRate}</span>
                <span className={styles.memberRateUnit}>%</span>
              </div>
              <span className={styles.arrow}>›</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/features/Compare/GroupResult/MemberList*
git commit -m "feat(group-compare): 멤버 1:1 비교 리스트 컴포넌트"
```

---

## Task 14: 그룹 비교 결과 메인 페이지

**Files:**

- Create: `src/components/features/Compare/GroupResult/GroupResult.tsx`
- Create: `src/components/features/Compare/GroupResult/GroupResult.module.scss`
- Create: `src/app/compare/[token]/group/page.tsx`

- [ ] **Step 1: GroupResult SCSS 생성**

```scss
// src/components/features/Compare/GroupResult/GroupResult.module.scss
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;

.container {
  @include flex-column;
  align-items: center;
  padding: calc(56px + 32px) $spacing-16 calc($spacing-48 + 80px);
  gap: 48px;
  width: 100%;
}

.heroSection {
  @include flex-column;
  align-items: center;
  gap: 8px;
  text-align: center;
  width: 100%;
}

.groupName {
  font-size: $font-size-24;
  font-weight: 700;
  color: $white;
}

.bundleTitle {
  font-size: $font-size-14;
  color: $text-tertiary;
  padding: 6px 14px;
  background: $bg-tertiary;
  border-radius: $border-rounded;
}

.syncRateDisplay {
  @include flex-column;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
}

.syncLabel {
  font-size: $font-size-12;
  color: $text-tertiary;
}

.syncValue {
  font-size: 48px;
  font-weight: 700;
  color: $white;
  line-height: 1;
  letter-spacing: -2px;
}

.syncUnit {
  font-size: $font-size-18;
  color: $text-tertiary;
}

.ctaSection {
  @include flex-column;
  gap: 12px;
  width: 100%;
  padding-top: 8px;
}

.secondaryCta {
  width: 100%;
  padding: 14px;
  border: 1px solid rgba(#fff, 0.06);
  border-radius: $border-radius-lg;
  background: rgba(#fff, 0.02);
  color: $text-secondary;
  font-size: $font-size-14;
  cursor: pointer;

  &:hover {
    background: rgba(#fff, 0.04);
  }
}

.loading {
  @include flex-center;
  flex-direction: column;
  gap: 16px;
  min-height: 60dvh;
  color: $text-tertiary;
  font-size: $font-size-14;
}
```

- [ ] **Step 2: GroupResult 컴포넌트 생성**

```tsx
// src/components/features/Compare/GroupResult/GroupResult.tsx
'use client';

import { useMemo, useState, type FC } from 'react';

import { useRouter } from 'next/navigation';

import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import { CreateGroupLink } from '@/components/features/Bundle/BundleResult/CreateGroupLink';
import { FloatingCta } from '@/components/common/FloatingCta/FloatingCta';
import { calcAllPairChemistry, calcGroupAwards } from '@/constants/group-compare';
import { useGroupCompareResult } from '@/hooks/api/useCompare';

import { ChemistryNetwork } from './ChemistryNetwork';
import { GroupAwards } from './GroupAwards';
import styles from './GroupResult.module.scss';
import { GroupStats } from './GroupStats';
import { MemberList } from './MemberList';
import { ValueMap } from './ValueMap';

interface GroupResultProps {
  token: string;
}

export const GroupResult: FC<GroupResultProps> = ({ token }) => {
  const { data: result, isLoading } = useGroupCompareResult(token);
  const router = useRouter();
  const [showGroupModal, setShowGroupModal] = useState(false);

  const pairs = useMemo(() => (result ? calcAllPairChemistry(result) : []), [result]);

  const awards = useMemo(() => (result ? calcGroupAwards(result, pairs) : []), [result, pairs]);

  if (isLoading) {
    return (
      <BundleBackground>
        <div className={styles.loading}>그룹 비교 결과를 불러오는 중...</div>
      </BundleBackground>
    );
  }

  if (!result) {
    return (
      <BundleBackground>
        <div className={styles.loading}>
          그룹 비교 결과를 찾을 수 없습니다.
          <button
            type="button"
            className={styles.secondaryCta}
            style={{ maxWidth: 200 }}
            onClick={() => router.push('/')}
          >
            메인으로
          </button>
        </div>
      </BundleBackground>
    );
  }

  // 현재 유저 (MSW에서는 mock-user-1 고정)
  const currentUserId = 'mock-user-1';

  return (
    <BundleBackground fireworks>
      <div className={styles.container}>
        {/* 히어로: 그룹명 + 싱크율 */}
        <div className={styles.heroSection}>
          <h1 className={styles.groupName}>{result.groupName}</h1>
          <span className={styles.bundleTitle}>{result.bundleTitle}</span>
          <div className={styles.syncRateDisplay}>
            <span className={styles.syncLabel}>그룹 싱크율</span>
            <div>
              <span className={styles.syncValue}>{result.groupSyncRate}</span>
              <span className={styles.syncUnit}>%</span>
            </div>
          </div>
        </div>

        {/* 케미 네트워크 */}
        <ChemistryNetwork members={result.members} pairs={pairs} />

        {/* 그룹 통계 */}
        <GroupStats result={result} />

        {/* 가치관 지도 */}
        <ValueMap result={result} />

        {/* 그룹 어워드 */}
        <GroupAwards awards={awards} />

        {/* 멤버 1:1 비교 리스트 */}
        <MemberList
          currentUserId={currentUserId}
          members={result.members}
          pairs={pairs}
          token={token}
        />

        {/* 하단 CTA */}
        <div className={styles.ctaSection}>
          <button
            type="button"
            className={styles.secondaryCta}
            onClick={() => router.push(`/bundle/${result.bundleSlug}/result`)}
          >
            내 결과 다시 보기
          </button>
          <button type="button" className={styles.secondaryCta} onClick={() => router.push('/')}>
            메인으로 돌아가기
          </button>
        </div>
      </div>

      {/* 플로팅 CTA */}
      <FloatingCta onClick={() => setShowGroupModal(true)}>내 그룹 만들기</FloatingCta>

      {showGroupModal && (
        <CreateGroupLink slug={result.bundleSlug} onClose={() => setShowGroupModal(false)} />
      )}
    </BundleBackground>
  );
};
```

- [ ] **Step 3: 그룹 비교 결과 페이지 라우트 생성**

```tsx
// src/app/compare/[token]/group/page.tsx
import type { Metadata } from 'next';

import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';
import { GroupResult } from '@/components/features/Compare/GroupResult/GroupResult';

export const metadata: Metadata = {
  title: '그룹 비교 결과 | HotPick',
  description: '우리 그룹의 가치관, 얼마나 통할까?',
  robots: { index: false },
};

type GroupResultPageProps = {
  params: Promise<{ token: string }>;
};

export default async function GroupResultPage({ params }: GroupResultPageProps) {
  const { token } = await params;

  return (
    <>
      <MainHeader />
      <GroupResult token={token} />
    </>
  );
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/components/features/Compare/GroupResult/GroupResult* src/app/compare/\[token\]/group/
git commit -m "feat(group-compare): 그룹 비교 결과 메인 페이지"
```

---

## Task 15: 1:1 비교 결과 페이지에 플로팅 CTA 추가

**Files:**

- Modify: `src/components/features/Compare/CompareResult/CompareResult.tsx`

- [ ] **Step 1: FloatingCta import 추가**

`src/components/features/Compare/CompareResult/CompareResult.tsx` 상단에 import 추가:

```typescript
import { FloatingCta } from '@/components/common/FloatingCta/FloatingCta';
```

- [ ] **Step 2: 컴포넌트 하단에 플로팅 CTA 삽입**

기존 `showCompareModal` 모달 렌더 블록 바로 위, `</BundleBackground>` 전에 추가:

```tsx
<FloatingCta onClick={() => setShowCompareModal(true)}>다른 친구와도 비교해볼래?</FloatingCta>
```

- [ ] **Step 3: CompareResult SCSS에 하단 패딩 추가**

`src/components/features/Compare/CompareResult/CompareResult.module.scss`의 `.container` 클래스에서 padding-bottom을 플로팅 CTA 높이만큼 늘림:

```scss
.container {
  @include flex-column;
  align-items: center;
  padding: calc(56px + 32px) $spacing-16 calc($spacing-48 + 80px);
  gap: 48px;
  width: 100%;
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/components/features/Compare/CompareResult/
git commit -m "feat(group-compare): 1:1 비교 결과에 플로팅 CTA 추가"
```

---

## Self-Review 결과

**1. Spec coverage:**

- 섹션 Phase 2 - 그룹 링크 생성 (이름 입력, 최대 50명) → Task 7 (CreateGroupLink 모달)
- 그룹 비교 결과 (통계, 답변 분포, 어워드) → Task 10, 12, 14
- 케미 네트워크 + 등급 필터 토글 → Task 9 (ChemistryNetwork + filterBar)
- 가치관 지도 (클러스터링 점도표) → Task 11 (ValueMap 4분면)
- 비교 링크 랜딩/결과 하단 플로팅 CTA → Task 6 (FloatingCta) + Task 14, 15
- 1:1/그룹 스토리텔링 아코디언 → Plan 2에서 이미 구현 (AnswerComparison)
- 그룹 마감 기능 → Task 4 (close/reopen API 핸들러)
- 멤버 간 1:1 비교 → Task 13 (MemberList, 클릭 시 기존 1:1 결과 페이지 재사용)
- 인구통계 인사이트 → Phase 2~3 범위, 이 계획에서는 BE 스펙 확정 후 별도 Task 추가 가능
- 시딩 전략 → 마케팅/운영 영역, FE 구현 불필요

**2. Placeholder scan:** 없음. 모든 코드 블록에 실제 구현 코드 포함.

**3. Type consistency:**

- `GroupCompareResult` — Task 1에서 정의, Task 3 (MSW), Task 5 (훅), Task 10~14에서 동일하게 사용
- `PairChemistry` — Task 1에서 정의, Task 2 (계산), Task 9, 13, 14에서 사용
- `GroupAward` — Task 1에서 정의, Task 2 (계산), Task 12, 14에서 사용
- `ValueMapCoordinate` — Task 1에서 정의, Task 2 (계산), Task 11에서 사용
- `CompareLink` 확장 필드 (`groupName`, `memberCount`, `isClosed`) — Task 1에서 추가, Task 3 (MSW), Task 8 (랜딩) 에서 사용
- `calcAllPairChemistry`, `calcGroupAwards`, `calcValueMapCoordinates` — Task 2에서 정의, Task 14에서 호출
- `findUnanimousQuestions`, `findControversyPoints` — Task 2에서 정의, Task 10에서 호출
- `CHEMISTRY_NETWORK_COLORS` — Task 2에서 정의, Task 9에서 사용
- `FloatingCta` — Task 6에서 생성, Task 14, 15에서 사용
- `CreateGroupLink` — Task 7에서 생성, Task 14에서 재사용
- `getChemistryByRate`, `calcPopularityScore` — `src/constants/bundle.ts`에서 import, Task 2, 9, 13에서 사용
