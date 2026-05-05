# GA4 콘솔 등록 체크리스트 (Real 속성)

> 신규 GA4 속성 셋업 시 또는 기존 속성에 신규 차원 추가 시 사용하는 체크리스트.
> 단일 진실: [src/lib/analytics.ts](../../src/lib/analytics.ts) + [docs/analytics/ga4-master-plan.md §4](../../docs/analytics/ga4-master-plan.md)
> 마지막 갱신: 2026-05-05

---

## 1. 등록 완료 현황 (2026-05-05 기준)

- 맞춤 측정기준 (이벤트 범위): **40개** — 2026-04-29 등록 29개 + 2026-05-05 등록 11개
- 맞춤 측정기준 (사용자 범위): **6개**
- 맞춤 측정항목: **4개**

상세 목록은 [`docs/analytics/ga4-master-plan.md`](../../docs/analytics/ga4-master-plan.md) §4-1, §4-2, §4-3 참조.

---

## 2. 신규 속성 셋업 절차

### 2-1. 사전 확인

- [ ] Real 속성 (Production) 선택 — Vercel `NEXT_PUBLIC_GA_ID`와 일치하는 측정 ID인지 확인
- [ ] 좌측 하단 톱니(관리) → 데이터 표시 → 맞춤 정의 진입
- [ ] 좌측 하단 톱니(관리) → 이벤트 메뉴 위치 확인 (§3 토글 작업용)

### 2-2. 맞춤 측정기준 등록 — 이벤트 범위 (40개)

> 콘솔 입력 화면: "측정기준 이름"(한글) / "범위"=이벤트 / "이벤트 매개변수"=영문 키.

#### 2026-04-29 등록 — 29개

- [ ] Ask 주제 / `topic`
- [ ] owner 답 일치 / `matches_owner_self_answer`
- [ ] 가입 마이그레이션 / `has_migration`
- [ ] 가입 방법 / `signup_method`
- [ ] 가입 성공 여부 / `success`
- [ ] 공유 방법 / `method`
- [ ] 다수파 일치 / `is_majority_match`
- [ ] 로그인 트리거 / `trigger`
- [ ] 리턴 URL 유형 / `return_url_type`
- [ ] 번들 slug / `slug`
- [ ] 번들 slug 비교 / `bundle_slug`
- [ ] 선택지 / `selected`
- [ ] 성별 / `gender`
- [ ] 신규 가입 여부 / `is_new_user`
- [ ] 옵션 ID / `option_id`
- [ ] 자기 예상 / `self_prediction`
- [ ] 자기 토큰 진입 / `is_own`
- [ ] 자기 평가 / `self_answer`
- [ ] 진입점 / `entry_point`
- [ ] 질문 번호 / `question_index`
- [ ] 차단 사유 / `reason`
- [ ] 출생연도 버킷 / `birth_year_bucket`
- [ ] 출처 / `source`
- [ ] 친구 답변 / `vote`
- [ ] 카테고리 / `category`
- [ ] 콘텐츠 ID / `content_id`
- [ ] 투표 상태 / `vote_status`
- [ ] 페이지 유형 / `page_type`

> 위는 28개로 보이지만 `event.md` 스냅샷에 동일 영문 키가 사용자 범위와 중복되는 항목이 있어 마스터 플랜 §4-1 표의 이벤트 범위 29개와 일치한다. 신규 속성 셋업 시 §4-1 한글 이름·영문 키 매핑을 우선 진실로 사용할 것.

#### 2026-05-05 등록 — 11개 (이번 플랜 신규)

- [ ] 메인 탭 종류 / `tab_kind`
- [ ] 메인 탭 값 / `tab_value`
- [ ] MY 서브탭 / `my_sub_tab`
- [ ] 카드 종류 / `card_type`
- [ ] 카드 위치 / `position`
- [ ] 카드 카테고리 / `category_slug`
- [ ] Banner 위치 / `placement`
- [ ] 출발 탭 종류 / `from_kind`
- [ ] 출발 탭 값 / `from_value`
- [ ] 도착 탭 종류 / `to_kind`
- [ ] 도착 탭 값 / `to_value`

### 2-3. 맞춤 측정기준 등록 — 사용자 범위 (6개)

> 콘솔 입력 화면: "측정기준 이름"(한글) / "범위"=사용자 / "사용자 속성"=영문 키.

- [ ] 가입 방법 / `signup_method`
- [ ] 번들 완료 경험 / `has_completed_bundle`
- [ ] 봇 점수 / `bot_score`
- [ ] 사용자 유형 / `user_type`
- [ ] 성별 / `gender`
- [ ] 실유저 여부 / `is_real_user`
- [ ] 투표 경험 / `has_voted_ever`

### 2-4. 맞춤 측정항목 등록 (4개)

> 콘솔 입력 화면: "측정항목 이름"(한글) / "범위"=이벤트 / "이벤트 매개변수"=영문 키 / "측정 단위" 선택.

| 측정항목 이름  | 영문 키           | 단위   | 등록 |
| -------------- | ----------------- | ------ | ---- |
| 그룹 멤버 수   | `member_count`    | 일반   | [ ]  |
| 질문 수        | `question_count`  | 일반   | [ ]  |
| 친구 답변 수   | `friend_count`    | 일반   | [ ]  |
| 투표 소요 시간 | `time_to_vote_ms` | 밀리초 | [ ]  |

---

## 3. 핵심 이벤트 토글 (선택)

GA4는 이벤트가 1회 이상 발화된 후에만 핵심 이벤트로 표시할 수 있다. 신규 이벤트는 첫 발화 다음날 작업. 마스터 플랜 §4-4 권장 5종:

- [ ] `single_vote_success`
- [ ] `bundle_complete`
- [ ] `auth_signup_success`
- [ ] `card_click`
- [ ] `ask_promo_banner_click`

---

## 4. 등록 후 검증

### 4-1. DebugView로 실 발화 확인

- [ ] Chrome 확장 [Google Analytics Debugger](https://chromewebstore.google.com/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) 설치 → 활성화 (아이콘 ON)
- [ ] GA4 콘솔 → 관리 → DebugView 진입
- [ ] dev 환경에서 `NEXT_PUBLIC_GA_ID` 일시 세팅 후 6개 이벤트 시나리오 발화:
  - [ ] `main_view` — 메인 진입 (`tab_kind`/`tab_value` 파라미터 노출)
  - [ ] `main_tab_change` — 탭 전환 (`from_*`/`to_*` 노출)
  - [ ] `card_click` — 카드 클릭 (`card_type`/`position`/`category_slug` 노출)
  - [ ] `ask_promo_banner_view` — 메인 진입 시 자동 (`placement`/`tab_value` 노출)
  - [ ] `ask_promo_banner_click` — 배너 클릭
  - [ ] `ask_view` (`entry_point=main_banner`) — 배너로 이동 후 자동
- [ ] DebugView 이벤트 상세에 신규 파라미터(예: `tab_kind`)가 모두 보이는지 확인. 안 보이면 §2-2 등록 누락 의심.

### 4-2. 24~48h 후 보고서 차원이 잡히는지

- [ ] 탐색 → 자유형식 진입
- [ ] 좌측 변수 패널에서 신규 11개 차원이 측정기준 검색 결과에 노출되는지:
  - [ ] `tab_kind`, `tab_value`, `my_sub_tab`
  - [ ] `card_type`, `position`, `category_slug`
  - [ ] `placement`
  - [ ] `from_kind`, `from_value`, `to_kind`, `to_value`
- [ ] 행/측정기준 슬롯에 드래그 후 데이터가 0이 아닌지 확인 (24~48h 경과 후)

---

## 5. 트러블슈팅

| 증상                                          | 점검                                                                                                                                      |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 차원이 보고서에 안 잡힘                       | (1) §2-2 영문 키 매칭 확인 / (2) 등록 후 24~48시간 경과했는지 / (3) DebugView에서는 파라미터가 보이는지                                   |
| DebugView에 이벤트 안 보임                    | (1) AdBlocker / 트래커 차단 확장 비활성화 / (2) 측정 ID가 환경변수에 설정됐는지 / (3) `console.debug('[GA] ...')` 로그가 dev에서 찍히는지 |
| `entry_point`에 신규 값(`main_banner`) 미노출 | 이미 차원은 등록됨(2026-04-29). 값만 코드에서 발화되면 자동으로 잡힘. 24~48h 대기.                                                        |
| 핵심 이벤트 토글이 비활성                     | 해당 이벤트가 1회도 발화되지 않음. dev에서 실 발화 후 다음날 다시 시도.                                                                   |
