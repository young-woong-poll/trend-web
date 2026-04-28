# GA4

HotPick GA4 트래킹 운영 매뉴얼. 이벤트 카탈로그·파라미터 시그니처는 [src/lib/analytics.ts](../src/lib/analytics.ts) 가 단일 진실.

## 환경 분리

| 환경                     | 측정 ID                    | gtag.js |
| ------------------------ | -------------------------- | ------- |
| Real (Vercel Production) | Vercel `NEXT_PUBLIC_GA_ID` | 로드    |
| Beta (Vercel Preview)    | Vercel `NEXT_PUBLIC_GA_ID` | 로드    |
| Local                    | 미설정                     | 미로드  |

[src/app/layout.tsx](../src/app/layout.tsx) 가 env 빈 값일 때 `<GoogleAnalytics>` 자체를 미렌더한다. 자동수집(page_view 등)도 함께 차단.

## 트래킹 구조

- 헬퍼 정의: [src/lib/analytics.ts](../src/lib/analytics.ts) — `track()` 공통 래퍼가 봇/dev/`/dev/*` 가드와 `user_type`·`bot_score` 자동 주입을 담당.
- 호출 사이트: 각 도메인 컴포넌트에서 헬퍼 import. 도메인 prefix — `bundle_*`, `compare_*`, `single_*`, `auth_*`, `ask_*`.
- User ID: 로그인 시 서버 `user.id`를 [src/providers/AuthProvider.tsx](../src/providers/AuthProvider.tsx) 에서 세팅.

## 설계 원칙

- 네이밍: `snake_case`, `{도메인}_{액션}`.
- PII 금지: 닉네임·댓글 본문·검색 원문·카카오 ID 전송 금지. 검색어는 길이 + SHA256 앞 8자.
- 중복 호출 방지: 마운트 이벤트는 `useRef` 가드, 모달 open은 1회만.
- 단일값으로만 들어가는 차원은 만들지 말 것 (예: `compare_type`).

## 신규 GA4 속성 셋업

새 속성을 만들 때 GA4 콘솔(관리 → 데이터 표시 → 맞춤 정의)에서 등록할 항목은 [src/lib/analytics.ts](../src/lib/analytics.ts) 의 이벤트 파라미터·user_properties를 그대로 추가. 반영까지 24~48시간 (DebugView·실시간은 즉시).

## 디버깅

- DebugView — Chrome `Google Analytics Debugger` 확장 → GA4 관리 → DebugView. 파라미터 즉시 검증.
- 이벤트 안 보임 → AdBlocker / 측정 ID 환경 / 맞춤 정의 등록 / 24h 대기 순서로 점검.
- 로컬에서 발화 확인 → `NEXT_PUBLIC_GA_ID` 일시 세팅 후 console `[GA] {event}` 디버그 로그.

## 관련 문서

- Ask H3 4주 검증 K-factor 보고서: [docs/analytics/ask-teto-egen-report.md](analytics/ask-teto-egen-report.md)
