# Shorts API 명세서

> **서버 팀 전달용** — HotPick Shorts(단일 투표) 기능의 전체 API 명세
> 기획서 원본: `docs/specs/06-shorts-page.md`

---

## 목차

1. [공통 사항](#1-공통-사항)
2. [데이터 모델](#2-데이터-모델)
3. [Public API — 목록 조회](#3-public-api--목록-조회)
4. [Public API — 상세 조회](#4-public-api--상세-조회)
5. [Public API — 투표](#5-public-api--투표)
6. [Public API — 댓글](#6-public-api--댓글)
7. [Admin API — Shorts CRUD](#7-admin-api--shorts-crud)
8. [Admin API — 부가 기능](#8-admin-api--부가-기능)
9. [비즈니스 규칙](#9-비즈니스-규칙)

---

## 1. 공통 사항

### 1.1 Base URL

```
{BASE_URL}/api
```

### 1.2 응답 형식

모든 응답은 `Content-Type: application/json`.

### 1.3 공통 에러 응답 형식

```json
{
  "error": "ERROR_CODE",
  "message": "사용자에게 표시할 메시지"
}
```

| 상태 코드 | 용도                      |
| --------- | ------------------------- |
| 400       | 요청 파라미터 오류        |
| 404       | 리소스 없음               |
| 409       | 중복/충돌                 |
| 410       | 마감된 리소스에 대한 행위 |
| 500       | 서버 내부 오류            |

### 1.4 페이지네이션 공통 구조

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "size": 20,
    "totalCount": 45,
    "totalPages": 3,
    "hasNext": true
  }
}
```

### 1.5 날짜/시간 형식

모든 날짜는 **ISO 8601 UTC** 형식: `"2025-02-13T10:00:00Z"`

---

## 2. 데이터 모델

### 2.1 Shorts

```typescript
interface Shorts {
  id: string; // 고유 ID (서버 생성)
  alias: string; // URL용 식별자 (고유, 불변)
  title: string; // 질문 텍스트
  voteType: 'IMAGE' | 'TEXT'; // 투표 UI 유형
  mainImageUrl: string | null; // TEXT 유형 메인 이미지 (IMAGE 유형이면 null)
  options: ShortsOption[]; // 선택지 배열 (2~4개)
  categoryId: string | null; // 카테고리 ID
  categoryName: string | null; // 카테고리명 (응답 전용, 저장하지 않음)
  deadline: string | null; // 마감일시 (ISO 8601, null이면 상시 운영)
  status: 'OPEN' | 'CLOSED'; // 투표 상태
  totalVotes: number; // 총 투표 수
  isNew: boolean; // 24시간 이내 생성 여부 (응답 전용, 서버 계산)
  createdAt: string; // 생성일시
  updatedAt: string; // 수정일시
}
```

### 2.2 ShortsOption

```typescript
interface ShortsOption {
  id: string; // 옵션 고유 ID (서버 생성)
  title: string; // 옵션 텍스트
  imageUrl: string | null; // IMAGE 유형 시 이미지 URL (TEXT 유형이면 null)
  voteCount: number; // 해당 옵션 투표 수
}
```

### 2.3 ShortsComment

```typescript
interface ShortsComment {
  id: string; // 댓글 고유 ID (서버 생성)
  shortsId: string; // 소속 Shorts ID
  nickname: string; // 작성자 닉네임
  password: string; // 비밀번호 (해시 저장, 응답에 미포함)
  content: string; // 댓글 내용
  likeCount: number; // 좋아요 수
  createdAt: string;
  updatedAt: string;
}
```

### 2.4 필드 검증 규칙

| 필드                 | 규칙                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------- |
| `alias`              | 영문 소문자 + 숫자 + 하이픈만 허용. 정규식: `^[a-z0-9-]+$`. 고유값. 생성 후 변경 불가. |
| `title`              | 1~100자                                                                                |
| `voteType`           | `"IMAGE"` 또는 `"TEXT"`. 생성 후 변경 불가.                                            |
| `mainImageUrl`       | `voteType: "TEXT"` 일 때 **필수**, `"IMAGE"` 일 때 **null**                            |
| `options`            | 최소 2개, 최대 4개                                                                     |
| `options[].title`    | 1~50자                                                                                 |
| `options[].imageUrl` | `voteType: "IMAGE"` 일 때 **필수**, `"TEXT"` 일 때 **null**                            |
| `deadline`           | null(상시) 또는 현재 시간(UTC) + 1시간 이후의 미래 날짜                                |
| `nickname` (댓글)    | 1~20자                                                                                 |
| `password` (댓글)    | 1~20자                                                                                 |
| `content` (댓글)     | 1~500자                                                                                |

---

## 3. Public API — 목록 조회

### `GET /api/shorts`

Shorts 탭에서 사용하는 목록 조회. 트렌드 API(`GET /api/trends`)와 독립적으로 운영.

**Query Parameters:**

| 파라미터   | 타입   | 필수 | 기본값     | 설명                                |
| ---------- | ------ | ---- | ---------- | ----------------------------------- |
| page       | number | X    | 1          | 페이지 번호                         |
| size       | number | X    | 20         | 페이지 크기 (최대 50)               |
| categoryId | string | X    | -          | 카테고리 필터                       |
| sort       | string | X    | `"latest"` | 정렬 기준 (아래 표 참조)            |
| status     | string | X    | -          | `"OPEN"` / `"CLOSED"` (없으면 전체) |

**정렬 규칙:**

| sort 값    | 정렬 기준           | 설명                                                         |
| ---------- | ------------------- | ------------------------------------------------------------ |
| `latest`   | createdAt 내림차순  | 최신 Shorts 우선                                             |
| `popular`  | totalVotes 내림차순 | 참여자 많은 순                                               |
| `deadline` | deadline 오름차순   | 마감 임박 순. deadline이 null인 항목 제외. OPEN 상태만 대상. |

**Response (200):**

```json
{
  "data": [
    {
      "id": "shorts_abc123",
      "alias": "jjajjam-2025",
      "title": "짜장면 vs 짬뽕?",
      "voteType": "IMAGE",
      "mainImageUrl": null,
      "options": [
        {
          "id": "opt_1",
          "title": "짜장면",
          "imageUrl": "https://cdn.hotpick.co.kr/shorts/jj1.jpg",
          "voteCount": 125
        },
        {
          "id": "opt_2",
          "title": "짬뽕",
          "imageUrl": "https://cdn.hotpick.co.kr/shorts/jj2.jpg",
          "voteCount": 152
        }
      ],
      "categoryId": "FOOD",
      "categoryName": "음식",
      "deadline": "2025-02-20T23:59:59Z",
      "status": "OPEN",
      "totalVotes": 277,
      "isNew": true,
      "createdAt": "2025-02-13T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "totalCount": 45,
    "totalPages": 3,
    "hasNext": true
  }
}
```

> **Note:** 목록 응답에는 `updatedAt` 미포함 (목록에서는 불필요).

---

## 4. Public API — 상세 조회

### `GET /api/shorts/{shortsId}`

개별 Shorts 상세 정보. Shorts 전용 페이지(`/shorts/{alias}`)에서 사용.

**Path Parameters:**

| 파라미터 | 타입   | 설명                                                |
| -------- | ------ | --------------------------------------------------- |
| shortsId | string | Shorts ID **또는** alias (서버에서 둘 다 조회 지원) |

**Response (200):**

```json
{
  "id": "shorts_abc123",
  "alias": "jjajjam-2025",
  "title": "짜장면 vs 짬뽕?",
  "voteType": "IMAGE",
  "mainImageUrl": null,
  "options": [
    {
      "id": "opt_1",
      "title": "짜장면",
      "imageUrl": "https://cdn.hotpick.co.kr/shorts/jj1.jpg",
      "voteCount": 125
    },
    {
      "id": "opt_2",
      "title": "짬뽕",
      "imageUrl": "https://cdn.hotpick.co.kr/shorts/jj2.jpg",
      "voteCount": 152
    }
  ],
  "categoryId": "FOOD",
  "categoryName": "음식",
  "deadline": "2025-02-20T23:59:59Z",
  "status": "OPEN",
  "totalVotes": 277,
  "createdAt": "2025-02-13T10:00:00Z"
}
```

**에러:**

| 상태 코드 | 조건                   | 응답                                                               |
| --------- | ---------------------- | ------------------------------------------------------------------ |
| 404       | 존재하지 않는 ID/alias | `{ "error": "NOT_FOUND", "message": "Shorts를 찾을 수 없습니다" }` |

---

## 5. Public API — 투표

### `POST /api/shorts/{shortsId}/vote`

Shorts 투표. 비로그인 서비스이므로 fingerprint(IP + User-Agent) 기반 중복 검증.

**Path Parameters:**

| 파라미터 | 타입   | 설명      |
| -------- | ------ | --------- |
| shortsId | string | Shorts ID |

**Request Body:**

```json
{
  "optionId": "opt_2"
}
```

**Request Headers (중복 검증용):**

서버는 아래 헤더를 자동 수집하여 fingerprint 생성:

| 헤더                                 | 용도                    |
| ------------------------------------ | ----------------------- |
| `X-Forwarded-For` 또는 클라이언트 IP | fingerprint 구성 요소 1 |
| `User-Agent`                         | fingerprint 구성 요소 2 |

**Response (200):**

```json
{
  "success": true,
  "result": {
    "options": [
      { "id": "opt_1", "title": "짜장면", "voteCount": 125, "rate": 45.1 },
      { "id": "opt_2", "title": "짬뽕", "voteCount": 153, "rate": 54.9 }
    ],
    "totalVotes": 278,
    "selectedOptionId": "opt_2"
  }
}
```

| 응답 필드                 | 설명                                                  |
| ------------------------- | ----------------------------------------------------- |
| `result.options[].rate`   | 소수점 1자리 퍼센트 (합산 100.0)                      |
| `result.selectedOptionId` | 사용자가 선택한 옵션 ID (프론트에서 "내 선택" 강조용) |

**에러:**

| 상태 코드 | error 코드       | 조건                      | 메시지                       |
| --------- | ---------------- | ------------------------- | ---------------------------- |
| 400       | `INVALID_OPTION` | 존재하지 않는 optionId    | "유효하지 않은 선택지입니다" |
| 409       | `ALREADY_VOTED`  | 동일 fingerprint로 재투표 | "이미 투표한 Shorts입니다"   |
| 410       | `CLOSED`         | 마감된 Shorts에 투표 시도 | "마감된 투표입니다"          |

---

## 6. Public API — 댓글

### 6.1 `GET /api/shorts/{shortsId}/comments` — 댓글 조회

**Query Parameters:**

| 파라미터 | 타입   | 필수 | 기본값      | 설명                                         |
| -------- | ------ | ---- | ----------- | -------------------------------------------- |
| sort     | string | X    | `"popular"` | `"popular"` (좋아요순) / `"latest"` (최신순) |
| page     | number | X    | 1           | 페이지 번호                                  |
| size     | number | X    | 20          | 페이지 크기 (최대 50)                        |

**Response (200):**

```json
{
  "data": [
    {
      "id": "comment_123",
      "nickname": "치킨러버",
      "content": "짬뽕이 진리지",
      "likeCount": 12,
      "isLiked": false,
      "createdAt": "2025-02-13T11:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "totalCount": 42,
    "hasNext": true
  }
}
```

| 필드      | 설명                                        |
| --------- | ------------------------------------------- |
| `isLiked` | 현재 요청자(fingerprint 기반)의 좋아요 여부 |

> **Note:** `password`는 응답에 **절대 포함하지 않음**.

---

### 6.2 `POST /api/shorts/{shortsId}/comments` — 댓글 작성

**Request Body:**

```json
{
  "nickname": "치킨러버",
  "password": "1234",
  "content": "짬뽕이 진리지"
}
```

**검증 규칙:**

| 필드     | 규칙                              |
| -------- | --------------------------------- |
| nickname | 필수, 1~20자                      |
| password | 필수, 1~20자 (서버에서 해시 저장) |
| content  | 필수, 1~500자                     |

**Response (201):**

```json
{
  "id": "comment_124",
  "nickname": "치킨러버",
  "content": "짬뽕이 진리지",
  "likeCount": 0,
  "createdAt": "2025-02-13T12:00:00Z"
}
```

---

### 6.3 `POST /api/shorts/{shortsId}/comments/{commentId}/like` — 댓글 좋아요 토글

동일 fingerprint로 재요청 시 좋아요 취소 (토글).

**Response (200):**

```json
{
  "likeCount": 13,
  "isLiked": true
}
```

---

## 7. Admin API — Shorts CRUD

> Admin API는 개발 환경 전용. 프로덕션에서는 404 반환.

### 7.1 `POST /api/admin/shorts` — Shorts 생성

**Request Body (TEXT 유형):**

```json
{
  "alias": "ramen-best-2025",
  "title": "올해 최고의 라면은?",
  "voteType": "TEXT",
  "mainImageUrl": "https://cdn.hotpick.co.kr/shorts/ramen-main.jpg",
  "categoryId": "FOOD",
  "deadline": "2025-02-28T23:59:59Z",
  "options": [
    { "title": "신라면" },
    { "title": "진라면" },
    { "title": "삼양라면" },
    { "title": "너구리" }
  ]
}
```

**Request Body (IMAGE 유형):**

```json
{
  "alias": "jjajjam-2025",
  "title": "짜장면 vs 짬뽕?",
  "voteType": "IMAGE",
  "mainImageUrl": null,
  "categoryId": "FOOD",
  "deadline": "2025-02-20T23:59:59Z",
  "options": [
    { "title": "짜장면", "imageUrl": "https://cdn.hotpick.co.kr/shorts/jj1.jpg" },
    { "title": "짬뽕", "imageUrl": "https://cdn.hotpick.co.kr/shorts/jj2.jpg" }
  ]
}
```

**검증 규칙:**

| 규칙         | 설명                                                        |
| ------------ | ----------------------------------------------------------- |
| alias 고유성 | 이미 존재하는 alias면 `409 { "error": "ALIAS_DUPLICATED" }` |
| alias 형식   | `^[a-z0-9-]+$` 위반 시 `400`                                |
| options 개수 | 2개 미만 또는 4개 초과 시 `400`                             |
| IMAGE 유형   | 모든 `options[].imageUrl`이 필수. 하나라도 누락 시 `400`    |
| TEXT 유형    | `mainImageUrl` 필수. 누락 시 `400`                          |
| deadline     | null(상시) 또는 현재 UTC + 1시간 이후. 과거 시간이면 `400`  |

**Response (201):**

```json
{
  "id": "shorts_new456",
  "alias": "ramen-best-2025",
  "createdAt": "2025-02-13T14:00:00Z"
}
```

---

### 7.2 `PUT /api/admin/shorts/{shortsId}` — Shorts 수정

**수정 가능/불가 필드:**

| 필드               | 수정 가능 | 비고                                |
| ------------------ | --------- | ----------------------------------- |
| alias              | ❌        | 변경 불가 (URL 무결성)              |
| title              | ✅        |                                     |
| voteType           | ❌        | 변경 불가 (옵션 이미지 구조 다름)   |
| mainImageUrl       | ✅        | TEXT 유형만                         |
| categoryId         | ✅        |                                     |
| deadline           | ✅        | 마감 연장/단축 가능                 |
| options[].title    | ✅        | 텍스트 수정 가능                    |
| options[].imageUrl | ✅        | IMAGE 유형, 이미지 교체 가능        |
| options 개수       | ❌        | 추가/삭제 불가 (투표 데이터 정합성) |

**Request Body:**

```json
{
  "title": "올해 최고의 라면은? (수정됨)",
  "categoryId": "FOOD",
  "deadline": "2025-03-01T23:59:59Z",
  "mainImageUrl": "https://cdn.hotpick.co.kr/shorts/ramen-main-v2.jpg",
  "options": [
    { "id": "opt_1", "title": "신라면 (빨간맛)" },
    { "id": "opt_2", "title": "진라면" },
    { "id": "opt_3", "title": "삼양라면" },
    { "id": "opt_4", "title": "너구리" }
  ]
}
```

> `options` 배열에는 반드시 기존 옵션의 `id`를 포함해야 함. 서버는 id로 매칭하여 업데이트.

**Response (200):** 수정된 Shorts 전체 객체 반환 (상세 조회와 동일한 형태).

---

### 7.3 `DELETE /api/admin/shorts/{shortsId}` — Shorts 삭제

**Response (200):**

```json
{
  "success": true,
  "message": "Shorts가 삭제되었습니다"
}
```

> 연관된 댓글, 투표 기록도 함께 삭제 (cascade).

---

## 8. Admin API — 부가 기능

### 8.1 `PUT /api/admin/shorts/{shortsId}/close` — 수동 마감

deadline 이전이라도 관리자가 즉시 마감 처리.

**Request Body:** 없음

**Response (200):**

```json
{
  "success": true,
  "status": "CLOSED",
  "closedAt": "2025-02-13T15:00:00Z"
}
```

---

### 8.2 `POST /api/admin/shorts/check-alias` — Alias 중복 확인

Shorts 생성 전 alias 사용 가능 여부 확인.

**Request Body:**

```json
{
  "alias": "ramen-best-2025"
}
```

**Response (200):**

```json
{
  "available": true
}
```

| available | 의미         |
| --------- | ------------ |
| `true`    | 사용 가능    |
| `false`   | 이미 사용 중 |

---

### 8.3 `POST /api/admin/upload/image` — 이미지 업로드

기존 트렌드 이미지 업로드 API와 동일한 **Pre-signed URL 방식**. Shorts 전용 추가 구현 불필요.

---

## 9. 비즈니스 규칙

### 9.1 투표 중복 방지

| 계층             | 방법                         | 설명                                                   |
| ---------------- | ---------------------------- | ------------------------------------------------------ |
| 1차 (클라이언트) | localStorage                 | 프론트에서 투표한 shortsId 저장. 빠른 UX용 (우회 가능) |
| 2차 (서버)       | fingerprint(IP + User-Agent) | 서버에서 최종 중복 검증. 동일 fingerprint면 `409` 반환 |

> 비로그인 서비스 한계: 다른 기기에서 동일 사용자의 중복 투표는 허용됨. 추후 로그인 도입 시 개선.

### 9.2 자동 마감

| 항목          | 규칙                                                                |
| ------------- | ------------------------------------------------------------------- |
| 마감 판정     | 서버 시간(UTC) 기준                                                 |
| 자동 마감     | 서버 스케줄러가 **1분 주기**로 deadline 도래 Shorts를 `CLOSED` 처리 |
| deadline null | 상시 운영. 수동 마감만 가능                                         |

### 9.3 isNew 계산

| 필드    | 계산 방식                                          |
| ------- | -------------------------------------------------- |
| `isNew` | `(현재 UTC 시간 - createdAt) < 24시간` 이면 `true` |

> 서버 응답 시 동적 계산. DB에 저장하지 않음.

### 9.4 rate 계산

```
rate = (해당 옵션 voteCount / totalVotes) × 100
```

소수점 1자리 반올림. 모든 옵션의 rate 합산 = 100.0.
totalVotes가 0이면 모든 rate = 0.

### 9.5 카테고리

카테고리는 기존 트렌드와 동일한 카테고리 테이블 공유.

| API                   | 설명                                 |
| --------------------- | ------------------------------------ |
| `GET /api/categories` | 카테고리 목록 조회 (기존 API 재사용) |

---

## API 엔드포인트 요약

| Method | 경로                                               | 설명            | 인증                |
| ------ | -------------------------------------------------- | --------------- | ------------------- |
| GET    | `/api/shorts`                                      | 목록 조회       | 없음                |
| GET    | `/api/shorts/{shortsId}`                           | 상세 조회       | 없음                |
| POST   | `/api/shorts/{shortsId}/vote`                      | 투표            | 없음 (fingerprint)  |
| GET    | `/api/shorts/{shortsId}/comments`                  | 댓글 조회       | 없음                |
| POST   | `/api/shorts/{shortsId}/comments`                  | 댓글 작성       | 없음                |
| POST   | `/api/shorts/{shortsId}/comments/{commentId}/like` | 좋아요 토글     | 없음 (fingerprint)  |
| POST   | `/api/admin/shorts`                                | Shorts 생성     | Admin               |
| PUT    | `/api/admin/shorts/{shortsId}`                     | Shorts 수정     | Admin               |
| DELETE | `/api/admin/shorts/{shortsId}`                     | Shorts 삭제     | Admin               |
| PUT    | `/api/admin/shorts/{shortsId}/close`               | 수동 마감       | Admin               |
| POST   | `/api/admin/shorts/check-alias`                    | Alias 중복 확인 | Admin               |
| POST   | `/api/admin/upload/image`                          | 이미지 업로드   | Admin (기존 재사용) |
