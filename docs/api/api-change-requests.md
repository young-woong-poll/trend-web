# API 변경 요청서

> FE 닉네임 시스템 개편 및 그룹 비교(Phase 3) 도입에 따른 기존 API 변경사항 + 신규 필드 요청

---

## 1. 기존 API 변경

### 1-1. 닉네임 중복 허용 — `GET /api/v1/auth/nickname/check`

**현재 동작**: 닉네임 중복 시 `available: false` 반환, FE에서 가입/변경 차단

**변경 요청**: 중복 검증 제거 (항상 `available: true` 반환하거나, API 자체 폐기)

**변경 사유**:

- 그룹 비교 기능에서 멤버끼리 서로 알아볼 수 있으려면, 실명/애칭 같은 짧고 직관적인 닉네임이 필요
- 중복 불허 시 "웅일", "수진" 같은 흔한 이름을 사용할 수 없어 UX 저하
- 닉네임은 식별자가 아닌 표시용이므로 중복 허용해도 시스템에 영향 없음 (식별은 userId로)

**FE 대응 완료**: 가입/변경 시 중복 체크 API 호출 제거, FE 유효성 검사(길이, 허용 문자)만 수행

**영향 범위**:

- `POST /api/v1/auth/signup` — 서버 측 닉네임 중복 검증 있다면 제거
- `PATCH /api/v1/auth/me` (닉네임 변경) — 서버 측 중복 검증 있다면 제거
- `GET /api/v1/auth/nickname/check` — 폐기하거나 항상 `available: true` 반환

---

## 2. 신규 API / 필드 추가

### 2-1. 그룹 참여 시 displayName — `POST /api/v1/compare-links/{token}/join`

**현재 Request Body**: 없음 (빈 POST)

**변경 요청 — Request Body 추가**:

```json
{
  "displayName": "웅일" // optional, string, 최대 20자
}
```

| 필드          | 타입     | 필수 | 설명                                                     |
| ------------- | -------- | ---- | -------------------------------------------------------- |
| `displayName` | `string` | N    | 이 그룹에서 표시할 이름. 미입력 시 현재 회원 닉네임 사용 |

**동작**:

- `displayName`이 있으면 → 그룹 멤버 목록에 이 값을 `displayName`으로 저장
- `displayName`이 없으면 → 해당 유저의 현재 닉네임을 `displayName`으로 저장
- 1:1 비교(`ONE_TO_ONE` 타입) 시에는 `displayName` 무시 (기존대로)

---

### 2-2. 그룹 결과 응답에 displayName — `GET /api/v1/compare-links/{token}/group-result`

**현재 응답의 members 구조**:

```json
{
  "members": [
    {
      "userId": "user-1",
      "nickname": "용감한호랑이1234",
      ...
    }
  ]
}
```

**변경 요청 — members에 displayName 필드 추가**:

```json
{
  "members": [
    {
      "userId": "user-1",
      "nickname": "용감한호랑이1234",
      "displayName": "웅일",
      ...
    }
  ]
}
```

| 필드          | 타입     | 설명                                                    |
| ------------- | -------- | ------------------------------------------------------- |
| `displayName` | `string` | 그룹 참여 시 설정한 표시 이름. 없으면 `nickname`과 동일 |

**FE 표시 규칙**: `displayName`이 있으면 우선 사용, 없으면 `nickname` fallback

---

### 2-3. 프로필 색상 확장 — `PATCH /api/v1/auth/me`

**현재 동작**: `profileColor` 필드에 8개 색상명 중 하나를 저장 (`purple`, `blue`, `green`, `amber`, `red`, `pink`, `cyan`, `indigo`)

**변경 요청**: 허용 색상값을 24개로 확장

**추가되는 색상명 (16개)**: `magenta`, `sky`, `gold`, `teal`, `grape`, `sunset`, `ocean`, `lime`, `coral`, `lavender`, `mint`, `peach`, `sapphire`, `rose`, `forest`, `flame`

**변경 사유**:

- 그룹 비교(최대 10명+)에서 멤버를 아바타 색으로 구분하는데 8개로는 부족
- 프로필 색상 = 그룹 비교 아바타 색상으로 통합하여 일관성 확보

**영향 범위**:

- `PATCH /api/v1/auth/me` — `profileColor` 필드 validation에 16개 색상명 추가
- DB 변경 — `profileColor` 컬럼이 enum이라면 새 값 추가, varchar라면 변경 불필요

> 그라데이션은 FE에서만 렌더링하므로 BE는 색상명(string)만 저장/반환하면 됩니다.

**FE 대응 완료**: `profileColors.ts` 24개 확장, 그룹 비교 컴포넌트 9개 통합, ProfileColorModal 그리드 24개 대응

---

### 2-4. 번들 상세에 categoryCode 추가 — `GET /api/v1/bundles/{slug}`

**현재 응답**:

```json
{
  "slug": "love-values",
  "title": "연애 가치관 테스트",
  "category": "연애",
  ...
}
```

**변경 요청 — `categoryCode` 필드 추가**:

```json
{
  "slug": "love-values",
  "title": "연애 가치관 테스트",
  "category": "연애",
  "categoryCode": "LOVE",
  ...
}
```

| 필드           | 타입           | 필수 | 설명                                                 |
| -------------- | -------------- | ---- | ---------------------------------------------------- |
| `categoryCode` | `CategoryCode` | N    | 싱글 핫픽과 동일한 카테고리 코드 (LOVE, MARRIAGE 등) |

**변경 사유**:

- 그룹 비교 결과에서 성별 기반 섹션 (이성궁합 랭킹, 성별 대결)을 카테고리에 따라 조건부 표시
- `categoryCode`가 `'LOVE'` 또는 `'MARRIAGE'`인 번들에서만 해당 섹션을 노출
- 기존 `category` 필드는 한글 문자열이라 코드 비교에 부적합

**FE 대응 완료**: `BundleDetail` 타입에 `categoryCode` 추가, `GroupCompareResult`에 전달, `GENDER_CATEGORIES` 상수로 조건부 렌더링

---

### 2-5. 비교 링크 정보에 GROUP 전용 필드 — `GET /api/v1/compare-links/{token}`

**현재 응답**: 1:1 비교 전용 필드만 존재

**변경 요청 — GROUP 전용 필드 3개 추가**:

```json
{
  "token": "group-abc",
  "type": "GROUP",
  "groupName": "마케팅팀",
  "memberCount": 5,
  "isClosed": false,
  ...
}
```

| 필드          | 타입      | 설명                                            |
| ------------- | --------- | ----------------------------------------------- |
| `groupName`   | `string?` | 그룹 이름 (GROUP 전용, ONE_TO_ONE은 null)       |
| `memberCount` | `number`  | 현재 참여 멤버 수 (GROUP 전용, ONE_TO_ONE은 0)  |
| `isClosed`    | `boolean` | 그룹 마감 여부 (GROUP 전용, ONE_TO_ONE은 false) |

**변경 사유**:

- 그룹 링크 랜딩 페이지에서 그룹 상태 표시 (이름, 참여 인원, 마감 여부)
- `memberCount ≥ 2`이면 결과 페이지로 즉시 리다이렉트
- `isClosed`이면 참여 불가 안내

**FE 대응 완료**: `CompareLink` 타입에 3개 필드 추가, `CompareLanding` 컴포넌트에서 GROUP 분기 처리

---

### 2-6. 그룹 결과 멤버에 gender/birthYear — `GET /api/v1/compare-links/{token}/group-result`

**현재 응답 (2-2에서 정의한 members)**:

```json
{
  "members": [
    { "userId": "user-1", "nickname": "웅이", "displayName": "웅일", "answers": [...] }
  ]
}
```

**변경 요청 — `gender`, `birthYear` 필드 추가**:

```json
{
  "members": [
    {
      "userId": "user-1",
      "nickname": "웅이",
      "displayName": "웅일",
      "gender": "MALE",
      "birthYear": 1995,
      "answers": [...]
    }
  ]
}
```

| 필드        | 타입                 | 필수 | 설명                                            |
| ----------- | -------------------- | ---- | ----------------------------------------------- |
| `gender`    | `'MALE' \| 'FEMALE'` | N    | 성별 (없으면 성별 기반 섹션에서 해당 멤버 제외) |
| `birthYear` | `number`             | N    | 출생연도 (없으면 세대 분석에서 해당 멤버 제외)  |

**변경 사유**:

- 이성궁합 랭킹: 남녀 쌍의 케미 TOP 3 / WORST 3 표시
- 성별 대결: 질문별 남녀 선택 비율 차이 시각화
- 세대별 클러스터: 연령대별 응답 패턴 분석 (예정)

**개인정보 고려사항**:

- `gender`/`birthYear`는 회원가입 시 수집하는 정보 활용
- 그룹 비교에 참여한 유저만 대상 (공개 범위 = 같은 그룹 멤버)
- 미입력/비공개 유저는 null로 처리 → FE에서 해당 섹션에서 자동 제외

**FE 대응 완료**: `GroupCompareResult.members` 타입에 optional `gender`/`birthYear` 추가, 성별 대결/이성궁합 컴포넌트에서 사용

---

### 2-7. 그룹 결과에 myUserId 추가 — `GET /api/v1/compare-links/{token}/group-result`

**현재 응답**: 그룹 결과에 "현재 유저가 누구인지" 정보 없음

**변경 요청 — 최상위에 `myUserId` 필드 추가**:

```json
{
  "bundleSlug": "love-values",
  "myUserId": "user-1",
  ...
}
```

| 필드       | 타입     | 설명                                               |
| ---------- | -------- | -------------------------------------------------- |
| `myUserId` | `string` | 현재 로그인 유저의 userId (members 배열 내 매칭용) |

**변경 사유**:

- 그룹 내 "나"를 식별하기 위해 필요 (네트워크 그래프 12시 방향 배치, "나" 뱃지 표시, 아바타 스택 우선 배치 등)
- 1:1 비교에서는 `me`/`target` 구조로 해결했지만, 그룹은 members 배열이므로 별도 식별자 필요

**FE 대응 완료**: 모든 그룹 결과 하위 컴포넌트에 `currentUserId` prop 전달, "나" 뱃지 및 우선 배치 구현

---

### 2-8. 그룹 결과 questionStats 비율 형식

**1:1 비교 결과 (Phase 2)의 questionStats**:

```json
{
  "questionStats": [
    { "electionId": "le-1", "optionACount": 320, "optionBCount": 180, ... }
  ]
}
```

**그룹 비교 결과 (Phase 3)의 questionStats**:

```json
{
  "questionStats": [
    {
      "electionId": "le-1",
      "optionARate": 64,
      "optionBRate": 36,
      "totalVotes": 500,
      "axis": "X",
      ...
    }
  ]
}
```

| 필드          | 타입                 | 설명                                |
| ------------- | -------------------- | ----------------------------------- |
| `optionARate` | `number`             | A 선택 비율 (0~100 정수)            |
| `optionBRate` | `number`             | B 선택 비율 (0~100 정수, = 100 - A) |
| `totalVotes`  | `number`             | 전체 참여자 투표 수                 |
| `axis`        | `'X' \| 'Y' \| null` | 가치관 지도 축 배정 (null = 미배정) |

**설계 의도**:

- 1:1 비교(Phase 2)는 `optionACount`/`optionBCount`로 FE에서 비율 계산
- 그룹 비교(Phase 3)는 서버에서 비율을 미리 계산해서 `optionARate`/`optionBRate`로 전달
- 그룹에서는 대중성 점수, 논쟁 포인트 등에서 비율을 직접 사용하므로 비율 형식이 효율적
- `totalVotes`는 참고 수치로 제공 (FE에서 직접 계산에는 사용하지 않음)
- `axis`는 가치관 지도 시각화에 사용 (X/Y 축에 어떤 질문을 배정할지)

**참고**: 이는 새 API(`group-result`)의 스펙이므로 기존 API 변경은 아님. `bundle-api-spec.md` 섹션 9에 상세 기술됨.

---

## 3. 변경 타임라인

| 우선순위 | 항목                         | 설명                                  |
| -------- | ---------------------------- | ------------------------------------- |
| P0       | 1-1 닉네임 중복 허용         | FE 이미 반영 완료, 서버만 풀어주면 됨 |
| P0       | 2-1 join displayName         | 그룹 비교 핵심 기능                   |
| P0       | 2-2 group-result displayName | 2-1과 세트                            |
| P0       | 2-5 compare-link GROUP 필드  | 그룹 랜딩 페이지 분기에 필수          |
| P0       | 2-7 group-result myUserId    | "나" 식별에 필수                      |
| P1       | 2-4 번들 상세 categoryCode   | 성별 기반 섹션 조건부 표시            |
| P1       | 2-6 members gender/birthYear | 성별 대결, 이성궁합 섹션              |
| P1       | 2-3 프로필 색상 확장         | FE 반영 완료, 서버 validation만 확장  |
| P1       | 1-2 (변경 없음)              | 서버 변경 불필요, 참고용 기록         |
| 참고     | 2-8 questionStats 비율 형식  | 새 API 스펙, 기존 변경 아님           |
