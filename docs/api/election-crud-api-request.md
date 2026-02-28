# API 개발 요청: Election CRUD + HotPick 확장 + 메인피드 신규 기능

> 선거(Election) 관리를 HotPick 서비스로 내재화하기 위한 서버 API 개발 요청
> 작성일: 2025-02-13
> 수정일: 2026-02-16 (메인피드 신규 기능 추가 — 섹션 9~13)
> 관련 기획: `docs/specs/new-hotpick-election-system.md`, `docs/specs/main-feed-spec.md`

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

- Comment API 전체 — 변경 범위 외
- `option`, `optionId` 관련 필드 — 변경 범위 외
- Result 내부 구조 (`resultLabel`, `resultType` 등) — 변경 범위 외
- Pre-signed URL API — 변경 없음

> **참고:** 기존 `POST /api/v1/result`는 번들 핫픽(5개 투표 세트)에서 계속 사용합니다.
> 싱글 핫픽의 인라인 투표는 **섹션 10의 신규 API**를 사용합니다.

---

## 8. 요청 사항 (기존)

1. 위 변경사항을 반영한 **새 OpenAPI 스펙(api-docs.yaml)** 제공 부탁드립니다.
2. Election CRUD API는 **신규 개발**입니다.
3. HotPick 엔티티 필드 추가 및 검증 규칙 변경은 **기존 API 확장**입니다.
4. Category API는 **신규 개발**입니다.
5. 마감 스케줄러는 **서버 내부 구현** 사항입니다.
6. 기존 `/admin/api/v1/item/{itemId}` (console 프록시) API는 마이그레이션 완료 후 **폐기 예정**입니다.
7. FE에서는 스펙 수신 후 `orval` 재생성 + 코드 개발을 진행합니다.
8. 기존 API와의 하위호환은 필요하지 않습니다 (동시 배포 예정).

---

## 9. [추가] 메인피드 싱글 핫픽 인라인 투표 지원

> 관련 기획: `docs/specs/main-feed-spec.md` 섹션 2, 3, 6
> 추가일: 2026-02-16

### 배경

메인피드 기획서에 따르면, 싱글 핫픽(SINGLE)은 **상세페이지 없이 메인피드 카드 안에서 바로 투표하고 결과를 확인**합니다. 이를 위해 메인피드 API 응답에 싱글 핫픽의 투표 옵션 정보와 사용자 투표 상태를 포함해야 합니다.

### 9.1 메인 피드 응답에 싱글 핫픽 투표 데이터 추가

기존 `DisplayTrendResponse` (메인 목록 아이템)에 싱글 핫픽용 필드를 추가합니다.

```diff
{
  "id": 1,
  "alias": "2026-love",
  "title": "연인의 전 연인 SNS 확인, 어떻게 생각해?",
  "label": "연애",
  "type": "SINGLE",
  "categoryCodes": ["LOVE"],
  "imageUrls": [...],
  "createdAt": "...",
  "participantsCount": 1234,
+ "singleVote": {
+   "electionId": "election-099",
+   "optionA": {
+     "id": "opt-201",
+     "text": "괜찮다"
+   },
+   "optionB": {
+     "id": "opt-202",
+     "text": "절대 안 돼"
+   },
+   "voted": false,
+   "myChoice": null,
+   "voteCountA": null,
+   "voteCountB": null
+ }
}
```

**`singleVote` 필드 설명:**

| 필드         | 타입                   | 설명                              |
| ------------ | ---------------------- | --------------------------------- |
| `electionId` | string                 | 연결된 선거 ID                    |
| `optionA`    | object                 | A 선택지 (`id`, `text`)           |
| `optionB`    | object                 | B 선택지 (`id`, `text`)           |
| `voted`      | boolean                | 현재 사용자의 투표 여부           |
| `myChoice`   | `"A"` \| `"B"` \| null | 내가 선택한 옵션 (미투표 시 null) |
| `voteCountA` | number \| null         | A 옵션 투표 수 (미투표 시 null)   |
| `voteCountB` | number \| null         | B 옵션 투표 수 (미투표 시 null)   |

**조건:**

- `type: "SINGLE"`인 핫픽에만 `singleVote` 필드를 포함합니다.
- `type: "BUNDLE"`인 핫픽은 `singleVote`가 null 또는 미포함입니다.
- `voted: true`일 때만 `myChoice`, `voteCountA`, `voteCountB`에 값이 들어갑니다.
- `voted: false`일 때는 `myChoice`는 null, 투표 수도 null입니다 (투표 전에는 결과 비공개).

### 9.2 `x-tku-id` 헤더 수신

메인 피드 API에서 사용자 투표 상태를 판단하기 위해 `x-tku-id` 헤더를 수신합니다.

```
GET /api/v1/display/main
Headers:
  x-tku-id: 550e8400-e29b-41d4-a716-446655440000
```

**동작:**

- `x-tku-id` 헤더가 존재하면: 해당 UUID로 각 싱글 핫픽의 투표 여부를 조회하여 `singleVote.voted`, `myChoice`, 투표 수를 채웁니다.
- `x-tku-id` 헤더가 없으면: 모든 싱글 핫픽을 `voted: false`로 반환합니다.

> **참고:** 이 헤더는 기존 댓글 좋아요 API(`POST /api/v1/comment/{commentId}/like`)에서 이미 사용 중인 패턴입니다. 동일한 방식으로 처리해 주세요.

---

## 10. [추가] 싱글 핫픽 인라인 투표 API (신규)

싱글 핫픽은 메인피드 카드에서 직접 투표하므로, 기존 번들용 `POST /api/v1/result`와 별도의 경량 투표 API가 필요합니다.

### 10.1 싱글 투표

```
POST /api/v1/single/{hotpickId}/vote
Headers:
  x-tku-id: 550e8400-e29b-41d4-a716-446655440000
```

**Request Body:**

```json
{
  "optionId": "opt-201"
}
```

**성공 Response (200):**

```json
{
  "code": 200,
  "message": "OK",
  "data": {
    "voted": true,
    "myChoice": "A",
    "voteCountA": 765,
    "voteCountB": 470,
    "totalVotes": 1235
  }
}
```

**검증 규칙:**

| 항목        | 규칙                                                           |
| ----------- | -------------------------------------------------------------- |
| `x-tku-id`  | 필수. 없으면 400                                               |
| `hotpickId` | 존재하는 핫픽이어야 함. 없으면 404                             |
| 핫픽 타입   | `SINGLE`이어야 함. `BUNDLE`이면 400                            |
| `optionId`  | 해당 핫픽 선거의 유효한 옵션이어야 함. 없으면 400              |
| 중복 투표   | `x-tku-id + hotpickId` 조합으로 기투표 판단. 중복 시 아래 응답 |
| 마감 상태   | `status: CLOSED`이면 400 ("마감된 투표입니다.")                |

**중복 투표 응답 (409):**

```json
{
  "code": 409,
  "message": "이미 투표한 핫픽입니다.",
  "data": {
    "voted": true,
    "myChoice": "A",
    "voteCountA": 765,
    "voteCountB": 469,
    "totalVotes": 1234
  }
}
```

> 중복 투표 시에도 현재 투표 결과 데이터를 함께 반환합니다. FE에서 결과 화면으로 전환할 때 사용합니다.

---

## 11. [추가] 해시 링크 Anchor 기능

> 관련 기획: `docs/specs/main-feed-spec.md` 섹션 6-6
> 추가일: 2026-02-16

### 배경

메인피드에서 특정 핫픽을 공유하면 `https://hotpick.kr/#2026-love` 형태의 해시 링크가 생성됩니다. 이 링크로 접속 시 해당 핫픽을 포함하는 피드 데이터를 서버에서 제공해야 합니다.

### 11.1 `anchor` 파라미터 추가

기존 `GET /api/v1/display/main`에 `anchor` 쿼리 파라미터를 추가합니다.

```
GET /api/v1/display/main?anchor=2026-love&sort=popular&size=20
Headers:
  x-tku-id: 550e8400-e29b-41d4-a716-446655440000  (선택)
```

**추가 Query Parameters:**

| 파라미터 | 타입   | 필수 | 설명                                                               |
| -------- | ------ | ---- | ------------------------------------------------------------------ |
| `anchor` | string | N    | 기준이 되는 핫픽 alias. 지정 시 해당 핫픽을 포함하는 페이지를 반환 |

### 11.2 서버 동작

1. `anchor` 파라미터가 있으면 해당 alias의 핫픽을 찾는다.
2. 현재 정렬 기준(`sort`)에서 해당 핫픽의 위치를 계산한다.
3. 해당 핫픽을 포함하는 `size`개의 데이터를 반환한다 (앞뒤 균등 배분 또는 해당 핫픽이 포함된 페이지).
4. 응답에 `anchorIndex`, `hasPrevious`, `prevCursor` 필드를 추가한다.
5. `anchor`에 해당하는 핫픽이 없으면 404를 반환한다.

### 11.3 응답 필드 추가

`anchor` 파라미터 사용 시 기존 `DisplayMainResponse`에 아래 필드가 추가됩니다.

```diff
{
  "trends": [
    { "id": 98, "alias": "office-lunch", ... },
    { "id": 99, "alias": "2026-love", ... },
    { "id": 100, "alias": "sports-debate", ... }
  ],
+ "anchorIndex": 1,
  "hasMore": true,
  "nextCursor": 101,
+ "hasPrevious": true,
+ "prevCursor": 97,
  "totalCount": 350
}
```

| 필드          | 타입    | 설명                                           |
| ------------- | ------- | ---------------------------------------------- |
| `anchorIndex` | number  | 응답 `trends` 배열 내에서 anchor 대상의 인덱스 |
| `hasPrevious` | boolean | anchor 이전에 더 많은 데이터가 있는지 여부     |
| `prevCursor`  | number  | 이전 페이지 로딩을 위한 커서 (양방향 스크롤용) |

**`anchor` 미사용 시:**

- `anchorIndex`, `hasPrevious`, `prevCursor`는 null 또는 미포함 (기존 동작과 완전 호환)

### 11.4 우선순위 규칙

| 조합                     | 동작                            |
| ------------------------ | ------------------------------- |
| `anchor`만               | anchor 기준 페이지 반환         |
| `cursor`만               | 기존과 동일 (일반 페이지네이션) |
| `anchor` + `cursor` 동시 | `cursor` 무시, `anchor` 우선    |
| 둘 다 없음               | 기존과 동일 (첫 페이지)         |

### 11.5 Anchor 404 응답

```json
{
  "code": 404,
  "message": "해당 핫픽을 찾을 수 없습니다.",
  "data": null
}
```

---

## 12. [추가] 피드 혼합 배치 비율

> 관련 기획: `docs/specs/main-feed-spec.md` 섹션 1-2
> 추가일: 2026-02-16

### 요구사항

`GET /api/v1/display/main`에서 `type` 파라미터 없이(전체 탭) 조회할 때, **싱글 핫픽 7~10개당 번들 핫픽 1개**를 삽입하여 반환해 주세요.

**배치 예시 (size=20일 때):**

```
응답 순서:
  싱글 #1, 싱글 #2, 싱글 #3, 싱글 #4, 싱글 #5, 싱글 #6, 싱글 #7,
  번들 #1,
  싱글 #8, 싱글 #9, 싱글 #10, 싱글 #11, 싱글 #12, 싱글 #13, 싱글 #14, 싱글 #15,
  번들 #2,
  싱글 #16, 싱글 #17
```

**동작 규칙:**

| 항목                  | 규칙                                        |
| --------------------- | ------------------------------------------- |
| 혼합 비율             | 싱글 7~10개마다 번들 1개 삽입               |
| 번들 부족 시          | 번들이 부족하면 싱글만으로 채움 (에러 아님) |
| `type=SINGLE` 필터 시 | 번들 미포함 (싱글만 반환)                   |
| `type=BUNDLE` 필터 시 | 싱글 미포함 (번들만 반환)                   |
| 정렬                  | 각 유형 내에서 정렬 기준(sort) 적용 후 혼합 |

---

## 13. [추가] 이전 페이지 조회 (양방향 스크롤)

> 관련 기획: `docs/specs/main-feed-spec.md` 섹션 6-6-5
> 추가일: 2026-02-16

### 배경

해시 링크로 피드 중간 지점에 진입한 후, 사용자가 위로 스크롤할 때 이전 데이터를 로딩해야 합니다.

### 13.1 `prevCursor` 기반 이전 페이지 조회

```
GET /api/v1/display/main?cursor={prevCursor}&direction=prev&size=20
```

**추가 Query Parameters:**

| 파라미터    | 타입   | 필수 | 설명                                                           |
| ----------- | ------ | ---- | -------------------------------------------------------------- |
| `direction` | string | N    | `next` (기본) \| `prev`. `prev`이면 커서 기준 이전 데이터 반환 |

**`direction=prev` 동작:**

- `cursor` 값보다 **이전**(정렬 기준에서 앞쪽) 데이터를 `size`만큼 반환
- 응답의 `hasPrevious`가 false이면 더 이상 이전 데이터가 없음을 의미
- 응답 데이터는 정렬 순서대로 반환 (역순 아님)

**Response (direction=prev):**

```json
{
  "trends": [...],
  "hasMore": true,
  "nextCursor": 98,
  "hasPrevious": true,
  "prevCursor": 78,
  "totalCount": 350
}
```

> `direction` 파라미터가 없거나 `next`이면 기존과 완전히 동일하게 동작합니다 (하위 호환).

---

## 14. 요청 사항 종합 (기존 + 추가)

### 기존 요청 (섹션 1~8)

1. Election CRUD API — **신규 개발**
2. HotPick 엔티티 필드 추가 — **기존 API 확장**
3. Category API — **신규 개발**
4. 마감 스케줄러 — **서버 내부 구현**

### 추가 요청 (섹션 9~13)

| #   | 항목                                                           | 유형           | 우선순위 |
| --- | -------------------------------------------------------------- | -------------- | -------- |
| 5   | 메인 피드 응답에 `singleVote` 필드 추가 (섹션 9.1)             | 기존 API 확장  | 높음     |
| 6   | 메인 피드에서 `x-tku-id` 헤더 수신 (섹션 9.2)                  | 기존 API 확장  | 높음     |
| 7   | 싱글 투표 API `POST /api/v1/single/{hotpickId}/vote` (섹션 10) | **신규 개발**  | 높음     |
| 8   | `anchor` 파라미터 + 응답 확장 (섹션 11)                        | 기존 API 확장  | 높음     |
| 9   | 피드 혼합 배치 비율 7~10:1 (섹션 12)                           | 서버 내부 구현 | 중간     |
| 10  | `direction=prev` 이전 페이지 조회 (섹션 13)                    | 기존 API 확장  | 높음     |

### 공통 사항

- 위 변경사항을 반영한 **새 OpenAPI 스펙(api-docs.yaml)** 제공 부탁드립니다.
- FE에서는 스펙 수신 후 `orval` 재생성 + 코드 개발을 진행합니다.
- 기존 API와의 하위호환은 필요하지 않습니다 (동시 배포 예정).
- 기존 `/admin/api/v1/item/{itemId}` (console 프록시) API는 마이그레이션 완료 후 **폐기 예정**입니다.
