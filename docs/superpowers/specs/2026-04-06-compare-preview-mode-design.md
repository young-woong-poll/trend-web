# 1:1 비교 프리뷰 모드 설계

- **날짜**: 2026-04-06
- **상태**: 설계 완료
- **범위**: 1:1 비교 링크 생성 후 프리뷰 결과 페이지로 바로 이동, 공유 전환율 개선

---

## 배경

현재 1:1 비교 링크 생성 시 모달에서 링크를 복사하기만 노출한다. 유저가 실제로 상대에게 링크를 전달하는 전환율이 낮을 것으로 예상된다.

**핵심 아이디어:** 링크 생성 후 가상 상대("???")와의 비교 결과를 미리 보여줌으로써 "상대방이 들어오면 이런 결과가 나오겠구나"를 시각적으로 경험하게 하고, 공유 동기를 자극한다. 그룹 비교의 프리뷰 모드(가상 멤버 3명)와 동일한 전략.

---

## 플로우 변경

### 현재

```
"다른 친구랑 비교하기" 클릭
  → CreateCompareLink 모달 (자동 링크 생성)
  → 사용자가 링크 복사
  → 모달 닫기
```

### 변경

```
"다른 친구랑 비교하기" 클릭
  → 링크 자동 생성 (백그라운드)
  → /compare/match/{token} 으로 바로 이동
  → 프리뷰 모드: "???"와의 가상 비교 결과 + "초대 링크 복사하기" CTA
```

모달 단계를 생략하고 바로 결과 페이지로 이동한다. 버튼 클릭 자체가 의사 표현이므로 추가 확인은 불필요한 마찰.

---

## CompareLanding 변경

### isCreatorWaiting 상태 리다이렉트

생성자가 `/compare/{token}`에 진입했을 때 (상대방 미참여 상태):

- **현재**: 봉투 대기 화면 (초대장 UI + "링크 다시 복사하기")
- **변경**: `/compare/match/{token}`으로 리다이렉트

이렇게 하면 생성자가 어떤 경로로 들어와도 항상 프리뷰 결과 페이지를 보게 된다.

---

## CompareResult 프리뷰 모드

### 프리뷰 판별 로직

```
CompareResult 진입
  ├─ useCompareResult(token) → 결과 있음 → 실제 결과 렌더링 (기존과 동일)
  └─ useCompareResult(token) → 결과 없음
       └─ useCompareLink(token) → isCreator?
            ├─ Yes → 프리뷰 모드
            └─ No → /compare/{token}으로 리다이렉트 (기존과 동일)
```

### 가상 상대 생성

| 항목   | 값                                         |
| ------ | ------------------------------------------ |
| 닉네임 | `???`                                      |
| 답변   | 내 답변 기반 시드 생성 (matchRate ~40~60%) |

내 답변은 `useCompareLink`의 `bundleSlug`로 `useBundleMyResult`를 호출하여 가져온다. 서버에 별도 프리뷰 API를 요청하지 않고 FE에서 가상 데이터를 생성한다.

**가상 답변 생성 로직:**

```typescript
function generateGhostAnswers(
  myAnswers: Array<{ electionId: string; selected: 'A' | 'B' }>,
  seed: number
): Array<{ electionId: string; selected: 'A' | 'B' }> {
  return myAnswers.map((a, i) => ({
    electionId: a.electionId,
    selected: (seed + i) % 3 === 0 ? a.selected : a.selected === 'A' ? 'B' : 'A',
  }));
}
```

내 답변의 일부를 뒤집어서 대략 40~60% matchRate가 나오도록 한다.

### 프리뷰 배너

GroupResult 프리뷰 배너와 동일한 패턴:

```
"가상 상대와의 미리보기예요.
 상대방이 참여하면 진짜 결과를 볼 수 있어요!"
```

### CTA 변경

| 상태      | 하단 CTA                                                           |
| --------- | ------------------------------------------------------------------ |
| 프리뷰    | "초대 링크 복사하기" (단일 버튼, `/compare/{token}` 클립보드 복사) |
| 실제 결과 | 기존 "다른 친구랑 비교하기" / "그룹 비교하기" (변경 없음)          |

### 프리뷰 → 실제 전환

수동 전환 방식. `staleTime: 0`이므로 재방문 시 `useCompareResult`가 refetch → 결과 있으면 자동으로 실제 결과 렌더링. polling이나 realtime 감지는 하지 않는다.

---

## CTA 버튼 → 직접 링크 생성 + 이동

### CreateCompareLink 모달 제거

기존 `CreateCompareLink` 모달은 열리자마자 자동으로 링크를 생성하는 구조. 모달을 제거하고 CTA 클릭 시 직접 링크 생성 + 이동으로 변경한다.

### 변경 대상 (CTA가 있는 3개 페이지)

**BundleResult.tsx:**

- 기존: `setShowCompareModal(true)` → CreateCompareLink 모달
- 변경: `handleCreateCompare()` → `useCreateCompareLink` 직접 호출 → `router.push(/compare/match/{token})`

**CompareResult.tsx:**

- 동일 패턴

**GroupResult.tsx:**

- 동일 패턴

### 에러 처리

```typescript
const handleCreateCompare = async () => {
  try {
    const result = await createCompareMutation.mutateAsync({ type: 'ONE_TO_ONE' });
    router.push(`/compare/match/${result.token}`);
  } catch {
    showToast('링크 생성에 실패했습니다');
  }
};
```

실패 시 toast만 표시, 이동하지 않음.

---

## 엣지 케이스

| 상황                                               | 처리                                                      |
| -------------------------------------------------- | --------------------------------------------------------- |
| 상대방 참여 완료 후 생성자 재방문                  | `staleTime: 0` refetch → result 있음 → 실제 결과 렌더링   |
| 비로그인 유저가 `/compare/match/{token}` 직접 접근 | 기존 로직 유지 — `/compare/{token}?login=true` 리다이렉트 |
| 비생성자가 결과 없는 상태로 접근                   | 기존 로직 유지 — `/compare/{token}` 리다이렉트            |
| 링크 생성 API 실패                                 | toast 표시, 이동하지 않음                                 |
| 내 번들 답변 조회 실패 (프리뷰 불가)               | 로딩 상태 유지, 데이터 도착 시 프리뷰 렌더링              |

---

## 변경 파일 목록

| 파일                                                                | 변경 내용                                                                                        |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/components/features/Compare/CompareResult/CompareResult.tsx`   | 프리뷰 모드 분기 추가, 가상 상대 생성, 배너, CTA 교체, `useCompareLink`/`useBundleMyResult` 추가 |
| `src/components/features/Compare/CompareLanding/CompareLanding.tsx` | `isCreatorWaiting` → `/compare/match/{token}` 리다이렉트                                         |
| `src/components/features/Bundle/BundleResult/BundleResult.tsx`      | CreateCompareLink 모달 → 직접 링크 생성 + `router.push`                                          |
| `src/components/features/Compare/GroupResult/GroupResult.tsx`       | CreateCompareLink 모달 → 직접 링크 생성 + `router.push`                                          |
| `src/hooks/api/useCompare.ts`                                       | (변경 없음 — 기존 `useCreateCompareLink`, `useCompareLink` 활용)                                 |
| `src/components/features/Bundle/BundleResult/CreateCompareLink.tsx` | 사용처 제거 후 파일 삭제 가능 (또는 유지)                                                        |

---

## BE API 영향

**없음.** 모든 변경은 FE에서 기존 API를 활용한 프리뷰 데이터 생성. 추가 API 불필요.
