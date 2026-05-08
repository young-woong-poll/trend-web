# 개별 알림 읽음 처리 — API 신규 요청

> 작성: 2026-04-30 / 작성자: FE 웅일

## 1. 배경 (Why)

현재 알림 시스템은 `POST /api/v1/notifications/read-all`(전체 읽음)만 제공하고
개별 항목 read 처리 API는 없습니다. 그래서 사용자가 알림을 클릭해서 해당
콘텐츠로 이동해도 unread 뱃지 숫자가 줄지 않고, "전체 읽음" 버튼을 눌러야만
정리됩니다.

표준적인 인박스 UX(카카오톡, 페이스북, GitHub 등)는 "확인한 알림 = read" 입니다.
사용자가 클릭한 항목은 자연스럽게 read 상태로 전이되어야 합니다.

**현재 BE 상태 (이미 구현됨)**

- `GET /api/v1/notifications` (목록, 커서 페이지네이션)
- `GET /api/v1/notifications/unread-count`
- `POST /api/v1/notifications/read-all`

**누락**: per-item read 엔드포인트

## 2. 신규 API

### `POST /api/v1/notifications/{notificationId}/read`

| 항목 | 값                                              |
| ---- | ----------------------------------------------- |
| 인증 | 로그인 필수 (본인 알림만 처리 가능)             |
| Path | `notificationId` (long) — `NotificationItem.id` |
| Body | 없음                                            |

**Response 200 OK**

```json
{
  "data": { "unreadCount": 3 },
  "status": 200,
  "message": "OK"
}
```

- `unreadCount`: 처리 후 잔여 unread 수 (FE 캐시 즉시 동기화용)

**Error**

- `404 NOTIFICATION_NOT_FOUND` — 잘못된 id
- `403 FORBIDDEN` — 다른 유저의 알림에 호출
- `200 OK` (idempotent) — 이미 read 상태일 때도 200 + 현재 unreadCount 반환

**왜 idempotent로?**

- 클라이언트 재시도(네트워크 일시 단절 등) 시 두 번째 호출이 409로 실패하면 UI가
  롤백되거나 깜빡거림
- "이미 read이지만 호출됨"은 로직상 동일한 결과(읽음 상태 유지)이므로 200 처리

## 3. FE 개발 스펙

### 3-1. 신규 훅 — `useMarkNotificationRead`

`src/hooks/api/useNotifications.ts`에 추가:

```ts
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) => markRead(notificationId),
    onMutate: async (notificationId) => {
      // 낙관 패치: 해당 항목만 read=true, unreadCount -1
      const prevList = queryClient.getQueryData<{ pages: NotificationListResponse[] }>(
        notificationKeys.list()
      );
      const prevCount = queryClient.getQueryData<UnreadCountResponse>(
        notificationKeys.unreadCount()
      );

      queryClient.setQueryData<{ pages: NotificationListResponse[] }>(
        notificationKeys.list(),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              notifications: (page.notifications ?? []).map((n) =>
                n.id === notificationId ? { ...n, read: true } : n
              ),
            })),
          };
        }
      );

      queryClient.setQueryData<UnreadCountResponse>(notificationKeys.unreadCount(), (old) => ({
        count: Math.max(0, (old?.count ?? 0) - 1),
      }));

      return { prevList, prevCount };
    },
    onError: (_err, _id, ctx) => {
      // 롤백
      if (ctx?.prevList) {
        queryClient.setQueryData(notificationKeys.list(), ctx.prevList);
      }
      if (ctx?.prevCount) {
        queryClient.setQueryData(notificationKeys.unreadCount(), ctx.prevCount);
      }
    },
    onSuccess: (response) => {
      // 서버 권위 unreadCount로 동기화
      queryClient.setQueryData<UnreadCountResponse>(notificationKeys.unreadCount(), {
        count: response.data.unreadCount,
      });
    },
  });
};
```

`markRead` API는 BE 추가 후 orval로 자동 생성될 예정.

### 3-2. NotificationItem 통합

`src/components/features/Notification/NotificationItem.tsx`의 `handleClick`을
다음으로 변경:

```tsx
const { mutate: markRead } = useMarkNotificationRead();

const handleClick = () => {
  if (notification.read === false && notification.id !== undefined) {
    markRead(notification.id);
  }
  if (notification.targetUrl) {
    router.push(notification.targetUrl);
  }
  onNavigate();
};
```

이미 read인 항목 또는 id 없는 항목은 호출 생략. read 처리는 fire-and-forget으로
처리해 navigation을 블록하지 않음.

### 3-3. 영향 범위

- 신규 파일 없음, 기존 두 파일만 수정
- `useNotifications.ts` 끝에 `useMarkNotificationRead` 추가, `index.ts` re-export
- 검색엔진 인덱싱 영향 없음 (notification은 noindex)
- 폴링/포커스 refetch와 충돌 없음 (낙관 패치 후 onSuccess가 서버 권위로 덮음)

## 4. 검증 시나리오

1. 미읽은 알림 3개 → 1개 클릭
   - 클릭 즉시 뱃지 3 → 2 (낙관 패치)
   - 클릭 즉시 항목 read 스타일 적용
   - targetUrl로 이동
   - 서버 응답으로 unreadCount=2 동기화

2. 같은 알림을 빠르게 2번 클릭 (race)
   - 첫 클릭: 낙관 -1, BE 200, count=2 동기화
   - 두 번째 클릭: 낙관 -1, BE 200 (idempotent), count=2 (BE 권위로 복원)

3. 서버 5xx로 실패
   - 낙관 패치 → 서버 실패 → onError 롤백 → 항목 unread 복원, 뱃지 +1 복원

4. 다른 유저의 알림 id로 호출 (이론상 발생 X — UI에 본인 것만 노출)
   - BE 403 → onError 롤백

5. 새로고침 후
   - GET /list 응답에 read=true로 반영되어 있어야 함
   - GET /unread-count도 권위 값 반환

## 5. 출시 순서

1. **BE PR**: 본 endpoint 추가 + swagger.json 갱신
2. **FE follow-up PR**:
   - `npm run swagger && npm run orval`로 generated client 갱신
   - `useNotifications.ts`에 `useMarkNotificationRead` 추가
   - `NotificationItem.tsx`의 `handleClick`에 mutate 호출 삽입
   - 검증 시나리오 1~5 수동 테스트

## 6. 미해결 결정 / Open questions

- BE 응답 body에 `unreadCount`를 함께 내릴지, 별도 GET으로 동기화할지 — 현재 안은 함께 내림 (round-trip 절약)
- "이미 read인 항목 클릭" 케이스를 200으로 처리할지 304로 처리할지 — 현재 안은 200 idempotent

원하는 결정이 다르면 BE팀과 컨센서스 후 본 문서 업데이트
