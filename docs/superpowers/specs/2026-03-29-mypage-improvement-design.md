# MY 페이지 개선 설계서

## 목표

MY 페이지의 UI를 다크 테마 디자인 시스템에 맞게 전면 개선하고, 프로필 관리(닉네임 변경, 프로필 색상), 내 활동 조회(댓글, 좋아요), 계정 관리(로그아웃, 회원 탈퇴), 헤더 프로필 드롭다운 기능을 구현한다.

## 결정사항 요약

| 항목               | 결정                                                      |
| ------------------ | --------------------------------------------------------- |
| 탭 구성            | 내 댓글 / 좋아요한 핫픽 (2탭, 기존 "내 투표" 제거)        |
| 프로필 이미지      | 단색 그라디언트 배경 + 닉네임 이니셜 (사용자가 색상 선택) |
| 닉네임 변경        | 월 1회 제한                                               |
| 헤더 프로필 팝업   | 드롭다운 메뉴 (마이페이지 / 로그아웃)                     |
| 로그아웃/탈퇴 위치 | 헤더 드롭다운 + MY 페이지 하단 둘 다                      |

---

## 1. MY 페이지 레이아웃

### 전체 구조 (위에서 아래로)

```
┌─────────────────────────────────┐
│         프로필 영역              │
│   [색상 아바타 72px + 이니셜]    │
│   닉네임 + "님"                  │
│   가입일: YYYY.MM.DD            │
│   [닉네임 변경] [프로필 색상]    │
├─────────────────────────────────┤
│  구분선 (8px #1a1a1a)           │
├─────────────────────────────────┤
│  [내 댓글]  |  [좋아요한 핫픽]   │  ← 탭 (하단 바 인디케이터)
├─────────────────────────────────┤
│                                 │
│  탭 콘텐츠 영역                  │
│  (카드형 리스트, 무한 스크롤)     │
│                                 │
├─────────────────────────────────┤
│  구분선 (8px #1a1a1a)           │
├─────────────────────────────────┤
│  로그아웃          (텍스트 버튼)  │
│  회원 탈퇴         (빨간 텍스트)  │
└─────────────────────────────────┘
```

- 컨테이너: max-width 600px, 중앙 정렬
- 배경: #121212 (bg-primary)

### 1.1 프로필 영역

- **아바타**: 72px 원형, 사용자가 선택한 그라디언트 색상 배경, 닉네임 첫 글자(이니셜) 흰색 28px bold
- **닉네임**: 18px, font-weight 600, #fff, "웅일님" 형태
- **가입일**: 13px, #8a8a8a, "가입일: 2025.03.15" 형태
- **관리 버튼**: 가로 배치, pill 형태 (border-radius: 20px, border: 1px solid #555, padding: 8px 16px, font-size: 13px, color: #d1d1d1)
  - "닉네임 변경" → NicknameModal 열기
  - "프로필 색상" → ProfileColorModal 열기

### 1.2 탭 영역

- 2탭: "내 댓글" / "좋아요한 핫픽"
- 활성 탭: #fff, font-weight 600, 하단 2px 바 (#ff00ff, primary gradient 시작 색상)
- 비활성 탭: #8a8a8a
- 탭 전환 시 콘텐츠 영역 교체 (클라이언트 사이드)

### 1.3 내 댓글 탭

- 카드형 리스트 (background: #1e1e1e, border-radius: 12px, padding: 14px 16px)
- 카드 내용:
  - 핫픽 제목 (12px, #8a8a8a) — 클릭 시 해당 핫픽 상세 페이지로 이동
  - 댓글 내용 (14px, #d1d1d1) — 2줄 이상이면 line-clamp 처리
  - 작성일 (11px, #555)
- 카드 간 간격: 10px
- 무한 스크롤 (기존 useMyComments 훅 활용)
- 빈 상태: "아직 작성한 댓글이 없어요" 메시지

### 1.4 좋아요한 핫픽 탭

- 카드형 리스트 (동일 스타일)
- 카드 내용:
  - 핫픽 제목 (14px, #d1d1d1, font-weight 500) — 클릭 시 해당 핫픽 상세 페이지로 이동
  - 핫픽 선택지 요약 (12px, #8a8a8a) — "A vs B" 형태
  - 좋아요 날짜 (11px, #555)
- 무한 스크롤 (새 useLikedHotpicks 훅 필요)
- 빈 상태: "아직 좋아요한 핫픽이 없어요" 메시지

### 1.5 하단 계정 관리

- 구분선 위에 배치
- "로그아웃": 14px, #d1d1d1, 텍스트 버튼 (padding: 12px 0)
  - 클릭 시 확인 모달 → 로그아웃 실행 → 메인 페이지로 이동
- "회원 탈퇴": 14px, #ff2e2e (error 색상), 텍스트 버튼 (padding: 12px 0)
  - 클릭 시 확인 모달 ("정말 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.") → 탈퇴 API 호출 → 메인 페이지로 이동

---

## 2. 헤더 프로필 드롭다운

### 동작

- **로그인 상태**: 기존 프로필 아이콘 클릭 → `/my`로 바로 이동하던 것을 드롭다운 메뉴 표시로 변경
- **비로그인 상태**: 기존과 동일 (로그인 모달 표시)

### 드롭다운 UI

- 프로필 아이콘 하단 우측 정렬
- background: #2c2c2c, border-radius: 12px, box-shadow: 0 8px 24px rgba(0,0,0,0.4)
- 메뉴 항목:
  1. "마이페이지" — SVG 아이콘(UserIcon 계열) + 텍스트, 클릭 시 `/my`로 이동
  2. "로그아웃" — SVG 아이콘(LogoutIcon) + #ff2e2e 텍스트, 클릭 시 로그아웃 실행
- 아이콘은 프로젝트 컨벤션에 따라 `src/assets/icon/` 에 SVG 컴포넌트로 생성
- 각 항목: padding 14px 16px, font-size 14px
- 닫기 조건: 바깥 클릭, ESC 키, 메뉴 항목 클릭

### 모바일 대응

- 모바일에서도 드롭다운 (바텀시트 아님). 메뉴 항목이 2개뿐이므로 드롭다운이 적합.
- 모바일 헤더의 프로필 아이콘에도 동일한 드롭다운 적용

---

## 3. 프로필 색상 시스템

### 색상 팔레트 (8색, 그라디언트)

| 이름   | 시작    | 끝      |
| ------ | ------- | ------- |
| purple | #7C3AED | #A855F7 |
| blue   | #2563EB | #3B82F6 |
| green  | #059669 | #10B981 |
| amber  | #D97706 | #F59E0B |
| red    | #DC2626 | #EF4444 |
| pink   | #DB2777 | #EC4899 |
| cyan   | #0891B2 | #06B6D4 |
| indigo | #4F46E5 | #6366F1 |

### 데이터 모델

- User 모델에 `profileColor` 필드 추가 (string, 팔레트 이름: "purple" | "blue" | "green" | ...)
- 기본값: 가입 시 랜덤 배정
- 변경: 마이페이지 "프로필 색상" 버튼 클릭 → ProfileColorModal에서 선택 → API 호출

### ProfileColorModal

- 기존 Modal 컴포넌트 활용
- 모바일: 바텀시트, 데스크톱: 센터 모달
- 8개 색상 원형(40px) 그리드 배치
- 선택된 색상에 흰색 테두리(2px) 표시
- "변경" 버튼으로 저장 (PATCH /api/auth/me)

### 아바타 렌더링

- `ProfileAvatar` 공통 컴포넌트 생성
- Props: `nickname: string`, `profileColor: string`, `size: number`
- 사용처: MY 페이지 프로필, 헤더 프로필 아이콘, 댓글 영역 등
- 이니셜 추출: 닉네임 첫 글자 (한글, 영문 모두 대응)

---

## 4. 닉네임 변경

### 정책

- **월 1회 제한**: 마지막 변경일로부터 30일 경과 후 변경 가능
- 변경 불가 시 "닉네임 변경" 버튼에 남은 일수 표시 또는 비활성화 + 안내 메시지

### 데이터 모델

- User 모델에 `lastNicknameChangedAt` 필드 추가 (datetime, nullable)
- 최초 가입 시 닉네임 설정은 변경 횟수에 포함하지 않음 (lastNicknameChangedAt = null)

### UI 동작

- "닉네임 변경" 버튼 클릭 시:
  - 변경 가능하면 → 기존 NicknameModal 열기 (수정 모드)
  - 변경 불가하면 → Toast로 "닉네임은 N일 후에 변경할 수 있어요" 표시
- NicknameModal은 기존 것을 재사용하되, 회원가입 시와 변경 시 UI를 구분:
  - 회원가입: "닉네임을 설정해주세요" + 추천 닉네임
  - 변경: "닉네임 변경" + 현재 닉네임 표시 + 추천 닉네임

### API

- 닉네임 변경: 기존 PATCH `/api/auth/me` 활용 (body: `{ nickname }`)
- BE에서 30일 제한 검증 (FE는 UI만, 실제 검증은 서버)
- 변경 불가 시 BE 응답: 409 Conflict + `{ message, nextAvailableAt }`

---

## 5. 좋아요한 핫픽 API

### 엔드포인트 (BE 개발요청 필요)

```
GET /api/users/me/likes?page=1&size=20
```

### 응답 타입

```typescript
interface LikedHotpickItem {
  hotpickId: number;
  hotpickAlias: string;
  hotpickTitle: string;
  optionSummary: string; // "A vs B" 형태
  likedAt: string; // ISO 8601
}

interface LikedHotpicksResponse {
  data: LikedHotpickItem[];
  meta: {
    page: number;
    totalPages: number;
  };
}
```

### FE 구현

- `useLikedHotpicks()` 무한 스크롤 훅 생성 (useMyComments 패턴 동일)
- BE 미구현 시 MSW mock 데이터로 대체 (CLAUDE.md 컨벤션)

---

## 6. 프로필 색상 API

### 엔드포인트 (기존 API 확장)

```
PATCH /api/auth/me
Body: { profileColor: "purple" }
```

### 응답

- 기존 User 객체 반환 (profileColor 포함)

### FE 데이터 흐름

- AuthContext의 User 인터페이스에 `profileColor` 추가
- getMe() 응답에 profileColor 포함 → 앱 전역에서 사용 가능
- 색상 변경 후 AuthContext의 user 업데이트

---

## 7. 기존 코드 변경사항

### 제거

- `MyVoteList` 컴포넌트 및 관련 코드 (내 투표 탭 제거)
- `useMyVotes()` 훅 (사용처 없어짐)

### 수정

- `MyPageView.tsx` — 전면 리디자인 (프로필 영역, 2탭, 하단 계정 관리)
- `MyPageView.module.scss` — 새 디자인 시스템에 맞게 전면 재작성
- `MainHeader.tsx` — 프로필 아이콘 클릭 동작을 드롭다운으로 변경
- `AuthContext.tsx` — User 인터페이스에 `profileColor`, `lastNicknameChangedAt` 추가
- `NicknameModal.tsx` — 변경 모드 지원 추가 (mode: 'signup' | 'edit')
- `useMyPage.ts` — myVotes 키 제거, likedHotpicks 키 추가

### 신규

- `ProfileAvatar` 컴포넌트 — 색상 아바타 + 이니셜 렌더링
- `ProfileColorModal` 컴포넌트 — 색상 선택 모달
- `ProfileDropdown` 컴포넌트 — 헤더 프로필 드롭다운
- `LikedHotpickList` 컴포넌트 — 좋아요한 핫픽 리스트
- `useLikedHotpicks()` 훅 — 좋아요한 핫픽 무한 스크롤
- `profileColors.ts` — 프로필 색상 팔레트 상수 정의

---

## 8. 파일 구조

```
src/
├── components/
│   ├── common/
│   │   └── ProfileAvatar/
│   │       ├── ProfileAvatar.tsx
│   │       └── ProfileAvatar.module.scss
│   └── features/
│       ├── MyPage/
│       │   ├── MyPageView.tsx          (수정)
│       │   ├── MyPageView.module.scss  (재작성)
│       │   ├── MyCommentList.tsx       (유지, 스타일 조정)
│       │   ├── LikedHotpickList.tsx    (신규)
│       │   ├── ProfileColorModal.tsx   (신규)
│       │   └── MyVoteList.tsx          (제거)
│       ├── Auth/
│       │   └── NicknameModal.tsx       (수정)
│       └── Main/
│           └── MainHeader/
│               ├── MainHeader.tsx      (수정)
│               ├── ProfileDropdown.tsx  (신규)
│               └── ProfileDropdown.module.scss (신규)
├── constants/
│   └── profileColors.ts               (신규)
├── hooks/api/
│   └── useMyPage.ts                   (수정)
├── types/
│   └── user.ts 또는 AuthContext 내     (수정)
└── contexts/
    └── AuthContext.tsx                 (수정)
```

---

## 9. BE 개발요청 사항

### 필수

1. **GET /api/users/me/likes** — 좋아요한 핫픽 목록 (페이지네이션)
2. **User 모델 확장** — `profileColor` (string, default: 랜덤), `lastNicknameChangedAt` (datetime, nullable)
3. **PATCH /api/auth/me 확장** — `profileColor` 필드 지원
4. **닉네임 변경 30일 제한** — BE 검증 + 409 응답

### 우선순위

- FE는 MSW mock으로 먼저 개발 진행 가능
- BE 구현 후 mock 제거하고 실 API 연동
