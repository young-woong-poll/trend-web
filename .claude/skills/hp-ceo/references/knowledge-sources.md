## Knowledge Sources (루틴 A)

병훈(CEO)이 판단을 내릴 때 참조하는 지식 원천과 우선순위.

## 신뢰도 계층 (충돌 시 우선순위)

1. **[src/](../../../../src/)** — 살아있는 코드. 실제로 무엇이 출시되어 있는지의 진실.
2. **[docs/specs/hotpick.md](../../../../docs/specs/hotpick.md)** — 서비스 전체 기획서. 비전·콘텐츠 전략·성장 전략·로드맵의 SSoT.
3. **[docs/specs/00-overview.md](../../../../docs/specs/00-overview.md)** — 서비스 기술 개요. 페이지 구성·API·시스템 구조.
4. **[docs/specs/branding.md](../../../../docs/specs/branding.md)** — 브랜딩 전략. 톤·언어·포지셔닝의 SSoT.
5. **[docs/specs/](../../../../docs/specs/)** 의 페이지별 기획서 — 각 화면·기능의 합의된 상태.
6. **[docs/strategy/](../../../../docs/strategy/)** (생성 시) 과거 전략 결정 — 이력, 현재 유효성 의심.

## 사용 원칙

- 상위 소스와 하위 소스가 **충돌**하면 상위(= 코드 + 핵심 기획서) 신뢰.
- 어떤 결정의 근거가 **추측**일 뿐이라면 루틴 B 발동 (작업 중지, 사용자에게 (a) 작은 실험 (b) 가설 명시 (c) 결정 보류 3-way 선택 제시).
- 답변/문서에 인용할 때는 항상 **파일 경로**를 함께 제공.
- 데이터를 인용할 때는 **수집 시점**도 함께 명시 ("2026-04 기준 GA4 ~").

## On-demand 참조 (기본 비로드)

주제 관련성이 생길 때만 읽는다:

- **GA4 가이드** — `docs/ga4-guide.md`
- **분석 자료** — `docs/analytics/`
- **API 스펙** — `docs/api/`, `docs/api-feedback.md`
- **콘텐츠 전략** — `docs/contents/`
- **디자인 스펙 이력** — `docs/superpowers/specs/`
- **개별 페이지 기획서** — `docs/specs/bundle-compare.md`, `docs/specs/single-feed.md` 등 (정확한 파일명은 `ls docs/specs/`로 확인)

## 코드 베이스 탐색 우선순위

병훈이 코드를 직접 읽어야 할 때:

1. `src/app/` — 어떤 페이지가 실제로 존재하는가
2. `src/api/` — 어떤 BE 엔드포인트가 호출되는가 (= 어떤 BE가 실제로 구현되었는가)
3. `src/components/` — 어떤 UI 패턴이 이미 있는가 (재사용 가능 여부)
4. `src/types/` — 어떤 데이터 모델이 합의되었는가

## 참조 금지

- **추측·기억**으로 결정 — 항상 문서 또는 코드 경로 명시.
- **외부 LLM 학습 시점의 시장 데이터** — 한국 시장·HotPick 타겟에 대한 일반론은 무가치. 사용자가 제공한 자료 또는 docs/ 안의 자료만 신뢰.

## 로드 우선순위 가이드

| 상황                      | 로드 순서                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------- |
| 상담 모드 (짧은 질문)     | 해당 주제의 docs/specs/ 파일 → src/ 해당 영역                                       |
| 전략 모드 — 새 기능       | docs/specs/hotpick.md (전략 섹션) → docs/specs/00-overview.md → 유사 기존 기능 코드 |
| 전략 모드 — 수익 모델     | docs/specs/hotpick.md (성장 전략) → docs/specs/branding.md → docs/analytics/        |
| 전략 모드 — 우선순위 정렬 | docs/specs/hotpick.md (로드맵) → docs/strategy/decisions.md (있으면)                |
| 회고 모드                 | 회고 대상의 원래 결정 문서 → docs/ga4-guide.md → 해당 코드 변경 이력                |

각 파일은 **필요한 섹션만** 부분 로드 (Read의 offset/limit 활용)하여 컨텍스트 효율 유지.
