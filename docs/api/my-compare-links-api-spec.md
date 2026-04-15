# My 탭 (비교) API 스펙

> 작성일: 2026-04-08
> 상태: BE 구현 요청
> 관련 스펙: docs/superpowers/specs/2026-04-08-my-tab-restructure-design.md

---

## 개요

메인 My 탭의 **비교** 하위 탭에서 사용하는 API 2개.

```
My 탭 → [비교] 선택
  ↓
1. GET /api/v1/bundles?filter=completed  →  내가 완료한 번들 목록
  ↓ (각 번들별)
2. GET /api/v1/bundles/{slug}/my-compare-links  →  해당 번들의 내 비교 링크 목록
```

---

## 1. 내가 완료한 번들 목록

| 항목      | 내용                                               |
| --------- | -------------------------------------------------- |
| Method    | `GET`                                              |
| URL       | `/api/v1/bundles`                                  |
| 인증      | 비로그인 OK (단, `filter=completed`는 로그인 필수) |
| 호출 시점 | 메인 My 탭 → 비교 탭 진입 시                       |
| 캐싱      | FE에서 staleTime 60초                              |

**Query Parameters:**

| 파라미터 | 타입     | 필수 | 설명                                           |
| -------- | -------- | ---- | ---------------------------------------------- |
| `filter` | `string` | N    | `completed` — 로그인 유저가 완료한 번들만 반환 |

**Response `data`:**

```typescript
Array<{
  bundleId: number;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  categoryCode: CategoryCode;
  questionCount: number;
  status: 'ACTIVE' | 'CLOSED';
  imageUrl?: string;
  participantCount: number;
  completed: boolean;
}>;
```

**참고:**

- `filter` 없이 호출하면 전체 번들 반환 (메인 피드, 사이트맵용)
- `filter=completed`일 때 비로그인이면 빈 배열 반환
- 페이지네이션 불필요 (번들 개수가 수백 개가 될 일 없음)
- 이 API는 `bundle-api-spec.md` 14번에도 정의되어 있음

**FE 하드코딩 위치 (이 API로 대체 예정):**

- `src/app/sitemap.ts` — 번들 slug 하드코딩 (`['love-values', 'marriage-values']`)
- `src/lib/mappers/cardMapper.ts` — `participated: false` 하드코딩
- 현재 MSW mock으로 동작 중 (`src/mocks/handlers.ts`)

---

## 2. 내 비교 링크 목록

| 항목      | 내용                                         |
| --------- | -------------------------------------------- |
| Method    | `GET`                                        |
| URL       | `/api/v1/bundles/{slug}/my-compare-links`    |
| 인증      | 로그인 필수                                  |
| 호출 시점 | 메인 My 탭 → 비교 탭 → 번들 아코디언 펼침 시 |
| 캐싱      | FE에서 staleTime 30초                        |

**Response `data`:**

```typescript
Array<{
  token: string;
  type: 'ONE_TO_ONE' | 'GROUP';
  status: 'WAITING' | 'COMPLETED'; // GROUP 은 항상 COMPLETED 로
  createdAt: string; // ISO 8601
  // 1:1 전용
  participantNickname: string | null; // 참여자 닉네임 (대기 중이면 null)
  // 그룹 전용
  groupName: string | null; // 그룹 이름
  memberCount: number; // 현재 멤버 수
}>;
```

**참고:**

- 현재 로그인 유저가 **생성자이거나 참여자**인 비교 링크만 반환
- 페이지네이션 불필요 (한 유저가 한 번들에 수백 개 링크를 만들 일 없음)
- 전체 목록 한 번에 반환
- FE에서 정렬 처리:
  - **1:1**: 대기 → 완료 순, 각 그룹 내 최신순
  - **그룹**: 멤버 수 많은 순

**FE 하드코딩 위치 (이 API로 대체 예정):**

- 현재 MSW mock으로 동작 중 (`src/mocks/handlers.ts`, `src/mocks/data/compare.ts`)

---

## FE 사용 흐름

1. My 탭 → 비교 선택 (로그인 유저만, 비로그인은 로그인 유도 화면)
2. `GET /api/v1/bundles?filter=completed` 호출 → 완료한 번들 목록
3. 번들 아코디언 렌더링 (최근 활동순, 첫 번째 자동 펼침)
4. 아코디언 펼침 시 `GET /api/v1/bundles/{slug}/my-compare-links` 호출
5. 비교 링크 목록 렌더링:
   - 1:1: `[대기/완료] 닉네임 [복사/이동 아이콘]`
   - 그룹: `[N명] 그룹명 [이동 아이콘]`
6. 하단 CTA: `[+ 1:1 비교]` `[+ 그룹 비교]` 버튼으로 새 비교 생성

### 비교 링크 액션

| 타입 | 상태      | 클릭 시                               |
| ---- | --------- | ------------------------------------- |
| 1:1  | WAITING   | 링크 클립보드 복사 + 토스트           |
| 1:1  | COMPLETED | `/compare/match/{token}?from=my` 이동 |
| 그룹 | any       | `/compare/group/{token}?from=my` 이동 |

`?from=my` 파라미터로 결과 페이지에서 뒤로가기 버튼 표시.
