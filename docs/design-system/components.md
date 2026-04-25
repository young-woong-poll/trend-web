# 컴포넌트 카탈로그

HotPick의 재사용 가능한 컴포넌트·패턴을 결(Designer)이 점진적으로 축적하는 카탈로그. 새 스펙/구현에서 확정된 항목만 기록한다. 개별 컴포넌트의 구체 스타일은 코드(SCSS 모듈)를 SSoT로 보고, 여기서는 **용도·사용 위치·재사용 지침**에 집중한다.

## 기록 원칙

- **확정된 것만**: 스펙 모드 또는 구현 모드에서 실제로 채택·배포된 컴포넌트만 기록. 검토 단계 아이디어는 제외.
- **경로·토큰 인라인**: 빠른 탐색을 위해 파일 경로와 사용 토큰을 나열.
- **의도 기록**: "왜 신규인지", "왜 기존을 확장하지 않았는지" 같은 결정 근거 요약을 남긴다.
- 항목이 쓸모 없어지면 삭제 (코드가 SSoT).

## 보류·재평가 메모

- **2026-04-26, Phase 1 결과 페이지 재설계 작업 (MyResultView 일체 + 관련 패턴: 나 중심 정보 위계, 그룹 단어 제거, Canvas 시각화)** — Phase 1 즉시 보류 결정에 따라 작업 브랜치 분기.
  - **현재 브랜치 `feature/h3`**: Phase 1 코드·스펙 없음. H3 검증 전용.
  - **보존 브랜치 `feature/renewal-6`**: MyResultView 컴포넌트 일체(`src/components/features/Compare/MyResultView/`) + 스펙(`docs/superpowers/specs/2026-04-24-bundle-result-redesign-design.md`) + 플랜(`docs/superpowers/plans/2026-04-24-bundle-result-redesign.md`) 보존. 마지막 커מ "결과 개선중 보류" (`039d472`).
  - **재평가 시점**: H3 1차 검증 회고(2026-05-27 전후) 이후. 채택 시 `feature/renewal-6` 자료 재활용 또는 cherry-pick. 폐기 시 본 메모만 유지하고 브랜치는 그대로 보존.
  - **결정 맥락**: [docs/strategy/retro-2026-04-25-bundle-essence.md](../strategy/retro-2026-04-25-bundle-essence.md), [docs/strategy/2026-04-25-h3-friend-evaluation.md](../strategy/2026-04-25-h3-friend-evaluation.md).

---

## ChemSubFilter

- **용도**: 홈 "가치관 비교" 탭(`/?filter=chem`) 상단에 노출되는 필터바. 정렬(인기순/최신순)과 "아직 안 해본 것만" 토글을 조합한다.
- **사용 위치**: `MainViewClient` 내 `isChemTab` 분기 (`src/components/features/Main/MainViewClient.tsx`)
- **경로**: `src/components/features/Main/ChemSubFilter/`
- **props**: `selectedSort`, `onSortChange`, `excludeParticipated`, `onExcludeParticipatedChange`
- **구성**: 좌측 정렬 드롭다운 + 우측 칩 토글
- **토큰**: `$bg-secondary`, `$text-secondary`, `$primary-gradient`(활성 토글), `$border-radius-md`
- **접근성**: 토글 `role="switch"` + `aria-checked`, 드롭다운 `role="listbox"` + 포커스 트랩, 터치 타겟 `min-height: 44px`
- **TopSubFilter와 분리한 이유**: 역할(인기순 서브필터 vs 탐색 허브 필터)과 props가 달라, 공유 시 두 컴포넌트의 경계가 흐려진다. 각 탭의 필터바는 독립 컴포넌트로 유지한다.
- **관련 스펙**: [2026-04-21-chem-tab-bundle-hub-design.md](../superpowers/specs/2026-04-21-chem-tab-bundle-hub-design.md)

## BundleCard

- **용도**: 번들(가치관 비교) 카드. NEW 탭 피드 삽입, 가치관 비교 탭 리스트, TOP 탭 번들 모드에서 공통 사용.
- **경로**: `src/components/features/Main/BundleCard/BundleCard.tsx`
- **CTA 라벨**: `ctaLabel?: string` prop으로 맥락별 오버라이드. 기본값 "시작하기"(NEW 탭), 가치관 비교 탭에서는 "자세히 보기"로 오버라이드.
- **토큰**: `$bg-secondary`, `$bg-tertiary`, `$primary-gradient`(CTA), `$text-secondary`, `$text-tertiary`, 카테고리 테마 border-top
- **구성**: 카테고리 + 케미 뱃지 / 제목·subtitle / 메타(문항 수·참여 수) / 1:1·그룹 비교 뱃지 2개 / CTA 버튼 / D-day (있을 때만)
- **관련 스펙**: [2026-04-11-bundle-main-feed-design.md](../superpowers/specs/2026-04-11-bundle-main-feed-design.md), [2026-04-21-chem-tab-bundle-hub-design.md](../superpowers/specs/2026-04-21-chem-tab-bundle-hub-design.md)

## BundleRecommendSection

- **용도**: 결과 페이지 하단 꼬리 추천 섹션. 현재 번들 제외 + 참여·마감 번들 제외 + 셔플 3개 노출. 하단에 "전체 가치관 비교 보기 →" 앵커로 허브 유입 유도.
- **사용 위치**: `CompareResult`(1:1), `GroupResult`(그룹)
- **경로**: `src/components/common/BundleRecommendSection/`
- **props**: `currentSlug: string`
- **섹션 헤더**: "이런 테스트는 어때요?" (`SingleRecommendSection`과 톤 일치)
- **앵커**: `next/link` 기본 `router.push`, 터치 타겟 `min-height: 44px` 보장
- **관련 스펙**: [2026-04-15-bundle-recommend-section-design.md](../superpowers/specs/2026-04-15-bundle-recommend-section-design.md), [2026-04-21-chem-tab-bundle-hub-design.md](../superpowers/specs/2026-04-21-chem-tab-bundle-hub-design.md)

---

## 패턴

### 탭별 필터바 분리 (vs 공유 확장)

홈 `ContentTabs`의 각 필터 탭(TOP / 가치관 비교 등)에 서브필터가 필요할 때, **기존 서브필터 컴포넌트를 확장하지 않고 신규 컴포넌트를 분리**하는 것을 기본 원칙으로 한다.

- **근거**: 탭별 필터는 (1) 내부 상태 스키마가 다르고, (2) 업데이트 주기도 다르다. 공유 컴포넌트로 묶으면 props가 선택적으로 쏟아져 "이 탭에선 이것만 쓴다"는 암묵 규칙이 생기고, 유지 보수 시 어느 탭 영향인지 파악이 어려워진다.
- **적용 사례**: `TopSubFilter` (TOP 탭) / `ChemSubFilter` (가치관 비교 탭) / `MySubTabs` (MY 탭) — 각각 독립 컴포넌트
- **관련 스펙**: [2026-04-21-chem-tab-bundle-hub-design.md](../superpowers/specs/2026-04-21-chem-tab-bundle-hub-design.md)

### URL searchParams 기반 탭 라우팅

홈 메인 탭은 `router.replace`로 URL searchParams(`?filter=...`, `?category=...`, `?mysub=...`)를 업데이트하고, 이 URL을 SSoT로 파싱한다.

- **위치**: `src/components/features/Main/MainViewClient.tsx` (`parseTabFromQuery`, `buildUrlParams`)
- **이득**: 탭 URL이 외부 공유 가능(= 전용 페이지 효과 흡수), 뒤로가기/북마크 지원, 새 탭 추가 시 분기 추가만으로 완결.
- **주의**: 탭 내부 UI 상태(정렬, 필터 토글 등)는 URL에 싣지 않는다 — URL 오염 최소화. 컴포넌트 state로 보존하되 새로고침 시 기본값 초기화.
- **관련 스펙**: [2026-04-21-chem-tab-bundle-hub-design.md](../superpowers/specs/2026-04-21-chem-tab-bundle-hub-design.md)
