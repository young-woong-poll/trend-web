# API 개발 요청: Election CRUD + HotPick 확장

> 선거(Election) 관리를 HotPick 서비스로 내재화하기 위한 서버 API 개발 요청
> 작성일: 2025-02-13
> 관련 기획: `docs/specs/new-hotpick-election-system.md`

---

## 배경

현재 선거(Election)는 console.votebox.kr에서 생성/관리되고, HotPick은 선거 ID를 참조하여 트렌드를 구성하고 있습니다. 개발 속도와 비용 문제를 고려하여, 선거 CRUD를 HotPick 서비스로 이전합니다.

동시에 P0 기능(텍스트 투표, 마감 시스템, 카테고리 분류, 단일 투표)을 수용할 수 있도록 기존 엔티티를 확장합니다.

---

## 1. Election CRUD API (신규)

### 1.1 선거 목록 조회

```
GET /admin/api/v1/election
```

**Query Parameters:**

| 파라미터   | 타입   | 필수 | 설명                    |
| ---------- | ------ | ---- | ----------------------- |
| `keyword`  | string | N    | 제목 검색               |
| `voteType` | string | N    | `IMAGE` \| `TEXT` 필터  |
| `status`   | string | N    | `OPEN` \| `CLOSED` 필터 |
| `page`     | number | N    | 페이지 번호 (기본 0)    |
| `size`     | number | N    | 페이지 크기 (기본 20)   |

**Response:**

```json
{
  "code": 200,
  "message": "OK",
  "data": {
    "content": [
      {
        "id": "election-001",
        "title": "짜장면 vs 짬뽕",
        "voteType": "IMAGE",
        "mainImageUrl": null,
        "options": [
          {
            "id": "opt-001",
            "title": "짜장면",
            "imageUrl": "https://cdn.example.com/jajang.jpg",
            "order": 0
          },
          {
            "id": "opt-002",
            "title": "짬뽕",
            "imageUrl": "https://cdn.example.com/jjambbong.jpg",
            "order": 1
          }
        ],
        "status": "OPEN",
        "linkedHotpickCount": 1,
        "createdAt": "2025-02-10T09:00:00Z",
        "updatedAt": "2025-02-10T09:00:00Z"
      }
    ],
    "totalElements": 42,
    "totalPages": 3,
    "number": 0,
    "size": 20
  }
}
```

> `linkedHotpickCount`는 이 선거를 사용 중인 핫픽 수입니다. 선거 삭제 시 참조 여부 확인에 사용됩니다.

---

### 1.2 선거 상세 조회

```
GET /admin/api/v1/election/{electionId}
```

**Response:**

```json
{
  "code": 200,
  "message": "OK",
  "data": {
    "id": "election-001",
    "title": "짜장면 vs 짬뽕",
    "voteType": "IMAGE",
    "mainImageUrl": null,
    "options": [
      {
        "id": "opt-001",
        "title": "짜장면",
        "imageUrl": "https://cdn.example.com/jajang.jpg",
        "order": 0
      },
      {
        "id": "opt-002",
        "title": "짬뽕",
        "imageUrl": "https://cdn.example.com/jjambbong.jpg",
        "order": 1
      }
    ],
    "status": "OPEN",
    "linkedHotpickCount": 1,
    "createdAt": "2025-02-10T09:00:00Z",
    "updatedAt": "2025-02-10T09:00:00Z"
  }
}
```

---

### 1.3 선거 생성

```
POST /admin/api/v1/election
```

**Request Body:**

```json
{
  "title": "최고의 치킨 브랜드는?",
  "voteType": "TEXT",
  "mainImageUrl": "https://cdn.example.com/chicken-main.jpg",
  "options": [
    { "title": "BBQ", "order": 0 },
    { "title": "교촌치킨", "order": 1 },
    { "title": "BHC", "order": 2 },
    { "title": "굽네치킨", "order": 3 }
  ]
}
```

**검증 규칙:**

| 필드                 | 규칙                                          |
| -------------------- | --------------------------------------------- |
| `title`              | 필수, 1~200자                                 |
| `voteType`           | 필수, `IMAGE` \| `TEXT`                       |
| `mainImageUrl`       | `TEXT` 유형일 때 필수, `IMAGE` 유형일 때 무시 |
| `options`            | 필수, 2~4개                                   |
| `options[].title`    | 필수, 1~100자                                 |
| `options[].imageUrl` | `IMAGE` 유형일 때 필수, `TEXT` 유형일 때 무시 |
| `options[].order`    | 필수, 0부터 시작하는 순번                     |

**Response:**

```json
{
  "code": 201,
  "message": "Created",
  "data": {
    "id": "election-042",
    "title": "최고의 치킨 브랜드는?",
    "voteType": "TEXT",
    "mainImageUrl": "https://cdn.example.com/chicken-main.jpg",
    "options": [
      { "id": "opt-101", "title": "BBQ", "order": 0 },
      { "id": "opt-102", "title": "교촌치킨", "order": 1 },
      { "id": "opt-103", "title": "BHC", "order": 2 },
      { "id": "opt-104", "title": "굽네치킨", "order": 3 }
    ],
    "status": "OPEN",
    "createdAt": "2025-02-13T12:00:00Z",
    "updatedAt": "2025-02-13T12:00:00Z"
  }
}
```

> 선거 생성 시 `status`는 항상 `OPEN`으로 시작합니다.

---

### 1.4 선거 수정

```
PUT /admin/api/v1/election/{electionId}
```

**Request Body:** 생성과 동일 구조

**제약사항:**

- 이미 투표가 진행된 선거(투표 수 > 0)의 옵션 개수 변경은 불가
- 옵션 제목, 이미지 등 텍스트/이미지 수정은 허용
- `voteType` 변경 시 관련 필드 재검증 필요

**Response:** 선거 상세와 동일 구조

---

### 1.5 선거 삭제

```
DELETE /admin/api/v1/election/{electionId}
```

**제약사항:**

- 핫픽에 연결된 선거(`linkedHotpickCount > 0`)는 삭제 불가 → 400 에러 반환
- 연결된 핫픽이 없는 경우에만 삭제 가능

**에러 응답 (연결된 핫픽 존재 시):**

```json
{
  "code": 400,
  "message": "이 선거를 사용 중인 핫픽이 있어 삭제할 수 없습니다.",
  "data": null
}
```

---

## 2. HotPick 엔티티 필드 추가

기존 `CreateHotpickRequest` / `UpdateHotpickRequest` / `AdminHotpickResponse`에 아래 필드를 추가합니다.

### 2.1 Request 필드 추가

```diff
{
  "alias": "chicken-vote-2025",
  "title": "...",
  "label": "...",
+ "type": "BUNDLE",
  "imageUrls": ["...", "..."],
+ "categoryCodes": ["FOOD", "TREND"],
+ "deadline": "2025-02-20T18:00:00Z",
  "electionIds": ["e1", "e2", "e3"],
  "meta": { ... },
  "isVisible": true
}
```

| 필드            | 타입                   | 필수 | 설명                                        |
| --------------- | ---------------------- | ---- | ------------------------------------------- |
| `type`          | `"BUNDLE" \| "SINGLE"` | Y    | 핫픽 유형                                   |
| `categoryCodes` | string[]               | N    | 카테고리 코드 배열 (섹션 4 참조, 다중 선택) |
| `deadline`      | datetime               | N    | 마감일시, null이면 상시                     |

### 2.2 Response 필드 추가

```diff
{
  "id": 1,
  "alias": "chicken-vote-2025",
  "title": "...",
  "label": "...",
+ "type": "BUNDLE",
  "imageUrls": ["...", "..."],
+ "categoryCodes": ["FOOD", "TREND"],
+ "deadline": "2025-02-20T18:00:00Z",
+ "status": "OPEN",
  "electionIds": ["e1", "e2", "e3"],
  "meta": { ... },
  "visible": true,
+ "totalVotes": 1234,
  "createdAt": "..."
}
```

| 필드            | 타입                   | 설명               |
| --------------- | ---------------------- | ------------------ |
| `type`          | `"BUNDLE" \| "SINGLE"` | 핫픽 유형          |
| `categoryCodes` | string[]               | 카테고리 코드 배열 |
| `deadline`      | datetime \| null       | 마감일시           |
| `status`        | `"OPEN" \| "CLOSED"`   | 마감 상태          |
| `totalVotes`    | number                 | 총 투표 수         |

### 2.3 검증 규칙 변경

| 유형     | electionIds 개수 | imageUrls | meta |
| -------- | ---------------- | --------- | ---- |
| `BUNDLE` | 2개 이상         | 1장 이상  | 선택 |
| `SINGLE` | 정확히 1개       | 불필요    | 무시 |

---

## 3. HotPick 목록 조회 필터 추가

### 3.1 Admin 목록 조회

```
GET /admin/api/v1/hotpick
```

**추가 Query Parameters:**

| 파라미터       | 타입   | 필수 | 설명                      |
| -------------- | ------ | ---- | ------------------------- |
| `type`         | string | N    | `BUNDLE` \| `SINGLE` 필터 |
| `categoryCode` | string | N    | 카테고리 필터             |
| `status`       | string | N    | `OPEN` \| `CLOSED` 필터   |

### 3.2 Display 메인 조회

```
GET /api/v1/display/main
```

**추가 Query Parameters:**

| 파라미터       | 타입   | 필수 | 설명                             |
| -------------- | ------ | ---- | -------------------------------- |
| `type`         | string | N    | `BUNDLE` \| `SINGLE` (탭 분리용) |
| `categoryCode` | string | N    | 카테고리 필터                    |

---

## 4. Category API (신규)

```
GET /api/v1/categories
```

**Response:**

```json
{
  "code": 200,
  "message": "OK",
  "data": [
    { "code": "LOVE", "name": "연애" },
    { "code": "MARRIAGE", "name": "결혼" },
    { "code": "FINANCE", "name": "재테크" },
    { "code": "WORK", "name": "직장" },
    { "code": "SPORTS", "name": "스포츠" },
    { "code": "FOOD", "name": "음식" },
    { "code": "GAME", "name": "게임" },
    { "code": "CAR", "name": "자동차" },
    { "code": "HEALTH", "name": "건강" },
    { "code": "TREND", "name": "트렌드" }
  ]
}
```

> 카테고리는 DB에 10개가 저장되지만, 화면 필터에는 콘텐츠 밀도를 위해 6개만 노출합니다.
> 화면 필터 매핑: 연애/결혼(`LOVE`+`MARRIAGE`), 재테크(`FINANCE`), 직장(`WORK`), 스포츠(`SPORTS`), 음식(`FOOD`), 트렌드(`TREND`)
> 필터에 포함되지 않는 카테고리(게임, 자동차, 건강)의 핫픽은 "전체" 탭에서만 노출됩니다.

---

## 5. 마감 시스템

### 5.1 자동 마감 처리

- `deadline`이 도래한 핫픽의 `status`를 `OPEN` → `CLOSED`로 자동 전환하는 **서버 스케줄러** 필요
- 스케줄링 주기: 1분 단위 권장
- `deadline`이 null인 핫픽은 스케줄러 대상 외

### 5.2 마감된 핫픽 투표 차단

- `status: CLOSED`인 핫픽에 대한 투표(`POST /api/v1/result`) 요청 시 → 400 에러 반환

```json
{
  "code": 400,
  "message": "마감된 투표입니다.",
  "data": null
}
```

---

## 6. Display API 응답 변경

### 6.1 HotPick 상세 응답 필드 추가

기존 `DisplayHotpickDetailResponse`에 아래 필드를 추가합니다.

```diff
{
  "hotpickId": 1,
  "alias": "chicken-vote-2025",
  "title": "...",
  "label": "...",
+ "type": "BUNDLE",
+ "categoryCodes": ["FOOD", "TREND"],
+ "deadline": "2025-02-20T18:00:00Z",
+ "status": "OPEN",
  "imageUrls": ["...", "..."],
  "createdAt": "...",
  "elections": [...]
}
```

### 6.2 Election 응답 필드 추가

기존 `DisplayHotpickElectionResponse`에 아래 필드를 추가합니다.

```diff
{
  "id": "election-001",
  "title": "짜장면 vs 짬뽕",
  "label": "...",
+ "voteType": "IMAGE",
+ "mainImageUrl": null,
  "options": [
    {
      "id": "opt-001",
      "title": "짜장면",
-     "imageUrl": "https://cdn.example.com/jajang.jpg"
+     "imageUrl": "https://cdn.example.com/jajang.jpg"
    }
  ]
}
```

> `options[].imageUrl`은 `TEXT` 유형일 때 null이 됩니다. 기존에는 항상 필수였으나, 이제 optional로 변경됩니다.

### 6.3 메인 응답 필드 추가

기존 `DisplayHotpickResponse` (메인 목록 아이템)에 아래 필드를 추가합니다.

```diff
{
  "id": 1,
  "alias": "chicken-vote-2025",
  "title": "...",
  "label": "...",
+ "type": "BUNDLE",
+ "categoryCodes": ["FOOD", "TREND"],
+ "deadline": "2025-02-20T18:00:00Z",
+ "status": "OPEN",
  "imageUrls": ["...", "..."],
  "createdAt": "...",
  "participantsCount": 1234
}
```

---

## 7. 변경하지 않는 항목

- `POST /api/v1/result` — 기존 투표 결과 생성 로직 유지 (SINGLE일 때도 동일 구조)
- Comment API 전체 — 변경 범위 외
- `option`, `optionId` 관련 필드 — 변경 범위 외
- Result 내부 구조 (`resultLabel`, `resultType` 등) — 변경 범위 외
- Pre-signed URL API — 변경 없음

---

## 8. 요청 사항

1. 위 변경사항을 반영한 **새 OpenAPI 스펙(api-docs.yaml)** 제공 부탁드립니다.
2. Election CRUD API는 **신규 개발**입니다.
3. HotPick 엔티티 필드 추가 및 검증 규칙 변경은 **기존 API 확장**입니다.
4. Category API는 **신규 개발**입니다.
5. 마감 스케줄러는 **서버 내부 구현** 사항입니다.
6. 기존 `/admin/api/v1/item/{itemId}` (console 프록시) API는 마이그레이션 완료 후 **폐기 예정**입니다.
7. FE에서는 스펙 수신 후 `orval` 재생성 + 코드 개발을 진행합니다.
8. 기존 API와의 하위호환은 필요하지 않습니다 (동시 배포 예정).
