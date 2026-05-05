# 탭 네비게이션 (`/`)

> 최종 업데이트: 2026-03-22

## 개요

메인 피드 상단의 단일 탭 바. 필터탭(NEW/HOT/MY)과 카테고리탭을 하나의 가로 스크롤 바에 통합한 Polymarket 스타일 네비게이션.

---

## 1. 탭 바 구조

### 레이아웃

```
[ 💘 소개팅   ❓ 민폐 논란  │  ✦ NEW   🔥 TOP   ☑ 가치관 비교   ☑ MY ]
```

- 카테고리탭(소개팅 / 민폐 논란) + 구분자(│) + 필터탭(NEW/TOP/가치관 비교/MY)이 하나의 `<nav>` 안에 배치
- 카테고리 탭이 필터 탭 앞에 위치
- 가로 스크롤, 스크롤바 숨김
- `position: fixed`, `top: 56px` (헤더 아래 고정)
- 상호 배타적 선택: 탭 하나만 활성화 가능
- 기본 선택: 소개팅 (카테고리 슬러그 `dating`)

### 컴포넌트 트리

```
MainContent
  └── MainHeader (fixed, 56px)
  └── FlexibleLayout
      └── MainView (클라이언트 컴포넌트)
          ├── ContentTabs (fixed, 필터탭 + 구분자 + 카테고리탭)
          ├── CardList (무한스크롤 카드 그리드)
          └── CommentBottomSheet
```

### 관련 파일

- `src/components/features/Main/ContentTabs/ContentTabs.tsx` — 탭 바 컴포넌트
- `src/components/features/Main/ContentTabs/ContentTabs.module.scss` — 탭 바 스타일
- `src/components/features/Main/MainView.tsx` — 상태 관리 및 API 연결
- `src/constants/contentTab.ts` — 탭 타입 및 상수 정의
- `src/constants/category.ts` — 카테고리 폴백 목록

---

## 2. 필터탭

### NEW

- 라벨: `NEW`
- 아이콘: SparkleIcon (✦ 반짝임, 13x13px)
- API: `sort=latest`
- 의미: 최신순 핫픽

### HOT

- 라벨: `HOT`
- 아이콘: FlameIcon (🔥 불꽃, 13x13px)
- API: `sort=hot`
- 의미: 인기순 핫픽

### MY

- 라벨: `MY`
- 아이콘: VoteCheckIcon (☑ 체크박스, 13x13px)
- API: `filter=voted`
- 의미: 사용자가 투표한 핫픽 (x-tku-id 기반)

### 아이콘 규칙

- 크기: 13x13px 통일
- 색상: `currentColor` (탭 텍스트 색상 따라감)
- 비활성 시: `opacity: 0.6`
- 활성 시: `opacity: 1`
- 텍스트 왼쪽에 4px 간격으로 배치

---

## 3. 구분자

- 카테고리탭과 필터탭(NEW/TOP/가치관 비교/MY) 사이에 세로선 표시
- 스타일: `width: 1px`, `height: 16px`, `rgba(#fff, 0.12)`
- 마진: 좌우 4px
- 카테고리가 0개이면 구분자 미표시

---

## 4. 카테고리탭

### 데이터 소스

- **1순위**: `GET /api/v1/hotpicks/categories` API 응답 (`CategoryTabResponse[]`)
- **폴백**: `src/constants/category.ts`의 `CATEGORY_FILTERS` 상수
- API 응답에서 `slug: 'all'`인 "전체" 카테고리는 제외 (NEW 탭이 대체)
- **노출 화이트리스트**: `src/constants/category.ts`의 `VISIBLE_CATEGORY_SLUGS` 상수에 포함된 슬러그만 탭에 표시 (현재 `['dating', 'nuisance']`). 직접 URL 진입(`/?category=love` 등)은 차단하지 않으므로 SEO·롱테일 검색 유입은 보존됨.

### 카테고리 목록 (폴백)

| 라벨      | slug         |
| --------- | ------------ |
| 소개팅    | dating       |
| 민폐 논란 | nuisance     |
| 연애      | love         |
| 결혼      | marriage     |
| 관계      | relationship |
| 재테크    | finance      |
| 직장      | work         |
| 라이프    | life         |
| 트렌드    | trend        |

### 노출 화이트리스트 정책

탭에 노출할 카테고리는 `VISIBLE_CATEGORY_SLUGS` 상수로 통제한다. 운영 DB나 API 응답이 어떻든, 화이트리스트에 있는 슬러그만 탭에 표시된다.

- 현재 화이트리스트: `['dating', 'nuisance']`
- 정책 변경 이력은 [전략 PRD](../../strategy/2026-05-03-content-niche-pivot.md) 참조
- 화이트리스트에 없는 슬러그도 직접 URL 진입은 정상 동작 — 라우팅·API·카드 로드는 그대로

### API 매핑

- 모든 카테고리탭: `category={slug}&sort=popular`
- 정렬은 인기순 고정 (SelectBox 없음)

---

## 5. 탭 시각 스타일

### 색상

| 상태   | color                      | font-weight  |
| ------ | -------------------------- | ------------ |
| 비활성 | `#8a8a8a` (text-tertiary)  | 500 (medium) |
| 활성   | `#ffffff` (white)          | 700 (bold)   |
| 호버   | `#d1d1d1` (text-secondary) | —            |

### 활성 인디케이터

- 하단 2px gradient line (`primary-gradient: #ff00ff → #ff4500`)
- `left: 25%`, `right: 25%` (탭 너비의 50% 폭)
- `transition: background 0.2s ease`

### 탭 버튼

- `padding: 12px 12px`
- `flex-shrink: 0` (축소 방지)
- `white-space: nowrap`
- `transition: color 0.15s ease`

### 탭 바 컨테이너

- 하단 구분선: `1px solid rgba(#fff, 0.06)`
- `overflow-x: auto`, `scrollbar-width: none`

---

## 6. 상태 관리

### TabSelection 타입

```typescript
type TabSelection =
  | { kind: 'filter'; type: 'new' | 'hot' | 'my' }
  | { kind: 'category'; slug: string; label: string };
```

- 단일 상태 1개로 모든 탭/카테고리/정렬 정보를 표현
- 기존 4개 상태(selectedTab, selectedCategory, sortOption, selectedPeriod)를 대체

### API 파라미터 변환 (buildQueryParams)

| TabSelection                        | API 파라미터                                    |
| ----------------------------------- | ----------------------------------------------- |
| `{ kind: 'filter', type: 'new' }`   | `{ size: 18, sort: 'latest' }`                  |
| `{ kind: 'filter', type: 'hot' }`   | `{ size: 18, sort: 'hot' }`                     |
| `{ kind: 'filter', type: 'my' }`    | `{ size: 18, filter: 'voted' }`                 |
| `{ kind: 'category', slug, label }` | `{ size: 18, category: slug, sort: 'popular' }` |

---

## 7. 탭 전환 동작

1. 탭 클릭 시 `selectedTab` 상태 변경
2. `window.scrollTo({ top: 0 })` — 스크롤 최상단 초기화
3. React Query 키가 변경되어 자동으로 새 데이터 fetch
4. 클릭한 탭이 화면 밖이면 `scrollBy`로 탭 바 자동 스크롤

---

## 8. 빈 상태 메시지

| 탭       | 타이틀                       | 설명                                        |
| -------- | ---------------------------- | ------------------------------------------- |
| NEW      | 새로운 핫픽이 없어요         | 곧 새로운 주제로 찾아뵙겠습니다!            |
| HOT      | 아직 HOT 핫픽이 없어요       | 투표가 활발해지면 여기에 표시됩니다.        |
| MY       | 투표한 핫픽이 없어요         | 관심 있는 주제에 투표해 보세요!             |
| 카테고리 | '{카테고리명}' 핫픽이 없어요 | 해당 카테고리에 핫픽이 등록되면 표시됩니다. |

- 아이콘 없음 (텍스트만)
- 세로 중앙 정렬, `min-height: 60vh`

---

## 9. 접근성

- `<nav role="tablist" aria-label="콘텐츠 필터">`
- 각 탭: `<button role="tab" aria-selected={boolean}>`
- 구분자: `aria-hidden="true"`
- `data-testid` 속성:
  - 탭 바: `content-tabs`
  - 필터탭: `content-tab-{type}` (예: `content-tab-new`)
  - 카테고리탭: `content-tab-category-{slug}` (예: `content-tab-category-love`)

---

## 10. 헤더 고정

- `MainHeader`: `position: fixed`, `top: 0`, 높이 56px
- `ContentTabs`: `position: fixed`, `top: 56px`
- 콘텐츠 영역: `padding-top: 98px` (헤더 56px + 탭 42px)

---

## API 요약

| Method | Endpoint                      | 파라미터                                       | 설명             |
| ------ | ----------------------------- | ---------------------------------------------- | ---------------- |
| GET    | `/api/v1/hotpicks/main`       | `sort`, `filter`, `category`, `cursor`, `size` | 탭별 피드 조회   |
| GET    | `/api/v1/hotpicks/categories` | —                                              | 카테고리 탭 목록 |

### sort 파라미터 (BE 지원 확인됨)

| 값            | 의미                 |
| ------------- | -------------------- |
| `recommended` | 추천순 (기본)        |
| `latest`      | 최신순 (NEW 탭)      |
| `popular`     | 인기순 (카테고리 탭) |
| `hot`         | HOT순 (HOT 탭)       |

### filter 파라미터 (BE 추가 필요)

| 값      | 의미                     |
| ------- | ------------------------ |
| `voted` | 내가 투표한 핫픽 (MY 탭) |

---

## 삭제된 기능

| 기능                                            | 대체                                    |
| ----------------------------------------------- | --------------------------------------- |
| 마감 탭                                         | 제거 (별도 대체 없음)                   |
| FilterBar (카테고리 SelectBox + 정렬 SelectBox) | 탭 바에 카테고리 통합, 정렬은 탭별 고정 |
| PeriodSelector (HOT 기간 선택)                  | 제거                                    |
| SortToggle                                      | 제거                                    |

---

## Changelog

- 2026-05-05: 화이트리스트에 `nuisance` ("민폐 논란") 추가 — 소개팅 옆에 노출, HelpCircleIcon 표시. 전략 PRD Steel-man 시나리오 3의 "70% 핏 안 맞을 때 민폐 추가" 옵션을 선제 적용
- 2026-05-03: 카테고리 정책 c' — 화이트리스트(`VISIBLE_CATEGORY_SLUGS`)로 노출 통제, 디폴트 탭을 "소개팅" 카테고리로 변경, 카테고리 탭을 필터탭 앞으로 이동 (전략 PRD: docs/strategy/2026-05-03-content-niche-pivot.md)
- 2026-03-22: 초기 작성 — Polymarket 스타일 단일 탭 바 리디자인
