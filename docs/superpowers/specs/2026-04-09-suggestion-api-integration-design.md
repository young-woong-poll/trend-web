# 핫픽 제안 API 연동 및 어드민 관리 페이지

## 개요

기존 목(mock) 상태인 SuggestPage에 서버 API를 연동하고, 어드민에서 제안을 조회/승인/거절할 수 있는 관리 페이지를 추가한다.

## 접근 방식

**최소 변경 방식(A)**: 기존 UI/UX를 유지하면서 localStorage 저장만 API 호출로 교체. 어드민은 기존 패턴(`AdminHotpickList` 스타일)을 그대로 따른다.

## 사용 API

### 유저용

| 메서드 | 엔드포인트                    | 용도               |
| ------ | ----------------------------- | ------------------ |
| GET    | `/api/v1/hotpicks/categories` | 카테고리 목록 조회 |
| POST   | `/api/v1/suggestions`         | 제안 제출          |

### 어드민용

| 메서드 | 엔드포인트                               | 용도                         |
| ------ | ---------------------------------------- | ---------------------------- |
| GET    | `/admin/api/v1/suggestions`              | 제안 목록 조회 (status 필터) |
| GET    | `/admin/api/v1/suggestions/{id}`         | 제안 상세 조회               |
| POST   | `/admin/api/v1/suggestions/{id}/approve` | 승인 (핫픽 자동 생성)        |
| POST   | `/admin/api/v1/suggestions/{id}/reject`  | 거절                         |

### 요청/응답 모델

- `CreateSuggestionRequest`: `{ title: string, items: string[], categoryIds: number[] }`
- `ReviewSuggestionRequest`: `{ adminMemo?: string }`
- `SuggestionResponse`: `{ id, userId, title, status, adminMemo, createdAt, reviewedAt, items[], categories[] }`
- `GetSuggestionsParams`: `{ status?: 'PENDING' | 'APPROVED' | 'REJECTED' }`

---

## 섹션 1: SuggestPage API 연동

### 변경 파일

- `src/components/features/Suggest/SuggestPage.tsx`
- `src/hooks/api/useSuggestion.ts` (신규)
- `src/hooks/api/index.ts` (export 추가)

### 카테고리 로딩

- 하드코딩된 `CATEGORIES` 배열 제거
- `useCategories()` 훅으로 서버에서 카테고리 목록 조회 (`GET /api/v1/hotpicks/categories`)
- 응답 타입 `CategoryTabResponse[]`에서 `id`, `name` 사용
- 로딩 중: 카테고리 칩 영역에 스켈레톤 또는 빈 상태 표시

### 제출 로직

- localStorage 저장 로직 제거
- `useCreateSuggestion` mutation 훅으로 `createSuggestion` API 호출
- 요청 바디: `{ title: formData.title.trim(), items: formData.options.filter(opt => opt.trim()), categoryIds: formData.categoryIds }`
- 로딩 상태: 제출 버튼 비활성화 + 텍스트 변경("제출 중...")
- 에러 처리: API 실패 시 토스트 알림
- 성공 시: 토스트로 "제안이 접수되었어요!" 알림 후 홈(`/`)으로 이동
- 기존 성공 화면(isSubmitted) 제거

### useSuggestion.ts 훅

```typescript
// Query Keys
export const suggestionKeys = {
  all: ['suggestion'] as const,
};

// 유저용: 제안 제출
export const useCreateSuggestion = () => {
  return useMutation({
    mutationFn: (data: CreateSuggestionRequest) => createSuggestion(data),
  });
};
```

---

## 섹션 2: 어드민 제안 관리 페이지

### 신규 파일

- `src/app/admin/suggestion/page.tsx` — 목록 페이지 라우트
- `src/app/admin/suggestion/[id]/page.tsx` — 상세 페이지 라우트
- `src/components/features/Admin/AdminSuggestionList/AdminSuggestionList.tsx` — 목록 컴포넌트
- `src/components/features/Admin/AdminSuggestionList/AdminSuggestionList.module.scss` — 목록 스타일
- `src/components/features/Admin/AdminSuggestionDetail/AdminSuggestionDetail.tsx` — 상세 컴포넌트
- `src/components/features/Admin/AdminSuggestionDetail/AdminSuggestionDetail.module.scss` — 상세 스타일

### 수정 파일

- `src/components/features/Admin/AdminNav/AdminNav.tsx` — 제안 메뉴 추가
- `src/hooks/api/useAdmin.ts` — 제안 관련 훅 추가
- `src/hooks/api/index.ts` — export 추가

### 목록 페이지 (`/admin/suggestion`)

**컴포넌트**: `AdminSuggestionList`

- 테이블 컬럼: 제목, 선택지 요약(쉼표 구분), 카테고리, 상태 뱃지(PENDING/APPROVED/REJECTED), 제출일
- 상단 상태 필터: 전체 / 대기중 / 승인 / 거절 (버튼 그룹)
- 행 클릭 시 상세 페이지(`/admin/suggestion/{id}`)로 이동
- `useSuggestions(status?)` 훅 사용
- 로딩/빈 상태 처리

### 상세 페이지 (`/admin/suggestion/[id]`)

**컴포넌트**: `AdminSuggestionDetail`

- 표시 정보:
  - 제목
  - 선택지 목록 (displayOrder 순)
  - 카테고리 칩
  - 상태 뱃지
  - 제출일 / 처리일
  - 어드민 메모 (있으면 표시)
- 액션 영역 (상태가 PENDING일 때만):
  - 어드민 메모 textarea (선택사항)
  - 승인 버튼 → `useApproveSuggestion` → `approveSuggestion(id, { adminMemo })`
  - 거절 버튼 → `useRejectSuggestion` → `rejectSuggestion(id, { adminMemo })`
- 승인/거절 전 확인 모달 (기존 `useConfirm` 훅 사용)
- 처리 완료: 토스트 알림 + 목록 페이지로 이동

### 네비게이션

`AdminNav`의 `NAV_ITEMS`에 추가:

```typescript
{ href: '/admin/suggestion', label: '제안' }
```

### useAdmin.ts 확장

```typescript
// Query Keys 추가
export const adminKeys = {
  // ... 기존 키
  suggestions: (status?: string) => [...adminKeys.all, 'suggestions', status] as const,
  suggestion: (id: number) => [...adminKeys.all, 'suggestion', id] as const,
};

// 제안 목록 조회
export const useSuggestions = (status?: GetSuggestionsStatus) => useQuery({ ... });

// 제안 상세 조회
export const useSuggestion = (id: number) => useQuery({ ... });

// 제안 승인
export const useApproveSuggestion = () => useMutation({ ... });

// 제안 거절
export const useRejectSuggestion = () => useMutation({ ... });
```

---

## 디자인 규칙 준수

- 다크 테마 전용: `$bg-secondary`, `$bg-tertiary` 배경, `$white`/`$text-secondary` 텍스트
- 상태 뱃지 색상: PENDING(노란색 계열), APPROVED(초록 계열), REJECTED(빨강 계열)
- 입력 필드: `$bg-tertiary` 배경, `#3a3a3a` 테두리
- 버튼: primary(`$bg-tertiary`), secondary(transparent), gradient(CTA)
- `$white`를 배경으로 절대 사용 금지

## 범위 외

- 유저 "내 제안 목록" 페이지 (의도적 제외)
- 승인 시 선택지/카테고리 수정 (API 미지원)
- 이미지 첨부 기능 (API에 이미지 필드 없음)
