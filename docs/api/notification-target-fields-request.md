# 알림 이동(target) 필드 추가 — API 변경 요청

> 작성: 2026-05-06 / 작성자: FE 웅일

## 1. 배경 (Why)

현재 알림 클릭 시 FE는 `NotificationItem.targetUrl` 만 보고 라우팅합니다. 그런데
`COMMENT_LIKE` / `COMMENT_REPLY` 알림은 BE 가 `targetUrl` 을 채워주고 있지 않아
**클릭해도 아무 일도 일어나지 않습니다**.

게다가 HotPick 의 댓글/답글 UI 는 별도 페이지가 아니라 바텀시트(`CommentBottomSheet`)
로 떠요. 즉 단순 URL 만으로는 부족하고, 어떤 hotpick · 어떤 election · 어떤 comment
인지를 FE 가 정확히 알아야 시트를 열고 해당 위치로 스크롤할 수 있습니다.

`targetUrl` 에 query/hash 로 다 담는 방식 (`/hotpick/{slug}?comment={electionId}#c-{commentId}`)
도 가능했지만, FE 측 결정으로 **타입 안전한 별도 필드** 추가 방향으로 갑니다.
이유:

- URL 형식은 라우팅이 바뀔 때마다 BE 까지 영향
- query 파싱은 누락/오타 시 silent fail
- 별도 필드면 스키마 레벨에서 강제 가능

## 2. 변경 사항

### 2.1 `NotificationItem` 스키마에 필드 추가

```diff
 NotificationItem:
   id: number
   type: COMMENT_LIKE | COMMENT_REPLY | COMPARE_LINK_JOIN | ASK_TETO_EGEN_VOTE
   actorNickname: string
   actorProfileColor: string
   contentPreview: string
   targetUrl?: string
   read: boolean
   createdAt: ISO8601
+  hotpickSlug?: string    # 댓글/좋아요 알림에서 hotpick 식별
+  electionId?: string     # 어떤 투표(선거) 안의 댓글인지
+  commentId?: string      # 어떤 댓글 / 어떤 답글의 부모인지
```

`targetUrl` 은 그대로 유지(선택적). 기존에 채워주던 알림은 계속 그 값을 우선
사용해도 OK.

### 2.2 타입별 필드 채움 매트릭스

| type                 | hotpickSlug | electionId | commentId | targetUrl | 비고                                                            |
| -------------------- | ----------- | ---------- | --------- | --------- | --------------------------------------------------------------- |
| `COMMENT_LIKE`       | ✅          | ✅         | ✅        | (선택)    | 좋아요 받은 내 댓글의 commentId                                 |
| `COMMENT_REPLY`      | ✅          | ✅         | ✅        | (선택)    | 답글이 달린 부모 댓글의 commentId                               |
| `COMPARE_LINK_JOIN`  | -           | -          | -         | ✅        | 기존대로 비교 링크 URL                                          |
| `ASK_TETO_EGEN_VOTE` | -           | -          | -         | (선택)    | FE 폴백 `/ask/teto-egen/my` 사용 중. BE가 채우면 그걸 우선 사용 |

> `commentId` 는 답글(reply)일 때 답글 자체의 ID 가 아니라 **부모 댓글 ID** 를
> 보내주세요. FE 가 해당 댓글로 스크롤·하이라이트 후 그 안의 답글 목록을 펼치는
> 동작이 자연스럽습니다.

### 2.3 응답 예시

```json
// COMMENT_REPLY
{
  "id": 12345,
  "type": "COMMENT_REPLY",
  "actorNickname": "도라에몽",
  "actorProfileColor": "#FF6B6B",
  "contentPreview": "저도 그렇게 생각해요!",
  "hotpickSlug": "couple-money",
  "electionId": "elec_abc123",
  "commentId": "cmt_xyz789",
  "read": false,
  "createdAt": "2026-05-06T10:23:45+09:00"
}

// COMMENT_LIKE
{
  "id": 12346,
  "type": "COMMENT_LIKE",
  "actorNickname": "병훈",
  "actorProfileColor": "#4ECDC4",
  "contentPreview": "이 댓글이 마음에 들어요",
  "hotpickSlug": "career-1",
  "electionId": "elec_def456",
  "commentId": "cmt_uvw321",
  "read": false,
  "createdAt": "2026-05-06T10:24:11+09:00"
}
```

## 3. FE 측 처리 (참고용)

새 필드를 받으면 FE 는 다음과 같이 동작합니다.

```ts
const handleClick = () => {
  // 1) 읽음 처리
  if (notification.id !== undefined && notification.read === false) {
    markRead(notification.id);
  }

  // 2) 이동 — 댓글 타입은 hotpick 페이지로 이동 + 시트 자동 오픈
  if (
    (notification.type === 'COMMENT_LIKE' || notification.type === 'COMMENT_REPLY') &&
    notification.hotpickSlug &&
    notification.electionId
  ) {
    const params = new URLSearchParams({
      openComment: notification.electionId,
      ...(notification.commentId && { focusComment: notification.commentId }),
    });
    router.push(`/hotpick/${notification.hotpickSlug}?${params}`);
    return;
  }

  // 3) 그 외 타입 — 기존 targetUrl 또는 폴백
  const target = notification.targetUrl || FALLBACK_URL_BY_TYPE[notification.type];
  if (target) {
    router.push(target);
  }
};
```

`?openComment=` / `?focusComment=` 는 hotpick 페이지에서 진입 시 시트를 자동
오픈하고 해당 댓글로 스크롤하는 용도. FE 단독으로 처리합니다.

## 4. 영향 범위

- **BE**
  - `NotificationItem` DTO 에 3개 필드 추가
  - 알림 발행 시점에 hotpick/election/comment ID 채움 (댓글 좋아요·답글 트리거 지점)
  - 마이그레이션: 기존 알림은 새 필드 null 로 두고 FE 가 graceful degrade (클릭해도 무동작) — 시간이 지나면 자연스럽게 새 알림으로 대체됨
- **FE**
  - 모델 타입 갱신 (orval 재생성)
  - `NotificationItem` 컴포넌트 클릭 핸들러에 분기 로직 추가
  - hotpick 페이지에서 `?openComment` / `?focusComment` 파싱해서 시트 오픈

## 5. 우선순위

`COMMENT_LIKE` / `COMMENT_REPLY` 알림은 현재 **클릭해도 이동이 안 되는 dead UX**
입니다. 인박스 신뢰도에 직결되므로 우선 처리 부탁드립니다.

## 6. 체크리스트

- [ ] `NotificationItem` 스키마에 `hotpickSlug`, `electionId`, `commentId` 추가 (Swagger)
- [ ] 댓글 좋아요 트리거 지점에서 세 필드 채움
- [ ] 댓글 답글 트리거 지점에서 세 필드 채움 (commentId 는 부모 댓글 ID)
- [ ] 기존 미채움 알림에 대한 graceful fallback 확인 (FE 처리)
- [ ] FE: orval 재생성, 클릭 분기 추가, hotpick 페이지에서 query 파싱 처리
