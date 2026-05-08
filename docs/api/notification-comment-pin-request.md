# 알림 → 댓글 Pin 노출 — API 변경 요청

> 작성: 2026-05-08 / 작성자: FE 웅일

## 1. 배경

`COMMENT_LIKE` / `COMMENT_REPLY` 알림 클릭 시 해당 댓글을 핀 영역(YouTube/Facebook 패턴)에 박아 보여주려고 합니다. 이를 위해 두 가지가 필요합니다.

1. 알림 응답에 **부모 댓글 ID** 필드 추가 — 답글일 때 부모 펼침/맥락 표시용
2. **단건 댓글 조회 API** — 핀 영역이 정렬된 페이지네이션과 무관한 별도 뷰라 단건 조회가 필요

## 2. 변경 사항

### 2.1 `NotificationItem` 스키마에 `parentCommentId` 추가

```diff
 NotificationItem:
   id: number
   type: COMMENT_LIKE | COMMENT_REPLY | ...
   ...
   commentId?: string
+  parentCommentId?: string   # commentId가 답글이면 부모 ID, 본문 댓글이면 null
```

### 2.2 `commentId` 의미를 type별로 통일 — **항상 "강조(highlight) 대상 ID"**

기존엔 `COMMENT_REPLY`의 `commentId`가 부모 댓글 ID였는데, 이를 **새로 달린 답글 ID**로 변경합니다. 통일 후 룰:

> `commentId` = 강조할 대상, `parentCommentId` = 답글이면 부모 ID(컨텍스트), 본문이면 null

| type                                | commentId                    | parentCommentId   |
| ----------------------------------- | ---------------------------- | ----------------- |
| `COMMENT_LIKE` (본문 댓글에 좋아요) | 좋아요 받은 댓글 ID          | null              |
| `COMMENT_LIKE` (답글에 좋아요)      | 좋아요 받은 답글 ID          | 그 답글의 부모 ID |
| `COMMENT_REPLY` (내 댓글에 답글)    | **새로 달린 답글 ID** ← 변경 | 부모(내) 댓글 ID  |
| `COMMENT_REPLY` (내 답글에 답글)    | 새로 달린 답글 ID            | 부모 댓글 ID      |

### 2.3 응답 예시

```jsonc
// 답글에 좋아요
{
  "type": "COMMENT_LIKE",
  "commentId": "reply-uuid",
  "parentCommentId": "parent-uuid",
  ...
}

// 내 댓글에 답글 달림
{
  "type": "COMMENT_REPLY",
  "commentId": "new-reply-uuid",   // 새로 달린 답글
  "parentCommentId": "my-parent-uuid",
  ...
}
```

## 3. 단건 댓글 조회 API 신설

```
GET /api/v1/comments/{commentId}
```

응답:

```jsonc
{
  "comment": CommentItem,           // commentId에 해당하는 댓글(본문 또는 답글)
  "parent": CommentItem | null      // commentId가 답글이면 부모 댓글, 본문이면 null
}
```

- 헤더 `x-tku-id`로 `liked` 채워주세요(기존 `getComments`와 동일)
- 댓글이 삭제된 경우: 404 또는 `comment.deleted: true` 중 편한 쪽
- `electionId`/`slug` 없이 `commentId`만으로 조회 가능해야 합니다

## 4. FE 측 동작 (참고)

1. 알림 클릭 → `/hotpick/{slug}#comment={commentId}` 로 이동 (FE에서 URL 조립, BE는 `targetUrl` 안 채워도 됨)
2. 페이지 진입 → hash 파싱 → `GET /comments/{commentId}` 호출
3. 응답으로 핀 영역 렌더:
   - `parent === null` → 본문 댓글 핀
   - `parent !== null` → 부모 핀 + 답글 슬롯에 타겟 답글만 노출
4. "다른 답글 N-1개 보기" 클릭 시 `getReplies(parentId)` 호출, **FE에서 타겟 ID dedupe** (BE 작업 없음)

## 5. 영향 범위

- **BE**
  - `NotificationItem` DTO에 `parentCommentId` 추가
  - `COMMENT_REPLY` 알림 발행 시 `commentId`를 새 답글 ID로 변경
  - `COMMENT_LIKE`도 좋아요 받은 게 답글이면 `parentCommentId` 채움
  - 단건 댓글 조회 엔드포인트 신설
- **FE**
  - 모델 타입 갱신 (orval 재생성)
  - 핀 영역 컴포넌트 + 단건 조회 hook
  - hash 파싱 → 핀 영역 마운트

## 6. 체크리스트

- [ ] `NotificationItem` 스키마에 `parentCommentId` 추가 (Swagger)
- [ ] `COMMENT_REPLY` 알림 발행 시 `commentId` = 새 답글 ID로 변경
- [ ] `COMMENT_LIKE` 알림에서 좋아요 대상이 답글이면 `parentCommentId` 채움
- [ ] `GET /api/v1/comments/{commentId}` 엔드포인트 추가 (응답: `comment`, `parent`)
- [ ] FE: orval 재생성 + 핀 영역 구현
