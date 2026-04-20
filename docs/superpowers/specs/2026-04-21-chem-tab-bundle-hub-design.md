# 가치관 비교 탭 — 번들 탐색 허브

홈 메인 탭에 "가치관 비교" 전용 탭을 신설하여, 그룹이 함께 해볼 다음 가치관 비교 테스트를 빠르게 고를 수 있는 탐색 허브를 제공한다.

## 배경

번들(가치관 비교)은 유저가 유저를 데려오는 포맷이라 바이럴의 핵심이지만, 현재 메인 홈에서 번들을 모아 탐색하는 진입점은 부재하다. 기존 동선은 아래와 같다.

- NEW 탭의 6:1 번들 삽입 — 흐름 속에서 번들을 만난다 (지나칠 수 있음)
- TOP 탭의 "가치관 비교" 서브필터 — 단순 인기순 랭킹 (탐색 기능 빈약)
- MY 탭의 "가치관 비교" 서브탭 — 내가 참여한 번들만 (탐색 아님)
- 결과 페이지의 `BundleRecommendSection` 3개 추천 — 꼬리 추천이라 풀 카탈로그 부재

동일 그룹이 한 가치관 테스트를 끝낸 뒤 "다른 것도 해볼까?"로 이어지려면, 어떤 번들이 존재하는지 한눈에 훑어볼 수 있는 허브가 필요하다. 본 스펙은 이 허브를 홈 메인 탭으로 신설하고, 허브로 유도하는 진입 앵커를 결과 페이지에도 추가한다.

## 레퍼런스 & 영감

### 폴리마켓의 카테고리 탭 독립화

- 출처: [design-inspirations.md#폴리마켓-polymarket-polymarketcom](../../../.claude/skills/hp-designer/references/design-inspirations.md)
- 해당 패턴: Sports, Politics, Crypto 등을 상단 탭으로 독립시켜 "이 묶음은 다른 경험"이라는 메시지를 IA(정보 구조)로 선언한다.
- HotPick 맞춤 이유: 번들은 싱글과 인지 비용·참여 형식이 다른 포맷(5문항, 그룹형 비교)이므로, 탭으로 분리해 '격'을 올리는 것이 포맷 차이를 전달하기에 효과적이다.

### Beli의 카테고리 랭킹 허브

- 출처: [design-inspirations.md#beli](../../../.claude/skills/hp-designer/references/design-inspirations.md)
- 해당 패턴: 리스트를 한 페이지에 응축하되 필터로 잘라 보여주는 탐색 UX.
- HotPick 맞춤 이유: 번들은 "동일 그룹이 연속 소비하는 시리즈" 성격이라 드라마 시리즈 허브처럼 느끼는 것이 자연스럽다. 카테고리·참여 여부·정렬을 한 화면에서 조작하는 허브 패턴이 맞는다.

## 방향성 결정 (Step 0)

| 방향                                | 장점                                                                  | 단점                                                    | 레퍼런스             | 선택 여부 |
| ----------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------- | -------------------- | --------- |
| (a) 홈 상단 '번들 쇼케이스' 선반    | 구현 비용 최저, 홈 스크롤 최상단 노출                                 | 번들이 많아지면 가로 스크롤이 답답, 필터·정렬 불가      | 유튜브 숏츠 선반     | 미선택    |
| (b) 메인 탭에 '가치관 비교' 탭 추가 | 기존 URL searchParams 라우팅과 일치, 공유 URL 자동 획득, IA 선언 효과 | TOP 서브필터와 역할 중복 (정리 필요), 탭이 4개로 늘어남 | 폴리마켓 카테고리 탭 | **선택**  |
| (c) 별도 페이지 `/bundles` 분리     | 탐색 깊이 무제한, 독립 랜딩                                           | 페이지 전환 비용, 홈 이탈 심리                          | Beli 카테고리 허브   | 미선택    |
| (d) 그룹 유지형 다음 번들 브릿지    | 그룹 관성 = k-factor 최대                                             | BE 선행 필요, 다른 축                                   | Kahoot 세션 브릿지   | 향후 확장 |

**최종 선택**: (b) — 이유: 홈 탭 라우팅이 이미 `searchParams` SSoT로 동작(`/?filter=new|top|my|category=...`)하여 추가 리팩터링 비용이 낮고, `/?filter=chem` URL이 카톡·SNS 공유를 통해 (c)의 "전용 랜딩" 효과까지 흡수한다. 필요 시 `next.config.js` rewrites로 `/bundles → /?filter=chem`까지 확장 가능.

**Mock 사용 여부**: 아니오 (대화로 방향 합의, 시각 비교 불필요)

## UX 체크포인트 통과 기록

- **Q1. 유저 목표 한 문장**: "우리 그룹이 함께 해볼 다음 가치관 비교 테스트를 빠르게 고른다."
- **Q2. 상태 정의**:
  - 엠프티 (번들 0개, 초기): 문구 "아직 준비 중인 가치관 비교예요. 곧 새 테스트가 올라옵니다." / 액션 "지금 투표 보러가기" 버튼 → NEW 탭
  - 엠프티 (필터 0개, "아직 안 해본 것만" 활성 시): 문구 "이제 안 해본 테스트가 없어요. 새로 올라오면 알려드릴게요." / 액션 "전체 보기" 버튼 → 필터 해제
  - 실패/에러: 문구 "목록을 불러오지 못했어요." / 액션 "다시 시도" 버튼 → `useBundleList` refetch
  - 로딩: `BundleCard` 스켈레톤 3-4개 세로 나열, 완료 시 실제 리스트로 교체
- **Q3. 대안 경로**: 이 탭에 갇히지 않는다. `ContentTabs`로 NEW/TOP/MY/카테고리 자유 이동 가능하며, 번들 발견 경로는 NEW 탭 6:1 삽입, 결과 페이지 `BundleRecommendSection`, MY '내 테스트' 등 다중 존재. 탭은 탐색 허브로서 선택적 경로이며 필수가 아니다. 다만 Q1 목표를 직접 서빙하기 위해, 결과 페이지의 `BundleRecommendSection` 하단에 "전체 가치관 비교 보기 →" 앵커를 추가하여 허브 유입을 보강한다.
- **Q4. 카피**: 모두 존댓말 유지. 카드 CTA는 NEW 탭에서는 "시작하기", 가치관 비교 탭에서는 "자세히 보기"로 맥락별 분기(탐색 맥락에서 "시작하기"는 Q1 "고른다" 행위와 어긋남). 상세는 "UI 디자인 > 카피" 섹션 참조.
- **Q5. 회귀 영향**: TOP 탭의 '가치관 비교' 서브필터 제거(3파일), 탭 순서 변경(MY 3→4번째, URL 호환), MY 서브탭 라벨 변경("가치관 비교" → **"내 테스트"** — 상·하위 라벨 충돌 회피), `BundleRecommendSection` 앵커 1줄 추가. 상세는 "회귀 영향" 섹션 참조.

## UI 디자인

### 레이아웃

```
┌─────────────────────────────────┐
│  NEW   TOP   가치관 비교   MY   │  ContentTabs (가치관 비교 활성)
├─────────────────────────────────┤
│  [인기순 ▾]  [아직 안 해본 것만]│  ChemSubFilter (정렬 + 칩)
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │  BundleCard             │   │  세로 리스트
│  │  · 카테고리 / 케미 뱃지 │   │
│  │  · 제목                 │   │
│  │  · 1:1 / 그룹 비교 뱃지 │   │
│  │  · 시작하기 (gradient) │   │
│  └─────────────────────────┘   │
│                                 │
│  (카드 N개)                    │
└─────────────────────────────────┘
```

탭 진입 시 별도 헤더 카피는 넣지 않는다 — 탭 라벨 "가치관 비교"가 이미 맥락을 전달한다. 필터바는 `TopSubFilter`와 동일한 위치·높이로 시각 연속성을 유지한다.

### 탭 순서 및 URL

- 순서: **NEW → TOP → 가치관 비교 → MY** (카테고리 구분자는 그 뒤)
- URL 값: `/?filter=chem` (짧은 영문, URL 관례)
- 내부 타입명: `FilterTabType`에 `'chem'` 추가
- 라벨: "가치관 비교" (기존 MY 서브탭·TOP 서브필터와 통일)
- 아이콘: **두 버전 준비** — `CompareGroupIcon` 안 / `HeartLinkIcon` 안 (최종 선택은 구현 시점에 육안 비교 후 결정)

### 사용 컴포넌트 (재사용)

| 컴포넌트                 | 경로                                                                      | 변경 여부                                                   |
| ------------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `ContentTabs`            | `src/components/features/Main/ContentTabs/ContentTabs.tsx`                | 확장 (탭 추가, 아이콘 매핑)                                 |
| `BundleCard`             | `src/components/features/Main/BundleCard/BundleCard.tsx`                  | 확장 (`ctaLabel?: string` prop 추가 — 탭 맥락별 오버라이드) |
| `CardList`               | `src/components/features/Main/CardList/CardList.tsx`                      | 확장 (BUNDLE 전용 리스트 렌더)                              |
| `MainViewClient`         | `src/components/features/Main/MainViewClient.tsx`                         | 분기 추가 (`isChemTab`)                                     |
| `TopSubFilter`           | `src/components/features/Main/TopSubFilter/TopSubFilter.tsx`              | 축소 (케미 토글 제거)                                       |
| `useBundleList`          | `src/hooks/api/useBundle.ts`                                              | 그대로 — 활성 조건에 `isChemTab` OR 추가                    |
| `BundleRecommendSection` | `src/components/common/BundleRecommendSection/BundleRecommendSection.tsx` | 확장 (하단 앵커 추가)                                       |

### 신규 컴포넌트

#### `ChemSubFilter`

가치관 비교 탭 진입 시 상단에 노출되는 필터바. `TopSubFilter`와 분리한다 — 역할·props가 다르고, TopSubFilter의 정리 범위가 명확해야 하기 때문.

- 경로: `src/components/features/Main/ChemSubFilter/ChemSubFilter.tsx`
- props:
  - `selectedSort: ChemSort` — `'popular' | 'latest'`
  - `onSortChange: (sort: ChemSort) => void`
  - `excludeParticipated: boolean`
  - `onExcludeParticipatedChange: (value: boolean) => void`
- 구성:
  - 좌측: 정렬 드롭다운 ("인기순" / "최신순")
  - 우측: 칩 형태 토글 "아직 안 해본 것만" (활성 시 `$primary-gradient` 테두리)
- 기본값: `selectedSort = 'popular'`, `excludeParticipated = false`

#### 접근성 명세

**토글 칩 (`excludeParticipated`)**:

- `role="switch"` + `aria-checked={excludeParticipated}` 필수
- 색상 이외의 이중 시그널: 활성 시 텍스트 굵기 `font-weight: 600` + 텍스트 앞에 체크 아이콘(`CheckIcon`) 표시
- 터치 타겟: 최소 `min-height: 44px`, `min-width: 44px` 확보 (칩 시각 크기와 별개로 패딩 포함 영역 보장)
- 키보드: Space/Enter로 토글

**정렬 드롭다운**:

- 트리거 버튼: `aria-haspopup="listbox"` + `aria-expanded={isOpen}`
- 리스트: `role="listbox"`, 각 옵션 `role="option"` + `aria-selected`
- 열림 시 포커스 → 현재 선택된 옵션으로 이동 (없으면 첫 옵션)
- 옵션 선택 또는 Escape → 트리거 버튼으로 포커스 복귀 (포커스 트랩)
- 키보드: ↑/↓ 옵션 이동, Enter 선택, Escape 닫기

#### 상수 / 타입 추가 (`src/constants/contentTab.ts`)

```ts
// FilterTabType에 'chem' 추가
export type FilterTabType = 'new' | 'top' | 'chem' | 'my';

export const FILTER_TABS: FilterTabItem[] = [
  { type: 'new', label: 'NEW' },
  { type: 'top', label: 'TOP' },
  { type: 'chem', label: '가치관 비교' },
  { type: 'my', label: 'MY' },
];

// 정렬 타입 신설
export type ChemSort = 'popular' | 'latest';

export const CHEM_SORTS: Array<{ value: ChemSort; label: string }> = [
  { value: 'popular', label: '인기순' },
  { value: 'latest', label: '최신순' },
];

export const DEFAULT_CHEM_SORT: ChemSort = 'popular';

// TopContentType, TOP_CONTENT_TYPES, DEFAULT_TOP_CONTENT_TYPE 삭제
```

### MainViewClient 분기 로직

```ts
const isChemTab = selectedTab.kind === 'filter' && selectedTab.type === 'chem';
const { data: bundleListData } = useBundleList(isNewTab || isChemTab);

// 가치관 비교 탭 상태
const [chemSort, setChemSort] = useState<ChemSort>(DEFAULT_CHEM_SORT);
const [chemExcludeParticipated, setChemExcludeParticipated] = useState(false);

const chemCards = useMemo(() => {
  if (!isChemTab) return [];
  let result = [...bundleCards];
  if (chemExcludeParticipated) {
    result = result.filter((b) => !b.participated);
  }
  if (chemSort === 'popular') {
    result.sort((a, b) => b.totalVoteCount - a.totalVoteCount);
  } else {
    // latest — BE에서 createdAt 정렬이 없으면 slug 역순 등 임시 규칙 필요
    // TODO: BE에 번들 최신순 정렬 지원 요청
  }
  return result.map((data): CardModel => ({ type: 'BUNDLE', data }));
}, [bundleCards, isChemTab, chemSort, chemExcludeParticipated]);
```

**CSR 한정**: 홈 `page.tsx`의 SSR prefetch 대상(`displayQueries.main`)은 그대로 유지한다. 가치관 비교 탭은 prefetch 대상에 포함하지 않으며, 탭 진입 시점에 `useBundleList`가 활성화되어 스켈레톤 → 리스트 흐름이 발생한다.

**공유 링크 콜드 진입 경험**: `/?filter=chem` 링크를 외부에서 공유받은 유저는 첫 화면에서 스켈레톤만 보게 된다. 이 경험이 "어디에 왔는지" 맥락을 잃지 않도록, 탭 라벨 "가치관 비교"가 `ContentTabs`에서 상단에 항상 선(先)렌더링되는 것에 의존한다(추가 헤더 카피는 불필요). 응답 지연이 3초를 초과하면 에러 상태와 동일하게 처리하여 "다시 시도" 액션을 노출한다.

### 상태별 UI

| 상태              | 화면                        | 문구                                                          | 다음 액션                                   |
| ----------------- | --------------------------- | ------------------------------------------------------------- | ------------------------------------------- |
| 로딩              | `BundleCard` 스켈레톤 3-4개 | —                                                             | —                                           |
| 엠프티 (번들 0개) | 아이콘 + 문구 + 버튼        | "아직 준비 중인 가치관 비교예요.\n곧 새 테스트가 올라옵니다." | "지금 투표 보러가기" → `/?filter=new`       |
| 엠프티 (필터 0개) | 아이콘 + 문구 + 버튼        | "이제 안 해본 테스트가 없어요.\n새로 올라오면 알려드릴게요."  | "전체 보기" → `excludeParticipated = false` |
| 에러              | 아이콘 + 문구 + 버튼        | "목록을 불러오지 못했어요."                                   | "다시 시도" → `refetch`                     |

엠프티·에러 문구의 시각 패턴은 기존 `CardList`의 빈 상태 처리와 일관성을 유지한다.

### 결과 페이지 앵커 추가

- 대상: `BundleRecommendSection` 하단 (즉 `CompareResult` / `GroupResult` 양쪽에 자동 반영)
- 내용: **"전체 가치관 비교 보기 →"** 링크 1줄, 우측 정렬
- 링크: `/?filter=chem`
- 조건: 섹션 자체가 렌더링되는 경우에만 (`BundleRecommendSection`이 null 반환 시 앵커도 미표시)
- **네비게이션**: `next/link` 기본 동작(= `router.push`)을 사용한다. 이유: 허브 탭에서 뒤로가기 시 결과 페이지로 복귀하는 흐름이 자연스럽다. `SmartBackButton` (커밋 `ea50d6d`에서 공용화된 referrer 기반 fallback)은 `/?filter=chem`에서 뒤로가기 시 결과 페이지로 복귀시키므로, 결과 → 허브 → 상세 → 플레이 → 결과 루프가 형성되어도 뒤로가기 1회로 직전 화면 복귀가 가능하다.
- 토큰:
  - 텍스트: `$text-secondary` (#d1d1d1)
  - font-size: `$font-size-14`
  - 간격: 카드 리스트와 12px gap
- **터치 타겟**: 앵커 컨테이너에 `min-height: 44px` + `display: flex; align-items: center; justify-content: flex-end` 명시. 텍스트 좌측 패딩 `$spacing-*`로 실제 탭 영역을 44px 이상 확보.

### 카피 (유저 언어)

| 위치                      | 카피                                                                                                            |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 탭 라벨                   | 가치관 비교                                                                                                     |
| 정렬                      | 인기순 / 최신순 (기본: 인기순)                                                                                  |
| 토글                      | 아직 안 해본 것만 (기본: OFF)                                                                                   |
| 카드 CTA (NEW 탭)         | 시작하기 (기존 `BundleCard` 기본값)                                                                             |
| 카드 CTA (가치관 비교 탭) | **자세히 보기** — `ctaLabel` prop으로 오버라이드. 탐색 맥락에서 "시작하기"는 확정 이전의 훑어보기 심리와 어긋남 |
| 엠프티 (번들 0개)         | "아직 준비 중인 가치관 비교예요. 곧 새 테스트가 올라옵니다." / "지금 투표 보러가기"                             |
| 엠프티 (필터 0개)         | "이제 안 해본 테스트가 없어요. 새로 올라오면 알려드릴게요." / "전체 보기"                                       |
| 에러                      | "목록을 불러오지 못했어요." / "다시 시도"                                                                       |
| 결과 페이지 앵커          | "전체 가치관 비교 보기 →"                                                                                       |

### 토큰 사용 내역

- 컬러: `$bg-primary` (#121212), `$bg-secondary` (#1e1e1e), `$bg-tertiary` (#2c2c2c), `$text-secondary` (#d1d1d1), `$text-tertiary` (#8a8a8a), `$primary-gradient`
- 타이포: `$font-size-14`, `$font-size-16`, `$font-size-18`
- 간격: `$spacing-*` (기존 `TopSubFilter` 패턴 그대로)
- radius: `$border-radius-md`
- 다크 모드 규칙: `CLAUDE.md` 섹션 준수 (입력·버튼·팝업 배경 규칙)

### 상호작용

| 동작                        | 응답                                                                                                                                                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 탭 "가치관 비교" 클릭       | `router.replace('/?filter=chem')` + 스크롤 탑                                                                                                                                                                    |
| 정렬 드롭다운 선택          | `chemSort` 업데이트, 리스트 재정렬 (네트워크 호출 없음)                                                                                                                                                          |
| 토글 "아직 안 해본 것만" 탭 | `chemExcludeParticipated` 토글, 리스트 재필터                                                                                                                                                                    |
| 카드 탭                     | `/bundle/{slug}` 이동 (기존 `BundleCard` 동작 유지)                                                                                                                                                              |
| 스크롤                      | 일반 세로 스크롤 (무한 스크롤 아님 — `useBundleList`는 전체 목록 1회 반환)                                                                                                                                       |
| 탭 이탈 (다른 탭 선택)      | `chemSort`, `chemExcludeParticipated` 둘 다 컴포넌트 state로 보존 → 재진입 시 복원 (기존 `topPeriod` 보존 패턴과 일치). 단 페이지 새로고침 시에는 기본값으로 초기화 (URL 파라미터화하지 않음 — URL 오염 최소화). |

## 회귀 영향 상세

### 제거

| 대상                                                                                    | 이유                       | 파일                                                         |
| --------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------ |
| `TopContentType` 타입, `TOP_CONTENT_TYPES` 상수, `DEFAULT_TOP_CONTENT_TYPE`             | 가치관 비교 탭이 역할 흡수 | `src/constants/contentTab.ts`                                |
| `topContentType` state, `isTopBundleMode`, `topBundleCards` useMemo, TOP 케미 렌더 분기 | 동 상기                    | `src/components/features/Main/MainViewClient.tsx`            |
| `selectedContentType`, `onContentTypeChange` props                                      | 동 상기                    | `src/components/features/Main/TopSubFilter/TopSubFilter.tsx` |

### 변경

| 대상                           | 변경 내용                                                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `FilterTabType`                | `'chem'` 추가                                                                                                                               |
| `FILTER_TABS`                  | `'chem'` 항목 3번째 삽입                                                                                                                    |
| `TAB_ICONS` (ContentTabs 내부) | `chem` 키에 `CompareGroupIcon` 또는 `HeartLinkIcon` 매핑 (두 안 준비)                                                                       |
| `parseTabFromQuery`            | `'chem'`을 `FILTER_TAB_TYPES`에 포함                                                                                                        |
| `MY_SUB_TABS` 'compare' 라벨   | "가치관 비교" → **"내 테스트"** (상·하위 탭 라벨에서 '비교' 단어 완전 분리 — "가치관 비교(탐색) / 내 테스트(기록)"로 역할 대비가 즉시 명확) |
| `BundleRecommendSection`       | 하단 앵커 1줄 추가                                                                                                                          |

### 유지

- NEW 탭의 6:1 번들 삽입 (`mergeBundlesIntoFeed`) — 흐름 속 조우 경험 유지
- 기존 URL 북마크 (`/?filter=new|top|my`, `/?category=...`) 전부 호환
- 홈 `page.tsx`의 JSON-LD 구조화 데이터 및 `displayQueries.main` prefetch
- `BundleCard` 자체 디자인 ([2026-04-11 스펙](./2026-04-11-bundle-main-feed-design.md))
- `useBundleList` 훅 시그니처

### 리스크

- 기존 TOP 탭에서 케미 랭킹을 보던 유저는 재학습 필요. 다만 탭명이 "가치관 비교"로 더 명시적이라 학습 비용 < 발견성 이득으로 판단.
- MY 탭이 3번째 → 4번째로 이동. 북마크는 URL 기반이라 영향 없음. 위치 학습은 재적응 필요.
- MY 서브탭 라벨 변경("가치관 비교" → "내 테스트")으로 기존 유저에게 1회성 혼란 발생 가능. 상·하위 탭 라벨에서 '비교' 중복을 완전히 제거하는 이득이 더 큼.
- **NEW 탭의 6:1 번들 삽입과 동일 번들 풀 중복 노출**: 가치관 비교 탭 유저는 NEW에서 이미 본 번들을 다시 보게 될 수 있다. 의도된 설계(탐색 허브는 풀 카탈로그 제공이 본질)이나, 피로감 완화 장치로 `BundleCard`의 `participated === true`일 때 "참여 완료" 뱃지를 상시 노출하여 유저가 "이미 봤다"는 신호를 시각적으로 받도록 한다(구현 시 `BundleCard`에 뱃지 표시 로직이 있는지 확인 필요).

## 결정 근거 (Why)

| 결정                                                | 근거                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 탭명 "가치관 비교" (케미 아님)                      | 기존 MY 서브탭·TOP 서브필터 라벨과 통일. "케미"는 짧고 바이럴 친화이나 서비스 전반 라벨 혼재를 해소하는 것이 우선.                                                                                                                                   |
| 탭 위치 TOP 뒤 3번째                                | "NEW(신선) → TOP(인기) → 가치관 비교(번들) → MY(개인)" 흐름이 자연스럽다. NEW의 기본 탭 지위를 흐리지 않으면서 번들 발견성을 확보.                                                                                                                   |
| CSR 한정 (SSR prefetch 미포함)                      | Q1 목표는 prefetch 없이도 충족 가능. 이 탭만 CSR로 두고 홈 전체 SSR 전환은 별도 의사결정 영역으로 분리 — 스펙 범위 최소화.                                                                                                                           |
| MY 서브탭 라벨 "내 테스트"로 변경                   | 상·하위 탭 라벨에서 '비교' 단어 중복을 완전히 제거. "가치관 비교(탐색) / 내 테스트(기록)" 대비로 역할 구분이 즉시 명확. "참여한 비교"는 '비교'가 남아 절반의 해결에 그침.                                                                            |
| 카드 CTA 탭별 분기 ("시작하기" / "자세히 보기")     | Q1 목표 "고른다" 행위가 탐색 맥락이므로, 가치관 비교 탭에서는 **"자세히 보기"** 로 오버라이드하여 훑어보기 심리와 정합. NEW 탭에서는 흐름 속 조우라 "시작하기"가 자연스러워 기본값 유지. `BundleCard`에 `ctaLabel?: string` prop 추가로 맥락별 분기. |
| `ChemSubFilter` 신규 분리 (TopSubFilter 확장 안 함) | 역할·props가 달라 공유 이득보다 혼선 비용이 큼. TopSubFilter의 축소 범위도 명확해야 함.                                                                                                                                                              |
| 무한 스크롤 미적용                                  | `useBundleList`가 전체 목록을 1회에 반환하는 기존 구조. 번들 수가 수십 개로 커지기 전에는 불필요.                                                                                                                                                    |

## 향후 확장 (옵션)

- **그룹 유지형 브릿지 (방향 d)**: 그룹 결과 CTA에 "이 멤버 그대로 다른 테스트" 추가 — BE에 그룹 재사용 스펙 선행 필요. k-factor 최대 장치로 별도 스펙화 예정.
- **카테고리 필터**: 번들 카테고리별 필터 칩 추가 (연애/결혼/돈/친구 등). 번들 수가 10개 이상 쌓이면 도입.
- **검색**: 탭 상단 검색 바. 번들 수가 20개 이상이면 필수.
- **최신순 정렬 BE 지원**: 현재 `BundleSummaryResponse`에 `createdAt` 없음 — 최신순 활성화 시 BE 정렬 지원 요청 문서(`docs/api/bundle-sort-request.md`) 갱신.
- **단축 URL `/bundles`**: `next.config.js` rewrites로 `/bundles → /?filter=chem` 매핑. 외부 마케팅·공유 목적에 활용.
- **완료율·진행률 뱃지**: 카드에 "247명 / 평균 4.2문항 완료" 같은 사회적 증거 노출.
