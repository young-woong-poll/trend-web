# 참여 중인 비교링크 — 결과 페이지 진입점 (하프시트)

날짜: 2026-04-22
스펙 영역: 번들 결과 / 그룹 결과 / 비교링크 생성 모달

## 배경

`CreateCompareLink` 모달은 "신규 비교링크 생성" 의도로 만들어졌으나, 모달 본문 하단에 "참여 중인 링크 N개" 리스트가 함께 노출되고 있다. 신규 유저에게는 비교 가치를 강조하는 CTA였지만, 재방문 유저에게는 "이전 참여 링크를 보고 싶은데 신규 생성 버튼을 눌러야 보인다"는 의도-액션 불일치를 만든다.

근본 원인은 두 의도(신규 생성 / 기존 링크 진입)가 한 모달에 묶여 있다는 점이다. 결과 페이지 본문에 별도 진입점을 두고, 모달은 본래 역할인 생성 폼으로 단일화한다.

## 결정

**(B) 결과 페이지 본문에 별도 진입점, (가) 하프시트 형태**.

신규 유저 CTA(`친구들과 가치관 비교하기` / `친구들 초대하기`)의 시각적 임팩트를 보존하면서, 재방문 유저는 모달을 거치지 않고 이전 링크에 즉시 도달한다. 모바일 우선 프로젝트라 하프시트가 가장 자연스러운 인터랙션이다.

대안 검토:

- (가) 하프시트, (나) 작은 중앙 모달, (다) 페이지 내 인라인 펼침 — mockup으로 직접 비교
- 결과 페이지 두 곳 모두 (가) 하프시트로 결정

## 변경 사항

### 1. 번들 결과 페이지

**위치**: 게이트 섹션 메인 CTA(`친구들과 가치관 비교하기`) **바로 아래**

**진입점**: 텍스트 링크 `참여 중인 비교링크 N개 ›`

- 메인 CTA보다 시각 위계 낮은 텍스트 형태
- 클릭 시 하프시트 오픈

**노출 조건**: 로그인 + `useMyCompareLinks(slug)` 결과 중 `type === 'GROUP' && !!token` 1개 이상

- 비로그인: 숨김
- 로딩 중: 숨김 (스켈레톤 없음)
- 빈 리스트: 숨김

### 2. 그룹 결과 페이지

**위치**: 기존 `ctaSection`(`+ 새 비교링크 만들기` 버튼) **바로 위**

**진입점**: 텍스트 링크 `참여 중인 비교링크 N개 ›`

- 클릭 시 하프시트 오픈

**노출 조건**: 로그인 + `useMyCompareLinks(result.bundleSlug)` 결과 중 `type === 'GROUP' && !!token && token !== currentToken` 1개 이상

- 비로그인: 숨김
- 로딩 중: 숨김
- 자기 토큰만 있는 경우: 숨김

### 3. 하프시트 공통 사양 (`MyCompareLinksSheet`)

**UI**:

- 화면 하단에서 슬라이드 업
- 헤더: `참여 중인 비교링크 N개` + 닫기 X
- 항목: `{groupName}` · `{memberCount}명` · `›`
- 정렬: `createdAt desc`
- 5개 초과 시 시트 내부 스크롤
- 닫기 트리거: 배경 dim 클릭 / X 버튼 / ESC 키

**구현 규칙** (CLAUDE.md 준수):

- `createPortal(document.body)` — `BundleBackground`의 `backdrop-filter` 안 stacking context 회피
- iOS 스크롤 잠금: `position: fixed` 패턴 (overflow: hidden 단독 불충분)

**Props**:

```ts
interface MyCompareLinksSheetProps {
  isOpen: boolean;
  links: MyCompareLink[];
  onItemClick: (token: string) => void;
  onClose: () => void;
}
```

### 4. `CreateCompareLink` 모달 정리

**제거**:

- 모달 안 "참여 중인 링크 N개" 섹션 ([CreateCompareLink.tsx:179-221](../../src/components/features/Bundle/BundleResult/CreateCompareLink.tsx#L179-L221))
- skeleton 마크업 + 관련 SCSS (`existingLabelSkeleton`, `existingRowSkeleton`, `skeletonPulse` 등)
- `useMyCompareLinks` import, `existingGroups`, `handleOpenExisting`, `isLinksPending`

**유지**: 모달 헤더 / 번들 정보 / 입력 폼 / 생성 버튼

부수 효과: 모달 높이 축소 → 작은 디바이스에서 가독성 개선.

### 5. 데이터/캐시

- 번들 결과: `useMyCompareLinks(slug)` 호출 추가
- 그룹 결과: `useMyCompareLinks(result.bundleSlug)` 호출 추가 + `token !== currentToken` 필터
- `useCreateCompareLink` 성공 시 `myCompareLinksQueryKey(slug)` 무효화 — 신규 생성 후 stale 캐시(새 그룹 누락) 방지
- **롤백**: 이전에 CLS 대응으로 추가했던 `prefetchMyCompareLinks` 호출은 제거. 결과 페이지가 직접 `useMyCompareLinks`를 호출하므로 prefetch 불필요. helper 함수 자체는 유지(미래 사용 가능성).

### 6. 컴포넌트 구조

**신규**:

- `src/components/features/Compare/MyCompareLinksSheet/MyCompareLinksSheet.tsx`
- `src/components/features/Compare/MyCompareLinksSheet/MyCompareLinksSheet.module.scss`

번들 결과/그룹 결과 양쪽에서 동일 컴포넌트 사용.

## 노출 조건 매트릭스

| 상황                             | 번들 결과 진입점     | 그룹 결과 진입점 |
| -------------------------------- | -------------------- | ---------------- |
| 비로그인                         | 숨김                 | 숨김             |
| 로그인 + 데이터 로딩 중          | 숨김 (스켈레톤 없음) | 숨김             |
| 로그인 + 빈 리스트               | 숨김                 | 숨김             |
| 로그인 + 자기 토큰만 (그룹 결과) | —                    | 숨김             |
| 로그인 + N개 (현재 토큰 제외)    | 노출                 | 노출             |

## 영향 범위

- `src/components/features/Bundle/BundleResult/BundleResult.tsx` — 진입점 + 시트 마운트
- `src/components/features/Bundle/BundleResult/CreateCompareLink.tsx` — 리스트 영역 제거
- `src/components/features/Bundle/BundleResult/CreateCompareLink.module.scss` — 관련 SCSS 제거
- `src/components/features/Compare/GroupResult/FullGroupResultView.tsx` — 진입점 + 시트 마운트, prefetch 호출 제거
- `src/components/features/Compare/MyCompareLinksSheet/` — 신규
- `src/hooks/api/useCompare.ts` — `useCreateCompareLink` 성공 시 `myCompareLinksQueryKey` 무효화 추가

영향 없는 경로:

- 메인 페이지 `BundleAccordion` — "참여 중인 비교링크" 카피 / UI 그대로 유지 (단일 진실 톤 유지)
- `CompareLink` 생성 후 라우팅 흐름 — 변경 없음

## QA 포인트

- 비로그인 상태에서 결과 페이지 진입 → 진입점 숨김 확인
- 첫 번들 완료 직후(빈 리스트) → 진입점 숨김 확인
- 그룹 결과에서 자기 그룹만 있을 때 → 진입점 숨김 확인
- 새 비교링크 생성 후 결과 페이지 복귀 → 신규 항목이 시트 리스트 상단에 즉시 반영(캐시 무효화)
- 시트 오픈 중 배경 스크롤 잠금 (iOS Safari)
- 시트 z-index가 `BundleBackground`의 `backdrop-filter` 위에 정상 노출
- ESC / 배경 dim / X 모두 닫기 동작
- N=1, N=5, N=10(스크롤) 시각 확인

## 결정 외 사항 (Out of Scope)

- 메인 페이지 `BundleAccordion`의 카피/UI 변경 — 현재 패턴 유지
- N=1 케이스에서 시트 생략하고 즉시 이동 — 단순한 일관성을 위해 적용하지 않음 (브레인스토밍 중 보류)
- `MyCompareLinksSheet` 외 다른 컨텍스트(예: 메인 카드 리스트)에서의 재사용 — 필요 시 별도 작업
