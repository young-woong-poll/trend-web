# API 변경 요청서

> FE 닉네임 시스템 개편 및 그룹 비교 displayName 도입에 따른 기존 API 변경사항 + 신규 API 요청

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

### 1-2. 회원가입 닉네임 필수 입력 — `POST /api/v1/auth/signup`

**현재 동작**: FE에서 자동 생성 닉네임을 기본값으로 채워 전송

**변경 요청**: 서버 측 변경 불필요 (닉네임은 이미 required 필드)

**FE 변경 완료**: 자동 생성 로직 제거, 유저가 직접 입력한 닉네임만 전송

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

## 3. 변경 타임라인

| 우선순위 | 항목                         | 설명                                  |
| -------- | ---------------------------- | ------------------------------------- |
| P0       | 1-1 닉네임 중복 허용         | FE 이미 반영 완료, 서버만 풀어주면 됨 |
| P0       | 2-1 join displayName         | 그룹 비교 핵심 기능                   |
| P0       | 2-2 group-result displayName | 2-1과 세트                            |
| P1       | 1-2 (변경 없음)              | 서버 변경 불필요, 참고용 기록         |
