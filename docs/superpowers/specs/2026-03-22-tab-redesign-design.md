# 탭 구조 리디자인 — 설계 문서

## 배경

기존 메인 페이지는 4개 탭(전체/HOT/내 투표/마감) + FilterBar(카테고리 SelectBox, 정렬 SelectBox)의 2단 구조였다. 이를 Polymarket 스타일의 **단일 탭 바**로 통합한다.

## 변경 요약

- **기존**: `전체 | HOT | 내 투표 | 마감` + FilterBar(카테고리 SelectBox + 정렬/기간 SelectBox)
- **변경**: `NEW | HOT | MY | 연애 | 결혼 | 관계 | 재테크 | 직장 | 라이프 | 트렌드`
- 마감 탭 제거, 카테고리가 탭으로 승격, FilterBar 제거
- 정렬 로직: NEW=최신순, HOT=인기순, MY=내투표, 카테고리=인기순 (고정, SelectBox 없음)

## 탭 바 설계

### 레이아웃

```
┌──────────────────────────────────────────────────────────────────────┐
│  Header (로고 + 검색)                                         48px  │
├──────────────────────────────────────────────────────────────────────┤
│  [ NEW  HOT  MY │ 연애  결혼  관계  재테크  직장  라이프  트렌드 ]   │
├──────────────────────────────────────────────────────────────────────┤
│  카드 그리드 (무한 스크롤)                                           │
└──────────────────────────────────────────────────────────────────────┘
```

- 단일 탭 바: sticky (top: 48px), 가로 스크롤, 스크롤바 숨김
- 구분자: 필터탭(NEW/HOT/MY) 뒤에 세로선 — `rgba(#fff, 0.12)`, 높이 16px
- 상호 배타적 선택: 탭 하나만 활성화 가능
- 기본 선택: NEW

### 탭별 API 매핑

| 탭         | 타입     | API 파라미터                                | 의미              |
| ---------- | -------- | ------------------------------------------- | ----------------- |
| NEW (기본) | filter   | `sort: 'latest'`                            | 최신순            |
| HOT        | filter   | `sort: 'hot'`                               | 인기순            |
| MY         | filter   | `filter: 'voted'`                           | 내 투표           |
| 연애       | category | `category: 'love', sort: 'popular'`         | 카테고리별 인기순 |
| 결혼       | category | `category: 'marriage', sort: 'popular'`     | 카테고리별 인기순 |
| 관계       | category | `category: 'relationship', sort: 'popular'` | 카테고리별 인기순 |
| 재테크     | category | `category: 'finance', sort: 'popular'`      | 카테고리별 인기순 |
| 직장       | category | `category: 'work', sort: 'popular'`         | 카테고리별 인기순 |
| 라이프     | category | `category: 'life', sort: 'popular'`         | 카테고리별 인기순 |
| 트렌드     | category | `category: 'trend', sort: 'popular'`        | 카테고리별 인기순 |

### 시각 스타일

```
비활성:  color: #8a8a8a (text-tertiary), font-weight: 500
활성:    color: #ffffff (white), font-weight: 700
         하단 2px gradient border (primary-gradient: #ff00ff → #ff4500)
구분자:  1px solid rgba(#fff, 0.12), height: 16px, margin: 0 4px
호버:    color: #d1d1d1 (text-secondary)
트랜지션: color 0.15s ease
탭 패딩:  12px 12px
```

### 빈 상태 메시지

| 탭       | 타이틀                       | 설명                                        |
| -------- | ---------------------------- | ------------------------------------------- |
| NEW      | 새로운 핫픽이 없어요         | 곧 새로운 주제로 찾아뵙겠습니다!            |
| HOT      | 아직 HOT 핫픽이 없어요       | 투표가 활발해지면 여기에 표시됩니다.        |
| MY       | 투표한 핫픽이 없어요         | 관심 있는 주제에 투표해 보세요!             |
| 카테고리 | '{카테고리명}' 핫픽이 없어요 | 해당 카테고리에 핫픽이 등록되면 표시됩니다. |

## 컴포넌트 변경 계획

### 수정

| 파일                                  | 변경 내용                                                            |
| ------------------------------------- | -------------------------------------------------------------------- |
| `ContentTabs/ContentTabs.tsx`         | 필터탭 + 구분자 + 카테고리탭 단일 바 통합, 카테고리 API 데이터 수신  |
| `ContentTabs/ContentTabs.module.scss` | 구분자(divider) 스타일 추가                                          |
| `MainView.tsx`                        | FilterBar 제거, 상태 단순화 (selectedTab 1개), buildQueryParams 변경 |
| `constants/contentTab.ts`             | 탭 타입 변경, HOT_PERIODS 제거                                       |
| `constants/category.ts`               | 카테고리 목록 업데이트                                               |

### 삭제

| 파일                                        | 사유         |
| ------------------------------------------- | ------------ |
| `FilterBar/FilterBar.tsx`                   | 탭 바에 통합 |
| `FilterBar/FilterBar.module.scss`           | 탭 바에 통합 |
| `CategoryFilter/CategoryFilter.tsx`         | 탭 바에 통합 |
| `CategoryFilter/CategoryFilter.module.scss` | 탭 바에 통합 |

### 영향 없음

| 파일                        | 사유                                              |
| --------------------------- | ------------------------------------------------- |
| `CardList/CardList.tsx`     | 변경 없음 (emptyState prop으로 대응)              |
| `MainContent.tsx`           | 변경 없음                                         |
| `MainHeader/MainHeader.tsx` | 변경 없음                                         |
| `useDisplay.ts`             | API 훅 자체는 변경 없음 (params 전달 방식만 변경) |

## 상태 관리 변경

```
기존 (4개 상태):
  selectedTab: ContentTabType        // 'all' | 'hot' | 'voted' | 'closed'
  selectedCategory: string | null    // category slug
  sortOption: HotpickSortOption      // 'popular' | 'latest'
  selectedPeriod: HotPeriodType      // 'realtime' | 'weekly' | 'monthly' | 'yearly'

변경 (1개 상태):
  selectedTab: TabSelection
    - { type: 'new' }
    - { type: 'hot' }
    - { type: 'my' }
    - { type: 'category', slug: string, label: string }
```

## API 호환성

### 현재 지원 (`GET /api/v1/hotpicks/main`)

- `sort`: `recommended | latest | popular | hot` — NEW, HOT, 카테고리 탭 지원 가능
- `category`: string — 카테고리 탭 지원 가능
- `cursor`, `size` — 무한 스크롤 지원

### BE 추가 구현 필요

- MY(내 투표) 탭: `filter: 'voted'` 파라미터가 swagger 스펙에 미정의
  - 기존 FE 코드에서 이미 전송 중이었으므로, BE가 이미 처리하고 있을 가능성 있음
  - FE에서는 기존 방식 유지하고, BE 스펙 확정 후 조정

### 카테고리 slug 목록 (BE 확인 필요)

현재 BE 카테고리 API(`GET /api/v1/hotpicks/categories`)에서 반환하는 slug 값과 아래 FE 하드코딩 값의 일치 여부 확인 필요:

| FE label | FE slug (하드코딩 폴백) |
| -------- | ----------------------- |
| 연애     | love                    |
| 결혼     | marriage                |
| 관계     | relationship            |
| 재테크   | finance                 |
| 직장     | work                    |
| 라이프   | life                    |
| 트렌드   | trend                   |

실제 운영 시에는 `useCategories()` API 응답을 사용하므로, 하드코딩은 폴백용.
