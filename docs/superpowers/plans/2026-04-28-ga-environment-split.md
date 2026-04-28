# GA 정비 (환경 분리 + 번들 스펙 갱신 + Ask H3 트래킹·보고서) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 세 가지를 하나의 사이클로 정리한다 — (1) `gaId` 하드코딩을 환경변수로 빼서 Real(신규 ID) / Beta(기존 ID) / Local(미로드) 분리, (2) 번들에서 1:1 비교가 사라진 현재 스펙에 맞춰 죽은 이벤트와 의미 없는 파라미터 정리, (3) Ask H3(테토/에겐)에 GA4 트래킹을 신규로 박고 4주 검증용 K-factor 보고서 스펙 작성.

**Architecture:** `src/app/layout.tsx`의 `gaId`를 `process.env.NEXT_PUBLIC_GA_ID`로 외부화한다(Vercel은 이미 환경별로 값 분리 완료). `src/lib/analytics.ts`에서 호출되지 않는 비교 관련 함수와 `compare_type` 파라미터를 제거한다. 같은 파일에 `trackAsk*` 헬퍼 7종을 추가하고 `/ask/teto-egen` 컴포넌트들에 호출 사이트를 박는다. Ask용 K-factor 보고서는 `docs/analytics/ask-teto-egen-report.md`로 새 문서를 만든다.

**Tech Stack:** Next.js 16 App Router, `@next/third-parties/google`의 `<GoogleAnalytics>`, GA4 Admin (맞춤 측정기준), `process.env.NEXT_PUBLIC_GA_ID`

---

## 0. 현재 상태 분석 리포트 (재정리)

### 0-1. GA ID 등장 위치 (전수)

| 위치                                                                          | 내용                                               | 다음 액션                    |
| ----------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------- |
| [src/app/layout.tsx:55](../../../src/app/layout.tsx#L55)                      | `<GoogleAnalytics gaId="G-CBJFPV9C95" />` 하드코딩 | env로 외부화 (Task 1)        |
| [docs/ga4-guide.md:4](../../ga4-guide.md#L4), [:286](../../ga4-guide.md#L286) | 운영 가이드 본문에 ID 명시                         | 환경별 ID 표로 교체 (Task 5) |
| [docs/analytics/ga4-master-plan.md:5](../../analytics/ga4-master-plan.md#L5)  | 마스터 플랜 헤더에 ID 명시                         | 환경별 ID로 교체 (Task 5)    |

코드 변경 surface는 **layout.tsx 한 줄**. Vercel 환경변수와 Real용 신규 GA4 키는 이미 사용자가 발급/설정 완료.

### 0-2. 현재 환경별 GA 동작

| 환경  | NODE_ENV    | gtag.js 로드 ID           | 커스텀 이벤트                                                                  | 자동수집                    |
| ----- | ----------- | ------------------------- | ------------------------------------------------------------------------------ | --------------------------- |
| Real  | production  | `G-CBJFPV9C95` (ALL 동일) | ✅                                                                             | ✅                          |
| Beta  | production  | `G-CBJFPV9C95` (ALL 동일) | ✅                                                                             | ✅                          |
| Local | development | `G-CBJFPV9C95` (ALL 동일) | ❌ console.debug ([analytics.ts:65-70](../../../src/lib/analytics.ts#L65-L70)) | ✅ (스크립트 자체는 로드됨) |

Real 분석 데이터가 Beta QA 트래픽 + 로컬 개발자 트래픽으로 오염 중.

### 0-3. 번들/비교 스펙 변화로 죽은 코드

번들에서 **1:1 비교(ONE_TO_ONE)가 폐기**되어 다음 코드가 실효성 없음:

| 항목                      | 위치                                                                                 | 현재 상태                                                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `trackCompareShare`       | [analytics.ts:196-203](../../../src/lib/analytics.ts#L196-L203)                      | **호출 사이트 0건** — 공유 행위(카카오/링크복사) 자체에 트래킹이 빠져있음                                                                                          |
| `trackCompareLanding`     | [analytics.ts:206-208](../../../src/lib/analytics.ts#L206-L208)                      | **호출 사이트 0건** — 비교 링크 수신자 진입 추적 없음                                                                                                              |
| `trackCompareResult`      | [analytics.ts:211-213](../../../src/lib/analytics.ts#L211-L213)                      | **호출 사이트 0건** — 1:1 결과 페이지가 사라져서(redirect-only) 의미 없음                                                                                          |
| `compare_type` 파라미터   | `trackCompareCreate`/`trackCompareShare`/`trackCompareLanding`                       | 항상 `'GROUP'`만 들어감 ([CreateCompareLink.tsx:102](../../../src/components/features/Bundle/BundleResult/CreateCompareLink.tsx#L102)) — **enum 차원이 의미 없음** |
| `/compare/[token]` 라우트 | [src/app/compare/[token]/page.tsx:71](../../../src/app/compare/[token]/page.tsx#L71) | 서버사이드 redirect만, 자체 페이지뷰 없음                                                                                                                          |

→ `trackCompareCreate`는 여전히 살아있고 호출됨. 나머지 3개 함수와 `compare_type` 파라미터는 정리 대상.
→ "공유 트리거"·"수신자 진입" 두 단계는 그룹 비교에서도 측정 가치가 있으나, 죽은 함수를 살리는 게 아니라 **새 시그니처(파라미터 단순화)로 다시 박는 것이 깔끔**. 단 본 사이클은 GA 정비가 본질이라, 그룹 공유 추적 추가는 Out of Scope로 두고 죽은 코드는 제거만 한다 (필요 시 별도 사이클).

### 0-4. Ask H3 (테토/에겐) 신규 스펙 — 트래킹 무

[docs/api/ask-teto-egen-api-spec.md](../../api/ask-teto-egen-api-spec.md), [docs/superpowers/specs/2026-04-26-h3-friend-evaluation-design.md](../specs/2026-04-26-h3-friend-evaluation-design.md), [docs/strategy/2026-04-25-h3-friend-evaluation.md](../../strategy/2026-04-25-h3-friend-evaluation.md) 기반.

**페이지/플로우:**

- `/ask/teto-egen` — 랜딩, [src/app/ask/teto-egen/page.tsx](../../../src/app/ask/teto-egen/page.tsx) → `LandingHero`
- `/ask/teto-egen/my` — 1차 사용자 자기평가 + 링크 생성 + 결과, `PrimaryFlow.tsx` ([src/components/features/TetoEgen/PrimaryFlow.tsx](../../../src/components/features/TetoEgen/PrimaryFlow.tsx)) + `MyResultView`
- `/ask/teto-egen/friend/[token]` — 친구 평가 + 결과, `FriendFlow.tsx` ([src/components/features/TetoEgen/FriendFlow.tsx](../../../src/components/features/TetoEgen/FriendFlow.tsx))

**현재 트래킹 상태:** `grep -n "trackAsk\|track\(.*ask" src/components/features/TetoEgen/*` → **0건**. 전략 PRD §B5 `GA4 이벤트 박기`는 아직 미완료.

**전략 PRD가 요구하는 측정 차원 (4주 검증 시그널 4개):**

1. 자발적 릴레이 — 친구 5명 중 3명 이상이 평가 후 자기 링크 만들어 새 친구에게 던짐
2. 평균 친구 평가 수 — 한 owner 링크당 평균 ≥ 3
3. 운영팸 회자 — 정성 (GA로는 부분 측정만 가능)
4. 자발적 2차 사용 — 본인이 시키지 않은 다른 모임 전파

→ **GA로 핵심 측정 가능한 것은 (1)(2)(4)의 정량 지표, 즉 K-factor·친구 평가 분포·entry_point 분리.** (3) 운영팸 회자는 정성 채널이라 별도 추적.

### 0-5. 결론

본 플랜의 작업 단위는 4개:

- **A. 환경 분리 (코드)** — layout.tsx 1줄 변경 + 미렌더 가드.
- **B. 번들 1:1 폐기 정리** — analytics.ts에서 죽은 함수 3개 + `compare_type` 파라미터 제거.
- **C. Ask H3 트래킹 박기** — analytics.ts에 헬퍼 7종 추가 + 컴포넌트 호출 사이트 박기.
- **D. Ask H3 보고서 스펙** — K-factor·전파율 계산 보고서 문서화 + GA4 맞춤 측정기준 등록 가이드.

---

## 1. 파일 구조

| 파일                                                                                                                                            | 책임                        | 변경 종류                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------ |
| [src/app/layout.tsx](../../../src/app/layout.tsx)                                                                                               | gtag.js 로드 + ID 주입      | gaId 외부화 + 미렌더 가드                                                                        |
| [src/lib/analytics.ts](../../../src/lib/analytics.ts)                                                                                           | 모든 GA 헬퍼 정의           | 죽은 함수 3개 제거 + `trackAsk*` 7종 추가                                                        |
| [src/components/features/TetoEgen/LandingHero.tsx](../../../src/components/features/TetoEgen/LandingHero.tsx)                                   | 랜딩 화면                   | `trackAskView` 호출 추가                                                                         |
| [src/components/features/TetoEgen/PrimaryFlow.tsx](../../../src/components/features/TetoEgen/PrimaryFlow.tsx)                                   | 1차 사용자 q1/q2/form/share | `trackAskSelfAnswer`, `trackAskLinkCreate`, `trackAskShareLink` 호출 추가                        |
| [src/components/features/TetoEgen/MyResultView.tsx](../../../src/components/features/TetoEgen/MyResultView.tsx)                                 | 1차 결과 화면               | `trackAskOwnerResultView` 호출 추가                                                              |
| [src/components/features/TetoEgen/FriendFlow.tsx](../../../src/components/features/TetoEgen/FriendFlow.tsx)                                     | 친구 평가 + 결과            | `trackAskFriendLanding`, `trackAskFriendVote`, `trackAskRelayClick` 호출 추가                    |
| [src/components/features/Bundle/BundleResult/CreateCompareLink.tsx](../../../src/components/features/Bundle/BundleResult/CreateCompareLink.tsx) | 그룹 비교 링크 생성         | `trackCompareCreate(slug, 'GROUP', source)` → `trackCompareCreate(slug, source)` 시그니처 단순화 |
| [.env.example](../../../.env.example)                                                                                                           | 환경변수 계약               | `NEXT_PUBLIC_GA_ID` 라인 추가                                                                    |
| [docs/ga4-guide.md](../../ga4-guide.md)                                                                                                         | 운영 가이드                 | 환경별 ID 표 추가, `compare_type` 차원 제거                                                      |
| [docs/analytics/ga4-master-plan.md](../../analytics/ga4-master-plan.md)                                                                         | 트래킹 마스터 플랜          | 환경별 ID 명시, Ask H3 카탈로그 추가                                                             |
| [docs/analytics/ask-teto-egen-report.md](../../analytics/ask-teto-egen-report.md)                                                               | **신규**                    | Ask H3 K-factor·전파 보고서 스펙 (Task 7 산출물)                                                 |

---

## 2. Tasks

### Task 1: layout.tsx에서 GA ID 외부화

**Files:**

- Modify: [src/app/layout.tsx:55](../../../src/app/layout.tsx#L55)

- [ ] **Step 1: 변경 전 baseline 확인**

  ```bash
  grep -n "G-CBJFPV9C95" /Users/woongs/Desktop/young-woong-poll/trend-web/src/app/layout.tsx
  ```

  Expected: line 55에 한 건. (이 단계 끝나면 0건이 되어야 함.)

- [ ] **Step 2: layout.tsx 수정**

  Before (line 55):

  ```tsx
  <GoogleAnalytics gaId="G-CBJFPV9C95" />
  ```

  After:

  ```tsx
  {
    process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />;
  }
  ```

  서버 컴포넌트(`layout.tsx`)에서 `process.env.NEXT_PUBLIC_GA_ID`는 빌드 타임에 정적 인라이닝됨. Vercel Production/Preview 빌드는 각각 다른 ID로 치환된 결과물을 만든다.

- [ ] **Step 3: 빌드 검증 — 변수 미설정 시 GA 미렌더**

  ```bash
  unset NEXT_PUBLIC_GA_ID
  pnpm build
  grep -r "G-CBJFPV9C95" .next/ 2>/dev/null | head
  ```

  Expected: 매칭 없음. (이전 빌드 산출물에는 layout 청크에 ID가 인라이닝돼 있었음.)

- [ ] **Step 4: 빌드 검증 — 변수 설정 시 해당 ID로 인라이닝**

  ```bash
  NEXT_PUBLIC_GA_ID=G-TESTONLY999 pnpm build
  grep -r "G-TESTONLY999" .next/ 2>/dev/null | head -3
  ```

  Expected: 매칭됨.

- [ ] **Step 5: 로컬 런타임 검증**

  `.env.local`에 `NEXT_PUBLIC_GA_ID`가 없는(또는 빈) 상태에서:

  ```bash
  pnpm start
  ```

  브라우저에서 `https://localhost/` 진입 → DevTools → Network → `googletagmanager.com/gtag/js` 요청 검색.

  Expected: 매칭 없음. console에 GA 관련 에러도 없음.

- [ ] **Step 6: 사용자 확인 후 커밋**

  ```bash
  git add src/app/layout.tsx
  git commit -m "feat(ga): use NEXT_PUBLIC_GA_ID env var for GA4 measurement ID"
  ```

---

### Task 2: `.env.example`에 환경변수 계약 명시

**Files:**

- Modify: [.env.example](../../../.env.example)

- [ ] **Step 1: 파일 끝에 라인 추가**

  ```env

  # Google Analytics 4 측정 ID
  # - Real(Vercel Production): 신규 발급 ID (Vercel Dashboard에 설정됨)
  # - Beta(Vercel Preview): G-CBJFPV9C95 (Vercel Dashboard에 설정됨)
  # - Local: 비워둠. 빈 값이면 gtag.js를 로드하지 않음.
  NEXT_PUBLIC_GA_ID=
  ```

- [ ] **Step 2: 사용자 확인 후 커밋**

  ```bash
  git add .env.example
  git commit -m "docs(env): document NEXT_PUBLIC_GA_ID env var"
  ```

---

### Task 3: analytics.ts에서 죽은 비교 함수 제거 + 파라미터 단순화

**Files:**

- Modify: [src/lib/analytics.ts](../../../src/lib/analytics.ts)
- Modify: [src/components/features/Bundle/BundleResult/CreateCompareLink.tsx:102](../../../src/components/features/Bundle/BundleResult/CreateCompareLink.tsx#L102)

- [ ] **Step 1: 호출 사이트 재확인 (안전 그물)**

  ```bash
  grep -rn "trackCompareShare\|trackCompareLanding\|trackCompareResult" \
    --include="*.ts" --include="*.tsx" /Users/woongs/Desktop/young-woong-poll/trend-web/src
  ```

  Expected: `src/lib/analytics.ts`의 정의부 외에는 매칭 없음. (이미 §0-3에서 확인했지만 한 번 더 검증.)

  ```bash
  grep -rn "trackCompareCreate" \
    --include="*.ts" --include="*.tsx" /Users/woongs/Desktop/young-woong-poll/trend-web/src
  ```

  Expected: `src/lib/analytics.ts`(정의)와 [CreateCompareLink.tsx:17, 102](../../../src/components/features/Bundle/BundleResult/CreateCompareLink.tsx#L102) 두 곳만.

- [ ] **Step 2: `analytics.ts`에서 함수 3개 + 시그니처 단순화**

  [src/lib/analytics.ts:191-218](../../../src/lib/analytics.ts#L191-L218) 영역을 다음과 같이 교체.

  Before ([analytics.ts:191-218](../../../src/lib/analytics.ts#L191-L218)):

  ```ts
  /** 비교 링크 생성 */
  export function trackCompareCreate(slug: string, type: 'ONE_TO_ONE' | 'GROUP', source: string) {
    track('compare_create', { slug, compare_type: type, source });
  }

  /** 비교 링크 공유 */
  export function trackCompareShare(
    slug: string,
    method: 'kakao' | 'copy',
    type: 'ONE_TO_ONE' | 'GROUP',
    source: string
  ) {
    track('compare_share', { slug, method, compare_type: type, source });
  }

  /** 비교 랜딩 페이지 조회 */
  export function trackCompareLanding(bundleSlug: string, type: 'ONE_TO_ONE' | 'GROUP') {
    track('compare_landing', { bundle_slug: bundleSlug, compare_type: type });
  }

  /** 1:1 비교 결과 조회 */
  export function trackCompareResult(bundleSlug: string) {
    track('compare_result', { bundle_slug: bundleSlug });
  }

  /** 그룹 비교 결과 조회 */
  export function trackGroupResult(bundleSlug: string, memberCount: number) {
    track('group_result', { bundle_slug: bundleSlug, member_count: memberCount });
  }
  ```

  After:

  ```ts
  /** 비교 링크 생성 (그룹 전용 — 1:1은 2026-04 폐기) */
  export function trackCompareCreate(slug: string, source: string) {
    track('compare_create', { slug, source });
  }

  /** 그룹 비교 결과 조회 */
  export function trackGroupResult(bundleSlug: string, memberCount: number) {
    track('group_result', { bundle_slug: bundleSlug, member_count: memberCount });
  }
  ```

- [ ] **Step 3: `CreateCompareLink.tsx` 호출부 수정**

  Before ([CreateCompareLink.tsx:102](../../../src/components/features/Bundle/BundleResult/CreateCompareLink.tsx#L102)):

  ```tsx
  trackCompareCreate(slug, 'GROUP', source);
  ```

  After:

  ```tsx
  trackCompareCreate(slug, source);
  ```

- [ ] **Step 4: 타입 체크 + 린트**

  ```bash
  pnpm type-check && pnpm lint
  ```

  Expected: 두 명령 모두 통과. (시그니처 변경에 따른 컴파일 에러가 안 떠야 함.)

- [ ] **Step 5: 사용자 확인 후 커밋**

  ```bash
  git add src/lib/analytics.ts src/components/features/Bundle/BundleResult/CreateCompareLink.tsx
  git commit -m "refactor(ga): drop dead 1:1 compare events and compare_type param"
  ```

  > 커밋 본문에 다음 내용 명시:
  >
  > - `trackCompareShare`/`trackCompareLanding`/`trackCompareResult` 호출 사이트 0건. 1:1 폐기로 사실상 죽은 함수.
  > - `compare_type` 파라미터는 항상 'GROUP'만 들어가던 차원이라 제거.
  > - GA4 콘솔의 기존 `compare_share`/`compare_landing`/`compare_result` 이벤트 데이터는 보존됨 (전송만 멈춤).

---

### Task 4: `analytics.ts`에 Ask H3 헬퍼 7종 추가

**Files:**

- Modify: [src/lib/analytics.ts](../../../src/lib/analytics.ts)

이벤트 카탈로그는 전략 PRD §B5(6개)에 결과 보고서용 `ask_owner_result_view` 1개를 추가해 7개로 확장.

| #   | 이벤트명                | 파라미터                                     | 의미                                            |
| --- | ----------------------- | -------------------------------------------- | ----------------------------------------------- |
| 1   | `ask_view`              | `topic`, `entry_point`                       | 랜딩 진입                                       |
| 2   | `ask_self_answer`       | `topic`, `self_answer`, `self_prediction`    | 자기 평가 2개 질문 모두 완료 (link create 직전) |
| 3   | `ask_link_create`       | `topic`, `self_answer`, `self_prediction`    | 본인 링크 생성 성공                             |
| 4   | `ask_share_link`        | `topic`, `method` (`copy` / `kakao`)         | 본인 링크 공유 트리거                           |
| 5   | `ask_friend_landing`    | `topic`, `is_own`                            | 친구 평가 페이지 진입                           |
| 6   | `ask_friend_vote`       | `topic`, `vote`, `matches_owner_self_answer` | 친구 평가 제출 성공                             |
| 7   | `ask_owner_result_view` | `topic`, `friend_count`, `is_majority_match` | 본인 결과 화면 조회 (재방문 포함)               |

`topic`은 모두 `'teto-egen'` (향후 다른 주제 시리즈 시 같은 prefix 재사용).

- [ ] **Step 1: `analytics.ts` 끝(`Real User 감지` 섹션 직전)에 새 섹션 추가**

  파일에서 다음 라인 직전에 삽입:

  ```ts
  // ──────────────────────────────────────────────────────────
  // Real User 감지 — 첫 실제 인터랙션 시 사용자 속성 세팅
  // ──────────────────────────────────────────────────────────
  ```

  삽입 내용:

  ```ts
  // ──────────────────────────────────────────────────────────
  // Ask H3 (테토/에겐) 이벤트 헬퍼
  // ──────────────────────────────────────────────────────────

  export type AskTopic = 'teto-egen';
  export type AskAnswer = 'TETO' | 'EGEN';

  /** 랜딩 진입 */
  export function trackAskView(topic: AskTopic, entryPoint: 'direct' | 'share_link' | 'relay') {
    track('ask_view', { topic, entry_point: entryPoint });
  }

  /** 자기 평가 2개 질문 모두 완료 (link create 직전) */
  export function trackAskSelfAnswer(
    topic: AskTopic,
    selfAnswer: AskAnswer,
    selfPrediction: AskAnswer
  ) {
    track('ask_self_answer', {
      topic,
      self_answer: selfAnswer,
      self_prediction: selfPrediction,
    });
  }

  /** 본인 링크 생성 성공 */
  export function trackAskLinkCreate(
    topic: AskTopic,
    selfAnswer: AskAnswer,
    selfPrediction: AskAnswer
  ) {
    track('ask_link_create', {
      topic,
      self_answer: selfAnswer,
      self_prediction: selfPrediction,
    });
  }

  /** 본인 링크 공유 트리거 */
  export function trackAskShareLink(topic: AskTopic, method: 'copy' | 'kakao') {
    track('ask_share_link', { topic, method });
  }

  /** 친구 평가 페이지 진입 — is_own=true면 자기 링크 진입(평가 차단됨) */
  export function trackAskFriendLanding(topic: AskTopic, isOwn: boolean) {
    track('ask_friend_landing', { topic, is_own: isOwn });
  }

  /** 친구 평가 제출 성공 */
  export function trackAskFriendVote(
    topic: AskTopic,
    vote: AskAnswer,
    matchesOwnerSelfAnswer: boolean
  ) {
    track('ask_friend_vote', {
      topic,
      vote,
      matches_owner_self_answer: matchesOwnerSelfAnswer,
    });
  }

  /** 본인 결과 화면 조회 (직접 진입 + 폴링 갱신 + 친구 평가 후 재진입) */
  export function trackAskOwnerResultView(
    topic: AskTopic,
    friendCount: number,
    isMajorityMatch: boolean
  ) {
    track('ask_owner_result_view', {
      topic,
      friend_count: friendCount,
      is_majority_match: isMajorityMatch,
    });
  }
  ```

- [ ] **Step 2: 타입 체크**

  ```bash
  pnpm type-check
  ```

  Expected: 통과.

- [ ] **Step 3: 사용자 확인 후 커밋**

  ```bash
  git add src/lib/analytics.ts
  git commit -m "feat(ga): add Ask H3 (teto-egen) event helpers"
  ```

---

### Task 5: Ask H3 컴포넌트에 트래킹 호출 박기

**Files:**

- Modify: [src/components/features/TetoEgen/LandingHero.tsx](../../../src/components/features/TetoEgen/LandingHero.tsx)
- Modify: [src/components/features/TetoEgen/PrimaryFlow.tsx](../../../src/components/features/TetoEgen/PrimaryFlow.tsx)
- Modify: [src/components/features/TetoEgen/MyResultView.tsx](../../../src/components/features/TetoEgen/MyResultView.tsx)
- Modify: [src/components/features/TetoEgen/FriendFlow.tsx](../../../src/components/features/TetoEgen/FriendFlow.tsx)

> 각 호출 사이트에 박기 전 컴포넌트 본문을 한 번 읽어서 정확한 위치를 파악하고 수정한다 (Edit 도구 사용 시 unique 매칭 보장 위해 충분한 context를 함께 잡을 것).

- [ ] **Step 1: `LandingHero.tsx`에 `trackAskView` 호출 추가**

  컴포넌트 마운트 시(useEffect) `entry_point` 분기:
  - URL search param 또는 referrer로 분기 가능. 단순화를 위해 `document.referrer.includes(window.location.host)` 면 `relay`(앱 내부 이동), 아니면 `direct`. 친구 진입은 별도 라우트(`/friend/[token]`)에서 잡으므로 여기서는 `share_link` 분기 불필요.

  추가 import:

  ```tsx
  import { useEffect } from 'react';
  import { trackAskView } from '@/lib/analytics';
  ```

  컴포넌트 본문 내(JSX 직전):

  ```tsx
  useEffect(() => {
    const isInternal =
      typeof document !== 'undefined' &&
      document.referrer &&
      document.referrer.includes(window.location.host);
    trackAskView('teto-egen', isInternal ? 'relay' : 'direct');
  }, []);
  ```

  > `LandingHero`는 client component인지 미리 `'use client'` 디렉티브 확인. 없으면 useEffect 불가하니 client wrapper 필요.

- [ ] **Step 2: `PrimaryFlow.tsx` `handleQ2`에 `trackAskSelfAnswer` 추가**

  [src/components/features/TetoEgen/PrimaryFlow.tsx:48-58](../../../src/components/features/TetoEgen/PrimaryFlow.tsx#L48-L58) `handleQ2` 함수의 마지막(state 갱신 직후) 한 줄 추가.

  Before:

  ```tsx
  const handleQ2 = (value: 'YES' | 'NO') => {
    if (!selfAnswer) {
      return;
    }
    const opposite: TetoEgenAnswer = selfAnswer === 'TETO' ? 'EGEN' : 'TETO';
    setSelfPrediction(value === 'YES' ? selfAnswer : opposite);
    setStep('form');
  };
  ```

  After:

  ```tsx
  const handleQ2 = (value: 'YES' | 'NO') => {
    if (!selfAnswer) {
      return;
    }
    const opposite: TetoEgenAnswer = selfAnswer === 'TETO' ? 'EGEN' : 'TETO';
    const prediction: TetoEgenAnswer = value === 'YES' ? selfAnswer : opposite;
    setSelfPrediction(prediction);
    trackAskSelfAnswer('teto-egen', selfAnswer, prediction);
    setStep('form');
  };
  ```

  Import 추가:

  ```tsx
  import { trackAskSelfAnswer, trackAskLinkCreate, trackAskShareLink } from '@/lib/analytics';
  ```

- [ ] **Step 3: `PrimaryFlow.tsx` `handleSubmit`의 `onSuccess`에 `trackAskLinkCreate` 추가**

  [src/components/features/TetoEgen/PrimaryFlow.tsx:64-70](../../../src/components/features/TetoEgen/PrimaryFlow.tsx#L64-L70) `onSuccess` 콜백.

  Before:

  ```tsx
        {
          onSuccess: (data) => {
            setShareUrl(data.shareUrl);
            setStep('share');
          },
  ```

  After:

  ```tsx
        {
          onSuccess: (data) => {
            setShareUrl(data.shareUrl);
            trackAskLinkCreate('teto-egen', selfAnswer, selfPrediction);
            setStep('share');
          },
  ```

- [ ] **Step 4: `PrimaryFlow.tsx` `handleCopy`에 `trackAskShareLink` 추가**

  [src/components/features/TetoEgen/PrimaryFlow.tsx:102-112](../../../src/components/features/TetoEgen/PrimaryFlow.tsx#L102-L112).

  Before:

  ```tsx
  const handleCopy = async () => {
    if (!shareUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('링크가 복사됐어요');
    } catch {
      showToast('복사에 실패했어요');
    }
  };
  ```

  After:

  ```tsx
  const handleCopy = async () => {
    if (!shareUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      trackAskShareLink('teto-egen', 'copy');
      showToast('링크가 복사됐어요');
    } catch {
      showToast('복사에 실패했어요');
    }
  };
  ```

  > 카카오 공유가 추가되면 동일 함수에 `trackAskShareLink('teto-egen', 'kakao')` 호출 분기 추가. 본 사이클에선 copy만.

- [ ] **Step 5: `MyResultView.tsx`에 `trackAskOwnerResultView` 추가**

  먼저 현재 컴포넌트 구조 확인:

  ```bash
  cat /Users/woongs/Desktop/young-woong-poll/trend-web/src/components/features/TetoEgen/MyResultView.tsx | head -60
  ```

  결과 데이터(`friendVotes.total`, `selfAnswer`, 다수파 라벨)가 마운트 시점에 결정된 후 `useEffect`에서 1회 발화. 다수파 일치 여부는:

  ```tsx
  const isMajorityMatch =
    friendVotes.total > 0 &&
    ((friendVotes.tetoCount > friendVotes.egenCount && selfAnswer === 'TETO') ||
      (friendVotes.egenCount > friendVotes.tetoCount && selfAnswer === 'EGEN'));
  ```

  데이터 로드 완료 후(`useEffect([data])`) 1회 발화하도록 추가. 컴포넌트의 데이터 fetching 패턴(useQuery)에 따라 `data`가 변할 때마다 트래킹되지 않도록 `useRef` 가드:

  ```tsx
  import { useEffect, useRef } from 'react';
  import { trackAskOwnerResultView } from '@/lib/analytics';

  const trackedRef = useRef(false);
  useEffect(() => {
    if (trackedRef.current) return;
    if (!data || !data.friendVotes) return;
    const { tetoCount, egenCount, total } = data.friendVotes;
    const isMajorityMatch =
      total > 0 &&
      ((tetoCount > egenCount && data.selfAnswer === 'TETO') ||
        (egenCount > tetoCount && data.selfAnswer === 'EGEN'));
    trackAskOwnerResultView('teto-egen', total, isMajorityMatch);
    trackedRef.current = true;
  }, [data]);
  ```

  > `data`/`selfAnswer`의 정확한 prop/hook 이름은 `MyResultView.tsx` 본문 확인 후 맞춰 쓸 것. 위 스니펫은 패턴이며, 실제 변수명에 맞게 조정 필수.

- [ ] **Step 6: `FriendFlow.tsx`에 진입/평가 트래킹 추가**

  [src/components/features/TetoEgen/FriendFlow.tsx](../../../src/components/features/TetoEgen/FriendFlow.tsx) 두 군데 박기.

  6-1. 마운트 시 진입 트래킹:

  ```tsx
  import { useEffect } from 'react';
  import { trackAskFriendLanding, trackAskFriendVote } from '@/lib/analytics';

  // 컴포넌트 본문 상단
  useEffect(() => {
    trackAskFriendLanding('teto-egen', meta.isOwn);
  }, [meta.isOwn]);
  ```

  6-2. `submit.mutate`의 `onSuccess`에 평가 트래킹 ([FriendFlow.tsx:66-71](../../../src/components/features/TetoEgen/FriendFlow.tsx#L66-L71)):

  Before:

  ```tsx
        {
          onSuccess: (data) => {
            setSubmittedVote(data.myVote);
            setFriendVotes(data.friendVotes);
            setOwnerDisplayName(data.ownerDisplayName);
            setOwnerSelfAnswer(data.ownerSelfAnswer);
          },
  ```

  After:

  ```tsx
        {
          onSuccess: (data) => {
            setSubmittedVote(data.myVote);
            setFriendVotes(data.friendVotes);
            setOwnerDisplayName(data.ownerDisplayName);
            setOwnerSelfAnswer(data.ownerSelfAnswer);
            trackAskFriendVote(
              'teto-egen',
              data.myVote,
              data.myVote === data.ownerSelfAnswer
            );
          },
  ```

  6-3. `handleNext` (F1 결과 화면 [다음] CTA — 릴레이 클릭)는 곧 `/ask/teto-egen`으로 라우팅됨. **별도 `trackAskRelayClick` 이벤트는 불필요** — 그 후 `LandingHero`의 `useEffect`가 `entry_point: 'relay'`로 `ask_view`를 발화하므로 릴레이 측정 가능.

- [ ] **Step 7: 타입 체크 + 린트**

  ```bash
  pnpm type-check && pnpm lint
  ```

  Expected: 통과.

- [ ] **Step 8: 로컬 console 검증**

  `.env.local`에 `NEXT_PUBLIC_GA_ID=G-CBJFPV9C95`를 일시 설정 후 `pnpm start`. 단 `analytics.ts`의 dev 가드(`NODE_ENV !== 'production'` → console.debug)로 인해 실제 전송은 안 됨. console에서 `[GA] ask_view {...}` 로그가 찍히는지 확인.

  검증 시퀀스:
  1. `/ask/teto-egen` 진입 → console에 `[GA] ask_view {topic: 'teto-egen', entry_point: 'direct', ...}`
  2. [시작하기] → 카카오 로그인 후 `/ask/teto-egen/my` → 자기평가 q1/q2 → console에 `[GA] ask_self_answer {...}`
  3. 이름 입력 + 링크 생성 → console에 `[GA] ask_link_create {...}`
  4. [링크 복사하기] → console에 `[GA] ask_share_link {topic, method: 'copy'}`
  5. 별도 시크릿 창에서 share URL 진입 → console에 `[GA] ask_friend_landing {...}`
  6. 친구 평가 제출 → console에 `[GA] ask_friend_vote {...}`
  7. [다음] → 메인 흐름 진입 → console에 `[GA] ask_view {entry_point: 'relay', ...}`

  Expected: 7개 이벤트가 순서대로 console.debug에 찍힘. 검증 후 `.env.local`의 임시 ID는 다시 비울 것.

- [ ] **Step 9: 사용자 확인 후 커밋**

  ```bash
  git add src/components/features/TetoEgen
  git commit -m "feat(ga): track Ask H3 (teto-egen) funnel events"
  ```

---

### Task 6: 운영 문서 갱신 (`ga4-guide.md`, `ga4-master-plan.md`)

**Files:**

- Modify: [docs/ga4-guide.md](../../ga4-guide.md)
- Modify: [docs/analytics/ga4-master-plan.md](../../analytics/ga4-master-plan.md)

- [ ] **Step 1: `ga4-guide.md` 헤더 → 환경별 ID 표**

  파일 상단의:

  ```md
  > GA4 속성: `G-CBJFPV9C95`
  ```

  를 다음으로 교체:

  ```md
  > **환경별 GA4 속성:**
  >
  > | 환경              | 측정 ID                           | 비고           |
  > | ----------------- | --------------------------------- | -------------- |
  > | Real (Production) | (Vercel `NEXT_PUBLIC_GA_ID` 참고) | 분석 기준      |
  > | Beta (Preview)    | `G-CBJFPV9C95`                    | QA/검증용      |
  > | Local             | 미설정                            | gtag.js 미로드 |
  >
  > 보고서/맞춤 측정기준은 두 속성에 각각 등록.
  ```

- [ ] **Step 2: `ga4-guide.md` §1 비교 퍼널 표 갱신**

  [docs/ga4-guide.md:21-29](../../ga4-guide.md#L21-L29) 비교 퍼널 표에서 `compare_share`/`compare_landing`/`compare_result` 행 제거하고 비고에 한 줄 명시:

  ```md
  ### 비교 퍼널 (그룹 전용 — 1:1은 2026-04 폐기)

  | #   | 이벤트명         | 파라미터                      | 설명                     |
  | --- | ---------------- | ----------------------------- | ------------------------ |
  | 6   | `compare_create` | `slug`, `source`              | 그룹 비교 링크 생성 성공 |
  | 7   | `group_result`   | `bundle_slug`, `member_count` | 그룹 비교 결과 조회      |

  > 1:1 비교 폐기 이전 데이터는 GA4 콘솔에 남아있음 — 새 분석에는 포함 금지.
  ```

  파라미터 값 표([docs/ga4-guide.md:30-39](../../ga4-guide.md#L30-L39))에서 `compare_type` 행 제거.

- [ ] **Step 3: `ga4-guide.md` §3 보고서 섹션 갱신**
  - §3-3, §3-4의 `compare_share`/`compare_landing`/`compare_result` 의존 보고서는 현재 측정 불가 — 섹션 통째로 제거하거나 "(현재 측정 안 됨, 향후 그룹 공유 트래킹 추가 시 복구)"로 표시.
  - §4 주간 KPI 표에서 `공유율`, `유입 전환율`, `결과 도달율` 행 제거.

- [ ] **Step 4: `ga4-guide.md` §7 트러블슈팅 갱신**

  ```md
  2. **GA4 속성 ID 맞는지** — `G-CBJFPV9C95` 확인
  ```

  →

  ```md
  2. **GA4 속성 ID 맞는지** — DevTools Network에서 `gtag/js?id=G-...` 호출의 ID가 현재 환경(Real/Beta) 기대값과 일치하는지 확인
  ```

- [ ] **Step 5: `ga4-master-plan.md` 헤더 갱신**

  ```md
  > - GA4 속성: `G-CBJFPV9C95`
  ```

  →

  ```md
  > - GA4 속성: Real/Beta 분리 — `NEXT_PUBLIC_GA_ID` 환경변수로 분기 ([2026-04-28 GA 정비 플랜](../superpowers/plans/2026-04-28-ga-environment-split.md))
  > - 환경별 ID는 운영자 보안상 본 문서에 직접 명시하지 않음 — Vercel Project Settings 참조
  ```

- [ ] **Step 6: `ga4-master-plan.md` §0 현황 표 갱신**
  - `GA4 스크립트 로드` 행: 위치를 `src/app/layout.tsx:55-57` (env 가드 추가됨)로 변경, 상태에 "(환경별 ID 분리)" 추가.
  - `비교 5종` 행 → `비교 2종` (compare_create + group_result만)으로 갱신, "1:1 폐기로 share/landing/result 제거" 명시.
  - 새 행 추가: `Ask H3 (테토/에겐) 7종` — 완료, 위치 `src/lib/analytics.ts` Ask 섹션.

- [ ] **Step 7: `ga4-master-plan.md` §2에 Ask H3 카탈로그 추가**

  새 하위 섹션 `### 2-N. Ask H3 (`/ask/teto-egen`)` 추가, Task 4의 7개 이벤트 표 그대로 옮김. 구현 위치 후보 컬럼에 컴포넌트 경로 명시.

- [ ] **Step 8: 사용자 확인 후 커밋**

  ```bash
  git add docs/ga4-guide.md docs/analytics/ga4-master-plan.md
  git commit -m "docs(ga): split env IDs and update bundle/Ask catalog"
  ```

---

### Task 7: Ask H3 K-factor·전파 보고서 스펙 작성 (신규 문서)

**Files:**

- Create: [docs/analytics/ask-teto-egen-report.md](../../analytics/ask-teto-egen-report.md)

본 문서는 4주 검증(2026-04-25 ~ 2026-05-23) 동안 **"이 테스트가 사람들에게 어느 정도까지 전파되는지"**를 GA4 보고서로 측정하는 운영 매뉴얼이다. 전략 PRD §검증의 4개 시그널 중 GA로 정량화 가능한 (1) 자발적 릴레이 (2) 평균 친구 평가 수 (4) 자발적 2차 사용을 다룬다.

- [ ] **Step 1: 문서 생성**

  파일 경로: `docs/analytics/ask-teto-egen-report.md`

  ```md
  # Ask H3 (테토/에겐) 전파·K-factor 보고서

  > 4주 검증 사이클(2026-04-25 ~ 2026-05-23)의 GA4 운영 매뉴얼.
  > 관련: [전략 PRD](../strategy/2026-04-25-h3-friend-evaluation.md) · [API 스펙](../api/ask-teto-egen-api-spec.md) · [디자인 스펙](../superpowers/specs/2026-04-26-h3-friend-evaluation-design.md)
  > 트래킹 구현: [src/lib/analytics.ts](../../src/lib/analytics.ts) Ask 섹션
  > GA4 속성: Real (Production)에서 측정. Beta는 QA용 — 보고서에서 제외.

  ---

  ## 1. 핵심 가설과 측정 차원

  전략 PRD 핵심 가설: **"핫한 주제(공유 동기) × H3 구조(평가 행위) = 곱셈 관계."**

  GA로 측정 가능한 정량 시그널:

  | 전략 시그널           | GA 측정 차원                                                                | 1차 사이클 목표 |
  | --------------------- | --------------------------------------------------------------------------- | --------------- |
  | (1) 자발적 릴레이     | **K-factor** = 친구 평가 후 본인 링크 생성 비율                             | ≥ 0.6           |
  | (2) 평균 친구 평가 수 | owner 1명당 `ask_friend_vote` 평균                                          | ≥ 3             |
  | (4) 자발적 2차 사용   | `entry_point=direct`인 신규 owner 중 운영자가 안 뿌린 비율 (정성 보강 필요) | ≥ 1건           |

  (3) 운영팸 회자는 정성 채널 — GA 보고서 범위 외.

  ---

  ## 2. 사전 작업 — GA4 맞춤 측정기준 등록 (Real 속성에서 1회)

  본 보고서가 작동하려면 GA4 콘솔 → 관리 → 데이터 표시 → 맞춤 정의에서 다음을 등록해야 한다. **신규 Real 속성과 기존 Beta 속성 각각 등록 필요.**

  맞춤 측정기준 (이벤트 범위):

  | 측정기준 이름  | 이벤트 매개변수             |
  | -------------- | --------------------------- |
  | Ask 주제       | `topic`                     |
  | 진입점         | `entry_point`               |
  | 자기 평가      | `self_answer`               |
  | 자기 예상      | `self_prediction`           |
  | 친구 답변      | `vote`                      |
  | 다수파 일치    | `is_majority_match`         |
  | owner 답 일치  | `matches_owner_self_answer` |
  | 자기 토큰 진입 | `is_own`                    |
  | 공유 방법      | `method`                    |

  맞춤 측정항목 (이벤트 범위, 표준 단위):

  | 측정항목 이름 | 이벤트 매개변수 |
  | ------------- | --------------- |
  | 친구 답변 수  | `friend_count`  |

  > 등록 후 데이터 반영 24~48시간. DebugView/실시간은 즉시.

  ---

  ## 3. K-factor 보고서 (자발적 릴레이)

  K-factor = (친구 평가를 한 친구 중, 4주 내 본인 링크를 생성한 비율).

  **GA4에서 만드는 법 — 탐색 / 자유형식 (User-Scoped):**

  1. GA4 콘솔 → 탐색 → 자유형식
  2. 세그먼트 2개 만들기:
     - 세그먼트 A: `ask_friend_vote` 이벤트가 1회 이상 발생한 사용자 (= 친구 평가자 모집단)
     - 세그먼트 B: 세그먼트 A AND `ask_link_create` 이벤트가 1회 이상 발생한 사용자 (= 친구 평가 후 본인 링크 생성자)
  3. 측정항목: `총 사용자` (User-scoped)
  4. K-factor = 세그먼트 B / 세그먼트 A

  > User ID 기반 세그먼트 정확도를 위해 `ask_friend_vote`와 `ask_link_create` 둘 다 로그인 후 발화하므로 동일 user_id로 합산됨.

  **읽는 법:**

  - K ≥ 0.6 → 가설 강하게 지지. 핫한 주제 × H3 구조 결합 효과 검증.
  - 0.3 ≤ K < 0.6 → 부분 지지. 주제 효과 비중 검증을 위해 2차 사이클(다른 핫한 주제) 진입.
  - K < 0.3 → 가설 약화. H1(긁는 질문) 검증으로 전환 검토.

  ---

  ## 4. 평균 친구 평가 수 보고서

  **GA4에서 만드는 법 — 탐색 / 자유형식 (Event-Scoped):**

  1. 행: 없음 (전체 합계)
  2. 측정항목 1: `이벤트 수` (필터: `event_name = ask_link_create`) → owner 수
  3. 측정항목 2: `이벤트 수` (필터: `event_name = ask_friend_vote`) → 친구 평가 총수
  4. 평균 친구 평가 수 = 측정항목 2 / 측정항목 1

  **분포 보강 — `ask_owner_result_view`의 `friend_count` 평균/중앙값/분포:**

  1. 행: `friend_count` (맞춤 측정기준)
  2. 측정항목: `이벤트 수`
  3. 필터: `event_name = ask_owner_result_view`

  히스토그램 형태로 시각화 → "친구 평가 0건 owner / 1-2건 / 3-5건 / 6+건" 분포 확인. **0건 비율이 높으면 공유 단계의 마찰 점검.**

  ---

  ## 5. 진입 경로 분리 (자발적 2차 사용 시그널)

  `ask_view` 이벤트의 `entry_point` 차원 분포로 본다.

  - `direct` — URL 직접 / 메인 → 진입. 운영자 노출 없는 경로.
  - `relay` — 친구 평가 후 [다음] 버튼으로 본인 흐름 진입. **자발적 릴레이의 강한 시그널.**
  - `share_link` — (현재 트래킹은 `direct`로 잡힘. 친구 진입 페이지는 `ask_friend_landing`로 별도 측정.)

  **GA4에서 만드는 법:**

  1. 탐색 / 자유형식
  2. 행: `entry_point`
  3. 측정항목: `이벤트 수`
  4. 필터: `event_name = ask_view`

  **읽는 법:**

  - `relay` 비중 > 30% → 친구 평가 → 본인 흐름의 자연스러운 발판이 작동.
  - `direct` 신규 owner 중 운영자 노출 없는 사용자 → 자발적 2차 사용 후보. user_id 단위로 owner 명단 추출 후 정성 검증(누가 만들었는지) 필요.

  ---

  ## 6. 적중/빗나감 분포 (콘텐츠 품질 시그널)

  `ask_owner_result_view`의 `is_majority_match` 분포로 본다.

  - true 비율 = "친구가 자기 자신을 보는 시선과 일치한 owner 비율".
  - 너무 높으면(>80%) 콘텐츠가 뻔함 → 흥미 저하.
  - 너무 낮으면(<20%) 자기 객관화 실패가 흔함 → 흥미 시그널이지만 너무 잦으면 실망감.

  **GA4에서 만드는 법:**

  1. 탐색 / 자유형식
  2. 행: `is_majority_match`
  3. 측정항목: `이벤트 수`
  4. 필터: `event_name = ask_owner_result_view AND friend_count >= 1`

  > `friend_count = 0`인 결과 조회는 majority 계산 의미 없음 → 필터로 제외.

  ---

  ## 7. 일별 모니터링 대시보드 (4주 검증 기간)

  GA4 콘솔 → 보고서 → 라이브러리에서 컬렉션 만들고 다음 카드 4개 고정:

  | 카드            | 이벤트              | 차원                 | 목적                                |
  | --------------- | ------------------- | -------------------- | ----------------------------------- |
  | 일별 진입       | `ask_view`          | 일자 × `entry_point` | 운영자 푸시 효과 + 자발적 진입 추적 |
  | 일별 owner 생성 | `ask_link_create`   | 일자                 | 콘텐츠 진입 강도                    |
  | 일별 친구 평가  | `ask_friend_vote`   | 일자                 | 1차 공유 효과                       |
  | K-factor 일별   | 위 §3 세그먼트 비율 | 일자                 | 릴레이 강도 변화                    |

  ---

  ## 8. 4주 종료 시 회고 데이터 패키지

  종료일(2026-05-23)에 다음을 GA4에서 추출해 회고 입력:

  - K-factor 최종값 (4주 누적)
  - owner 수 / 친구 평가 총 수 / 평균 친구 평가 수
  - `entry_point` 분포 (direct / relay)
  - `is_majority_match` true:false 비율
  - owner 명단 (user_id 단위) — 운영자가 뿌린 명단과 대조해 자발적 2차 사용 후보 산출
  - 일별 K-factor 추이 그래프 (스크린샷)

  이 패키지를 다음 회고 문서의 "1차 사이클 결과" 섹션 데이터 출처로 사용.

  ---

  ## 9. 트래킹 누락/이상 시 점검

  1. **이벤트가 안 보임** — Real 속성에 맞춤 측정기준 등록했는지 확인 (§2). 등록 안 했으면 파라미터(`topic`, `entry_point` 등) 차원이 안 보임.
  2. **K-factor가 비정상적으로 낮음** — 친구 평가 후 [다음] CTA 클릭 → `ask_view` `entry_point=relay` 발화 → 자기평가 진행 → `ask_link_create` 발화 흐름이 끊기는 지점 확인. DebugView로 한 사용자 세션 따라가며 검증.
  3. **`ask_friend_landing`은 있는데 `ask_friend_vote`가 적음** — 친구 평가 진입 → 답변 제출 사이 이탈. 평가 화면 마찰 점검.
  4. **`ask_owner_result_view` `friend_count` 분포가 0에 몰림** — 공유 후 친구 도달 안 됨. 카카오 메시지 미리보기 / 링크 매력도 점검.
  ```

- [ ] **Step 2: 사용자 확인 후 커밋**

  ```bash
  git add docs/analytics/ask-teto-egen-report.md
  git commit -m "docs(ga): add Ask H3 K-factor and propagation report spec"
  ```

---

### Task 8: 배포 후 환경별·이벤트별 검증

**Files:** 없음 (런타임 검증)

- [ ] **Step 1: develop 머지 → Beta 배포 후 검증**
  - DevTools Network에서 `gtag/js?id=G-CBJFPV9C95` (기존 ID) 호출 확인
  - 베타에서 Ask 플로우 1회 완주 → GA4 Beta 속성 실시간에서 7개 이벤트 순서 확인

- [ ] **Step 2: main 머지 → Real 배포 후 검증**
  - DevTools Network에서 `gtag/js?id=` 쿼리값이 **신규 Real ID**인지 확인
  - Real에서 Ask 플로우 1회 완주 → GA4 Real 속성 실시간에서 7개 이벤트 확인
  - Real 속성에 맞춤 측정기준 등록 (Task 7 §2 표 그대로)

- [ ] **Step 3: 로컬 검증 — gtag.js 미로드**

  `.env.local`에 `NEXT_PUBLIC_GA_ID` 비운 상태로 `pnpm start`. DevTools Network에서 `googletagmanager.com` 호출 0건. console에서 `[GA] ...` 디버그 로그는 dev 모드 가드로 인해 떠도 무방(전송 X).

- [ ] **Step 4: 그룹 비교 회귀 확인**

  Real에서 `/bundle/...` 진입 → 결과 페이지 → 그룹 비교 링크 생성 → 그룹 결과 진입. GA4 실시간에서 다음만 발화하는지 확인:
  - `bundle_view`, `bundle_start`, `bundle_answer`, `bundle_complete`, `bundle_result_view`
  - `compare_create` (파라미터에 `compare_type` 없음, `slug`/`source`만)
  - `group_result`

  **`compare_share`/`compare_landing`/`compare_result`는 발화 안 함** (Task 3에서 함수 자체 제거).

- [ ] **Step 5: 1차 사이클 시작 (2026-05-13 출시 후 4주)**

  Task 7의 §7 일별 대시보드를 GA4 라이브러리에 만들어 매일 모니터링. 4주 종료 시(2026-05-23) §8 회고 데이터 패키지 추출.

---

## 3. 자가 점검

**Spec coverage:**

- [x] "신규 GA 키 환경 변수로 분리" — Task 1 (코드) + Task 2 (env 문서)
- [x] "번들 스펙 변경 → 맞춤 이벤트 변경 필요한지 확인" — §0-3 분석 + Task 3 (죽은 코드 정리)
- [x] "Ask H3 신규 스펙 — 보고서 만들기 위한 GA 전략" — Task 4 (헬퍼) + Task 5 (호출 사이트) + Task 6 (운영 문서) + Task 7 (K-factor 보고서)
- [x] "이 테스트가 사람들에게 어느 정도까지 전파되는지" — Task 7 §3 K-factor + §5 entry_point 분리 + §7 일별 대시보드

**Placeholder scan:** 신규 Real GA ID는 운영자 보안상 문서/플랜에 직접 명시하지 않음 — Vercel 환경변수에서 주입. "TBD" 등 표현 없음.

**Type consistency:**

- `AskTopic = 'teto-egen'`, `AskAnswer = 'TETO' | 'EGEN'` 두 타입을 Task 4에서 정의 후 Task 5의 모든 호출에서 동일하게 사용.
- `trackCompareCreate` 시그니처 변경(Task 3)에 따라 호출부([CreateCompareLink.tsx:102](../../../src/components/features/Bundle/BundleResult/CreateCompareLink.tsx#L102)) 동시 수정 — 컴파일 깨짐 방지.

---

## 4. 향후 별도 사이클 후보 (Out of Scope)

- 그룹 비교 공유 트래킹 복구 — `trackCompareShare` 죽은 함수 제거 후, 그룹용 공유 이벤트(카카오/링크 복사)를 [FullGroupResultView.tsx](../../../src/components/features/Compare/GroupResult/FullGroupResultView.tsx) 등에 다시 박을지 판단. 본 사이클은 제거만.
- 그룹 비교 landing(수신자 진입) 트래킹 — `/compare/group/[token]/page.tsx`에 마운트 트래킹 추가.
- 봇 가드를 자동수집(page_view 등)까지 확장 — 현재 `track()` 함수만 봇 차단, gtag 자동 이벤트는 그대로 통과. GA4 IAB 필터로 보강 중이지만 추가 가드 검토.
