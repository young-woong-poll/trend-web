# 번들 API 개발 요청서

> **작성일**: 2026-03-31
> **상태**: Phase 1 (번들 풀기 + 내 결과)
> **FE 담당**: 웅일
> **관련 기획서**: `docs/specs/bundle-compare.md`

---

## 공통 사항

- Base URL: `https://hotpick-api.votebox.kr`
- 인증: 쿠키 기반 (withCredentials: true)
- 응답 래퍼: `{ code: string, message: string, data: T }`
- 에러 코드: `SUCCESS`, `NOT_FOUND`, `UNAUTHORIZED`, `BAD_REQUEST`

---

## Phase 1 API (번들 풀기 + 내 결과)

### 1. 번들 상세 조회

| 항목      | 내용                                  |
| --------- | ------------------------------------- |
| Method    | `GET`                                 |
| URL       | `/api/v1/bundles/{slug}`              |
| 인증      | 비로그인 OK                           |
| 호출 시점 | 인트로 페이지 (`/bundle/{slug}`) 진입 |
| 캐싱      | FE에서 staleTime 60초                 |

**Response `data`:**

```typescript
{
  bundleId: number;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;          // "연애", "결혼", "직장" 등
  questionCount: number;
  status: 'ACTIVE' | 'CLOSED';
  imageUrl?: string;         // 썸네일 이미지 CDN URL (없으면 null/undefined)
  participantCount: number;  // 번들 완료한 유저 수
  completed: boolean;        // 로그인 유저의 완료 여부 (비로그인 시 false)
}
```

**참고:**

- `completed`는 로그인 유저에 대해서만 의미 있음
- 비로그인 시 `completed: false` 고정
- FE에서 `completed: true`이면 "결과 보기" 버튼, `false`이면 "시작하기" 버튼 표시

---

### 2. 질문 목록 조회

| 항목      | 내용                                     |
| --------- | ---------------------------------------- |
| Method    | `GET`                                    |
| URL       | `/api/v1/bundles/{slug}/elections`       |
| 인증      | 로그인 필수                              |
| 호출 시점 | 풀기 페이지 (`/bundle/{slug}/play`) 진입 |
| 캐싱      | FE에서 staleTime 60초                    |

**Response `data`:**

```typescript
Array<{
  electionId: string; // 질문 고유 ID
  title: string; // 질문 텍스트
  optionA: string; // 선택지 A 텍스트
  optionB: string; // 선택지 B 텍스트
  order: number; // 순서 (1부터 시작)
}>;
```

**참고:**

- order 순서대로 정렬하여 리턴
- 이미 완료한 유저가 다시 호출해도 질문 목록은 동일하게 리턴 (FE에서 완료 여부 체크 후 결과 페이지로 리다이렉트)

---

### 3. 답변 제출

| 항목      | 내용                             |
| --------- | -------------------------------- |
| Method    | `POST`                           |
| URL       | `/api/v1/bundles/{slug}/answers` |
| 인증      | 로그인 필수                      |
| 호출 시점 | 마지막 질문에서 "결과 보기" 클릭 |

**Request Body:**

```typescript
{
  answers: Array<{
    electionId: string; // 질문 ID
    selected: 'A' | 'B'; // 유저 선택
  }>;
}
```

**Response `data`:**

```typescript
{
  completed: boolean; // true (성공 시)
}
```

**BE 처리 사항:**

- 모든 질문에 대한 답변이 포함되어야 함 (누락 시 `BAD_REQUEST`)
- 이미 완료한 유저가 다시 제출하면 `BAD_REQUEST` (중복 제출 방지)
- 답변 저장 + 해당 유저의 번들 완료 상태 처리
- `participantCount` 증가

---

### 4. 내 결과 조회

| 항목      | 내용                                       |
| --------- | ------------------------------------------ |
| Method    | `GET`                                      |
| URL       | `/api/v1/bundles/{slug}/my-result`         |
| 인증      | 로그인 필수                                |
| 호출 시점 | 결과 페이지 (`/bundle/{slug}/result`) 진입 |
| 캐싱      | FE에서 staleTime 0 (항상 최신 fetch)       |

**Response `data`:**

```typescript
{
  bundleSlug: string;
  bundleTitle: string;
  totalQuestions: number;

  // 내 답변
  myAnswers: Array<{
    electionId: string;
    title: string; // 질문 텍스트
    optionA: string;
    optionB: string;
    selected: 'A' | 'B'; // 내가 고른 것
  }>;

  // 각 질문별 실시간 투표 비율
  questionStats: Array<{
    electionId: string;
    optionARate: number; // 0~100 (정수, 반올림)
    optionBRate: number; // 0~100 (정수, optionARate + optionBRate = 100)
    totalVotes: number; // 해당 질문의 총 투표 수
  }>;
}
```

**참고:**

- `questionStats`의 비율은 **실시간 변동** — 다른 유저 투표가 진행될수록 비율 변경
- 결과 페이지 재방문 시 최신 비율 기준으로 재계산됨
- 미완료 유저가 호출하면 `404 NOT_FOUND`

**FE에서 계산하는 항목 (서버에서 보내지 않음):**

- 대중성 지수 = 각 질문에서 내 선택지의 득표율 평균 (가중 평균 방식)
- 대중성 등급: 68%+ 사자왕, 58~67% 여우, 48~57% 판다, 38~47% 고양이, ~37% 유니콘
- 캐릭터 이미지, 타이틀, 설명
- 다수파/소수파 뱃지

---

## Phase 2 추가 예정 API (참고용)

> 아래는 Phase 2에서 추가될 API 목록입니다. 상세 스펙은 Phase 2 착수 시 업데이트합니다.

| Method | Endpoint                                     | 설명                               |
| ------ | -------------------------------------------- | ---------------------------------- |
| POST   | `/api/v1/bundles/{slug}/compare-links`       | 비교 링크 생성 (1:1 or 그룹)       |
| GET    | `/api/v1/compare-links/{token}`              | 비교 링크 정보 조회                |
| PATCH  | `/api/v1/compare-links/{token}`              | 비교 링크 수정 (그룹명, 마감 여부) |
| POST   | `/api/v1/compare-links/{token}/join`         | 비교 링크 참여                     |
| PATCH  | `/api/v1/compare-links/{token}/close`        | 그룹 마감                          |
| PATCH  | `/api/v1/compare-links/{token}/reopen`       | 그룹 재오픈                        |
| GET    | `/api/v1/bundles/{slug}/my-compare-links`    | 내 비교 링크 목록                  |
| GET    | `/api/v1/compare-links/{token}/result`       | 1:1 비교 결과                      |
| GET    | `/api/v1/compare-links/{token}/group-result` | 그룹 비교 결과                     |

## Phase 3 추가 예정

- `questionStats`에 성별/세대별 breakdown 추가 (`genderBreakdown`, `ageGroupBreakdown`)
- 상세 스펙은 `docs/specs/bundle-compare.md` 섹션 7.3 참조
