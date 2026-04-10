# 번들 어드민 페이지 설계

## 개요

번들 질문(가치관 비교 테스트)의 운영 모니터링 + 목록 관리를 위한 어드민 페이지.
번들 CRUD는 기존 핫픽 생성/수정 폼(`type: BUNDLE`)을 재사용하고, 어드민 페이지는 모니터링에 집중한다.

### 범위

- 번들 목록 조회 (참여자 수, 비교 링크 수, 상태 포함)
- 번들 상세 대시보드 (참여 현황, 비교 링크 통계, 질문별 응답 분포)
- 번들 상태 변경 (ACTIVE/CLOSED)
- 기존 핫픽 CRUD 페이지로의 바로가기 (생성/수정)

### 범위 밖

- 번들 전용 CRUD 폼 (기존 핫픽 폼 재사용)
- 비교 링크 개별 관리 (강제 닫기 등)
- 사용자 개별 활동 조회
- 프로덕션 접근 (dev-only 유지)

## 페이지 구조

### 라우팅

```
/admin
├── /admin/hotpick          — 기존 핫픽 목록
├── /admin/hotpick/create   — 핫픽 생성 (type=BUNDLE 포함)
├── /admin/hotpick/edit/[id]— 핫픽 수정
├── /admin/category         — 카테고리 관리
├── /admin/server-meta      — 서버 메타
├── /admin/bundle           — 번들 목록 (NEW)
└── /admin/bundle/[slug]    — 번들 상세 대시보드 (NEW)
```

### 접근 제어

기존 어드민과 동일하게 `NODE_ENV === 'development'`일 때만 접근 가능 (dev-only).

## 페이지 1: 번들 목록 (/admin/bundle)

### 구성 요소

- **"번들 생성" 버튼** — 클릭 시 `/admin/hotpick/create?type=BUNDLE`로 이동
- **번들 테이블** — 컬럼:

| 컬럼      | 설명                                                |
| --------- | --------------------------------------------------- |
| slug      | 번들 슬러그                                         |
| 제목      | 번들 제목                                           |
| 카테고리  | categoryCode 뱃지                                   |
| 질문 수   | questionCount                                       |
| 참여자    | participantCount                                    |
| 비교 링크 | compareLinkCount (1:1 + 그룹 합산)                  |
| 상태      | ACTIVE (초록) / CLOSED (회색)                       |
| 액션      | "상세 →" (상세 대시보드), "수정" (핫픽 수정 페이지) |

### 액션 링크

- "상세 →" → `/admin/bundle/{slug}`
- "수정" → `/admin/hotpick/edit/{hotpickId}`

## 페이지 2: 번들 상세 대시보드 (/admin/bundle/[slug])

### 헤더

- 뒤로가기 링크 (← 번들 목록)
- 번들 제목 + slug
- 상태 표시 (ACTIVE/CLOSED) + 상태 변경 버튼
- "수정" 링크 → `/admin/hotpick/edit/{hotpickId}`

### 탭 1: 참여 현황

- **요약 카드 3개**: 총 참여자, 완료율, 비교 링크 수
- **일별 참여 추이 차트**: 최근 14일 바 차트 (CSS 기반, 차트 라이브러리 불필요)

### 탭 2: 비교 링크

- **요약 카드 3개**: 1:1 링크 수, 그룹 링크 수, 활성 그룹 수
- **링크 목록 테이블** — 컬럼:

| 컬럼          | 설명                                                                           |
| ------------- | ------------------------------------------------------------------------------ |
| 타입          | ONE_TO_ONE / GROUP 뱃지                                                        |
| 그룹명/생성자 | 그룹명 (그룹) 또는 생성자 닉네임 (1:1)                                         |
| 멤버          | memberCount                                                                    |
| 상태          | 1:1: 대기(참여자 없음)/완료(참여자 있음), 그룹: 활성(!isClosed)/닫힘(isClosed) |
| 생성일        | createdAt                                                                      |
| 토큰          | 토큰 값 (monospace, 축약 표시)                                                 |

### 탭 3: 질문별 통계

- 각 질문마다 카드 형태로 표시:
  - 질문 번호 + 제목 (예: Q1. 썸 탈 때)
  - 옵션 A: 라벨 + 수평 바 (비율%) + 응답 수
  - 옵션 B: 라벨 + 수평 바 (비율%) + 응답 수
  - 다수 선택에 그라디언트 강조 (`$primary-gradient`)

## BE API 요구사항

BE에 신규 어드민 API 3개를 요청한다. FE는 MSW mock으로 선개발한다.

### API 1: 번들 목록 조회

```
GET /api/v1/admin/bundles
```

**Response:**

```json
{
  "bundles": [
    {
      "bundleId": 1,
      "hotpickId": 10,
      "slug": "love-values",
      "title": "연애 가치관 테스트",
      "category": "연애",
      "categoryCode": "LOVE",
      "questionCount": 5,
      "participantCount": 1234,
      "compareLinkCount": 89,
      "status": "ACTIVE",
      "createdAt": "2026-03-15T09:00:00Z"
    }
  ]
}
```

### API 2: 번들 상세 통계

```
GET /api/v1/admin/bundles/{slug}/stats
```

**Response:**

```json
{
  "bundleId": 1,
  "slug": "love-values",
  "title": "연애 가치관 테스트",
  "hotpickId": 10,
  "categoryCode": "LOVE",
  "status": "ACTIVE",
  "participation": {
    "totalParticipants": 1234,
    "completionRate": 92.3,
    "dailyStats": [{ "date": "2026-04-01", "count": 45 }]
  },
  "compareLinks": {
    "totalCount": 89,
    "oneToOneCount": 52,
    "groupCount": 37,
    "activeGroupCount": 12,
    "links": [
      {
        "token": "abc123",
        "type": "ONE_TO_ONE",
        "creatorNickname": "홍길동",
        "groupName": null,
        "memberCount": 2,
        "isClosed": false,
        "createdAt": "2026-04-05T14:30:00Z"
      },
      {
        "token": "def456",
        "type": "GROUP",
        "creatorNickname": "김철수",
        "groupName": "우리 팀",
        "memberCount": 8,
        "isClosed": false,
        "createdAt": "2026-04-04T10:00:00Z"
      }
    ]
  },
  "questionStats": [
    {
      "electionId": "le-1",
      "title": "썸 탈 때",
      "optionA": "먼저 연락",
      "optionB": "기다리기",
      "optionACount": 734,
      "optionBCount": 500,
      "optionARate": 59.5,
      "optionBRate": 40.5
    }
  ]
}
```

### API 3: 번들 상태 변경

```
PATCH /api/v1/admin/bundles/{slug}/status
```

**Request:**

```json
{ "status": "ACTIVE" | "CLOSED" }
```

**Response:**

```json
{ "slug": "love-values", "status": "CLOSED" }
```

## FE 컴포넌트 구조

```
src/
├── app/admin/bundle/
│   ├── page.tsx                    — 번들 목록 페이지
│   └── [slug]/
│       └── page.tsx                — 번들 상세 대시보드
├── components/features/Admin/Bundle/
│   ├── BundleList.tsx              — 목록 테이블
│   ├── BundleDashboard.tsx         — 상세 대시보드 (탭 관리)
│   ├── ParticipationTab.tsx        — 참여 현황 탭
│   ├── CompareLinksTab.tsx         — 비교 링크 탭
│   └── QuestionStatsTab.tsx        — 질문별 통계 탭
├── hooks/api/
│   └── useAdminBundle.ts           — 어드민 번들 쿼리/뮤테이션 훅
├── api/
│   └── adminBundle.ts              — API 호출 함수
├── types/
│   └── admin-bundle.ts             — 어드민 번들 타입 정의
└── mocks/
    ├── handlers/adminBundle.ts     — MSW 핸들러
    └── data/adminBundles.ts        — Mock 데이터
```

## 기술 결정

- **차트**: CSS 기반 바 차트 (차트 라이브러리 도입하지 않음, 어드민 dev-only이므로)
- **탭**: URL query param이 아닌 로컬 state로 관리 (어드민 단순 용도)
- **MSW mock**: 기존 mock 패턴 따라 `src/mocks/` 하위에 핸들러 + 데이터 분리
- **스타일**: 기존 어드민 페이지 SCSS 패턴 따름 (다크 테마 규칙 준수)
