# 1:1 비교 결과 페이지 참가자 접근 제어 설계

## 목적

`/compare/match/:token` 페이지에서 로그인된 비참가자(creator도 participant도 아닌 유저)가 1:1 비교 결과를 볼 수 없도록 차단하고, compare 랜딩 페이지로 리다이렉트하여 안내 문구를 표시한다.

## 배경

- 1:1 케미 비교 결과는 참가자 두 명(creator, participant)만 볼 수 있어야 한다.
- 비참가자가 match 페이지에 접근하는 케이스:
  - 초대 링크를 받았으나 다른 사람이 먼저 점유한 경우
  - 친구가 결과를 자랑하려고 match URL을 제3자에게 공유한 경우
- 클라이언트에서 두 케이스를 구분할 수 없으므로 (`isCreator: false`, `isParticipant: false`, `hasParticipant: true` 동일), 중립적인 안내 문구를 사용한다.
- 비로그인 유저의 접근 차단은 기존 AuthProvider의 `PROTECTED_ROUTES`에서 이미 처리 중.

## 구현 설계

### 1. CompareResult 접근 제어 강화

**파일:** `src/components/features/Compare/CompareResult/CompareResult.tsx`

기존 조건 (line 66-71):

```typescript
if (!isLoading && !result && isLoggedIn && link && !link.isCreator) {
  router.replace(`/compare/${token}`);
}
```

변경:

```typescript
if (!isLoading && isLoggedIn && link && !link.isCreator && !link.isParticipant) {
  router.replace(`/compare/${token}`);
}
```

변경 사항:

- `!result` 조건 제거 — result 유무와 관계없이 비참가자는 차단
- `!link.isParticipant` 조건 추가 — 참가자 여부 명시적 체크

접근 허용 조건: `isCreator === true` 또는 `isParticipant === true`

### 2. CompareLanding 안내 문구 수정

**파일:** `src/components/features/Compare/CompareLanding/CompareLanding.tsx`

기존 문구 (isAlreadyTaken 상태):

```
이 링크는 이미 다른 사람이 참여했어요
1:1 케미는 한 명만 참여할 수 있어요
```

변경:

```
이 링크는 이미 다른 사람이 참여했어요
1:1 케미 결과는 참가자만 확인할 수 있어요
```

## 변경 파일 목록

| 파일                                                                | 변경 유형 | 내용                          |
| ------------------------------------------------------------------- | --------- | ----------------------------- |
| `src/components/features/Compare/CompareResult/CompareResult.tsx`   | 수정      | 접근 제어 조건 강화           |
| `src/components/features/Compare/CompareLanding/CompareLanding.tsx` | 수정      | isAlreadyTaken 안내 문구 변경 |

## 동작 시나리오

| 유저 상태            | match 페이지 접근 시                         | 랜딩 페이지 표시         |
| -------------------- | -------------------------------------------- | ------------------------ |
| 비로그인             | AuthProvider RouteGuard → 랜딩 + 로그인 모달 | -                        |
| 로그인 + creator     | 결과 조회 허용 (프리뷰 모드 포함)            | -                        |
| 로그인 + participant | 결과 조회 허용                               | -                        |
| 로그인 + 비참가자    | 랜딩으로 리다이렉트                          | isAlreadyTaken 안내 표시 |
