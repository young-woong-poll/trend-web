# MY 페이지 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** MY 페이지 UI를 전면 개선하고, 프로필 색상 시스템, 닉네임 변경 정책, 좋아요 탭, 헤더 프로필 드롭다운을 구현한다.

**Architecture:** 기존 MyPageView를 전면 재작성하고, ProfileAvatar(공통), ProfileDropdown(헤더), ProfileColorModal, LikedHotpickList를 신규 생성한다. AuthContext의 User 인터페이스를 확장하고, BE 미구현 API는 MSW mock으로 대체한다.

**Tech Stack:** Next.js 14 (App Router), TypeScript, SCSS Modules, React Query v5, react-hook-form

---

## File Structure

```
신규 생성:
  src/constants/profileColors.ts              — 프로필 색상 팔레트 상수
  src/components/common/ProfileAvatar/ProfileAvatar.tsx         — 색상 아바타 컴포넌트
  src/components/common/ProfileAvatar/ProfileAvatar.module.scss — 아바타 스타일
  src/components/features/MyPage/LikedHotpickList.tsx           — 좋아요한 핫픽 리스트
  src/components/features/MyPage/ProfileColorModal.tsx          — 프로필 색상 선택 모달
  src/components/features/MyPage/ProfileColorModal.module.scss  — 색상 모달 스타일
  src/components/features/Main/MainHeader/ProfileDropdown.tsx   — 헤더 프로필 드롭다운
  src/components/features/Main/MainHeader/ProfileDropdown.module.scss — 드롭다운 스타일
  src/assets/icon/LogoutIcon.tsx              — 로그아웃 아이콘
  src/assets/icon/PaletteIcon.tsx             — 팔레트 아이콘
  src/assets/icon/EditIcon.tsx                — 편집 아이콘

수정:
  src/contexts/AuthContext.tsx                 — User에 profileColor, lastNicknameChangedAt 추가
  src/hooks/api/useMyPage.ts                  — useMyVotes 제거, useLikedHotpicks 추가
  src/hooks/api/useNickname.ts                — updateProfileColor 추가
  src/components/features/Auth/NicknameModal.tsx — mode prop 추가 (signup/edit)
  src/components/features/MyPage/MyPageView.tsx — 전면 재작성
  src/components/features/MyPage/MyPageView.module.scss — 전면 재작성
  src/components/features/MyPage/MyCommentList.tsx — 카드 스타일 적용
  src/components/features/Main/MainHeader/MainHeader.tsx — 프로필 드롭다운 연동
  src/components/features/Main/MainHeader/MainHeader.module.scss — 드롭다운 위치 스타일

삭제:
  src/components/features/MyPage/MyVoteList.tsx — 내 투표 탭 제거
```

---

### Task 1: 프로필 색상 팔레트 상수 정의

**Files:**

- Create: `src/constants/profileColors.ts`

- [ ] **Step 1: 색상 팔레트 상수 파일 생성**

```typescript
// src/constants/profileColors.ts

export interface ProfileColor {
  name: string;
  start: string;
  end: string;
}

export const PROFILE_COLORS: ProfileColor[] = [
  { name: 'purple', start: '#7C3AED', end: '#A855F7' },
  { name: 'blue', start: '#2563EB', end: '#3B82F6' },
  { name: 'green', start: '#059669', end: '#10B981' },
  { name: 'amber', start: '#D97706', end: '#F59E0B' },
  { name: 'red', start: '#DC2626', end: '#EF4444' },
  { name: 'pink', start: '#DB2777', end: '#EC4899' },
  { name: 'cyan', start: '#0891B2', end: '#06B6D4' },
  { name: 'indigo', start: '#4F46E5', end: '#6366F1' },
];

export const DEFAULT_PROFILE_COLOR = 'purple';

export const getProfileColor = (name: string): ProfileColor => {
  return PROFILE_COLORS.find((c) => c.name === name) ?? PROFILE_COLORS[0];
};

export const getProfileGradient = (name: string): string => {
  const color = getProfileColor(name);
  return `linear-gradient(135deg, ${color.start}, ${color.end})`;
};
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/constants/profileColors.ts
git commit -m "feat(my-page): 프로필 색상 팔레트 상수 정의"
```

---

### Task 2: User 인터페이스 확장 (AuthContext)

**Files:**

- Modify: `src/contexts/AuthContext.tsx`

- [ ] **Step 1: User 인터페이스에 profileColor, lastNicknameChangedAt 추가**

`src/contexts/AuthContext.tsx`에서 User 인터페이스를 수정한다:

```typescript
// 기존:
export interface User {
  id: number;
  nickname: string | null;
  profileImageUrl: string | null;
}

// 변경:
export interface User {
  id: number;
  nickname: string | null;
  profileImageUrl: string | null;
  profileColor: string;
  lastNicknameChangedAt: string | null;
}
```

`profileImageUrl`은 기존 호환성을 위해 유지한다. `profileColor`는 팔레트 이름 (예: "purple"), `lastNicknameChangedAt`는 ISO 8601 문자열 또는 null.

- [ ] **Step 2: AuthProvider에서 getMe 응답 처리 확인**

`src/providers/AuthProvider.tsx`는 `getMe()` 반환값을 그대로 `setUser(me)`로 설정하므로, BE가 새 필드를 반환하면 자동으로 반영된다. BE 미구현 시 MSW mock에서 기본값을 포함시키면 된다. 현재는 타입만 확장하면 된다.

- [ ] **Step 3: 타입 체크 및 타입 에러 수정**

Run: `npx tsc --noEmit --pretty 2>&1 | head -40`

MyPageView.tsx에 하드코딩된 user 객체가 있다 (line 44-47). 새 필드를 추가한다:

`src/components/features/MyPage/MyPageView.tsx`에서:

```typescript
// 기존:
const user = {
  nickname: '김우웅일',
  profileImageUrl: null,
};

// 변경:
const user = {
  nickname: '김우웅일',
  profileImageUrl: null,
  profileColor: 'purple',
  lastNicknameChangedAt: null,
};
```

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/contexts/AuthContext.tsx src/components/features/MyPage/MyPageView.tsx
git commit -m "feat(my-page): User 인터페이스에 profileColor, lastNicknameChangedAt 추가"
```

---

### Task 3: ProfileAvatar 공통 컴포넌트

**Files:**

- Create: `src/components/common/ProfileAvatar/ProfileAvatar.tsx`
- Create: `src/components/common/ProfileAvatar/ProfileAvatar.module.scss`

- [ ] **Step 1: ProfileAvatar 컴포넌트 생성**

```typescript
// src/components/common/ProfileAvatar/ProfileAvatar.tsx
import type { FC } from 'react';

import { getProfileGradient } from '@/constants/profileColors';

import styles from './ProfileAvatar.module.scss';

interface ProfileAvatarProps {
  nickname: string | null;
  profileColor: string;
  size?: number;
}

const ProfileAvatar: FC<ProfileAvatarProps> = ({ nickname, profileColor, size = 72 }) => {
  const initial = nickname ? nickname.charAt(0) : '?';
  const fontSize = Math.round(size * 0.38);

  return (
    <div
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        background: getProfileGradient(profileColor),
        fontSize,
      }}
    >
      <span className={styles.initial}>{initial}</span>
    </div>
  );
};

export default ProfileAvatar;
```

- [ ] **Step 2: ProfileAvatar 스타일 생성**

```scss
// src/components/common/ProfileAvatar/ProfileAvatar.module.scss
.avatar {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.initial {
  color: #fff;
  font-weight: 700;
  line-height: 1;
  user-select: none;
}
```

- [ ] **Step 3: 타입 체크**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/components/common/ProfileAvatar/
git commit -m "feat(my-page): ProfileAvatar 공통 컴포넌트 생성"
```

---

### Task 4: SVG 아이콘 생성 (LogoutIcon, EditIcon, PaletteIcon)

**Files:**

- Create: `src/assets/icon/LogoutIcon.tsx`
- Create: `src/assets/icon/EditIcon.tsx`
- Create: `src/assets/icon/PaletteIcon.tsx`

- [ ] **Step 1: LogoutIcon 생성**

```typescript
// src/assets/icon/LogoutIcon.tsx
import type { FC, SVGProps } from 'react';

const LogoutIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <polyline
      points="16 17 21 12 16 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="21"
      y1="12"
      x2="9"
      y2="12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default LogoutIcon;
```

- [ ] **Step 2: EditIcon 생성**

```typescript
// src/assets/icon/EditIcon.tsx
import type { FC, SVGProps } from 'react';

const EditIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default EditIcon;
```

- [ ] **Step 3: PaletteIcon 생성**

```typescript
// src/assets/icon/PaletteIcon.tsx
import type { FC, SVGProps } from 'react';

const PaletteIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="8" r="1.5" fill="currentColor" />
    <circle cx="8" cy="12" r="1.5" fill="currentColor" />
    <circle cx="16" cy="12" r="1.5" fill="currentColor" />
    <circle cx="12" cy="16" r="1.5" fill="currentColor" />
  </svg>
);

export default PaletteIcon;
```

- [ ] **Step 4: 타입 체크**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/assets/icon/LogoutIcon.tsx src/assets/icon/EditIcon.tsx src/assets/icon/PaletteIcon.tsx
git commit -m "feat(my-page): LogoutIcon, EditIcon, PaletteIcon SVG 아이콘 추가"
```

---

### Task 5: 좋아요한 핫픽 API 훅 & 쿼리 키 정리

**Files:**

- Modify: `src/hooks/api/useMyPage.ts`

- [ ] **Step 1: useMyVotes 제거, useLikedHotpicks 추가**

`src/hooks/api/useMyPage.ts` 파일을 아래 내용으로 교체한다:

```typescript
// src/hooks/api/useMyPage.ts
import { useInfiniteQuery } from '@tanstack/react-query';

import axiosInstance from '@/lib/axios';

interface MyCommentItem {
  hotpickSlug: string;
  hotpickTitle: string;
  content: string;
  createdAt: string;
}

interface LikedHotpickItem {
  hotpickId: number;
  hotpickAlias: string;
  hotpickTitle: string;
  optionSummary: string;
  likedAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; totalPages: number };
}

export const myPageKeys = {
  comments: ['myPage', 'comments'] as const,
  likes: ['myPage', 'likes'] as const,
};

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

export const useLikedHotpicks = () =>
  useInfiniteQuery({
    queryKey: myPageKeys.likes,
    queryFn: async ({ pageParam = 1 }) => {
      const res = await axiosInstance.get('/api/users/me/likes', {
        params: { page: pageParam, size: 20 },
      });
      return res as unknown as PaginatedResponse<LikedHotpickItem>;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
  });
```

- [ ] **Step 2: MyVoteList.tsx 삭제**

`src/components/features/MyPage/MyVoteList.tsx` 파일을 삭제한다.

Run: `rm src/components/features/MyPage/MyVoteList.tsx`

- [ ] **Step 3: 타입 체크**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`

MyPageView.tsx에서 MyVoteList import를 사용하고 있으므로 에러가 날 수 있다. 이 에러는 Task 8에서 MyPageView 전면 재작성 시 해결된다. 지금은 일단 MyPageView.tsx에서 MyVoteList import와 사용 부분을 주석 처리한다:

`src/components/features/MyPage/MyPageView.tsx`에서:

```typescript
// 기존 line 9:
import MyVoteList from '@/components/features/MyPage/MyVoteList';

// 삭제 (해당 라인 제거)
```

그리고 line 84:

```typescript
// 기존:
{activeTab === 'votes' ? <MyVoteList /> : <MyCommentList />}

// 변경:
<MyCommentList />
```

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/hooks/api/useMyPage.ts src/components/features/MyPage/MyPageView.tsx
git rm src/components/features/MyPage/MyVoteList.tsx
git commit -m "feat(my-page): useMyVotes 제거, useLikedHotpicks 추가, MyVoteList 삭제"
```

---

### Task 6: 프로필 색상 변경 API 함수 추가

**Files:**

- Modify: `src/hooks/api/useNickname.ts`

- [ ] **Step 1: updateProfileColor 함수 추가**

`src/hooks/api/useNickname.ts` 파일 끝에 추가:

```typescript
export const updateProfileColor = async (profileColor: string): Promise<void> => {
  await axiosInstance.patch('/api/auth/me', { profileColor });
};
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/hooks/api/useNickname.ts
git commit -m "feat(my-page): updateProfileColor API 함수 추가"
```

---

### Task 7: NicknameModal 수정 — signup/edit 모드 분리

**Files:**

- Modify: `src/components/features/Auth/NicknameModal.tsx`

- [ ] **Step 1: mode prop 추가 및 UI 분기**

`src/components/features/Auth/NicknameModal.tsx` 전체를 아래로 교체:

```typescript
'use client';

import { useCallback, useEffect, useState } from 'react';

import { useForm } from 'react-hook-form';

import { Modal } from '@/components/common/Modal/Modal';
import styles from '@/components/features/Auth/NicknameModal.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import {
  checkNicknameAvailability,
  getSuggestedNickname,
  updateNickname,
} from '@/hooks/api/useNickname';

interface NicknameForm {
  nickname: string;
}

interface NicknameModalProps {
  isOpen: boolean;
  onClose?: () => void;
  mode?: 'signup' | 'edit';
}

const NicknameModal = ({ isOpen, onClose, mode = 'signup' }: NicknameModalProps) => {
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

  const loadSuggestion = useCallback(async () => {
    try {
      const suggested = await getSuggestedNickname();
      setValue('nickname', suggested);
      clearErrors('nickname');
    } catch {
      // 실패 시 유저가 직접 입력
    }
  }, [setValue, clearErrors]);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && user?.nickname) {
        setValue('nickname', user.nickname);
        clearErrors('nickname');
      } else {
        void loadSuggestion();
      }
    }
  }, [isOpen, mode, user?.nickname, setValue, clearErrors, loadSuggestion]);

  const handleBlur = async () => {
    if (!nicknameValue?.trim()) {
      return;
    }
    // edit 모드에서 현재 닉네임과 동일하면 검사 스킵
    if (mode === 'edit' && nicknameValue.trim() === user?.nickname) {
      clearErrors('nickname');
      return;
    }
    setIsChecking(true);
    try {
      const available = await checkNicknameAvailability(nicknameValue.trim());
      if (!available) {
        setError('nickname', { message: '중복된 닉네임입니다' });
      } else {
        clearErrors('nickname');
      }
    } catch {
      // 검사 실패 시 submit에서 재확인
    } finally {
      setIsChecking(false);
    }
  };

  const onSubmit = async (data: NicknameForm) => {
    const trimmed = data.nickname.trim();
    if (!trimmed) {
      return;
    }

    // edit 모드에서 현재 닉네임과 동일하면 그냥 닫기
    if (mode === 'edit' && trimmed === user?.nickname) {
      onClose?.();
      return;
    }

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

  if (!isOpen) {
    return null;
  }

  const title = mode === 'edit' ? '닉네임 변경' : '닉네임을 설정해주세요';
  const submitLabel = mode === 'edit' ? '변경하기' : '시작하기';
  const submittingLabel = mode === 'edit' ? '변경 중...' : '설정 중...';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnDimmedClick={!!onClose}
      showCloseButton={!!onClose}
      maxWidth={400}
    >
      <form className={styles.container} onSubmit={handleSubmit(onSubmit)}>
        <h2 className={styles.title}>{title}</h2>

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
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
      </form>
    </Modal>
  );
};

export default NicknameModal;
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/features/Auth/NicknameModal.tsx
git commit -m "feat(my-page): NicknameModal에 signup/edit 모드 분리"
```

---

### Task 8: ProfileColorModal 컴포넌트

**Files:**

- Create: `src/components/features/MyPage/ProfileColorModal.tsx`
- Create: `src/components/features/MyPage/ProfileColorModal.module.scss`

- [ ] **Step 1: ProfileColorModal 컴포넌트 생성**

```typescript
// src/components/features/MyPage/ProfileColorModal.tsx
'use client';

import { useState } from 'react';

import { Modal } from '@/components/common/Modal/Modal';
import { PROFILE_COLORS, getProfileGradient } from '@/constants/profileColors';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfileColor } from '@/hooks/api/useNickname';

import styles from './ProfileColorModal.module.scss';

interface ProfileColorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileColorModal = ({ isOpen, onClose }: ProfileColorModalProps) => {
  const { user, setUser } = useAuth();
  const [selected, setSelected] = useState(user?.profileColor ?? 'purple');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (selected === user?.profileColor) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfileColor(selected);
      setUser(user ? { ...user, profileColor: selected } : null);
      onClose();
    } catch {
      // 실패 시 무시
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} closeOnDimmedClick showCloseButton maxWidth={360}>
      <div className={styles.container}>
        <h2 className={styles.title}>프로필 색상</h2>
        <div className={styles.grid}>
          {PROFILE_COLORS.map((color) => (
            <button
              key={color.name}
              type="button"
              className={`${styles.colorButton} ${selected === color.name ? styles.selected : ''}`}
              style={{ background: getProfileGradient(color.name) }}
              onClick={() => setSelected(color.name)}
              aria-label={color.name}
            />
          ))}
        </div>
        <button
          type="button"
          className={styles.saveButton}
          onClick={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? '변경 중...' : '변경'}
        </button>
      </div>
    </Modal>
  );
};

export default ProfileColorModal;
```

- [ ] **Step 2: ProfileColorModal 스타일 생성**

```scss
// src/components/features/MyPage/ProfileColorModal.module.scss
@use '@/styles/variables' as *;

.container {
  padding: 24px 20px;
}

.title {
  font-size: $font-size-18;
  font-weight: $font-weight-semibold;
  color: $white;
  margin-bottom: 24px;
  text-align: center;
}

.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-bottom: 24px;
}

.colorButton {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 3px solid transparent;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
}

.selected {
  border-color: $white;
}

.saveButton {
  width: 100%;
  padding: 12px;
  font-size: $font-size-14;
  font-weight: $font-weight-semibold;
  color: $white;
  background: $primary-gradient;
  border: none;
  border-radius: $border-radius-md;
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
```

- [ ] **Step 3: 타입 체크**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/components/features/MyPage/ProfileColorModal.tsx src/components/features/MyPage/ProfileColorModal.module.scss
git commit -m "feat(my-page): ProfileColorModal 프로필 색상 선택 모달 구현"
```

---

### Task 9: LikedHotpickList 컴포넌트

**Files:**

- Create: `src/components/features/MyPage/LikedHotpickList.tsx`

- [ ] **Step 1: LikedHotpickList 컴포넌트 생성**

```typescript
// src/components/features/MyPage/LikedHotpickList.tsx
'use client';

import Link from 'next/link';

import styles from '@/components/features/MyPage/MyPageView.module.scss';
import { useLikedHotpicks } from '@/hooks/api/useMyPage';

const LikedHotpickList = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useLikedHotpicks();
  const likes = data?.pages.flatMap((p) => p.data) ?? [];

  if (likes.length === 0) {
    return <div className={styles.emptyState}>아직 좋아요한 핫픽이 없어요</div>;
  }

  return (
    <div className={styles.listContainer}>
      {likes.map((item) => (
        <Link
          key={item.hotpickId}
          href={`/hotpick/${item.hotpickAlias}`}
          className={styles.card}
        >
          <p className={styles.cardTitle}>{item.hotpickTitle}</p>
          <p className={styles.cardSub}>{item.optionSummary}</p>
          <p className={styles.cardDate}>
            {new Date(item.likedAt).toLocaleDateString('ko-KR')}
          </p>
        </Link>
      ))}
      {hasNextPage && (
        <button
          type="button"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className={styles.loadMoreButton}
        >
          {isFetchingNextPage ? '로딩 중...' : '더 보기'}
        </button>
      )}
    </div>
  );
};

export default LikedHotpickList;
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

스타일 클래스(`listContainer`, `card`, `cardTitle`, `cardSub`, `cardDate`, `loadMoreButton`)가 아직 없어서 경고가 날 수 있으나, SCSS 모듈은 타입 에러를 발생시키지 않는다. Task 10에서 스타일을 재작성할 때 해결된다.

- [ ] **Step 3: 커밋**

```bash
git add src/components/features/MyPage/LikedHotpickList.tsx
git commit -m "feat(my-page): LikedHotpickList 좋아요한 핫픽 리스트 컴포넌트 구현"
```

---

### Task 10: MyCommentList 카드 스타일 적용

**Files:**

- Modify: `src/components/features/MyPage/MyCommentList.tsx`

- [ ] **Step 1: MyCommentList를 새 카드 스타일로 수정**

`src/components/features/MyPage/MyCommentList.tsx` 전체를 아래로 교체:

```typescript
// src/components/features/MyPage/MyCommentList.tsx
'use client';

import Link from 'next/link';

import styles from '@/components/features/MyPage/MyPageView.module.scss';
import { useMyComments } from '@/hooks/api/useMyPage';

const MyCommentList = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useMyComments();
  const comments = data?.pages.flatMap((p) => p.data) ?? [];

  if (comments.length === 0) {
    return <div className={styles.emptyState}>아직 작성한 댓글이 없어요</div>;
  }

  return (
    <div className={styles.listContainer}>
      {comments.map((comment) => (
        <Link
          key={`${comment.hotpickSlug}-${comment.createdAt}`}
          href={`/hotpick/${comment.hotpickSlug}`}
          className={styles.card}
        >
          <p className={styles.cardSub}>{comment.hotpickTitle}</p>
          <p className={styles.cardTitle}>{comment.content}</p>
          <p className={styles.cardDate}>
            {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
          </p>
        </Link>
      ))}
      {hasNextPage && (
        <button
          type="button"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className={styles.loadMoreButton}
        >
          {isFetchingNextPage ? '로딩 중...' : '더 보기'}
        </button>
      )}
    </div>
  );
};

export default MyCommentList;
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/features/MyPage/MyCommentList.tsx
git commit -m "refactor(my-page): MyCommentList 카드 스타일 적용 및 링크 추가"
```

---

### Task 11: MyPageView 전면 재작성 (TSX + SCSS)

**Files:**

- Modify: `src/components/features/MyPage/MyPageView.tsx`
- Modify: `src/components/features/MyPage/MyPageView.module.scss`

- [ ] **Step 1: MyPageView.tsx 전면 재작성**

`src/components/features/MyPage/MyPageView.tsx` 전체를 아래로 교체:

```typescript
// src/components/features/MyPage/MyPageView.tsx
'use client';

import { useState } from 'react';

import EditIcon from '@/assets/icon/EditIcon';
import PaletteIcon from '@/assets/icon/PaletteIcon';
import ProfileAvatar from '@/components/common/ProfileAvatar/ProfileAvatar';
import NicknameModal from '@/components/features/Auth/NicknameModal';
import LikedHotpickList from '@/components/features/MyPage/LikedHotpickList';
import MyCommentList from '@/components/features/MyPage/MyCommentList';
import styles from '@/components/features/MyPage/MyPageView.module.scss';
import ProfileColorModal from '@/components/features/MyPage/ProfileColorModal';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { deleteAccount } from '@/hooks/api/useAuthApi';

type Tab = 'comments' | 'likes';

const NICKNAME_CHANGE_INTERVAL_DAYS = 30;

const canChangeNickname = (lastChangedAt: string | null): boolean => {
  if (!lastChangedAt) return true;
  const last = new Date(lastChangedAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= NICKNAME_CHANGE_INTERVAL_DAYS;
};

const daysUntilNicknameChange = (lastChangedAt: string | null): number => {
  if (!lastChangedAt) return 0;
  const last = new Date(lastChangedAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, NICKNAME_CHANGE_INTERVAL_DAYS - diffDays);
};

const MyPageView = () => {
  const { user, logout } = useAuth();
  const { showConfirm, showToast } = useModal();
  const [activeTab, setActiveTab] = useState<Tab>('comments');
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);

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

  const handleNicknameEdit = () => {
    if (!canChangeNickname(user?.lastNicknameChangedAt ?? null)) {
      const days = daysUntilNicknameChange(user?.lastNicknameChangedAt ?? null);
      showToast(`닉네임은 ${days}일 후에 변경할 수 있어요`);
      return;
    }
    setShowNicknameModal(true);
  };

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      {/* 프로필 영역 */}
      <div className={styles.profileSection}>
        <ProfileAvatar
          nickname={user.nickname}
          profileColor={user.profileColor}
          size={72}
        />
        <div className={styles.profileName}>
          {user.nickname ?? '닉네임 없음'}
          <span className={styles.profileSuffix}>님</span>
        </div>
      </div>

      {/* 관리 버튼 */}
      <div className={styles.actionButtons}>
        <button type="button" className={styles.actionButton} onClick={handleNicknameEdit}>
          <EditIcon width={14} height={14} />
          닉네임 변경
        </button>
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => setShowColorModal(true)}
        >
          <PaletteIcon width={14} height={14} />
          프로필 색상
        </button>
      </div>

      {/* 구분선 */}
      <div className={styles.divider} />

      {/* 탭 */}
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'comments' ? styles.active : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          내 댓글
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'likes' ? styles.active : ''}`}
          onClick={() => setActiveTab('likes')}
        >
          좋아요한 핫픽
        </button>
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'comments' ? <MyCommentList /> : <LikedHotpickList />}

      {/* 구분선 */}
      <div className={styles.divider} />

      {/* 계정 관리 */}
      <div className={styles.accountSection}>
        <button type="button" className={styles.logoutButton} onClick={handleLogout}>
          로그아웃
        </button>
        <button type="button" className={styles.withdrawButton} onClick={handleWithdraw}>
          회원 탈퇴
        </button>
      </div>

      {/* 모달 */}
      {showNicknameModal && (
        <NicknameModal
          isOpen
          onClose={() => setShowNicknameModal(false)}
          mode="edit"
        />
      )}
      {showColorModal && (
        <ProfileColorModal isOpen onClose={() => setShowColorModal(false)} />
      )}
    </div>
  );
};

export default MyPageView;
```

- [ ] **Step 2: MyPageView.module.scss 전면 재작성**

`src/components/features/MyPage/MyPageView.module.scss` 전체를 아래로 교체:

```scss
// src/components/features/MyPage/MyPageView.module.scss
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;

.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px 16px 80px;
}

// ─── 프로필 영역 ───
.profileSection {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 20px 24px;
}

.profileName {
  margin-top: 12px;
  font-size: $font-size-18;
  font-weight: $font-weight-semibold;
  color: $white;
}

.profileSuffix {
  font-weight: $font-weight-regular;
  color: $text-secondary;
}

// ─── 관리 버튼 ───
.actionButtons {
  display: flex;
  gap: 8px;
  justify-content: center;
  padding-bottom: 20px;
}

.actionButton {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: $border-rounded;
  border: 1px solid $border-placeholder;
  background: none;
  font-size: $font-size-12;
  color: $text-secondary;
  cursor: pointer;
  @include transition(all, 0.2s, ease);

  &:hover {
    border-color: $text-secondary;
    color: $white;
  }

  svg {
    color: $text-tertiary;
  }
}

// ─── 구분선 ───
.divider {
  height: 8px;
  background: #1a1a1a;
  margin: 0 -16px;
}

// ─── 탭 ───
.tabs {
  display: flex;
  border-bottom: 1px solid #333;
}

.tab {
  flex: 1;
  padding: 14px 0;
  text-align: center;
  font-size: $font-size-14;
  font-weight: $font-weight-semibold;
  color: $text-tertiary;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  @include transition(all, 0.2s, ease);

  &.active {
    color: $white;
    border-bottom-color: $primary-start;
  }
}

// ─── 리스트 공통 ───
.listContainer {
  padding: 16px 0;
}

.card {
  display: block;
  background: $bg-secondary;
  border-radius: $border-radius-lg;
  padding: 14px 16px;
  margin-bottom: 10px;
  text-decoration: none;
  @include transition(background, 0.2s, ease);

  &:hover {
    background: $bg-tertiary;
  }
}

.cardTitle {
  font-size: $font-size-14;
  color: $text-secondary;
  margin-bottom: 6px;
  @include line-clamp(2);
}

.cardSub {
  font-size: $font-size-12;
  color: $text-tertiary;
  margin-bottom: 6px;
}

.cardDate {
  font-size: 11px;
  color: $border-placeholder;
}

.emptyState {
  text-align: center;
  padding: 48px 0;
  color: $text-tertiary;
  font-size: $font-size-14;
}

.loadMoreButton {
  display: block;
  width: 100%;
  padding: 12px;
  margin-top: 8px;
  font-size: $font-size-14;
  color: $text-secondary;
  background: $bg-secondary;
  border: 1px solid #333;
  border-radius: $border-radius-md;
  cursor: pointer;
  text-align: center;
  @include transition(background, 0.2s, ease);

  &:hover {
    background: $bg-tertiary;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// ─── 계정 관리 ───
.accountSection {
  padding: 20px 0;
}

.logoutButton {
  display: block;
  width: 100%;
  padding: 12px 0;
  font-size: $font-size-14;
  color: $text-secondary;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  @include transition(color, 0.2s, ease);

  &:hover {
    color: $white;
  }
}

.withdrawButton {
  display: block;
  width: 100%;
  padding: 12px 0;
  font-size: $font-size-14;
  color: $error;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  @include transition(opacity, 0.2s, ease);

  &:hover {
    opacity: 0.8;
  }
}
```

- [ ] **Step 3: 타입 체크**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 에러 없음

- [ ] **Step 4: 빌드 확인**

Run: `npx next build 2>&1 | tail -20`
Expected: 빌드 성공

- [ ] **Step 5: 커밋**

```bash
git add src/components/features/MyPage/MyPageView.tsx src/components/features/MyPage/MyPageView.module.scss
git commit -m "feat(my-page): MyPageView 전면 재작성 — 프로필, 2탭, 계정 관리"
```

---

### Task 12: ProfileDropdown 컴포넌트 (헤더용)

**Files:**

- Create: `src/components/features/Main/MainHeader/ProfileDropdown.tsx`
- Create: `src/components/features/Main/MainHeader/ProfileDropdown.module.scss`

- [ ] **Step 1: ProfileDropdown 컴포넌트 생성**

```typescript
// src/components/features/Main/MainHeader/ProfileDropdown.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import LogoutIcon from '@/assets/icon/LogoutIcon';
import UserIcon from '@/assets/icon/UserIcon';
import ProfileAvatar from '@/components/common/ProfileAvatar/ProfileAvatar';
import { useAuth } from '@/contexts/AuthContext';

import styles from './ProfileDropdown.module.scss';

const ProfileDropdown = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const close = useCallback(() => setIsOpen(false), []);

  const handleMyPage = () => {
    close();
    router.push('/my');
  };

  const handleLogout = async () => {
    close();
    await logout();
    window.location.href = '/';
  };

  // 바깥 클릭으로 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, close]);

  // ESC로 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  if (!user) return null;

  return (
    <div className={styles.wrapper} ref={dropdownRef}>
      <button type="button" className={styles.trigger} onClick={toggle} aria-label="프로필 메뉴">
        <ProfileAvatar nickname={user.nickname} profileColor={user.profileColor} size={32} />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <button type="button" className={styles.menuItem} onClick={handleMyPage}>
            <UserIcon width={16} height={16} />
            <span>마이페이지</span>
          </button>
          <div className={styles.menuDivider} />
          <button type="button" className={`${styles.menuItem} ${styles.danger}`} onClick={handleLogout}>
            <LogoutIcon width={16} height={16} />
            <span>로그아웃</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
```

- [ ] **Step 2: ProfileDropdown 스타일 생성**

```scss
// src/components/features/Main/MainHeader/ProfileDropdown.module.scss
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;

.wrapper {
  position: relative;
  flex-shrink: 0;
}

.trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  border-radius: 50%;
  @include transition(opacity, 0.2s, ease);

  &:hover {
    opacity: 0.85;
  }
}

.dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 180px;
  background: $bg-tertiary;
  border-radius: $border-radius-lg;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: $z-index-dropdown;
  overflow: hidden;
}

.menuItem {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 14px 16px;
  font-size: $font-size-14;
  color: $text-secondary;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  @include transition(background, 0.15s, ease);

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  svg {
    flex-shrink: 0;
    color: $text-tertiary;
  }
}

.danger {
  color: $error;

  svg {
    color: $error;
  }
}

.menuDivider {
  height: 1px;
  background: #3a3a3a;
}
```

- [ ] **Step 3: 타입 체크**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/components/features/Main/MainHeader/ProfileDropdown.tsx src/components/features/Main/MainHeader/ProfileDropdown.module.scss
git commit -m "feat(my-page): ProfileDropdown 헤더 프로필 드롭다운 구현"
```

---

### Task 13: MainHeader에 ProfileDropdown 연동

**Files:**

- Modify: `src/components/features/Main/MainHeader/MainHeader.tsx`

- [ ] **Step 1: MainHeader에서 프로필 버튼을 ProfileDropdown으로 교체**

`src/components/features/Main/MainHeader/MainHeader.tsx`에서:

1. import 추가 (파일 상단, 기존 import 영역에):

```typescript
import ProfileDropdown from '@/components/features/Main/MainHeader/ProfileDropdown';
```

2. `UserIcon` import 제거 (ProfileDropdown 내부에서 이미 사용):

```typescript
// 이 줄을 삭제:
import UserIcon from '@/assets/icon/UserIcon';
```

주의: `UserIcon`은 비로그인 상태의 모바일 로그인 아이콘에서도 쓰이고 있다 (line 191). 확인 후:

- 비로그인 상태 loginButton 안에서 `<UserIcon className={styles.loginIcon} width={20} height={20} />`을 사용하므로, **UserIcon import는 유지**해야 한다.

따라서 import 변경은 `ProfileDropdown` 추가만 한다.

3. 로그인 상태 프로필 버튼 부분을 교체 (line 172-183):

```typescript
// 기존:
{isLoggedIn ? (
  <button
    type="button"
    className={styles.profileButton}
    onClick={() => router.push('/my')}
  >
    {user?.profileImageUrl ? (
      <img src={user.profileImageUrl} alt="프로필" />
    ) : (
      <UserIcon />
    )}
  </button>
) : (

// 변경:
{isLoggedIn ? (
  <ProfileDropdown />
) : (
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 에러 없음

- [ ] **Step 3: 빌드 확인**

Run: `npx next build 2>&1 | tail -20`
Expected: 빌드 성공

- [ ] **Step 4: 커밋**

```bash
git add src/components/features/Main/MainHeader/MainHeader.tsx
git commit -m "feat(my-page): MainHeader 프로필 버튼을 ProfileDropdown으로 교체"
```

---

### Task 14: 최종 검증 및 정리

**Files:**

- 전체 프로젝트

- [ ] **Step 1: 전체 타입 체크**

Run: `npx tsc --noEmit --pretty`
Expected: 에러 없음

- [ ] **Step 2: 린트 체크**

Run: `npx next lint 2>&1 | tail -20`
Expected: 에러 없음 (또는 기존 경고만)

- [ ] **Step 3: 빌드 확인**

Run: `npx next build 2>&1 | tail -20`
Expected: 빌드 성공

- [ ] **Step 4: 사용하지 않는 import/파일 확인**

`MainHeader.module.scss`의 `.profileButton` 클래스는 더 이상 사용되지 않는다. 삭제한다:

`src/components/features/Main/MainHeader/MainHeader.module.scss`에서 line 260-284 (`.profileButton` 블록)을 삭제:

```scss
// 이 블록 전체를 삭제:
// ─── 프로필 버튼 ───
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

- [ ] **Step 5: 최종 빌드 확인**

Run: `npx next build 2>&1 | tail -20`
Expected: 빌드 성공

- [ ] **Step 6: 커밋**

```bash
git add src/components/features/Main/MainHeader/MainHeader.module.scss
git commit -m "chore(my-page): 미사용 profileButton 스타일 제거"
```
