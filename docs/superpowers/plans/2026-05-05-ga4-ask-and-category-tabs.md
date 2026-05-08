# GA4: /ask 진입점 + 소개팅·민폐 탭 트래킹 정리

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 현재 GA4 스펙을 정확히 재정리하고, (1) `/ask` 진입점(특히 메인 promo banner)과 (2) 소개팅·민폐 카테고리 탭에 대한 GA 이벤트를 추가해 콘텐츠 니치 피벗 KPI(2026-05-03 PRD)와 H3 검증 K-factor(2026-04-25 PRD)를 GA4만으로 측정 가능한 상태로 만든다.

**Architecture:** `src/lib/analytics.ts` 단일 진실 원칙 유지. 신규 헬퍼는 도메인 prefix 규칙(`main_`, `ask_promo_banner_`)을 따라 추가하고, 호출 사이트는 컴포넌트 마운트 시점 `useEffect` + `useRef` 가드로 1회 발화. 운영 보고서는 `docs/analytics/`에 신규 매뉴얼 1개 추가 + 기존 2개 갱신. GA4 콘솔의 맞춤 측정기준은 신규 파라미터에 대해 추가 등록.

**Tech Stack:** TypeScript / Next.js App Router / `@next/third-parties/google` / 기존 `track()` 공통 래퍼 / Playwright E2E (qa/) — 단위 테스트 프레임워크 없음. 검증은 dev 환경의 `console.debug('[GA] ...')` 로그와 GA4 DebugView로 수행.

---

## 현황 요약 (재파악, 2026-05-05 기준)

### 환경

| 환경                     | 측정 ID                    | gtag.js |
| ------------------------ | -------------------------- | ------- |
| Real (Vercel Production) | Vercel `NEXT_PUBLIC_GA_ID` | 로드    |
| Beta (Vercel Preview)    | Vercel `NEXT_PUBLIC_GA_ID` | 로드    |
| Local                    | 미설정                     | 미로드  |

`src/app/layout.tsx:55` — `NEXT_PUBLIC_GA_ID`가 빈 값이면 `<GoogleAnalytics>` 자체를 미렌더 (자동수집 차단).

### 트래킹 인프라 (`src/lib/analytics.ts`)

- 공통 래퍼 `track()`: dev 환경 → `console.debug('[GA]', name, params)`로 dry-run / production → `window.gtag('event', ...)` 호출
- 차단 가드: `/dev/*` 라우트 / `bot_score=high` (botDetector 캐시 1회 계산)
- 자동 주입: `user_type` (guest|logged_in 모듈 상태) + `bot_score`
- User properties 헬퍼: `setAnalyticsUserId` / `clearAnalyticsUserId` / `markHasVoted` / `markHasCompletedBundle` / `setUserType` / `initRealUserDetection`

### 구현된 이벤트 카탈로그 (2026-05-05 시점, 단일 진실 = `src/lib/analytics.ts`)

| 도메인 | 이벤트                                                                                                                                                 | 호출 위치                                                               |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| 번들   | `bundle_view` `bundle_start` `bundle_answer` `bundle_complete` `bundle_result_view`                                                                    | 번들 인트로/플레이/결과 페이지                                          |
| 비교   | `compare_create` `group_result`                                                                                                                        | 비교 결과 화면                                                          |
| 싱글   | `single_view` `single_vote_attempt` `single_vote_success` `single_vote_blocked`                                                                        | `SingleDetailView.tsx`                                                  |
| 인증   | `auth_modal_open` `auth_kakao_click` `auth_kakao_callback` `auth_signup_view` `auth_signup_submit` `auth_signup_success` `auth_logout` `auth_withdraw` | `LoginModal` / `SignupForm` / `AuthProvider` 등                         |
| Ask H3 | `ask_view` `ask_self_answer` `ask_link_create` `ask_share_link` `ask_friend_landing` `ask_friend_vote` `ask_owner_result_view`                         | `LandingHero.tsx` `PrimaryFlow.tsx` `FriendFlow.tsx` `MyResultView.tsx` |

### 미구현 영역 (이 플랜의 스코프)

- **메인 페이지 진입/탭 변경/카드 클릭** — 마스터 플랜 §2-1에서 정의되었으나 0건 호출 (소개팅·민폐 카테고리 핏 측정 불가)
- **`/ask` 진입점 분기 부족** — `ask_view`의 `entry_point`가 `direct`/`relay` 2값만 (referrer 검사). 메인 promo banner 클릭 / 카카오 공유 링크 / `/ask` 인덱스 등 진입처 분리 불가
- **`AskPromoBanner` 노출·클릭** — 메인 노출량 대비 클릭률(CTR)을 알 수 없음

### 미구현 영역 (이 플랜의 스코프 외 — 별도 플랜)

- 댓글/좋아요/공유/검색/마이페이지 트래킹 — 마스터 플랜 §2-2 ~ §2-9, Phase 2~3로 미룸

---

## 측정 목적과 KPI 매핑

### 콘텐츠 니치 피벗 KPI (`docs/strategy/2026-05-03-content-niche-pivot.md`)

| 전략 KPI                                                  | GA4 측정 방법                                                                                  | 필요 차원          |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------ |
| 1회 이상 투표 참여 순수 유저 100명 (TKUID 기준)           | `single_vote_success` distinct user_id, 6주 누적                                               | (기존) `category`  |
| 영상→웹 CTR ≥ 1%                                          | UTM 자동 수집 (`utm_source`/`utm_medium`/`utm_campaign`) × `main_view` 이벤트 수 / 영상 노출량 | (신규) `main_view` |
| 카테고리 핏 ≥ 70% (소개팅·민폐 안에서 활동)               | `single_view` `single_vote_success`의 `category` 분포에서 `dating` + `nuisance` 합 비율        | (기존) `category`  |
| 실패 시나리오 3 트리거 (핏 60% 미만 → 카테고리 추가 검토) | 위 분포의 dating-only vs dating+nuisance 분리                                                  | `category`         |

### Ask H3 KPI (`docs/analytics/ask-teto-egen-report.md`)

| 전략 KPI              | GA4 측정 방법                                                                     | 필요 차원                                                  |
| --------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| K-factor ≥ 0.6        | `ask_friend_vote` user 모집단 ∩ `ask_link_create` user 비율                       | (기존) —                                                   |
| 평균 친구 평가 수 ≥ 3 | `ask_owner_result_view`의 `friend_count` 분포                                     | (기존) `friend_count`                                      |
| 자발적 2차 사용 ≥ 1건 | `ask_view` `entry_point=direct`/`main_banner` 분리 후 운영자 푸시 명단 외 user_id | (신규) `entry_point=main_banner`, `entry_point=share_link` |
| 메인 banner CTR       | `ask_promo_banner_click` / `ask_promo_banner_view`                                | (신규) banner 이벤트                                       |

---

## File Structure

| 파일                                                             | 책임                        | 상태                                                                 |
| ---------------------------------------------------------------- | --------------------------- | -------------------------------------------------------------------- |
| `src/lib/analytics.ts`                                           | GA 헬퍼 단일 진실           | 헬퍼 6개 추가                                                        |
| `src/components/features/Main/AskPromoBanner/AskPromoBanner.tsx` | 메인 ask 배너               | view/click 이벤트 추가, 진입처 식별용 querystring `?src=main_banner` |
| `src/components/features/TetoEgen/LandingHero.tsx`               | `/ask/teto-egen` 랜딩       | `entry_point` 분기 확장 (querystring 우선)                           |
| `src/components/features/Main/MainViewClient.tsx`                | 메인 탭/카테고리 상태 관리  | `main_view` + `main_tab_change` 호출                                 |
| `src/components/features/Main/SingleCard/SingleCard.tsx`         | 메인 단일 카드              | `card_click` 호출 (Link wrapper에 onClick)                           |
| `src/components/features/Main/BundleCard/BundleCard.tsx`         | 메인 번들 카드              | `card_click` 호출                                                    |
| `src/components/features/Main/PollCard/PollCard.tsx`             | 메인 폴 카드 (있는 경우)    | `card_click` 호출                                                    |
| `src/components/features/Main/CardList/CardList.tsx`             | 카드 리스트 컨테이너        | `position` 인덱스 prop drill                                         |
| `src/contexts/MainTabContext.tsx`                                | 현재 메인 탭 컨텍스트       | 신규 — 카드 컴포넌트에서 탭 정보 참조                                |
| `docs/analytics/ga4-master-plan.md`                              | 전사 마스터 플랜            | §0 현황 / §2-1 메인 / §2-10 Ask 진입점 갱신                          |
| `docs/analytics/ask-teto-egen-report.md`                         | Ask 보고서                  | banner CTR 섹션 + entry_point 차원 갱신                              |
| `docs/analytics/category-niche-pivot-report.md`                  | (신규) 6주 검증 보고서      | KPI 매뉴얼                                                           |
| `docs/ga4.md`                                                    | 운영 매뉴얼                 | 도메인 prefix 목록 갱신 (`main_`, `ask_promo_banner_`)               |
| `qa/tab/checklist.md`                                            | QA 체크리스트               | `main_tab_change` 발화 항목 추가                                     |
| `qa/main/checklist.md`                                           | QA 체크리스트               | `main_view` / `card_click` / `ask_promo_banner_*` 발화 항목 추가     |
| `qa/ga4/admin-registration-checklist.md`                         | (신규) 콘솔 등록 체크리스트 | 운영자 수동 작업 가이드                                              |

---

## 신규 이벤트 카탈로그 (구현 대상)

| #   | 이벤트                   | 파라미터                                                                                                                                      | 발화 시점                                              |
| --- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 1   | `main_view`              | `tab_kind` (`filter` \| `category`), `tab_value` (`new`/`top`/`my`/`chem` 또는 슬러그), `my_sub_tab?`                                         | 메인 페이지 진입 / 탭 변경 직후 1회 (URL 변경 단위)    |
| 2   | `main_tab_change`        | `from_kind`, `from_value`, `to_kind`, `to_value`                                                                                              | 사용자가 다른 탭으로 전환 시                           |
| 3   | `card_click`             | `card_type` (`single` \| `bundle` \| `poll`), `content_id` (alias/slug), `position` (0-base index), `tab_kind`, `tab_value`, `category_slug?` | 카드 Link 클릭 시                                      |
| 4   | `ask_promo_banner_view`  | `placement` (`main_new` \| `main_category`), `tab_value?`                                                                                     | AskPromoBanner 컴포넌트 mount 1회                      |
| 5   | `ask_promo_banner_click` | `placement`, `tab_value?`                                                                                                                     | 배너 Link 클릭 시                                      |
| 6   | `ask_view` (확장)        | 기존 `topic`, `entry_point` ∈ {`direct`, `relay`, `share_link`, `main_banner`}                                                                | 기존 호출 위치 동일 (querystring `?src=...` 추가 분기) |

> `card_click`의 `category_slug`는 카드의 메인 카테고리(BE `categories[0]`)로 통일.

---

## Tasks

### Task 1: 현황 인벤토리 — `ga4-master-plan.md` §0 현황 표 정확도 갱신

**Files:**

- Modify: `docs/analytics/ga4-master-plan.md` (§0 현황 요약 표 + 진행률 문장)

- [ ] **Step 1: §0 현황 표를 현재 코드 상태에 맞게 갱신**

`docs/analytics/ga4-master-plan.md` 의 §0 현황 요약 표 전체(현재 9~10행)를 다음으로 교체:

```markdown
| 영역                                 | 상태                                                          | 위치                                                                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GA4 스크립트 로드                    | 완료 (환경별 ID 분리)                                         | `src/app/layout.tsx:55`                                                                                                                                       |
| 커스텀 이벤트 유틸                   | 완료 (track() 공통 래퍼 + bot/dev 가드 + user_type 자동 주입) | `src/lib/analytics.ts`                                                                                                                                        |
| User ID 연동                         | 완료                                                          | `src/providers/AuthProvider.tsx`                                                                                                                              |
| 번들 퍼널 5종                        | 완료                                                          | `bundle_view`, `bundle_start`, `bundle_answer`, `bundle_complete`, `bundle_result_view`                                                                       |
| 비교 2종                             | 완료 (1:1 폐기로 share/landing/result 제거)                   | `compare_create`, `group_result`                                                                                                                              |
| **싱글 투표 4종**                    | **완료**                                                      | `single_view`, `single_vote_attempt`, `single_vote_success`, `single_vote_blocked`                                                                            |
| **인증 8종**                         | **완료**                                                      | `auth_modal_open`, `auth_kakao_click`, `auth_kakao_callback`, `auth_signup_view`, `auth_signup_submit`, `auth_signup_success`, `auth_logout`, `auth_withdraw` |
| Ask H3 7종                           | 완료 (entry_point: direct/relay 2값)                          | `ask_view`, `ask_self_answer`, `ask_link_create`, `ask_share_link`, `ask_friend_landing`, `ask_friend_vote`, `ask_owner_result_view`                          |
| **메인 view/tab/card**               | **미구현**                                                    | — (이 플랜 Task 4~6)                                                                                                                                          |
| **Ask 메인 banner**                  | **미구현**                                                    | — (이 플랜 Task 2~3)                                                                                                                                          |
| **공유·댓글·좋아요·검색·마이페이지** | 미구현                                                        | — (별도 플랜)                                                                                                                                                 |
| 맞춤 측정기준 등록                   | 번들·비교·Ask 파라미터만 부분 등록                            | GA4 Admin                                                                                                                                                     |
```

진행률 문장 갱신: 표 바로 아래의

```
전체 인터랙션 약 134개 중 약 15%만 트래킹 중. 현 상태로는 **싱글 투표 전환율·회원가입 퍼널·리텐션을 분석할 수 없음.**
```

을 다음으로 교체:

```
Ask H3 + 싱글 + 인증 + 번들·비교까지 약 26종 구현. **메인/공유/댓글/검색은 여전히 미구현이라 카테고리 핏·banner CTR·페이지 진입 분포는 분석할 수 없음.**
```

- [ ] **Step 2: type-check 확인**

```bash
pnpm type-check
```

Expected: 에러 0건 (문서 변경만이라 영향 없음, 안전 검사).

- [ ] **Step 3: 사용자에게 변경사항 보고 후 커밋 승인 요청**

CLAUDE.md 규칙에 따라 사용자 승인 후에만:

```bash
git add docs/analytics/ga4-master-plan.md
git commit -m "docs(ga4): 마스터 플랜 §0 현황을 2026-05-05 코드 상태에 맞게 갱신"
```

---

### Task 2: `ask_view` `entry_point` enum 확장 — `share_link`, `main_banner`

**Files:**

- Modify: `src/lib/analytics.ts` (Ask 섹션 `trackAskView` 시그니처)
- Modify: `src/components/features/TetoEgen/LandingHero.tsx` (querystring 우선 분기)

- [ ] **Step 1: `analytics.ts`의 `trackAskView` 시그니처 확장**

`src/lib/analytics.ts` 의 Ask 섹션에서 `trackAskView`(현재 `entry_point: 'direct' | 'share_link' | 'relay'`로 정의)를 다음으로 교체:

```ts
/** 랜딩 진입. entry_point는 querystring `src` 파라미터(있을 시) > referrer 검사 순. */
export function trackAskView(
  topic: AskTopic,
  entryPoint: 'direct' | 'relay' | 'share_link' | 'main_banner'
) {
  track('ask_view', { topic, entry_point: entryPoint });
}
```

타입만 확장 — body는 동일.

- [ ] **Step 2: `LandingHero.tsx` 진입점 분기 강화**

`src/components/features/TetoEgen/LandingHero.tsx:20-26` 의 `useEffect`를 다음으로 교체:

```tsx
useEffect(() => {
  // 1순위: querystring `?src=...` (메인 banner / 공유 링크가 명시적으로 박는 값)
  const params = new URLSearchParams(window.location.search);
  const src = params.get('src');
  let entryPoint: 'direct' | 'relay' | 'share_link' | 'main_banner' = 'direct';
  if (src === 'main_banner' || src === 'share_link' || src === 'relay' || src === 'direct') {
    entryPoint = src;
  } else {
    // 2순위: referrer가 동일 호스트면 relay, 아니면 direct
    const isInternal =
      typeof document !== 'undefined' &&
      !!document.referrer &&
      document.referrer.includes(window.location.host);
    entryPoint = isInternal ? 'relay' : 'direct';
  }
  trackAskView('teto-egen', entryPoint);
}, []);
```

`useEffect` 의존성 배열은 비워둔다 — 마운트 1회만 발화.

- [ ] **Step 3: dev 환경에서 발화 검증**

```bash
NEXT_PUBLIC_GA_ID=G-DUMMY pnpm start
```

브라우저:

1. `https://localhost/ask/teto-egen` (직접 진입) → console에 `[GA] ask_view {topic: 'teto-egen', entry_point: 'direct', user_type: 'guest', bot_score: ...}`
2. `https://localhost/ask/teto-egen?src=main_banner` → `entry_point: 'main_banner'`
3. `https://localhost/ask/teto-egen?src=share_link` → `entry_point: 'share_link'`

Expected: 3가지 케이스 모두 다른 `entry_point` 값으로 발화.

- [ ] **Step 4: 타입체크 + lint**

```bash
pnpm type-check && pnpm lint
```

Expected: 에러 0건.

- [ ] **Step 5: 사용자 승인 후 커밋**

```bash
git add src/lib/analytics.ts src/components/features/TetoEgen/LandingHero.tsx
git commit -m "feat(ga4): ask_view entry_point에 share_link/main_banner 추가, querystring 우선 분기"
```

---

### Task 3: AskPromoBanner view/click 트래킹

**Files:**

- Modify: `src/lib/analytics.ts`
- Modify: `src/components/features/Main/AskPromoBanner/AskPromoBanner.tsx`
- Modify: `src/components/features/Main/MainViewClient.tsx` (banner 호출에 prop 전달)

- [ ] **Step 1: `analytics.ts`에 banner 헬퍼 2개 추가**

`src/lib/analytics.ts` 의 Ask 섹션 끝(현재 `trackAskOwnerResultView` 다음)에 추가:

```ts
export type AskBannerPlacement = 'main_new' | 'main_category';

/** 메인 ask promo banner 노출 (mount 시 1회). */
export function trackAskPromoBannerView(placement: AskBannerPlacement, tabValue?: string) {
  track('ask_promo_banner_view', { placement, tab_value: tabValue });
}

/** 메인 ask promo banner 클릭 (Link 클릭 시). */
export function trackAskPromoBannerClick(placement: AskBannerPlacement, tabValue?: string) {
  track('ask_promo_banner_click', { placement, tab_value: tabValue });
}
```

- [ ] **Step 2: `AskPromoBanner.tsx` 시그니처에 `placement`/`tabValue` 받도록 확장**

`src/components/features/Main/AskPromoBanner/AskPromoBanner.tsx` 전체를 다음으로 교체:

```tsx
'use client';

import { type FC, useEffect, useRef } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import egenImg from '@/assets/img/egen.png';
import tetoImg from '@/assets/img/teto.png';
import styles from '@/components/features/Main/AskPromoBanner/AskPromoBanner.module.scss';
import {
  trackAskPromoBannerClick,
  trackAskPromoBannerView,
  type AskBannerPlacement,
} from '@/lib/analytics';

interface AskPromoBannerProps {
  placement: AskBannerPlacement;
  tabValue?: string;
}

const AskPromoBanner: FC<AskPromoBannerProps> = ({ placement, tabValue }) => {
  const viewedRef = useRef(false);
  useEffect(() => {
    if (viewedRef.current) {
      return;
    }
    viewedRef.current = true;
    trackAskPromoBannerView(placement, tabValue);
  }, [placement, tabValue]);

  return (
    <Link
      href="/ask/teto-egen?src=main_banner"
      onClick={() => trackAskPromoBannerClick(placement, tabValue)}
      className={styles.root}
      aria-label="테토 에겐 친구 평가하러 가기"
    >
      <div className={styles.characters} aria-hidden>
        <Image src={tetoImg} alt="" width={48} height={48} className={styles.character} />
        <Image src={egenImg} alt="" width={48} height={48} className={styles.character} />
      </div>

      <div className={styles.copy}>
        <p className={styles.title}>
          테토? 에겐? <br /> <strong>친구들이 보는 나</strong> 알아보기
        </p>
      </div>

      <svg
        className={styles.chevron}
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M7.5 4L13.5 10L7.5 16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
};

export default AskPromoBanner;
```

핵심 변경:

1. `'use client'` 디렉티브 추가 (useEffect 사용)
2. `placement` / `tabValue` props 도입
3. `useRef` 가드로 mount 1회 view 발화
4. Link `href`에 `?src=main_banner` 추가 — `LandingHero`가 querystring으로 진입처 인식
5. onClick에서 click 이벤트 발화

- [ ] **Step 3: `MainViewClient.tsx`에서 placement/tabValue 전달**

`src/components/features/Main/MainViewClient.tsx:393` 의 `<AskPromoBanner />` 호출을 다음으로 교체:

```tsx
{
  isNewTab || selectedTab.kind === 'category' ? (
    <AskPromoBanner
      placement={isNewTab ? 'main_new' : 'main_category'}
      tabValue={selectedTab.kind === 'filter' ? selectedTab.type : selectedTab.slug}
    />
  ) : null;
}
```

- [ ] **Step 4: dev 환경에서 발화 검증**

```bash
NEXT_PUBLIC_GA_ID=G-DUMMY pnpm start
```

브라우저:

1. `https://localhost/?filter=new` → console에 `[GA] ask_promo_banner_view {placement: 'main_new', tab_value: 'new', ...}` 1회
2. `https://localhost/?category=dating` → `placement: 'main_category', tab_value: 'dating'` 1회
3. 배너 클릭 → `[GA] ask_promo_banner_click ...` + 페이지 이동 후 `[GA] ask_view {entry_point: 'main_banner', ...}`
4. `?category=nuisance` → `tab_value: 'nuisance'`

Expected: 4가지 케이스 모두 정상 발화 + click 이벤트가 이동 직전에 발화 (Link onClick은 navigation 전에 동기 실행).

- [ ] **Step 5: 타입체크 + lint**

```bash
pnpm type-check && pnpm lint
```

Expected: 에러 0건.

- [ ] **Step 6: 사용자 승인 후 커밋**

```bash
git add src/lib/analytics.ts src/components/features/Main/AskPromoBanner/AskPromoBanner.tsx src/components/features/Main/MainViewClient.tsx
git commit -m "feat(ga4): AskPromoBanner view/click 이벤트 + main_banner 진입처 식별"
```

---

### Task 4: `main_view` 이벤트 — 메인 페이지 진입/탭 활성화

**Files:**

- Modify: `src/lib/analytics.ts` (메인 섹션 신설)
- Modify: `src/components/features/Main/MainViewClient.tsx`

- [ ] **Step 1: `analytics.ts`에 메인 섹션 신설 + `trackMainView` 추가**

`src/lib/analytics.ts` 의 Ask 섹션 위(또는 싱글 섹션 다음)에 다음 섹션 추가:

```ts
// ──────────────────────────────────────────────────────────
// 메인 페이지 이벤트 헬퍼
// ──────────────────────────────────────────────────────────

export type MainTabKind = 'filter' | 'category';

export function trackMainView(params: {
  tabKind: MainTabKind;
  tabValue: string;
  mySubTab?: string;
}) {
  track('main_view', {
    tab_kind: params.tabKind,
    tab_value: params.tabValue,
    my_sub_tab: params.mySubTab,
    page_type: 'main',
  });
}
```

- [ ] **Step 2: `MainViewClient.tsx`에 발화 추가**

`src/components/features/Main/MainViewClient.tsx`의 React import에 `useEffect` 추가, `@/lib/analytics`에서 `trackMainView` import. `selectedTab` + `mySubTab` 결정 후 다음 useEffect 추가:

```tsx
useEffect(() => {
  trackMainView({
    tabKind: selectedTab.kind,
    tabValue: selectedTab.kind === 'filter' ? selectedTab.type : selectedTab.slug,
    mySubTab: selectedTab.kind === 'filter' && selectedTab.type === 'my' ? mySubTab : undefined,
  });
}, [selectedTab, mySubTab]);
```

> 동일 탭 내 데이터 refetch는 selectedTab 객체 ID가 동일하므로 useEffect 재발화하지 않음. 탭/서브탭 한 번 전환 = 한 번 발화.

- [ ] **Step 3: dev 환경에서 발화 검증**

```bash
NEXT_PUBLIC_GA_ID=G-DUMMY pnpm start
```

브라우저:

1. `https://localhost/` → console: `[GA] main_view {tab_kind: 'category', tab_value: 'dating', ...}` (디폴트 탭)
2. NEW 탭 클릭 → `[GA] main_view {tab_kind: 'filter', tab_value: 'new', ...}`
3. 민폐 탭 클릭 → `[GA] main_view {tab_kind: 'category', tab_value: 'nuisance', ...}`
4. MY 탭 클릭 → `[GA] main_view {... my_sub_tab: 'compare' or 'vote'}`
5. MY 탭의 댓글 서브탭 클릭 → `[GA] main_view {... my_sub_tab: 'comments'}`

Expected: 모든 탭 전환에서 1회씩 발화.

- [ ] **Step 4: 타입체크 + lint**

```bash
pnpm type-check && pnpm lint
```

Expected: 에러 0건.

- [ ] **Step 5: 사용자 승인 후 커밋**

```bash
git add src/lib/analytics.ts src/components/features/Main/MainViewClient.tsx
git commit -m "feat(ga4): main_view 이벤트 추가 — 탭/서브탭 진입 트래킹"
```

---

### Task 5: `main_tab_change` 이벤트 — 탭 전환 from/to

**Files:**

- Modify: `src/lib/analytics.ts`
- Modify: `src/components/features/Main/MainViewClient.tsx` (`handleTabChange`)

- [ ] **Step 1: `analytics.ts`에 `trackMainTabChange` 추가**

메인 섹션에 추가:

```ts
export function trackMainTabChange(params: {
  fromKind: MainTabKind;
  fromValue: string;
  toKind: MainTabKind;
  toValue: string;
}) {
  track('main_tab_change', {
    from_kind: params.fromKind,
    from_value: params.fromValue,
    to_kind: params.toKind,
    to_value: params.toValue,
  });
}
```

- [ ] **Step 2: `MainViewClient.tsx`의 `handleTabChange`에 발화 삽입**

`src/components/features/Main/MainViewClient.tsx:276-282` 의 `handleTabChange`를 다음으로 교체:

```tsx
const handleTabChange = useCallback(
  (tab: TabSelection) => {
    trackMainTabChange({
      fromKind: selectedTab.kind,
      fromValue: selectedTab.kind === 'filter' ? selectedTab.type : selectedTab.slug,
      toKind: tab.kind,
      toValue: tab.kind === 'filter' ? tab.type : tab.slug,
    });
    router.replace(buildUrlParams(tab));
    window.scrollTo({ top: 0 });
  },
  [router, selectedTab]
);
```

import 갱신:

```tsx
import { trackMainView, trackMainTabChange } from '@/lib/analytics';
```

- [ ] **Step 3: dev 환경에서 발화 검증**

브라우저:

1. 디폴트(소개팅) 진입 후 → NEW 탭 클릭 → `[GA] main_tab_change {from_kind: 'category', from_value: 'dating', to_kind: 'filter', to_value: 'new', ...}` + `[GA] main_view {... 'new'}`
2. NEW → 민폐 → `from_value: 'new', to_value: 'nuisance'`
3. 민폐 → 가치관 비교 → `from_value: 'nuisance', to_value: 'chem'`

Expected: change 이벤트 1회 + 직후 view 이벤트 1회.

- [ ] **Step 4: 타입체크 + lint**

```bash
pnpm type-check && pnpm lint
```

- [ ] **Step 5: 사용자 승인 후 커밋**

```bash
git add src/lib/analytics.ts src/components/features/Main/MainViewClient.tsx
git commit -m "feat(ga4): main_tab_change 이벤트 추가 — 탭 전환 from/to 트래킹"
```

---

### Task 6: `card_click` 이벤트 — 카드 클릭 (카테고리 컨텍스트 포함)

**Files:**

- Modify: `src/lib/analytics.ts`
- Create: `src/contexts/MainTabContext.tsx`
- Modify: `src/components/features/Main/CardList/CardList.tsx` (position 인덱스 prop drill)
- Modify: `src/components/features/Main/SingleCard/SingleCard.tsx`
- Modify: `src/components/features/Main/BundleCard/BundleCard.tsx`
- Modify: `src/components/features/Main/PollCard/PollCard.tsx`
- Modify: `src/components/features/Main/MainViewClient.tsx` (MainTabProvider 주입)

- [ ] **Step 1: `analytics.ts`에 `trackCardClick` 추가**

메인 섹션에 추가:

```ts
export type CardClickType = 'single' | 'bundle' | 'poll';

export function trackCardClick(params: {
  cardType: CardClickType;
  contentId: string;
  position: number;
  tabKind: MainTabKind;
  tabValue: string;
  categorySlug?: string;
}) {
  track('card_click', {
    card_type: params.cardType,
    content_id: params.contentId,
    position: params.position,
    tab_kind: params.tabKind,
    tab_value: params.tabValue,
    category_slug: params.categorySlug,
  });
}
```

- [ ] **Step 2: `MainTabContext` 신설**

`src/contexts/MainTabContext.tsx` 신규 생성:

```tsx
'use client';

import { createContext, useContext, type FC, type ReactNode } from 'react';

import type { MainTabKind } from '@/lib/analytics';

interface MainTabContextValue {
  tabKind: MainTabKind;
  tabValue: string;
}

const MainTabContext = createContext<MainTabContextValue | null>(null);

export const MainTabProvider: FC<{ value: MainTabContextValue; children: ReactNode }> = ({
  value,
  children,
}) => <MainTabContext.Provider value={value}>{children}</MainTabContext.Provider>;

export function useMainTabContext(): MainTabContextValue {
  const ctx = useContext(MainTabContext);
  if (!ctx) {
    throw new Error('useMainTabContext must be used within MainTabProvider');
  }
  return ctx;
}
```

- [ ] **Step 3: `MainViewClient.tsx`에 `<MainTabProvider>` 주입**

`<CardActionsProvider>` 안쪽 또는 바깥쪽에 `<MainTabProvider>` 래핑:

```tsx
<CardActionsProvider>
  <MainTabProvider
    value={{
      tabKind: selectedTab.kind,
      tabValue: selectedTab.kind === 'filter' ? selectedTab.type : selectedTab.slug,
    }}
  >
    {/* 기존 CardList 등 분기 그대로 */}
  </MainTabProvider>
</CardActionsProvider>
```

import 추가:

```tsx
import { MainTabProvider } from '@/contexts/MainTabContext';
```

- [ ] **Step 4: `CardList.tsx`가 카드에 `position` prop 전달**

`src/components/features/Main/CardList/CardList.tsx` 의 카드 분배 로직을 다음으로 교체 (원본 인덱스 보존):

```tsx
const columns = useMemo(() => {
  const cols: { card: CardModel; position: number }[][] = Array.from(
    { length: columnCount },
    () => []
  );
  cards.forEach((card, i) => {
    cols[i % columnCount].push({ card, position: i });
  });
  return cols;
}, [cards, columnCount]);
```

이후 카드 렌더 분기에서 `position`을 prop으로 전달:

```tsx
{
  columns.map((col, colIdx) => (
    <div key={colIdx} className={styles.column}>
      {col.map(({ card, position }) => {
        if (card.type === 'SINGLE')
          return <SingleCard key={card.data.slug} data={card.data} position={position} />;
        if (card.type === 'BUNDLE')
          return (
            <BundleCard
              key={card.data.slug}
              data={card.data}
              position={position}
              ctaLabel={bundleCtaLabel}
            />
          );
        if (card.type === 'POLL')
          return <PollCard key={card.data.alias} data={card.data} position={position} />;
        return null;
      })}
    </div>
  ));
}
```

> 실제 컬럼 렌더 코드 모양은 현재 파일을 확인해 정확히 매핑할 것 — `card.type` 분기 분포가 다르면 그 형태에 맞춤.

- [ ] **Step 5: 카드 컴포넌트들에 `position` prop + `trackCardClick` 호출 추가**

각 카드 컴포넌트에 동일 패턴 적용. 예시 SingleCard.tsx:

```tsx
import { trackCardClick } from '@/lib/analytics';
import { useMainTabContext } from '@/contexts/MainTabContext';

interface SingleCardProps {
  data: SingleCardModel;
  position: number; // 추가
}

export const SingleCard = memo<SingleCardProps>(({ data, position }) => {
  const tabContext = useMainTabContext();
  // ... 기존 로직
  const onCardClick = () => {
    trackCardClick({
      cardType: 'single',
      contentId: data.slug,
      position,
      tabKind: tabContext.tabKind,
      tabValue: tabContext.tabValue,
      categorySlug: data.categories?.[0],
    });
  };

  // SingleCard의 외곽 Link wrapper에 onClick={onCardClick} 부착
  // (현재 SingleCard는 Link로 감싸져 있다면 거기 onClick. Link wrapper가 부모에 있으면 부모에서 처리)
});
```

BundleCard, PollCard도 동일 패턴:

- BundleCard: `cardType: 'bundle'`, `contentId: data.slug`, `categorySlug: data.categories?.[0]` (없으면 undefined)
- PollCard: `cardType: 'poll'`, `contentId: data.alias`, `categorySlug: data.categories?.[0]`

> 카드 외곽 Link가 카드 내부에 있으면 거기 onClick. 외부(부모 그리드)에서 감싸고 있으면 그 부모에서 onClick + position prop을 위 cards.map에서 직접 주입.

- [ ] **Step 6: dev 환경에서 발화 검증**

브라우저:

1. `/?category=dating` 진입 → 첫 번째 카드 클릭 → console: `[GA] card_click {card_type: 'single', content_id: '<alias>', position: 0, tab_kind: 'category', tab_value: 'dating', category_slug: 'dating' or '<other>', ...}`
2. NEW 탭에서 번들 카드 클릭 → `card_type: 'bundle', tab_value: 'new', category_slug: undefined`
3. 민폐 탭에서 두 번째 카드 클릭 → `position: 1, tab_value: 'nuisance'`

Expected: 모든 카드 클릭에서 1회 발화 + position이 카드 노출 순서와 일치.

- [ ] **Step 7: 타입체크 + lint**

```bash
pnpm type-check && pnpm lint
```

Expected: 에러 0건.

- [ ] **Step 8: 사용자 승인 후 커밋**

```bash
git add src/lib/analytics.ts src/contexts/MainTabContext.tsx src/components/features/Main/CardList/CardList.tsx src/components/features/Main/SingleCard/SingleCard.tsx src/components/features/Main/BundleCard/BundleCard.tsx src/components/features/Main/PollCard/PollCard.tsx src/components/features/Main/MainViewClient.tsx
git commit -m "feat(ga4): card_click 이벤트 추가 — 카테고리 핏 측정용 컨텍스트 주입"
```

---

### Task 7: 콘텐츠 니치 피벗 GA 보고서 매뉴얼 작성

**Files:**

- Create: `docs/analytics/category-niche-pivot-report.md`

- [ ] **Step 1: 보고서 매뉴얼 신규 작성**

`docs/analytics/category-niche-pivot-report.md` 파일 생성:

```markdown
# 콘텐츠 니치 피벗 GA 보고서 (소개팅·민폐 카테고리)

> 6주 검증 사이클(2026-05-03 ~ 2026-06-14) GA4 운영 매뉴얼.
> 관련: [전략 PRD](../strategy/2026-05-03-content-niche-pivot.md) · [탭 스펙](../specs/pages/tab.md)
> 트래킹 구현: [src/lib/analytics.ts](../../src/lib/analytics.ts) 메인 섹션
> GA4 속성: Real (Production) 기준. Beta는 QA용 — 보고서 제외.

---

## 1. 핵심 KPI 매핑

| 전략 KPI                                  | GA4 측정 방법                                              | 목표                       |
| ----------------------------------------- | ---------------------------------------------------------- | -------------------------- |
| 1회 이상 투표 참여 순수 유저 (TKUID 기준) | `single_vote_success` distinct user_id, 6주 누적           | ≥ 100명                    |
| 영상→웹 CTR                               | UTM 자동 수집 × `main_view` 이벤트 수 / 영상 노출량(외부)  | ≥ 1%                       |
| 카테고리 핏 (소개팅+민폐 안에서 활동)     | `single_view` `single_vote_success`의 `category_slug` 분포 | ≥ 70% (실패 트리거: < 60%) |

> 카테고리 핏은 단독 `dating` 비율과 `dating ∪ nuisance` 비율을 분리 측정.

---

## 2. 사전 작업 — GA4 맞춤 측정기준 등록 (Real 속성에서 1회)

GA4 콘솔 → 관리 → 데이터 표시 → 맞춤 정의:

| 측정기준 이름 | 이벤트 매개변수 |
| ------------- | --------------- |
| 메인 탭 종류  | `tab_kind`      |
| 메인 탭 값    | `tab_value`     |
| MY 서브탭     | `my_sub_tab`    |
| 카드 종류     | `card_type`     |
| 카드 위치     | `position`      |
| 카드 카테고리 | `category_slug` |
| 콘텐츠 ID     | `content_id`    |
| Banner 위치   | `placement`     |

> 데이터 반영 24~48시간. DebugView는 즉시.

---

## 3. KPI ① 1회 이상 투표 참여 유저 (TKUID 100명)

**탐색 → 자유 형식 (User-scoped 측정):**

1. 행: 없음 (전체 합계)
2. 측정항목: `총 사용자` (User-scoped)
3. 필터: `event_name = single_vote_success`
4. 기간: 2026-05-03 ~ 현재

**카테고리 핏 동시 보기:**

5. 보조 행: `category_slug` 추가
6. 결과: 슬러그별 distinct user 분포

**해석:**

- 100명 도달 → 성공 KPI 충족
- 50명 미만 (Week 4 시점) → 라인업 재검토 트리거
- `dating + nuisance` 합 < 70% → 실패 시나리오 3 진입

---

## 4. KPI ② 영상→웹 CTR (UTM 활용)

영상에서 웹으로 들어오는 링크에 UTM:
```

https://hotpick.kr/?category=dating&utm_source=instagram&utm_medium=reels&utm_campaign=2026-05-week2

```

**탐색 → 자유 형식:**

1. 행: `세션 소스/매체` × `세션 캠페인`
2. 측정항목: 세션 수 / `main_view` 이벤트 수
3. 필터: `event_name = main_view`

영상 노출량은 인스타·쇼츠 분석에서 별도 추출 → CTR 수동 계산.

---

## 5. KPI ③ 카테고리 핏 분포

**탐색 → 자유 형식 (Event-scoped):**

1. 행: `category_slug`
2. 측정항목: `이벤트 수`
3. 필터: `event_name IN (single_view, single_vote_success)`

---

## 6. 보조 차원 — 탭 진입 분포

**탐색 → 자유 형식:**

1. 행: `tab_kind` × `tab_value`
2. 측정항목: `이벤트 수`
3. 필터: `event_name = main_view`

---

## 7. 메인 banner CTR (Ask 진입 보강)

**탐색 → 자유 형식:**

1. 측정항목 1: `이벤트 수` 필터 `event_name = ask_promo_banner_view` → 노출 수
2. 측정항목 2: `이벤트 수` 필터 `event_name = ask_promo_banner_click` → 클릭 수
3. CTR = 측정항목 2 / 측정항목 1
4. 분리 보고: 행에 `placement` (`main_new` vs `main_category`)

---

## 8. 일별 모니터링 카드 (라이브러리에 고정)

| 카드 | 이벤트 | 차원 |
| --- | --- | --- |
| 일별 메인 진입 | `main_view` | 일자 × `tab_value` |
| 일별 투표 성공 | `single_vote_success` | 일자 × `category_slug` |
| 일별 카드 클릭 | `card_click` | 일자 × `tab_value` × `category_slug` |
| 일별 banner CTR | `ask_promo_banner_*` | 일자 × `placement` |

---

## 9. Week 4 점검 트리거

| 점검 | 액션 |
| --- | --- |
| Week 4 distinct user < 50 | 카테고리 라인업 재검토 또는 영상 포맷 폐기 |
| Week 4 카테고리 핏 < 60% | 화이트리스트에 슬러그 추가 검토 |
| Week 2 첫 6편 평균 조회수 < 5천 | 후킹 포맷 재설계 |
| Week 3 영상→웹 CTR < 0.5% | 영상 포맷 폐기 |

---

## 10. 6주 종료 시 회고 데이터 패키지

종료일(2026-06-14) GA에서 추출:

- 6주 누적 distinct user 수 (KPI ①)
- 카테고리별 분포 (KPI ③)
- 일별 누적 그래프 (스크린샷)
- UTM 세션 분포 (영상 채널별)
- Ask banner CTR (`main_new` vs `main_category`)
- 탭 진입 분포 (`tab_kind` × `tab_value`)

`docs/strategy/retro-2026-06-14-content-niche-pivot.md`(예정) 작성 시 데이터 출처로 사용.
```

- [ ] **Step 2: 사용자 승인 후 커밋**

```bash
git add docs/analytics/category-niche-pivot-report.md
git commit -m "docs(ga4): 콘텐츠 니치 피벗 6주 검증 GA 보고서 매뉴얼 신설"
```

---

### Task 8: Ask H3 보고서 갱신 — banner CTR + entry_point 차원 추가

**Files:**

- Modify: `docs/analytics/ask-teto-egen-report.md`

- [ ] **Step 1: §2 맞춤 측정기준 표에 banner placement 추가**

§2 맞춤 측정기준 표에 행 추가:

```markdown
| Banner 위치 | `placement` |
```

- [ ] **Step 2: §5 진입 경로 분리 섹션 갱신**

`entry_point` 설명을 다음으로 교체:

```markdown
- `direct` — URL 직접 진입.
- `relay` — 친구 평가 후 [다음] 버튼으로 본인 흐름 진입.
- `share_link` — `?src=share_link` 쿼리가 있는 진입 (카카오 공유 메시지 예정).
- `main_banner` — HotPick 메인의 promo banner 클릭.

`main_banner`와 `share_link` 진입 비중을 별도로 보면 운영자 푸시 외 자발적 진입 후보 user_id를 좁힐 수 있다.
```

- [ ] **Step 3: §11 banner CTR 섹션 신설**

문서 끝에 §11 추가:

```markdown
---

## 11. 메인 banner CTR (`ask_promo_banner_*`)

**측정 의도:** 메인의 H3 진입점인 promo banner가 얼마나 효율적으로 Ask 흐름에 데려오는지.

**GA4에서 만드는 법:**

1. 행: `placement`
2. 측정항목 1: `이벤트 수` 필터 `event_name = ask_promo_banner_view`
3. 측정항목 2: `이벤트 수` 필터 `event_name = ask_promo_banner_click`
4. CTR = 측정항목 2 / 측정항목 1

**해석:**

- placement = `main_new` vs `main_category`의 CTR 비교.
- 두 placement 모두 CTR < 2% → banner 카피·이미지 재설계 검토.
- `main_category` CTR이 `main_new`보다 유의미하게 높으면 → 카테고리 사용자가 H3에 더 큰 친화도.
```

- [ ] **Step 4: 사용자 승인 후 커밋**

```bash
git add docs/analytics/ask-teto-egen-report.md
git commit -m "docs(ga4): Ask H3 보고서에 banner CTR + entry_point 신규 값 반영"
```

---

### Task 9: 마스터 플랜 §2-1 / §2-10 갱신 + `ga4.md` prefix 갱신

**Files:**

- Modify: `docs/analytics/ga4-master-plan.md` (§2-1 메인, §2-10 Ask)
- Modify: `docs/ga4.md`

- [ ] **Step 1: 마스터 플랜 §2-1 메인 섹션 갱신**

§2-1 표를 다음 행으로 갱신 (구현된 것은 ✅ 표시):

```markdown
| 이벤트              | 파라미터                                                                         | 구현 위치                                                         |
| ------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `main_view`         | `tab_kind`, `tab_value`, `my_sub_tab?`, `page_type=main`                         | `MainViewClient.tsx` selectedTab useEffect ✅                     |
| `main_tab_change`   | `from_kind`, `from_value`, `to_kind`, `to_value`                                 | `MainViewClient.tsx` handleTabChange ✅                           |
| `card_click`        | `card_type`, `content_id`, `position`, `tab_kind`, `tab_value`, `category_slug?` | `SingleCard` / `BundleCard` / `PollCard` (MainTabContext 주입) ✅ |
| `top_filter_change` | `content_type`, `period`, `category`                                             | `TopSubFilter.tsx` (미구현, Phase 3)                              |
| `card_load_retry`   | `error_reason`                                                                   | `CardList.tsx` (미구현, Phase 3)                                  |
```

- [ ] **Step 2: 마스터 플랜 §2-10 Ask 섹션 갱신**

`ask_view` 행을:

```markdown
| `ask_view` | `topic`, `entry_point` ∈ {`direct`, `relay`, `share_link`, `main_banner`} | `LandingHero.tsx` mount useEffect (querystring `?src=` 우선) |
```

§2-10 표 아래에 banner 이벤트 행 추가:

```markdown
| `ask_promo_banner_view` | `placement` (`main_new` \| `main_category`), `tab_value?` | `AskPromoBanner.tsx` mount useEffect ✅ |
| `ask_promo_banner_click` | `placement`, `tab_value?` | `AskPromoBanner.tsx` Link onClick ✅ |
```

- [ ] **Step 3: 마스터 플랜 §3-1 맞춤 측정기준 표에 신규 파라미터 추가**

§3-1 표에 행 추가:

```markdown
| 메인 탭 종류 | `tab_kind` | 이벤트 |
| 메인 탭 값 | `tab_value` | 이벤트 |
| 카드 카테고리 | `category_slug` | 이벤트 |
| Banner 위치 | `placement` | 이벤트 |
| 출발 탭 종류 | `from_kind` | 이벤트 |
| 출발 탭 값 | `from_value` | 이벤트 |
| 도착 탭 종류 | `to_kind` | 이벤트 |
| 도착 탭 값 | `to_value` | 이벤트 |
| MY 서브탭 | `my_sub_tab` | 이벤트 |
```

- [ ] **Step 4: `docs/ga4.md` prefix 목록 갱신**

다음 줄을:

```
- 호출 사이트: 각 도메인 컴포넌트에서 헬퍼 import. 도메인 prefix — `bundle_*`, `compare_*`, `single_*`, `auth_*`, `ask_*`.
```

다음으로 교체:

```
- 호출 사이트: 각 도메인 컴포넌트에서 헬퍼 import. 도메인 prefix — `main_*`, `bundle_*`, `compare_*`, `single_*`, `auth_*`, `ask_*`, `ask_promo_banner_*`.
```

`## 관련 문서` 섹션에 추가:

```
- 콘텐츠 니치 피벗 6주 검증 보고서: [docs/analytics/category-niche-pivot-report.md](analytics/category-niche-pivot-report.md)
```

- [ ] **Step 5: 사용자 승인 후 커밋**

```bash
git add docs/analytics/ga4-master-plan.md docs/ga4.md
git commit -m "docs(ga4): 마스터 플랜 §2-1/§2-10/§3-1에 메인·banner 이벤트 + 신규 파라미터 반영"
```

---

### Task 10: QA 체크리스트 갱신 — `qa/main`, `qa/tab`

**Files:**

- Modify: `qa/main/checklist.md`
- Modify: `qa/tab/checklist.md`

- [ ] **Step 1: `qa/main/checklist.md`에 GA 발화 검증 항목 추가**

`qa/main/checklist.md` 끝에 추가:

```markdown
## GA4 이벤트 발화 (DebugView 또는 dev console)

- [ ] 메인 진입 시 `main_view` 1회 발화, `tab_kind`/`tab_value` 정확
- [ ] MY 탭 진입 시 `main_view`에 `my_sub_tab` 포함
- [ ] MY 서브탭(투표/내 테스트/댓글/좋아요) 변경 시 `main_view` 추가 발화
- [ ] 카드 클릭 시 `card_click` 1회 발화 (`card_type`, `content_id`, `position`, `category_slug`)
- [ ] 소개팅 탭 진입 시 `ask_promo_banner_view {placement: 'main_category', tab_value: 'dating'}`
- [ ] 민폐 탭 진입 시 `placement: 'main_category', tab_value: 'nuisance'`
- [ ] NEW 탭 진입 시 `placement: 'main_new', tab_value: 'new'`
- [ ] AskPromoBanner 클릭 시 `ask_promo_banner_click` + 이동 후 `ask_view {entry_point: 'main_banner'}`
- [ ] TOP/가치관 비교 탭 진입 시 banner 미노출 → banner 이벤트 0건
```

- [ ] **Step 2: `qa/tab/checklist.md`에 GA 발화 검증 항목 추가**

`qa/tab/checklist.md` 끝에 추가:

```markdown
## GA4 이벤트 발화 (DebugView 또는 dev console)

- [ ] 탭 변경 시 `main_tab_change` 1회 발화, `from_*`/`to_*` 정확
- [ ] 디폴트 진입(소개팅) 후 첫 NEW 클릭: `from_kind: 'category', from_value: 'dating', to_kind: 'filter', to_value: 'new'`
- [ ] 카테고리 → 카테고리(소개팅 → 민폐): 두 to/from 모두 `category`
- [ ] 필터 → 카테고리(NEW → 소개팅)
- [ ] 탭 변경 직후 `main_view` 1회 발화 (총 2개 이벤트)
- [ ] URL 직접 진입(`/?category=nuisance`)은 `main_tab_change` 0건, `main_view` 1건만
```

- [ ] **Step 3: 사용자 승인 후 커밋**

```bash
git add qa/main/checklist.md qa/tab/checklist.md
git commit -m "docs(qa): GA 이벤트 발화 검증 항목을 main/tab 체크리스트에 추가"
```

---

### Task 11: GA4 콘솔 등록 체크리스트 — 운영자 수동 작업

**Files:**

- Create: `qa/ga4/admin-registration-checklist.md`

- [ ] **Step 1: 콘솔 등록 체크리스트 신규 작성**

`qa/ga4/admin-registration-checklist.md` (디렉터리 신설) 생성:

```markdown
# GA4 콘솔 맞춤 측정기준 등록 체크리스트 (Real 속성)

> 이 플랜(2026-05-05-ga4-ask-and-category-tabs)에서 추가된 신규 파라미터를 GA4 콘솔에 등록한다.
> 등록 후 데이터 반영 24~48시간. DebugView/실시간은 즉시.
> 경로: 분석 → 관리 → 데이터 표시 → 맞춤 정의 → 맞춤 측정기준 만들기

## 신규 등록 (이벤트 범위)

- [ ] `tab_kind` ("메인 탭 종류")
- [ ] `tab_value` ("메인 탭 값")
- [ ] `my_sub_tab` ("MY 서브탭")
- [ ] `card_type` ("카드 종류")
- [ ] `position` ("카드 위치")
- [ ] `category_slug` ("카드 카테고리")
- [ ] `placement` ("Banner 위치")
- [ ] `from_kind` ("출발 탭 종류")
- [ ] `from_value` ("출발 탭 값")
- [ ] `to_kind` ("도착 탭 종류")
- [ ] `to_value` ("도착 탭 값")

## 기존 차원 — 값 추가만

- [ ] `entry_point` 차원에 `main_banner` 값이 잡히는지 확인
- [ ] `entry_point` 차원에 `share_link` 값이 잡히는지 (공유 기능 구현 후)

## 핵심 이벤트 지정 (선택)

- [ ] `card_click`
- [ ] `ask_promo_banner_click`

## 잠재고객 신설 (선택)

- [ ] **소개팅 활동 유저**: `main_view` `tab_value = dating` 발생 ≥ 1
- [ ] **민폐 활동 유저**: `main_view` `tab_value = nuisance` 발생 ≥ 1
- [ ] **Banner Clickers**: `ask_promo_banner_click` 발생 ≥ 1

## 검증 (DebugView)

- [ ] dev에서 `NEXT_PUBLIC_GA_ID` 일시 세팅 → 각 이벤트 1회씩 발화 → DebugView 확인
- [ ] DebugView에 새 파라미터(예: `tab_kind`)가 보이지 않으면 등록 누락 의심
```

- [ ] **Step 2: 사용자 승인 후 커밋**

```bash
git add qa/ga4/admin-registration-checklist.md
git commit -m "docs(qa): GA4 콘솔 맞춤 측정기준 등록 체크리스트 추가"
```

---

## 검증 (전체 완료 시)

1. `pnpm type-check` → 0 에러
2. `pnpm lint` → 0 에러
3. dev 발화 시나리오 수동 검증 (브라우저 console):
   - `/` 진입 → `main_view {tab_value: 'dating'}` + `ask_promo_banner_view {placement: 'main_category', tab_value: 'dating'}`
   - 민폐 탭 클릭 → `main_tab_change` + `main_view {tab_value: 'nuisance'}` + `ask_promo_banner_view {tab_value: 'nuisance'}`
   - 첫 카드 클릭 → `card_click {position: 0, tab_value: 'nuisance', category_slug: 'nuisance'}`
   - banner 클릭 → `ask_promo_banner_click` + `ask_view {entry_point: 'main_banner'}`
   - NEW 탭 클릭 → `main_tab_change` + `main_view {tab_value: 'new'}` + `ask_promo_banner_view {placement: 'main_new'}`
   - TOP 탭 클릭 → banner 0건, `main_view {tab_value: 'top'}` 1건
4. 운영자 후속 작업: `qa/ga4/admin-registration-checklist.md`에 따라 GA4 콘솔에 신규 파라미터 등록

---

## 비스코프 (이 플랜에서 다루지 않음)

- 댓글/좋아요/공유/검색/마이페이지 트래킹 — 별도 플랜
- `top_filter_change`, `card_load_retry` — Phase 3
- 카카오 공유 메시지 메타데이터에 `?src=share_link` 박는 작업 — 별도 플랜
- `/ask` 인덱스 페이지 신설 — 신설 시 `ask_index_view` 추가
- BE에서 `category` 차원을 `single_view`/`single_vote_*`에 동봉 (현재는 카드 모델의 `categories[0]` 의존)

---

## Changelog

- 2026-05-05: 작성. 콘텐츠 니치 피벗 PRD(2026-05-03) + 민폐 추가(2026-05-05) + Ask H3 PRD(2026-04-25) GA 측정 가능 상태 만들기 위해.
