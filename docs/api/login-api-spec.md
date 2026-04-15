# 로그인/회원 API 개발 요청서

> **작성일**: 2026-03-29
> **브랜치**: `feature/kakao`
> **FE 담당**: 웅일

---

## 공통 사항

### 응답 래퍼 구조

모든 API는 아래 `BaseResponse` 형식으로 응답합니다.

```json
{
  "code": "SUCCESS",
  "message": "요청 성공",
  "data": { ... }
}
```

- 에러 시 `code`에 에러 코드, `message`에 사유, `data`는 `null`
- FE의 axios 인터셉터가 `data` 필드만 추출하여 사용

### 인증 방식

- 쿠키 기반 (`httpOnly`, `secure`, `sameSite`)
- Access Token + Refresh Token
- 401 응답 시 FE가 자동으로 `/api/auth/refresh` 호출 후 원래 요청 재시도
- Refresh도 실패하면 FE에서 강제 로그아웃 처리

### 회원가입 전용 인증 (signupToken)

- 카카오 로그인 시 신규 유저(`shouldSignup: true`)인 경우, Access/Refresh Token 대신 **signupToken**을 발급
- signupToken은 응답 body의 `data.signupToken` 필드로 전달 (쿠키 아님)
- signupToken으로 접근 가능한 API (Authorization 헤더에 `Bearer {signupToken}`으로 전달):
  - `POST /api/auth/signup` (회원가입 완료)
  - `GET /api/auth/nickname/suggest` (닉네임 추천)
  - `GET /api/auth/nickname/check` (닉네임 중복 확인)
- 그 외 API 호출 시 403 응답
- 만료 시간: **30분**
- 회원가입 완료(`POST /api/auth/signup`) 시 signupToken 무효화 + 정식 Access/Refresh Token 쿠키 발급

---

## User 모델

FE에서 사용하는 사용자 정보 구조:

```typescript
interface User {
  id: number;
  nickname: string | null; // 회원가입 직후 null, 닉네임 설정 후 string
  profileColor: string; // 프로필 색상 이름 (예: "purple", "blue", "green", ...)
  lastNicknameChangedAt: string | null; // ISO 8601 (예: "2026-03-15T12:00:00Z"), 변경 이력 없으면 null
}
```

### profileColor 값 목록

| name     | 설명          |
| -------- | ------------- |
| `purple` | 보라 (기본값) |
| `blue`   | 파랑          |
| `cyan`   | 청록          |
| `green`  | 초록          |
| `yellow` | 노랑          |
| `orange` | 주황          |
| `pink`   | 분홍          |
| `red`    | 빨강          |

---

## API 목록

### 1. 카카오 로그인

카카오 인가 코드를 받아 로그인/회원가입을 처리합니다.

```
POST /api/auth/kakao
```

**Request Body:**

```json
{
  "code": "카카오_인가_코드",
  "redirectUri": "https://hotpick.votebox.kr/auth/kakao/callback"
}
```

**Response — 기존 회원 (200):**

```json
{
  "code": "SUCCESS",
  "data": {
    "shouldSignup": false,
    "user": {
      "id": 1001,
      "nickname": "테스트유저",
      "profileColor": "purple",
      "lastNicknameChangedAt": null
    }, // user 는 signin 가능할때만
    "signupToken": null // 30분 짜리 signup 일때만 내려주기
  } // 기존회원 : Access Token / Refresh Token 쿠키 세팅
}
```

**쿠키 설정**: Access Token / Refresh Token 쿠키 세팅

**Response — 신규 유저 (200):**

```json
{
  "code": "SUCCESS",
  "data": {
    "shouldSignup": true,
    "user": null,
    "signupToken": "eyJhbGciOiJIUzI1NiIs..."
  }
} // 기존회원 X : Access Token / Refresh Token 쿠키 세팅 X
```

**쿠키 설정 없음** (signupToken은 body로만 전달)

| 필드           | 타입                  | 설명                                                                |
| -------------- | --------------------- | ------------------------------------------------------------------- |
| `user`         | `User \| undefined`   | 기존 회원인 경우에만 포함                                           |
| `shouldSignup` | `boolean`             | `true` → 신규 유저, `false` → 기존 회원                             |
| `signupToken`  | `string \| undefined` | 신규 유저인 경우에만 포함. 회원가입 API 호출 시 인증용 (만료: 30분) |

---

### 2. 내 정보 조회

로그인 상태 확인 및 사용자 정보 조회 (앱 진입 시 호출).

```
GET /api/auth/me
```

**Response (200):**

```json
{
  "code": "SUCCESS",
  "data": {
    "id": 1001,
    "nickname": "테스트유저",
    "profileColor": "purple",
    "lastNicknameChangedAt": "2026-03-15T12:00:00Z"
  }
}
```

**Response (401):** 비로그인 상태

---

### 3. 토큰 갱신

Access Token 만료 시 FE가 자동 호출합니다. FE 코드에서 직접 호출하는 것이 아니라 axios 인터셉터에서 401 응답 시 자동 트리거됩니다.

```
POST /api/auth/refresh
```

**Request**: 없음 (쿠키의 Refresh Token 사용)

**Response (200):** 새 Access Token 쿠키 설정

**Response (401):** Refresh Token도 만료 → FE에서 강제 로그아웃

---

### 4. 로그아웃

```
POST /api/auth/logout
```

**Request**: 없음 (쿠키 기반 인증)

**Response (200):**

```json
{
  "code": "SUCCESS",
  "data": null
}
```

**처리**: 서버 측 세션/토큰 무효화 + 쿠키 삭제

---

### 5. 회원 탈퇴

```
DELETE /api/auth/me
```

**Request**: 없음 (쿠키 기반 인증)

**Response (200):**

```json
{
  "code": "SUCCESS",
  "data": null
}
```

**처리**: 사용자 데이터 삭제 (또는 소프트 딜리트) + 세션/토큰 무효화 + 쿠키 삭제

---

### 6. 회원가입 완료

signupToken을 이용하여 닉네임 설정 + 비로그인 활동 연결을 한 번에 처리합니다.
tkuId가 있으면 해당 비로그인 활동(투표/댓글/좋아요)을 신규 계정에 연결합니다.

```
POST /api/auth/signup
```

**인증**: Authorization 헤더에 `Bearer {signupToken}`

**Request Body:**

```json
{
  "nickname": "용감한고양이",
  "link": {
    "tkuId": "기존_비로그인_식별자_UUID",
    "votes": true,
    "comments": true,
    "likes": false
  }
}
```

| 필드            | 타입             | 필수 | 설명                                                    |
| --------------- | ---------------- | ---- | ------------------------------------------------------- |
| `nickname`      | `string`         | O    | 닉네임 (최대 20자)                                      |
| `link`          | `object \| null` | X    | 활동 연결 정보 (연결하지 않으면 `null` 또는 생략)       |
| `link.tkuId`    | `string`         | O    | 비로그인 사용자 식별 UUID (FE localStorage에 저장된 값) |
| `link.votes`    | `boolean`        | O    | 투표 기록 연결 여부                                     |
| `link.comments` | `boolean`        | O    | 댓글 기록 연결 여부                                     |
| `link.likes`    | `boolean`        | O    | 좋아요 기록 연결 여부                                   |

**Response (200):**

```json
{
  "code": "SUCCESS",
  "data": {
    "user": {
      "id": 1001,
      "nickname": "용감한고양이",
      "profileColor": "purple",
      "lastNicknameChangedAt": null
    },
    "linked": {
      "votes": 8,
      "comments": 3,
      "likes": 0
    }
  }
}
```

| 필드              | 타입             | 설명                                      |
| ----------------- | ---------------- | ----------------------------------------- |
| `user`            | `User`           | 생성된 사용자 정보                        |
| `linked`          | `object \| null` | 연결 결과 (`link` 미전달 시 `null`)       |
| `linked.votes`    | `number`         | 연결된 투표 수 (요청에서 `false`면 `0`)   |
| `linked.comments` | `number`         | 연결된 댓글 수 (요청에서 `false`면 `0`)   |
| `linked.likes`    | `number`         | 연결된 좋아요 수 (요청에서 `false`면 `0`) |

**쿠키 설정**: signupToken 무효화 + Access Token / Refresh Token 쿠키 세팅

**에러:**

| code                   | 상황                            |
| ---------------------- | ------------------------------- |
| `NICKNAME_DUPLICATED`  | 닉네임 중복                     |
| `NICKNAME_INVALID`     | 닉네임 형식 오류 (20자 초과 등) |
| `TOKEN_EXPIRED`        | signupToken 만료 (30분)         |
| `TKUID_ALREADY_LINKED` | 이미 다른 계정에 연결된 tkuId   |

---

### 7. 프로필 수정 (닉네임 변경 / 프로필 색상 변경)

하나의 엔드포인트로 여러 프로필 필드를 수정합니다. 전달된 필드만 업데이트합니다 (partial update).

nickname 의 경우 마지막 수정 기준 1달에 한 번만 수정 가능하다.

```
PATCH /api/auth/me
```

**Request Body (닉네임 변경 시):**

```json
{
  "nickname": "용감한고양이"
}
```

| 필드       | 타입     | 필수 | 설명               |
| ---------- | -------- | ---- | ------------------ |
| `nickname` | `string` | X    | 닉네임 (최대 20자) |

**Response (200):** `data`는 변경된 User 정보

**Request Body (프로필 색상 변경 시):**

```json
{
  "profileColor": "blue"
}
```

**Response (200):** `data`는 변경된 User 정보

### 8. 닉네임 중복 확인

```
GET /api/auth/nickname/check?nickname=용감한고양이
```

**Query Parameters:**

| 파라미터   | 타입     | 설명          |
| ---------- | -------- | ------------- |
| `nickname` | `string` | 확인할 닉네임 |

**Response (200):**

```json
{
  "code": "SUCCESS",
  "data": {
    "available": true
  }
}
```

---

### 9. 내 댓글 목록

```
GET /api/users/me/comments?size=20
GET /api/users/me/comments?cursor=abc123&size=20
```

**Query Parameters:**

| 파라미터 | 타입     | 기본값    | 설명                               |
| -------- | -------- | --------- | ---------------------------------- |
| `cursor` | `string` | undefined | 다음 페이지 커서 (첫 요청 시 생략) |
| `size`   | `number` | 20        | 한 페이지당 항목 수                |

**Response (200):**

```json
{
  "code": "SUCCESS",
  "data": {
    "data": [
      {
        "hotpickSlug": "best-pizza-topping",
        "hotpickTitle": "피자 토핑 최강은?",
        "content": "하와이안이 최고!",
        "createdAt": "2026-03-28T14:30:00Z"
      }
    ],
    "nextCursor": "abc123",
    "hasMore": true
  }
}
```

**댓글 아이템 필드:**

| 필드           | 타입     | 설명                             |
| -------------- | -------- | -------------------------------- |
| `hotpickSlug`  | `string` | 핫픽 식별자 (상세 페이지 링크용) |
| `hotpickTitle` | `string` | 핫픽 제목                        |
| `content`      | `string` | 댓글 내용                        |
| `createdAt`    | `string` | ISO 8601 작성일시                |

---

### 10. 좋아요한 핫픽 목록

```
GET /api/users/me/likes?size=20
GET /api/users/me/likes?cursor=abc123&size=20
```

**Query Parameters:**

| 파라미터 | 타입     | 기본값    | 설명                               |
| -------- | -------- | --------- | ---------------------------------- |
| `cursor` | `string` | undefined | 다음 페이지 커서 (첫 요청 시 생략) |
| `size`   | `number` | 20        | 한 페이지당 항목 수                |

**Response (200):**

```json
{
  "code": "SUCCESS",
  "data": {
    "data": [
      {
        "hotpickId": 42,
        "hotpickAlias": "best-pizza-topping",
        "hotpickTitle": "피자 토핑 최강은?",
        "optionSummary": "페퍼로니 vs 하와이안",
        "likedAt": "2026-03-27T10:00:00Z"
      }
    ],
    "nextCursor": "abc123",
    "hasMore": true
  }
}
```

**좋아요 아이템 필드:**

| 필드            | 타입     | 설명                             |
| --------------- | -------- | -------------------------------- |
| `hotpickId`     | `number` | 핫픽 ID                          |
| `hotpickAlias`  | `string` | 핫픽 슬러그 (상세 페이지 링크용) |
| `hotpickTitle`  | `string` | 핫픽 제목                        |
| `optionSummary` | `string` | 선택지 요약 (예: "A vs B")       |
| `likedAt`       | `string` | ISO 8601 좋아요 일시             |

---

## API 요약 테이블

| #   | Method | Endpoint                   | 인증               | 용도                               |
| --- | ------ | -------------------------- | ------------------ | ---------------------------------- |
| 1   | POST   | `/api/auth/kakao`          | X                  | 카카오 로그인                      |
| 2   | GET    | `/api/auth/me`             | O                  | 내 정보 조회 (로그인 상태 확인)    |
| 3   | POST   | `/api/auth/refresh`        | 쿠키               | 토큰 갱신                          |
| 4   | POST   | `/api/auth/logout`         | O                  | 로그아웃                           |
| 5   | DELETE | `/api/auth/me`             | O                  | 회원 탈퇴                          |
| 6   | POST   | `/api/auth/signup`         | signupToken        | 회원가입 완료 (닉네임 + 활동 연결) |
| 7   | PATCH  | `/api/auth/me`             | O                  | 프로필 수정 (닉네임/색상)          |
| 8   | GET    | `/api/auth/nickname/check` | signupToken 또는 O | 닉네임 중복 확인                   |
| 9   | GET    | `/api/users/me/comments`   | O                  | 내 댓글 목록                       |
| 10  | GET    | `/api/users/me/likes`      | O                  | 좋아요한 핫픽 목록                 |

---

## BE 주요 검증/처리 사항

### 닉네임

- 최대 20자
- 중복 불가
- 변경 주기 제한: 30일에 1회
- 변경 시 `lastNicknameChangedAt` 갱신

### 회원 탈퇴

- 관련 데이터 삭제 (또는 소프트 딜리트, 정책 확정 필요)
- 재가입 유예 기간 없음 (현재 서비스 규모 고려)

### 회원가입 시 활동 연결 (`POST /api/auth/signup`)

- `link` 필드가 있으면 `tkuId`의 비로그인 활동을 선택적으로 연결
- `link.votes` / `link.comments` / `link.likes` 각각 `true`인 항목만 이전
- 이미 다른 계정에 연결된 tkuId는 `TKUID_ALREADY_LINKED` 에러 반환
- `link` 미전달(또는 `null`) 시 활동 연결 없이 회원가입만 진행
