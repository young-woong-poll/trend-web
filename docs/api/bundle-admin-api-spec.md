# 번들 어드민 API 개발 요청서

> **작성일**: 2026-04-07
> **상태**: FE 선개발 완료 (MSW mock), BE 구현 요청
> **FE 담당**: 웅일
> **관련 설계서**: `docs/superpowers/specs/2026-04-07-bundle-admin-design.md`

---

## 공통 사항

- Base URL: `https://hotpick-api.votebox.kr`
- 인증: 어드민 전용 (현재 dev-only, 추후 어드민 인증 추가 가능)
- 응답 래퍼: `{ code: string, message: string, data: T }`
- 에러 코드: `SUCCESS`, `NOT_FOUND`, `UNAUTHORIZED`, `BAD_REQUEST`
- URL 패턴: `/admin/api/v1/bundles/...` (기존 어드민 API 패턴과 동일)

---

## 요약

| #   | Method | URL                                  | 목적                       | 사용 페이지                             |
| --- | ------ | ------------------------------------ | -------------------------- | --------------------------------------- |
| 1   | GET    | `/admin/api/v1/bundles`              | 번들 목록 조회             | `/admin/bundle`                         |
| 2   | GET    | `/admin/api/v1/bundles/{slug}/stats` | 번들 상세 통계             | `/admin/bundle/{slug}`                  |
| 3   | POST   | `/admin/api/v1/bundles`              | 번들 생성                  | `/admin/hotpick/create?type=BUNDLE`     |
| 4   | PUT    | `/admin/api/v1/bundles/{slug}`       | 번들 수정 (상태 변경 포함) | `/admin/bundle/{slug}`                  |
| 5   | DELETE | `/admin/api/v1/bundles/{slug}`       | 번들 삭제                  | `/admin/bundle`, `/admin/bundle/{slug}` |

---

## 1. 번들 목록 조회

| 항목      | 내용                            |
| --------- | ------------------------------- |
| Method    | `GET`                           |
| URL       | `/admin/api/v1/bundles`         |
| 인증      | 어드민                          |
| 호출 시점 | 어드민 번들 목록 페이지 진입 시 |
| 캐싱      | FE에서 staleTime 기본값 (5분)   |

**Request:** 없음 (쿼리 파라미터 없음)

**Response `data`:**

```typescript
AdminBundleSummary[]
```

```typescript
interface AdminBundleSummary {
  bundleId: number; // 번들 고유 ID
  hotpickId: number; // 핫픽 ID (수정 페이지 링크용: /admin/hotpick/edit/{hotpickId})
  slug: string; // 번들 슬러그 (예: "love-values")
  title: string; // 번들 제목 (예: "연애 가치관 테스트")
  category: string; // 카테고리 표시명 (예: "연애")
  categoryCode: CategoryCode; // 'LOVE' | 'MARRIAGE' | 'FINANCE' | 'WORK' | ...
  questionCount: number; // 질문 수 (보통 5)
  participantCount: number; // 번들 완료한 총 참여자 수
  compareLinkCount: number; // 생성된 비교 링크 수 (1:1 + 그룹 합산)
  status: 'ACTIVE' | 'CLOSED';
  createdAt: string; // ISO 8601 (예: "2026-03-15T09:00:00Z")
}
```

**FE에서 사용:**

- 목록 테이블에 slug, 제목, 카테고리 뱃지, 질문 수, 참여자 수, 비교 링크 수, 상태 표시
- `hotpickId`로 핫픽 수정 페이지 링크 생성 (`/admin/hotpick/edit/{hotpickId}`)
- `slug`로 상세 대시보드 링크 생성 (`/admin/bundle/{slug}`)

---

## 2. 번들 상세 통계

| 항목      | 내용                                 |
| --------- | ------------------------------------ |
| Method    | `GET`                                |
| URL       | `/admin/api/v1/bundles/{slug}/stats` |
| 인증      | 어드민                               |
| 호출 시점 | 어드민 번들 상세 페이지 진입 시      |
| 캐싱      | FE에서 staleTime 0 (항상 fresh)      |

**Path Parameter:**

| 파라미터 | 타입   | 설명        |
| -------- | ------ | ----------- |
| slug     | string | 번들 슬러그 |

**Request:** 없음

**Response `data`:**

```typescript
interface AdminBundleStats {
  bundleId: number;
  slug: string;
  title: string;
  hotpickId: number; // 핫픽 수정 페이지 링크용
  categoryCode: CategoryCode;
  status: 'ACTIVE' | 'CLOSED';

  // ── 참여 현황 (탭 1) ──
  participation: {
    totalParticipants: number; // 번들 완료한 총 참여자 수
    completionRate: number; // 완료율 (%) — 예: 92.3
    dailyStats: DailyStat[]; // 최근 14일 일별 참여자 수
  };

  // ── 비교 링크 통계 (탭 2) ──
  compareLinks: {
    totalCount: number; // 전체 비교 링크 수
    oneToOneCount: number; // 1:1 링크 수
    groupCount: number; // 그룹 링크 수
    activeGroupCount: number; // 현재 활성(미닫힘) 그룹 수
    links: AdminCompareLink[]; // 비교 링크 목록
  };

  // ── 질문별 응답 분포 (탭 3) ──
  questionStats: AdminQuestionStat[];
}

interface DailyStat {
  date: string; // "2026-04-01" (YYYY-MM-DD)
  count: number; // 해당 일자 참여자 수
}

interface AdminCompareLink {
  token: string; // 비교 링크 토큰
  type: 'ONE_TO_ONE' | 'GROUP'; // 링크 타입
  creatorNickname: string; // 생성자 닉네임
  groupName: string | null; // 그룹명 (1:1이면 null)
  memberCount: number; // 현재 멤버 수
  isClosed: boolean; // 그룹 닫힘 여부
  createdAt: string; // ISO 8601
}

interface AdminQuestionStat {
  electionId: string; // 질문 ID
  title: string; // 질문 제목 (예: "썸 탈 때")
  optionA: string; // 선택지 A (예: "먼저 연락")
  optionB: string; // 선택지 B (예: "기다리기")
  optionACount: number; // A 선택 수
  optionBCount: number; // B 선택 수
  optionARate: number; // A 선택 비율 (%) — 예: 59.5
  optionBRate: number; // B 선택 비율 (%) — 예: 40.5
}
```

**FE에서 사용:**

- **탭 1 (참여 현황)**: `participation` — 요약 카드 3개 + 일별 바 차트
- **탭 2 (비교 링크)**: `compareLinks` — 요약 카드 3개 + 링크 목록 테이블
- **탭 3 (질문별 통계)**: `questionStats` — 질문별 A/B 비율 바 차트

**에러:**

| 상황                      | code        | status |
| ------------------------- | ----------- | ------ |
| slug에 해당하는 번들 없음 | `NOT_FOUND` | 404    |

---

## 3. 번들 생성

| 항목      | 내용                                                           |
| --------- | -------------------------------------------------------------- |
| Method    | `POST`                                                         |
| URL       | `/admin/api/v1/bundles`                                        |
| 인증      | 어드민                                                         |
| 호출 시점 | 어드민 핫픽 생성 페이지에서 type=BUNDLE 선택 후 생성 버튼 클릭 |

**배경:** 기존 `POST /admin/api/v1/hotpicks` (`CreateHotpickRequest`)는 `type: 'SINGLE'`만 지원하고, election 1개 + items 2~4개 구조입니다. 번들은 election(질문)이 여러 개이고 각각 A/B 2개 고정이므로 구조가 다릅니다. 별도 생성 API가 필요합니다.

**Request:**

```typescript
interface CreateBundleRequest {
  slug: string; // 번들 슬러그 (고유, URL에 사용)
  title: string; // 번들 제목 (예: "연애 가치관 테스트")
  subtitle?: string; // 부제목
  description?: string; // 설명
  categoryCode: CategoryCode; // 카테고리 코드 ('LOVE' | 'MARRIAGE' | ...)
  imageUrl?: string; // 썸네일 이미지 URL
  visible?: boolean; // 노출 여부 (기본 true)
  questions: CreateBundleQuestion[]; // 질문 목록 (순서 = 배열 인덱스, 최소 2개)
}

interface CreateBundleQuestion {
  title: string; // 질문 제목 (예: "썸 탈 때")
  optionA: string; // 선택지 A (예: "먼저 연락")
  optionB: string; // 선택지 B (예: "기다리기")
}
```

**기존 핫픽 API와 차이:**

| 항목     | 기존 핫픽 (`CreateHotpickRequest`) | 번들 (`CreateBundleRequest`)       |
| -------- | ---------------------------------- | ---------------------------------- |
| type     | `'SINGLE'`만 허용                  | 불필요 (엔드포인트가 번들 전용)    |
| 질문     | `election` 1개 → `items[]` 2~4개   | `questions[]` N개 → 각각 A/B 고정  |
| 카테고리 | `categoryIds: number[]`            | `categoryCode: CategoryCode`       |
| 제목     | election.title이 질문 제목         | 번들 자체 제목 + 각 질문 제목 별도 |

**Response `data`:**

```typescript
{
  bundleId: number;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  categoryCode: CategoryCode;
  imageUrl: string | null;
  questionCount: number;
  status: 'ACTIVE'; // 생성 시 항상 ACTIVE
  questions: {
    electionId: string;
    title: string;
    optionA: string;
    optionB: string;
  }
  [];
}
```

**FE에서 사용:**

- `/admin/hotpick/create?type=BUNDLE` 에서 번들 타입 선택 후 질문 입력 → 생성
- 성공 시 `/admin/bundle` 목록으로 이동

**에러:**

| 상황           | code          | status |
| -------------- | ------------- | ------ |
| slug 중복      | `CONFLICT`    | 409    |
| 필수 필드 누락 | `BAD_REQUEST` | 400    |
| 질문 2개 미만  | `BAD_REQUEST` | 400    |

---

## 4. 번들 수정

| 항목      | 내용                           |
| --------- | ------------------------------ |
| Method    | `PUT`                          |
| URL       | `/admin/api/v1/bundles/{slug}` |
| 인증      | 어드민                         |
| 호출 시점 | 어드민이 번들 정보를 수정할 때 |

**용도:** 서비스 오픈 전 또는 유저 유입 전에 번들 제목, 설명, 카테고리, 질문 내용/순서 등을 수정. 이미 참여자가 있는 번들은 질문 수정 시 통계가 달라질 수 있으므로 주의 필요.

**Path Parameter:**

| 파라미터 | 타입   | 설명        |
| -------- | ------ | ----------- |
| slug     | string | 번들 슬러그 |

**Request:**

```typescript
interface UpdateBundleRequest {
  title?: string; // 번들 제목
  subtitle?: string; // 번들 부제목
  description?: string; // 번들 설명
  categoryCode?: CategoryCode; // 카테고리 코드
  imageUrl?: string; // 썸네일 이미지 URL
  questions?: UpdateBundleQuestion[]; // 질문 목록 (순서 = 배열 인덱스)
}

interface UpdateBundleQuestion {
  electionId?: string; // 기존 질문 수정 시 ID (신규 질문이면 생략)
  title: string; // 질문 제목 (예: "썸 탈 때")
  optionA: string; // 선택지 A
  optionB: string; // 선택지 B
}
```

**참고:**

- 모든 필드는 optional — 보내지 않은 필드는 변경하지 않음
- `questions`를 보내면 **전체 교체** (배열 순서 = 질문 순서)
- 기존 질문 수정: `electionId` 포함 → 해당 질문 업데이트
- 새 질문 추가: `electionId` 생략 → 신규 생성
- 기존 질문 삭제: `questions` 배열에서 제외 → 삭제
- 이미 투표가 진행된 질문을 수정/삭제하면 기존 투표 데이터와 불일치 발생 가능 — BE에서 `participantCount > 0`이면 경고 응답 또는 별도 확인 필요 여부는 협의

**Response `data`:**

```typescript
{
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  categoryCode: CategoryCode;
  imageUrl: string | null;
  questionCount: number;
  questions: {
    electionId: string;
    title: string;
    optionA: string;
    optionB: string;
  }
  [];
}
```

**FE에서 사용:**

- 어드민 상세 대시보드에서 "수정" 기능 (향후 수정 모달 또는 수정 페이지 구현 시)
- 성공 시 목록 + 상세 쿼리 invalidate

**에러:**

| 상황                                 | code          | status |
| ------------------------------------ | ------------- | ------ |
| slug에 해당하는 번들 없음            | `NOT_FOUND`   | 404    |
| 필수 필드 누락 (예: 질문 title 빈값) | `BAD_REQUEST` | 400    |
| slug 중복                            | `CONFLICT`    | 409    |

---

## 5. 번들 삭제

| 항목      | 내용                                          |
| --------- | --------------------------------------------- |
| Method    | `DELETE`                                      |
| URL       | `/admin/api/v1/bundles/{slug}`                |
| 인증      | 어드민                                        |
| 호출 시점 | 번들 목록 또는 상세 페이지에서 삭제 버튼 클릭 |

**Path Parameter:**

| 파라미터 | 타입   | 설명        |
| -------- | ------ | ----------- |
| slug     | string | 번들 슬러그 |

**Request:** 없음

**Response `data`:** `null`

**FE에서 사용:**

- 번들 목록 페이지 테이블의 "삭제" 버튼
- 번들 상세 대시보드 헤더의 "삭제" 버튼
- 삭제 전 confirm 다이얼로그 표시
- 성공 시 목록 쿼리 invalidate, 상세에서 삭제 시 `/admin/bundle`로 이동

**에러:**

| 상황                      | code        | status |
| ------------------------- | ----------- | ------ |
| slug에 해당하는 번들 없음 | `NOT_FOUND` | 404    |

---

## 참고: FE 현황

- FE는 MSW mock으로 선개발 완료 (`src/mocks/data/adminBundles.ts`)
- BE 구현 후 MSW 핸들러만 제거하면 바로 연동 가능
- `hotpickId`는 현재 mock에서 핫픽 mock의 번들 ID로 임시 매핑 — BE에서 실제 값 내려주면 교체
- API 4 (번들 수정)은 FE 미구현 — BE 구현 후 수정 UI 추가 예정
