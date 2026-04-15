# 번들 옵션 배열 마이그레이션 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** BE API가 A/B 이분법에서 N개 옵션 배열 구조로 변경된 것을 FE 전체에 반영한다.

**Architecture:** 기존 `optionA`/`optionB`/`selected:"A"|"B"` 패턴을 `options[]`/`optionStats[]`/`electionItemId` 배열 기반으로 전환. 현재는 여전히 2개 옵션만 사용하므로 `options[0]`/`options[1]` 인덱싱을 활용하되, 배열 구조를 유지해 확장 가능하게 한다. 변경 레이어는 bottom-up: (1) 타입 정의 → (2) 유틸/상수 함수 → (3) Mock 데이터 → (4) MSW 핸들러 → (5) 컴포넌트.

**Tech Stack:** TypeScript, Next.js 14 App Router, React Query, SCSS Modules, MSW

---

## 핵심 매핑 표

| Before                                                   | After                                                                      | 설명          |
| -------------------------------------------------------- | -------------------------------------------------------------------------- | ------------- |
| `BundleElectionResponse.optionA/optionB`                 | `BundleElectionResponse.options[0].title / options[1].title`               | 질문의 선택지 |
| `MyAnswer.optionA/optionB/selected`                      | `MyAnswer.options[0]/options[1]` + `selectedElectionItemId`                | 내 답변       |
| `QuestionStat.optionA/optionB/optionACount/optionBCount` | `QuestionStat.optionStats[0]/optionStats[1]` (각각 `.title`, `.voteCount`) | 투표 통계     |
| `Answer.selected: "A"\|"B"`                              | `Answer.electionItemId: string`                                            | 제출 답변     |
| `Participant.answers[].selected`                         | `Participant.answers[].electionItemId`                                     | 참여자 답변   |

---

## 파일 구조

### 수정 대상 파일

| 파일                                        | 역할                                                                         | 변경 내용                                                      |
| ------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `src/types/group-compare.ts`                | 그룹 비교 FE 타입                                                            | `members[].answers` 및 `questionStats[]` 필드를 새 구조로 변경 |
| `src/constants/bundle.ts`                   | `calcPopularityScore()`                                                      | 배열 기반 optionStats/electionItemId 사용                      |
| `src/constants/compare.ts`                  | `findShockPoint()`, `classifyAnswers()`, `ShockPointData`, `AnswerStoryData` | 배열 기반 구조로 전환                                          |
| `src/constants/group-compare.ts`            | 그룹 유틸 전체                                                               | `selected` → `electionItemId`, `optionA/B` → `optionStats[]`   |
| `src/mocks/data/bundles.ts`                 | Mock 데이터 + 인메모리 스토어                                                | 배열 구조로 전환                                               |
| `src/mocks/data/compare.ts`                 | 1:1 비교 Mock                                                                | 배열 구조로 전환                                               |
| `src/mocks/data/group-compare.ts`           | 그룹 비교 Mock                                                               | 배열 구조로 전환                                               |
| `src/mocks/handlers.ts`                     | MSW 핸들러                                                                   | 제출/결과 응답 배열 구조로 전환                                |
| `src/components/.../QuestionCard.tsx`       | 번들 풀기 질문 카드                                                          | `options[]` 렌더링                                             |
| `src/components/.../BundlePlay.tsx`         | 번들 풀기 페이지                                                             | 답변 제출 `electionItemId` 사용                                |
| `src/components/.../BundleResult.tsx`       | 번들 결과 페이지                                                             | `myAnswers` 새 구조 렌더링                                     |
| `src/components/.../CompareResult.tsx`      | 1:1 비교 결과                                                                | 프리뷰 데이터 생성 배열 전환                                   |
| `src/components/.../PersonDetailSheet.tsx`  | 개인 상세 바텀시트                                                           | `optionStats[]` 렌더링                                         |
| `src/components/.../AnswerComparison.tsx`   | 답변 비교                                                                    | 변경된 `AnswerStoryData` 사용 (코드 변경 없을 수 있음)         |
| `src/components/.../ShockPoint.tsx`         | 충격 포인트                                                                  | 변경된 `ShockPointData` 사용                                   |
| `src/components/.../GroupStats.tsx`         | 그룹 통계                                                                    | 변경된 유틸 리턴값 사용                                        |
| `src/components/.../PickASide.tsx`          | 투표 현황                                                                    | `selected` → `electionItemId` 매칭                             |
| `src/components/.../GenderBattle.tsx`       | 성별 대결                                                                    | `selected` → `electionItemId` 매칭                             |
| `src/components/.../PopularitySpectrum.tsx` | 대중성 분포                                                                  | `optionStats[]` 사용                                           |
| `src/components/.../PopularityCompare.tsx`  | 대중성 비교                                                                  | 참여자 수 표시 변경                                            |
| `src/components/.../RelationExplorer.tsx`   | 관계 탐색기                                                                  | `selected` → `electionItemId` 매칭                             |

---

## Task 1: 타입 정의 수정 — `src/types/group-compare.ts`

`GroupCompareResult`의 수동 정의된 `members[].answers`와 `questionStats[]` 필드를 새 API 구조에 맞게 변경.

**Files:**

- Modify: `src/types/group-compare.ts:22-43`

- [ ] **Step 1: `members[].answers` 타입 변경**

`answers` 필드를 `selected: string` → `electionItemId: string`으로 변경:

```typescript
// Before (line 32)
answers?: Array<{ electionId: string; selected: string }>;

// After
answers?: Array<{ electionId: string; electionItemId: string }>;
```

- [ ] **Step 2: `questionStats[]` 타입 변경**

`optionA/B/optionACount/optionBCount` → `optionStats[]` 배열로 변경:

```typescript
// Before (lines 34-43)
questionStats?: Array<{
  electionId?: string;
  title?: string;
  optionA?: string;
  optionB?: string;
  optionACount?: number;
  optionBCount?: number;
  axis?: 'X' | 'Y' | null;
}>;

// After
questionStats?: Array<{
  electionId?: string;
  title?: string;
  optionStats?: Array<{
    electionItemId?: string;
    title?: string;
    imageUrl?: string;
    voteCount?: number;
  }>;
  /** 가치관 지도 축 배정 (FE-only, null = 미배정) */
  axis?: 'X' | 'Y' | null;
}>;
```

- [ ] **Step 3: 타입 체크 실행**

Run: `npx tsc --noEmit 2>&1 | head -80`
Expected: 다수의 타입 에러 발생 (이후 태스크에서 수정 예정). `group-compare.ts` 자체는 에러 없어야 함.

---

## Task 2: 유틸 함수 수정 — `src/constants/bundle.ts`

`calcPopularityScore()` 함수의 인자 타입과 내부 로직을 새 구조에 맞게 변경.

**Files:**

- Modify: `src/constants/bundle.ts:163-197`

- [ ] **Step 1: `calcPopularityScore()` 시그니처 및 로직 변경**

```typescript
// Before (lines 163-197)
export function calcPopularityScore(
  myAnswers: Array<{ electionId?: string; selected?: string }>,
  questionStats: Array<{ electionId?: string; optionACount?: number; optionBCount?: number }>
): number {
  if (!myAnswers || myAnswers.length === 0) {
    return 0;
  }

  let totalRate = 0;
  let matched = 0;

  for (const answer of myAnswers) {
    if (!answer.electionId || !answer.selected) {
      continue;
    }
    const stat = questionStats.find((s) => s.electionId === answer.electionId);
    if (!stat) {
      continue;
    }

    const aCount = stat.optionACount ?? 0;
    const bCount = stat.optionBCount ?? 0;
    const total = aCount + bCount;
    const optionARate = total > 0 ? Math.round((aCount / total) * 100) : 50;
    const optionBRate = total > 0 ? Math.round((bCount / total) * 100) : 50;
    totalRate += answer.selected === 'A' ? optionARate : optionBRate;
    matched++;
  }

  if (matched === 0) {
    return 0;
  }

  return Math.round(totalRate / matched);
}

// After
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
```

---

## Task 3: 유틸 함수 수정 — `src/constants/compare.ts`

`ShockPointData`, `AnswerStoryData` 타입과 `findShockPoint()`, `classifyAnswers()` 함수를 새 구조에 맞게 변경.

**Files:**

- Modify: `src/constants/compare.ts:169-310`

- [ ] **Step 1: `ShockPointData` 인터페이스 변경**

```typescript
// Before (lines 169-179)
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

// After
export interface ShockPointData {
  electionId: string;
  title: string;
  myOptionText: string;
  targetOptionText: string;
  myRate: number;
  targetRate: number;
  comment: string;
}
```

- [ ] **Step 2: `findShockPoint()` 함수 변경**

핵심 변경: `Participant.answers[].selected` → `.electionItemId`, `QuestionStat.optionA/B/Count` → `.optionStats[]`

```typescript
// After
export function findShockPoint(result: CompareResult): ShockPointData | null {
  const me = result.me;
  const target = result.target;
  const questionStats = result.questionStats ?? [];
  const meAnswers = me?.answers ?? [];
  const targetAnswers = target?.answers ?? [];

  const differentAnswers = questionStats.filter((stat) => {
    const myAnswer = meAnswers.find((a) => a.electionId === stat.electionId);
    const targetAnswer = targetAnswers.find((a) => a.electionId === stat.electionId);
    return myAnswer && targetAnswer && myAnswer.electionItemId !== targetAnswer.electionItemId;
  });

  if (differentAnswers.length === 0) {
    return null;
  }

  // 비율 차이가 가장 큰 질문
  let maxDiff = -1;
  let shockStat = differentAnswers[0];

  for (const stat of differentAnswers) {
    const options = stat.optionStats ?? [];
    const totalVotes = options.reduce((sum, o) => sum + (o.voteCount ?? 0), 0);
    if (totalVotes === 0 || options.length < 2) {
      continue;
    }
    const rates = options.map((o) =>
      totalVotes > 0 ? Math.round(((o.voteCount ?? 0) / totalVotes) * 100) : 50
    );
    const diff = Math.abs(rates[0] - rates[1]);
    if (diff > maxDiff) {
      maxDiff = diff;
      shockStat = stat;
    }
  }

  const myAnswer = meAnswers.find((a) => a.electionId === shockStat.electionId)!;
  const targetAnswer = targetAnswers.find((a) => a.electionId === shockStat.electionId)!;
  const options = shockStat.optionStats ?? [];
  const totalVotes = options.reduce((sum, o) => sum + (o.voteCount ?? 0), 0);

  const myOption = options.find((o) => o.electionItemId === myAnswer.electionItemId);
  const targetOption = options.find((o) => o.electionItemId === targetAnswer.electionItemId);
  const myRate = totalVotes > 0 ? Math.round(((myOption?.voteCount ?? 0) / totalVotes) * 100) : 50;
  const targetRate =
    totalVotes > 0 ? Math.round(((targetOption?.voteCount ?? 0) / totalVotes) * 100) : 50;

  // 코멘트 생성: 소수파인 쪽에 재미 코멘트
  const meMinority = myRate < targetRate;
  const minorityName = meMinority ? '나' : (target?.nickname ?? '');
  const comment = `${minorityName}${meMinority ? '는' : '님은'} 좀 양보하셔야...`;

  return {
    electionId: shockStat.electionId ?? '',
    title: shockStat.title ?? '',
    myOptionText: myOption?.title ?? '',
    targetOptionText: targetOption?.title ?? '',
    myRate,
    targetRate,
    comment,
  };
}
```

- [ ] **Step 3: `AnswerStoryData` 타입 변경**

`selected` 필드(옵션 텍스트 의미)는 이미 텍스트를 넣고 있으므로 이름 유지. `mySelected`/`targetSelected` (A/B 코드) 필드 제거.

```typescript
// Before (lines 244-264)
export interface AnswerStoryData {
  same: Array<{
    electionId: string;
    title: string;
    selected: string;
    selectedRate: number;
  }>;
  different: Array<{
    electionId: string;
    title: string;
    mySelected: string;
    targetSelected: string;
    myOptionText: string;
    targetOptionText: string;
    myRate: number;
    targetRate: number;
  }>;
}

// After (mySelected/targetSelected 제거 — 컴포넌트에서 사용하지 않음)
export interface AnswerStoryData {
  same: Array<{
    electionId: string;
    title: string;
    selected: string;
    selectedRate: number;
  }>;
  different: Array<{
    electionId: string;
    title: string;
    myOptionText: string;
    targetOptionText: string;
    myRate: number;
    targetRate: number;
  }>;
}
```

- [ ] **Step 4: `classifyAnswers()` 함수 변경**

```typescript
// After
export function classifyAnswers(result: CompareResult): AnswerStoryData {
  const same: AnswerStoryData['same'] = [];
  const different: AnswerStoryData['different'] = [];
  const meAnswers = result.me?.answers ?? [];
  const targetAnswers = result.target?.answers ?? [];

  for (const stat of result.questionStats ?? []) {
    const myAnswer = meAnswers.find((a) => a.electionId === stat.electionId);
    const targetAnswer = targetAnswers.find((a) => a.electionId === stat.electionId);
    if (!myAnswer || !targetAnswer) {
      continue;
    }

    const options = stat.optionStats ?? [];
    const totalVotes = options.reduce((sum, o) => sum + (o.voteCount ?? 0), 0);

    const getRate = (itemId: string) => {
      const opt = options.find((o) => o.electionItemId === itemId);
      return totalVotes > 0 ? Math.round(((opt?.voteCount ?? 0) / totalVotes) * 100) : 50;
    };
    const getTitle = (itemId: string) =>
      options.find((o) => o.electionItemId === itemId)?.title ?? '';

    const myRate = getRate(myAnswer.electionItemId);
    const targetRate = getRate(targetAnswer.electionItemId);

    if (myAnswer.electionItemId === targetAnswer.electionItemId) {
      same.push({
        electionId: stat.electionId ?? '',
        title: stat.title ?? '',
        selected: getTitle(myAnswer.electionItemId),
        selectedRate: myRate,
      });
    } else {
      different.push({
        electionId: stat.electionId ?? '',
        title: stat.title ?? '',
        myOptionText: getTitle(myAnswer.electionItemId),
        targetOptionText: getTitle(targetAnswer.electionItemId),
        myRate,
        targetRate,
      });
    }
  }

  return { same, different };
}
```

---

## Task 4: 유틸 함수 수정 — `src/constants/group-compare.ts`

모든 그룹 유틸 함수를 새 구조에 맞게 변경.

**Files:**

- Modify: `src/constants/group-compare.ts` (거의 전체)

- [ ] **Step 1: `calcPopularityScoreFromCount()` 변경**

```typescript
// After
function calcPopularityScoreFromCount(
  myAnswers: Array<{ electionId: string; electionItemId: string }>,
  questionStats: Array<{
    electionId: string;
    optionStats?: Array<{ electionItemId?: string; voteCount?: number }>;
  }>
): number {
  if (myAnswers.length === 0) {
    return 0;
  }

  let totalRate = 0;
  let matched = 0;

  for (const answer of myAnswers) {
    const stat = questionStats.find((s) => s.electionId === answer.electionId);
    if (!stat?.optionStats) {
      continue;
    }
    const totalVotes = stat.optionStats.reduce((sum, o) => sum + (o.voteCount ?? 0), 0);
    if (totalVotes === 0) {
      continue;
    }
    const selected = stat.optionStats.find((o) => o.electionItemId === answer.electionItemId);
    const rate = Math.round(((selected?.voteCount ?? 0) / totalVotes) * 100);
    totalRate += rate;
    matched++;
  }

  return matched === 0 ? 0 : Math.round(totalRate / matched);
}
```

- [ ] **Step 2: `calcGroupSyncRate()` 변경**

`selected` → `electionItemId` 비교:

```typescript
// line 63 변경
if (ansB && ansA.electionItemId === ansB.electionItemId) {
```

- [ ] **Step 3: `calcAllPairChemistry()` 변경**

`selected` → `electionItemId` 비교:

```typescript
// line 93 변경
if (ansB && ansA.electionItemId === ansB.electionItemId) {
```

- [ ] **Step 4: `findUnanimousQuestions()` 변경**

```typescript
// After
export function findUnanimousQuestions(
  result: GroupCompareResult
): Array<{ electionId: string; title: string; unanimousAnswer: string }> {
  const members = result.members ?? [];
  const questionStats = result.questionStats ?? [];
  const unanimous: Array<{ electionId: string; title: string; unanimousAnswer: string }> = [];

  for (const stat of questionStats) {
    const itemIds = members.map(
      (m) => (m.answers ?? []).find((a) => a.electionId === stat.electionId)?.electionItemId
    );
    if (itemIds.length === 0 || itemIds.some((a) => a === undefined)) {
      continue;
    }

    const allSame = itemIds.every((a) => a === itemIds[0]);
    if (allSame) {
      const optionTitle =
        (stat.optionStats ?? []).find((o) => o.electionItemId === itemIds[0])?.title ?? '';
      unanimous.push({
        electionId: stat.electionId ?? '',
        title: stat.title ?? '',
        unanimousAnswer: optionTitle,
      });
    }
  }

  return unanimous;
}
```

- [ ] **Step 5: `findControversyPoints()` 변경**

옵션을 고정 A/B 대신 `optionStats[0]`/`optionStats[1]`로 처리:

```typescript
// After
export function findControversyPoints(result: GroupCompareResult): Array<{
  electionId: string;
  title: string;
  optionA: string;
  optionB: string;
  ratioA: number;
  ratioB: number;
  membersA: ControversyMember[];
  membersB: ControversyMember[];
}> {
  const members = result.members ?? [];
  const questionStats = result.questionStats ?? [];

  const scored = questionStats.map((stat) => {
    const options = stat.optionStats ?? [];
    const optA = options[0];
    const optB = options[1];
    const membersA: ControversyMember[] = [];
    const membersB: ControversyMember[] = [];

    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      const ans = (m.answers ?? []).find((a) => a.electionId === stat.electionId)?.electionItemId;
      if (ans === optA?.electionItemId) {
        membersA.push({ nickname: m.nickname ?? '', memberIndex: i });
      } else if (ans === optB?.electionItemId) {
        membersB.push({ nickname: m.nickname ?? '', memberIndex: i });
      }
    }

    const total = membersA.length + membersB.length;
    const ratioA = total > 0 ? Math.round((membersA.length / total) * 100) : 50;
    const ratioB = 100 - ratioA;
    const distanceFrom50 = Math.abs(ratioA - 50);

    return {
      electionId: stat.electionId ?? '',
      title: stat.title ?? '',
      optionA: optA?.title ?? '',
      optionB: optB?.title ?? '',
      ratioA,
      ratioB,
      membersA,
      membersB,
      distanceFrom50,
    };
  });

  return scored
    .sort((a, b) => a.distanceFrom50 - b.distanceFrom50)
    .slice(0, 3)
    .map(({ distanceFrom50: _, ...rest }) => rest);
}
```

- [ ] **Step 6: `calcGroupAwards()` 내 CONTROVERSY_MAKER 로직 변경**

소수파 판단을 `selected === 'A'` → `electionItemId` 기반으로:

```typescript
// CONTROVERSY_MAKER 블록 (lines 326-358) — 핵심 변경:
const myAnswer = (m.answers ?? []).find((a) => a.electionId === stat.electionId)?.electionItemId;
if (!myAnswer) {
  continue;
}

const options = stat.optionStats ?? [];
const firstOptionId = options[0]?.electionItemId;
const groupAnswers = members
  .map((gm) => (gm.answers ?? []).find((a) => a.electionId === stat.electionId)?.electionItemId)
  .filter((a): a is string => a !== undefined);
const countFirst = groupAnswers.filter((a) => a === firstOptionId).length;
const isMinority =
  (myAnswer === firstOptionId && countFirst < groupAnswers.length / 2) ||
  (myAnswer !== firstOptionId && countFirst > groupAnswers.length / 2);
```

- [ ] **Step 7: `calcGroupAwards()` 내 PEOPLES_CHAMPION 호출부 변경**

```typescript
// lines 361-366 — 타입 캐스팅 변경:
const score = calcPopularityScoreFromCount(
  (m.answers ?? []) as Array<{ electionId: string; electionItemId: string }>,
  questionStats as Array<{
    electionId: string;
    optionStats?: Array<{ electionItemId?: string; voteCount?: number }>;
  }>
);
```

- [ ] **Step 8: `calcValueMapCoordinates()` 변경**

`selected === 'B'` → 두 번째 옵션의 `electionItemId`로 비교:

```typescript
// After — X축 루프 (lines 402-406)
for (const q of xQuestions) {
  const options = q.optionStats ?? [];
  const secondOptionId = options[1]?.electionItemId;
  const ans = memberAnswers.find((a) => a.electionId === q.electionId);
  if (ans?.electionItemId === secondOptionId) {
    xRight++;
  }
}

// Y축 루프도 동일 패턴
for (const q of yQuestions) {
  const options = q.optionStats ?? [];
  const secondOptionId = options[1]?.electionItemId;
  const ans = memberAnswers.find((a) => a.electionId === q.electionId);
  if (ans?.electionItemId === secondOptionId) {
    yUp++;
  }
}
```

---

## Task 5: Mock 데이터 수정 — `src/mocks/data/bundles.ts`

Mock 선택지, 인메모리 스토어, 결과 빌더를 새 구조로 전환.

**Files:**

- Modify: `src/mocks/data/bundles.ts` (전체)

- [ ] **Step 1: `BundleElection` 데이터에 `options[]` 배열 사용**

각 질문의 `optionA`/`optionB` → `options: [{ electionItemId, title }]` 배열로 변경.

```typescript
// Example: love-values 첫 번째 질문
// Before
{ electionId: 'le-1', title: '썸 탈 때', optionA: '먼저 연락', optionB: '기다리기' }

// After
{
  electionId: 'le-1',
  title: '썸 탈 때',
  options: [
    { electionItemId: 'le-1-A', title: '먼저 연락' },
    { electionItemId: 'le-1-B', title: '기다리기' },
  ],
}
```

모든 질문에 동일 패턴 적용. `electionItemId`는 `{electionId}-A`, `{electionId}-B` 컨벤션.

- [ ] **Step 2: `bundleAnswerStore` 타입 변경**

```typescript
// Before
export const bundleAnswerStore = new Map<
  string,
  Array<{ electionId: string; selected: 'A' | 'B' }>
>();

// After
export const bundleAnswerStore = new Map<
  string,
  Array<{ electionId: string; electionItemId: string }>
>();
```

- [ ] **Step 3: `bundleVoteStats` 타입 변경**

```typescript
// Before
export const bundleVoteStats = new Map<string, { optionACount: number; optionBCount: number }>();

// After — electionItemId별 카운트
export const bundleVoteStats = new Map<string, Map<string, number>>();
```

- [ ] **Step 4: `recordBundleAnswers()` 변경**

```typescript
export function recordBundleAnswers(
  userId: string,
  slug: string,
  answers: Array<{ electionId: string; electionItemId: string }>
) {
  bundleAnswerStore.set(`${userId}_${slug}`, answers);
  for (const answer of answers) {
    const stats = bundleVoteStats.get(answer.electionId) ?? new Map<string, number>();
    stats.set(answer.electionItemId, (stats.get(answer.electionItemId) ?? 0) + 1);
    bundleVoteStats.set(answer.electionId, stats);
  }
}
```

- [ ] **Step 5: 시드 데이터 변경**

`seedSecondUser()`, `seedGroupUsers()`, `seedLargeGroupUsers()` 내 모든 `selected: 'A'/'B'` → `electionItemId: '{id}-A'/'{id}-B'`로 변경.

예:

```typescript
// Before
{ electionId: 'le-1', selected: 'A' }
// After
{ electionId: 'le-1', electionItemId: 'le-1-A' }
```

- [ ] **Step 6: `getBundleResult()` 변경**

`myAnswers`와 `questionStats` 응답을 새 구조로:

```typescript
// myAnswers 부분:
myAnswers: answers.map((a) => {
  const election = elections.find((e) => e.electionId === a.electionId);
  return {
    electionId: a.electionId,
    title: election?.title ?? '',
    options: election?.options ?? [],
    selectedElectionItemId: a.electionItemId,
  };
}),

// questionStats 부분:
questionStats: elections.map((e, i) => {
  const stats = bundleVoteStats.get(e.electionId ?? '');
  const options = e.options ?? [];
  const seedRatios = [62, 45, 71, 38, 55, 48, 66, 33, 57, 42];
  const seedA = seedRatios[i] ?? 50;
  return {
    electionId: e.electionId,
    optionStats: options.map((opt, optIdx) => ({
      electionItemId: opt.electionItemId,
      title: opt.title,
      voteCount: stats
        ? (stats.get(opt.electionItemId ?? '') ?? 0)
        : optIdx === 0
          ? seedA
          : 100 - seedA,
    })),
  };
}),
```

---

## Task 6: Mock 데이터 수정 — `src/mocks/data/compare.ts` 및 `group-compare.ts`

**Files:**

- Modify: `src/mocks/data/compare.ts:629-706`
- Modify: `src/mocks/data/group-compare.ts:52-117`

- [ ] **Step 1: `getCompareResult()` 변경**

`me/target.answers`를 `{ electionId, electionItemId }` 형태로, `questionStats`를 `optionStats[]` 형태로 변환.

```typescript
// me/target answers:
answers: meAnswers.map((a) => ({ electionId: a.electionId, electionItemId: a.electionItemId })),

// questionStats:
questionStats: elections.map((e, i) => {
  const stats = bundleVoteStats.get(e.electionId ?? '');
  const options = e.options ?? [];
  const seedRatios = [62, 45, 71, 38, 55, 48, 66, 33, 57, 42];
  const seedA = seedRatios[i] ?? 50;
  return {
    electionId: e.electionId ?? '',
    title: e.title ?? '',
    optionStats: options.map((opt, optIdx) => ({
      electionItemId: opt.electionItemId,
      title: opt.title,
      voteCount: stats
        ? (stats.get(opt.electionItemId ?? '') ?? 0)
        : optIdx === 0
          ? seedA
          : 100 - seedA,
    })),
  };
}),
```

- [ ] **Step 2: `getGroupCompareResult()` 변경**

members 배열의 answers와 questionStats를 새 구조로:

```typescript
// members[].answers:
answers: answers.map((a) => ({ electionId: a.electionId, electionItemId: a.electionItemId })),

// questionStats:
questionStats: elections.map((e, i) => {
  const aRate = seedRatios[i] ?? 50;
  const totalVotes = 500 + i * 100;
  const options = e.options ?? [];
  return {
    electionId: e.electionId ?? '',
    title: e.title ?? '',
    optionStats: options.map((opt, optIdx) => ({
      electionItemId: opt.electionItemId,
      title: opt.title,
      voteCount: optIdx === 0
        ? Math.round((aRate / 100) * totalVotes)
        : Math.round(((100 - aRate) / 100) * totalVotes),
    })),
    axis: axisMap[e.electionId ?? ''] ?? null,
  };
}),
```

- [ ] **Step 3: `generateGhostAnswers()` in CompareResult.tsx 변경 시 참고**

이 함수는 `compare.ts`가 아니라 `CompareResult.tsx`에 있음. Task 9에서 처리.

---

## Task 7: MSW 핸들러 수정 — `src/mocks/handlers.ts`

**Files:**

- Modify: `src/mocks/handlers.ts:1124-1189`

- [ ] **Step 1: 답변 제출 핸들러 변경**

```typescript
// Before (line 1127-1128)
const body = (await request.json()) as {
  answers: Array<{ electionId: string; selected: 'A' | 'B' }>;
};

// After
const body = (await request.json()) as {
  answers: Array<{ electionId: string; electionItemId: string }>;
};
```

- [ ] **Step 2: 하드코딩 목업 결과 변경**

등급 테스트 등 하드코딩 결과의 `myAnswers`와 `questionStats`를 새 구조로:

```typescript
// myAnswers:
myAnswers: elections.map((e, i) => ({
  electionId: e.electionId,
  title: e.title,
  options: e.options ?? [],
  selectedElectionItemId: isGradeTest
    ? (e.options?.[0]?.electionItemId ?? '')
    : (e.options?.[i % 2]?.electionItemId ?? ''),
})),

// questionStats:
questionStats: elections.map((e, i) => ({
  electionId: e.electionId,
  optionStats: (e.options ?? []).map((opt, optIdx) => ({
    electionItemId: opt.electionItemId,
    title: opt.title,
    voteCount: optIdx === 0 ? (seedRatios[i] ?? 50) : 100 - (seedRatios[i] ?? 50),
  })),
})),
```

---

## Task 8: 컴포넌트 수정 — `QuestionCard.tsx` + `BundlePlay.tsx`

번들 풀기 화면의 선택지 렌더링 및 답변 제출을 새 구조로.

**Files:**

- Modify: `src/components/features/Bundle/BundlePlay/QuestionCard.tsx`
- Modify: `src/components/features/Bundle/BundlePlay/BundlePlay.tsx`

- [ ] **Step 1: `QuestionCard.tsx` — `options[]` 배열 렌더링**

```typescript
// Before: Props에서 selected: 'A' | 'B' | null
interface QuestionCardProps {
  election: BundleElection;
  index: number;
  selected: 'A' | 'B' | null;
  onSelect: (choice: 'A' | 'B') => void;
  onBack?: () => void;
}

// After: selected는 electionItemId | null
interface QuestionCardProps {
  election: BundleElection;
  index: number;
  selected: string | null;
  onSelect: (electionItemId: string) => void;
  onBack?: () => void;
}

// 렌더링 부분:
// Before:
//   <span className={styles.optionText}>{election.optionA}</span>
//   onClick={() => onSelect('A')}
//   selected === 'A'

// After:
const options = election.options ?? [];

<div className={styles.options}>
  {options.map((opt, i) => (
    <React.Fragment key={opt.electionItemId}>
      {i > 0 && <span className={styles.or}>or</span>}
      <button
        type="button"
        className={`${styles.option} ${selected === opt.electionItemId ? styles.optionSelected : ''}`}
        onClick={() => onSelect(opt.electionItemId ?? '')}
      >
        <span className={styles.optionText}>{opt.title}</span>
      </button>
    </React.Fragment>
  ))}
</div>
```

- [ ] **Step 2: `BundlePlay.tsx` — 답변 상태 및 제출 변경**

```typescript
// Before (line 59)
const [answers, setAnswers] = useState<Map<string, 'A' | 'B'>>(new Map());

// After — electionId → electionItemId 매핑
const [answers, setAnswers] = useState<Map<string, string>>(new Map());

// handleSelect (line 83-105):
const handleSelect = useCallback(
  (electionItemId: string) => {
    if (!elections) return;
    const election = elections[currentIndex];
    const id = election.electionId ?? '';
    setAnswers((prev) => new Map(prev).set(id, electionItemId));
    trackBundleAnswer(slug, currentIndex, electionItemId);
    // ... 나머지 자동 이동 로직 동일
  },
  [elections, currentIndex]
);

// handleSubmit (line 134-138):
const answerData = elections.map((e) => {
  const id = e.electionId ?? '';
  const electionItemId = answers.get(id);
  return { electionId: id, electionItemId: electionItemId ?? '' };
});
```

---

## Task 9: 컴포넌트 수정 — `BundleResult.tsx`

번들 결과 페이지의 내 답변 렌더링을 새 구조로.

**Files:**

- Modify: `src/components/features/Bundle/BundleResult/BundleResult.tsx`

- [ ] **Step 1: 참여자 수 표시 변경 (line 202-204)**

```typescript
// Before
{
  questionStats[0]
    ? (questionStats[0].optionACount ?? 0) + (questionStats[0].optionBCount ?? 0)
    : 0;
}

// After
{
  questionStats[0]?.optionStats
    ? questionStats[0].optionStats.reduce((sum, o) => sum + (o.voteCount ?? 0), 0)
    : 0;
}
```

- [ ] **Step 2: 내 답변 카드 렌더링 변경 (lines 219-295)**

```typescript
{myAnswers.map((answer, idx) => {
  const stat = questionStats.find((s) => s.electionId === answer.electionId);
  const options = stat?.optionStats ?? [];
  const totalVotes = options.reduce((sum, o) => sum + (o.voteCount ?? 0), 0);

  const selectedOption = options.find(
    (o) => o.electionItemId === answer.selectedElectionItemId
  );
  const selectedRate =
    totalVotes > 0
      ? Math.round(((selectedOption?.voteCount ?? 0) / totalVotes) * 100)
      : 50;
  const isMajority = selectedRate >= 50;

  return (
    <div key={answer.electionId} className={styles.answerCard} style={{ '--i': idx } as React.CSSProperties}>
      <div className={styles.answerHeader}>
        <div>
          <div className={styles.questionIndex}>Q{idx + 1}</div>
          <span className={styles.answerQuestion}>{answer.title}</span>
        </div>
        <span className={`${styles.answerBadge} ${isMajority ? styles.majorityBadge : styles.minorityBadge}`}>
          {isMajority ? '다수파' : '소수파'}
        </span>
      </div>

      <div className={styles.voteOptions}>
        {(answer.options ?? []).map((opt) => {
          const optStat = options.find((o) => o.electionItemId === opt.electionItemId);
          const rate = totalVotes > 0 ? Math.round(((optStat?.voteCount ?? 0) / totalVotes) * 100) : 50;
          const isSelected = opt.electionItemId === answer.selectedElectionItemId;

          return (
            <div key={opt.electionItemId} className={styles.optionRow}>
              <button
                type="button"
                className={`${styles.optionLabel} ${isSelected ? styles.optionLabelSelected : ''}`}
                onClick={(e) => {
                  const el = e.currentTarget;
                  if (el.scrollWidth > el.clientWidth) {
                    showToast(opt.title ?? '');
                  }
                }}
              >
                {opt.title}
              </button>
              <div className={styles.optionBarTrack}>
                <div
                  className={`${styles.optionBarFill} ${isSelected ? styles.myFill : ''}`}
                  style={{ width: `${rate}%`, '--i': idx } as React.CSSProperties}
                >
                  <span className={styles.optionPercent}>{rate}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
})}
```

---

## Task 10: 컴포넌트 수정 — `CompareResult.tsx`

프리뷰 데이터 생성 로직 변경.

**Files:**

- Modify: `src/components/features/Compare/CompareResult/CompareResult.tsx`

- [ ] **Step 1: `generateGhostAnswers()` 변경**

```typescript
// Before
function generateGhostAnswers(
  myAnswers: Array<{ electionId: string; selected: string }>,
  seed: number
): Array<{ electionId: string; selected: string }> {
  return myAnswers.map((a, i) => ({
    electionId: a.electionId,
    selected: (seed + i) % 3 === 0 ? a.selected : a.selected === 'A' ? 'B' : 'A',
  }));
}

// After
function generateGhostAnswers(
  myAnswers: Array<{
    electionId: string;
    electionItemId: string;
    options: Array<{ electionItemId?: string }>;
  }>,
  seed: number
): Array<{ electionId: string; electionItemId: string }> {
  return myAnswers.map((a, i) => {
    if ((seed + i) % 3 === 0) {
      return { electionId: a.electionId, electionItemId: a.electionItemId };
    }
    // 다른 옵션 선택
    const other = a.options.find((o) => o.electionItemId !== a.electionItemId);
    return { electionId: a.electionId, electionItemId: other?.electionItemId ?? a.electionItemId };
  });
}
```

- [ ] **Step 2: 프리뷰 결과 생성 로직 변경 (lines 84-127)**

`myAnswers`, `ghostAnswers`, `questionStats` 생성을 새 구조로. `selected` → `electionItemId`, `optionA/B/Count` → `optionStats[]`.

```typescript
const rawAnswers = myBundleResult.myAnswers ?? [];
const rawStats = myBundleResult.questionStats ?? [];

const myAnswers = rawAnswers.map((a) => ({
  electionId: a.electionId ?? '',
  electionItemId: a.selectedElectionItemId ?? '',
  options: a.options ?? [],
}));
const ghostAnswers = generateGhostAnswers(myAnswers, 42);

let matchCount = 0;
for (const my of myAnswers) {
  const ghost = ghostAnswers.find((g) => g.electionId === my.electionId);
  if (ghost && my.electionItemId === ghost.electionItemId) {
    matchCount++;
  }
}

return {
  bundleSlug: myBundleResult.bundleSlug ?? '',
  bundleTitle: myBundleResult.bundleTitle ?? '',
  totalQuestions: myBundleResult.totalQuestions ?? rawAnswers.length,
  categoryCode: link.categoryCode,
  me: {
    nickname: link.creatorNickname ?? '',
    answers: myAnswers.map((a) => ({ electionId: a.electionId, electionItemId: a.electionItemId })),
  },
  target: { nickname: '???', answers: ghostAnswers },
  questionStats: rawStats,
  matchCount,
  matchRate: myAnswers.length > 0 ? Math.round((matchCount / myAnswers.length) * 100) : 0,
};
```

---

## Task 11: 컴포넌트 수정 — `PersonDetailSheet.tsx` + `PopularityCompare.tsx`

**Files:**

- Modify: `src/components/features/Compare/CompareResult/PersonDetailSheet.tsx`
- Modify: `src/components/features/Compare/CompareResult/PopularityCompare.tsx`

- [ ] **Step 1: `PersonDetailSheet.tsx` 변경**

`optionACount`/`optionBCount` → `optionStats[]`, `answer.selected` → `answer.electionItemId`:

```typescript
// lines 99-145 변경:
const options = stat.optionStats ?? [];
const totalVotes = options.reduce((sum, o) => sum + (o.voteCount ?? 0), 0);

const selectedOption = options.find((o) => o.electionItemId === answer.electionItemId);
const selectedRate = totalVotes > 0 ? Math.round(((selectedOption?.voteCount ?? 0) / totalVotes) * 100) : 50;
const isMajority = selectedRate >= 50;

// 옵션 렌더링을 배열 기반으로:
{options.map((opt) => {
  const rate = totalVotes > 0 ? Math.round(((opt.voteCount ?? 0) / totalVotes) * 100) : 50;
  const isSelected = opt.electionItemId === answer.electionItemId;
  return (
    <div key={opt.electionItemId} className={styles.optionRow}>
      <span className={styles.optionLabel}>{opt.title}</span>
      <div className={styles.optionBarTrack}>
        <div
          className={`${styles.optionBarFill} ${isSelected ? styles.myFill : ''}`}
          style={{ width: `${rate}%` }}
        >
          <span className={styles.optionPercent}>{rate}%</span>
        </div>
      </div>
    </div>
  );
})}
```

- [ ] **Step 2: `PopularityCompare.tsx` 참여자 수 표시 변경**

```typescript
// Before (line 35)
{
  questionStats[0]
    ? (questionStats[0].optionACount ?? 0) + (questionStats[0].optionBCount ?? 0)
    : 0;
}

// After
{
  questionStats[0]?.optionStats
    ? questionStats[0].optionStats.reduce((sum, o) => sum + (o.voteCount ?? 0), 0)
    : 0;
}
```

---

## Task 12: 컴포넌트 수정 — `ShockPoint.tsx`

**Files:**

- Modify: `src/components/features/Compare/CompareResult/ShockPoint.tsx`

- [ ] **Step 1: `ShockPointData`가 변경되었으므로 `optionA`/`optionB` 대신 `myOptionText`/`targetOptionText` 직접 사용**

```typescript
// Before (lines 13-14)
const myOptionText = data.mySelected === 'A' ? data.optionA : data.optionB;
const targetOptionText = data.targetSelected === 'A' ? data.optionA : data.optionB;

// After — 이미 텍스트로 제공됨
const myOptionText = data.myOptionText;
const targetOptionText = data.targetOptionText;
```

---

## Task 13: 컴포넌트 수정 — 그룹 결과 컴포넌트들

**Files:**

- Modify: `src/components/features/Compare/GroupResult/PickASide.tsx`
- Modify: `src/components/features/Compare/GroupResult/GenderBattle.tsx`
- Modify: `src/components/features/Compare/GroupResult/PopularitySpectrum.tsx`
- Modify: `src/components/features/Compare/GroupResult/RelationExplorer.tsx`

- [ ] **Step 1: `PickASide.tsx` — `selected` → `electionItemId` 매칭**

```typescript
// lines 261-289: stackA/stackB 필터링 변경
const options = question.optionStats ?? [];
const optA = options[0];
const optB = options[1];

const stackA: StackMember[] = (result.members ?? [])
  .filter((m) =>
    (m.answers ?? []).some(
      (a) => a.electionId === question.electionId && a.electionItemId === optA?.electionItemId
    )
  )
  // ... .map 동일

const stackB: StackMember[] = (result.members ?? [])
  .filter((m) =>
    (m.answers ?? []).some(
      (a) => a.electionId === question.electionId && a.electionItemId === optB?.electionItemId
    )
  )
  // ... .map 동일

// lines 306, 314: optionA/B 텍스트
<span className={styles.optionName}>{optA?.title ?? ''}</span>
// ...
<span className={styles.optionName}>{optB?.title ?? ''}</span>
```

- [ ] **Step 2: `GenderBattle.tsx` — `selected` → `electionItemId` 매칭**

```typescript
// lines 35-67 변경:
const stats: GenderQuestionStat[] = (result.questionStats ?? []).map((q) => {
  const options = q.optionStats ?? [];
  const optA = options[0];
  const optB = options[1];

  const maleAnswers = males
    .map((m) => (m.answers ?? []).find((a) => a.electionId === q.electionId))
    .filter(Boolean);
  const femaleAnswers = females
    .map((m) => (m.answers ?? []).find((a) => a.electionId === q.electionId))
    .filter(Boolean);

  const maleACount = maleAnswers.filter((a) => a?.electionItemId === optA?.electionItemId).length;
  const femaleACount = femaleAnswers.filter(
    (a) => a?.electionItemId === optA?.electionItemId
  ).length;
  // ... 나머지 로직 동일

  return {
    electionId: q.electionId ?? '',
    title: q.title ?? '',
    optionA: optA?.title ?? '',
    optionB: optB?.title ?? '',
    // ...rates 동일
  };
});
```

- [ ] **Step 3: `PopularitySpectrum.tsx` — `optionACount`/`optionBCount` → `optionStats[]`**

```typescript
// calcMemberPopularityScores 내부 (lines 33-58):
for (const answer of member.answers ?? []) {
  const stat = (result.questionStats ?? []).find((s) => s.electionId === answer.electionId);
  if (!stat?.optionStats) {
    continue;
  }
  const totalVotes = stat.optionStats.reduce((sum, o) => sum + (o.voteCount ?? 0), 0);
  if (totalVotes === 0) {
    continue;
  }
  const selected = stat.optionStats.find((o) => o.electionItemId === answer.electionItemId);
  const rate = Math.round(((selected?.voteCount ?? 0) / totalVotes) * 100);
  totalRate += rate;
  matched++;
}
```

- [ ] **Step 4: `RelationExplorer.tsx` — `selected` → `electionItemId`, `optionA`/`optionB` → `optionStats[]`**

```typescript
// questionComparison (lines 80-97):
return questionStats.map((q) => {
  const options = q.optionStats ?? [];
  const answerA = (memberA.answers ?? []).find((a) => a.electionId === q.electionId);
  const answerB = (memberB.answers ?? []).find((a) => a.electionId === q.electionId);
  const selectedA = answerA?.electionItemId ?? null;
  const selectedB = answerB?.electionItemId ?? null;
  const isMatch = selectedA !== null && selectedB !== null && selectedA === selectedB;

  return {
    electionId: q.electionId ?? '',
    title: q.title ?? '',
    options,
    selectedA,
    selectedB,
    isMatch,
  };
});

// getDisplayLabel 변경 (line 118):
const getDisplayLabel = (itemId: string, options: (typeof questionStats)[0]['optionStats']) =>
  (options ?? []).find((o) => o.electionItemId === itemId)?.title ?? '';

// 렌더링에서:
{
  q.selectedA ? getDisplayLabel(q.selectedA, q.options) : '-';
}
{
  q.selectedB ? getDisplayLabel(q.selectedB, q.options) : '-';
}
```

---

## Task 14: `AnswerStoryData.different`의 `mySelected`/`targetSelected` 제거 확인

`AnswerComparison.tsx`가 이 필드들을 사용하는지 확인 — 읽은 코드 기준 사용하지 않으므로 코드 변경 불필요.

**Files:**

- Verify: `src/components/features/Compare/CompareResult/AnswerComparison.tsx`

- [ ] **Step 1: 사용하지 않는 필드 확인**

`AnswerComparison.tsx`는 `item.myOptionText`, `item.targetOptionText`, `item.myRate`, `item.targetRate`만 사용.
`item.mySelected`, `item.targetSelected`는 사용하지 않음 → Task 3에서 제거한 것이 안전.

---

## Task 15: 빌드 검증 및 커밋

- [ ] **Step 1: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 2: 빌드**

Run: `npm run build`
Expected: 성공

- [ ] **Step 3: 사용자에게 확인 후 커밋**

변경사항 요약 제시 후 사용자 승인을 받아 커밋.
