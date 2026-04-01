# 번들 API 개발 요청서

> **작성일**: 2026-03-31
> **상태**: Phase 1 완료 + Phase 2 (1:1 비교)
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

## Phase 2 API (1:1 비교)

### 5. 비교 링크 생성

| 항목      | 내용                                          |
| --------- | --------------------------------------------- |
| Method    | `POST`                                        |
| URL       | `/api/v1/bundles/{slug}/compare-links`        |
| 인증      | 로그인 필수                                   |
| 호출 시점 | 결과 페이지에서 "친구와 가치관 비교하기" 클릭 |

**Request Body:**

```typescript
{
  type: 'ONE_TO_ONE' | 'GROUP';  // Phase 2에서는 ONE_TO_ONE만 사용
  groupName?: string;             // GROUP 타입 시 그룹 이름 (Phase 3)
}
```

**Response `data`:**

```typescript
{
  token: string; // 비교 링크 토큰 (URL에 사용)
  shareUrl: string; // 공유용 전체 URL (예: https://hotpick.kr/compare/abc123)
}
```

**BE 처리 사항:**

- 해당 번들을 완료한 유저만 생성 가능 (미완료 시 `BAD_REQUEST`)
- 토큰은 유니크한 랜덤 문자열 (8자 이상)
- **중복 생성 방지 (중요):** 같은 유저 + 같은 번들 + 같은 type에 `WAITING` 상태 링크가 이미 있으면 **새로 생성하지 않고 기존 링크를 리턴**. 누군가 참여하여 `COMPLETED`된 링크는 소비된 것으로 간주하고, 다음 요청 시 새 링크를 생성.
  - 이유: FE에서 버튼 클릭 시 즉시 API 호출하므로, 중복 클릭이나 재방문 시 불필요한 링크 누적 방지

---

### 6. 비교 링크 정보 조회

| 항목      | 내용                                             |
| --------- | ------------------------------------------------ |
| Method    | `GET`                                            |
| URL       | `/api/v1/compare-links/{token}`                  |
| 인증      | 비로그인 OK (단, 로그인 상태에 따라 응답 달라짐) |
| 호출 시점 | 비교 랜딩 페이지 (`/compare/{token}`) 진입       |
| 캐싱      | FE에서 staleTime 30초                            |

**Response `data`:**

```typescript
{
  token: string;
  type: 'ONE_TO_ONE' | 'GROUP';
  bundleSlug: string;
  bundleTitle: string;
  creatorNickname: string; // 링크 생성자 닉네임
  creatorImageUrl: string | null; // 링크 생성자 대중성 캐릭터 이미지 URL
  participantNickname: string | null; // 참여자 닉네임 (아직 없으면 null)
  isCreator: boolean; // 현재 로그인 유저가 생성자인지
  isParticipant: boolean; // 현재 로그인 유저가 참여자인지
  myBundleCompleted: boolean; // 현재 로그인 유저의 해당 번들 완료 여부
  compareReady: boolean; // 비교 가능 여부 (둘 다 완료)
  status: 'WAITING' | 'COMPLETED' | 'CLOSED';
  questionCount: number; // 번들 질문 수
  participantCount: number; // 번들 참여자 수
}
```

**참고:**

- 비로그인 시: `isCreator: false`, `isParticipant: false`, `myBundleCompleted: false`, `compareReady: false`
- FE에서 이 필드들을 조합하여 랜딩 페이지 UI 분기:
  - 생성자 + 대기 중 → 대기 화면
  - 받는 사람 + 번들 미완료 → "대결 수락하기" (번들 풀기로 이동)
  - 받는 사람 + 번들 완료 → "결과 확인하기" (자동 join 후 결과)
  - 비교 완료 → "비교 결과 보기"

---

### 7. 비교 링크 참여

| 항목      | 내용                                     |
| --------- | ---------------------------------------- |
| Method    | `POST`                                   |
| URL       | `/api/v1/compare-links/{token}/join`     |
| 인증      | 로그인 필수                              |
| 호출 시점 | 번들 완료 유저가 비교 링크 랜딩에서 참여 |

**Request Body:** 없음 (로그인 유저 자동 매핑)

**Response `data`:**

```typescript
{
  joined: boolean; // true (성공 시)
}
```

**BE 처리 사항:**

- 1:1 링크는 최초 1명만 참여 가능 (이미 다른 사람이 참여했으면 `BAD_REQUEST`)
- 생성자 본인은 참여 불가 (`BAD_REQUEST`)
- 해당 번들을 완료한 유저만 참여 가능 (미완료 시 `BAD_REQUEST`)
- 참여 성공 시 링크 상태를 `COMPLETED`로 변경

---

### 8. 1:1 비교 결과 조회

| 항목      | 내용                                              |
| --------- | ------------------------------------------------- |
| Method    | `GET`                                             |
| URL       | `/api/v1/compare-links/{token}/result`            |
| 인증      | 로그인 필수                                       |
| 호출 시점 | 비교 결과 페이지 (`/compare/{token}/result`) 진입 |
| 캐싱      | FE에서 staleTime 0 (항상 최신 fetch)              |

**Response `data`:**

```typescript
{
  bundleSlug: string;
  bundleTitle: string;
  totalQuestions: number;

  // 현재 로그인 유저 기준 "나"
  me: {
    nickname: string;
    answers: Array<{ electionId: string; selected: 'A' | 'B' }>;
  }

  // 상대방
  target: {
    nickname: string;
    answers: Array<{ electionId: string; selected: 'A' | 'B' }>;
  }

  // 각 질문별 실시간 투표 비율 (대중 전체 기준)
  questionStats: Array<{
    electionId: string;
    title: string; // 질문 텍스트
    optionA: string; // 선택지 A 텍스트
    optionB: string; // 선택지 B 텍스트
    optionARate: number; // 0~100 (정수)
    optionBRate: number; // 0~100
    totalVotes: number;
  }>;

  matchCount: number; // 같은 답 개수
  matchRate: number; // 일치율 0~100 (정수, matchCount/totalQuestions * 100)

  // 이 번들의 전체 커플 등급 분포 (%)
  gradeDistribution: {
    S: number; // 90~100% 일치
    A: number; // 70~89%
    B: number; // 50~69%
    C: number; // 30~49%
    D: number; // 0~29%
  }
}
```

**참고:**

- `me`/`target`은 **현재 로그인 유저 기준**으로 자동 배정 (생성자든 참여자든 자기가 "me")
- 링크 상태가 `COMPLETED`가 아니면 `404 NOT_FOUND`
- `questionStats`의 비율은 **실시간 변동**
- `gradeDistribution`은 이 번들에서 비교한 전체 커플들의 등급 분포

**FE에서 계산하는 항목 (서버에서 보내지 않음):**

- 케미 등급: matchRate 기준 → S(90+), A(70~89), B(50~69), C(30~49), D(~29)
- 케미 타이틀/한줄평: FE 상수 매핑
- 충격 포인트: 둘이 다른 답 중 대중 투표 비율 차이가 가장 큰 질문 선별
- 대중성 비교: 각자의 대중성 지수 계산 (me.answers / target.answers × questionStats)
- "같은 편/갈린 순간" 스토리텔링: 일치/불일치 답변 분류

---

## Phase 3 추가 예정 API (참고용)

> 상세 스펙은 Phase 3 착수 시 업데이트합니다.

| Method | Endpoint                                     | 설명                               |
| ------ | -------------------------------------------- | ---------------------------------- |
| PATCH  | `/api/v1/compare-links/{token}`              | 비교 링크 수정 (그룹명, 마감 여부) |
| PATCH  | `/api/v1/compare-links/{token}/close`        | 그룹 마감                          |
| PATCH  | `/api/v1/compare-links/{token}/reopen`       | 그룹 재오픈                        |
| GET    | `/api/v1/bundles/{slug}/my-compare-links`    | 내 비교 링크 목록                  |
| GET    | `/api/v1/compare-links/{token}/group-result` | 그룹 비교 결과                     |

- `questionStats`에 성별/세대별 breakdown 추가 (`genderBreakdown`, `ageGroupBreakdown`)
- 상세 스펙은 `docs/specs/bundle-compare.md` 섹션 7.3 참조
