# 메인 피드 번들(케미) 진입점 추가

## 배경

메인 페이지에 번들(케미) 핫픽의 진입점이 없다. 번들은 유저가 유저를 데려오는 구조(1:1 비교, 그룹 비교)로 k-factor를 높이는 바이럴의 핵심이므로, 메인 피드에서 자연스럽게 노출되어야 한다.

현재 `GET /v1/display/main`은 SINGLE 타입만 반환하며, 번들 데이터는 `GET /v1/bundles`를 별도 호출해야 한다.

## 범위

1. **NEW 탭**: 싱글 핫픽 사이에 번들 카드를 규칙적으로 삽입
2. **TOP 탭**: "케미" 유형 필터 추가 (번들끼리의 참여자 수 랭킹)
3. **BundleCard 리디자인**: 이미지 제거, 1:1 비교 / 그룹 비교 어필
4. **deprecated 코드 정리**: display/main 응답에서 번들을 처리하던 죽은 코드 제거
5. **BE 요청 문서**: `GET /v1/bundles?sort=popular` 지원 요청

MY 탭은 기존 "케미" 서브탭이 이미 존재하므로 변경 없음.

---

## 1. 데이터 레이어

### 1-1. useBundleList 훅 추가

`src/hooks/api/useBundle.ts`에 추가:

- `bundleKeys.list` → `['bundle', 'list']`
- `bundleQueries.list` → `queryOptions`로 `GET /v1/bundles` (필터 없이) 호출
- `useBundleList(enabled: boolean)` → `useQuery` 래핑

반환 타입: `BundleDetail[]` (기존 `BundleSummaryResponse`의 FE alias)

### 1-2. toBundleCardModelFromSummary() 매퍼

`src/lib/mappers/cardMapper.ts`에 추가.

`BundleSummaryResponse` (또는 FE alias `BundleDetail`) → `BundleCardModel` 변환:

| BundleSummaryResponse | BundleCardModel                        |
| --------------------- | -------------------------------------- |
| `slug`                | `slug`                                 |
| `title`               | `title`                                |
| `subtitle`            | `subtitle`                             |
| `category`            | `categories[0]`                        |
| `categoryCode`        | `categoryCode` (CategoryCode로 캐스팅) |
| `participantCount`    | `totalVoteCount`                       |
| `questionCount`       | `electionCount`                        |
| `imageUrl`            | `imageUrls[0]` (optional)              |
| `status: 'ACTIVE'`    | `status: 'OPEN'`                       |
| `status: 'CLOSED'`    | `status: 'CLOSED'`                     |
| `completed`           | `participated`                         |

### 1-3. deprecated 코드 제거

- `cardMapper.ts`의 `toBundleCardModel()` 함수 삭제 (HotpickCardResponse 기반, 사용처 없음)
- `toCardModel()` 내부의 `type === 'BUNDLE'` 분기 삭제 — 항상 SINGLE 반환
- `CardModel` 유니온 타입 자체는 유지 (머지 함수에서 BUNDLE 카드를 직접 생성)

---

## 2. 피드 머지 로직

### 2-1. mergeBundlesIntoFeed()

`src/lib/mergeFeed.ts` 신규 파일.

```
mergeBundlesIntoFeed(singles: CardModel[], bundles: BundleCardModel[]): CardModel[]
```

순수 함수. 입력 배열을 변경하지 않음.

**배치 규칙:**

- 첫 번째 번들: index 1 (2번째 위치) — 모바일에서 첫 화면에 반드시 노출
- 이후 번들: 싱글 6개 간격 (index 1, 8, 15, 22, ...)
- 번들이 부족하면 있는 만큼만 삽입
- 남는 번들은 무시

첫 페이지(싱글 18개) 기준 배치 예시:

```
[싱글1, 케미1, 싱글2, 싱글3, 싱글4, 싱글5, 싱글6, 싱글7, 케미2, 싱글8, ..., 싱글13, 싱글14, 케미3, 싱글15, ...]
```

### 2-2. MainViewClient 적용

- NEW 탭(`isNewTab`)일 때만 `useBundleList(enabled: isNewTab)` 호출
- `useMemo`에서 `mergeBundlesIntoFeed(cards, bundleCards)`로 최종 배열 생성
- 다른 탭에서는 기존 `cards` 배열을 그대로 사용
- 번들 로딩 실패 시 싱글 피드만 정상 표시 (graceful degradation)

---

## 3. TOP 탭 — "케미" 유형 필터

### 3-1. 유형 필터 추가

`TopSubFilter` 컴포넌트에 유형 선택 UI 추가:

| 유형        | 값         | 설명      |
| ----------- | ---------- | --------- |
| 핫픽 (기본) | `'single'` | 기존 동작 |
| 케미        | `'bundle'` | 번들 랭킹 |

`contentTab.ts`에 타입 추가:

```ts
type TopContentType = 'single' | 'bundle';
```

### 3-2. 케미 선택 시 동작

- `MainViewClient`에 `topContentType` 상태 추가
- `topContentType === 'bundle'`이면:
  - `useBundleList()`로 전체 번들 목록을 가져옴
  - FE에서 `participantCount` 내림차순 정렬
  - `CardModel[]` (type: 'BUNDLE')로 변환하여 `TopRankingList`에 전달
  - 기간/카테고리 필터 숨김 (BE 미지원)
- `topContentType === 'single'`이면:
  - 기존 동작 그대로

### 3-3. TopRankingList 링크 분기

현재 모든 카드에 `/hotpick/${slug}` 링크를 걸고 있음. BUNDLE 카드일 때 `/bundle/${slug}`로 분기 필요:

```ts
function getHref(card: CardModel): string {
  return card.type === 'BUNDLE' ? `/bundle/${card.data.slug}` : `/hotpick/${card.data.slug}`;
}
```

`FirstPlaceCard`, podiumCards, listCards의 `Link href`를 이 헬퍼로 교체.

---

## 4. BundleCard 리디자인

### 4-1. 레이아웃

```
┌──────────────────────────────┐
│ 연애 · 케미               [공유] │  카테고리 + 공유
│                                   │
│ 연애 가치관 테스트                 │  제목 (bold)
│ 우리 연애 스타일 얼마나 통할까?    │  subtitle
│                                   │
│ 5개 질문 · 247명 참여             │  메타
│                                   │
│ ┌─────────────┐ ┌─────────────┐  │
│ │  1:1 비교   │ │  그룹 비교  │  │  비교 어필 뱃지
│ └─────────────┘ └─────────────┘  │
│                                   │
│         [ 시작하기 > ]            │  CTA (gradient)
│                                   │
│ D-3                               │  마감 뱃지 (있을 때만)
└──────────────────────────────┘
```

### 4-2. 변경 포인트

| 항목          | 기존                            | 변경                                   |
| ------------- | ------------------------------- | -------------------------------------- |
| 이미지        | 썸네일 필수, `titleLogo`로 표시 | 제거 (이미지 관련 JSX/스타일 삭제)     |
| 비교 어필     | 없음                            | "1:1 비교" / "그룹 비교" 뱃지 2개 추가 |
| CTA 버튼      | `$bg-tertiary` 배경             | `$primary-gradient` 배경               |
| 상단 악센트   | 카테고리 테마색 border          | 유지                                   |
| electionCount | 제목 옆 "N개 질문" 뱃지         | 메타 영역으로 이동                     |
| 뱃지 라벨     | "번들"                          | "케미"                                 |

### 4-3. 스타일 (다크 테마 규칙 준수)

| 요소             | 값                                   |
| ---------------- | ------------------------------------ |
| 카드 배경        | `$bg-secondary` (#1e1e1e)            |
| 비교 뱃지 배경   | `$bg-tertiary` (#2c2c2c)             |
| 비교 뱃지 테두리 | 1px solid #3a3a3a                    |
| CTA 버튼         | `$primary-gradient`, 텍스트 `$white` |
| 제목             | `$white`                             |
| subtitle         | `$text-secondary` (#d1d1d1)          |
| 메타 텍스트      | `$text-tertiary` (#8a8a8a)           |
| 카테고리 태그    | `$text-tertiary`                     |

### 4-4. BundleCardModel 타입

변경 없음. `imageUrls` 필드는 optional로 유지 (BE 응답에 존재할 수 있으나 렌더링하지 않음).

---

## 5. BE 요청 문서

`docs/api/bundle-sort-request.md` 작성.

내용: `GET /v1/bundles`에 `sort=popular` 파라미터 추가 요청.

- 현재: FE에서 `participantCount` 기준 클라이언트 정렬
- 목표: BE에서 인기순 정렬하여 반환
- 이유: 번들 수가 늘어나면 클라이언트 정렬이 비효율적

---

## 영향 범위

### 수정 파일

- `src/hooks/api/useBundle.ts` — `useBundleList` 훅 추가
- `src/lib/mappers/cardMapper.ts` — `toBundleCardModelFromSummary()` 추가, `toBundleCardModel()` 제거, `toCardModel()` 단순화
- `src/lib/mergeFeed.ts` — 신규 파일
- `src/components/features/Main/MainViewClient.tsx` — 번들 데이터 호출 + 머지 로직
- `src/components/features/Main/BundleCard/BundleCard.tsx` — 리디자인
- `src/components/features/Main/BundleCard/BundleCard.module.scss` — 스타일 변경
- `src/components/features/Main/TopSubFilter/TopSubFilter.tsx` — 유형 필터 추가
- `src/components/features/Main/TopRankingList/TopRankingList.tsx` — 링크 분기
- `src/constants/contentTab.ts` — `TopContentType` 타입 추가

### 신규 파일

- `src/lib/mergeFeed.ts`
- `docs/api/bundle-sort-request.md`

### 변경 없는 파일

- `src/app/page.tsx` — SSR prefetch 추가하지 않음 (향후 고려)
- `src/types/card.ts` — `CardModel` 유니온, `BundleCardModel` 모두 유지
- `src/hooks/api/useMyBundles.ts` — MY 탭 기존 동작 유지
- 번들 상세 페이지 관련 파일 전체 — 변경 없음
