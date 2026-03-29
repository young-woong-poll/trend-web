# 카카오 로그인 기능 설계서

> 작성일: 2026-03-22
> 상태: Draft

## 1. 개요

HotPick 서비스에 카카오 로그인을 도입한다.

### 목표

- 카카오 소셜 로그인(카카오 전용)
- 비로그인 투표/좋아요/댓글 이력을 최초 1회 계정에 병합
- 간단한 마이페이지(내 투표, 내 댓글, 닉네임 변경)

## 2. 인증 플로우

### 2.1 카카오 로그인 시퀀스

```
유저 → 로그인 버튼 클릭
  → 로그인 의도(trigger, 현재 URL)를 sessionStorage에 저장
  → 카카오 인가 페이지로 리다이렉트 (window.location.href)
  → 카카오가 인가코드와 함께 /auth/kakao/callback?code=xxx 으로 리다이렉트
  → /auth/kakao/callback 페이지 ('use client'):
    1. searchParams에서 code 추출
    2. POST /api/auth/kakao { code } 호출
    3. BE: 카카오 토큰 교환 → 유저 생성/조회 → JWT 발급 → httpOnly 쿠키 설정
    4. FE: 응답에서 유저 정보 수신
    5. sessionStorage에서 로그인 의도 복원
    6. 원래 페이지로 router.replace(savedUrl) 이동
  → AuthProvider가 쿠키 기반으로 로그인 상태 감지
  → 신규 유저(isNewUser) → 닉네임 설정 모달 → tku-id 통합 → 서비스 시작
  → 기존 유저 → 정상 이용
```

#### 카카오 앱스킴 로그인

카카오 인가 페이지(`kauth.kakao.com`)로 리다이렉트하면, 카카오가 디바이스/앱 설치 여부를 자동 판단한다:

| 환경                     | 동작                                             |
| ------------------------ | ------------------------------------------------ |
| 모바일 + 카카오톡 설치됨 | 카카오톡 앱으로 자동 전환 (앱스킴) → 동의 → 콜백 |
| 모바일 + 카카오톡 미설치 | 카카오 웹 로그인 (ID/PW 입력)                    |
| PC 브라우저              | 카카오 웹 로그인 (ID/PW 또는 QR)                 |
| 카카오톡 인앱 브라우저   | 이미 로그인 상태 → 동의만 → 콜백                 |

FE에서 별도 구현 불필요. `window.location.href`로 카카오 인가 URL 리다이렉트만 하면 된다.

#### 카카오 콜백 페이지 상세

- `src/app/auth/kakao/callback/page.tsx`: **클라이언트 컴포넌트** ('use client')
- `searchParams`에서 `code` 추출 후 BE에 전달
- `redirectUri`는 `process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI`로 고정 (하드코딩 금지)
  - 개발: `http://localhost:3000/auth/kakao/callback`
  - 프로덕션: `https://hotpick.kr/auth/kakao/callback`
- 에러 처리: code 없거나 BE 호출 실패 시 → 에러 토스트 + 메인 페이지로 리다이렉트

#### callback 소멸 문제 대응

카카오 로그인은 페이지 전체 리다이렉트이므로 JavaScript 메모리의 callback 함수는 소멸한다.
따라서 `requireLogin()` 호출 시 callback을 직접 저장하지 않고, 로그인 의도를 sessionStorage에 저장한다:

```typescript
// requireLogin 호출 시 sessionStorage에 저장
sessionStorage.setItem(
  'auth_intent',
  JSON.stringify({
    trigger: 'like', // 트리거 종류
    returnUrl: window.location.href, // 돌아올 URL
  })
);
```

로그인 완료 후 원래 페이지로 돌아오면, 유저가 다시 동일 동작(좋아요 등)을 직접 수행한다.
callback 자동 실행은 하지 않는다 — 페이지 이동 후 자동 좋아요 등은 UX 혼란을 줄 수 있다.

### 2.2 토큰 관리

| 항목             | 설명                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------- |
| AccessToken      | httpOnly 쿠키, 짧은 만료 (BE 결정)                                                           |
| RefreshToken     | httpOnly 쿠키, 긴 만료 (BE 결정)                                                             |
| FE 저장값        | 없음. 쿠키는 BE가 설정, FE는 withCredentials: true로 자동 전송                               |
| 토큰 갱신        | axios interceptor에서 401 응답 시 /api/auth/refresh 호출 → 실패 시 로그아웃 (상세: 섹션 3.2) |
| 로그인 상태 확인 | 페이지 로드 시 GET /api/auth/me 호출 → 유저 정보 또는 401                                    |

### 2.3 tku-id 통합 (최초 1회)

로그인 성공 시:

1. BE 응답의 isNewUser 플래그 확인
2. isNewUser이고 `hasTKUID()`가 true → `POST /api/auth/link { tkuId: getTKUID() }` 호출
   - 주의: `getTKUID()`는 값이 없으면 새 UUID를 생성하는 사이드 이펙트가 있으므로, 반드시 `hasTKUID()`로 먼저 존재 여부를 확인한다
3. 서버: 투표만 이관 (댓글/좋아요/공감은 처음부터 로그인 전용이므로 이관 대상 없음)
4. 충돌 처리: 동일 핫픽에 기존 투표가 있으면 최신(tku-id 투표)으로 덮어쓰기
5. 이관 완료 후 clearTKUID()
6. 이미 linked된 유저(기존 유저) → tku-id 데이터 삭제만 수행, 이관 안 함

#### 멀티 브라우저 환경 대응

카카오 웹뷰, 인스타 웹뷰, 크롬 등 브라우저마다 localStorage가 별도이므로 tku-id가 환경마다 다르다.
최초 1회만 link하고 이후에는 tku-id 이력을 이관하지 않는다 (서버에 linked_at 타임스탬프로 판별).

---

## 3. FE 아키텍처

### 3.1 AuthContext

```typescript
// src/contexts/AuthContext.tsx

interface User {
  id: number;
  nickname: string | null; // null이면 닉네임 미설정 (온보딩 미완료)
  profileImageUrl: string | null;
}

// POST /api/auth/kakao 응답 전용 (isNewUser는 로그인 시점에만 사용)
interface LoginResponse {
  user: User;
  isNewUser: boolean;
}

interface AuthContextValue {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  requireLogin: (trigger: LoginTrigger) => void; // callback 없음 (페이지 리다이렉트 방식)
  logout: () => void;
}

type LoginTrigger = 'comment' | 'like' | 'default';
```

> `isNewUser`는 `User` 타입에 포함하지 않는다. `POST /api/auth/kakao` 응답에서만 사용되며, `GET /api/auth/me` 응답과 타입이 일치하지 않기 때문이다. 콜백 페이지에서 `LoginResponse`로 처리 후 `AuthContext`에는 `User`만 저장한다.

#### 동작 방식

- 앱 마운트 시 `GET /api/auth/me` 호출로 로그인 상태 확인
  - 로그인 상태 → `user` 설정
  - 비로그인 (401) → `user = null`
  - `user`가 존재하고 `nickname === null` → 닉네임 설정 모달 표시 (온보딩 미완료)
- `requireLogin(trigger)`:
  - 로그인 상태 → 아무 동작 안 함 (호출자가 이후 로직 직접 실행)
  - 비로그인 → sessionStorage에 `{ trigger, returnUrl }` 저장 후 로그인 모달 띄움
  - 페이지 리다이렉트 방식이므로 callback 파라미터 없음
- isLoading 중에는 투표(tku-id)는 정상 동작, 댓글/좋아요 클릭 시 requireLogin()으로 처리

#### Provider 순서

```
// src/app/layout.tsx
ClientProviders > QueryProvider > ModalProvider > AuthProvider > children
```

- `AuthProvider`는 `useModal()`을 사용해서 로그인 모달을 띄우므로 `ModalProvider` 아래에 위치
- `ClientProviders`는 `MSWProvider`를 `dynamic(ssr: false)`로 감싸고 있음
- `AuthProvider`의 `GET /api/auth/me` 호출은 `MSWProvider` 초기화 이후에 실행됨 (개발 환경에서 MSW가 준비된 후에야 API 호출이 가능)
- 개발 환경에서 MSW 준비 전에 `GET /api/auth/me`가 호출되면 네트워크 에러 발생
- 해결: `MSWProvider`에서 `useMSWReady(): boolean` 훅을 export하고, `AuthProvider`의 useQuery에 `enabled: !isDev || isMSWReady` 조건 추가

### 3.2 axios interceptor 변경

기존 `src/lib/axios.ts`에 401 토큰 갱신 interceptor 추가:

```
401 응답 수신
  → /api/auth/refresh 요청 자체인지 확인 (무한 루프 방지)
    → refresh 요청이 401이면 → 로그아웃 처리 (재시도 안 함)
  → 이미 재시도한 요청인지 확인 (_retry 플래그)
    → 재시도 요청이면 → 로그아웃 처리
  → POST /api/auth/refresh 시도
    → 성공: _retry 플래그 설정 후 원래 요청 재시도
    → 실패: AuthContext 로그아웃 처리
  → 동시 401 요청 큐잉: refresh 진행 중이면 다른 401 요청은 Promise 큐에 대기
    → refresh 완료 후 큐에 쌓인 요청 일괄 재시도
```

withCredentials: true는 이미 설정되어 있으므로 쿠키 전송은 변경 없음.

### 3.3 기존 코드 변경 범위

#### 로그인 게이팅 추가

| 파일                            | 변경 내용                                                                         |
| ------------------------------- | --------------------------------------------------------------------------------- |
| src/hooks/api/useLike.ts        | handleLike 진입 시 `if (!isLoggedIn) { requireLogin('like'); return; }` 가드 추가 |
| src/hooks/api/useComment.ts     | 댓글 작성 시 `if (!isLoggedIn) { requireLogin('comment'); return; }` 가드 추가    |
| src/hooks/api/useCommentLike.ts | 공감 시 `if (!isLoggedIn) { requireLogin('like'); return; }` 가드 추가            |

#### 투표 훅 — 식별자 분기

| 파일                           | 변경 내용                                                 |
| ------------------------------ | --------------------------------------------------------- |
| src/hooks/api/useSingleVote.ts | 로그인 시 헤더 없이(쿠키 인증), 비로그인 시 x-tku-id 헤더 |
| src/hooks/api/useDetailVote.ts | 동일                                                      |

```typescript
// 기존 useRef 패턴 폐기: tkuIdRef는 마운트 시점에 고정되어 로그인 상태 변경을 반영하지 못함
// 변경: handleVote 내부에서 매 호출 시 isLoggedIn을 직접 참조
const headers = isLoggedIn ? {} : { 'x-tku-id': getTKUID() };
await vote(slug, { electionItemId }, { headers });
```

> 주의: 기존 `useSingleVote.ts`와 `useDetailVote.ts`의 `tkuIdRef = useRef(getTKUID())` 패턴을 폐기한다.
> `useRef`는 마운트 시점에만 초기화되므로, 로그인 후에도 이전 tku-id가 사용될 수 있다.
> `AuthContext`의 `isLoggedIn`을 참조하여 매 투표 시점에 동적으로 헤더를 결정한다.

#### 변경하지 않는 것

- 서버 컴포넌트 (SEO용이므로 인증 불필요)
- 기존 UI 컴포넌트 구조 (CardActions 등은 그대로, 훅 레벨에서만 게이팅)

---

## 4. UI/UX 설계

Polymarket 스타일 참고. 다크 테마(#121212) 기반.

### 4.1 로그인 모달

모바일은 바텀시트, PC(768px 이상)는 센터 모달로 분기.
기존 Modal 컴포넌트와 ShareBottomSheet 패턴 재사용.

```
┌──────────────────────────────────┐
│                            ✕     │
│                                  │
│   댓글을 남기려면 로그인이 필요해요  │  ← 트리거별 메시지
│                                  │
│   💬  댓글로 의견을 나눠보세요     │  ← 로그인 혜택 리스트
│   ❤️  마음에 드는 핫픽에 좋아요    │
│   📊  내 투표 기록을 한눈에        │
│                                  │
│  ┌──────────────────────────┐    │
│  │  🟡 카카오로 시작하기      │    │  ← 카카오 노란색 (#FEE500)
│  └──────────────────────────┘    │
│                                  │
│   비로그인으로 투표는 가능해요      │  ← 서브 텍스트 (#8a8a8a)
│                                  │
└──────────────────────────────────┘
```

트리거별 상단 메시지:

| 트리거  | 메시지                                 |
| ------- | -------------------------------------- |
| comment | 댓글을 남기려면 로그인이 필요해요      |
| like    | 좋아요는 로그인 후 이용할 수 있어요    |
| default | 로그인하고 더 많은 기능을 이용해보세요 |

### 4.2 닉네임 설정 모달 (신규 유저)

```
┌──────────────────────────────────┐
│                                  │
│       닉네임을 설정해주세요        │
│                                  │
│  ┌──────────────────────────┐    │
│  │ 불꽃투표러123        🔄   │    │  ← 자동 추천, 🔄로 재생성
│  └──────────────────────────┘    │
│           중복된 닉네임입니다       │  ← 에러 시 빨간 텍스트
│                                  │
│  ┌──────────────────────────┐    │
│  │        시작하기            │    │  ← Primary gradient 버튼
│  └──────────────────────────┘    │
│                                  │
└──────────────────────────────────┘
```

- react-hook-form 사용 (프로젝트에 이미 설치됨)
- 🔄 버튼으로 추천 닉네임 재생성 (GET /api/auth/nickname/suggest)
- 직접 입력 가능, 포커스 아웃 시 중복 검사 (GET /api/auth/nickname/check?nickname=xxx)
- 닉네임 설정 완료 → PATCH /api/auth/me → AuthContext 유저 정보 갱신
- 닫기 버튼 없음, ESC 키로도 닫히지 않음 (필수 단계)
  - Modal 컴포넌트에 `onClose`를 전달하지 않으면 ESC 핸들러가 등록되지 않음 (기존 구현 활용)
  - `closeOnDimmedClick`도 false로 설정
  - 유저가 브라우저를 새로고침하면 `GET /api/auth/me` 응답에서 닉네임 미설정 상태를 감지하여 다시 닉네임 모달을 표시 (BE에서 nickname이 null이면 isNewUser처럼 처리)

### 4.3 헤더 변경

```
비로그인:
┌─────────────────────────────────────┐
│  🔥 HotPick        🔍    [로그인]   │  ← 텍스트 버튼
└─────────────────────────────────────┘

로그인:
┌─────────────────────────────────────┐
│  🔥 HotPick        🔍    (프로필)   │  ← 프로필 아이콘, 클릭 시 /my 이동
└─────────────────────────────────────┘
```

### 4.4 마이페이지 (/my)

비로그인 접근 시 로그인 모달 후 리다이렉트.

```
┌─────────────────────────────────────┐
│  ←                                  │
│                                     │
│  (프로필 이미지)                      │
│  불꽃투표러123              [수정]    │  ← 닉네임 + 수정 버튼 (닉네임 모달 재사용)
│                                     │
│  ┌─────────┬─────────┐              │
│  │  내 투표  │  내 댓글  │              │  ← 탭 전환
│  └─────────┴─────────┘              │
│                                     │
│  (투표/댓글 목록, 무한스크롤)          │
│                                     │
│  로그아웃                            │  ← 하단 텍스트 버튼
│  회원 탈퇴                           │  ← #8a8a8a 텍스트
└─────────────────────────────────────┘
```

- 내 투표: GET /api/users/me/votes (무한스크롤)
- 내 댓글: GET /api/users/me/comments (무한스크롤)
- 닉네임 수정: 닉네임 설정 모달 재사용
- 회원 탈퇴: confirm 모달 → DELETE /api/auth/me → 로그아웃 처리

---

## 5. BE 요청 API 스펙

### 5.1 인증 API

| 메서드 | 엔드포인트        | 설명                     | 요청                  | 응답                                          |
| ------ | ----------------- | ------------------------ | --------------------- | --------------------------------------------- |
| POST   | /api/auth/kakao   | 카카오 인가코드로 로그인 | { code, redirectUri } | { user, isNewUser } + Set-Cookie              |
| POST   | /api/auth/refresh | 토큰 갱신                | 쿠키 자동 전송        | Set-Cookie (새 AT)                            |
| GET    | /api/auth/me      | 현재 유저 정보           | 쿠키 자동 전송        | { id, nickname (null 가능), profileImageUrl } |
| POST   | /api/auth/logout  | 로그아웃                 | 쿠키 자동 전송        | 쿠키 삭제                                     |
| DELETE | /api/auth/me      | 회원 탈퇴                | 쿠키 자동 전송        | 쿠키 삭제                                     |

### 5.2 tku-id 통합 API

| 메서드 | 엔드포인트     | 설명                        | 요청      | 응답                   |
| ------ | -------------- | --------------------------- | --------- | ---------------------- |
| POST   | /api/auth/link | 비로그인 투표를 계정에 이관 | { tkuId } | { linked, votesCount } |

서버 로직:

- linked_at이 이미 있으면 → 이관 안 함, tku-id 데이터만 삭제
- 충돌 시 최신(tku-id 투표)으로 덮어쓰기 + 기존 옵션 집계 보정

### 5.3 닉네임 API

| 메서드 | 엔드포인트                 | 설명             | 요청          | 응답          |
| ------ | -------------------------- | ---------------- | ------------- | ------------- |
| GET    | /api/auth/nickname/suggest | 추천 닉네임 생성 | -             | { nickname }  |
| GET    | /api/auth/nickname/check   | 닉네임 중복 검사 | ?nickname=xxx | { available } |
| PATCH  | /api/auth/me               | 닉네임 변경      | { nickname }  | { user }      |

### 5.4 마이페이지 API

| 메서드 | 엔드포인트             | 설명         | 요청         | 응답              |
| ------ | ---------------------- | ------------ | ------------ | ----------------- |
| GET    | /api/users/me/votes    | 내 투표 목록 | ?page=&size= | 페이지네이션 목록 |
| GET    | /api/users/me/comments | 내 댓글 목록 | ?page=&size= | 페이지네이션 목록 |

### 5.5 기존 API 변경 사항

| 엔드포인트               | 변경 내용                                                           |
| ------------------------ | ------------------------------------------------------------------- |
| POST /vote               | 쿠키(로그인)와 x-tku-id(비로그인) 둘 다 지원                        |
| POST /like, DELETE /like | 쿠키 인증 필수로 변경                                               |
| POST /comment            | 쿠키 인증 필수로 변경                                               |
| POST /comment-like       | 쿠키 인증 필수로 변경                                               |
| 조회 API 전체            | 쿠키가 있으면 user_id로, 없으면 x-tku-id로 내 투표/좋아요 상태 반환 |

---

## 6. 환경변수

### 6.1 카카오 개발자센터에서 가져올 값

카카오 개발자센터(https://developers.kakao.com) → 내 애플리케이션 → 앱 생성 후:

| 환경변수                      | 가져오는 위치                           | 사용처                                           |
| ----------------------------- | --------------------------------------- | ------------------------------------------------ |
| `NEXT_PUBLIC_KAKAO_CLIENT_ID` | 앱 키 → REST API 키                     | FE: 카카오 인가 URL 생성 시 `client_id` 파라미터 |
| `KAKAO_CLIENT_SECRET`         | 보안 → Client Secret 코드 (활성화 필요) | BE: 카카오 토큰 교환 시 사용                     |

### 6.2 카카오 개발자센터에서 설정할 값

| 설정 항목            | 위치                         | 값                                                                                                    |
| -------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| Redirect URI         | 카카오 로그인 → Redirect URI | 개발: `http://localhost:3000/auth/kakao/callback`, 프로덕션: `https://hotpick.kr/auth/kakao/callback` |
| 동의항목             | 카카오 로그인 → 동의항목     | 닉네임(필수), 프로필 사진(선택)                                                                       |
| 카카오 로그인 활성화 | 카카오 로그인 → 활성화 설정  | ON                                                                                                    |

### 6.3 FE 환경변수 전체 목록

| 환경변수                         | 예시 값                                  | 설명                          |
| -------------------------------- | ---------------------------------------- | ----------------------------- |
| `NEXT_PUBLIC_KAKAO_CLIENT_ID`    | `abcdef1234567890`                       | 카카오 REST API 키            |
| `NEXT_PUBLIC_KAKAO_REDIRECT_URI` | `https://hotpick.kr/auth/kakao/callback` | 카카오 콜백 URL (환경별 다름) |

> `KAKAO_CLIENT_SECRET`은 BE 전용이므로 FE `.env`에 포함하지 않는다.

### 6.4 카카오 인가 URL 생성

```
https://kauth.kakao.com/oauth/authorize
  ?client_id=${NEXT_PUBLIC_KAKAO_CLIENT_ID}
  &redirect_uri=${NEXT_PUBLIC_KAKAO_REDIRECT_URI}
  &response_type=code
```

---

## 7. 새로 추가하는 파일 목록

| 파일                                               | 설명                                    |
| -------------------------------------------------- | --------------------------------------- |
| src/contexts/AuthContext.tsx                       | 인증 상태 관리 + requireLogin           |
| src/providers/AuthProvider.tsx                     | AuthContext Provider 구현               |
| src/hooks/api/useAuth.ts                           | 로그인/로그아웃/토큰갱신 API 훅         |
| src/hooks/api/useNickname.ts                       | 닉네임 추천/중복검사 훅                 |
| src/hooks/api/useMyPage.ts                         | 내 투표/댓글 목록 훅                    |
| src/components/features/Auth/LoginModal.tsx        | 로그인 모달 (PC 모달 + 모바일 바텀시트) |
| src/components/features/Auth/NicknameModal.tsx     | 닉네임 설정 모달                        |
| src/components/features/Auth/KakaoCallbackPage.tsx | 카카오 리다이렉트 콜백 처리             |
| src/app/auth/kakao/callback/page.tsx               | 카카오 콜백 라우트                      |
| src/app/my/page.tsx                                | 마이페이지                              |
| src/components/features/MyPage/MyPageView.tsx      | 마이페이지 뷰 컴포넌트                  |
| src/components/features/MyPage/MyVoteList.tsx      | 내 투표 목록                            |
| src/components/features/MyPage/MyCommentList.tsx   | 내 댓글 목록                            |
