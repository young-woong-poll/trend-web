# 카카오 로그인 API 실연동 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 현재 MSW 기반 mock으로 동작하는 카카오 로그인/회원가입/댓글 시스템을 실제 BE API(`/api/v1/...`)에 연동한다.

**Architecture:** Orval로 생성된 API 함수(`src/generated/api/client/`)를 직접 사용하도록 커스텀 훅들을 전환한다. 커스텀 훅들이 `axiosInstance`를 직접 호출하며 `/api/auth/...` URL을 사용하고 있는데, 실제 BE는 `/api/v1/auth/...`를 사용하므로 generated 함수로 교체한다. Signup 요청 형태도 generated 모델(`nickname, gender, birthYear, tkuId?`)에 맞게 수정한다.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Orval (API client generation), TanStack Query v5, Axios

---

## 현황 분석 — 주요 Gap 요약

| #   | 영역                    | 현재 (mock/잘못된 구현)                                  | 목표 (실제 BE API)                                  |
| --- | ----------------------- | -------------------------------------------------------- | --------------------------------------------------- |
| 1   | **URL 접두사**          | `/api/auth/...`, `/api/users/...`                        | `/api/v1/auth/...`, `/api/v1/users/...`             |
| 2   | **Signup 요청**         | `{ nickname, link?: { tkuId, votes, comments, likes } }` | `{ nickname, gender, birthYear, tkuId? }`           |
| 3   | **Login 응답 필드**     | `isSignUp`                                               | `shouldSignup`                                      |
| 4   | **MyPage 페이지네이션** | page 기반 `{ data, meta: { page, totalPages } }`         | cursor 기반 `{ data, nextCursor, hasMore }`         |
| 5   | **토큰 갱신 URL**       | `/api/auth/refresh`                                      | `/api/v1/auth/refresh`                              |
| 6   | **닉네임 API**          | `axiosInstance` 직접 호출 + 잘못된 URL                   | generated `checkNickname()`, `updateProfile()` 사용 |

## 파일 구조 — 수정 대상

| 파일                                                  | 변경 내용                                             |
| ----------------------------------------------------- | ----------------------------------------------------- |
| `src/hooks/api/useAuthApi.ts`                         | generated API 함수로 전환, SignupRequest 타입 수정    |
| `src/contexts/AuthContext.tsx`                        | `LoginResponse.isSignUp` → `shouldSignup` 필드명 변경 |
| `src/app/auth/kakao/callback/page.tsx`                | `isSignUp` → `shouldSignup` 필드명 반영               |
| `src/components/features/Auth/SignupForm.tsx`         | gender/birthYear를 signup API에 전달하도록 수정       |
| `src/hooks/api/useNickname.ts`                        | generated API 함수로 전환                             |
| `src/hooks/api/useMyPage.ts`                          | generated API 함수로 전환, cursor 기반 페이지네이션   |
| `src/components/features/MyPage/MyCommentList.tsx`    | cursor 페이지네이션 응답 구조 반영                    |
| `src/components/features/MyPage/LikedHotpickList.tsx` | cursor 페이지네이션 응답 구조 반영                    |
| `src/lib/axios.ts`                                    | 토큰 갱신 URL `/api/v1/auth/refresh`로 수정           |
| `src/providers/AuthProvider.tsx`                      | 변경된 `useAuthApi` import 반영 확인                  |

---

## Task 1: 토큰 갱신 URL 수정 (`axios.ts`)

가장 기본적인 인프라 수정. 토큰 갱신이 올바른 URL로 호출되어야 이후 모든 인증 API가 동작한다.

**Files:**

- Modify: `src/lib/axios.ts:59,81`

- [ ] **Step 1: 토큰 갱신 URL 수정**

`src/lib/axios.ts`에서 refresh URL을 수정한다:

```typescript
// 변경 전 (Line 59)
if (originalRequest?.url?.includes('/api/auth/refresh')) {

// 변경 후
if (originalRequest?.url?.includes('/api/v1/auth/refresh')) {
```

```typescript
// 변경 전 (Line 81)
await axiosInstance.post('/api/auth/refresh');

// 변경 후
await axiosInstance.post('/api/v1/auth/refresh');
```

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 타입 에러 없음

- [ ] **Step 3: Commit**

```bash
git add src/lib/axios.ts
git commit -m "fix: 토큰 갱신 URL을 /api/v1/auth/refresh로 수정"
```

---

## Task 2: AuthContext — LoginResponse 타입 수정

`LoginResponse`의 `isSignUp` 필드를 BE 응답과 일치하는 `shouldSignup`으로 변경한다.

**Files:**

- Modify: `src/contexts/AuthContext.tsx:12-15`

- [ ] **Step 1: LoginResponse 인터페이스 수정**

```typescript
// 변경 전
export interface LoginResponse {
  user?: User;
  isSignUp: boolean;
  signupToken?: string;
}

// 변경 후
export interface LoginResponse {
  user?: User;
  shouldSignup: boolean;
  signupToken?: string;
}
```

- [ ] **Step 2: 타입 에러 확인**

Run: `npx tsc --noEmit`
Expected: `isSignUp`를 참조하는 곳에서 에러 발생 (KakaoCallback에서 사용 중). 이는 Task 3에서 수정한다.

- [ ] **Step 3: Commit**

```bash
git add src/contexts/AuthContext.tsx
git commit -m "refactor: LoginResponse.isSignUp → shouldSignup (BE 응답 필드명 일치)"
```

---

## Task 3: useAuthApi — Generated API 함수로 전환

커스텀 API 함수들을 Orval generated 함수로 교체한다. URL 문제와 타입 불일치를 한 번에 해결한다.

**Files:**

- Modify: `src/hooks/api/useAuthApi.ts` (전체 재작성)

- [ ] **Step 1: useAuthApi.ts 전체 수정**

```typescript
import type { LoginResponse, User } from '@/contexts/AuthContext';
import {
  kakaoLogin,
  getMe as getMeApi,
  logout as logoutApi,
  signup as signupApi,
  deleteMe,
} from '@/generated/api/client/auth-controller/auth-controller';
import type {
  KakaoLoginResponse,
  SignupRequest as GeneratedSignupRequest,
  SignupResponse as GeneratedSignupResponse,
  UserResponse,
} from '@/generated/models';
import { getSignupToken } from '@/lib/signupToken';

/** BE UserResponse → FE User 변환 */
const toUser = (res: UserResponse): User => ({
  id: Number(res.id),
  nickname: res.nickname ?? null,
  profileColor: res.profileColor ?? 'purple',
  lastNicknameChangedAt: res.lastNicknameChangedAt ?? null,
});

/** 카카오 로그인 */
export const postKakaoLogin = async (code: string, redirectUri: string): Promise<LoginResponse> => {
  const res = (await kakaoLogin({ code, redirectUri })) as KakaoLoginResponse;
  return {
    user: res.user ? toUser(res.user) : undefined,
    shouldSignup: res.shouldSignup ?? false,
    signupToken: res.signupToken,
  };
};

/** 내 정보 조회 */
export const getMe = async (): Promise<User> => {
  const res = (await getMeApi()) as UserResponse;
  return toUser(res);
};

/** 로그아웃 */
export const postLogout = async (): Promise<void> => {
  await logoutApi();
};

/** 회원가입 요청/응답 타입 */
export interface SignupRequest {
  nickname: string;
  gender: 'MALE' | 'FEMALE';
  birthYear: number;
  tkuId?: string;
}

export interface SignupLinkedResult {
  votes: number;
  comments: number;
  likes: number;
}

export interface SignupResponse {
  user: User;
  linked: SignupLinkedResult | null;
}

/** 회원가입 완료 */
export const submitSignup = async (data: SignupRequest): Promise<SignupResponse> => {
  const token = getSignupToken();
  const body: GeneratedSignupRequest = {
    nickname: data.nickname,
    gender: data.gender,
    birthYear: data.birthYear,
    ...(data.tkuId ? { tkuId: data.tkuId } : {}),
  };
  const res = (await signupApi(body, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })) as GeneratedSignupResponse;

  return {
    user: res.user ? toUser(res.user) : toUser({ nickname: data.nickname, profileColor: 'purple' }),
    linked: res.linked
      ? {
          votes: res.linked.votes ?? 0,
          comments: res.linked.comments ?? 0,
          likes: res.linked.likes ?? 0,
        }
      : null,
  };
};

/** 회원 탈퇴 */
export const deleteAccount = async (): Promise<void> => {
  await deleteMe();
};
```

- [ ] **Step 2: 타입 에러 확인**

Run: `npx tsc --noEmit`
Expected: `SignupLinkRequest` import 에러 (SignupForm에서 사용 중) — Task 5에서 수정

- [ ] **Step 3: Commit**

```bash
git add src/hooks/api/useAuthApi.ts
git commit -m "refactor: useAuthApi를 generated API 함수로 전환 (/api/v1 URL 사용)"
```

---

## Task 4: KakaoCallback — shouldSignup 필드 반영

`isSignUp` → `shouldSignup` 필드명 변경을 반영한다.

**Files:**

- Modify: `src/app/auth/kakao/callback/page.tsx:46`

- [ ] **Step 1: 필드명 수정**

```typescript
// 변경 전 (Line 46)
if (result.isSignUp && result.signupToken) {

// 변경 후
if (result.shouldSignup && result.signupToken) {
```

- [ ] **Step 2: 타입 에러 확인**

Run: `npx tsc --noEmit`
Expected: 이 파일 관련 에러 없음

- [ ] **Step 3: Commit**

```bash
git add src/app/auth/kakao/callback/page.tsx
git commit -m "fix: KakaoCallback에서 isSignUp → shouldSignup 필드명 반영"
```

---

## Task 5: SignupForm — gender/birthYear 전달 + tkuId 직접 전달

SignupForm이 수집한 gender, birthYear를 signup API에 전달하고, `link` 객체 대신 `tkuId`를 직접 전달한다.

**Files:**

- Modify: `src/components/features/Auth/SignupForm.tsx`

- [ ] **Step 1: import 수정**

```typescript
// 변경 전
import { submitSignup, type SignupLinkRequest } from '@/hooks/api/useAuthApi';

// 변경 후
import { submitSignup } from '@/hooks/api/useAuthApi';
```

- [ ] **Step 2: Gender 타입 변경**

```typescript
// 변경 전
type Gender = 'male' | 'female' | null;

// 변경 후
type Gender = 'MALE' | 'FEMALE' | null;
```

- [ ] **Step 3: 성별 버튼 값 수정**

```tsx
// 변경 전
<button
  type="button"
  className={`${styles.genderButton} ${gender === 'male' ? styles.selected : ''}`}
  onClick={() => setGender('male')}
>
  남성
</button>
<button
  type="button"
  className={`${styles.genderButton} ${gender === 'female' ? styles.selected : ''}`}
  onClick={() => setGender('female')}
>
  여성
</button>

// 변경 후
<button
  type="button"
  className={`${styles.genderButton} ${gender === 'MALE' ? styles.selected : ''}`}
  onClick={() => setGender('MALE')}
>
  남성
</button>
<button
  type="button"
  className={`${styles.genderButton} ${gender === 'FEMALE' ? styles.selected : ''}`}
  onClick={() => setGender('FEMALE')}
>
  여성
</button>
```

- [ ] **Step 4: doSignup 함수 수정 — gender/birthYear 전달, link → tkuId**

```typescript
// 변경 전
const doSignup = async (data: SignupFormValues, link?: SignupLinkRequest | null) => {
  const trimmed = data.nickname.trim();
  setIsSubmitting(true);
  try {
    const available = await checkNicknameAvailability(trimmed);
    if (!available) {
      setError('nickname', { message: '중복된 닉네임입니다' });
      return;
    }

    const result = await submitSignup({
      nickname: trimmed,
      link: link ?? null,
    });

// 변경 후
const doSignup = async (data: SignupFormValues, withMigration: boolean) => {
  const trimmed = data.nickname.trim();
  setIsSubmitting(true);
  try {
    const available = await checkNicknameAvailability(trimmed);
    if (!available) {
      setError('nickname', { message: '중복된 닉네임입니다' });
      return;
    }

    const result = await submitSignup({
      nickname: trimmed,
      gender: gender!,
      birthYear: Number(data.birthYear),
      ...(withMigration && hasTKUID() ? { tkuId: getTKUID() } : {}),
    });
```

나머지 doSignup 함수 본문(clearSignupToken, clearTKUID 등)은 변경 없이 유지한다.

- [ ] **Step 5: MigrationPrompt 콜백 수정**

```typescript
// 변경 전
const handleMigrationConfirm = () => {
  if (!pendingFormData) {
    return;
  }
  setShowMigration(false);
  void doSignup(pendingFormData, {
    tkuId: getTKUID(),
    votes: true,
    comments: true,
    likes: true,
  });
};

const handleMigrationSkip = () => {
  if (!pendingFormData) {
    return;
  }
  setShowMigration(false);
  void doSignup(pendingFormData, null);
};

// 변경 후
const handleMigrationConfirm = () => {
  if (!pendingFormData) {
    return;
  }
  setShowMigration(false);
  void doSignup(pendingFormData, true);
};

const handleMigrationSkip = () => {
  if (!pendingFormData) {
    return;
  }
  setShowMigration(false);
  void doSignup(pendingFormData, false);
};
```

- [ ] **Step 6: onSubmit 수정**

```typescript
// 변경 전
const onSubmit = (data: SignupFormValues) => {
  if (hasTKUID()) {
    setPendingFormData(data);
    setShowMigration(true);
    return;
  }
  void doSignup(data);
};

// 변경 후
const onSubmit = (data: SignupFormValues) => {
  if (hasTKUID()) {
    setPendingFormData(data);
    setShowMigration(true);
    return;
  }
  void doSignup(data, false);
};
```

- [ ] **Step 7: MigrationPrompt 설명 문구 보강**

사용자에게 마이그레이션의 의미를 충분히 설명하는 것이 정책 요구사항이다. 기존 활동 연결 후 비로그인 데이터가 제거된다는 점을 안내한다:

```tsx
// 변경 전
<p className={styles.promptDescription}>
  ⋅ 로그인 전에 남긴 투표, 공감, 댓글을 내 계정에 연결할 수 있어요. <br />⋅ 이 기회는 한
  번만 제공돼요.
</p>

// 변경 후
<p className={styles.promptDescription}>
  ⋅ 로그인 전에 남긴 투표, 공감, 댓글을 내 계정에 연결할 수 있어요.
  <br />⋅ 연결 후 기존 비로그인 활동 기록은 삭제되고, 앞으로 계정으로만 활동이 기록돼요.
  <br />⋅ 이 기회는 한 번만 제공돼요.
</p>
```

- [ ] **Step 8: 타입 에러 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 9: Commit**

```bash
git add src/components/features/Auth/SignupForm.tsx
git commit -m "feat: SignupForm에서 gender/birthYear 전달 + tkuId 직접 전달 방식으로 변경"
```

---

## Task 6: useNickname — Generated API 함수로 전환

닉네임 관련 API를 generated 함수로 교체하고 URL을 수정한다.

**Files:**

- Modify: `src/hooks/api/useNickname.ts` (전체 재작성)

- [ ] **Step 1: useNickname.ts 전체 수정**

```typescript
import {
  checkNickname,
  updateProfile,
} from '@/generated/api/client/auth-controller/auth-controller';
import type { NicknameCheckResponse, UserResponse } from '@/generated/models';
import axiosInstance from '@/lib/axios';
import { getSignupToken } from '@/lib/signupToken';

const signupAuthHeader = () => {
  const token = getSignupToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * 닉네임 추천 — swagger에 아직 없어 직접 호출
 * TODO: swagger 추가 후 generated 함수로 교체
 */
export const getSuggestedNickname = async (): Promise<string> => {
  const response = await axiosInstance.get<{ nickname: string }>('/api/v1/auth/nickname/suggest', {
    headers: signupAuthHeader(),
  });
  return response.data.nickname;
};

/** 닉네임 중복 확인 */
export const checkNicknameAvailability = async (nickname: string): Promise<boolean> => {
  const res = (await checkNickname(
    { nickname },
    { headers: signupAuthHeader() }
  )) as NicknameCheckResponse;
  return res.available ?? false;
};

/** 닉네임 변경 */
export const updateNickname = async (nickname: string): Promise<void> => {
  await updateProfile({ nickname });
};

/** 프로필 색상 변경 */
export const updateProfileColor = async (profileColor: string): Promise<void> => {
  await updateProfile({ profileColor });
};
```

- [ ] **Step 2: 타입 에러 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add src/hooks/api/useNickname.ts
git commit -m "refactor: useNickname을 generated API 함수로 전환 (/api/v1 URL 사용)"
```

---

## Task 7: useMyPage — Cursor 기반 페이지네이션으로 전환

MyPage API를 generated 함수로 교체하고, page 기반에서 cursor 기반 페이지네이션으로 전환한다.

**Files:**

- Modify: `src/hooks/api/useMyPage.ts` (전체 재작성)
- Modify: `src/components/features/MyPage/MyCommentList.tsx`
- Modify: `src/components/features/MyPage/LikedHotpickList.tsx`

- [ ] **Step 1: useMyPage.ts 전체 수정**

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

import { getMyComments, getMyLikes } from '@/generated/api/client/user-controller/user-controller';
import type {
  CursorPageResponseMyCommentResponse,
  CursorPageResponseMyLikeResponse,
} from '@/generated/models';

export const myPageKeys = {
  comments: ['myPage', 'comments'] as const,
  likes: ['myPage', 'likes'] as const,
};

export const useMyComments = () =>
  useInfiniteQuery({
    queryKey: myPageKeys.comments,
    queryFn: async ({ pageParam }) => {
      const res = (await getMyComments({
        cursor: pageParam,
        size: 20,
      })) as CursorPageResponseMyCommentResponse;
      return res;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
  });

export const useLikedHotpicks = () =>
  useInfiniteQuery({
    queryKey: myPageKeys.likes,
    queryFn: async ({ pageParam }) => {
      const res = (await getMyLikes({
        cursor: pageParam,
        size: 20,
      })) as CursorPageResponseMyLikeResponse;
      return res;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
  });
```

- [ ] **Step 2: MyCommentList 수정 — cursor 응답 구조 반영**

`MyCommentList.tsx`에서 `p.data`로 접근하는 부분은 그대로 유지한다. cursor 응답의 `data` 필드가 배열이므로 동일하게 동작한다. 다만 타입 안전성을 위해 확인한다:

```typescript
// 기존 코드 — cursor 응답에서도 동일하게 동작하므로 변경 불필요
const comments = data?.pages.flatMap((p) => p.data) ?? [];
```

타입만 확인하면 `CursorPageResponseMyCommentResponse.data`가 `MyCommentResponse[]`인지 확인. generated 모델에서 `data` 필드가 배열이면 변경 불필요.

- [ ] **Step 3: LikedHotpickList 수정 — 동일하게 cursor 응답 구조 확인**

```typescript
// 기존 코드 — cursor 응답에서도 동일하게 동작하므로 변경 불필요
const likes = data?.pages.flatMap((p) => p.data) ?? [];
```

- [ ] **Step 4: 타입 에러 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음. 만약 `data` 필드명이 다르면 (예: `items`), 해당 필드명으로 수정한다.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/api/useMyPage.ts src/components/features/MyPage/MyCommentList.tsx src/components/features/MyPage/LikedHotpickList.tsx
git commit -m "refactor: MyPage API를 generated 함수 + cursor 페이지네이션으로 전환"
```

---

## Task 8: 전체 빌드 검증

모든 수정이 완료된 후 전체 빌드가 성공하는지 확인한다.

**Files:** 없음 (검증만)

- [ ] **Step 1: TypeScript 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 2: 빌드**

Run: `npm run build`
Expected: 빌드 성공

- [ ] **Step 3: 남은 `/api/auth` 또는 `/api/users` 직접 호출 검색**

나머지 코드에서 `/api/auth/` 또는 `/api/users/`를 직접 호출하는 곳이 없는지 확인한다 (generated 함수를 사용하지 않고 axiosInstance를 직접 호출하는 경우):

Run: `grep -rn "'/api/auth/" src/ --include="*.ts" --include="*.tsx" | grep -v generated | grep -v node_modules`
Run: `grep -rn "'/api/users/" src/ --include="*.ts" --include="*.tsx" | grep -v generated | grep -v node_modules`

Expected: `useNickname.ts`의 `/api/v1/auth/nickname/suggest`만 남아야 한다 (swagger 미지원).

- [ ] **Step 4: Commit (필요시)**

빌드 과정에서 수정이 필요한 경우에만 커밋한다.

---

## 변경하지 않는 파일 (이미 올바르게 구현됨)

| 파일                                                           | 이유                                                         |
| -------------------------------------------------------------- | ------------------------------------------------------------ |
| `src/hooks/useCommentForm.ts`                                  | 로그인/비로그인 분기 이미 구현됨                             |
| `src/hooks/api/useComment.ts`                                  | generated comment API 함수 이미 사용 중                      |
| `src/components/features/Hotpick/CommentModal/CommentItem.tsx` | `profileColor` 기반 UI 분기 이미 구현됨                      |
| `src/components/features/Hotpick/CommentModal/CommentForm.tsx` | 로그인 시 닉네임/비밀번호 숨김 이미 구현됨                   |
| `src/types/comment.ts`                                         | `isMine` 확장 타입 이미 정의됨                               |
| `src/lib/tkuid.ts`                                             | TKUID 관리 이미 올바르게 구현됨                              |
| `src/lib/signupToken.ts`                                       | 토큰 관리 이미 올바르게 구현됨                               |
| `src/providers/AuthProvider.tsx`                               | MSW 게이트 + getMe 호출 이미 올바름 (MSW 비활성시 즉시 통과) |
| `src/lib/axios-mutator.ts`                                     | Orval 커스텀 인스턴스 이미 올바르게 구현됨                   |
| `src/components/features/Auth/LoginModal.tsx`                  | 카카오 OAuth URL 구성 이미 올바름                            |

---

## 정책 반영 확인 체크리스트

| 정책                                            | 구현 위치                                | 상태                        |
| ----------------------------------------------- | ---------------------------------------- | --------------------------- |
| 회원가입 + link 성공 후 TKUID 클라이언트 제거   | `SignupForm.tsx:clearTKUID()` (Line 181) | ✅ 이미 구현됨              |
| 마이그레이션 시 유저에게 충분히 설명            | `SignupForm.tsx:MigrationPrompt`         | Task 5 Step 7에서 문구 보강 |
| 로그인 댓글: 닉네임=계정닉네임, 비밀번호 불필요 | `useCommentForm.ts` (Line 155-172)       | ✅ 이미 구현됨              |
| 로그인 댓글 UI: 프로필 + 닉네임 표시            | `CommentItem.tsx` (Line 39-51)           | ✅ 이미 구현됨              |
| 댓글 이관: 컨텐츠+좋아요만, 닉네임→계정닉네임   | BE 책임 (FE에서 tkuId 전달만)            | ✅ FE 역할 완료             |
| 서버에서 기존 TKUID 자료 삭제                   | BE 책임                                  | FE 관여 불필요              |
