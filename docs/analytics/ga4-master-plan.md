# HotPick GA4 마스터 플랜

> 한 줄 요약: 이 문서는 HotPick GA4 트래킹의 단일 진실. 코드 헬퍼 시그니처는 [`src/lib/analytics.ts`](../../src/lib/analytics.ts), 등록 현황 스냅샷은 [`event.md`](../../event.md), 본 문서는 그 둘을 묶어 운영 매뉴얼 + 보고서 카탈로그를 제공한다.
>
> - 관련 PRD: [콘텐츠 니치 피벗](../strategy/2026-05-03-content-niche-pivot.md) · [Ask H3 친구 평가](../strategy/2026-04-25-h3-friend-evaluation.md)
> - 보고서 부속 문서: [Ask H3 K-factor 보고서](./ask-teto-egen-report.md) · [콘텐츠 니치 피벗 6주 검증 보고서](./category-niche-pivot-report.md)
> - 최종 수정일: 2026-05-05

---

## 1. 환경 분리

| 환경                     | 측정 ID                    | gtag.js 로드 | 자동 page_view |
| ------------------------ | -------------------------- | ------------ | -------------- |
| Real (Vercel Production) | Vercel `NEXT_PUBLIC_GA_ID` | 로드         | 수집           |
| Beta (Vercel Preview)    | Vercel `NEXT_PUBLIC_GA_ID` | 로드         | 수집 (QA용)    |
| Local                    | 미설정                     | 미로드       | 미수집         |

- **마운트 가드**: [`src/app/layout.tsx:55`](../../src/app/layout.tsx) 의 `<GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID ?? ''} />` 가 env 빈 값일 때 `<GoogleAnalytics>` 자체를 미렌더 → 자동수집(page_view 등)도 함께 차단.
- **환경별 ID 분리**: Vercel Project Settings의 환경별 `NEXT_PUBLIC_GA_ID` 분기. Real/Beta가 다른 GA 속성을 보도록 구성. 운영자 보안상 본 문서에 직접 ID 명시하지 않음.
- **로컬 디버깅**: 일시적으로 Beta 측정 ID를 로컬에 셋팅하면 DebugView에서 잡을 수 있음. 단, dry-run 가드(`NODE_ENV !== 'production'`)때문에 dev에선 실제 전송 대신 `console.debug` 만 흐름.

---

## 2. 트래킹 인프라

### 2-1. analytics.ts 단일 진실 + track() 래퍼

[`src/lib/analytics.ts`](../../src/lib/analytics.ts) 가 모든 이벤트 헬퍼를 export. 호출 사이트는 도메인 컴포넌트에서 헬퍼만 import. 직접 `window.gtag`를 부르지 않는다.

**공통 래퍼 `track()` (analytics.ts:48-76)** 동작:

- 가드 1 — `typeof window === 'undefined'` 또는 `/dev/*` 라우트 → 전송 스킵
- 가드 2 — `bot_score === 'high'` ([botDetector](../../src/lib/botDetector.ts) 세션 1회 캐시) → 전송 스킵
- 자동 주입 — 모든 이벤트 params에 `user_type` (모듈 상태) + `bot_score` (세션 캐시)를 머지
- dev 분기 — `NODE_ENV !== 'production'` 이면 `console.debug('[GA]', name, merged)` 로 dry-run, 실제 전송 없음
- 프로덕션 — `window.gtag('event', name, merged)` 호출

이 래퍼 덕분에 호출 사이트는 PII·환경 가드를 신경 쓰지 않고 헬퍼만 호출하면 된다.

### 2-2. 설계 원칙

- **네이밍**: `snake_case`, `{도메인}_{액션}` 형태. 도메인 prefix — `main_*`, `bundle_*`, `compare_*`, `single_*`, `auth_*`, `ask_*`, `ask_promo_banner_*`.
- **PII 금지**: 다음은 절대 보내지 말 것.
  - 닉네임 (signup 폼·my 화면 모두)
  - 댓글 본문 (전송 시 길이만)
  - 검색 원문 (길이 + SHA256 앞 8자만)
  - 카카오 ID (내부 UUID로 매핑된 `user.id`만 사용)
- **중복 호출 방지**: 마운트 이벤트는 `useRef + useEffect` 가드로 1회만. 모달 open은 isOpen 변화 시 1회만. 동일 selector 변경으로는 재발화 X.
- **단일값 차원 만들지 말 것**: 예) 폐기된 `compare_type` (한 값만 들어가면 차원으로서 무의미). 가능한 enum이 2개 이상일 때만 차원으로 등록.

### 2-3. User ID + 사용자 속성

| 속성                   | 값                        | 설정 헬퍼                                                  | 설정 시점                                                                  |
| ---------------------- | ------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------- |
| `user_id`              | 서버 DB `user.id` (UUID)  | `setAnalyticsUserId(userId)`                               | 로그인 직후 ([AuthProvider.tsx:192](../../src/providers/AuthProvider.tsx)) |
| `user_type`            | `guest` / `logged_in`     | `setUserType(type)` (모듈 상태 + property)                 | 세션 시작, 로그인/아웃 시                                                  |
| `signup_method`        | `kakao`                   | `trackAuthSignupSuccess` 내부 `setUserProperties`          | 회원가입 성공                                                              |
| `gender`               | `male` / `female`         | 동상                                                       | 회원가입 성공                                                              |
| `has_voted_ever`       | `true`                    | `markHasVoted()` (localStorage 가드 1회)                   | 첫 `single_vote_success` / `bundle_complete`                               |
| `has_completed_bundle` | `true`                    | `markHasCompletedBundle()` (localStorage 가드 1회)         | 첫 `bundle_complete`                                                       |
| `is_real_user`         | `true`                    | `initRealUserDetection()` (pointerdown/keydown/scroll 1회) | 첫 실제 인터랙션                                                           |
| `bot_score`            | `low` / `medium` / `high` | `track()` 자동 주입                                        | 모든 이벤트                                                                |

리텐션·세그먼트 분석에 핵심 재료. `initRealUserDetection`은 [AuthProvider.tsx:209](../../src/providers/AuthProvider.tsx) 에서 1회 시동.

---

## 3. 이벤트 카탈로그 (도메인별, 코드와 정합)

각 표 컬럼: `# | 이벤트 | 파라미터 | 발화 시점 (호출 위치)`. 모든 이벤트에는 `user_type`·`bot_score`가 자동 주입되므로 표의 파라미터에는 생략.

### 3-1. 메인 (5종)

| #   | 이벤트                   | 파라미터                                                                                                      | 발화 시점 (호출 위치)                                                                                                                                                                 |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `main_view`              | `tab_kind` (`filter`\|`category`), `tab_value`, `my_sub_tab?`, `page_type=main`                               | 메인 진입/탭 변경 1회 ([MainViewClient.tsx:224](../../src/components/features/Main/MainViewClient.tsx))                                                                               |
| 2   | `main_tab_change`        | `from_kind`, `from_value`, `to_kind`, `to_value`                                                              | `handleTabChange` ([MainViewClient.tsx:288](../../src/components/features/Main/MainViewClient.tsx))                                                                                   |
| 3   | `card_click`             | `card_type` (`single`\|`bundle`\|`poll`), `content_id`, `position`, `tab_kind`, `tab_value`, `category_slug?` | 카드 Link 클릭 ([SingleCard.tsx:60](../../src/components/features/Main/SingleCard/SingleCard.tsx), [BundleCard.tsx:57](../../src/components/features/Main/BundleCard/BundleCard.tsx)) |
| 4   | `ask_promo_banner_view`  | `placement` (`main_new`\|`main_category`), `tab_value?`                                                       | 배너 mount 1회 ([AskPromoBanner.tsx:29](../../src/components/features/Main/AskPromoBanner/AskPromoBanner.tsx))                                                                        |
| 5   | `ask_promo_banner_click` | `placement`, `tab_value?`                                                                                     | 배너 Link onClick ([AskPromoBanner.tsx:35](../../src/components/features/Main/AskPromoBanner/AskPromoBanner.tsx))                                                                     |

### 3-2. 싱글 (4종)

| #   | 이벤트                | 파라미터                                                                                                       | 발화 시점                                                                                                |
| --- | --------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1   | `single_view`         | `alias`, `content_id`, `category?`, `vote_status` (`not_voted`\|`voted`\|`expired`), `page_type=single_detail` | [`SingleDetailView.tsx:67`](../../src/components/features/Hotpick/SingleDetailView/SingleDetailView.tsx) |
| 2   | `single_vote_attempt` | `alias`, `content_id`, `option_id`, `page_type=single_detail`                                                  | [`useDetailVote.ts:34`](../../src/hooks/api/useDetailVote.ts)                                            |
| 3   | `single_vote_success` | `alias`, `content_id`, `option_id`, `time_to_vote_ms?`, `page_type=single_detail`                              | mutation 성공 ([`useDetailVote.ts:79`](../../src/hooks/api/useDetailVote.ts))                            |
| 4   | `single_vote_blocked` | `alias`, `content_id`, `reason` (`already_voted`\|`expired`), `page_type=single_detail`                        | mutation 차단 ([`useDetailVote.ts:37,41,87`](../../src/hooks/api/useDetailVote.ts))                      |

### 3-3. 번들 (5종)

| #   | 이벤트               | 파라미터                             | 발화 시점                                                                                                                                                  |
| --- | -------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `bundle_view`        | `slug`, `entry_point?`               | 인트로 mount ([`BundleIntro.tsx:48`](../../src/components/features/Bundle/BundleIntro/BundleIntro.tsx))                                                    |
| 2   | `bundle_start`       | `slug`                               | "시작하기" 클릭 ([`BundleIntro.tsx:73`](../../src/components/features/Bundle/BundleIntro/BundleIntro.tsx))                                                 |
| 3   | `bundle_answer`      | `slug`, `question_index`, `selected` | 질문 답변 ([`BundlePlay.tsx:93`](../../src/components/features/Bundle/BundlePlay/BundlePlay.tsx))                                                          |
| 4   | `bundle_complete`    | `slug`, `question_count`             | 마지막 답변 제출 ([`BundlePlay.tsx:145`](../../src/components/features/Bundle/BundlePlay/BundlePlay.tsx)) — `markHasVoted` + `markHasCompletedBundle` 동반 |
| 5   | `bundle_result_view` | `slug`                               | 결과 진입 ([`BundleResult.tsx:108`](../../src/components/features/Bundle/BundleResult/BundleResult.tsx))                                                   |

### 3-4. 비교 (2종)

| #   | 이벤트           | 파라미터                      | 발화 시점                                                                                                                        |
| --- | ---------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `compare_create` | `slug`, `source`              | 그룹 비교 링크 생성 ([`CreateCompareLink.tsx:102`](../../src/components/features/Bundle/BundleResult/CreateCompareLink.tsx))     |
| 2   | `group_result`   | `bundle_slug`, `member_count` | 그룹 비교 결과 조회 ([`FullGroupResultView.tsx:101`](../../src/components/features/Compare/GroupResult/FullGroupResultView.tsx)) |

> 1:1 비교(`compare_share` / `compare_landing` / `compare_result`)는 2026-04 폐기. 새 분석에는 포함하지 말 것. 그룹 공유 트래킹 복구는 별도 플랜.

### 3-5. 인증 (8종)

| #   | 이벤트                | 파라미터                                                                      | 발화 시점                                                                                                      |
| --- | --------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1   | `auth_modal_open`     | `trigger`, `page_type=auth`                                                   | 모달 노출 ([`LoginModal.tsx:164`](../../src/components/features/Auth/LoginModal.tsx))                          |
| 2   | `auth_kakao_click`    | `return_url_type`, `page_type=auth`                                           | 카카오 시작 클릭 ([`LoginModal.tsx:95`](../../src/components/features/Auth/LoginModal.tsx))                    |
| 3   | `auth_kakao_callback` | `is_new_user`, `success`, `page_type=auth_callback`                           | OAuth 콜백 ([`/auth/kakao/callback/page.tsx:37,49,57,63,65`](../../src/app/auth/kakao/callback/page.tsx))      |
| 4   | `auth_signup_view`    | `page_type=auth_signup`                                                       | 회원가입 폼 진입 ([`SignupForm.tsx:134`](../../src/components/features/Auth/SignupForm.tsx))                   |
| 5   | `auth_signup_submit`  | `gender`, `has_migration`, `page_type=auth_signup`                            | 폼 제출 ([`SignupForm.tsx:211`](../../src/components/features/Auth/SignupForm.tsx))                            |
| 6   | `auth_signup_success` | `gender`, `birth_year_bucket`, `signup_method=kakao`, `page_type=auth_signup` | 가입 성공 ([`SignupForm.tsx:239`](../../src/components/features/Auth/SignupForm.tsx)) — user property 동시 set |
| 7   | `auth_logout`         | (없음)                                                                        | 로그아웃 ([`AuthProvider.tsx:227`](../../src/providers/AuthProvider.tsx))                                      |
| 8   | `auth_withdraw`       | (없음)                                                                        | 회원 탈퇴 ([`MyPageView.tsx:63`](../../src/components/features/MyPage/MyPageView.tsx))                         |

### 3-6. Ask H3 (9종)

> 메인 promo banner 2종(`ask_promo_banner_view` / `ask_promo_banner_click`)은 §3-1 메인 표 cross-reference. Ask 흐름의 진입점이라서 entry_point 분석에서 함께 본다.

| #   | 이벤트                   | 파라미터                                                                                | 발화 시점                                                                                                                                      |
| --- | ------------------------ | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `ask_view`               | `topic` (`teto-egen`), `entry_point` ∈ {`direct`, `relay`, `share_link`, `main_banner`} | 랜딩 mount ([`LandingHero.tsx:35`](../../src/components/features/TetoEgen/LandingHero.tsx)) — querystring `?src=` 우선, fallback referrer 검사 |
| 2   | `ask_self_answer`        | `topic`, `self_answer` (`TETO`\|`EGEN`), `self_prediction`                              | Q2 응답 완료 ([`PrimaryFlow.tsx:74`](../../src/components/features/TetoEgen/PrimaryFlow.tsx))                                                  |
| 3   | `ask_link_create`        | `topic`, `self_answer`, `self_prediction`                                               | 링크 생성 성공 ([`PrimaryFlow.tsx:89`](../../src/components/features/TetoEgen/PrimaryFlow.tsx))                                                |
| 4   | `ask_share_link`         | `topic`, `method` (`copy`\|`kakao`)                                                     | 공유 트리거 ([`PrimaryFlow.tsx:94,137`](../../src/components/features/TetoEgen/PrimaryFlow.tsx))                                               |
| 5   | `ask_friend_landing`     | `topic`, `is_own` (true면 자기 링크 진입 — 평가 차단)                                   | 친구 평가 페이지 mount ([`FriendFlow.tsx:46`](../../src/components/features/TetoEgen/FriendFlow.tsx))                                          |
| 6   | `ask_friend_vote`        | `topic`, `vote`, `matches_owner_self_answer`                                            | 친구 평가 제출 성공 ([`FriendFlow.tsx:84`](../../src/components/features/TetoEgen/FriendFlow.tsx))                                             |
| 7   | `ask_owner_result_view`  | `topic`, `friend_count`, `is_majority_match`                                            | 본인 결과 진입/폴링/재진입 ([`MyResultView.tsx:67`](../../src/components/features/TetoEgen/MyResultView.tsx))                                  |
| 8   | `ask_promo_banner_view`  | (§3-1 #4 참조)                                                                          | (§3-1 #4 참조)                                                                                                                                 |
| 9   | `ask_promo_banner_click` | (§3-1 #5 참조)                                                                          | (§3-1 #5 참조)                                                                                                                                 |

`ask_view.entry_point` enum 의미:

- `direct` — URL 직접 진입 (외부 referrer or 빈 referrer)
- `relay` — 동일 호스트 referrer 또는 친구 평가 후 [다음] 진입
- `share_link` — `?src=share_link` (카카오 공유 메시지 등 명시적 진입)
- `main_banner` — 메인 promo banner 클릭 (`?src=main_banner` 자동)

### 3-7. (미구현) 향후 추가 후보

별도 플랜에서 다룰 미구현 영역. 현재는 0건 호출.

| 도메인              | 후보 이벤트                                                               | 우선순위                                           |
| ------------------- | ------------------------------------------------------------------------- | -------------------------------------------------- |
| 검색 (`/search`)    | `search_open`, `search_submit`, `search_result_click`, `search_no_result` | 중 (PII 회피: 길이+SHA256 앞 8자만)                |
| 댓글 (전역)         | `comment_view`, `comment_submit`, `comment_like`, `comment_load_more`     | 중 (`comment_submit`은 핵심 후보)                  |
| 좋아요·공유 (싱글)  | `single_like_toggle`, `single_share_open`, `single_share_method`          | 중 (바이럴 측정용)                                 |
| 마이페이지 (`/my`)  | `my_view`, `my_sub_tab_change`, `my_nickname_save`, `my_color_change`     | 하 (현재는 `main_view`의 `my_sub_tab`로 부분 대체) |
| 메인 보강           | `top_filter_change` (콘텐츠 타입/기간/카테고리), `card_load_retry`        | 하 (Phase 3)                                       |
| 그룹 비교 공유 복구 | 그룹 `share_link` / `share_landing` 단계                                  | 별도 플랜                                          |

---

## 4. GA4 콘솔 등록 매뉴얼

GA4 콘솔 → 관리(좌측 하단) → 데이터 표시 → 맞춤 정의 → 맞춤 측정기준/측정항목 만들기. 등록 후 데이터 반영 24~48시간 (DebugView·실시간은 즉시).

### 4-1. 맞춤 측정기준 — 이미 등록됨 (event.md 2026-04-29 스냅샷)

#### 이벤트 범위 (29개)

| 이름(한글)        | 영문 키                     | 등록일     |
| ----------------- | --------------------------- | ---------- |
| Ask 주제          | `topic`                     | 2026-04-29 |
| owner 답 일치     | `matches_owner_self_answer` | 2026-04-29 |
| 가입 마이그레이션 | `has_migration`             | 2026-04-29 |
| 가입 방법         | `signup_method`             | 2026-04-29 |
| 가입 성공 여부    | `success`                   | 2026-04-29 |
| 공유 방법         | `method`                    | 2026-04-29 |
| 다수파 일치       | `is_majority_match`         | 2026-04-29 |
| 로그인 트리거     | `trigger`                   | 2026-04-29 |
| 리턴 URL 유형     | `return_url_type`           | 2026-04-29 |
| 번들 slug         | `slug`                      | 2026-04-29 |
| 번들 slug 비교    | `bundle_slug`               | 2026-04-29 |
| 선택지            | `selected`                  | 2026-04-29 |
| 성별              | `gender`                    | 2026-04-29 |
| 신규 가입 여부    | `is_new_user`               | 2026-04-29 |
| 옵션 ID           | `option_id`                 | 2026-04-29 |
| 자기 예상         | `self_prediction`           | 2026-04-29 |
| 자기 토큰 진입    | `is_own`                    | 2026-04-29 |
| 자기 평가         | `self_answer`               | 2026-04-29 |
| 진입점            | `entry_point`               | 2026-04-29 |
| 질문 번호         | `question_index`            | 2026-04-29 |
| 차단 사유         | `reason`                    | 2026-04-29 |
| 출생연도 버킷     | `birth_year_bucket`         | 2026-04-29 |
| 출처              | `source`                    | 2026-04-29 |
| 친구 답변         | `vote`                      | 2026-04-29 |
| 카테고리          | `category`                  | 2026-04-29 |
| 콘텐츠 ID         | `content_id`                | 2026-04-29 |
| 투표 상태         | `vote_status`               | 2026-04-29 |
| 페이지 유형       | `page_type`                 | 2026-04-29 |

#### 사용자 범위 (6개)

| 이름(한글)     | 영문 키                | 등록일     |
| -------------- | ---------------------- | ---------- |
| 가입 방법      | `signup_method`        | 2026-04-29 |
| 번들 완료 경험 | `has_completed_bundle` | 2026-04-29 |
| 봇 점수        | `bot_score`            | 2026-04-29 |
| 사용자 유형    | `user_type`            | 2026-04-29 |
| 성별           | `gender`               | 2026-04-29 |
| 실유저 여부    | `is_real_user`         | 2026-04-29 |
| 투표 경험      | `has_voted_ever`       | 2026-04-29 |

### 4-2. 맞춤 측정항목 — 이미 등록됨

| 이름(한글)     | 영문 키           | 단위   | 등록일     |
| -------------- | ----------------- | ------ | ---------- |
| 그룹 멤버 수   | `member_count`    | 일반   | 2026-04-29 |
| 질문 수        | `question_count`  | 일반   | 2026-04-29 |
| 친구 답변 수   | `friend_count`    | 일반   | 2026-04-29 |
| 투표 소요 시간 | `time_to_vote_ms` | 밀리초 | 2026-04-29 |

### 4-3. 맞춤 측정기준 — 신규 등록 (2026-05-05, 11개)

운영자가 GA4 콘솔에 수동 등록 필요. 모두 이벤트 범위. 등록 후 §3-1 메인·banner 이벤트의 신규 파라미터가 보고서에서 차원으로 잡힘.

| 이름(한글)    | 영문 키         | 범위   | 비고                                         |
| ------------- | --------------- | ------ | -------------------------------------------- |
| 메인 탭 종류  | `tab_kind`      | 이벤트 | `filter` \| `category`                       |
| 메인 탭 값    | `tab_value`     | 이벤트 | `new`/`top`/`my`/`chem` 또는 카테고리 슬러그 |
| MY 서브탭     | `my_sub_tab`    | 이벤트 | `vote`/`mytest`/`comments`/`likes` 등        |
| 카드 카테고리 | `category_slug` | 이벤트 | 카드의 `categories[0]` 슬러그                |
| Banner 위치   | `placement`     | 이벤트 | `main_new` \| `main_category`                |
| 출발 탭 종류  | `from_kind`     | 이벤트 | tab change 이전 kind                         |
| 출발 탭 값    | `from_value`    | 이벤트 | tab change 이전 value                        |
| 도착 탭 종류  | `to_kind`       | 이벤트 | tab change 이후 kind                         |
| 도착 탭 값    | `to_value`      | 이벤트 | tab change 이후 value                        |
| 카드 종류     | `card_type`     | 이벤트 | `single` \| `bundle` \| `poll`               |
| 카드 위치     | `position`      | 이벤트 | 0-base 인덱스                                |

> 등록 누락 의심 시: DebugView에서 새 파라미터(예: `tab_kind`)가 보이지 않으면 해당 차원 등록을 다시 확인.

### 4-4. 핵심 이벤트 토글 권장

GA4 관리 → 이벤트 메뉴에서 아래 이벤트의 **"핵심 이벤트로 표시"** 토글을 켠다 (KPI 대시보드 자동 집계). GA4는 발화 1회 이상 후에만 토글 가능하므로 신규 이벤트는 첫 발화 다음날 작업.

- `single_vote_success`
- `bundle_complete`
- `auth_signup_success`
- `card_click`
- `ask_promo_banner_click`

### 4-5. 잠재고객 사전 정의 (선택)

관리 → 잠재고객 → 잠재고객 만들기:

| 이름               | 조건                                                   |
| ------------------ | ------------------------------------------------------ |
| Activated Users    | `single_vote_success` ≥ 1 **or** `bundle_complete` ≥ 1 |
| Bundle Finishers   | `bundle_complete` ≥ 1                                  |
| Sign-up Completers | `auth_signup_success` ≥ 1                              |
| Banner Clickers    | `ask_promo_banner_click` ≥ 1                           |
| Re-visitors (7d)   | 7일 내 세션 2회 이상                                   |
| Guest Voters       | `user_type = guest` **and** `single_vote_attempt` ≥ 1  |

---

## 5. 보고서 작성 매뉴얼

GA4 메뉴 경로 표기 — `탐색 → 새 탐색 만들기 → {기법명}`. 좌측 변수 패널에서 측정기준·측정항목·세그먼트를 추가 → 우측 탭 설정에 드래그.

### 5-1. 채널별 Single Vote 전환율

**측정 의도**: 영상 채널·SNS·검색 등 유입 소스별로 싱글 투표까지 가는 전환율 비교.

#### UTM 표준

영상에서 웹으로 들어오는 모든 링크에 UTM 강제:

```
https://hotpick.votebox.kr/?category=dating
  &utm_source={instagram|kakaotalk|youtube|twitter|threads|community}
  &utm_medium={reels|shorts|post|tweet|share|dm|bio|description|thread}
  &utm_campaign=skincare-2026-05-w1
```

- `utm_source` enum: `instagram` / `youtube` / `x` / `threads` / `community` / (그 외는 enum 외)
- `utm_medium` enum: `reels` / `shorts` / `post` / `thread` / `dm`
- `utm_campaign`: `YYYY-MM-weekN` 형식 권장

#### 자유 형식 보고서 만드는 단계

1. 탐색 → 새 탐색 만들기 → **자유 형식**
2. 측정기준 추가: `세션 소스/매체` (`session source / medium`), `세션 캠페인` (`session campaign`)
3. 측정항목 추가: `세션`, `이벤트 수`
4. 행: `session source / medium`
5. 값(엑셀로 옮길 두 컬럼):
   - 컬럼 A: `event_name = main_view` 필터의 `이벤트 수` (= 채널별 메인 진입 세션)
   - 컬럼 B: `event_name = single_vote_success` 필터의 `이벤트 수` (= 채널별 투표 성공)
6. **읽는 법**: 컬럼 B / 컬럼 A = 채널별 투표 전환율. instagram-reels 진입 100세션 중 30개가 single_vote_success → 30%.

#### UTM 링크 운영 워크플로우 (Google Sheets 권장)

UTM은 **GA4 측 별도 설정이 없다.** 링크 쿼리스트링이 박혀 있으면 GA4가 자동 감지해 `세션 소스/매체/캠페인` 차원에 자동 분류한다. 운영자는 **링크 만드는 시점에 정확히 박는 것**만 신경 쓰면 된다. 카피 실수·소문자/대문자 혼용·캠페인 누락만 막아도 위 §5-1 보고서가 그대로 동작한다.

##### 권장 도구: Google Sheets 템플릿

콘텐츠 슬러그 1줄을 입력하면 4채널 URL이 한 행에 자동 생성되고 캠페인 히스토리도 자동 보존되는 시트가 운영상 가장 안정적이다. 채널이 늘어나도 컬럼만 추가하면 된다. URL Builder를 매번 여는 것보다 빠르고, 사람의 손글씨가 들어갈 여지가 적다.

##### 시트 셋업

시트 컬럼 구성 (1행은 헤더):

| 컬럼 | 의미                              | 예시                  |
| ---- | --------------------------------- | --------------------- |
| A    | 콘텐츠 슬러그                     | `skincare-myth-01`    |
| B    | utm_campaign (콘텐츠×주차 식별자) | `skincare-2026-05-w1` |
| C    | 메모 (선택)                       | 인스타 릴스 1편째     |
| D    | 인스타 릴스 URL                   | (자동 생성)           |
| E    | 카카오톡 공유 URL                 | (자동 생성)           |
| F    | X (트위터) URL                    | (자동 생성)           |
| G    | 유튜브 설명란 URL                 | (자동 생성)           |

D~G 자동 생성 수식 (한 행에 슬러그 적으면 4채널 URL이 한꺼번에 채워지는 패턴):

```text
D2: ="https://hotpick.votebox.kr/hotpick/"&A2&"?utm_source=instagram&utm_medium=reels&utm_campaign="&B2
E2: ="https://hotpick.votebox.kr/hotpick/"&A2&"?utm_source=kakaotalk&utm_medium=share&utm_campaign="&B2
F2: ="https://hotpick.votebox.kr/hotpick/"&A2&"?utm_source=twitter&utm_medium=tweet&utm_campaign="&B2
G2: ="https://hotpick.votebox.kr/hotpick/"&A2&"?utm_source=youtube&utm_medium=description&utm_campaign="&B2
```

채널이 1개만 필요한 경우라면 단일 셀 수식:

```text
="https://hotpick.votebox.kr/hotpick/"&A2&"?utm_source="&B2&"&utm_medium="&C2&"&utm_campaign="&D2
```

(이때 컬럼은 `슬러그 / source / medium / campaign / 최종 URL` 5개로 구성.)

시트 예시 (1행 헤더 + 2~3행 운영자 입력):

| 콘텐츠 슬러그      | 캠페인                   | 메모     | 인스타 릴스 URL                                                                                                              | 카카오톡 공유 URL                                                                                                            | X URL                                                                                                                      | 유튜브 설명 URL                                                                                                                  |
| ------------------ | ------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `skincare-myth-01` | `skincare-2026-05-w1`    | 릴스 1편 | `https://hotpick.votebox.kr/hotpick/skincare-myth-01?utm_source=instagram&utm_medium=reels&utm_campaign=skincare-2026-05-w1` | `https://hotpick.votebox.kr/hotpick/skincare-myth-01?utm_source=kakaotalk&utm_medium=share&utm_campaign=skincare-2026-05-w1` | `https://hotpick.votebox.kr/hotpick/skincare-myth-01?utm_source=twitter&utm_medium=tweet&utm_campaign=skincare-2026-05-w1` | `https://hotpick.votebox.kr/hotpick/skincare-myth-01?utm_source=youtube&utm_medium=description&utm_campaign=skincare-2026-05-w1` |
| `dating-myth-02`   | `dating-myth-2026-06-w2` | 쇼츠 2편 | (자동)                                                                                                                       | (자동)                                                                                                                       | (자동)                                                                                                                     | (자동)                                                                                                                           |

##### 명명 규칙 (운영자 합의)

- **`utm_source` enum**: `instagram` / `kakaotalk` / `twitter` / `youtube` / `threads` / `community` — 모두 소문자 단일어. enum 외 값은 GA4 보고서에서 따로 줄로 잡혀 노이즈가 됨.
- **`utm_medium` enum**: `reels` / `shorts` / `post` / `dm` / `bio` / `description` / `tweet` / `share` / `thread` — 채널 내 포맷·맥락. 인스타 게시물은 `post`, 인스타 바이오 링크는 `bio`, 유튜브 설명란은 `description`.
- **`utm_campaign` 패턴**: `{콘텐츠-키워드}-{YYYY-MM}-w{주차}`. 예: `skincare-2026-05-w1`, `dating-myth-2026-06-w2`.
- **같은 콘텐츠를 여러 채널에 뿌릴 때 `utm_campaign`은 동일하게** 둘 것. GA에서 `세션 캠페인` 차원으로 합산하면 콘텐츠 단위 총 유입을 즉시 비교할 수 있다. 채널만 다른 변형은 `utm_source` / `utm_medium`만 바꾼다.

##### 간단 옵션 비교

- **Google Sheets 템플릿 (권장)** — 위 셋업. 한 번 만들면 운영 끝까지 재사용. 캠페인 히스토리·채널 누락도 시각적으로 잡힘.
- **Campaign URL Builder** ([ga-dev-tools](https://ga-dev-tools.google/campaign-url-builder/)) — 첫 1~2주 임시용. 한 링크씩 수동 생성이라 캠페인 일관성 유지가 어렵다.
- **Bitly 등 단축 URL** — 인스타 바이오 등 글자수 제한이 있는 곳에서 보조용. 단축 URL 자체는 GA에 영향이 없다 (리디렉트 후 원본 UTM이 그대로 살아남음).

##### 검증 (1회)

운영 시작 직후 1회만 점검하면 이후엔 자동으로 흐른다.

1. 시트에서 만든 링크를 스마트폰으로 직접 클릭.
2. GA4 (Real 속성) → 보고서 → 실시간 → 우측 "이벤트 수" 카드. 클릭한 직후 30초 내에 `page_view` 가 잡히는지 확인.
3. 24시간 후 → 획득 → 트래픽 획득 → 차원: `세션 소스/매체` → 새 utm_source 값(`instagram / reels` 등)이 행으로 잡혔는지 확인.
4. 잡히지 않는 경우: AdBlocker / 쿠키 동의 거부 / 잘못된 도메인(예: `hotpick.kr` ≠ 실제 호스트) / `&` 누락 등을 순서대로 의심.

### 5-2. Ask banner 퍼널 + K-factor + placement CTR

**측정 의도**: 메인 promo banner → Ask 흐름 전환과 자발적 릴레이(K-factor) 동시 측정.

#### Ask 퍼널 (5단계, 탐색 → 퍼널 탐색)

1. `ask_promo_banner_view`
2. `ask_promo_banner_click`
3. `ask_view`
4. `ask_self_answer`
5. `ask_link_create` → 6. `ask_share_link`

각 단계 사이 비율이 단계별 전환율. "view → click" 이 banner CTR.

#### K-factor 세그먼트 2개

탐색 좌측 패널 → 세그먼트 → 사용자 세그먼트:

- **세그먼트 A (Owner)**: `ask_link_create` 발생 1회 이상
- **세그먼트 B (Friend voter)**: `ask_friend_vote` 발생 1회 이상

K-factor 근사 = (B의 user 수) / (A의 user 수). 0.6 이상이 PRD 목표.

#### placement별 CTR (자유 형식)

1. 탐색 → 자유 형식
2. 행: `placement`
3. 값 1 (필터 `event_name = ask_promo_banner_view`): `이벤트 수` → 노출
4. 값 2 (필터 `event_name = ask_promo_banner_click`): `이벤트 수` → 클릭
5. CTR = 값 2 / 값 1
6. **읽는 법**: `main_new` vs `main_category` 비교. 두 placement 모두 CTR < 2% 이면 카피·이미지 재설계 검토.

### 5-3. 테토-에겐 공유 진입자 + 단계별 이탈

**측정 의도**: Ask 공유 링크가 자발적 진입을 만드는지 + 친구 평가 후 본인 결과까지 소비되는지.

#### 공유 진입자 distinct user (자유 형식)

1. 탐색 → 자유 형식
2. 측정기준: `entry_point`
3. 측정항목: `총 사용자` (User-scoped distinct)
4. 필터: `event_name = ask_view`
5. 결과: `share_link` / `main_banner` / `relay` / `direct` 각 distinct user 수
6. **읽는 법**: `share_link` + `main_banner` 합이 운영자 푸시 외 자발적 진입의 모집단.

#### Owner 퍼널 (5단계)

1. `ask_view` (`entry_point=direct` 또는 `relay`)
2. `ask_self_answer`
3. `ask_link_create`
4. `ask_share_link`
5. `ask_owner_result_view` (`friend_count ≥ 1`)

#### Friend 퍼널 (2단계)

1. `ask_friend_landing` (`is_own=false`)
2. `ask_friend_vote`

### 5-4. 홍보 진입 후 다음 액션 + 이탈

**측정 의도**: 영상·외부 채널 진입 유저가 첫 액션으로 무엇을 하고 어디서 떨어지는지.

#### 경로 탐색

1. 탐색 → 새 탐색 만들기 → **경로 탐색**
2. 시작점 (`Starting point`): `single_view` 이벤트
3. 세션 소스/매체 필터: `instagram` 또는 `youtube` 등 영상 채널 한정
4. 다음 이벤트 → 다음 이벤트 3단계 확장
5. **읽는 법**: 영상 진입 후 가장 흔한 다음 액션, 가장 흔한 이탈 지점.

#### 퍼널 탐색 + 채널별 세그먼트 비교

1. 탐색 → 퍼널 탐색
2. 단계: `single_view` → `single_vote_attempt` → `single_vote_success` → `card_click` → `single_view` (재방문)
3. 세그먼트 비교: `세션 소스 = instagram` vs `세션 소스 = (direct)`
4. **읽는 법**: 채널별로 어느 단계에서 이탈이 큰지.

### 5-5. 일별 모니터링 카드

운영용 라이브러리 컬렉션을 만들어 매일 1회 점검.

#### 라이브러리 컬렉션 만드는 법

1. 좌측 메뉴 → 라이브러리 → **컬렉션 만들기**
2. 이름: "HotPick 일별 모니터링"
3. 보고서 추가 → 자유 형식 보고서 4개 (아래 카드)
4. 게시 → 좌측 보고서 메뉴에 컬렉션 노출

#### 4개 카드

| 카드                | 이벤트                   | 측정기준                           | 측정항목  |
| ------------------- | ------------------------ | ---------------------------------- | --------- |
| 일별 싱글 투표 성공 | `single_vote_success`    | 일자                               | 이벤트 수 |
| 일별 번들 완료      | `bundle_complete`        | 일자                               | 이벤트 수 |
| 일별 banner 클릭    | `ask_promo_banner_click` | 일자 × `placement`                 | 이벤트 수 |
| 일별 친구 평가      | `ask_friend_vote`        | 일자 × `matches_owner_self_answer` | 이벤트 수 |

### 5-6. 콘텐츠 니치 피벗 6주 검증 KPI (소개팅·민폐 한정)

[PRD](../strategy/2026-05-03-content-niche-pivot.md) 기간 2026-05-03 ~ 2026-06-14. 상세 보고서: [`category-niche-pivot-report.md`](./category-niche-pivot-report.md).

#### KPI ① 1회 투표 distinct user 100명

- 탐색 → 자유 형식
- 측정항목: `총 사용자` (User-scoped)
- 필터: `event_name = single_vote_success`
- 기간: 2026-05-03 ~ 현재
- 100명 도달 시 성공 / 50명 미만(Week 4 시점) 시 라인업 재검토 트리거

#### KPI ② 카테고리 핏 70% (dating + nuisance 비율)

- 탐색 → 자유 형식
- 측정기준: `category_slug`
- 측정항목: `이벤트 수`, `총 사용자`
- 필터: `event_name IN (single_view, single_vote_success)`
- (`dating` user + `nuisance` user) / 전체 user ≥ 70% 목표
- < 60% (Week 4 시점) → 실패 시나리오 3 진입 (라인업 추가 검토)

#### KPI ③ 영상 → 웹 CTR 1%

- §5-1 자유 형식의 `세션 소스 = instagram/youtube` 컬럼 A를 영상 노출량(외부 인스타·쇼츠 분석에서 추출)으로 나눔
- 영상 노출량은 GA에서 직접 안 잡히므로 수동 계산
- < 0.5% (Week 3 시점) → 영상 포맷 폐기 트리거

#### Week 4 (2026-05-30 즈음) 트리거

| 점검                            | 액션                                       |
| ------------------------------- | ------------------------------------------ |
| Week 4 distinct user < 50       | 카테고리 라인업 재검토 또는 영상 포맷 폐기 |
| Week 4 카테고리 핏 < 60%        | 화이트리스트에 슬러그 추가 검토            |
| Week 2 첫 6편 평균 조회수 < 5천 | 후킹 포맷 재설계                           |
| Week 3 영상 → 웹 CTR < 0.5%     | 영상 포맷 폐기                             |

### 5-7. 회원가입 퍼널 (auth\_\*)

**측정 의도**: 어떤 trigger가 가입 전환에 가장 강력한지. trigger 분포 + 단계별 이탈을 동시에 본다.

#### 퍼널 탐색 — 6단계

1. 탐색 → 새 탐색 만들기 → **퍼널 탐색**
2. 단계 (이벤트 이름 일치):
   1. `auth_modal_open`
   2. `auth_kakao_click`
   3. `auth_kakao_callback` (단계 조건에 `success = true` 필터 추가)
   4. `auth_signup_view`
   5. `auth_signup_submit`
   6. `auth_signup_success`
3. 같은 6단계로 **폐쇄형(open funnel) + 개방형(closed funnel) 한 쌍**을 만들 것. 폐쇄형은 1→6 일관 흐름을 본 사용자만 카운트, 개방형은 단계 사이 다른 이벤트가 끼어도 카운트. 두 수치 차이가 크면 다른 진입 경로(이미 회원 / 이전 세션 잔여)가 섞여 있다는 신호.
4. **세분화 권장**: 단계 1(`auth_modal_open`)에 `trigger` 차원을 분할(breakdown)로 추가하면 trigger별 단계별 이탈이 한 화면에 잡힌다.

#### trigger별 분리

`auth_modal_open`의 `trigger` 파라미터(`header` / `bundle` / `my` / `compare` / `ask` / `default`) 차원을 세그먼트 비교로 추가. 동일 6단계 퍼널을 trigger별로 6개 라인으로 비교하면 어느 진입점이 실제 가입까지 이어지는지 즉시 보인다.

#### 신규 유저 vs 기존 유저 분리

`auth_kakao_callback`의 `is_new_user` 차원을 세그먼트로 분리.

- `is_new_user = false` (기존 유저): 단계 3 → 6 을 거의 0초에 통과 (폼 단계가 없음). 4~6은 노이즈.
- `is_new_user = true` (신규 유저): 4~6의 가입 폼 마찰을 실제로 측정 가능.
- 신규 유저 한정 퍼널을 별도로 만드는 것이 4~6 단계 해석에 안전함.

#### 이탈 지점 해석 표

| 단계  | 이탈 의심 원인                                                         |
| ----- | ---------------------------------------------------------------------- |
| 1 → 2 | 카피·CTA 매력도 부족 / 외부 알림 차단 / 모달 닫고 이탈                 |
| 2 → 3 | 카카오 권한 거부 또는 인증 실패 (`success = false` 별도 카운트로 확인) |
| 3 → 4 | 라우팅·콜백 핸들링 버그 (신규 유저 한정 — 기존 유저는 건너뜀)          |
| 4 → 5 | 가입 폼 마찰 (닉네임/성별/출생연도 입력 부담)                          |
| 5 → 6 | 서버 에러 (BE 로그 확인)                                               |

#### trigger별 가입 전환율 (자유 형식)

trigger별 절대 전환율을 빠르게 보고 싶을 때:

1. 탐색 → 자유 형식
2. 행: `trigger`
3. 측정항목 1: `이벤트 수` — 필터 `event_name = auth_modal_open`
4. 측정항목 2: `이벤트 수` — 필터 `event_name = auth_signup_success`
5. 엑셀로 두 컬럼 export → 측정항목 2 / 측정항목 1 = trigger별 가입 전환율
6. **읽는 법**: `bundle` trigger 전환율이 `header` 대비 2배 이상이면 가입 모달은 번들 결과 시점에 더 많이 노출시킬 가치가 있다.

### 5-8. 번들 풀기 퍼널 + 질문별 이탈

**측정 의도**: 번들 5단 잔존율 + 5개 질문 중 어디서 빠지는지. 구 `ga4-guide.md`의 핵심 분석.

#### 퍼널 탐색 — 5단계

1. 탐색 → 새 탐색 만들기 → **퍼널 탐색**
2. 단계:
   1. `bundle_view`
   2. `bundle_start`
   3. `bundle_complete`
   4. `bundle_result_view`
   5. `compare_create`
3. 폐쇄형 + 개방형 한 쌍을 만들 것 (§5-7과 동일 패턴).
4. **번들별 분리**: `slug` 차원을 분할로 추가하면 어떤 번들이 가장 잘 풀리는지 비교 가능 (예: `love-values` vs `marriage-values`).

#### 질문별 이탈 (자유 형식)

5개 질문 중 어느 질문에서 이탈이 급격한지 — 운영 측에서 질문 카피·옵션 재설계의 우선순위를 정하는 핵심 보고서.

1. 탐색 → 자유 형식
2. 행: `question_index` (0 ~ 4)
3. 측정항목: `이벤트 수`
4. 필터: `event_name = bundle_answer`
5. **읽는 법**: index 0 → 4 흐름에서 자연 감소 곡선이 정상. 특정 index에서 급격히 떨어지면 그 질문에서 이탈이 발생. (예: `question_index = 2`만 다른 인덱스의 70% 이하면 2번 질문 카피 재검토 트리거.)

#### 번들별 성과 매트릭스 (자유 형식)

번들 단위 KPI 일별/주별 모니터링용.

1. 탐색 → 자유 형식
2. 행: `slug`
3. 측정항목 (다중):
   - `이벤트 수` — 필터 `event_name = bundle_view` → 노출
   - `이벤트 수` — 필터 `event_name = bundle_start` → 시작
   - `이벤트 수` — 필터 `event_name = bundle_complete` → 완료
   - `이벤트 수` — 필터 `event_name = compare_create` → 비교 생성
4. 엑셀 합산으로 시작 전환율 = `start / view`, 완료율 = `complete / start`, 비교 생성율 = `compare_create / complete`.

#### KPI 목표 (master-plan §1 KPI와 일관)

| 지표        | 계산                               | 목표  |
| ----------- | ---------------------------------- | ----- |
| 시작 전환율 | `bundle_start / bundle_view`       | ≥ 50% |
| 완료율      | `bundle_complete / bundle_start`   | ≥ 70% |
| 비교 생성율 | `compare_create / bundle_complete` | ≥ 20% |

> 1:1 비교 폐기로 `compare_share` / `compare_landing` 단계는 본 퍼널에서 제외. 그룹 공유 트래킹 복구 시 단계 추가 검토 (§3-7 참조).

### 5-9. 코호트 리텐션 (D1 / D7 / D28)

**측정 의도**: 가입·투표 후 N일 차 재방문 비율. User ID가 자동 활용되므로 데이터 4주 이상 쌓이면 즉시 가치가 발생.

#### GA4 표준 코호트 보고서 사용

1. 탐색 → 새 탐색 만들기 → **코호트 탐색**
2. **코호트 포함 조건** (Cohort inclusion): 첫 세션에 `auth_signup_success` **또는** `single_vote_success` 발생 — 즉 "활성화된 유저"만 코호트 모집단.
3. **재방문 기준** (Return criteria): 주별 `session_start`.
4. **측정 단위 (Metric)**:
   - 사용자 (default)
   - 참여 세션 (engagement quality 보조)
   - `bundle_complete` 재발생 (반복 풀기 행동)
   - `single_vote_success` 재발생 (반복 투표 행동)
5. **세분도 (Granularity)**: 일별 + 주별 두 보고서를 별도 시트로 만들 것. D1·D7은 일별, D28은 주별이 가독성 좋음.

#### 읽는 법

| 지표         | 의미                                     | 기준선                                                |
| ------------ | ---------------------------------------- | ----------------------------------------------------- |
| D1 재방문률  | 가입 다음날 재진입 비율                  | 모바일 앱 평균 25%, 웹은 더 낮음. **15% 이상이 목표** |
| D7 재방문률  | 가입 1주차 재방문 (정착 시그널)          | **10% 이상이 좋은 신호**                              |
| D28 재방문률 | 1달 후 살아있는 유저 (콘텐츠 fit 시그널) | **5% 이상이면 fit, 3% 이하면 리텐션 위기**            |

#### 세그먼트 비교

탐색 → 자유 형식과 코호트는 별도 시트로 두고, 다음 세그먼트들을 코호트 비교로 정의:

- **"가입 + 첫 세션 내 투표한 유저" vs "가입만 한 유저"** — 첫 세션 액션이 retention에 미치는 영향. 투표한 유저의 D7이 2배 이상이면 가입 직후 투표 유도 (튜토리얼·온보딩 핫픽) 가치 입증.
- **"Banner Clickers" 잠재고객 코호트** ([§4-5](#4-5-잠재고객-사전-정의-선택)에서 정의) — Ask H3 진입자의 retention. 일반 유저 대비 retention이 의미 있게 높으면 Ask H3가 retention 도구로도 작동한다는 시그널.
- **`signup_method` 별** — 현재 `kakao`만 단일값이라 의미 없음. 추가 가입 방식 도입 시 활성화.

#### 장기 운영 시그널

- **D28 < 3% 가 5주 연속**이면 콘텐츠 신선도·신규 유입 채널 재검토 트리거. 신규 가입자가 나오는 만큼 빠지고 있다는 의미라서 단기 가입 KPI만 보고는 위기를 잡을 수 없다.
- D1 ≥ 15%인데 D7 < 5% 면 첫 인상은 좋으나 재방문 hook 부재 — 알림·이메일·신규 콘텐츠 push 전략 검토.
- D1 < 10%면 첫 인상부터 약한 상태 — 가입 직후 첫 세션 UX (온보딩, 첫 핫픽 노출) 우선 점검.

---

## 6. 디버깅 매뉴얼

### DebugView 사용법

1. Chrome에 [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) 확장 설치 → 아이콘 ON
2. (또는 URL에 `?gtm_debug=x` 파라미터 추가)
3. GA4 콘솔 → 관리 → DebugView (좌측 메뉴 하단)
4. 사이트 접속 → 인터랙션
5. DebugView에서 이벤트가 실시간으로 올라옴 → 클릭하면 파라미터 검증
6. DebugView는 디버그 모드에서만 작동. 프로덕션 검증은 `보고서 → 실시간` 사용.

### dev console `[GA]` 디버그 로그

`NODE_ENV !== 'production'` 환경에서는 `track()` 이 `console.debug('[GA]', name, merged)` 만 출력하고 실제 전송하지 않음.

```bash
NEXT_PUBLIC_GA_ID=G-DUMMY pnpm start
```

브라우저 DevTools Console에서 `[GA]` 필터로 발화 확인 가능. 프로덕션 검증이 아닌 호출 누락·파라미터 정합성 검증용.

### 트러블슈팅

| 증상                              | 점검 순서                                                                                                                                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 이벤트가 GA4에서 보이지 않음      | (1) AdBlocker 끔 → (2) DevTools Network에 `gtag/js?id=G-...` 호출이 있고 ID가 환경 기대값과 일치 → (3) `bot_score=high` 차단 (botDetector 캐시) → (4) `/dev/*` 경로가 아닌지 → (5) DebugView/실시간에서는 보이는지 |
| 차원이 보고서에 안 잡힘           | (1) §4-1·§4-3 표에 등록되어 있는지 → (2) 등록 후 24~48시간 경과했는지 → (3) DebugView에서는 파라미터가 보이는지                                                                                                    |
| 이벤트 1회 호출 의도인데 N번 잡힘 | `useEffect` 의존성 배열 누락 → `useRef` 가드 누락 점검                                                                                                                                                             |
| 차원에 한 값만 잡힘               | "단일값 차원" — §2-2 원칙. 등록 자체를 회수 검토                                                                                                                                                                   |

---

## 7. 변경 이력 (Changelog)

- **2026-05-05**: §5-1에 UTM 워크플로우 보강. §5-7 회원가입 퍼널 / §5-8 번들 풀기 퍼널 / §5-9 코호트 리텐션 신설.
- **2026-05-05**: 단일 마스터 플랜 통합. `docs/ga4.md`(환경 분리/인프라/디버깅) + `docs/ga4-guide.md`(번들 분석 매뉴얼) + `docs/superpowers/plans/2026-05-05-ga4-ask-and-category-tabs.md`(메인·banner 신규 6종) 흡수. **신규 11개 차원** (`tab_kind`/`tab_value`/`my_sub_tab`/`category_slug`/`placement`/`from_kind`/`from_value`/`to_kind`/`to_value`/`card_type`/`position`) + 6개 이벤트(`main_view`, `main_tab_change`, `card_click`, `ask_promo_banner_view`, `ask_promo_banner_click`, `ask_view` entry_point 확장) 반영. §5에 콘텐츠 니치 피벗 6주 검증 KPI 추가.
- 2026-04-29: GA4 콘솔에 35개 이벤트 범위 차원 + 6개 사용자 범위 + 4개 측정항목 일괄 등록 (`event.md` 스냅샷).
- 2026-04-28: GA Real/Beta 환경 분리 (`NEXT_PUBLIC_GA_ID` 분기 + layout 가드).
- 2026-04-25: Ask H3 친구 평가 7종 이벤트 도입.
- 2026-04 초: 1:1 비교 폐기. `compare_share`/`compare_landing`/`compare_result` 제거. 그룹 2종(`compare_create`, `group_result`)으로 축소.
- 2026-03~04: 번들 5종 + 싱글 4종 + 인증 8종 + User ID + 봇 가드 + Real User 감지 도입.
