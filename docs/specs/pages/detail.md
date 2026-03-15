# 상세 페이지 (`/hotpick/{slug}`)

> 최종 업데이트: 2026-03-15

## 개요

개별 핫픽의 상세 페이지. 투표 + 좋아요 + 인라인 댓글 + 추천 핫픽 + SEO(OG/JSON-LD) 구성.

---

## 1. 타입별 렌더링

- SINGLE → SingleDetailView
- BUNDLE → HotpickView (BE 미구현)
- 존재하지 않는 slug → 404 페이지 ("존재하지 않는 핫픽입니다.")

---

## 2. 투표 카드

### 카드 구성 요소

- 카테고리 태그 (상단)
- D-day 마감 배지 (DeadlineBadge)
- 투표 제목 (h1)
- 옵션 버튼 또는 결과 바
- 참여자 수 ("N명 참여")
- 좋아요 버튼 + 카운트
- 공유 CTA 버튼

### 상태별 UI

| 상태        | UI                                                                       |
| ----------- | ------------------------------------------------------------------------ |
| 투표 전     | 옵션 선택 가능, 댓글 블러 + "투표 후 댓글을 확인할 수 있습니다" 오버레이 |
| 투표 후     | 결과 바(퍼센트 + 카운트) + 내가 선택한 옵션 체크 + 공유 CTA 활성화       |
| 이미 투표함 | 진입 시 바로 결과 표시 (TKUID 기반)                                      |
| 마감됨      | 옵션 비활성화 + 결과만 표시                                              |

### 투표 API

- `POST /api/v1/hotpicks/{slug}/votes` — `{ electionItemId }` + `x-tku-id` 헤더
- Optimistic Update 동작 (메인 페이지와 동일)

---

## 3. 좋아요

- 투표 카드 하단에 좋아요 버튼 (하트 아이콘) + 카운트 표시
- 클릭 시 filled/unfilled 토글 (Optimistic Update)
- TKUID 기반 유저별 상태 관리
- 투표 전/후, 마감 여부와 무관하게 항상 동작

---

## 4. 공유하기

- 투표 후 또는 마감된 경우 "투표 공유하기" CTA 버튼 활성화
- 클릭 시 현재 페이지 URL 복사 + "링크가 복사되었습니다" 토스트

---

## 5. 인라인 댓글

### 댓글 목록

- 5개씩 로드, "댓글 더보기" 버튼으로 추가 로드
- 인기순/최신순 정렬 탭
- 투표 전에는 댓글 블러 처리 + "투표 후 댓글을 확인할 수 있습니다" 오버레이

### 댓글 작성 폼

- textarea 클릭 시 폼 확장
- **닉네임**: 자동 생성 (랜덤 한글 닉네임), 주사위 버튼으로 재생성, 최대 10자
- **비밀번호**: 4~15자
- **댓글 내용**: 최대 200자, 글자수 카운터 표시 ("N/200")
- 취소 버튼 클릭 시 폼 축소 + 닉네임 재생성
- 게시 후 폼 자동 축소

### 댓글 수정/삭제

- 비밀번호 인증 → 수정 모달 또는 삭제 확인
- `POST /api/v1/comments/{commentId}/verify` → verifyToken 발급 → 수정/삭제 요청에 사용

### 댓글 좋아요

- TKUID 기반 토글, Optimistic Update

---

## 6. 추천 섹션

- 섹션 타이틀: "이런 투표는 어때요?"
- 관련 핫픽 카드 표시 (각 카드에 선택지 미리보기 + 참여자 수)
- 관련 핫픽이 없으면 섹션 미노출
- "더 많은 투표 보기" 클릭 시 메인("/")으로 이동

---

## 7. SEO

### OG 메타태그

- 타이틀: `{투표 제목} | HotPick`
- 설명: `{선택지A} vs {선택지B} - 지금 바로 투표하세요!`
- OG 이미지: 다크 카드에 질문 + A/B 선택지 + 참여자 수 (동적 생성, `revalidate = false`)

### 페이지 캐싱

- `revalidate = 60` (ISR, 60초마다 재검증)

### 구조화 데이터

- JSON-LD `Question` + `suggestedAnswer` 스키마 (Google 리치 결과 대응)
- `interactionStatistic`으로 투표 수 포함

---

## API 요약

| Method | Endpoint                                                | 설명             |
| ------ | ------------------------------------------------------- | ---------------- |
| GET    | `/api/v1/hotpicks/{slug}`                               | 핫픽 상세        |
| POST   | `/api/v1/hotpicks/{slug}/votes`                         | 투표 제출        |
| POST   | `/api/v1/hotpicks/{slug}/like`                          | 좋아요           |
| DELETE | `/api/v1/hotpicks/{slug}/like`                          | 좋아요 취소      |
| GET    | `/api/v1/hotpicks/{slug}/elections/{id}/comments`       | 댓글 목록        |
| POST   | `/api/v1/hotpicks/{slug}/elections/{id}/comments`       | 댓글 작성        |
| GET    | `/api/v1/hotpicks/{slug}/elections/{id}/comments/count` | 댓글 수          |
| PUT    | `/api/v1/comments/{commentId}`                          | 댓글 수정        |
| DELETE | `/api/v1/comments/{commentId}`                          | 댓글 삭제        |
| POST   | `/api/v1/comments/{commentId}/verify`                   | 비밀번호 인증    |
| POST   | `/api/v1/comments/{commentId}/like`                     | 댓글 좋아요      |
| DELETE | `/api/v1/comments/{commentId}/like`                     | 댓글 좋아요 취소 |

## Changelog

- 2026-03-15: 구현 기준 전면 업데이트 — 좋아요/닉네임 자동생성/글자수 제한/카테고리 태그/D-day 배지/참여자 수/revalidate 값 반영
- 2026-03-01: 초기 작성 (00-overview.md에서 분리)
