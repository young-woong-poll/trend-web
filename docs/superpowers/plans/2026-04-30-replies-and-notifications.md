# 대댓글 & 알림 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 핫픽 댓글에 대댓글(reply)을 달 수 있고, 로그인 유저는 자신의 댓글에 대한 대댓글/좋아요/Compare 초대 참여 알림을 헤더에서 받을 수 있다.

**Architecture:** BE는 이미 구현 완료(`/api/v1/comments/{commentId}/replies` GET/POST, `/api/v1/notifications` 시리즈). FE는 (1) 기존 `CommentBottomSheet` (메인 피드 + 핫픽 상세 공통 사용)의 `CommentList`에 대댓글 expand/작성 UI를 추가하고, (2) `MainHeader`에 알림 벨 + 드롭다운을 추가한다. 데이터 흐름은 React Query v5 (cursor 기반 useInfiniteQuery + 60초 폴링).

**범위 노트:**

- 답글 노출은 `CommentBottomSheet` 안의 `CommentList`만 다룸. `CommentBottomSheet`는 `CardActionsContext`로 글로벌 mount 되므로 메인 피드와 핫픽 상세 두 진입점이 한 번에 커버됨.
- 핫픽 상세 페이지의 `InlineCommentSection`(모달 아닌 인라인 영역)은 본 PR 범위 외 — follow-up.
- 답글 표시는 처음에 5개만 fetch하고 "답글 N개 더 보기" 버튼으로 추가 로드 (무한스크롤 X). 인라인 모달 안에서 자동 무한스크롤은 부적합.
- 개별 알림 read 처리는 BE 미구현. 별도 BE 요청서를 Task 13에서 작성하고, 본 PR에는 "전체 읽음" 버튼만 출시.
- 알림 클릭 → `notification.targetUrl`로 단순 `router.push`. deep-link 자동 스크롤/하이라이트는 BE의 query 형태 확정 후 follow-up.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, React Query v5, SCSS Modules, axios. 생성된 API 클라이언트는 `src/generated/api/client/{comment,notification}/`. 테스트는 type-check + lint + 수동 UI 검증 (이 레포는 단위 테스트가 없고 Playwright E2E와 QA 체크리스트만 사용).

**Tech 검증 명령:**

- `npm run type-check`
- `npm run lint`
- `npm start` (port 3002, https://localhost)

---

## File Structure

### Phase 1: 대댓글 (Replies) — 7 tasks (Task 2.1 추가)

**Create:**

- `src/hooks/api/useReplies.ts` — getReplies / createReply React Query 훅
- `src/components/features/Hotpick/CommentModal/RepliesList.tsx` — 대댓글 목록 (cursor 무한 스크롤)
- `src/components/features/Hotpick/CommentModal/RepliesList.module.scss`
- `src/components/features/Hotpick/CommentModal/ReplyForm.tsx` — 대댓글 작성 폼 (CommentForm의 컴팩트 버전)
- `src/components/features/Hotpick/CommentModal/ReplyForm.module.scss`

**Modify:**

- `src/components/features/Hotpick/CommentModal/CommentItem.tsx` — "답글 N개 보기" 토글 + "답글 달기" 버튼 추가
- `src/components/features/Hotpick/CommentModal/CommentItem.module.scss` — 토글/답글 버튼 스타일 + reply variant 스타일
- `src/components/features/Hotpick/CommentModal/CommentList.tsx` — CommentItem 아래에 RepliesList 렌더
- `src/hooks/api/index.ts` — 신규 훅 re-export
- `src/hooks/api/useComment.ts` — `commentKeys`에 replies 키 추가, 기존 invalidation 영역 확장

### Phase 2: 알림 (Notifications) — 6 tasks

**Create:**

- `src/assets/icon/BellIcon.tsx` — 종 아이콘
- `src/hooks/api/useNotifications.ts` — getNotifications (infinite) / getUnreadCount (60s 폴링) / markAllRead
- `src/components/features/Notification/NotificationBell.tsx` — 종 + unread 뱃지 + 드롭다운 토글
- `src/components/features/Notification/NotificationBell.module.scss`
- `src/components/features/Notification/NotificationDropdown.tsx` — 드롭다운 목록
- `src/components/features/Notification/NotificationDropdown.module.scss`
- `src/components/features/Notification/NotificationItem.tsx` — 알림 1개 (actor / type icon / preview / time)
- `src/components/features/Notification/NotificationItem.module.scss`
- `src/components/features/Notification/index.ts` — barrel export

**Modify:**

- `src/components/features/Main/MainHeader/MainHeader.tsx` — 로그인 유저 한정 NotificationBell 삽입 (ProfileDropdown 옆)
- `src/components/features/Main/MainHeader/MainHeader.module.scss` — authSlot gap 조정
- `src/hooks/api/index.ts` — 신규 훅 re-export

---

# Phase 1: 대댓글 (Replies)

## Task 1: useReplies 훅

**Files:**

- Create: `src/hooks/api/useReplies.ts`

- [ ] **Step 1: 파일 생성**

```ts
// src/hooks/api/useReplies.ts
/**
 * 대댓글 API 훅
 *
 * - 목록: cursor 무한 스크롤 (commentId 기준)
 * - 작성: 성공 시 부모 댓글의 replyCount, 부모 목록 캐시 무효화
 */

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { createReply, getReplies } from '@/generated/api/client/comment/comment';
import type { CommentListResponse } from '@/generated/models';
import { commentKeys } from '@/hooks/api/useComment';
import { getTKUID } from '@/lib/tkuid';

export const replyKeys = {
  all: ['replies'] as const,
  list: (commentId: string) => [...replyKeys.all, 'list', commentId] as const,
};

export const useInfiniteReplies = (params: {
  commentId: string;
  size?: number;
  enabled?: boolean;
  isLoggedIn?: boolean;
}) =>
  useInfiniteQuery({
    queryKey: replyKeys.list(params.commentId),
    queryFn: async ({ pageParam }) => {
      const tkuId =
        typeof window !== 'undefined' ? getTKUID({ isLoggedIn: params.isLoggedIn }) : '';
      const result = await getReplies(
        params.commentId,
        { cursor: pageParam, size: params.size ?? 20 },
        { headers: tkuId ? { 'x-tku-id': tkuId } : undefined }
      );
      return result as CommentListResponse;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    enabled: params.enabled ?? true,
    staleTime: 30 * 1000,
  });

export const useCreateReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      commentId: string;
      nickname?: string;
      password?: string;
      content: string;
      isLoggedIn?: boolean;
    }) => {
      const tkuId = typeof window !== 'undefined' ? getTKUID({ isLoggedIn: data.isLoggedIn }) : '';
      const body: Record<string, string> = { content: data.content };
      if (data.nickname) {
        body.nickname = data.nickname;
      }
      if (data.password) {
        body.password = data.password;
      }
      return createReply(data.commentId, body as never, {
        headers: tkuId ? { 'x-tku-id': tkuId } : undefined,
      });
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: replyKeys.list(variables.commentId) });
      // 부모 댓글 목록의 replyCount 갱신을 위해 lists 전체 invalidate
      void queryClient.invalidateQueries({ queryKey: commentKeys.lists() });
    },
  });
};
```

- [ ] **Step 2: 타입 체크**

Run: `npm run type-check`
Expected: 에러 없음

- [ ] **Step 3: index.ts에 export 추가**

```ts
// src/hooks/api/index.ts (기존 파일에 추가)
export { replyKeys, useInfiniteReplies, useCreateReply } from '@/hooks/api/useReplies';
```

- [ ] **Step 4: 린트**

Run: `npm run lint -- src/hooks/api/useReplies.ts src/hooks/api/index.ts`
Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/hooks/api/useReplies.ts src/hooks/api/index.ts
git commit -m "feat(reply): add useReplies / useCreateReply hooks"
```

---

## Task 2: ReplyForm 컴포넌트

**Files:**

- Create: `src/components/features/Hotpick/CommentModal/ReplyForm.tsx`
- Create: `src/components/features/Hotpick/CommentModal/ReplyForm.module.scss`

- [ ] **Step 1: SCSS 작성**

```scss
// src/components/features/Hotpick/CommentModal/ReplyForm.module.scss
@use '@/styles/variables' as *;

.replyForm {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0 12px 36px;
}

.textareaWrapper {
  position: relative;
}

.textarea {
  width: 100%;
  min-height: 56px;
  padding: 10px 12px;
  background: $bg-tertiary;
  border: 1px solid #3a3a3a;
  border-radius: $border-radius-md;
  color: $white;
  font-size: $font-size-14;
  resize: vertical;

  &::placeholder {
    color: $text-tertiary;
  }

  &:focus {
    outline: none;
    border-color: $text-tertiary;
  }

  &.error {
    border-color: $error;
  }
}

.charCount {
  position: absolute;
  right: 8px;
  bottom: 6px;
  font-size: $font-size-12;
  color: $text-tertiary;
  pointer-events: none;
}

.bottomRow {
  display: flex;
  gap: 6px;
  align-items: center;
}

.input {
  height: 32px;
  padding: 0 10px;
  background: $bg-tertiary;
  border: 1px solid #3a3a3a;
  border-radius: $border-radius-sm;
  color: $white;
  font-size: $font-size-12;

  &::placeholder {
    color: $text-tertiary;
  }

  &.error {
    border-color: $error;
  }
}

.nicknameInput {
  flex: 1;
  min-width: 0;
}

.passwordInput {
  width: 90px;
}

.submitButton {
  height: 32px;
  padding: 0 14px;
  background: $bg-tertiary;
  color: $white;
  border: 1px solid $border-placeholder;
  border-radius: $border-radius-sm;
  font-size: $font-size-12;
  font-weight: $font-weight-bold;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.cancelButton {
  height: 32px;
  padding: 0 10px;
  background: transparent;
  color: $text-secondary;
  border: 1px solid #333;
  border-radius: $border-radius-sm;
  font-size: $font-size-12;
  cursor: pointer;
}
```

- [ ] **Step 2: TSX 작성**

```tsx
// src/components/features/Hotpick/CommentModal/ReplyForm.tsx
'use client';

import { useState, type FC } from 'react';

import styles from '@/components/features/Hotpick/CommentModal/ReplyForm.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { useCreateReply } from '@/hooks/api';
import { COMMENT_FORM_LIMITS } from '@/hooks/useCommentForm';

interface ReplyFormProps {
  commentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ReplyForm: FC<ReplyFormProps> = ({ commentId, onSuccess, onCancel }) => {
  const { isLoggedIn } = useAuth();
  const { showToast } = useModal();
  const [content, setContent] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ content: false, nickname: false, password: false });

  const { mutate: createReply, isPending } = useCreateReply();

  const handleSubmit = () => {
    const nextErrors = {
      content: content.trim().length === 0,
      nickname: !isLoggedIn && nickname.trim().length === 0,
      password: !isLoggedIn && password.trim().length < COMMENT_FORM_LIMITS.PASSWORD_MIN_LENGTH,
    };
    setErrors(nextErrors);
    if (nextErrors.content || nextErrors.nickname || nextErrors.password) {
      return;
    }

    createReply(
      {
        commentId,
        content: content.trim(),
        nickname: isLoggedIn ? undefined : nickname.trim(),
        password: isLoggedIn ? undefined : password.trim(),
        isLoggedIn,
      },
      {
        onSuccess: () => {
          setContent('');
          setNickname('');
          setPassword('');
          onSuccess();
        },
        onError: () => showToast('답글 작성에 실패했습니다'),
      }
    );
  };

  return (
    <div className={styles.replyForm}>
      <div className={styles.textareaWrapper}>
        <textarea
          className={`${styles.textarea} ${errors.content ? styles.error : ''}`}
          placeholder="답글을 입력하세요..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={COMMENT_FORM_LIMITS.COMMENT_MAX_LENGTH}
          rows={2}
          disabled={isPending}
        />
        <span className={styles.charCount}>
          {content.length}/{COMMENT_FORM_LIMITS.COMMENT_MAX_LENGTH}
        </span>
      </div>

      <div className={styles.bottomRow}>
        {!isLoggedIn && (
          <>
            <input
              type="text"
              className={`${styles.input} ${styles.nicknameInput} ${errors.nickname ? styles.error : ''}`}
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={COMMENT_FORM_LIMITS.NICKNAME_MAX_LENGTH}
              disabled={isPending}
            />
            <input
              type="password"
              className={`${styles.input} ${styles.passwordInput} ${errors.password ? styles.error : ''}`}
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={COMMENT_FORM_LIMITS.PASSWORD_MAX_LENGTH}
              disabled={isPending}
              autoComplete="new-password"
              data-1p-ignore
              data-lpignore="true"
            />
          </>
        )}
        <button
          type="button"
          className={styles.cancelButton}
          onClick={onCancel}
          disabled={isPending}
        >
          취소
        </button>
        <button
          type="button"
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={isPending}
        >
          답글
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: 타입 체크 + 린트**

Run: `npm run type-check && npm run lint -- src/components/features/Hotpick/CommentModal/ReplyForm.tsx`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/components/features/Hotpick/CommentModal/ReplyForm.tsx src/components/features/Hotpick/CommentModal/ReplyForm.module.scss
git commit -m "feat(reply): add ReplyForm component"
```

---

## Task 3: RepliesList 컴포넌트

**Files:**

- Create: `src/components/features/Hotpick/CommentModal/RepliesList.tsx`
- Create: `src/components/features/Hotpick/CommentModal/RepliesList.module.scss`

- [ ] **Step 1: SCSS 작성**

```scss
// src/components/features/Hotpick/CommentModal/RepliesList.module.scss
@use '@/styles/variables' as *;

.repliesList {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 0 8px 36px;
  border-left: 1px solid #2a2a2a;
  margin-left: 12px;
}

.replyItem {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 8px;
}

.empty,
.loading {
  font-size: $font-size-12;
  color: $text-tertiary;
  padding: 8px 0 8px 36px;
}

.observerTarget {
  height: 1px;
}

.loadMoreSpinner {
  font-size: $font-size-12;
  color: $text-tertiary;
  text-align: center;
  padding: 8px 0;
}
```

- [ ] **Step 2: TSX 작성**

```tsx
// src/components/features/Hotpick/CommentModal/RepliesList.tsx
'use client';

import { useEffect, useRef, type FC } from 'react';

import { CommentItem } from '@/components/features/Hotpick/CommentModal/CommentItem';
import styles from '@/components/features/Hotpick/CommentModal/RepliesList.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import { useInfiniteReplies } from '@/hooks/api';
import type { CommentItem as CommentItemType } from '@/types/comment';

interface RepliesListProps {
  parentCommentId: string;
  onLikeClick: (commentId: string, liked: boolean) => void;
  onEditRequest: (comment: CommentItemType) => void;
  onDeleteRequest: (comment: CommentItemType) => void;
}

export const RepliesList: FC<RepliesListProps> = ({
  parentCommentId,
  onLikeClick,
  onEditRequest,
  onDeleteRequest,
}) => {
  const { isLoggedIn } = useAuth();
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteReplies({
    commentId: parentCommentId,
    isLoggedIn,
    size: 20,
  });

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    const target = observerTarget.current;
    if (target) {
      observer.observe(target);
    }
    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return <div className={styles.loading}>답글을 불러오는 중...</div>;
  }

  const replies = data?.pages.flatMap((page) => page.comments ?? []) ?? [];

  if (replies.length === 0) {
    return <div className={styles.empty}>아직 답글이 없습니다.</div>;
  }

  return (
    <div className={styles.repliesList}>
      {replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          variant="reply"
          onLikeClick={onLikeClick}
          onEditClick={onEditRequest}
          onDeleteClick={onDeleteRequest}
          onReplyClick={undefined}
        />
      ))}
      <div ref={observerTarget} className={styles.observerTarget}>
        {isFetchingNextPage && <div className={styles.loadMoreSpinner}>불러오는 중...</div>}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: 타입 체크 (CommentItem prop 시그니처는 Task 4에서 추가하므로 일시적으로 에러)**

Run: `npm run type-check`
Expected: `Property 'variant' does not exist on type 'CommentItemProps'.` 에러 (Task 4에서 해결)

이 에러는 다음 Task 4에서 CommentItem props 확장으로 해결되므로 그대로 다음 Task로 진행.

- [ ] **Step 4: 커밋 (의도적으로 type-check 미통과 상태로 커밋하지 않음 — 다음 Task와 함께 커밋)**

스테이징만 진행:

```bash
git add src/components/features/Hotpick/CommentModal/RepliesList.tsx src/components/features/Hotpick/CommentModal/RepliesList.module.scss
```

---

## Task 4: CommentItem 확장 (답글 토글 + 답글 달기 버튼)

**Files:**

- Modify: `src/components/features/Hotpick/CommentModal/CommentItem.tsx`
- Modify: `src/components/features/Hotpick/CommentModal/CommentItem.module.scss`

- [ ] **Step 1: CommentItem.tsx 수정**

전체 파일을 다음 내용으로 교체:

```tsx
// src/components/features/Hotpick/CommentModal/CommentItem.tsx
'use client';

import { type FC } from 'react';

import LikeIcon from '@/assets/icon/LikeIcon';
import ProfileAvatar from '@/components/common/ProfileAvatar/ProfileAvatar';
import styles from '@/components/features/Hotpick/CommentModal/CommentItem.module.scss';
import { getRelativeTime, sanitizeComment } from '@/lib/utils';
import type { CommentItem as CommentItemType } from '@/types/comment';

interface CommentItemProps {
  comment: CommentItemType;
  /** 'comment' (기본): 일반 댓글, 'reply': 대댓글 (들여쓰기 + 답글 버튼 숨김) */
  variant?: 'comment' | 'reply';
  /** 펼쳐진 상태 — 'reply N개 보기' 토글에 사용 */
  repliesExpanded?: boolean;
  /** 답글 작성 폼 표시 여부 */
  replyFormOpen?: boolean;
  onLikeClick: (commentId: string, liked: boolean) => void;
  onEditClick: (comment: CommentItemType) => void;
  onDeleteClick: (comment: CommentItemType) => void;
  /** 답글 토글 (replyCount > 0). undefined면 토글 버튼 숨김 (대댓글일 때) */
  onToggleReplies?: () => void;
  /** 답글 작성 폼 토글 (대댓글일 때 undefined) */
  onReplyClick?: () => void;
}

export const CommentItem: FC<CommentItemProps> = ({
  comment,
  variant = 'comment',
  repliesExpanded = false,
  replyFormOpen = false,
  onLikeClick,
  onEditClick,
  onDeleteClick,
  onToggleReplies,
  onReplyClick,
}) => {
  const handleLikeClick = () => {
    onLikeClick(comment.id ?? '', comment.liked ?? false);
  };

  const formatLikeCount = (count: number | undefined): string =>
    (count ?? 0) > 999 ? '999+' : (count ?? 0).toString();

  const isRegisteredUser = !!comment.profileColor;
  const replyCount = comment.replyCount ?? 0;
  const isReply = variant === 'reply';

  return (
    <div className={`${styles.commentItem} ${isReply ? styles.commentItemReply : ''}`}>
      <div className={styles.header}>
        {isRegisteredUser && (
          <ProfileAvatar
            nickname={comment.nickname ?? null}
            profileColor={comment.profileColor ?? ''}
            size={isReply ? 20 : 24}
          />
        )}
        <span className={styles.nickname}>{comment.nickname}</span>
        <span className={styles.time}>
          {getRelativeTime(comment.createdAt ?? '')}
          {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
            <span className={styles.edited}> (수정됨)</span>
          )}
        </span>
      </div>

      <p className={styles.content}>{sanitizeComment(comment.content ?? '')}</p>

      <div className={styles.footer}>
        <button
          type="button"
          className={`${styles.likeButton} ${comment.liked ? styles.liked : ''}`}
          onClick={handleLikeClick}
          aria-label={comment.liked ? '좋아요 취소' : '좋아요'}
        >
          <LikeIcon filled={comment.liked ?? false} className={styles.likeIcon} />
          <span className={styles.likeCount}>{formatLikeCount(comment.likeCount)}</span>
        </button>

        {/* 답글 달기 버튼 (대댓글이 아닐 때만) */}
        {!isReply && onReplyClick && (
          <button
            type="button"
            className={styles.replyButton}
            onClick={onReplyClick}
            aria-expanded={replyFormOpen}
          >
            {replyFormOpen ? '닫기' : '답글'}
          </button>
        )}

        {(!isRegisteredUser || comment.isMine) && (
          <div className={styles.actionButtons}>
            <button
              type="button"
              className={styles.editButton}
              onClick={() => onEditClick(comment)}
              aria-label="댓글 수정"
            >
              수정
            </button>
            <button
              type="button"
              className={styles.deleteButton}
              onClick={() => onDeleteClick(comment)}
              aria-label="댓글 삭제"
            >
              삭제
            </button>
          </div>
        )}
      </div>

      {/* 답글 개수 토글 (replyCount > 0, 대댓글이 아닐 때만) */}
      {!isReply && replyCount > 0 && onToggleReplies && (
        <button
          type="button"
          className={styles.toggleReplies}
          onClick={onToggleReplies}
          aria-expanded={repliesExpanded}
        >
          <span className={styles.toggleArrow}>{repliesExpanded ? '▴' : '▾'}</span>
          답글 {replyCount}개 {repliesExpanded ? '숨기기' : '보기'}
        </button>
      )}
    </div>
  );
};
```

- [ ] **Step 2: CommentItem.module.scss에 스타일 추가**

기존 파일 끝에 다음 블록 추가:

```scss
// reply variant — 들여쓰기 + 폰트 살짝 작게
.commentItemReply {
  font-size: $font-size-12;

  .nickname {
    font-size: $font-size-12;
  }

  .content {
    font-size: $font-size-13;
  }
}

// 답글 달기 버튼
.replyButton {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 8px;
  background: transparent;
  border: 1px solid #333;
  border-radius: $border-radius-sm;
  color: $text-secondary;
  font-size: $font-size-12;
  cursor: pointer;
  margin-left: 8px;

  &:hover {
    color: $white;
    background: rgba(255, 255, 255, 0.05);
  }
}

// 답글 N개 보기 토글
.toggleReplies {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  padding: 4px 0;
  background: transparent;
  border: none;
  color: $text-tertiary;
  font-size: $font-size-12;
  font-weight: $font-weight-medium;
  cursor: pointer;
  align-self: flex-start;

  &:hover {
    color: $white;
  }
}

.toggleArrow {
  display: inline-block;
  width: 12px;
  text-align: center;
}
```

기존 SCSS에 `$font-size-13`이 정의되지 않았으면 직접 값으로:

```scss
.content {
  font-size: 13px;
}
```

확인 명령:

```bash
grep -n "font-size-13" src/styles/_variables.scss
```

Expected: 매칭 없음 → 위에서 직접 값 `13px` 사용

- [ ] **Step 3: 타입 체크**

Run: `npm run type-check`
Expected: 에러 없음 (Task 3의 RepliesList도 타입 통과)

- [ ] **Step 4: 린트**

Run: `npm run lint -- src/components/features/Hotpick/CommentModal/CommentItem.tsx src/components/features/Hotpick/CommentModal/RepliesList.tsx`
Expected: 에러 없음

- [ ] **Step 5: 커밋 (Task 3과 함께)**

```bash
git add src/components/features/Hotpick/CommentModal/CommentItem.tsx src/components/features/Hotpick/CommentModal/CommentItem.module.scss src/components/features/Hotpick/CommentModal/RepliesList.tsx src/components/features/Hotpick/CommentModal/RepliesList.module.scss
git commit -m "feat(reply): add RepliesList + extend CommentItem with reply toggle"
```

---

## Task 5: CommentList 통합 (답글 토글/폼 상태 + 렌더 연결)

**Files:**

- Modify: `src/components/features/Hotpick/CommentModal/CommentList.tsx`

- [ ] **Step 1: 전체 파일 교체**

```tsx
// src/components/features/Hotpick/CommentModal/CommentList.tsx
'use client';

import { useEffect, useRef, useState, type FC } from 'react';

import { CommentItem } from '@/components/features/Hotpick/CommentModal/CommentItem';
import { CommentItemSkeleton } from '@/components/features/Hotpick/CommentModal/CommentItemSkeleton';
import styles from '@/components/features/Hotpick/CommentModal/CommentList.module.scss';
import { RepliesList } from '@/components/features/Hotpick/CommentModal/RepliesList';
import { ReplyForm } from '@/components/features/Hotpick/CommentModal/ReplyForm';
import { useAuth } from '@/contexts/AuthContext';
import { useInfiniteComments } from '@/hooks/api';
import { getTKUID } from '@/lib/tkuid';
import type { CommentItem as CommentItemType } from '@/types/comment';

interface CommentListProps {
  slug: string;
  electionId: string;
  sort: 'latest' | 'popular';
  onEditRequest: (comment: CommentItemType) => void;
  onDeleteRequest: (comment: CommentItemType) => void;
  onLikeClick: (commentId: string, liked: boolean) => void;
}

export const CommentList: FC<CommentListProps> = ({
  slug,
  electionId,
  sort,
  onEditRequest,
  onDeleteRequest,
  onLikeClick,
}) => {
  const { isLoggedIn } = useAuth();
  const tkuId = getTKUID({ isLoggedIn });
  const { data, isLoading, isFetching, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteComments({ slug, electionId, sort, size: 20, tkuId });

  // 댓글별 expanded 상태 (답글 보기 / 답글 폼)
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [openReplyForms, setOpenReplyForms] = useState<Set<string>>(new Set());

  const isSortChanging = isFetching && !isLoading && !isFetchingNextPage;
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }
    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const toggleReplyForm = (commentId: string) => {
    setOpenReplyForms((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const handleReplySuccess = (commentId: string) => {
    // 답글 작성 성공 → 답글 목록 자동 펼치고 폼 닫기
    setExpandedReplies((prev) => new Set(prev).add(commentId));
    setOpenReplyForms((prev) => {
      const next = new Set(prev);
      next.delete(commentId);
      return next;
    });
  };

  if (isLoading || isSortChanging) {
    return (
      <div className={styles.commentList}>
        <CommentItemSkeleton count={5} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.statusContainer}>
        <p className={styles.errorText}>댓글을 불러오는데 실패했습니다.</p>
        <p className={styles.errorHint}>잠시 후 다시 시도해주세요.</p>
      </div>
    );
  }

  const comments = data?.pages.flatMap((page) => page.comments ?? []) ?? [];

  if (comments.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyText}>아직 댓글이 없습니다.</p>
        <p className={styles.emptyHint}>첫 댓글을 작성해보세요!</p>
      </div>
    );
  }

  return (
    <div className={styles.commentList}>
      {comments.map((comment) => {
        const id = comment.id ?? '';
        const isExpanded = expandedReplies.has(id);
        const isFormOpen = openReplyForms.has(id);

        return (
          <div key={id}>
            <CommentItem
              comment={comment}
              repliesExpanded={isExpanded}
              replyFormOpen={isFormOpen}
              onLikeClick={onLikeClick}
              onEditClick={onEditRequest}
              onDeleteClick={onDeleteRequest}
              onToggleReplies={() => toggleReplies(id)}
              onReplyClick={() => toggleReplyForm(id)}
            />

            {/* 답글 폼 (열림 상태일 때) */}
            {isFormOpen && (
              <ReplyForm
                commentId={id}
                onSuccess={() => handleReplySuccess(id)}
                onCancel={() => toggleReplyForm(id)}
              />
            )}

            {/* 답글 목록 (펼쳐진 상태일 때만 enabled) */}
            {isExpanded && (
              <RepliesList
                parentCommentId={id}
                onLikeClick={onLikeClick}
                onEditRequest={onEditRequest}
                onDeleteRequest={onDeleteRequest}
              />
            )}
          </div>
        );
      })}

      <div ref={observerTarget} className={styles.observerTarget}>
        {isFetchingNextPage && <CommentItemSkeleton count={2} />}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: 타입 체크**

Run: `npm run type-check`
Expected: 에러 없음

- [ ] **Step 3: 린트**

Run: `npm run lint -- src/components/features/Hotpick/CommentModal/CommentList.tsx`
Expected: 에러 없음

- [ ] **Step 4: 수동 검증**

Run: `npm start`
브라우저: `https://localhost/hotpick/<핫픽-슬러그>` 접속 → 댓글 모달 열기 → 댓글에 "답글" 버튼이 보이는지 / "답글 N개 보기" 토글이 동작하는지 / 답글 폼에서 작성하면 목록이 펼쳐지면서 새 답글이 보이는지 확인.

- [ ] **Step 5: 커밋**

```bash
git add src/components/features/Hotpick/CommentModal/CommentList.tsx
git commit -m "feat(reply): wire RepliesList + ReplyForm into CommentList"
```

---

## Task 6: replyCount 캐시 invalidation 정밀화

답글 작성 후 부모 댓글의 `replyCount`가 갱신되도록, 부모 목록 invalidate 외에 개별 캐시 패치를 추가한다 (모든 sort 캐시).

**Files:**

- Modify: `src/hooks/api/useReplies.ts`

- [ ] **Step 1: useCreateReply의 onSuccess에 낙관적 패치 추가**

`useReplies.ts`의 `useCreateReply`를 다음으로 교체:

```ts
export const useCreateReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      commentId: string;
      nickname?: string;
      password?: string;
      content: string;
      isLoggedIn?: boolean;
    }) => {
      const tkuId = typeof window !== 'undefined' ? getTKUID({ isLoggedIn: data.isLoggedIn }) : '';
      const body: Record<string, string> = { content: data.content };
      if (data.nickname) {
        body.nickname = data.nickname;
      }
      if (data.password) {
        body.password = data.password;
      }
      return createReply(data.commentId, body as never, {
        headers: tkuId ? { 'x-tku-id': tkuId } : undefined,
      });
    },
    onSuccess: (_data, variables) => {
      // 답글 목록 invalidate
      void queryClient.invalidateQueries({ queryKey: replyKeys.list(variables.commentId) });

      // 부모 댓글의 replyCount를 모든 sort 캐시에서 +1 (낙관적 패치)
      const allSorts: Array<'latest' | 'popular'> = ['latest', 'popular'];
      const lists = queryClient.getQueriesData<{ pages: CommentListResponse[] }>({
        queryKey: commentKeys.lists(),
      });

      lists.forEach(([key, oldData]) => {
        if (!oldData) {
          return;
        }
        queryClient.setQueryData(key, {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            comments: (page.comments ?? []).map((c) =>
              c.id === variables.commentId ? { ...c, replyCount: (c.replyCount ?? 0) + 1 } : c
            ),
          })),
        });
      });
      void allSorts; // 사용 처리 — 패턴 명시용
    },
  });
};
```

(`allSorts` 배열은 의도 표현용; 실제로는 `getQueriesData`가 lists 전체를 가져온다.)

`allSorts`를 사용하지 않는다면 그 줄을 제거:

```ts
// 위 블록에서 allSorts 변수와 마지막 void 줄 삭제
```

- [ ] **Step 2: 타입 체크 + 린트**

Run: `npm run type-check && npm run lint -- src/hooks/api/useReplies.ts`
Expected: 에러 없음

- [ ] **Step 3: 수동 검증**

`npm start` → 댓글에 답글 작성 → 부모 댓글의 "답글 N개" 카운트가 즉시 +1 되는지 확인 (네트워크 응답 없이도 즉시 반영)

- [ ] **Step 4: 커밋**

```bash
git add src/hooks/api/useReplies.ts
git commit -m "feat(reply): optimistically patch parent replyCount on create"
```

---

# Phase 2: 알림 (Notifications)

## Task 7: BellIcon 아이콘 컴포넌트

**Files:**

- Create: `src/assets/icon/BellIcon.tsx`

- [ ] **Step 1: 파일 생성**

```tsx
// src/assets/icon/BellIcon.tsx
import type { FC, SVGProps } from 'react';

interface BellIconProps extends SVGProps<SVGSVGElement> {
  filled?: boolean;
}

const BellIcon: FC<BellIconProps> = ({ filled = false, ...props }) => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M18 16V11C18 7.13401 14.866 4 11 4H13C16.866 4 20 7.13401 20 11V16L21 17V18H3V17L4 16V11C4 7.68629 6.68629 5 10 5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={filled ? 'currentColor' : 'none'}
    />
    <path
      d="M10 21H14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default BellIcon;
```

- [ ] **Step 2: 타입 체크 + 린트**

Run: `npm run type-check && npm run lint -- src/assets/icon/BellIcon.tsx`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/assets/icon/BellIcon.tsx
git commit -m "feat(notif): add BellIcon"
```

---

## Task 8: useNotifications 훅

**Files:**

- Create: `src/hooks/api/useNotifications.ts`
- Modify: `src/hooks/api/index.ts`

- [ ] **Step 1: 훅 파일 생성**

```ts
// src/hooks/api/useNotifications.ts
/**
 * 알림 API 훅
 *
 * - 목록: cursor 무한 스크롤 (로그인 필수)
 * - 미읽은 수: 60초 폴링 (로그인 시), 윈도우 포커스 복귀 시 즉시 갱신
 * - 전체 읽음: 호출 후 unread count + 목록 invalidate
 */

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getNotifications,
  getUnreadCount,
  markAllRead,
} from '@/generated/api/client/notification/notification';
import type { NotificationListResponse, UnreadCountResponse } from '@/generated/models';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

export const useInfiniteNotifications = (params?: { size?: number; enabled?: boolean }) =>
  useInfiniteQuery({
    queryKey: notificationKeys.list(),
    queryFn: async ({ pageParam }) => {
      const result = await getNotifications({
        cursor: pageParam,
        size: params?.size ?? 20,
      });
      return result as NotificationListResponse;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    enabled: params?.enabled ?? true,
    staleTime: 30 * 1000,
  });

/**
 * 미읽은 알림 수 — 60초 폴링 + 포커스 복귀 시 갱신.
 * 로그인 유저에 한해 enabled = true.
 */
export const useUnreadNotificationCount = (enabled: boolean) =>
  useQuery<UnreadCountResponse>({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => getUnreadCount() as Promise<UnreadCountResponse>,
    enabled,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllRead(),
    onSuccess: () => {
      // unread count → 0 으로 즉시 패치
      queryClient.setQueryData<UnreadCountResponse>(notificationKeys.unreadCount(), { count: 0 });
      // 목록의 read 플래그도 모두 true 로 패치
      queryClient.setQueryData<{ pages: NotificationListResponse[] }>(
        notificationKeys.list(),
        (old) => {
          if (!old) {
            return old;
          }
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              notifications: (page.notifications ?? []).map((n) => ({ ...n, read: true })),
            })),
          };
        }
      );
    },
  });
};
```

- [ ] **Step 2: index.ts에 export 추가**

기존 `src/hooks/api/index.ts` 끝에 추가:

```ts
// Notification Hooks
export {
  notificationKeys,
  useInfiniteNotifications,
  useUnreadNotificationCount,
  useMarkAllNotificationsRead,
} from '@/hooks/api/useNotifications';
```

- [ ] **Step 3: 타입 체크 + 린트**

Run: `npm run type-check && npm run lint -- src/hooks/api/useNotifications.ts src/hooks/api/index.ts`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/hooks/api/useNotifications.ts src/hooks/api/index.ts
git commit -m "feat(notif): add useNotifications hooks (list/unread-count/mark-all-read)"
```

---

## Task 9: NotificationItem 컴포넌트

**Files:**

- Create: `src/components/features/Notification/NotificationItem.tsx`
- Create: `src/components/features/Notification/NotificationItem.module.scss`

- [ ] **Step 1: SCSS 작성**

```scss
// src/components/features/Notification/NotificationItem.module.scss
@use '@/styles/variables' as *;

.item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #2a2a2a;
  cursor: pointer;
  background: transparent;
  border-left: none;
  border-right: none;
  border-top: none;
  width: 100%;
  text-align: left;
  color: inherit;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  &.unread {
    background: rgba(255, 0, 255, 0.06);
  }
}

.iconBadge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 999px;
  background: $bg-tertiary;
  color: $white;
  font-size: $font-size-14;
}

.body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.text {
  font-size: $font-size-14;
  color: $white;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actor {
  font-weight: $font-weight-bold;
}

.preview {
  font-size: $font-size-12;
  color: $text-tertiary;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.time {
  font-size: $font-size-12;
  color: $text-tertiary;
}

.unreadDot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: $primary-500;
  flex-shrink: 0;
  align-self: center;
}
```

- [ ] **Step 2: TSX 작성**

```tsx
// src/components/features/Notification/NotificationItem.tsx
'use client';

import { type FC } from 'react';

import { useRouter } from 'next/navigation';

import styles from '@/components/features/Notification/NotificationItem.module.scss';
import { NotificationItemType } from '@/generated/models';
import type { NotificationItem as NotificationItemModel } from '@/generated/models';
import { getRelativeTime } from '@/lib/utils';

interface NotificationItemProps {
  notification: NotificationItemModel;
  onNavigate: () => void;
}

const TYPE_TEXT: Record<string, { verb: string; emoji: string }> = {
  [NotificationItemType.COMMENT_LIKE]: { verb: '내 댓글에 좋아요를 눌렀어요', emoji: '♥' },
  [NotificationItemType.COMMENT_REPLY]: { verb: '내 댓글에 답글을 달았어요', emoji: '↩' },
  [NotificationItemType.COMPARE_LINK_JOIN]: { verb: '비교 링크에 참여했어요', emoji: '✦' },
};

export const NotificationItem: FC<NotificationItemProps> = ({ notification, onNavigate }) => {
  const router = useRouter();

  const handleClick = () => {
    if (notification.targetUrl) {
      router.push(notification.targetUrl);
    }
    onNavigate();
  };

  const typeInfo = notification.type ? TYPE_TEXT[notification.type] : undefined;
  const verb = typeInfo?.verb ?? '새 알림';
  const emoji = typeInfo?.emoji ?? '·';
  const isUnread = notification.read === false;

  return (
    <button
      type="button"
      className={`${styles.item} ${isUnread ? styles.unread : ''}`}
      onClick={handleClick}
      aria-label={`${notification.actorNickname ?? '알 수 없는 유저'}: ${verb}`}
    >
      <span className={styles.iconBadge} aria-hidden>
        {emoji}
      </span>
      <div className={styles.body}>
        <span className={styles.text}>
          <span className={styles.actor}>{notification.actorNickname ?? '익명'}</span>님이 {verb}
        </span>
        {notification.contentPreview && (
          <span className={styles.preview}>{notification.contentPreview}</span>
        )}
        <span className={styles.time}>{getRelativeTime(notification.createdAt ?? '')}</span>
      </div>
      {isUnread && <span className={styles.unreadDot} aria-label="안 읽음" />}
    </button>
  );
};
```

- [ ] **Step 3: 타입 체크 + 린트**

Run: `npm run type-check && npm run lint -- src/components/features/Notification/NotificationItem.tsx`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/components/features/Notification/NotificationItem.tsx src/components/features/Notification/NotificationItem.module.scss
git commit -m "feat(notif): add NotificationItem component"
```

---

## Task 10: NotificationDropdown 컴포넌트

**Files:**

- Create: `src/components/features/Notification/NotificationDropdown.tsx`
- Create: `src/components/features/Notification/NotificationDropdown.module.scss`

- [ ] **Step 1: SCSS 작성**

```scss
// src/components/features/Notification/NotificationDropdown.module.scss
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;

.dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 360px;
  max-height: 480px;
  background: $bg-secondary;
  border: 1px solid #333;
  border-radius: $border-radius-lg;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: $z-index-modal;

  @media (max-width: 480px) {
    position: fixed;
    top: 56px;
    left: 0;
    right: 0;
    width: auto;
    max-height: calc(100vh - 56px);
    border-radius: 0;
  }
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #2a2a2a;
}

.title {
  font-size: $font-size-16;
  font-weight: $font-weight-bold;
  color: $white;
  margin: 0;
}

.markAllButton {
  background: transparent;
  border: none;
  color: $text-secondary;
  font-size: $font-size-12;
  font-weight: $font-weight-medium;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: $border-radius-sm;

  &:hover {
    color: $white;
    background: rgba(255, 255, 255, 0.05);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.scrollArea {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.empty,
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  color: $text-tertiary;
  font-size: $font-size-14;
}

.observerTarget {
  height: 1px;
}

.loadMore {
  padding: 16px;
  text-align: center;
  color: $text-tertiary;
  font-size: $font-size-12;
}
```

- [ ] **Step 2: TSX 작성**

```tsx
// src/components/features/Notification/NotificationDropdown.tsx
'use client';

import { useEffect, useRef, type FC } from 'react';

import styles from '@/components/features/Notification/NotificationDropdown.module.scss';
import { NotificationItem } from '@/components/features/Notification/NotificationItem';
import { useInfiniteNotifications, useMarkAllNotificationsRead } from '@/hooks/api';

interface NotificationDropdownProps {
  unreadCount: number;
  onClose: () => void;
}

export const NotificationDropdown: FC<NotificationDropdownProps> = ({ unreadCount, onClose }) => {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteNotifications({ size: 20 });
  const { mutate: markAll, isPending: isMarking } = useMarkAllNotificationsRead();

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    const target = observerTarget.current;
    if (target) {
      observer.observe(target);
    }
    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const notifications = data?.pages.flatMap((page) => page.notifications ?? []) ?? [];
  const handleMarkAll = () => markAll();

  return (
    <div className={styles.dropdown} role="dialog" aria-label="알림">
      <div className={styles.header}>
        <h2 className={styles.title}>알림</h2>
        <button
          type="button"
          className={styles.markAllButton}
          onClick={handleMarkAll}
          disabled={unreadCount === 0 || isMarking}
        >
          전체 읽음
        </button>
      </div>

      <div className={styles.scrollArea}>
        {isLoading ? (
          <div className={styles.loading}>불러오는 중...</div>
        ) : notifications.length === 0 ? (
          <div className={styles.empty}>아직 알림이 없습니다.</div>
        ) : (
          <>
            {notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} onNavigate={onClose} />
            ))}
            <div ref={observerTarget} className={styles.observerTarget}>
              {isFetchingNextPage && <div className={styles.loadMore}>불러오는 중...</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: 타입 체크 + 린트**

Run: `npm run type-check && npm run lint -- src/components/features/Notification/NotificationDropdown.tsx`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/components/features/Notification/NotificationDropdown.tsx src/components/features/Notification/NotificationDropdown.module.scss
git commit -m "feat(notif): add NotificationDropdown component"
```

---

## Task 11: NotificationBell 컴포넌트 + barrel export

**Files:**

- Create: `src/components/features/Notification/NotificationBell.tsx`
- Create: `src/components/features/Notification/NotificationBell.module.scss`
- Create: `src/components/features/Notification/index.ts`

- [ ] **Step 1: SCSS 작성**

```scss
// src/components/features/Notification/NotificationBell.module.scss
@use '@/styles/variables' as *;

.wrapper {
  position: relative;
}

.bellButton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  border-radius: 999px;
  color: $white;
  cursor: pointer;
  position: relative;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
}

.bellIcon {
  width: 22px;
  height: 22px;
}

.badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: $primary-gradient;
  color: $white;
  font-size: 10px;
  font-weight: $font-weight-bold;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
```

- [ ] **Step 2: TSX 작성**

```tsx
// src/components/features/Notification/NotificationBell.tsx
'use client';

import { useCallback, useEffect, useRef, useState, type FC } from 'react';

import BellIcon from '@/assets/icon/BellIcon';
import styles from '@/components/features/Notification/NotificationBell.module.scss';
import { NotificationDropdown } from '@/components/features/Notification/NotificationDropdown';
import { useUnreadNotificationCount } from '@/hooks/api';

interface NotificationBellProps {
  /** 로그인 상태일 때만 fetch 수행 */
  enabled: boolean;
}

export const NotificationBell: FC<NotificationBellProps> = ({ enabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data } = useUnreadNotificationCount(enabled);
  const unreadCount = data?.count ?? 0;

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  if (!enabled) {
    return null;
  }

  const badgeText = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={styles.bellButton}
        onClick={toggle}
        aria-label={unreadCount > 0 ? `알림 ${unreadCount}개` : '알림'}
        aria-expanded={isOpen}
      >
        <BellIcon className={styles.bellIcon} />
        {unreadCount > 0 && <span className={styles.badge}>{badgeText}</span>}
      </button>
      {isOpen && <NotificationDropdown unreadCount={unreadCount} onClose={close} />}
    </div>
  );
};
```

- [ ] **Step 3: barrel export**

```ts
// src/components/features/Notification/index.ts
export { NotificationBell } from '@/components/features/Notification/NotificationBell';
```

- [ ] **Step 4: 타입 체크 + 린트**

Run: `npm run type-check && npm run lint -- src/components/features/Notification`
Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/components/features/Notification/NotificationBell.tsx src/components/features/Notification/NotificationBell.module.scss src/components/features/Notification/index.ts
git commit -m "feat(notif): add NotificationBell with badge + dropdown toggle"
```

---

## Task 12: MainHeader에 알림 벨 통합

**Files:**

- Modify: `src/components/features/Main/MainHeader/MainHeader.tsx`
- Modify: `src/components/features/Main/MainHeader/MainHeader.module.scss`

- [ ] **Step 1: MainHeader.tsx에 NotificationBell 삽입**

`MainHeader.tsx` 상단에 import 추가:

```tsx
import { NotificationBell } from '@/components/features/Notification';
```

기존 `authSlot` 두 곳(minimal + 일반)에서 `<ProfileDropdown />`을 다음으로 교체:

```tsx
<>
  <NotificationBell enabled={isLoggedIn} />
  <ProfileDropdown />
</>
```

minimal 케이스 예시 (라인 124~138 부근):

```tsx
{minimal ? (
  <div className={styles.authSlot}>
    {!isLoading &&
      (isLoggedIn ? (
        <>
          <NotificationBell enabled={isLoggedIn} />
          <ProfileDropdown />
        </>
      ) : (
        <button
          type="button"
          className={styles.loginButton}
          onClick={() => requireLogin('header')}
        >
          <span className={styles.loginText}>로그인</span>
          <UserIcon className={styles.loginIcon} width={20} height={20} />
        </button>
      ))}
  </div>
) : ...
```

일반 케이스(라인 194~208 부근)도 동일하게 `<ProfileDropdown />` → `<NotificationBell ... /> + <ProfileDropdown />`로 교체.

- [ ] **Step 2: MainHeader.module.scss의 authSlot에 gap 추가**

`MainHeader.module.scss`에서 `.authSlot` 블록을 찾아 gap 추가:

```scss
.authSlot {
  display: flex;
  align-items: center;
  gap: 4px;
  // 기존 width/height 등은 유지
}
```

기존 정의가 없으면 위 블록을 추가. 다음 명령으로 위치 확인:

```bash
grep -n "authSlot" src/components/features/Main/MainHeader/MainHeader.module.scss
```

- [ ] **Step 3: 타입 체크 + 린트**

Run: `npm run type-check && npm run lint -- src/components/features/Main/MainHeader`
Expected: 에러 없음

- [ ] **Step 4: 수동 검증**

`npm start` → `https://localhost` 접속 → 로그인 후 헤더 우측에 종 아이콘 노출 → 클릭 시 드롭다운 열림 → 비로그인 상태에선 노출 안 됨 확인. 누군가 자기 댓글에 답글을 달면 unread 뱃지 숫자가 60초 이내 (또는 윈도우 포커스 복귀 시) 증가. "전체 읽음" 클릭 시 뱃지 사라짐.

- [ ] **Step 5: 커밋**

```bash
git add src/components/features/Main/MainHeader/MainHeader.tsx src/components/features/Main/MainHeader/MainHeader.module.scss
git commit -m "feat(notif): wire NotificationBell into MainHeader"
```

---

# 종합 검증

모든 Task 완료 후 다음을 실행해 회귀 없는지 확인.

- [ ] **Step 1: 전체 타입 체크**

Run: `npm run type-check`
Expected: 에러 없음

- [ ] **Step 2: 전체 린트**

Run: `npm run lint`
Expected: 에러 없음

- [ ] **Step 3: 빌드 검증**

Run: `npm run build`
Expected: 빌드 성공

- [ ] **Step 4: QA 체크리스트 (수동)**

`https://localhost` 접속 후:

**대댓글:**

- [ ] 로그인 상태에서 핫픽 상세 → 댓글 모달 → 댓글에 "답글" 버튼 클릭 → 폼 열림
- [ ] 폼에서 답글 작성 → 답글 폼 닫히고 부모 댓글 아래 답글 펼쳐짐
- [ ] 부모 댓글의 "답글 N개 보기" 카운트가 +1
- [ ] "답글 N개 보기" 클릭 → 토글 (열림/닫힘)
- [ ] 비로그인 상태 → 답글 폼에 닉네임/비밀번호 입력 필수
- [ ] 답글 안에서 "답글" 버튼은 노출되지 않음 (대댓글의 대댓글 X)
- [ ] 답글 좋아요 동작
- [ ] 답글 수정/삭제 (본인/비로그인 본인 인증)

**알림:**

- [ ] 비로그인 → 헤더에 종 아이콘 없음
- [ ] 로그인 → 헤더에 종 아이콘 노출
- [ ] 미읽은 알림 있을 때 뱃지 숫자 표시 (99+ 처리)
- [ ] 종 클릭 → 드롭다운 오픈, 다시 클릭 또는 ESC → 닫힘
- [ ] 드롭다운 외부 클릭 → 닫힘
- [ ] 알림 항목 클릭 → targetUrl로 이동 + 드롭다운 닫힘
- [ ] "전체 읽음" 클릭 → 모든 항목 read 처리, 뱃지 사라짐
- [ ] 알림 0개일 때 빈 메시지 노출
- [ ] 알림이 20개 초과면 무한 스크롤 동작

---

# Self-Review

## 1. Spec coverage

- 대댓글 GET/POST: Tasks 1, 2, 3, 5에서 모두 다룸 ✓
- 댓글 replyCount 표시: Task 4 ✓
- 알림 list/unread-count/read-all: Task 8에서 모두 훅 작성 ✓
- 헤더 통합: Task 12 ✓
- 비로그인 차단: NotificationBell의 `enabled` prop으로 처리 ✓
- 답글의 답글(2-depth)은 BE 스펙에서 미정의 — 본 plan에서 reply 안에선 reply 버튼 안 보이도록 명시 ✓

## 2. Placeholder scan

- 모든 코드 블록은 실제 작동 코드 (TBD/TODO 없음)
- 명령어 모두 구체적 (`npm run type-check` 등)
- "Similar to Task N" 식 참조 없음

## 3. Type consistency

- `NotificationItemType` enum: COMMENT_LIKE, COMMENT_REPLY, COMPARE_LINK_JOIN — Task 9에서 일치
- `replyKeys`, `notificationKeys`, `commentKeys`: 각 훅 파일에서 정의되고 invalidation에 동일 이름으로 사용
- `useInfiniteReplies` / `useCreateReply` / `useInfiniteNotifications` / `useUnreadNotificationCount` / `useMarkAllNotificationsRead` 명명 일관
- `CommentItem` props 시그니처: variant/repliesExpanded/replyFormOpen/onToggleReplies/onReplyClick — Task 4에서 정의되고 Task 3, 5에서 동일하게 사용

## 가정 / 알려진 제약

- BE의 friend meta endpoint 등 다른 엔드포인트와 동일하게, axios 인터셉터가 BaseResponse를 unwrap한다고 가정 (기존 useComment 패턴 그대로 따름).
- 실제 BE가 답글의 답글을 허용하더라도, 본 plan에서는 1-depth만 노출 (UI 단순화). 추후 확장 가능.
- Notification API의 `read` 토글은 전체 읽음 외 개별 토글 BE 없음. 클릭 시 해당 항목만 read 처리하는 기능은 별도 BE 추가 후 작업.
- 카카오/이메일 push 알림은 본 plan 범위 외 (FE 인앱 표시만).
