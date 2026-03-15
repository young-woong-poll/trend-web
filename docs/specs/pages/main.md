# 메인 페이지 (`/`)

> 최종 업데이트: 2026-03-01

## 개요

핫픽 피드를 무한스크롤로 탐색하고, 인라인 투표 및 댓글을 이용하는 메인 페이지.

---

## 1. 피드

### 구조

```
MainContent
  └── MainHeader (로고 + 네비게이션)
  └── FlexibleLayout (max-width 컨테이너)
      └── MainView (클라이언트 컴포넌트)
          ├── CategoryFilter (가로 스크롤 칩 버튼)
          ├── SingleCard / BundleCard (핫픽 카드)
          ├── IntersectionObserver (무한스크롤 트리거)
          └── CommentBottomSheet (포탈, 댓글 버튼 클릭 시)
```

### 카테고리 필터

- 가로 스크롤 칩 버튼 UI
- 데이터: `GET /api/v1/hotpicks/categories` -> `CategoryTabResponse[]`
- 기본값: "전체" (slug: `'all'` -> API에는 카테고리 파라미터 미전송)
- 카테고리 변경 시 피드 리셋 및 재조회
- 동일 카테고리 두번 클릭 시 전체로 복귀

### 무한스크롤

- 커서 기반 페이지네이션 (`nextCursor`, `hasMore`)
- `GET /api/v1/hotpicks/main?category={slug}&cursor={cursor}&size=20`
- IntersectionObserver로 하단 감지 -> 다음 페이지 자동 로드
- 핫픽 ID 기반 중복 제거

### 카드 표시

- VoteType: IMAGE (옵션 중 하나라도 imageUrl 있음) / TEXT (모두 없음)
- 옵션 2~4개 대응
- 참여자수: 1000 단위 k, m 표기
- 댓글 수 표시 + 클릭 시 바텀시트
- deadline 설정 시 D-day 표시 (당일은 초단위)
- 마감된 투표: 마감 표시 + 결과만 표시
- TopComment 미리보기

### SSR

- ISR: `revalidate = 60` (60초)
- 서버에서 React Query 캐시 pre-fetch -> HydrationBoundary로 클라이언트 전달
- 클라이언트 마운트 시 `staleTime: 0`으로 항상 refetch (TKUID 기반 voted 상태 반영)
- `<noscript>` 폴백으로 SEO용 정적 HTML 제공

---

## 2. 인라인 투표

### 투표 흐름

| 항목      | 내용                                                  |
| --------- | ----------------------------------------------------- |
| API       | `POST /api/v1/hotpicks/{slug}/votes`                  |
| 요청 본문 | `{ electionItemId: number }`                          |
| 헤더      | `x-tku-id` (TKUID)                                    |
| 중복 방지 | 서버에서 TKUID + hotpickId 조합 중복 체크 -> 409 응답 |
| 재투표    | 불가                                                  |

### Optimistic Update (낙관적 업데이트)

서버 응답을 기다리지 않고 **피드 로드 시 받아온 캐시 데이터에 내 투표를 +1 반영**하여 즉시 결과를 표시한다. 따라서 투표 → 결과 표시까지 딜레이가 0이다. 실제 서버의 최신 투표수가 아닌, 내가 처음 피드를 불러왔을 때의 스냅샷 + 내 1표가 반영된 결과가 보인다.

1. 사용자가 옵션 클릭
2. `pendingRef`로 중복 클릭 차단
3. React Query 캐시의 기존 데이터에서 선택한 옵션 voteCount +1 → 즉시 UI 반영 (딜레이 없음)
4. API 호출 (백그라운드)
5. 성공 시 서버의 실제 데이터로 캐시 갱신 (이 시점에 다른 사람의 투표도 반영됨)
6. 409 응답 시 서버 응답의 현재 투표 상태로 캐시 갱신
7. 기타 에러 시 캐시 롤백 + 에러 토스트

---

## 3. 공유하기

- 공유하기 버튼 클릭 -> 상세페이지 URL (`/hotpick/{slug}`) 클립보드 복사
- "링크가 복사되었습니다" 토스트 메시지

---

## 4. 바텀시트 댓글

- 댓글 버튼 클릭 시 바텀시트로 열림
- 비로그인 익명 댓글 (닉네임 + 비밀번호)
- 투표 완료 후에만 댓글 접근 가능
- 인기순(popular) / 최신순(latest) 정렬
- 무한스크롤 20개씩 로드
- 댓글 작성/수정/삭제, 좋아요 (TKUID 기반 토글)
- 바텀시트: dimmed 영역 클릭 시 닫힘, 스크롤 방지, 기존 스크롤 위치 유지
- 입력 제한: 닉네임(10자), 비밀번호(4-15자), 내용(200자)
- 수정/삭제 시 비밀번호 인증 -> verifyToken 발급

---

## 5. UUID (TKUID)

| 항목      | 내용                                                |
| --------- | --------------------------------------------------- |
| 식별자    | UUID v4 (`hp_tkuid` 키로 localStorage 저장)         |
| 생성 시점 | 사이트 첫 방문 시 자동 생성                         |
| 전달 방식 | `x-tku-id` HTTP 요청 헤더                           |
| 전송 대상 | 핫픽 조회, 투표, 댓글 좋아요, 댓글 좋아요 정보 조회 |
| 소실 시   | 새 UUID 생성 -> 이전 이력 연결 불가                 |

---

## 6. 에러 처리

- 불러오기 실패 -> "핫픽을 불러오는데 실패했습니다."
- 카테고리별 핫픽 0개 -> "아직 진행중인 핫픽이 없어요"

---

## API 요약

| Method | Endpoint                                                | 설명                               |
| ------ | ------------------------------------------------------- | ---------------------------------- |
| GET    | `/api/v1/hotpicks/main`                                 | 메인 피드 (카테고리, 커서, 사이즈) |
| GET    | `/api/v1/hotpicks/categories`                           | 카테고리 탭 목록                   |
| POST   | `/api/v1/hotpicks/{slug}/votes`                         | 투표 제출                          |
| GET    | `/api/v1/hotpicks/{slug}/elections/{id}/comments`       | 댓글 목록                          |
| POST   | `/api/v1/hotpicks/{slug}/elections/{id}/comments`       | 댓글 작성                          |
| GET    | `/api/v1/hotpicks/{slug}/elections/{id}/comments/count` | 댓글 수                            |
| PUT    | `/api/v1/comments/{commentId}`                          | 댓글 수정                          |
| DELETE | `/api/v1/comments/{commentId}`                          | 댓글 삭제                          |
| POST   | `/api/v1/comments/{commentId}/verify`                   | 비밀번호 인증                      |
| POST   | `/api/v1/comments/{commentId}/like`                     | 좋아요                             |
| DELETE | `/api/v1/comments/{commentId}/like`                     | 좋아요 취소                        |

## Changelog

- 2026-03-01: 초기 작성 (00-overview.md에서 분리)
