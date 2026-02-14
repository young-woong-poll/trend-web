# API 마이그레이션 요청: Trend → Hotpick / Item → Election

## 배경

서비스 도메인 용어 재정의에 따라 API 전반의 네이밍을 변경합니다.

- **Trend → Hotpick**: 선거를 여러개 묶은 단위
- **Item → Election**: 핫픽을 구성하는 개별 선거 (다양한 종류 가능하도록 확장 예정)

---

## 1. 엔드포인트 URL 변경

### Display API

| 현재                                     | 변경 후                                      | 설명           |
| ---------------------------------------- | -------------------------------------------- | -------------- |
| `GET /api/v1/display/trend/{trendAlias}` | `GET /api/v1/display/hotpick/{hotpickAlias}` | 핫픽 상세 조회 |

### Trend → Hotpick API

| 현재                                           | 변경 후                                                    | 설명                    |
| ---------------------------------------------- | ---------------------------------------------------------- | ----------------------- |
| `GET /api/v1/trend/{trendAlias}/item/{itemId}` | `GET /api/v1/hotpick/{hotpickAlias}/election/{electionId}` | 선거별 옵션 카운트 조회 |

### Comment API

| 현재                                                        | 변경 후                                                                 | 설명           |
| ----------------------------------------------------------- | ----------------------------------------------------------------------- | -------------- |
| `GET /api/v1/display/trend/{trendId}/item/{itemId}/comment` | `GET /api/v1/display/hotpick/{hotpickId}/election/{electionId}/comment` | 선거 댓글 조회 |
| `GET /api/v1/comment/{trendId}/item/{itemId}/count`         | `GET /api/v1/comment/{hotpickId}/election/{electionId}/count`           | 댓글 개수 조회 |

### Admin API

| 현재                                   | 변경 후                                    | 설명            |
| -------------------------------------- | ------------------------------------------ | --------------- |
| `GET /admin/api/v1/trend`              | `GET /admin/api/v1/hotpick`                | 핫픽 목록 조회  |
| `POST /admin/api/v1/trend`             | `POST /admin/api/v1/hotpick`               | 핫픽 생성       |
| `PUT /admin/api/v1/trend/{trendId}`    | `PUT /admin/api/v1/hotpick/{hotpickId}`    | 핫픽 수정       |
| `DELETE /admin/api/v1/trend/{trendId}` | `DELETE /admin/api/v1/hotpick/{hotpickId}` | 핫픽 삭제       |
| `GET /admin/api/v1/trend/check`        | `GET /admin/api/v1/hotpick/check`          | alias 중복 체크 |

---

## 2. 스키마(타입명) 변경

| 현재                         | 변경 후                          |
| ---------------------------- | -------------------------------- |
| `DisplayTrendResponse`       | `DisplayHotpickResponse`         |
| `DisplayTrendDetailResponse` | `DisplayHotpickDetailResponse`   |
| `DisplayTrendItemResponse`   | `DisplayHotpickElectionResponse` |
| `DisplayTrendOptionResponse` | `DisplayHotpickOptionResponse`   |
| `TrendItemOptionsResponse`   | `HotpickElectionOptionsResponse` |
| `TrendNavigationResponse`    | `HotpickNavigationResponse`      |
| `TrendNavItem`               | `HotpickNavItem`                 |
| `CreateTrendRequest`         | `CreateHotpickRequest`           |
| `UpdateTrendRequest`         | `UpdateHotpickRequest`           |
| `TrendResponse`              | `HotpickResponse`                |
| `AdminTrendResponse`         | `AdminHotpickResponse`           |
| `TrendAliasCheckResponse`    | `HotpickAliasCheckResponse`      |
| `TrendMeta`                  | `HotpickMeta`                    |
| `TrendMetaRequest`           | `HotpickMetaRequest`             |
| `TrendResultType`            | `HotpickResultType`              |
| `SelectedItem`               | `SelectedElection`               |

---

## 3. 필드명 변경 (상세)

### DisplayMainResponse (메인 화면 응답)

```diff
{
-  "fixedTrends": [...],
+  "fixedHotpicks": [...],
-  "trends": [...],
+  "hotpicks": [...],
   "hasMore": true,
   "nextCursor": 10,
   "totalCount": 50
}
```

### DisplayHotpickDetailResponse (구 DisplayTrendDetailResponse)

```diff
{
-  "trendId": 1,
+  "hotpickId": 1,
   "alias": "love-trend-2025",
   "title": "...",
   "label": "...",
   "imageUrls": [...],
   "createdAt": "...",
-  "items": [...]
+  "elections": [...]
}
```

### CreateResultRequest (투표 결과 생성)

```diff
{
-  "trendId": 1,
+  "hotpickId": 1,
-  "selectedItems": [
+  "selectedElections": [
     {
-      "itemId": "q1",
+      "electionId": "q1",
       "optionId": "q1-o1"
     }
   ]
}
```

### CreateCommentRequest (댓글 작성)

```diff
{
-  "trendId": 1,
+  "hotpickId": 1,
-  "itemId": "q1",
+  "electionId": "q1",
   "nickname": "...",
   "password": "...",
   "content": "..."
}
```

### SelectedOption (결과 응답 내 선택된 옵션)

```diff
{
-  "itemId": "q1",
+  "electionId": "q1",
-  "itemTitle": "당신은 어떤 이성에게 끌리나요?",
+  "electionTitle": "당신은 어떤 이성에게 끌리나요?",
   "optionId": "q1-o1",
   "optionTitle": "...",
   "optionImageUrl": "...",
   "percent": 65.3
}
```

---

## 4. OpenAPI 태그 변경

| 현재          | 변경 후          |
| ------------- | ---------------- |
| `Trend`       | `Hotpick`        |
| `Admin Trend` | `Admin Hotpick`  |
| `Admin Item`  | `Admin Election` |

---

## 5. 변경하지 않는 항목

- `electionIds` 필드: 이미 올바른 네이밍이므로 유지
- `option`, `optionId` 관련 필드: 변경 범위 외
- `result` 도메인: 변경 범위 외
- `comment` 도메인 자체: `trendId`/`itemId` 필드만 변경, comment 관련 타입명은 유지
- Result 내부 구조 (`resultLabel`, `resultType` 등): 변경 범위 외

---

## 6. 요청 사항

1. 위 변경 사항을 반영한 **새 OpenAPI 스펙(api-docs.yaml)** 제공 부탁드립니다.
2. FE에서는 스펙 수신 후 `orval` 재생성 + 수동 코드 마이그레이션을 진행합니다.
3. 기존 API와의 하위호환은 필요하지 않습니다 (동시 배포 예정).
