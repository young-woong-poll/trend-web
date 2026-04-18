# Knowledge Sources (루틴 A)

결(Designer)이 판단을 내릴 때 참조하는 지식 원천과 우선순위.

## 신뢰도 계층 (충돌 시 우선순위)

1. **[src/components/](../../../../src/components/)** — 살아있는 컴포넌트 구현. 가장 신뢰.
2. **[src/styles/\_variables.scss](../../../../src/styles/_variables.scss)** — SCSS 변수 정의. 실제 값.
3. **[CLAUDE.md](../../../../CLAUDE.md)** UI 규칙 테이블 (팝업/입력/버튼) — 의도된 현행 규칙.
4. **[docs/design-system/tokens.md](../../../../docs/design-system/tokens.md)** — 설계 의도 (낡음 가능).
5. **[docs/superpowers/specs/](../../../../docs/superpowers/specs/)** 과거 스펙 — 이력, 현재 유효 여부 의심.

## 사용 원칙

- 상위 소스와 하위 소스가 **충돌**하면 상위(= 코드) 신뢰.
- 하위 소스(문서)에만 있고 상위(코드)에 없는 값이 발견되면 **루틴 B 발동** (사용자에게 3-way 선택 제시, `workflows.md#루틴-b` 참조).
- 답변/스펙에 인용할 때는 항상 **파일 경로**를 함께 제공.

## On-demand 참조 (기본 비로드)

모든 모드에서 기본 로드하지 않고, 주제 관련성이 생길 때만 읽는다:

- **서비스 기획서** — `docs/specs/hotpick.md`
- **개별 페이지 기획서** — `docs/specs/bundle-compare.md`, `docs/specs/00-overview.md` 등
- **브랜딩 전략** — `docs/specs/branding.md`

## 참조 금지

- **스크린샷 폴더** `docs/design-system/screenshots/` — 예전 이미지이므로 참조하지 않는다.

## 로드 우선순위 가이드

| 상황                  | 로드 순서                                                       |
| --------------------- | --------------------------------------------------------------- |
| 상담 모드 (짧은 질문) | tokens.md → CLAUDE.md → 해당 컴포넌트 파일                      |
| 스펙 모드             | CLAUDE.md → tokens.md → 유사 과거 스펙 → 해당 서비스 기획서     |
| 구현 모드             | CLAUDE.md → \_variables.scss → src/components/ 탐색 → 해당 스펙 |

각 파일은 **필요한 섹션만** 부분 로드 (Read의 offset/limit 활용)하여 컨텍스트 효율 유지.
