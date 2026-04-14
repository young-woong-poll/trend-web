# 번들 추천 섹션 디자인

결과 페이지 하단에 다른 번들 테스트를 추천하여 사용자 체류 시간과 번들 완료율을 높인다.

## 배경

현재 1:1 비교 결과, 그룹 결과 페이지는 결과 확인 후 갈 곳이 CTA 2개뿐이다. 유튜브의 "다음 영상 추천"처럼 결과 만족감이 높은 순간에 다음 콘텐츠를 제안하면 자연스러운 순환이 생긴다.

## 적용 범위

| 페이지                          | 적용 여부 | 이유                             |
| ------------------------------- | --------- | -------------------------------- |
| 1:1 비교 결과 (`CompareResult`) | O         | 결과 확인 후 다음 콘텐츠 유도    |
| 그룹 결과 (`GroupResult`)       | O         | 결과 확인 후 다음 콘텐츠 유도    |
| 번들 결과 (`BundleResult`)      | X         | 1:1/그룹 비교로 유도하는 게 우선 |

## 추천 로직

### 필터링 + 셔플 방식

1. `useBundleList()` 훅으로 전체 번들 목록 조회
2. **제외**: 현재 보고 있는 번들 (`currentSlug`과 일치하는 항목)
3. **제외**: 이미 완료한 번들 (`participated === true`)
4. **제외**: 마감된 번들 (`status === 'CLOSED'`)
5. **셔플**: 남은 목록을 랜덤으로 섞음
6. **슬라이스**: 앞에서 3개만 추출
7. 결과가 0개이거나 로딩 중이면 섹션 자체를 렌더링하지 않음

### 셔플 구현

```typescript
// Fisher-Yates 셔플
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
```

### 향후 확장

번들이 많아지면 셔플 전에 가중치를 추가할 수 있다 (신규 번들 우대, 카테고리 다양성 등). 현재 단계에서는 필터링 + 셔플로 충분하다.

## UI 디자인

### 섹션 헤더

- 텍스트: **"이런 테스트는 어때요?"**
- 기존 `SingleRecommendSection`("이런 투표는 어때요?")과 톤 일치

### 카드 형태: 리스트형 + 왼쪽 컬러 바

각 카드는 다음 요소로 구성:

- **왼쪽 컬러 바**: 카테고리 테마 색상의 `border-left` (3px)
- **카테고리 뱃지**: 카테고리명, 배경색은 카테고리 색상 15% 투명도
- **문항 수**: 뱃지 옆에 보조 텍스트
- **제목**: 번들 제목 (14px, bold, white)
- **참여수**: "N명 참여" (12px, text-tertiary)
- **셰브론**: 오른쪽 끝에 `›` 화살표

### 카드 인터랙션

- 카드 전체가 클릭 영역 → `/bundle/{slug}` 페이지로 이동

### 배치 위치

- 결과 페이지 컨텐츠 최하단, floating CTA 위에 위치
- `CompareResult`: `PopularityCompare` 섹션 아래
- `GroupResult`: 마지막 콘텐츠 섹션 아래 (성별 콘텐츠 또는 `PopularitySpectrum` 아래)

## 컴포넌트 구조

### `BundleRecommendSection`

공통 컴포넌트로 1:1 결과와 그룹 결과에서 동일하게 사용한다.

```
src/components/common/BundleRecommendSection/
├── BundleRecommendSection.tsx
└── BundleRecommendSection.module.scss
```

### Props

```typescript
interface BundleRecommendSectionProps {
  currentSlug: string; // 현재 보고 있는 번들 slug (제외용)
}
```

### 내부 동작

1. `useBundleList(true)`로 번들 목록 fetch
2. `cardMapper.toBundleCardModelFromSummary()`로 UI 모델 변환
3. `useMemo`로 필터 → 셔플 → 3개 슬라이스
4. 셔플은 컴포넌트 마운트 시 1회만 실행 (매 렌더마다 바뀌지 않도록)
5. 추천 번들이 0개이면 `null` 반환

## 스타일 가이드

프로젝트 다크 테마 규칙을 따른다.

| 요소               | 값                                                    |
| ------------------ | ----------------------------------------------------- |
| 섹션 배경          | 없음 (투명)                                           |
| 카드 배경          | `rgba(#fff, 0.03)`                                    |
| 카드 테두리        | `1px solid rgba(#fff, 0.06)`                          |
| 카드 왼쪽 컬러 바  | 카테고리 테마 색상, 3px                               |
| 카드 border-radius | `$border-radius-md`                                   |
| 제목 색상          | `$white`                                              |
| 메타 텍스트        | `$text-tertiary`                                      |
| 뱃지 배경          | 카테고리 색상 15% 투명도                              |
| 뱃지 텍스트        | 카테고리 색상                                         |
| 섹션 헤더          | `$text-tertiary`, 12px, uppercase, letter-spacing 2px |

## 데이터 흐름

```
결과 페이지
  └─ useBundleList() → BundleSummaryResponse[]
       └─ toBundleCardModelFromSummary() → BundleCardModel[]
            └─ BundleRecommendSection
                 ├─ filter(slug !== currentSlug && !participated && status !== CLOSED)
                 ├─ shuffle()
                 ├─ slice(0, 3)
                 └─ render 3 cards (or null if empty)
```
