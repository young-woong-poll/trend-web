# 카카오 로그인 기능 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 카카오 소셜 로그인을 도입하여 댓글/좋아요/공감은 로그인 전용으로 전환하고, 비로그인 투표 경험은 유지한다.

**Architecture:** AuthContext + AuthProvider가 로그인 상태를 관리하고, requireLogin() 가드로 로그인 필요 기능을 게이팅한다. 카카오 인가코드 방식(BE 주도)으로 인증하며, httpOnly 쿠키로 세션을 유지한다. BE API가 미구현 상태이므로 MSW mock으로 개발한다.

**Tech Stack:** Next.js 14 App Router, TypeScript, SCSS Modules, React Query v5, react-hook-form, MSW, axios

**Spec:** `docs/specs/2026-03-22-kakao-auth-design.md`

---

## 파일 구조

### 새로 생성하는 파일

| 파일                                                     | 역할                                                               |
| -------------------------------------------------------- | ------------------------------------------------------------------ |
| `src/contexts/AuthContext.tsx`                           | 인증 상태 타입 정의 + Context 생성 + useAuth 훅 export             |
| `src/providers/AuthProvider.tsx`                         | AuthContext Provider 구현 (로그인 상태 관리, requireLogin, logout) |
| `src/hooks/api/useAuthApi.ts`                            | 인증 API 호출 훅 (login, refresh, me, logout, link, withdraw)      |
| `src/hooks/api/useNickname.ts`                           | 닉네임 추천/중복검사 API 훅                                        |
| `src/hooks/api/useMyPage.ts`                             | 내 투표/댓글 목록 API 훅                                           |
| `src/components/features/Auth/LoginModal.tsx`            | 로그인 모달 (PC 모달 + 모바일 바텀시트)                            |
| `src/components/features/Auth/LoginModal.module.scss`    | 로그인 모달 스타일                                                 |
| `src/components/features/Auth/NicknameModal.tsx`         | 닉네임 설정 모달                                                   |
| `src/components/features/Auth/NicknameModal.module.scss` | 닉네임 모달 스타일                                                 |
| `src/app/auth/kakao/callback/page.tsx`                   | 카카오 콜백 라우트 (클라이언트 컴포넌트)                           |
| `src/app/my/page.tsx`                                    | 마이페이지 라우트                                                  |
| `src/components/features/MyPage/MyPageView.tsx`          | 마이페이지 뷰                                                      |
| `src/components/features/MyPage/MyPageView.module.scss`  | 마이페이지 스타일                                                  |
| `src/components/features/MyPage/MyVoteList.tsx`          | 내 투표 목록                                                       |
| `src/components/features/MyPage/MyCommentList.tsx`       | 내 댓글 목록                                                       |
| `src/assets/icon/UserIcon.tsx`                           | 프로필 기본 아이콘                                                 |

### 수정하는 파일

| 파일                                                             | 변경 내용                              |
| ---------------------------------------------------------------- | -------------------------------------- |
| `src/app/layout.tsx`                                             | AuthProvider 추가 (ModalProvider 아래) |
| `src/providers/MSWProvider.tsx`                                  | useMSWReady() 훅 export 추가           |
| `src/lib/axios.ts`                                               | 401 토큰 갱신 interceptor 추가         |
| `src/hooks/api/useSingleVote.ts`                                 | tkuIdRef 제거, isLoggedIn 분기 추가    |
| `src/hooks/api/useDetailVote.ts`                                 | 동일                                   |
| `src/hooks/api/useLike.ts`                                       | requireLogin 가드 추가                 |
| `src/hooks/api/useComment.ts`                                    | requireLogin 가드 추가                 |
| `src/hooks/api/useCommentLike.ts`                                | requireLogin 가드 추가                 |
| `src/components/features/Main/MainHeader/MainHeader.tsx`         | 로그인 버튼 / 프로필 아이콘 추가       |
| `src/components/features/Main/MainHeader/MainHeader.module.scss` | 로그인 버튼 스타일                     |
| `src/mocks/handlers.ts`                                          | 인증 관련 MSW 핸들러 추가              |

---

## Task 1: MSWProvider에 useMSWReady 훅 추가

AuthProvider가 개발 환경에서 MSW 준비 후 API를 호출할 수 있도록 ready 상태를 노출한다.

**Files:**

- Modify: `src/providers/MSWProvider.tsx`

- [ ] **Step 1: MSWProvider에 ready 상태 추가**

```typescript
// src/providers/MSWProvider.tsx
// 기존 코드에 추가할 부분:

// 1. MSW ready 상태를 위한 Context 생성
import { createContext, useContext } from 'react';

const MSWReadyContext = createContext(false);
export const useMSWReady = () => useContext(MSWReadyContext);

// 2. MSWProvider 내부에서 ready 상태 관리
// 기존 useState(false) → isReady 상태 추가
const [isReady, setIsReady] = useState(false);

// 3. useEffect 내부, worker.start() 이후에:
setIsReady(true);

// 4. return에서 Context Provider로 감싸기:
return (
  <MSWReadyContext.Provider value={isReady}>
    {children}
  </MSWReadyContext.Provider>
);

// MSW 비활성화 시에도 true 반환하도록 처리
```

- [ ] **Step 2: 동작 확인**

Run: `npm run dev`
Expected: 기존 동작 변경 없음, MSW 초기화 정상

- [ ] **Step 3: 커밋**

```bash
git add src/providers/MSWProvider.tsx
git commit -m "feat(auth): MSWProvider에 useMSWReady 훅 추가"
```

---

## Task 2: 인증 타입 정의 + AuthContext 생성

**Files:**

- Create: `src/contexts/AuthContext.tsx`

- [ ] **Step 1: AuthContext 파일 생성**

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext } from 'react';

export interface User {
  id: number;
  nickname: string | null;
  profileImageUrl: string | null;
}

export interface LoginResponse {
  user: User;
  isNewUser: boolean;
}

export type LoginTrigger = 'comment' | 'like' | 'default';

export interface AuthContextValue {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  requireLogin: (trigger: LoginTrigger) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  setIsNewUserFlag: (isNew: boolean) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

- [ ] **Step 2: 커밋**

```bash
git add src/contexts/AuthContext.tsx
git commit -m "feat(auth): AuthContext 타입 정의 및 Context 생성"
```

---

## Task 3: 인증 API 훅 + MSW 핸들러

BE API가 미구현이므로 MSW mock과 함께 작성한다.

**Files:**

- Create: `src/hooks/api/useAuthApi.ts`
- Modify: `src/mocks/handlers.ts`

- [ ] **Step 1: 인증 API 훅 생성**

```typescript
// src/hooks/api/useAuthApi.ts
import axiosInstance from '@/lib/axios';
import type { LoginResponse, User } from '@/contexts/AuthContext';

// 카카오 로그인 (인가코드 → BE에서 JWT 발급 → 쿠키 설정)
export const postKakaoLogin = async (code: string, redirectUri: string): Promise<LoginResponse> => {
  const response = await axiosInstance.post('/api/auth/kakao', { code, redirectUri });
  return response as unknown as LoginResponse;
};

// 현재 유저 정보 조회
export const getMe = async (): Promise<User> => {
  const response = await axiosInstance.get('/api/auth/me');
  return response as unknown as User;
};

// 토큰 갱신
export const postRefresh = async (): Promise<void> => {
  await axiosInstance.post('/api/auth/refresh');
};

// 로그아웃
export const postLogout = async (): Promise<void> => {
  await axiosInstance.post('/api/auth/logout');
};

// tku-id 통합
export const postLink = async (tkuId: string): Promise<{ linked: boolean; votesCount: number }> => {
  const response = await axiosInstance.post('/api/auth/link', { tkuId });
  return response as unknown as { linked: boolean; votesCount: number };
};

// 회원 탈퇴
export const deleteAccount = async (): Promise<void> => {
  await axiosInstance.delete('/api/auth/me');
};
```

- [ ] **Step 2: MSW 인증 핸들러 추가**

`src/mocks/handlers.ts`에 인증 관련 핸들러를 추가한다.
기존 핸들러 배열에 아래를 추가:

```typescript
// --- Auth Mock Handlers ---
// Mock user state
let mockUser: { id: number; nickname: string | null; profileImageUrl: string | null } | null = null;

http.post('*/api/auth/kakao', async ({ request }) => {
  const body = await request.json() as { code: string; redirectUri: string };
  if (!body.code) {
    return HttpResponse.json({ code: 400, message: 'code is required' }, { status: 400 });
  }
  const isNewUser = !mockUser;
  mockUser = mockUser ?? { id: 1, nickname: null, profileImageUrl: null };
  return HttpResponse.json({
    code: 200,
    data: { user: mockUser, isNewUser },
  });
}),

http.get('*/api/auth/me', () => {
  if (!mockUser) {
    return HttpResponse.json({ code: 401, message: 'Unauthorized' }, { status: 401 });
  }
  return HttpResponse.json({ code: 200, data: mockUser });
}),

http.post('*/api/auth/refresh', () => {
  if (!mockUser) {
    return HttpResponse.json({ code: 401, message: 'Token expired' }, { status: 401 });
  }
  return HttpResponse.json({ code: 200, data: null });
}),

http.post('*/api/auth/logout', () => {
  mockUser = null;
  return HttpResponse.json({ code: 200, data: null });
}),

http.post('*/api/auth/link', async ({ request }) => {
  const body = await request.json() as { tkuId: string };
  return HttpResponse.json({
    code: 200,
    data: { linked: true, votesCount: 2 },
  });
}),

http.delete('*/api/auth/me', () => {
  mockUser = null;
  return HttpResponse.json({ code: 200, data: null });
}),
```

- [ ] **Step 3: 커밋**

```bash
git add src/hooks/api/useAuthApi.ts src/mocks/handlers.ts
git commit -m "feat(auth): 인증 API 훅 및 MSW mock 핸들러 추가"
```

---

## Task 4: axios 401 interceptor 추가

**Files:**

- Modify: `src/lib/axios.ts`

- [ ] **Step 1: 토큰 갱신 interceptor 구현**

`src/lib/axios.ts`의 response interceptor 부분을 수정한다.
기존 에러 핸들링 부분(line 35~49)을 아래로 교체:

```typescript
// 401 토큰 갱신 로직
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: unknown | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(undefined);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  // 기존 성공 핸들러 유지
  (response) => response.data?.data ?? response.data,
  async (error) => {
    const originalRequest = error.config;

    // 401이 아니면 기존 에러 핸들링
    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    // refresh 요청 자체가 401이면 → 로그아웃 (무한 루프 방지)
    if (originalRequest.url?.includes('/api/auth/refresh')) {
      return Promise.reject(error);
    }

    // 이미 재시도한 요청이면 → 로그아웃
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // refresh 진행 중이면 큐에 대기
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => axiosInstance(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await axiosInstance.post('/api/auth/refresh');
      processQueue(null);
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      // AuthProvider에서 로그아웃 처리할 수 있도록 이벤트 발행
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
```

- [ ] **Step 2: 동작 확인**

Run: `npm run dev`
Expected: 기존 API 호출 정상 동작 (401이 아닌 요청은 변경 없음)

- [ ] **Step 3: 커밋**

```bash
git add src/lib/axios.ts
git commit -m "feat(auth): axios 401 토큰 갱신 interceptor 추가"
```

---

## Task 5: 로그인 모달 컴포넌트

**Files:**

- Create: `src/components/features/Auth/LoginModal.tsx`
- Create: `src/components/features/Auth/LoginModal.module.scss`

- [ ] **Step 1: 로그인 모달 SCSS 생성**

```scss
// src/components/features/Auth/LoginModal.module.scss
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 24px 32px;
}

.triggerMessage {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  text-align: center;
  margin-bottom: 24px;
}

.benefitList {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-bottom: 32px;
}

.benefitItem {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #d1d1d1;
}

.benefitIcon {
  font-size: 18px;
  flex-shrink: 0;
}

.kakaoButton {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 48px;
  background-color: #fee500;
  color: #000;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }

  svg {
    width: 20px;
    height: 20px;
  }
}

.subText {
  margin-top: 16px;
  font-size: 13px;
  color: #8a8a8a;
}

// 모바일 바텀시트
.dimmed {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.bottomSheet {
  width: 100%;
  max-width: 520px;
  background: #1e1e1e;
  border-radius: 24px 24px 0 0;
  animation: slideUp 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
```

- [ ] **Step 2: 로그인 모달 컴포넌트 생성**

```tsx
// src/components/features/Auth/LoginModal.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import KakaoIcon from '@/assets/icon/KakaoIcon';
import Modal from '@/components/common/Modal/Modal';
import type { LoginTrigger } from '@/contexts/AuthContext';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useEscapeKey } from '@/hooks/useEscapeKey';

import styles from './LoginModal.module.scss';

const TRIGGER_MESSAGES: Record<LoginTrigger, string> = {
  comment: '댓글을 남기려면 로그인이 필요해요',
  like: '좋아요는 로그인 후 이용할 수 있어요',
  default: '로그인하고 더 많은 기능을 이용해보세요',
};

const BENEFITS = [
  { icon: '💬', text: '댓글로 의견을 나눠보세요' },
  { icon: '❤️', text: '마음에 드는 핫픽에 좋아요' },
  { icon: '📊', text: '내 투표 기록을 한눈에' },
];

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: LoginTrigger;
}

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

const LoginModalContent = ({ trigger }: { trigger: LoginTrigger }) => {
  const handleKakaoLogin = () => {
    sessionStorage.setItem(
      'auth_intent',
      JSON.stringify({ trigger, returnUrl: window.location.href })
    );

    const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;
    window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
  };

  return (
    <div className={styles.container}>
      <p className={styles.triggerMessage}>{TRIGGER_MESSAGES[trigger]}</p>

      <div className={styles.benefitList}>
        {BENEFITS.map((b) => (
          <div key={b.text} className={styles.benefitItem}>
            <span className={styles.benefitIcon}>{b.icon}</span>
            <span>{b.text}</span>
          </div>
        ))}
      </div>

      <button type="button" className={styles.kakaoButton} onClick={handleKakaoLogin}>
        <KakaoIcon />
        카카오로 시작하기
      </button>

      <p className={styles.subText}>비로그인으로 투표는 가능해요</p>
    </div>
  );
};

const LoginModal = ({ isOpen, onClose, trigger }: LoginModalProps) => {
  const isMobile = useIsMobile();
  useBodyScrollLock(isOpen);
  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  // PC: 기존 Modal 컴포넌트 사용
  if (!isMobile) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} showCloseButton closeOnDimmedClick>
        <LoginModalContent trigger={trigger} />
      </Modal>
    );
  }

  // 모바일: 바텀시트
  const portal = document.getElementById('portal-root');
  if (!portal) return null;

  return createPortal(
    <div className={styles.dimmed} onClick={onClose}>
      <div className={styles.bottomSheet} onClick={(e) => e.stopPropagation()}>
        <LoginModalContent trigger={trigger} />
      </div>
    </div>,
    portal
  );
};

export default LoginModal;
```

- [ ] **Step 3: 동작 확인**

Storybook이 없으므로 다음 Task(AuthProvider)에서 통합 확인.

- [ ] **Step 4: 커밋**

```bash
git add src/components/features/Auth/LoginModal.tsx src/components/features/Auth/LoginModal.module.scss
git commit -m "feat(auth): 로그인 모달 컴포넌트 (PC 모달 + 모바일 바텀시트)"
```

---

## Task 6: 닉네임 설정 모달

**Files:**

- Create: `src/components/features/Auth/NicknameModal.tsx`
- Create: `src/components/features/Auth/NicknameModal.module.scss`
- Create: `src/hooks/api/useNickname.ts`

- [ ] **Step 1: 닉네임 API 훅 생성**

```typescript
// src/hooks/api/useNickname.ts
import axiosInstance from '@/lib/axios';

export const getSuggestedNickname = async (): Promise<string> => {
  const response = await axiosInstance.get('/api/auth/nickname/suggest');
  return (response as unknown as { nickname: string }).nickname;
};

export const checkNicknameAvailability = async (nickname: string): Promise<boolean> => {
  const response = await axiosInstance.get('/api/auth/nickname/check', {
    params: { nickname },
  });
  return (response as unknown as { available: boolean }).available;
};

export const updateNickname = async (nickname: string): Promise<void> => {
  await axiosInstance.patch('/api/auth/me', { nickname });
};
```

- [ ] **Step 2: MSW에 닉네임 핸들러 추가**

`src/mocks/handlers.ts`에 추가:

```typescript
// --- Nickname Mock Handlers ---
const usedNicknames = new Set<string>();

http.get('*/api/auth/nickname/suggest', () => {
  const adjectives = ['불꽃', '번개', '별빛', '달빛', '바람'];
  const nouns = ['투표러', '참여자', '의견러', '응답자', '토론가'];
  const num = Math.floor(Math.random() * 1000);
  const nickname = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${num}`;
  return HttpResponse.json({ code: 200, data: { nickname } });
}),

http.get('*/api/auth/nickname/check', ({ request }) => {
  const url = new URL(request.url);
  const nickname = url.searchParams.get('nickname') ?? '';
  const available = !usedNicknames.has(nickname);
  return HttpResponse.json({ code: 200, data: { available } });
}),

http.patch('*/api/auth/me', async ({ request }) => {
  const body = await request.json() as { nickname: string };
  if (mockUser) {
    mockUser.nickname = body.nickname;
    usedNicknames.add(body.nickname);
  }
  return HttpResponse.json({ code: 200, data: mockUser });
}),
```

- [ ] **Step 3: 닉네임 모달 SCSS 생성**

```scss
// src/components/features/Auth/NicknameModal.module.scss
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 24px 32px;
}

.title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 24px;
}

.inputWrapper {
  position: relative;
  width: 100%;
  margin-bottom: 8px;
}

.input {
  width: 100%;
  height: 48px;
  padding: 0 48px 0 16px;
  background: #2c2c2c;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  outline: none;

  &:focus {
    border-color: #8a8a8a;
  }

  &.error {
    border-color: #ff2e2e;
  }
}

.refreshButton {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #8a8a8a;
  font-size: 18px;
  cursor: pointer;
  padding: 8px;

  &:hover {
    color: #d1d1d1;
  }
}

.errorText {
  width: 100%;
  font-size: 13px;
  color: #ff2e2e;
  min-height: 20px;
}

.submitButton {
  width: 100%;
  height: 48px;
  margin-top: 16px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(135deg, #ff00ff, #ff4500);
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
```

- [ ] **Step 4: 닉네임 모달 컴포넌트 생성**

```tsx
// src/components/features/Auth/NicknameModal.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import Modal from '@/components/common/Modal/Modal';
import { useAuth } from '@/contexts/AuthContext';
import {
  checkNicknameAvailability,
  getSuggestedNickname,
  updateNickname,
} from '@/hooks/api/useNickname';

import styles from './NicknameModal.module.scss';

interface NicknameForm {
  nickname: string;
}

interface NicknameModalProps {
  isOpen: boolean;
  onClose?: () => void; // 온보딩에서는 미전달 (닫기 불가), 마이페이지에서는 전달
}

const NicknameModal = ({ isOpen, onClose }: NicknameModalProps) => {
  const { setUser, user } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<NicknameForm>();

  const nicknameValue = watch('nickname');

  // 초기 추천 닉네임 로드
  const loadSuggestion = useCallback(async () => {
    try {
      const suggested = await getSuggestedNickname();
      setValue('nickname', suggested);
      clearErrors('nickname');
    } catch {
      // 실패 시 무시 — 유저가 직접 입력 가능
    }
  }, [setValue, clearErrors]);

  useEffect(() => {
    if (isOpen) {
      void loadSuggestion();
    }
  }, [isOpen, loadSuggestion]);

  // 포커스 아웃 시 중복 검사
  const handleBlur = async () => {
    if (!nicknameValue?.trim()) return;
    setIsChecking(true);
    try {
      const available = await checkNicknameAvailability(nicknameValue.trim());
      if (!available) {
        setError('nickname', { message: '중복된 닉네임입니다' });
      } else {
        clearErrors('nickname');
      }
    } catch {
      // 검사 실패 시 submit에서 다시 확인
    } finally {
      setIsChecking(false);
    }
  };

  const onSubmit = async (data: NicknameForm) => {
    const trimmed = data.nickname.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      const available = await checkNicknameAvailability(trimmed);
      if (!available) {
        setError('nickname', { message: '중복된 닉네임입니다' });
        return;
      }
      await updateNickname(trimmed);
      setUser(user ? { ...user, nickname: trimmed } : null);
      onClose?.();
    } catch {
      setError('nickname', { message: '닉네임 설정에 실패했습니다' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnDimmedClick={!!onClose}
      showCloseButton={!!onClose}
      maxWidth={400}
    >
      {/* onClose 미전달 시 ESC/닫기 불가 (온보딩), 전달 시 닫기 가능 (마이페이지) */}
      <form className={styles.container} onSubmit={handleSubmit(onSubmit)}>
        <h2 className={styles.title}>닉네임을 설정해주세요</h2>

        <div className={styles.inputWrapper}>
          <input
            {...register('nickname', { required: '닉네임을 입력해주세요' })}
            className={`${styles.input} ${errors.nickname ? styles.error : ''}`}
            placeholder="닉네임 입력"
            maxLength={20}
            onBlur={handleBlur}
          />
          <button
            type="button"
            className={styles.refreshButton}
            onClick={loadSuggestion}
            aria-label="닉네임 재생성"
          >
            🔄
          </button>
        </div>

        <p className={styles.errorText}>{errors.nickname?.message ?? ''}</p>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSubmitting || isChecking || !nicknameValue?.trim()}
        >
          {isSubmitting ? '설정 중...' : '시작하기'}
        </button>
      </form>
    </Modal>
  );
};

export default NicknameModal;
```

- [ ] **Step 5: 커밋**

```bash
git add src/hooks/api/useNickname.ts src/components/features/Auth/NicknameModal.tsx src/components/features/Auth/NicknameModal.module.scss src/mocks/handlers.ts
git commit -m "feat(auth): 닉네임 설정 모달 및 API 훅"
```

---

## Task 7: AuthProvider 구현

**Files:**

- Create: `src/providers/AuthProvider.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: AuthProvider 구현**

```tsx
// src/providers/AuthProvider.tsx
'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';

import LoginModal from '@/components/features/Auth/LoginModal';
import NicknameModal from '@/components/features/Auth/NicknameModal';
import { AuthContext, type LoginTrigger, type User } from '@/contexts/AuthContext';
import { getMe, postLink, postLogout } from '@/hooks/api/useAuthApi';
import { clearTKUID, getTKUID, hasTKUID } from '@/lib/tkuid';

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUserFlag, setIsNewUserFlag] = useState(false); // 콜백 페이지에서 설정
  const [loginModal, setLoginModal] = useState<{ isOpen: boolean; trigger: LoginTrigger }>({
    isOpen: false,
    trigger: 'default',
  });

  const isLoggedIn = user !== null;
  const needsNickname = isLoggedIn && user.nickname === null;

  // 앱 마운트 시 로그인 상태 확인 (개발 환경에서는 MSW 준비 후)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const me = await getMe();
        setUser(me);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    void checkAuth();
  }, []);

  // 401 interceptor에서 보낸 로그아웃 이벤트 수신
  useEffect(() => {
    const handleForceLogout = () => {
      setUser(null);
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  // 신규 유저 tku-id 통합 (닉네임 설정 완료 후, isNewUser인 경우만)
  useEffect(() => {
    if (isLoggedIn && user.nickname !== null && isNewUserFlag && hasTKUID()) {
      const linkAndClear = async () => {
        try {
          await postLink(getTKUID());
        } catch {
          // link 실패해도 로그인은 유지
        } finally {
          clearTKUID();
          setIsNewUserFlag(false);
        }
      };
      void linkAndClear();
    } else if (isLoggedIn && hasTKUID() && !isNewUserFlag) {
      // 기존 유저: link 없이 tku-id만 정리
      clearTKUID();
    }
  }, [isLoggedIn, user?.nickname, isNewUserFlag]);

  const requireLogin = useCallback(
    (trigger: LoginTrigger) => {
      if (isLoggedIn) return;
      setLoginModal({ isOpen: true, trigger });
    },
    [isLoggedIn]
  );

  const logout = useCallback(async () => {
    try {
      await postLogout();
    } catch {
      // 실패해도 클라이언트 상태는 초기화
    }
    setUser(null);
  }, []);

  const closeLoginModal = useCallback(() => {
    setLoginModal({ isOpen: false, trigger: 'default' });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn, isLoading, requireLogin, logout, setUser, setIsNewUserFlag }}
    >
      {children}

      <LoginModal
        isOpen={loginModal.isOpen}
        onClose={closeLoginModal}
        trigger={loginModal.trigger}
      />

      <NicknameModal isOpen={needsNickname} />
    </AuthContext.Provider>
  );
};

export default AuthProvider;
```

- [ ] **Step 2: layout.tsx에 AuthProvider 추가**

`src/app/layout.tsx`를 수정하여 ModalProvider 아래에 AuthProvider를 추가한다.

```tsx
// 기존:
//   <ModalProvider>
//     {children}
//   </ModalProvider>

// 변경:
import AuthProvider from '@/providers/AuthProvider';

//   <ModalProvider>
//     <AuthProvider>
//       {children}
//     </AuthProvider>
//   </ModalProvider>
```

- [ ] **Step 3: 동작 확인**

Run: `npm run dev`
Expected: 앱 정상 로딩, 콘솔에 401 (비로그인 상태) 표시, 기존 기능 동작

- [ ] **Step 4: 커밋**

```bash
git add src/providers/AuthProvider.tsx src/app/layout.tsx
git commit -m "feat(auth): AuthProvider 구현 및 layout.tsx에 추가"
```

---

## Task 8: 카카오 콜백 페이지

**Files:**

- Create: `src/app/auth/kakao/callback/page.tsx`

- [ ] **Step 1: 콜백 페이지 생성**

```tsx
// src/app/auth/kakao/callback/page.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';
import { postKakaoLogin } from '@/hooks/api/useAuthApi';

const KakaoCallbackPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setIsNewUserFlag } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const code = searchParams.get('code');
    if (!code) {
      router.replace('/');
      return;
    }

    const handleCallback = async () => {
      try {
        const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI ?? '';
        const result = await postKakaoLogin(code, redirectUri);
        setUser(result.user);
        if (result.isNewUser) {
          setIsNewUserFlag(true);
        }

        // sessionStorage에서 returnUrl 복원
        const intentStr = sessionStorage.getItem('auth_intent');
        sessionStorage.removeItem('auth_intent');

        if (intentStr) {
          try {
            const intent = JSON.parse(intentStr) as { returnUrl?: string };
            if (intent.returnUrl) {
              router.replace(intent.returnUrl);
              return;
            }
          } catch {
            // parse 실패 시 메인으로
          }
        }
        router.replace('/');
      } catch {
        router.replace('/');
      }
    };

    void handleCallback();
  }, [searchParams, router, setUser]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: '#8a8a8a',
      }}
    >
      로그인 처리 중...
    </div>
  );
};

export default KakaoCallbackPage;
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/auth/kakao/callback/page.tsx
git commit -m "feat(auth): 카카오 콜백 페이지"
```

---

## Task 9: 헤더에 로그인 버튼 / 프로필 아이콘 추가

**Files:**

- Modify: `src/components/features/Main/MainHeader/MainHeader.tsx`
- Modify: `src/components/features/Main/MainHeader/MainHeader.module.scss`
- Create: `src/assets/icon/UserIcon.tsx`

- [ ] **Step 1: UserIcon 아이콘 생성**

```tsx
// src/assets/icon/UserIcon.tsx
import type { FC, SVGProps } from 'react';

const UserIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="12" cy="8" r="4" fill="currentColor" />
    <path
      d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export default UserIcon;
```

- [ ] **Step 2: MainHeader SCSS에 스타일 추가**

`src/components/features/Main/MainHeader/MainHeader.module.scss`에 추가:

```scss
.loginButton {
  font-size: 14px;
  font-weight: 600;
  color: #d1d1d1;
  background: none;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  padding: 6px 16px;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.2s;

  &:hover {
    border-color: #8a8a8a;
  }
}

.profileButton {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  border: none;
  background: #2c2c2c;
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  svg {
    width: 20px;
    height: 20px;
    color: #8a8a8a;
  }
}
```

- [ ] **Step 3: MainHeader에 로그인/프로필 UI 추가**

`src/components/features/Main/MainHeader/MainHeader.tsx`를 수정한다.

import 추가:

```tsx
import { useRouter } from 'next/navigation';
import UserIcon from '@/assets/icon/UserIcon';
import { useAuth } from '@/contexts/AuthContext';
```

컴포넌트 내부에 추가:

```tsx
const { isLoggedIn, user, requireLogin } = useAuth();
const router = useRouter();
```

JSX에서 헤더 우측 영역에 추가 (검색 아이콘 옆):

```tsx
{
  isLoggedIn ? (
    <button type="button" className={styles.profileButton} onClick={() => router.push('/my')}>
      {user?.profileImageUrl ? <img src={user.profileImageUrl} alt="프로필" /> : <UserIcon />}
    </button>
  ) : (
    <button type="button" className={styles.loginButton} onClick={() => requireLogin('default')}>
      로그인
    </button>
  );
}
```

- [ ] **Step 4: 동작 확인**

Run: `npm run dev`
Expected: 헤더에 로그인 버튼 표시, 클릭 시 로그인 모달 오픈

- [ ] **Step 5: 커밋**

```bash
git add src/assets/icon/UserIcon.tsx src/components/features/Main/MainHeader/MainHeader.tsx src/components/features/Main/MainHeader/MainHeader.module.scss
git commit -m "feat(auth): 헤더에 로그인 버튼 및 프로필 아이콘 추가"
```

---

## Task 10: 기존 훅에 로그인 게이팅 적용

**Files:**

- Modify: `src/hooks/api/useLike.ts`
- Modify: `src/hooks/api/useComment.ts`
- Modify: `src/hooks/api/useCommentLike.ts`
- Modify: `src/hooks/api/useSingleVote.ts`
- Modify: `src/hooks/api/useDetailVote.ts`

- [ ] **Step 1: useLike.ts 수정**

import 추가:

```typescript
import { useAuth } from '@/contexts/AuthContext';
```

훅 내부에 추가:

```typescript
const { isLoggedIn, requireLogin } = useAuth();
```

`handleLike` 함수 시작 부분에 가드 추가:

```typescript
if (!isLoggedIn) {
  requireLogin('like');
  return;
}
```

tkuIdRef 관련 코드 수정:

```typescript
// 기존: const tkuIdRef = useRef<string>(getTKUID());
// 변경: handleLike 내부에서 직접 결정
const apiOptions = isLoggedIn ? undefined : { headers: { 'x-tku-id': getTKUID() } };
```

- [ ] **Step 2: useComment.ts 수정**

import 추가:

```typescript
import { useAuth } from '@/contexts/AuthContext';
```

`useComments` 훅 내부에 추가:

```typescript
const { isLoggedIn, requireLogin } = useAuth();
```

`createComment` mutation의 `mutationFn` 시작에 가드 추가:

```typescript
// mutationFn 내부 시작에:
if (!isLoggedIn) {
  requireLogin('comment');
  return;
}
```

x-tku-id 헤더를 로그인 상태에 따라 분기:

```typescript
headers: isLoggedIn ? {} : { 'x-tku-id': typeof window !== 'undefined' ? getTKUID() : '' };
```

- [ ] **Step 3: useCommentLike.ts 수정**

useLike.ts와 동일한 패턴으로:

```typescript
import { useAuth } from '@/contexts/AuthContext';
// ...
const { isLoggedIn, requireLogin } = useAuth();
// handleLike 시작에:
if (!isLoggedIn) {
  requireLogin('like');
  return;
}
// apiOptions 분기
const apiOptions = isLoggedIn ? undefined : { headers: { 'x-tku-id': getTKUID() } };
```

- [ ] **Step 4: useSingleVote.ts 수정**

로그인 게이팅은 추가하지 않음 (투표는 비로그인 허용).
식별자 분기만 변경:

```typescript
import { useAuth } from '@/contexts/AuthContext';
// ...
const { isLoggedIn } = useAuth();

// 기존 tkuIdRef 제거:
// const tkuIdRef = useRef<string>(getTKUID());

// handleVote 내부에서:
const headers = isLoggedIn ? {} : { 'x-tku-id': getTKUID() };
await vote(slug, { electionItemId: Number(optionId) }, { headers });
```

- [ ] **Step 5: useDetailVote.ts 수정**

useSingleVote.ts와 동일한 패턴:

```typescript
import { useAuth } from '@/contexts/AuthContext';
// ...
const { isLoggedIn } = useAuth();

// 기존 tkuIdRef 제거
// handleVote 내부에서:
const headers = isLoggedIn ? {} : { 'x-tku-id': getTKUID() };
await vote(slug, { electionItemId: optionId }, { headers });
```

- [ ] **Step 6: 동작 확인**

Run: `npm run dev`
Expected:

- 비로그인 상태에서 좋아요/댓글/공감 클릭 시 → 로그인 모달 표시
- 비로그인 상태에서 투표 → 정상 동작 (tku-id 사용)

- [ ] **Step 7: 커밋**

```bash
git add src/hooks/api/useLike.ts src/hooks/api/useComment.ts src/hooks/api/useCommentLike.ts src/hooks/api/useSingleVote.ts src/hooks/api/useDetailVote.ts
git commit -m "feat(auth): 기존 훅에 로그인 게이팅 및 식별자 분기 적용"
```

---

## Task 11: 마이페이지

**Files:**

- Create: `src/app/my/page.tsx`
- Create: `src/components/features/MyPage/MyPageView.tsx`
- Create: `src/components/features/MyPage/MyPageView.module.scss`
- Create: `src/components/features/MyPage/MyVoteList.tsx`
- Create: `src/components/features/MyPage/MyCommentList.tsx`
- Create: `src/hooks/api/useMyPage.ts`

- [ ] **Step 1: 마이페이지 API 훅 생성**

```typescript
// src/hooks/api/useMyPage.ts
import { useInfiniteQuery } from '@tanstack/react-query';

import axiosInstance from '@/lib/axios';

interface MyVoteItem {
  hotpickSlug: string;
  hotpickTitle: string;
  selectedOption: string;
  votedAt: string;
}

interface MyCommentItem {
  hotpickSlug: string;
  hotpickTitle: string;
  content: string;
  createdAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; totalPages: number };
}

export const myPageKeys = {
  votes: ['myPage', 'votes'] as const,
  comments: ['myPage', 'comments'] as const,
};

export const useMyVotes = () =>
  useInfiniteQuery({
    queryKey: myPageKeys.votes,
    queryFn: async ({ pageParam = 1 }) => {
      const res = await axiosInstance.get('/api/users/me/votes', {
        params: { page: pageParam, size: 20 },
      });
      return res as unknown as PaginatedResponse<MyVoteItem>;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
  });

export const useMyComments = () =>
  useInfiniteQuery({
    queryKey: myPageKeys.comments,
    queryFn: async ({ pageParam = 1 }) => {
      const res = await axiosInstance.get('/api/users/me/comments', {
        params: { page: pageParam, size: 20 },
      });
      return res as unknown as PaginatedResponse<MyCommentItem>;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
  });
```

- [ ] **Step 2: MSW에 마이페이지 핸들러 추가**

`src/mocks/handlers.ts`에 추가:

```typescript
// --- MyPage Mock Handlers ---
http.get('*/api/users/me/votes', ({ request }) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page') ?? '1');
  return HttpResponse.json({
    code: 200,
    data: {
      data: [
        { hotpickSlug: 'mock-1', hotpickTitle: '짜장 vs 짬뽕', selectedOption: '짜장', votedAt: '2026-03-20T10:00:00Z' },
        { hotpickSlug: 'mock-2', hotpickTitle: '여름 vs 겨울', selectedOption: '여름', votedAt: '2026-03-19T10:00:00Z' },
      ],
      meta: { page, totalPages: 1 },
    },
  });
}),

http.get('*/api/users/me/comments', ({ request }) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page') ?? '1');
  return HttpResponse.json({
    code: 200,
    data: {
      data: [
        { hotpickSlug: 'mock-1', hotpickTitle: '짜장 vs 짬뽕', content: '짜장이 최고지', createdAt: '2026-03-20T12:00:00Z' },
      ],
      meta: { page, totalPages: 1 },
    },
  });
}),
```

- [ ] **Step 3: 마이페이지 SCSS 생성**

```scss
// src/components/features/MyPage/MyPageView.module.scss
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px 16px 80px;
}

.profileSection {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.profileImage {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #2c2c2c;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  svg {
    width: 32px;
    height: 32px;
    color: #8a8a8a;
  }
}

.profileInfo {
  flex: 1;
}

.nickname {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.editButton {
  font-size: 13px;
  color: #8a8a8a;
  background: none;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  padding: 4px 12px;
  margin-left: 8px;
  cursor: pointer;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #3a3a3a;
  margin-bottom: 16px;
}

.tab {
  flex: 1;
  padding: 12px 0;
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  color: #8a8a8a;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;

  &.active {
    color: #fff;
    border-bottom-color: #fff;
  }
}

.listItem {
  padding: 16px 0;
  border-bottom: 1px solid #2c2c2c;
}

.listItemTitle {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
}

.listItemSub {
  font-size: 13px;
  color: #8a8a8a;
}

.emptyState {
  text-align: center;
  padding: 40px 0;
  color: #8a8a8a;
  font-size: 14px;
}

.footer {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.logoutButton {
  font-size: 15px;
  color: #d1d1d1;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  padding: 8px 0;
}

.withdrawButton {
  font-size: 13px;
  color: #8a8a8a;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  padding: 8px 0;
}
```

- [ ] **Step 4: MyVoteList 컴포넌트 생성**

```tsx
// src/components/features/MyPage/MyVoteList.tsx
'use client';

import { useMyVotes } from '@/hooks/api/useMyPage';

import styles from './MyPageView.module.scss';

const MyVoteList = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useMyVotes();
  const votes = data?.pages.flatMap((p) => p.data) ?? [];

  if (votes.length === 0) {
    return <div className={styles.emptyState}>아직 참여한 투표가 없어요</div>;
  }

  return (
    <div>
      {votes.map((vote) => (
        <div key={`${vote.hotpickSlug}-${vote.votedAt}`} className={styles.listItem}>
          <p className={styles.listItemTitle}>{vote.hotpickTitle}</p>
          <p className={styles.listItemSub}>
            {vote.selectedOption} 선택 · {new Date(vote.votedAt).toLocaleDateString('ko-KR')}
          </p>
        </div>
      ))}
      {hasNextPage && (
        <button type="button" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? '로딩 중...' : '더 보기'}
        </button>
      )}
    </div>
  );
};

export default MyVoteList;
```

- [ ] **Step 5: MyCommentList 컴포넌트 생성**

```tsx
// src/components/features/MyPage/MyCommentList.tsx
'use client';

import { useMyComments } from '@/hooks/api/useMyPage';

import styles from './MyPageView.module.scss';

const MyCommentList = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useMyComments();
  const comments = data?.pages.flatMap((p) => p.data) ?? [];

  if (comments.length === 0) {
    return <div className={styles.emptyState}>아직 작성한 댓글이 없어요</div>;
  }

  return (
    <div>
      {comments.map((comment) => (
        <div key={`${comment.hotpickSlug}-${comment.createdAt}`} className={styles.listItem}>
          <p className={styles.listItemTitle}>{comment.hotpickTitle}</p>
          <p className={styles.listItemSub}>
            {comment.content} · {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
          </p>
        </div>
      ))}
      {hasNextPage && (
        <button type="button" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? '로딩 중...' : '더 보기'}
        </button>
      )}
    </div>
  );
};

export default MyCommentList;
```

- [ ] **Step 6: MyPageView 컴포넌트 생성**

```tsx
// src/components/features/MyPage/MyPageView.tsx
'use client';

import { useState } from 'react';

import UserIcon from '@/assets/icon/UserIcon';
import NicknameModal from '@/components/features/Auth/NicknameModal';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { deleteAccount } from '@/hooks/api/useAuthApi';

import MyCommentList from './MyCommentList';
import MyVoteList from './MyVoteList';
import styles from './MyPageView.module.scss';

type Tab = 'votes' | 'comments';

const MyPageView = () => {
  const { user, logout } = useAuth();
  const { showConfirm } = useModal();
  const [activeTab, setActiveTab] = useState<Tab>('votes');
  const [showNicknameModal, setShowNicknameModal] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const handleWithdraw = () => {
    showConfirm('정말 탈퇴하시겠습니까?\n모든 데이터가 삭제됩니다.', {
      onConfirm: async () => {
        try {
          await deleteAccount();
          window.location.href = '/';
        } catch {
          // 실패 처리
        }
      },
    });
  };

  if (!user) return null;

  return (
    <div className={styles.container}>
      <div className={styles.profileSection}>
        <div className={styles.profileImage}>
          {user.profileImageUrl ? <img src={user.profileImageUrl} alt="프로필" /> : <UserIcon />}
        </div>
        <div className={styles.profileInfo}>
          <span className={styles.nickname}>{user.nickname ?? '닉네임 없음'}</span>
          <button
            type="button"
            className={styles.editButton}
            onClick={() => setShowNicknameModal(true)}
          >
            수정
          </button>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'votes' ? styles.active : ''}`}
          onClick={() => setActiveTab('votes')}
        >
          내 투표
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'comments' ? styles.active : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          내 댓글
        </button>
      </div>

      {activeTab === 'votes' ? <MyVoteList /> : <MyCommentList />}

      <div className={styles.footer}>
        <button type="button" className={styles.logoutButton} onClick={handleLogout}>
          로그아웃
        </button>
        <button type="button" className={styles.withdrawButton} onClick={handleWithdraw}>
          회원 탈퇴
        </button>
      </div>

      {showNicknameModal && <NicknameModal isOpen onClose={() => setShowNicknameModal(false)} />}
    </div>
  );
};

export default MyPageView;
```

- [ ] **Step 7: 마이페이지 라우트 생성**

```tsx
// src/app/my/page.tsx
'use client';

import { useEffect } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import MyPageView from '@/components/features/MyPage/MyPageView';

const MyPage = () => {
  const { isLoggedIn, isLoading, requireLogin } = useAuth();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      requireLogin('default');
    }
  }, [isLoading, isLoggedIn, requireLogin]);

  if (isLoading || !isLoggedIn) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          color: '#8a8a8a',
        }}
      >
        로딩 중...
      </div>
    );
  }

  return <MyPageView />;
};

export default MyPage;
```

- [ ] **Step 8: 동작 확인**

Run: `npm run dev`
Expected: /my 접근 시 비로그인이면 로그인 모달 표시

- [ ] **Step 9: 커밋**

```bash
git add src/hooks/api/useMyPage.ts src/app/my/page.tsx src/components/features/MyPage/ src/mocks/handlers.ts
git commit -m "feat(auth): 마이페이지 (내 투표, 내 댓글, 닉네임 수정, 탈퇴)"
```

---

## Task 12: 환경변수 설정 및 최종 확인

**Files:**

- Modify: `.env.local` (또는 `.env.development`)

- [ ] **Step 1: 환경변수 추가**

`.env.local`에 추가 (카카오 개발자센터에서 값 가져오기):

```
NEXT_PUBLIC_KAKAO_CLIENT_ID=카카오_REST_API_키
NEXT_PUBLIC_KAKAO_REDIRECT_URI=http://localhost:3000/auth/kakao/callback
```

> 기존 `NEXT_PUBLIC_KAKAO_APP_KEY`(JavaScript 키, 공유용)와 별개로
> `NEXT_PUBLIC_KAKAO_CLIENT_ID`(REST API 키, 로그인용)가 필요하다.

- [ ] **Step 2: 전체 동작 확인**

Run: `npm run dev`

확인 항목:

1. 메인 페이지 → 헤더에 [로그인] 버튼 표시
2. [로그인] 클릭 → 로그인 모달 표시
3. 좋아요 클릭 → 로그인 모달 (트리거 메시지 확인)
4. 댓글 작성 시도 → 로그인 모달
5. 투표 → 비로그인 상태에서 정상 동작
6. /my 접근 → 로그인 모달

- [ ] **Step 3: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 4: 린트**

Run: `npm run lint`
Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add .env.local
git commit -m "feat(auth): 카카오 로그인 환경변수 설정"
```
