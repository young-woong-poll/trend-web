# 상세 페이지 (`/hotpick/{slug}`)

> 최종 업데이트: 2026-03-01

## 개요

개별 핫픽의 상세 페이지. 투표 + 인라인 댓글 + 추천 핫픽 + SEO(OG/JSON-LD) 구성.

---

## 1. 타입별 렌더링

- SINGLE -> SingleDetailView
- BUNDLE -> HotpickView (BE 미구현)
- 존재하지 않는 slug -> 404 페이지

---

## 2. 투표

### 상태별 UI

| 상태        | UI                                                                       |
| ----------- | ------------------------------------------------------------------------ |
| 투표 전     | 옵션 선택 가능, 댓글 블러 + "투표 후 댓글을 확인할 수 있습니다" 오버레이 |
| 투표 후     | 결과 바 + 내가 선택한 옵션 체크 + 공유 CTA 활성화                        |
| 이미 투표함 | 진입 시 바로 결과 표시 (TKUID 기반)                                      |
| 마감됨      | 옵션 비활성화 + 결과만 표시                                              |

### 투표 API

- `POST /api/v1/hotpicks/{slug}/votes` — `{ electionItemId }` + `x-tku-id` 헤더
- Optimistic Update 동작 (메인 페이지와 동일)

---

## 3. 공유하기

- 투표 후 "투표 공유하기" CTA 버튼 활성화
- 클릭 시 현재 페이지 URL 복사 + "링크가 복사되었습니다" 토스트

---

## 4. 인라인 댓글

- 5개씩 로드, "댓글 더보기" 버튼으로 추가 로드
- 인기순/최신순 정렬
- 댓글 작성/수정/삭제 (비밀번호 인증)
- 좋아요 (TKUID 기반 토글, Optimistic update)
- 투표 전에는 댓글 블러 처리

---

## 5. 추천 섹션

- 동일 카테고리 Single 최대 2개 표시
- 없으면 섹션 미노출
- "더 많은 투표 보기" 클릭 시 메인("/")으로 이동

---

## 6. SEO

### OG 메타태그

- 타이틀: `{투표 제목} | HotPick`
- 설명: `{선택지A} vs {선택지B} - 지금 바로 투표하세요!`
- OG 이미지: 다크 카드에 질문 + A/B 선택지 + 참여자 수 (동적 생성)
- `revalidate = false` (무기한 캐싱)

### 구조화 데이터

- JSON-LD `Question` + `suggestedAnswer` 스키마 (Google 리치 결과 대응)

---

## API 요약

| Method | Endpoint                                                | 설명          |
| ------ | ------------------------------------------------------- | ------------- |
| GET    | `/api/v1/hotpicks/{slug}`                               | 핫픽 상세     |
| POST   | `/api/v1/hotpicks/{slug}/votes`                         | 투표 제출     |
| GET    | `/api/v1/hotpicks/{slug}/elections/{id}/comments`       | 댓글 목록     |
| POST   | `/api/v1/hotpicks/{slug}/elections/{id}/comments`       | 댓글 작성     |
| GET    | `/api/v1/hotpicks/{slug}/elections/{id}/comments/count` | 댓글 수       |
| PUT    | `/api/v1/comments/{commentId}`                          | 댓글 수정     |
| DELETE | `/api/v1/comments/{commentId}`                          | 댓글 삭제     |
| POST   | `/api/v1/comments/{commentId}/verify`                   | 비밀번호 인증 |
| POST   | `/api/v1/comments/{commentId}/like`                     | 좋아요        |
| DELETE | `/api/v1/comments/{commentId}/like`                     | 좋아요 취소   |

## Changelog

- 2026-03-01: 초기 작성 (00-overview.md에서 분리)
