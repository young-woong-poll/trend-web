# HotPick GA4 트래킹 마스터 플랜

> 유저 이탈률·진입점·재방문율을 데이터로 파악하고, 이를 기반으로 개발 방향을 정하기 위한 전사 GA4 트래킹 설계 문서.
>
> - GA4 속성: `G-CBJFPV9C95`
> - 초기 구현: `@next/third-parties/google` + `src/lib/analytics.ts`
> - 운영 가이드(번들·비교): [docs/ga4-guide.md](../ga4-guide.md)
> - 최종 수정일: 2026-04-21

---

## 0. 현황 요약

| 영역                                   | 상태                           | 위치                                                                                    |
| -------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------- |
| GA4 스크립트 로드                      | 완료                           | `src/app/layout.tsx:55`                                                                 |
| 커스텀 이벤트 유틸                     | 완료 (일부)                    | `src/lib/analytics.ts`                                                                  |
| User ID 연동                           | 완료                           | `src/providers/AuthProvider.tsx`                                                        |
| 번들 퍼널 5종                          | 완료                           | `bundle_view`, `bundle_start`, `bundle_answer`, `bundle_complete`, `bundle_result_view` |
| 비교 5종                               | 완료                           | `compare_create`, `compare_share`, `compare_landing`, `compare_result`, `group_result`  |
| **싱글 투표 트래킹**                   | **미구현**                     | ―                                                                                       |
| **인증/회원가입 트래킹**               | **미구현**                     | ―                                                                                       |
| **공유·댓글·좋아요·검색·탭/카드 클릭** | **미구현**                     | ―                                                                                       |
| 맞춤 측정기준 등록                     | 번들·비교 파라미터만 부분 등록 | GA4 Admin                                                                               |

전체 인터랙션 약 134개 중 약 15%만 트래킹 중. 현 상태로는 **싱글 투표 전환율·회원가입 퍼널·리텐션을 분석할 수 없음.**

---

## 1. 설계 원칙

### 1-1. 네이밍 규칙

- `snake_case`, `{도메인}_{액션}` 형태
- 도메인 prefix 고정: `single_`, `bundle_`, `compare_`, `auth_`, `comment_`, `share_`, `search_`, `nav_`, `my_`
- 예: `single_vote_success`, `auth_signup_success`, `compare_invite_copy`

### 1-2. 공통 파라미터

모든 이벤트에 가능한 한 포함:

| 파라미터      | 의미                          | 예시 값                                                                                                                 |
| ------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `entry_point` | 이벤트가 시작된 지점          | `main_new`, `main_top`, `search_result`, `direct`, `share_link`, `compare_link`                                         |
| `content_id`  | 식별자 (slug / alias / token) | `love-values`, `hp_abc123`                                                                                              |
| `page_type`   | 페이지 유형                   | `main`, `single_detail`, `bundle_intro`, `bundle_play`, `bundle_result`, `compare_group`, `auth_signup`, `my`, `search` |

> SPA의 동적 라우트는 기본 `page_view`만으로는 그룹핑이 힘들어 `page_type`을 수동으로 함께 전송합니다.

### 1-3. 사용자 속성 (User Properties)

로그인·최초 이벤트 시점에 `window.gtag('set', 'user_properties', {...})`로 설정:

| 속성                   | 값                    | 설정 시점                                        |
| ---------------------- | --------------------- | ------------------------------------------------ |
| `user_type`            | `guest` / `logged_in` | 세션 시작, 로그인/아웃 시                        |
| `signup_method`        | `kakao`               | 회원가입 성공 시                                 |
| `gender`               | `male` / `female`     | 로그인/가입 시                                   |
| `has_voted_ever`       | `true` / `false`      | 첫 `single_vote_success` or `bundle_complete` 시 |
| `has_completed_bundle` | `true` / `false`      | 첫 `bundle_complete` 시                          |

리텐션·세그먼트 분석에 핵심 재료이므로 누락 없이 채울 것.

---

## 2. 이벤트 카탈로그 (전체 페이지·CTA)

### 2-1. 랜딩/메인 `/`

| 이벤트                         | 파라미터                                                                  | 구현 위치 후보                           |
| ------------------------------ | ------------------------------------------------------------------------- | ---------------------------------------- |
| `page_view` + `page_type=main` | `tab`, `referrer`                                                         | `MainViewClient` useEffect               |
| `main_tab_change`              | `from`, `to`                                                              | `MainViewClient.tsx:299`                 |
| `main_category_click`          | `category_id`, `tab`                                                      | `ContentTabs.tsx:107`                    |
| `top_filter_change`            | `content_type`, `period`, `category`                                      | `TopSubFilter.tsx:42`                    |
| `card_click`                   | `card_type`(single/bundle/poll), `content_id`, `position`, `list_context` | `SingleCard` / `BundleCard` / `PollCard` |
| `card_load_retry`              | `error_reason`                                                            | `CardList.tsx:127`                       |

### 2-2. 싱글 상세 `/hotpick/[alias]`

| 이벤트                                  | 파라미터                                                    |
| --------------------------------------- | ----------------------------------------------------------- |
| `page_view` + `page_type=single_detail` | `alias`, `entry_point`                                      |
| `single_view`                           | `alias`, `category`, `vote_status`(not_voted/voted/expired) |
| `single_vote_attempt`                   | `alias`, `option_id`                                        |
| **`single_vote_success`** ⭐            | `alias`, `option_id`, `time_to_vote_ms`                     |
| `single_vote_blocked`                   | `alias`, `reason`(already_voted/expired)                    |
| `single_like_toggle`                    | `alias`, `new_state`                                        |
| `single_share_open`                     | `alias`                                                     |
| `single_share_method`                   | `alias`, `method`(kakao/copy)                               |
| `single_comment_open`                   | `alias`                                                     |
| `single_image_expand`                   | `alias`                                                     |

### 2-3. 번들 `/bundle/[slug]/(intro|play|result)`

기존 5종 + 아래 추가:

| 이벤트                     | 추가 파라미터                 |
| -------------------------- | ----------------------------- |
| `bundle_back`              | `slug`, `from_question_index` |
| `bundle_result_retry`      | `slug`                        |
| `bundle_result_share_type` | `slug`, `method`              |
| `bundle_result_share_vote` | `slug`, `method`              |

기존 이벤트도 `total_questions`, `time_on_question_ms`, `total_time_ms`를 같이 실어 질문별 체류 시간 분석이 가능하도록 보강.

### 2-4. 그룹 비교 `/compare/group/[token]`

기존 5종 + 아래 추가:

| 이벤트                       | 파라미터                                          |
| ---------------------------- | ------------------------------------------------- |
| `compare_join_click`         | `token`, `slug`                                   |
| `compare_invite_copy`        | `token`, `source`(header/floating_cta/group_name) |
| `compare_member_node_click`  | `token`, `target_user_hash`                       |
| `compare_chemistry_request`  | `token`, `target_user_hash`                       |
| `compare_member_detail_open` | `token`                                           |
| `compare_settings_open`      | `token`                                           |
| `compare_profile_edit`       | `token`, `field`(nickname/color)                  |

### 2-5. 인증 `/auth/*`

| 이벤트                       | 파라미터                                    | 비고                         |
| ---------------------------- | ------------------------------------------- | ---------------------------- |
| `auth_modal_open`            | `trigger`(header/bundle/my/compare/default) | 로그인 모달 실제 노출 시     |
| `auth_kakao_click`           | `return_url_type`                           | "카카오로 시작하기" 클릭     |
| `auth_kakao_callback`        | `is_new_user`(true/false), `success`        | `/auth/kakao/callback`       |
| `auth_signup_view`           | ―                                           | 신규 유저 signup 페이지 진입 |
| `auth_signup_submit`         | `gender`, `has_migration`                   | 폼 제출                      |
| **`auth_signup_success`** ⭐ | `gender`, `birth_year_bucket`               | 핵심 전환                    |
| `auth_logout`                | ―                                           |                              |
| `auth_withdraw`              | ―                                           |                              |

### 2-6. 마이페이지 `/my`

| 이벤트                                       | 파라미터            |
| -------------------------------------------- | ------------------- |
| `my_view`                                    | `sub_tab`           |
| `my_sub_tab_change`                          | `from`, `to`        |
| `my_nickname_edit_open` / `my_nickname_save` | ―                   |
| `my_color_change`                            | `color`             |
| `my_list_load_more`                          | `list_type`, `page` |

### 2-7. 검색 `/search`

| 이벤트                                        | 파라미터                              |
| --------------------------------------------- | ------------------------------------- |
| `search_open`                                 | ―                                     |
| `search_submit`                               | `query_length`, `query_hash`          |
| `search_result_click`                         | `query_hash`, `position`, `card_type` |
| `search_recent_click` / `search_recent_clear` | ―                                     |
| `search_no_result`                            | `query_length`                        |

> PII 회피: 검색 원문은 절대 보내지 말 것. 길이·SHA256 앞 8자만 전송.

### 2-8. 기타 페이지

- `/suggest` — `suggest_view`, `suggest_submit`
- `/about` — 자동 `page_view`만
- `/offline-vote` — `offline_view`, `offline_vote_submit`

### 2-9. 댓글 (전역)

| 이벤트                            | 파라미터              |
| --------------------------------- | --------------------- |
| `comment_view`                    | `alias`, `count`      |
| `comment_sort_change`             | `alias`, `sort`       |
| `comment_submit` ⭐               | `alias`, `length`     |
| `comment_edit` / `comment_delete` | `alias`               |
| `comment_like`                    | `alias`, `comment_id` |
| `comment_load_more`               | `alias`, `page`       |

---

## 3. GA4 콘솔 세팅 (이 섹션을 따라 등록하세요)

### 3-1. 맞춤 측정기준 등록 — **이 프로젝트에서 해야 할 일**

**Q. 맞춤 측정기준은 GA4 들어가서 하는 거죠?**

**A. 예. 코드가 아닌 GA4 웹 콘솔에서 등록합니다.** 아래 경로.

1. `https://analytics.google.com/` 접속
2. 좌측 하단 **관리(톱니바퀴)** 클릭
3. **데이터 표시** → **맞춤 정의** 메뉴 선택
4. **맞춤 측정기준 만들기** 클릭
5. 아래 표를 하나씩 입력

| 측정기준 이름(한글) | 이벤트 매개변수  | 범위                 |
| ------------------- | ---------------- | -------------------- |
| 진입점              | `entry_point`    | 이벤트               |
| 콘텐츠 ID           | `content_id`     | 이벤트               |
| 페이지 유형         | `page_type`      | 이벤트               |
| 카드 유형           | `card_type`      | 이벤트               |
| 리스트 맥락         | `list_context`   | 이벤트               |
| 카드 위치           | `position`       | 이벤트               |
| 탭                  | `tab`            | 이벤트               |
| 서브탭              | `sub_tab`        | 이벤트               |
| 카테고리            | `category`       | 이벤트               |
| 투표 상태           | `vote_status`    | 이벤트               |
| 차단 사유           | `reason`         | 이벤트               |
| 공유 방법           | `method`         | 이벤트               |
| 트리거              | `trigger`        | 이벤트               |
| 신규 유저 여부      | `is_new_user`    | 이벤트               |
| 성공 여부           | `success`        | 이벤트               |
| 멤버 여부           | `is_member`      | 이벤트               |
| 초대 출처           | `source`         | 이벤트               |
| 옵션 ID             | `option_id`      | 이벤트               |
| 성별                | `gender`         | 이벤트               |
| 회원가입 방식       | `signup_method`  | 이벤트               |
| 정렬                | `sort`           | 이벤트               |
| 쿼리 길이           | `query_length`   | 이벤트               |
| 쿼리 해시           | `query_hash`     | 이벤트               |
| 질문 번호           | `question_index` | 이벤트 (기존 등록됨) |
| 선택지              | `selected`       | 이벤트 (기존 등록됨) |
| 번들 slug           | `slug`           | 이벤트 (기존 등록됨) |
| 번들 slug(비교)     | `bundle_slug`    | 이벤트 (기존 등록됨) |
| 비교 타입           | `compare_type`   | 이벤트 (기존 등록됨) |

그 아래 **맞춤 측정항목 만들기**:

| 측정항목 이름     | 이벤트 매개변수       | 범위   | 단위               |
| ----------------- | --------------------- | ------ | ------------------ |
| 투표 소요 시간    | `time_to_vote_ms`     | 이벤트 | 밀리초             |
| 질문당 소요 시간  | `time_on_question_ms` | 이벤트 | 밀리초             |
| 번들 총 소요 시간 | `total_time_ms`       | 이벤트 | 밀리초             |
| 좋아요 상태       | `new_state`           | 이벤트 | 표준               |
| 질문 수           | `question_count`      | 이벤트 | 표준 (기존 등록됨) |
| 그룹 멤버 수      | `member_count`        | 이벤트 | 표준 (기존 등록됨) |

**사용자 속성** 탭에서:

| 이름           | user_property          | 범위   |
| -------------- | ---------------------- | ------ |
| 유저 타입      | `user_type`            | 사용자 |
| 가입 방식      | `signup_method`        | 사용자 |
| 성별           | `gender`               | 사용자 |
| 투표 경험      | `has_voted_ever`       | 사용자 |
| 번들 완료 경험 | `has_completed_bundle` | 사용자 |

> 등록 후 **데이터 반영까지 24~48시간** 소요. 실시간(DebugView)에서는 즉시 보이나, 일반 보고서·탐색에선 하루 뒤부터 차원으로 잡힘.

### 3-2. 핵심 이벤트 지정 (Admin → 이벤트)

아래 이벤트 옆 **"핵심 이벤트로 표시"** 토글을 켜세요. KPI 대시보드에 자동 집계됩니다.

- `single_vote_success`
- `bundle_complete`
- `compare_create`
- `compare_share`
- `auth_signup_success`
- `comment_submit`

### 3-3. 잠재고객(Audiences) 사전 정의

Admin → **잠재고객** → **잠재고객 만들기**:

| 이름                | 조건                                                   |
| ------------------- | ------------------------------------------------------ |
| Activated Users     | `single_vote_success` ≥ 1 **or** `bundle_complete` ≥ 1 |
| Bundle Finishers    | `bundle_complete` ≥ 1                                  |
| Social Spreaders    | `compare_share` + `single_share_method` ≥ 1            |
| Sign-up Completers  | `auth_signup_success` ≥ 1                              |
| Re-visitors (7d)    | 7일 내 세션 2회 이상                                   |
| One-voter Drop-offs | `single_vote_success` 1회 후 14일간 세션 0             |
| Guest Voters        | `user_type = guest` **and** `single_vote_attempt` ≥ 1  |

---

## 4. 이탈·진입점·재방문율 분석 보고서 7종 (GA4 Explorations)

### ① 진입점 보고서 — "어디서 유입되는가"

- **유형**: 자유 형식
- **행**: `page_type` × `entry_point` × `세션 소스/매체`
- **값**: 세션 수, 세션당 이벤트, 참여 세션 비율
- **인사이트**: "카카오 공유 → 싱글 상세" vs "직접 진입 → 메인" 비교, 바이럴 루프 기여도

### ② 퍼널 보고서 4개 — "어디서 이탈하는가"

**퍼널 A. 싱글 투표 전환**

1. `page_view`(page_type=single_detail)
2. `single_view`
3. `single_vote_attempt`
4. `single_vote_success`
5. `single_share_open` or `single_comment_open`

**퍼널 B. 번들 완주**

1. `bundle_view` → 2. `bundle_start` → 3. `bundle_answer`(첫 질문) → 4. `bundle_complete` → 5. `bundle_result_share_*`

**퍼널 C. 비교 바이럴 루프**

1. `bundle_complete` → 2. `compare_create` → 3. `compare_share` → 4. `compare_landing` → 5. `compare_join_click`

**퍼널 D. 회원가입**

1. `auth_modal_open` → 2. `auth_kakao_click` → 3. `auth_kakao_callback`(success=true) → 4. `auth_signup_submit` → 5. `auth_signup_success`

> 각 퍼널은 "개방형"과 "폐쇄형"을 같이 만들어 두세요. 개방형은 중간 진입 유저 포함, 폐쇄형은 1→N 순서 준수 유저만 집계.

### ③ 경로 탐색(Path Exploration)

- **시작점**: `page_view`(page_type=main)
- 다음 이벤트 → 다음 이벤트 3단계 확장
- **인사이트**: 메인 진입 후 실제 소비 경로, 어떤 카드에서 이탈이 많은지

### ④ 코호트 리텐션

- **유형**: 코호트 탐색
- **코호트 포함**: 첫 세션에 `auth_signup_success` **또는** `single_vote_success` 발생
- **재방문 기준**: 주별 `session_start`
- **지표**: 사용자, 참여 세션, `bundle_complete` 재발생
- **인사이트**: 가입/투표 후 주차별 돌아오는 비율, "액션 없는 유저는 왜 돌아오지 않는가"

### ⑤ 세그먼트 중복 (Segment Overlap)

- 교차: `Bundle Finishers` × `Social Spreaders` × `Sign-up Completers`
- **인사이트**: "번들 끝낸 사람이 공유까지 하는가, 가입까지 가는가" → 병목 구간 식별

### ⑥ 이탈률 대시보드

- 표준 보고서 **참여도 → 페이지 및 화면** 커스터마이즈
- 주 측정기준: `page_type`, 보조: `entry_point`
- 지표: 조회수, 참여 세션 비율, 세션당 이벤트, 평균 참여 시간

### ⑦ 획득 × 리텐션

- 표준 보고서 **수명 주기 → 획득 → 사용자 획득**
- 보조 측정기준: `first_user_source / medium`
- 지표: 신규 사용자, 참여 세션/사용자, 28일 재방문
- Retention 보고서를 메인 화면에 고정

---

## 5. 구현 로드맵 (4단계)

### Phase 1 — 기반 (1주, **필수 / 진행 중**)

1. `analytics.ts`에 공통 `track()` 래퍼 강화 + `page_type` / `user_type` 자동 주입
2. 사용자 속성(`user_type`, `gender`, `has_voted_ever`, `has_completed_bundle`) 세팅 헬퍼
3. **싱글 투표 4종** (view / attempt / success / blocked)
4. **인증 8종** (modal_open / kakao_click / kakao_callback / signup_view / signup_submit / signup_success / logout / withdraw)
5. GA4 콘솔에서 §3 맞춤 측정기준 등록 + 핵심 이벤트 지정

### Phase 2 — 바이럴·공유 (1주)

1. Share 이벤트 (`single_share_open`, `single_share_method`, `bundle_result_share_*`)
2. Compare 추가 이벤트 (`invite_copy`, `join_click`, `member_node_click`, `chemistry_request`)
3. `card_click` 통합 (entry_point/position 포함)

### Phase 3 — 탐색·체류 (3~5일)

1. 메인 탭/필터/카테고리 이벤트
2. 검색 이벤트 (query_hash 익명화)
3. 댓글/좋아요/마이페이지 이벤트

### Phase 4 — 분석 대시보드 (2~3일)

1. GA4 Explorations §4의 7종 구성
2. 주간 이메일 리포트 예약
3. (선택) Looker Studio 연결로 팀 공유 대시보드

---

## 6. 개발 가드레일

### 6-1. PII 금지

- 닉네임, 댓글 본문, 검색 원문 전송 금지
- 검색어는 길이+SHA256 앞 8자만
- user_id는 내부 UUID, 카카오 ID 금지

### 6-2. 중복·과다 호출 방지

- 모달 open 이벤트는 **한 번만** (useEffect + ref)
- 스크롤은 25/50/75/100% 깊이에서 4회만
- 무한 스크롤은 페이지 로드마다 1회 (`page` 파라미터)

### 6-3. 환경 분리

- `process.env.NODE_ENV !== 'production'`이면 `console.debug`로 dry-run
- `/dev/*` 라우트에서는 전송 제외

### 6-4. 검증

- DebugView로 실시간 이벤트 확인
- 릴리스 직전 체크리스트: [qa/ga4-phase1-checklist.md] (Phase 1 배포 시 작성 예정)

---

## 7. KPI 북극성 지표 (주간)

| 지표               | 계산식                                             | 목표  |
| ------------------ | -------------------------------------------------- | ----- |
| 싱글 투표 전환율   | `single_vote_success` / `page_view(single_detail)` | ≥ 40% |
| 번들 완료율        | `bundle_complete` / `bundle_start`                 | ≥ 70% |
| 비교 생성율        | `compare_create` / `bundle_result_view`            | ≥ 20% |
| 공유→유입 전환율   | `compare_landing` / `compare_share`                | ≥ 30% |
| 회원가입 전환율    | `auth_signup_success` / `auth_modal_open`          | ≥ 15% |
| 7일 재방문율       | `Re-visitors (7d)` / 신규 유저                     | ≥ 25% |
| 게스트→가입 전환율 | `auth_signup_success` / `Guest Voters`             | ≥ 10% |

목표치는 Phase 1 데이터 2주 수집 후 실데이터 기반으로 재조정.
