# 번들 1:1 비교 시스템 구현 계획 (Plan 2/2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 번들 결과 페이지에서 1:1 비교 링크 생성/공유 → 비교 링크 랜딩 → 1:1 비교 결과 페이지까지의 MVP 전체 플로우를 MSW 기반으로 구현

**Architecture:** Next.js App Router 페이지 2개(비교 랜딩/비교 결과) + 결과 페이지 CTA 추가 + 비교 전용 타입/상수/MSW/훅. 서버는 matchRate(숫자)와 질문별 투표 비율만 리턴하고, 케미 등급/충격 포인트/스토리텔링 매핑은 모두 FE 상수로 관리.

**Plan 분할:** Plan 1(완료)에서 번들 코어 플로우(인트로→풀기→결과) 구현. 이 Plan 2에서 1:1 비교 시스템 구현.

**Tech Stack:** Next.js 14 (App Router), TypeScript, SCSS Modules, React Query v5, MSW, framer-motion

**참조 문서:**

- 기획서: `docs/specs/bundle-compare.md` (섹션 4.3, 5.1~5.3, 5.5, 6, 8.2~8.4)
- 기존 코드: `src/types/bundle.ts`, `src/constants/bundle.ts`, `src/hooks/api/useBundle.ts`
- 기존 MSW: `src/mocks/data/bundles.ts`, `src/mocks/handlers.ts`

---

## 파일 구조

### 신규 생성

```
src/types/compare.ts                                              — 비교 전용 타입
src/constants/compare.ts                                          — 충격 포인트/스토리텔링 FE 매핑 유틸
src/mocks/data/compare.ts                                         — 비교 링크 MSW 목 데이터
src/hooks/api/useCompare.ts                                       — 비교 API React Query 훅
src/app/compare/[token]/page.tsx                                  — 비교 링크 랜딩 페이지
src/components/features/Compare/CompareLanding/CompareLanding.tsx  — 랜딩 클라이언트 컴포넌트
src/components/features/Compare/CompareLanding/CompareLanding.module.scss
src/app/compare/[token]/result/page.tsx                           — 1:1 비교 결과 페이지
src/components/features/Compare/CompareResult/CompareResult.tsx    — 비교 결과 클라이언트 컴포넌트
src/components/features/Compare/CompareResult/CompareResult.module.scss
src/components/features/Compare/CompareResult/ChemistryCard.tsx    — 케미 등급 카드
src/components/features/Compare/CompareResult/ChemistryCard.module.scss
src/components/features/Compare/CompareResult/ShockPoint.tsx       — 충격 포인트 섹션
src/components/features/Compare/CompareResult/ShockPoint.module.scss
src/components/features/Compare/CompareResult/AnswerComparison.tsx — 같은 편/갈린 순간 아코디언
src/components/features/Compare/CompareResult/AnswerComparison.module.scss
src/components/features/Compare/CompareResult/PopularityCompare.tsx — 대중성 비교 섹션
src/components/features/Compare/CompareResult/PopularityCompare.module.scss
src/components/features/Bundle/BundleResult/CreateCompareLink.tsx   — 비교 링크 생성 모달
src/components/features/Bundle/BundleResult/CreateCompareLink.module.scss
```

### 수정

```
src/components/features/Bundle/BundleResult/BundleResult.tsx       — "1:1 비교하기" CTA 추가
src/mocks/handlers.ts                                              — 비교 API 핸들러 추가
src/mocks/data/bundles.ts                                          — 비교용 2번째 유저 답변 추가
```

---

## Task 1: 비교 전용 타입 정의

**Files:**

- Create: `src/types/compare.ts`

- [ ] **Step 1: 비교 타입 파일 생성**

```typescript
// src/types/compare.ts

/**
 * 비교 링크 타입
 */
export type CompareLinkType = 'ONE_TO_ONE' | 'GROUP';

/**
 * 비교 링크 정보 (랜딩 페이지용)
 */
export interface CompareLink {
  token: string;
  type: CompareLinkType;
  bundleSlug: string;
  bundleTitle: string;
  /** 링크 생성자 닉네임 */
  creatorNickname: string;
  /** 참여자 닉네임 (1:1 전용, 아직 없으면 null) */
  participantNickname: string | null;
  /** 현재 로그인 유저가 생성자인지 */
  isCreator: boolean;
  /** 현재 로그인 유저가 참여자인지 */
  isParticipant: boolean;
  /** 현재 로그인 유저의 번들 완료 여부 */
  myBundleCompleted: boolean;
  /** 비교 가능 여부 (둘 다 완료) */
  compareReady: boolean;
  status: 'WAITING' | 'COMPLETED' | 'CLOSED';
}

/**
 * 비교 링크 생성 요청
 */
export interface CreateCompareLinkRequest {
  type: CompareLinkType;
  /** 그룹 비교 시 그룹 이름 (1:1은 불필요) */
  groupName?: string;
}

/**
 * 비교 링크 생성 응답
 */
export interface CreateCompareLinkResponse {
  token: string;
  shareUrl: string;
}

/**
 * 1:1 비교 결과 (서버 응답)
 * 서버는 숫자만 리턴. 등급/캐릭터/문구/스토리텔링은 FE에서 매핑.
 */
export interface CompareResult {
  bundleSlug: string;
  bundleTitle: string;
  totalQuestions: number;

  me: {
    nickname: string;
    answers: Array<{ electionId: string; selected: 'A' | 'B' }>;
  };

  target: {
    nickname: string;
    answers: Array<{ electionId: string; selected: 'A' | 'B' }>;
  };

  /** 각 질문별 현재 투표 비율 (실시간 변동) */
  questionStats: Array<{
    electionId: string;
    title: string;
    optionA: string;
    optionB: string;
    optionARate: number;
    optionBRate: number;
    totalVotes: number;
  }>;

  matchCount: number;
  matchRate: number;
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/types/compare.ts
git commit -m "feat(compare): 비교 전용 타입 정의"
```

---

## Task 2: 충격 포인트 / 스토리텔링 FE 매핑 유틸

**Files:**

- Create: `src/constants/compare.ts`

- [ ] **Step 1: 비교 매핑 유틸 파일 생성**

```typescript
// src/constants/compare.ts
import type { CompareResult } from '@/types/compare';

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

  if (differentAnswers.length === 0) return null;

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
  }>;
  different: Array<{
    electionId: string;
    title: string;
    mySelected: string;
    targetSelected: string;
    myOptionText: string;
    targetOptionText: string;
  }>;
}

export function classifyAnswers(result: CompareResult): AnswerStoryData {
  const same: AnswerStoryData['same'] = [];
  const different: AnswerStoryData['different'] = [];

  for (const stat of result.questionStats) {
    const myAnswer = result.me.answers.find((a) => a.electionId === stat.electionId);
    const targetAnswer = result.target.answers.find((a) => a.electionId === stat.electionId);
    if (!myAnswer || !targetAnswer) continue;

    if (myAnswer.selected === targetAnswer.selected) {
      same.push({
        electionId: stat.electionId,
        title: stat.title,
        selected: myAnswer.selected === 'A' ? stat.optionA : stat.optionB,
      });
    } else {
      different.push({
        electionId: stat.electionId,
        title: stat.title,
        mySelected: myAnswer.selected,
        targetSelected: targetAnswer.selected,
        myOptionText: myAnswer.selected === 'A' ? stat.optionA : stat.optionB,
        targetOptionText: targetAnswer.selected === 'A' ? stat.optionA : stat.optionB,
      });
    }
  }

  return { same, different };
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/constants/compare.ts
git commit -m "feat(compare): 충격 포인트/스토리텔링 FE 매핑 유틸"
```

---

## Task 3: MSW 비교 목 데이터

**Files:**

- Create: `src/mocks/data/compare.ts`
- Modify: `src/mocks/data/bundles.ts`

- [ ] **Step 1: bundles.ts에 2번째 유저 답변 시드 추가**

`src/mocks/data/bundles.ts` 파일 최하단에 추가:

```typescript
/**
 * 비교용 mock 유저 — 'mock-user-2'로 love-values 번들 미리 답변
 * compare 랜딩에서 "이미 완료" 시나리오 테스트용
 */
export function seedSecondUser() {
  const slug = 'love-values';
  const userId = 'mock-user-2';
  if (bundleAnswerStore.has(`${userId}_${slug}`)) return;
  recordBundleAnswers(userId, slug, [
    { electionId: 'le-1', selected: 'B' },
    { electionId: 'le-2', selected: 'A' },
    { electionId: 'le-3', selected: 'A' },
    { electionId: 'le-4', selected: 'B' },
    { electionId: 'le-5', selected: 'A' },
  ]);
}
```

- [ ] **Step 2: compare.ts 목 데이터 생성**

```typescript
// src/mocks/data/compare.ts
import type { CompareLink, CompareResult, CreateCompareLinkResponse } from '@/types/compare';

import {
  bundleAnswerStore,
  bundleVoteStats,
  mockBundleDetails,
  mockBundleElections,
  seedSecondUser,
} from './bundles';

/** 비교 링크 인메모리 저장소 */
interface StoredCompareLink {
  token: string;
  type: 'ONE_TO_ONE' | 'GROUP';
  bundleSlug: string;
  creatorUserId: string;
  creatorNickname: string;
  participantUserId: string | null;
  participantNickname: string | null;
  status: 'WAITING' | 'COMPLETED' | 'CLOSED';
}

const compareLinkStore = new Map<string, StoredCompareLink>();

// 시드: mock-user-1이 love-values에 대한 1:1 비교 링크 생성
seedSecondUser();

const seedLink: StoredCompareLink = {
  token: 'abc123',
  type: 'ONE_TO_ONE',
  bundleSlug: 'love-values',
  creatorUserId: 'mock-user-1',
  creatorNickname: '웅이',
  participantUserId: null,
  participantNickname: null,
  status: 'WAITING',
};
compareLinkStore.set('abc123', seedLink);

/** 토큰 생성 */
function generateToken(): string {
  return Math.random().toString(36).substring(2, 10);
}

/** 비교 링크 생성 */
export function createCompareLink(
  userId: string,
  nickname: string,
  bundleSlug: string,
  type: 'ONE_TO_ONE' | 'GROUP'
): CreateCompareLinkResponse {
  const token = generateToken();
  compareLinkStore.set(token, {
    token,
    type,
    bundleSlug,
    creatorUserId: userId,
    creatorNickname: nickname,
    participantUserId: null,
    participantNickname: null,
    status: 'WAITING',
  });
  return {
    token,
    shareUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/compare/${token}`,
  };
}

/** 비교 링크 조회 */
export function getCompareLink(token: string, currentUserId: string): CompareLink | null {
  const link = compareLinkStore.get(token);
  if (!link) return null;

  const detail = mockBundleDetails[link.bundleSlug];
  const myCompleted = !!bundleAnswerStore.get(`${currentUserId}_${link.bundleSlug}`);

  return {
    token: link.token,
    type: link.type,
    bundleSlug: link.bundleSlug,
    bundleTitle: detail?.title ?? link.bundleSlug,
    creatorNickname: link.creatorNickname,
    participantNickname: link.participantNickname,
    isCreator: link.creatorUserId === currentUserId,
    isParticipant: link.participantUserId === currentUserId,
    myBundleCompleted: myCompleted,
    compareReady: link.status === 'COMPLETED',
    status: link.status,
  };
}

/** 비교 링크에 참여 */
export function joinCompareLink(
  token: string,
  userId: string,
  nickname: string
): { success: boolean; message: string } {
  const link = compareLinkStore.get(token);
  if (!link) return { success: false, message: '링크를 찾을 수 없습니다' };
  if (link.creatorUserId === userId)
    return { success: false, message: '자신의 링크에 참여할 수 없습니다' };
  if (link.participantUserId && link.participantUserId !== userId) {
    return { success: false, message: '이미 다른 사람이 참여한 링크입니다' };
  }

  // 번들 완료 확인
  if (!bundleAnswerStore.has(`${userId}_${link.bundleSlug}`)) {
    return { success: false, message: '번들을 먼저 완료해주세요' };
  }

  link.participantUserId = userId;
  link.participantNickname = nickname;
  link.status = 'COMPLETED';
  return { success: true, message: '참여 완료' };
}

/** 1:1 비교 결과 생성 */
export function getCompareResult(token: string, currentUserId: string): CompareResult | null {
  const link = compareLinkStore.get(token);
  if (!link || link.status !== 'COMPLETED') return null;
  if (!link.participantUserId) return null;

  const elections = mockBundleElections[link.bundleSlug];
  if (!elections) return null;

  const detail = mockBundleDetails[link.bundleSlug];

  const creatorAnswers = bundleAnswerStore.get(`${link.creatorUserId}_${link.bundleSlug}`);
  const participantAnswers = bundleAnswerStore.get(`${link.participantUserId}_${link.bundleSlug}`);
  if (!creatorAnswers || !participantAnswers) return null;

  // 현재 유저 기준으로 me/target 설정
  const isCreator = currentUserId === link.creatorUserId;
  const meAnswers = isCreator ? creatorAnswers : participantAnswers;
  const targetAnswers = isCreator ? participantAnswers : creatorAnswers;
  const meNickname = isCreator ? link.creatorNickname : link.participantNickname!;
  const targetNickname = isCreator ? link.participantNickname! : link.creatorNickname;

  // 일치 수 계산
  let matchCount = 0;
  for (const me of meAnswers) {
    const target = targetAnswers.find((t) => t.electionId === me.electionId);
    if (target && me.selected === target.selected) matchCount++;
  }

  const seedRatios = [62, 45, 71, 38, 55, 48, 66, 33, 57, 42];

  return {
    bundleSlug: link.bundleSlug,
    bundleTitle: detail?.title ?? link.bundleSlug,
    totalQuestions: elections.length,
    me: {
      nickname: meNickname,
      answers: meAnswers.map((a) => ({ electionId: a.electionId, selected: a.selected })),
    },
    target: {
      nickname: targetNickname,
      answers: targetAnswers.map((a) => ({ electionId: a.electionId, selected: a.selected })),
    },
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
      };
    }),
    matchCount,
    matchRate: Math.round((matchCount / elections.length) * 100),
  };
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/mocks/data/compare.ts src/mocks/data/bundles.ts
git commit -m "feat(compare): MSW 비교 목 데이터"
```

---

## Task 4: MSW 비교 API 핸들러

**Files:**

- Modify: `src/mocks/handlers.ts`

- [ ] **Step 1: handlers.ts 상단에 import 추가**

기존 bundles import 블록 뒤에 추가:

```typescript
import {
  createCompareLink,
  getCompareLink,
  joinCompareLink,
  getCompareResult,
} from '@/mocks/data/compare';
```

- [ ] **Step 2: 핸들러 배열 마지막 항목 뒤에 비교 API 핸들러 추가**

`handlers` 배열의 마지막 항목(번들 my-result 핸들러) 뒤에 추가:

```typescript
  // ─── 비교 API ───

  /** POST /api/v1/bundles/{slug}/compare-links — 비교 링크 생성 */
  http.post(`${baseURL}/api/v1/bundles/:slug/compare-links`, async ({ params, request }) => {
    const slug = params.slug as string;
    const body = (await request.json()) as { type: 'ONE_TO_ONE' | 'GROUP'; groupName?: string };
    const result = createCompareLink('mock-user-1', '웅이', slug, body.type);
    return HttpResponse.json({ code: 'SUCCESS', message: '비교 링크가 생성되었습니다', data: result });
  }),

  /** GET /api/v1/compare-links/{token} — 비교 링크 정보 조회 */
  http.get(`${baseURL}/api/v1/compare-links/:token`, ({ params }) => {
    const token = params.token as string;
    const link = getCompareLink(token, 'mock-user-1');
    if (!link) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '비교 링크를 찾을 수 없습니다', data: null },
        { status: 404 }
      );
    }
    return HttpResponse.json({ code: 'SUCCESS', message: '성공', data: link });
  }),

  /** POST /api/v1/compare-links/{token}/join — 비교 링크 참여 */
  http.post(`${baseURL}/api/v1/compare-links/:token/join`, ({ params }) => {
    const token = params.token as string;
    // MSW에서는 mock-user-2로 참여 시뮬레이션
    const result = joinCompareLink(token, 'mock-user-2', '수진');
    if (!result.success) {
      return HttpResponse.json(
        { code: 'BAD_REQUEST', message: result.message, data: null },
        { status: 400 }
      );
    }
    return HttpResponse.json({ code: 'SUCCESS', message: result.message, data: { joined: true } });
  }),

  /** GET /api/v1/compare-links/{token}/result — 1:1 비교 결과 */
  http.get(`${baseURL}/api/v1/compare-links/:token/result`, ({ params }) => {
    const token = params.token as string;
    const result = getCompareResult(token, 'mock-user-1');
    if (!result) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '비교 결과를 찾을 수 없습니다', data: null },
        { status: 404 }
      );
    }
    return HttpResponse.json({ code: 'SUCCESS', message: '성공', data: result });
  }),
```

- [ ] **Step 3: 커밋**

```bash
git add src/mocks/handlers.ts
git commit -m "feat(compare): MSW 비교 API 핸들러 추가"
```

---

## Task 5: 비교 React Query 훅

**Files:**

- Create: `src/hooks/api/useCompare.ts`

- [ ] **Step 1: 비교 훅 파일 생성**

```typescript
// src/hooks/api/useCompare.ts
import { queryOptions, useQuery, useMutation } from '@tanstack/react-query';

import { customInstance } from '@/lib/axios-mutator';
import type {
  CompareLink,
  CompareResult,
  CreateCompareLinkRequest,
  CreateCompareLinkResponse,
} from '@/types/compare';

/**
 * Compare Query Keys
 */
export const compareKeys = {
  all: ['compare'] as const,
  link: (token: string) => [...compareKeys.all, 'link', token] as const,
  result: (token: string) => [...compareKeys.all, 'result', token] as const,
};

/**
 * Query Options
 */
export const compareQueries = {
  link: (token: string) =>
    queryOptions<CompareLink | null>({
      queryKey: compareKeys.link(token),
      queryFn: () =>
        customInstance<CompareLink>({
          url: `/api/v1/compare-links/${token}`,
          method: 'GET',
        }),
      staleTime: 30 * 1000,
    }),

  result: (token: string) =>
    queryOptions<CompareResult | null>({
      queryKey: compareKeys.result(token),
      queryFn: () =>
        customInstance<CompareResult>({
          url: `/api/v1/compare-links/${token}/result`,
          method: 'GET',
        }),
      staleTime: 0,
    }),
};

/**
 * Hooks
 */
export const useCompareLink = (token: string) =>
  useQuery({
    ...compareQueries.link(token),
    enabled: !!token,
  });

export const useCompareResult = (token: string) =>
  useQuery({
    ...compareQueries.result(token),
    enabled: !!token,
  });

export const useCreateCompareLink = (slug: string) =>
  useMutation({
    mutationFn: (data: CreateCompareLinkRequest) =>
      customInstance<CreateCompareLinkResponse>({
        url: `/api/v1/bundles/${slug}/compare-links`,
        method: 'POST',
        data,
        headers: { 'Content-Type': 'application/json' },
      }),
  });

export const useJoinCompareLink = (token: string) =>
  useMutation({
    mutationFn: () =>
      customInstance({
        url: `/api/v1/compare-links/${token}/join`,
        method: 'POST',
      }),
  });
```

- [ ] **Step 2: 커밋**

```bash
git add src/hooks/api/useCompare.ts
git commit -m "feat(compare): 비교 React Query 훅"
```

---

## Task 6: 결과 페이지에 "1:1 비교하기" CTA 추가

**Files:**

- Create: `src/components/features/Bundle/BundleResult/CreateCompareLink.tsx`
- Create: `src/components/features/Bundle/BundleResult/CreateCompareLink.module.scss`
- Modify: `src/components/features/Bundle/BundleResult/BundleResult.tsx`

- [ ] **Step 1: CreateCompareLink SCSS 생성**

```scss
// src/components/features/Bundle/BundleResult/CreateCompareLink.module.scss
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

.kakaoButton {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: $border-radius-lg;
  background: #fee500;
  color: #191919;
  font-size: $font-size-14;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
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

- [ ] **Step 2: CreateCompareLink 컴포넌트 생성**

```tsx
// src/components/features/Bundle/BundleResult/CreateCompareLink.tsx
'use client';

import { useState, type FC } from 'react';

import { Toast } from '@/components/common/Toast/Toast';
import { useCreateCompareLink } from '@/hooks/api/useCompare';
import { useToast } from '@/hooks/useToast';

import styles from './CreateCompareLink.module.scss';

interface CreateCompareLinkProps {
  slug: string;
  onClose: () => void;
}

export const CreateCompareLink: FC<CreateCompareLinkProps> = ({ slug, onClose }) => {
  const createMutation = useCreateCompareLink(slug);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const { toast, showToast } = useToast();

  const handleCreate = async () => {
    try {
      const result = await createMutation.mutateAsync({ type: 'ONE_TO_ONE' });
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
            <h2 className={styles.title}>1:1 비교하기</h2>
            <p className={styles.description}>
              비교 링크를 만들어 친구에게 공유하면,
              <br />
              서로의 가치관을 비교할 수 있어요!
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.kakaoButton}
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? '생성 중...' : '비교 링크 만들기'}
              </button>
              <button type="button" className={styles.closeButton} onClick={onClose}>
                닫기
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className={styles.title}>링크가 생성되었어요!</h2>
            <p className={styles.description}>
              아래 링크를 친구에게 보내면
              <br />
              비교 결과를 확인할 수 있어요
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

- [ ] **Step 3: BundleResult.tsx에 비교 CTA 추가**

`src/components/features/Bundle/BundleResult/BundleResult.tsx`에서:

1. 상단 import에 추가:

```typescript
import { useState } from 'react';
import { CreateCompareLink } from './CreateCompareLink';
```

기존 `import { useEffect, type FC } from 'react';`를 `import { useEffect, useState, type FC } from 'react';`로 변경.

2. `BundleResult` 컴포넌트 내부, `const router = useRouter();` 다음에 state 추가:

```typescript
const [showCompareModal, setShowCompareModal] = useState(false);
```

3. CTA 섹션 변경 — 기존 `{/* ═══ CTA ═══ */}` 블록을 교체:

```tsx
{
  /* ═══ CTA ═══ */
}
<div className={styles.ctaSection}>
  <button type="button" className={styles.ctaButton} onClick={() => setShowCompareModal(true)}>
    1:1 비교하기
  </button>
  <button type="button" className={styles.secondaryCta} onClick={() => router.push('/')}>
    메인으로 돌아가기
  </button>
</div>;
```

4. `<Toast ... />` 바로 뒤, `</BundleBackground>` 전에 추가:

```tsx
{
  showCompareModal && <CreateCompareLink slug={slug} onClose={() => setShowCompareModal(false)} />;
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/components/features/Bundle/BundleResult/
git commit -m "feat(compare): 결과 페이지에 1:1 비교 링크 생성 CTA/모달 추가"
```

---

## Task 7: 비교 링크 랜딩 페이지

**Files:**

- Create: `src/app/compare/[token]/page.tsx`
- Create: `src/components/features/Compare/CompareLanding/CompareLanding.tsx`
- Create: `src/components/features/Compare/CompareLanding/CompareLanding.module.scss`

- [ ] **Step 1: CompareLanding SCSS 생성**

```scss
// src/components/features/Compare/CompareLanding/CompareLanding.module.scss
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;

.container {
  @include flex-column;
  align-items: center;
  min-height: 100dvh;
  padding: calc(56px + 48px) $spacing-16 $spacing-48;
  gap: 24px;
  text-align: center;
}

.inviteCard {
  @include flex-column;
  align-items: center;
  gap: 16px;
  padding: $spacing-32 $spacing-24;
  background: $bg-secondary;
  border: 1px solid #333;
  border-radius: $border-radius-lg;
  width: 100%;
}

.creatorName {
  font-size: $font-size-24;
  font-weight: 700;
  color: $white;
}

.inviteMessage {
  font-size: $font-size-16;
  color: $text-secondary;
  line-height: 1.5;
}

.bundleTitle {
  font-size: $font-size-14;
  color: $text-tertiary;
  padding: 8px 16px;
  background: $bg-tertiary;
  border-radius: $border-rounded;
}

.statusBadge {
  padding: 6px 16px;
  border-radius: $border-rounded;
  font-size: $font-size-12;
  font-weight: 600;

  &.waiting {
    background: rgba(255, 193, 7, 0.1);
    color: #ffc107;
    border: 1px solid rgba(255, 193, 7, 0.2);
  }

  &.completed {
    background: rgba(102, 187, 106, 0.1);
    color: #66bb6a;
    border: 1px solid rgba(102, 187, 106, 0.2);
  }

  &.closed {
    background: rgba(255, 107, 53, 0.1);
    color: #ff6b35;
    border: 1px solid rgba(255, 107, 53, 0.2);
  }
}

.ctaArea {
  @include flex-column;
  gap: 12px;
  width: 100%;
  margin-top: auto;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.ctaButton {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: $border-radius-lg;
  background: $primary-gradient;
  color: $white;
  font-size: $font-size-16;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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
  min-height: 100dvh;
  color: $text-tertiary;
}

.errorMessage {
  font-size: $font-size-14;
  color: $text-tertiary;
  margin-top: 8px;
}
```

- [ ] **Step 2: CompareLanding 컴포넌트 생성**

```tsx
// src/components/features/Compare/CompareLanding/CompareLanding.tsx
'use client';

import type { FC } from 'react';

import { useRouter } from 'next/navigation';

import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import { useAuth } from '@/contexts/AuthContext';
import { useCompareLink, useJoinCompareLink } from '@/hooks/api/useCompare';

import styles from './CompareLanding.module.scss';

interface CompareLandingProps {
  token: string;
}

export const CompareLanding: FC<CompareLandingProps> = ({ token }) => {
  const { isLoggedIn, requireLogin } = useAuth();
  const { data: link, isLoading, refetch } = useCompareLink(token);
  const joinMutation = useJoinCompareLink(token);
  const router = useRouter();

  if (isLoading) {
    return (
      <BundleBackground>
        <div className={styles.loading}>불러오는 중...</div>
      </BundleBackground>
    );
  }

  if (!link) {
    return (
      <BundleBackground>
        <div className={styles.loading}>
          비교 링크를 찾을 수 없습니다.
          <button
            type="button"
            className={styles.ctaButton}
            style={{ maxWidth: 200, marginTop: 16 }}
            onClick={() => router.push('/')}
          >
            메인으로
          </button>
        </div>
      </BundleBackground>
    );
  }

  const handleAction = async () => {
    if (!isLoggedIn) {
      requireLogin('default');
      return;
    }

    // 생성자 본인인 경우
    if (link.isCreator) {
      if (link.compareReady) {
        router.push(`/compare/${token}/result`);
      }
      // 대기 중이면 아무 동작 안함 (대기 안내)
      return;
    }

    // 참여자인 경우
    if (link.compareReady) {
      router.push(`/compare/${token}/result`);
      return;
    }

    // 번들 미완료 → 번들 풀기로 이동
    if (!link.myBundleCompleted) {
      router.push(`/bundle/${link.bundleSlug}/play`);
      return;
    }

    // 번들 완료 + 미참여 → 참여 시도
    try {
      await joinMutation.mutateAsync();
      await refetch();
      router.push(`/compare/${token}/result`);
    } catch {
      alert('참여에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const getCtaText = () => {
    if (!isLoggedIn) return '로그인하고 비교하기';
    if (link.isCreator && !link.compareReady) return '상대방 참여 대기 중...';
    if (link.compareReady) return '비교 결과 보기';
    if (!link.myBundleCompleted) return '번들 풀고 비교하기';
    return '참여하기';
  };

  const isCtaDisabled = link.isCreator && !link.compareReady;

  const statusLabel = {
    WAITING: '대기 중',
    COMPLETED: '비교 가능',
    CLOSED: '마감됨',
  };

  return (
    <BundleBackground>
      <div className={styles.container}>
        <div className={styles.inviteCard}>
          <span className={styles.creatorName}>{link.creatorNickname}</span>
          <p className={styles.inviteMessage}>
            {link.isCreator
              ? link.compareReady
                ? '비교 결과가 준비되었어요!'
                : '상대방이 참여하면 비교할 수 있어요'
              : `${link.creatorNickname}님이 비교를 기다리고 있어요!`}
          </p>
          <span className={styles.bundleTitle}>{link.bundleTitle}</span>
          <span
            className={`${styles.statusBadge} ${
              link.status === 'WAITING'
                ? styles.waiting
                : link.status === 'COMPLETED'
                  ? styles.completed
                  : styles.closed
            }`}
          >
            {statusLabel[link.status]}
          </span>

          {link.status === 'COMPLETED' && link.participantNickname && (
            <p className={styles.errorMessage}>참여자: {link.participantNickname}</p>
          )}
        </div>

        <div className={styles.ctaArea}>
          <button
            type="button"
            className={styles.ctaButton}
            onClick={handleAction}
            disabled={isCtaDisabled || joinMutation.isPending}
          >
            {joinMutation.isPending ? '참여 중...' : getCtaText()}
          </button>
          <button type="button" className={styles.secondaryCta} onClick={() => router.push('/')}>
            메인으로 돌아가기
          </button>
        </div>
      </div>
    </BundleBackground>
  );
};
```

- [ ] **Step 3: 랜딩 페이지 생성**

```tsx
// src/app/compare/[token]/page.tsx
import type { Metadata } from 'next';

import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';
import { CompareLanding } from '@/components/features/Compare/CompareLanding/CompareLanding';

export const metadata: Metadata = {
  title: '가치관 비교 | HotPick',
  description: '우리 생각 얼마나 통할까? 가치관을 비교해보세요.',
};

type ComparePageProps = {
  params: Promise<{ token: string }>;
};

export default async function ComparePage({ params }: ComparePageProps) {
  const { token } = await params;

  return (
    <>
      <MainHeader />
      <CompareLanding token={token} />
    </>
  );
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/app/compare/ src/components/features/Compare/CompareLanding/
git commit -m "feat(compare): 비교 링크 랜딩 페이지"
```

---

## Task 8: 1:1 비교 결과 — 케미 카드 컴포넌트

**Files:**

- Create: `src/components/features/Compare/CompareResult/ChemistryCard.tsx`
- Create: `src/components/features/Compare/CompareResult/ChemistryCard.module.scss`

- [ ] **Step 1: ChemistryCard SCSS 생성**

```scss
// src/components/features/Compare/CompareResult/ChemistryCard.module.scss
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;

@keyframes scaleReveal {
  0% {
    opacity: 0;
    transform: scale(0.6);
  }
  60% {
    opacity: 1;
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

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

@keyframes gradientSpin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.container {
  @include flex-column;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: center;
  animation: fadeSlideUp 0.6s ease-out both;
}

.names {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: $font-size-14;
  color: $text-secondary;
  margin-bottom: 8px;
}

.vs {
  font-size: $font-size-12;
  color: $text-tertiary;
  font-weight: 700;
}

.gradeRing {
  position: relative;
  width: 148px;
  height: 148px;
  border-radius: 50%;
  @include flex-center;
  overflow: visible;
  animation: scaleReveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;

  &::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 50%;
    background: conic-gradient(
      from 0deg,
      var(--grade-color-1),
      var(--grade-color-2),
      transparent 40%,
      var(--grade-color-1)
    );
    animation: gradientSpin 4s linear infinite;
  }
}

.gradeInner {
  width: calc(100% - 4px);
  height: calc(100% - 4px);
  border-radius: 50%;
  background: rgba($bg-secondary, 0.9);
  backdrop-filter: blur(12px);
  @include flex-center;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.matchRate {
  font-size: 48px;
  font-weight: 700;
  color: $white;
  line-height: 1;
  letter-spacing: -2px;
}

.matchUnit {
  font-size: $font-size-18;
  color: $text-tertiary;
}

.gradeTitle {
  font-size: $font-size-24;
  font-weight: 700;
  color: $white;
  margin-top: 20px;
  animation: fadeSlideUp 0.5s ease-out 0.6s both;
}

.gradeDescription {
  font-size: $font-size-14;
  color: $text-secondary;
  line-height: 1.5;
  animation: fadeSlideUp 0.5s ease-out 0.7s both;
}

.matchCountLabel {
  font-size: $font-size-12;
  color: $text-tertiary;
  margin-top: 4px;
  animation: fadeSlideUp 0.5s ease-out 0.8s both;
}
```

- [ ] **Step 2: ChemistryCard 컴포넌트 생성**

```tsx
// src/components/features/Compare/CompareResult/ChemistryCard.tsx
import type { FC } from 'react';

import { getChemistryByRate } from '@/constants/bundle';

import styles from './ChemistryCard.module.scss';

interface ChemistryCardProps {
  matchRate: number;
  matchCount: number;
  totalQuestions: number;
  myNickname: string;
  targetNickname: string;
}

export const ChemistryCard: FC<ChemistryCardProps> = ({
  matchRate,
  matchCount,
  totalQuestions,
  myNickname,
  targetNickname,
}) => {
  const chemistry = getChemistryByRate(matchRate);

  // gradient에서 두 색상 추출
  const gradientMatch = chemistry.gradient.match(/#[0-9A-Fa-f]{6}/g);
  const color1 = gradientMatch?.[0] ?? '#FF00FF';
  const color2 = gradientMatch?.[1] ?? '#FF4500';

  return (
    <div className={styles.container}>
      <div className={styles.names}>
        <span>{myNickname}</span>
        <span className={styles.vs}>VS</span>
        <span>{targetNickname}</span>
      </div>

      <div
        className={styles.gradeRing}
        style={{ '--grade-color-1': color1, '--grade-color-2': color2 } as React.CSSProperties}
      >
        <div className={styles.gradeInner}>
          <span className={styles.matchRate}>{matchRate}</span>
          <span className={styles.matchUnit}>%</span>
        </div>
      </div>

      <div className={styles.gradeTitle}>{chemistry.title}</div>
      <div className={styles.gradeDescription}>{chemistry.description}</div>
      <div className={styles.matchCountLabel}>
        {totalQuestions}개 중 {matchCount}개 일치
      </div>
    </div>
  );
};
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/features/Compare/CompareResult/ChemistryCard*
git commit -m "feat(compare): 케미 등급 카드 컴포넌트"
```

---

## Task 9: 충격 포인트 컴포넌트

**Files:**

- Create: `src/components/features/Compare/CompareResult/ShockPoint.tsx`
- Create: `src/components/features/Compare/CompareResult/ShockPoint.module.scss`

- [ ] **Step 1: ShockPoint SCSS 생성**

```scss
// src/components/features/Compare/CompareResult/ShockPoint.module.scss
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

.card {
  @include flex-column;
  gap: 16px;
  padding: 20px;
  background: rgba(#1e1e1e, 0.6);
  backdrop-filter: blur(16px);
  border-radius: $border-radius-lg;
  border: 1px solid rgba(#ff6b35, 0.15);
}

.questionTitle {
  font-size: $font-size-16;
  font-weight: 600;
  color: $white;
  text-align: center;
}

.answers {
  @include flex-column;
  gap: 8px;
}

.answerRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(#fff, 0.03);
  border-radius: $border-radius-md;
}

.personName {
  font-size: $font-size-14;
  color: $text-secondary;
  font-weight: 500;
}

.answerText {
  font-size: $font-size-14;
  font-weight: 600;
  color: $white;
}

.answerRate {
  font-size: $font-size-12;
  font-weight: 700;
  margin-left: 8px;
}

.majorityRate {
  color: #66bb6a;
}

.minorityRate {
  color: #ff6b35;
}

.comment {
  font-size: $font-size-14;
  color: $text-secondary;
  text-align: center;
  font-style: italic;
  padding: 8px 0;
}
```

- [ ] **Step 2: ShockPoint 컴포넌트 생성**

```tsx
// src/components/features/Compare/CompareResult/ShockPoint.tsx
import type { FC } from 'react';

import type { ShockPointData } from '@/constants/compare';

import styles from './ShockPoint.module.scss';

interface ShockPointProps {
  data: ShockPointData;
  myNickname: string;
  targetNickname: string;
}

export const ShockPoint: FC<ShockPointProps> = ({ data, myNickname, targetNickname }) => {
  const myOptionText = data.mySelected === 'A' ? data.optionA : data.optionB;
  const targetOptionText = data.targetSelected === 'A' ? data.optionA : data.optionB;

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>가장 충격적인 차이</span>
        <div className={styles.sectionLine} />
      </div>

      <div className={styles.card}>
        <div className={styles.questionTitle}>{data.title}</div>

        <div className={styles.answers}>
          <div className={styles.answerRow}>
            <span className={styles.personName}>{myNickname}</span>
            <span className={styles.answerText}>
              {myOptionText}
              <span
                className={`${styles.answerRate} ${data.myRate >= 50 ? styles.majorityRate : styles.minorityRate}`}
              >
                ({data.myRate}%)
              </span>
            </span>
          </div>
          <div className={styles.answerRow}>
            <span className={styles.personName}>{targetNickname}</span>
            <span className={styles.answerText}>
              {targetOptionText}
              <span
                className={`${styles.answerRate} ${data.targetRate >= 50 ? styles.majorityRate : styles.minorityRate}`}
              >
                ({data.targetRate}%)
              </span>
            </span>
          </div>
        </div>

        <div className={styles.comment}>"{data.comment}"</div>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/features/Compare/CompareResult/ShockPoint*
git commit -m "feat(compare): 충격 포인트 컴포넌트"
```

---

## Task 10: 같은 편/갈린 순간 아코디언 컴포넌트

**Files:**

- Create: `src/components/features/Compare/CompareResult/AnswerComparison.tsx`
- Create: `src/components/features/Compare/CompareResult/AnswerComparison.module.scss`

- [ ] **Step 1: AnswerComparison SCSS 생성**

```scss
// src/components/features/Compare/CompareResult/AnswerComparison.module.scss
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
  gap: 12px;
  width: 100%;
  animation: fadeSlideUp 0.5s ease-out 1s both;
}

.accordion {
  background: rgba(#1e1e1e, 0.6);
  backdrop-filter: blur(16px);
  border-radius: $border-radius-lg;
  border: 1px solid rgba(#fff, 0.04);
  overflow: hidden;
}

.accordionHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;

  &:hover {
    background: rgba(#fff, 0.02);
  }
}

.accordionTitle {
  font-size: $font-size-14;
  font-weight: 600;
  color: $white;
}

.accordionCount {
  font-size: $font-size-12;
  color: $text-tertiary;
  margin-left: 8px;
}

.sameColor {
  color: #66bb6a;
}

.diffColor {
  color: #ff6b35;
}

.chevron {
  font-size: $font-size-12;
  color: $text-tertiary;
  transition: transform 0.2s ease;

  &.open {
    transform: rotate(180deg);
  }
}

.accordionContent {
  @include flex-column;
  gap: 0;
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.3s ease;

  &.expanded {
    max-height: 1000px;
  }
}

.answerItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  border-top: 1px solid rgba(#fff, 0.04);
  font-size: 13px;
}

.itemTitle {
  color: $text-secondary;
  flex: 1;
}

.itemAnswer {
  font-weight: 600;
  color: $white;
  margin-left: 12px;
}

.itemDiff {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  margin-left: 12px;
}

.diffEntry {
  font-size: 12px;
  color: $text-secondary;

  span {
    font-weight: 600;
    color: $white;
  }
}
```

- [ ] **Step 2: AnswerComparison 컴포넌트 생성**

```tsx
// src/components/features/Compare/CompareResult/AnswerComparison.tsx
'use client';

import { useState, type FC } from 'react';

import type { AnswerStoryData } from '@/constants/compare';

import styles from './AnswerComparison.module.scss';

interface AnswerComparisonProps {
  data: AnswerStoryData;
  myNickname: string;
  targetNickname: string;
}

export const AnswerComparison: FC<AnswerComparisonProps> = ({
  data,
  myNickname,
  targetNickname,
}) => {
  const [sameOpen, setSameOpen] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);

  return (
    <div className={styles.container}>
      {/* 같은 편인 순간 */}
      {data.same.length > 0 && (
        <div className={styles.accordion}>
          <div className={styles.accordionHeader} onClick={() => setSameOpen(!sameOpen)}>
            <div>
              <span className={`${styles.accordionTitle} ${styles.sameColor}`}>같은 편인 순간</span>
              <span className={styles.accordionCount}>({data.same.length})</span>
            </div>
            <span className={`${styles.chevron} ${sameOpen ? styles.open : ''}`}>▼</span>
          </div>
          <div className={`${styles.accordionContent} ${sameOpen ? styles.expanded : ''}`}>
            {data.same.map((item) => (
              <div key={item.electionId} className={styles.answerItem}>
                <span className={styles.itemTitle}>{item.title}</span>
                <span className={styles.itemAnswer}>{item.selected}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 갈린 순간 */}
      {data.different.length > 0 && (
        <div className={styles.accordion}>
          <div className={styles.accordionHeader} onClick={() => setDiffOpen(!diffOpen)}>
            <div>
              <span className={`${styles.accordionTitle} ${styles.diffColor}`}>갈린 순간</span>
              <span className={styles.accordionCount}>({data.different.length})</span>
            </div>
            <span className={`${styles.chevron} ${diffOpen ? styles.open : ''}`}>▼</span>
          </div>
          <div className={`${styles.accordionContent} ${diffOpen ? styles.expanded : ''}`}>
            {data.different.map((item) => (
              <div key={item.electionId} className={styles.answerItem}>
                <span className={styles.itemTitle}>{item.title}</span>
                <div className={styles.itemDiff}>
                  <span className={styles.diffEntry}>
                    {myNickname}: <span>{item.myOptionText}</span>
                  </span>
                  <span className={styles.diffEntry}>
                    {targetNickname}: <span>{item.targetOptionText}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/features/Compare/CompareResult/AnswerComparison*
git commit -m "feat(compare): 같은 편/갈린 순간 아코디언 컴포넌트"
```

---

## Task 11: 대중성 비교 컴포넌트

**Files:**

- Create: `src/components/features/Compare/CompareResult/PopularityCompare.tsx`
- Create: `src/components/features/Compare/CompareResult/PopularityCompare.module.scss`

- [ ] **Step 1: PopularityCompare SCSS 생성**

```scss
// src/components/features/Compare/CompareResult/PopularityCompare.module.scss
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
  animation: fadeSlideUp 0.5s ease-out 1.1s both;
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

.compareRow {
  display: flex;
  gap: 12px;
  width: 100%;
}

.personCard {
  @include flex-column;
  align-items: center;
  gap: 8px;
  flex: 1;
  padding: 20px 12px;
  background: rgba(#1e1e1e, 0.6);
  backdrop-filter: blur(16px);
  border-radius: $border-radius-lg;
  border: 1px solid rgba(#fff, 0.04);
  text-align: center;
}

.personName {
  font-size: $font-size-12;
  color: $text-tertiary;
  font-weight: 500;
}

.personImage {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: contain;
}

.personPlaceholder {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  @include flex-center;
  font-size: $font-size-24;
  font-weight: 700;
  color: $white;
}

.personScore {
  font-size: $font-size-28;
  font-weight: 700;
  color: $white;
  line-height: 1;
}

.personScoreUnit {
  font-size: $font-size-14;
  color: $text-tertiary;
}

.personTitle {
  font-size: $font-size-14;
  font-weight: 600;
  color: $white;
}

.personDescription {
  font-size: $font-size-12;
  color: $text-tertiary;
  line-height: 1.4;
}
```

- [ ] **Step 2: PopularityCompare 컴포넌트 생성**

```tsx
// src/components/features/Compare/CompareResult/PopularityCompare.tsx
import type { FC } from 'react';

import Image from 'next/image';

import { calcPopularityScore, getPopularityByScore } from '@/constants/bundle';
import type { CompareResult } from '@/types/compare';

import styles from './PopularityCompare.module.scss';

interface PopularityCompareProps {
  result: CompareResult;
}

export const PopularityCompare: FC<PopularityCompareProps> = ({ result }) => {
  const myScore = calcPopularityScore(result.me.answers, result.questionStats);
  const targetScore = calcPopularityScore(result.target.answers, result.questionStats);
  const myPopularity = getPopularityByScore(myScore);
  const targetPopularity = getPopularityByScore(targetScore);

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>대중성 비교</span>
        <div className={styles.sectionLine} />
      </div>

      <div className={styles.compareRow}>
        <div className={styles.personCard}>
          <span className={styles.personName}>{result.me.nickname}</span>
          {myPopularity.imagePath ? (
            <Image
              src={myPopularity.imagePath}
              alt={myPopularity.title}
              width={64}
              height={64}
              className={styles.personImage}
            />
          ) : (
            <div
              className={styles.personPlaceholder}
              style={{ background: 'linear-gradient(135deg, #ff00ff, #ff4500)' }}
            >
              {myPopularity.grade[0]}
            </div>
          )}
          <div>
            <span className={styles.personScore}>{myScore}</span>
            <span className={styles.personScoreUnit}>%</span>
          </div>
          <span className={styles.personTitle}>{myPopularity.title}</span>
          <span className={styles.personDescription}>{myPopularity.description}</span>
        </div>

        <div className={styles.personCard}>
          <span className={styles.personName}>{result.target.nickname}</span>
          {targetPopularity.imagePath ? (
            <Image
              src={targetPopularity.imagePath}
              alt={targetPopularity.title}
              width={64}
              height={64}
              className={styles.personImage}
            />
          ) : (
            <div
              className={styles.personPlaceholder}
              style={{ background: 'linear-gradient(135deg, #ff00ff, #ff4500)' }}
            >
              {targetPopularity.grade[0]}
            </div>
          )}
          <div>
            <span className={styles.personScore}>{targetScore}</span>
            <span className={styles.personScoreUnit}>%</span>
          </div>
          <span className={styles.personTitle}>{targetPopularity.title}</span>
          <span className={styles.personDescription}>{targetPopularity.description}</span>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/features/Compare/CompareResult/PopularityCompare*
git commit -m "feat(compare): 대중성 비교 컴포넌트"
```

---

## Task 12: 1:1 비교 결과 메인 페이지

**Files:**

- Create: `src/components/features/Compare/CompareResult/CompareResult.tsx`
- Create: `src/components/features/Compare/CompareResult/CompareResult.module.scss`
- Create: `src/app/compare/[token]/result/page.tsx`

- [ ] **Step 1: CompareResult SCSS 생성**

```scss
// src/components/features/Compare/CompareResult/CompareResult.module.scss
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;

.container {
  @include flex-column;
  align-items: center;
  padding: calc(56px + 32px) $spacing-16 $spacing-48;
  gap: 48px;
  width: 100%;
}

.ctaSection {
  @include flex-column;
  gap: 12px;
  width: 100%;
  padding-top: 8px;
}

.ctaButton {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: $border-radius-lg;
  background: $primary-gradient;
  color: $white;
  font-size: $font-size-16;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.01);
  }

  &:active {
    transform: scale(0.99);
  }
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

- [ ] **Step 2: CompareResult 컴포넌트 생성**

```tsx
// src/components/features/Compare/CompareResult/CompareResult.tsx
'use client';

import { useEffect, useState, type FC } from 'react';

import { useRouter } from 'next/navigation';

import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import { CreateCompareLink } from '@/components/features/Bundle/BundleResult/CreateCompareLink';
import { classifyAnswers, findShockPoint } from '@/constants/compare';
import { useAuth } from '@/contexts/AuthContext';
import { useCompareResult } from '@/hooks/api/useCompare';

import { AnswerComparison } from './AnswerComparison';
import { ChemistryCard } from './ChemistryCard';
import styles from './CompareResult.module.scss';
import { PopularityCompare } from './PopularityCompare';
import { ShockPoint } from './ShockPoint';

interface CompareResultProps {
  token: string;
}

export const CompareResult: FC<CompareResultProps> = ({ token }) => {
  const { isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const { data: result, isLoading } = useCompareResult(token);
  const router = useRouter();
  const [showCompareModal, setShowCompareModal] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !isLoggedIn) {
      router.replace(`/compare/${token}`);
    }
  }, [isAuthLoading, isLoggedIn, token, router]);

  if (isLoading) {
    return (
      <BundleBackground>
        <div className={styles.loading}>비교 결과를 불러오는 중...</div>
      </BundleBackground>
    );
  }

  if (!result) {
    return (
      <BundleBackground>
        <div className={styles.loading}>
          비교 결과를 찾을 수 없습니다.
          <button
            type="button"
            className={styles.ctaButton}
            style={{ maxWidth: 200 }}
            onClick={() => router.push('/')}
          >
            메인으로
          </button>
        </div>
      </BundleBackground>
    );
  }

  const shockPoint = findShockPoint(result);
  const storyData = classifyAnswers(result);

  return (
    <BundleBackground fireworks>
      <div className={styles.container}>
        {/* 케미 카드 */}
        <ChemistryCard
          matchRate={result.matchRate}
          matchCount={result.matchCount}
          totalQuestions={result.totalQuestions}
          myNickname={result.me.nickname}
          targetNickname={result.target.nickname}
        />

        {/* 충격 포인트 */}
        {shockPoint && (
          <ShockPoint
            data={shockPoint}
            myNickname={result.me.nickname}
            targetNickname={result.target.nickname}
          />
        )}

        {/* 대중성 비교 */}
        <PopularityCompare result={result} />

        {/* 같은 편/갈린 순간 */}
        <AnswerComparison
          data={storyData}
          myNickname={result.me.nickname}
          targetNickname={result.target.nickname}
        />

        {/* CTA — 바이럴 루프 */}
        <div className={styles.ctaSection}>
          <button
            type="button"
            className={styles.ctaButton}
            onClick={() => setShowCompareModal(true)}
          >
            다른 친구와도 비교해볼래?
          </button>
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

      {showCompareModal && (
        <CreateCompareLink slug={result.bundleSlug} onClose={() => setShowCompareModal(false)} />
      )}
    </BundleBackground>
  );
};
```

- [ ] **Step 3: 비교 결과 페이지 생성**

```tsx
// src/app/compare/[token]/result/page.tsx
import type { Metadata } from 'next';

import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';
import { CompareResult } from '@/components/features/Compare/CompareResult/CompareResult';

export const metadata: Metadata = {
  title: '비교 결과 | HotPick',
  description: '우리 생각 얼마나 통할까? 가치관 비교 결과를 확인하세요.',
  robots: { index: false },
};

type ResultPageProps = {
  params: Promise<{ token: string }>;
};

export default async function CompareResultPage({ params }: ResultPageProps) {
  const { token } = await params;

  return (
    <>
      <MainHeader />
      <CompareResult token={token} />
    </>
  );
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/components/features/Compare/CompareResult/CompareResult* src/app/compare/\[token\]/result/
git commit -m "feat(compare): 1:1 비교 결과 페이지"
```

---

## Self-Review 결과

**1. Spec coverage:**

- 섹션 4.3 (1:1 비교 흐름) → Task 7 (랜딩: 미완료→풀기, 완료→자동매핑, 이미참여→안내) + Task 6 (CTA)
- 섹션 5.1 (케미 등급 체계) → Task 8 (ChemistryCard, `getChemistryByRate` 재사용)
- 섹션 5.3-충격포인트 → Task 9 (ShockPoint)
- 섹션 5.3-대중성비교 → Task 11 (PopularityCompare, `calcPopularityScore` 재사용)
- 섹션 5.3-스토리텔링 → Task 10 (AnswerComparison 아코디언)
- 섹션 5.5 (바이럴 CTA) → Task 12 ("다른 친구와도 비교해볼래?" CTA)
- 섹션 6.1 (비교 기능 바이럴 루프) → Task 12 (비교 결과에서 새 비교 링크 생성)
- 섹션 8.2 (비교 링크 API) → Task 3~4 (MSW) + Task 5 (훅)
- 섹션 8.4 (1:1 비교 결과 응답) → Task 1 (CompareResult 타입)
- 하단 플로팅 CTA → Phase 2 범위 (그룹 비교와 함께)
- 마이페이지 `/my/bundles` → Phase 3 범위
- 그룹 비교 → Phase 2 범위

**2. Placeholder scan:** 없음. 3D 캐릭터 이미지는 기존 `POPULARITY_GRADES.imagePath`와 `CHEMISTRY_GRADES.imagePath` 활용.

**3. Type consistency:**

- `CompareResult` — Task 1에서 정의, Task 3 (MSW), Task 5 (훅), Task 11~12에서 동일하게 사용
- `CompareLink` — Task 1에서 정의, Task 3 (MSW), Task 5 (훅), Task 7에서 사용
- `ShockPointData`, `AnswerStoryData` — Task 2에서 정의, Task 9, 10에서 사용
- `getChemistryByRate`, `calcPopularityScore`, `getPopularityByScore` — `src/constants/bundle.ts`에서 import, Task 8, 11에서 사용
- `customInstance` — `@/lib/axios-mutator`에서 import, Task 5에서 사용
- `CreateCompareLink` — Task 6에서 생성, Task 12에서 재사용
