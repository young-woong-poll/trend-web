# 번들 API 개발 요청서

> **작성일**: 2026-03-31 (Phase 3 업데이트: 2026-04-06)
> **상태**: Phase 1 완료 + Phase 2 완료 + Phase 3 (그룹 비교) + Phase 3.1 (이성 콘텐츠 토글)
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
  category: string;          // 카테고리 표시명 (예: "연애", "결혼")
  categoryCode: CategoryCode; // 카테고리 코드 ('LOVE' | 'MARRIAGE' | 'FINANCE' | 'WORK' | 'SPORTS' | 'FOOD' | 'GAME' | 'CAR' | 'HEALTH' | 'TREND')
  questionCount: number;
  status: 'ACTIVE' | 'CLOSED';
  imageUrl?: string;         // 썸네일 이미지 CDN URL (없으면 null/undefined)
  participantCount: number;  // 번들 완료한 유저 수
  completed: boolean;        // 로그인 유저의 투표완료 여부 (비로그인 시 false)
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
}>;
```

**참고:**

- BE에서 정렬된 순서대로 리턴. FE는 배열 순서 그대로 사용
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

**BE 처리 유의사항:**

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
  categoryCode: CategoryCode; // 카테고리 코드 (FE 테마 색상 적용용)
  totalQuestions: number;

  // 내 답변
  myAnswers: Array<{
    electionId: string;
    title: string; // 질문 텍스트
    optionA: string;
    optionB: string;
    selected: 'A' | 'B'; // 내가 고른 것
  }>;

  // 각 질문별 실시간 투표 수
  questionStats: Array<{
    electionId: string;
    optionACount: number; // A 선택 투표 수
    optionBCount: number; // B 선택 투표 수
  }>;
}
```

**참고:**

- `questionStats`의 투표 수는 **실시간 변동** — 다른 유저 투표가 진행될수록 변경
- 결과 페이지 재방문 시 최신 투표 수 기준으로 FE에서 비율 재계산
- 미완료 유저가 호출하면 `404 NOT_FOUND`

**FE에서 계산하는 항목 (서버에서 보내지 않음):**

- 투표 비율 = optionACount / (optionACount + optionBCount) × 100 (부동소수점 없이 정수 처리)
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
  type: 'ONE_TO_ONE' | 'GROUP';
  groupName?: string;             // GROUP 타입 시 그룹 이름 (1~20자, <>"'& 금지)
  showGenderContent?: boolean;    // GROUP 타입 시 이성 콘텐츠 표시 여부 (미전송 시 카테고리별 기본값: LOVE/MARRIAGE → true, 나머지 → false)
}
```

**Response `data`:**

```typescript
{
  token: string; // 비교 링크 토큰 (URL에 사용)
}
```

**FE에서 공유 URL 생성:** `${window.location.origin}/compare/${token}`

**BE 처리 사항:**

- 해당 번들을 완료한 유저만 생성 가능 (미완료 시 `BAD_REQUEST`)
- 토큰은 유니크한 랜덤 문자열 (8자 이상)
- **항상 새 토큰 발급**: 요청 시마다 새 링크를 생성. 기존 WAITING 링크가 있어도 재사용하지 않음
  - 이유: 사용자가 여러 사람에게 자유롭게 비교 링크를 보낼 수 있어야 바이럴이 원활함. 기존 링크 재사용 시 "A에게 보냈는데 A가 안 하면 B에게 못 보내는" 문제 발생
  - 미사용 WAITING 링크 누적은 비용 미미. 필요 시 30일 경과 WAITING 링크 자동 정리 배치로 대응
- **링크 관리 페이지 미구현**: MVP 단계에서 "내가 보낸 링크" 목록 관리 페이지는 불필요. 유저가 보고 싶은 것은 링크 목록이 아니라 비교 결과이며, 비교 결과는 비교 결과 페이지에서 이미 접근 가능. 추후 필요 시 "내 비교 기록" 형태로 COMPLETED 상태 결과만 모아서 제공 검토

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
  categoryCode: CategoryCode; // 번들 카테고리 코드 (FE 테마 색상 적용용)
  creatorNickname: string; // 링크 생성자 닉네임
  participantNickname: string | null; // 참여자 닉네임 (1:1 전용, 아직 없으면 null)
  hasParticipant: boolean; // 1:1 링크에 참여자가 존재하는지 (GROUP은 memberCount 사용)
  isCreator: boolean; // 현재 로그인 유저가 생성자인지
  isParticipant: boolean; // 현재 로그인 유저가 참여자인지
  myBundleCompleted: boolean; // 현재 로그인 유저의 해당 번들 완료 여부
  questionCount: number; // 번들 질문 수
  participantCount: number; // 번들 참여자 수

  // ─── GROUP 타입 전용 필드 ───
  groupName: string | null; // 그룹 이름 (GROUP 전용, ONE_TO_ONE은 null)
  memberCount: number; // 현재 참여 멤버 수 (GROUP 전용, ONE_TO_ONE은 0)
  isClosed: boolean; // 그룹 마감 여부 (GROUP 전용, ONE_TO_ONE은 false)
}
```

**인증 정책:**

- **비인증(비로그인) 요청도 200 응답 필수.** 공유 링크이므로 로그인하지 않아도 링크 기본 정보(생성자 닉네임, 번들 제목 등)를 조회할 수 있어야 함
- 비로그인 시 유저 상태 필드: `isCreator: false`, `isParticipant: false`, `myBundleCompleted: false`

**FE 상태 분기표 (1:1 링크):**

FE는 `hasParticipant`로 1:1 링크의 결과 존재 여부를 판단합니다.

| 상태                    | isCreator | isParticipant | hasParticipant | FE 동작                                                                                                                   |
| ----------------------- | --------- | ------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 비로그인                | false     | false         | any            | "로그인하고 대결 수락하기"                                                                                                |
| 생성자 대기 중          | true      | false         | false          | 초대장 카드 (bundleTitle, questionCount 표시) + "링크 다시 복사하기" + 선착순 안내                                        |
| 생성자 결과 확인        | true      | false         | true           | 개봉 컨셉 ("결과 봉인이 해제됐어요!") + "결과 개봉하기" CTA                                                               |
| 받는 사람 + 번들 미완료 | false     | false         | false          | "대결 수락하기" (번들 풀기로 이동)                                                                                        |
| 받는 사람 + 번들 완료   | false     | false         | false          | "결과 확인하기" (자동 join 후 결과)                                                                                       |
| 참여자 결과 확인        | false     | true          | true           | "비교 결과 보기"                                                                                                          |
| **선점당한 링크**       | **false** | **false**     | **true**       | **메인 안내: "직접 비교 링크를 만들어 보내보세요!" + CTA 분기 (myBundleCompleted → 링크 생성 모달 / 미완료 → 번들 풀기)** |

**GROUP 링크 — `/compare/[token]` 랜딩 페이지를 거치지 않음:**

그룹 링크의 공유 URL은 `/compare/group/{token}`으로 직접 발급됩니다. 따라서 GROUP 링크는 `/compare/[token]` 랜딩 페이지를 경유하지 않으며, 모든 유저 상태(비로그인, 번들 미완료, 비멤버, 멤버)를 `/compare/group/{token}` 그룹 결과 페이지에서 직접 처리합니다.

**FE 상태 분기표 (GROUP 링크 — 그룹 결과 페이지 `/compare/group/{token}`):**

| 상태                 | isMember | memberCount | FE 동작                                                                             |
| -------------------- | -------- | ----------- | ----------------------------------------------------------------------------------- |
| 0명 (엣지케이스)     | any      | 0           | "아직 참여한 멤버가 없어요" + 초대 링크 복사 버튼                                   |
| 1명 (프리뷰)         | true     | 1           | 가상 멤버 3명 주입, 미리보기 배너 표시, FloatingCta "초대 링크 복사하기"            |
| 2명 이상 (정상)      | true     | ≥ 2         | 정상 결과 표시, FloatingCta "1:1 비교하기" + "새 그룹 만들기"                       |
| 비멤버 + 비로그인    | false    | any         | 결과 보기 가능, FloatingCta "나도 참여하기" → 로그인 유도                           |
| 비멤버 + 번들 미완료 | false    | any         | 결과 보기 가능, FloatingCta "나도 참여하기" → 번들 풀기 이동                        |
| 비멤버 + 번들 완료   | false    | any         | 결과 보기 가능, FloatingCta "나도 참여하기" → displayName + 프로필 색상 모달 → join |

---

### 7. 비교 링크 참여

| 항목      | 내용                                     |
| --------- | ---------------------------------------- |
| Method    | `POST`                                   |
| URL       | `/api/v1/compare-links/{token}/join`     |
| 인증      | 로그인 필수                              |
| 호출 시점 | 번들 완료 유저가 비교 링크 랜딩에서 참여 |

**Request Body:**

```typescript
{
  displayName?: string; // (GROUP 전용) 그룹 내 표시 이름. 미입력 시 현재 닉네임 사용. 최대 20자. 특수문자 제한 없음.
}
```

- `ONE_TO_ONE` 타입: body 없이 빈 POST (기존대로)
- `GROUP` 타입: `displayName` 필드 포함 가능 (optional)

**Response `data`:**

```typescript
{
  joined: boolean; // true (성공 시)
}
```

**BE 처리 사항:**

- **1:1 링크**: 최초 1명만 참여 가능 (이미 다른 사람이 참여했으면 `BAD_REQUEST`)
- **GROUP 링크**: 여러 명 참여 가능 (최대 50명), 마감된 그룹 참여 불가
  - `displayName`이 있으면 → 그룹 멤버 목록에 이 값을 `displayName`으로 저장
  - `displayName`이 없으면 → 해당 유저의 현재 닉네임을 `displayName`으로 저장
  - 이미 참여한 유저가 다시 요청하면 `success: true` (중복 참여 허용, 멱등성)
- 생성자 본인은 참여 불가 (`BAD_REQUEST`)
- 해당 번들을 완료한 유저만 참여 가능 (미완료 시 `BAD_REQUEST`)
- 참여 성공 시 링크 상태를 `COMPLETED`로 변경

---

### 8. 1:1 비교 결과 조회

| 항목      | 내용                                             |
| --------- | ------------------------------------------------ |
| Method    | `GET`                                            |
| URL       | `/api/v1/compare-links/{token}/result`           |
| 인증      | 로그인 필수                                      |
| 호출 시점 | 비교 결과 페이지 (`/compare/match/{token}`) 진입 |
| 캐싱      | FE에서 staleTime 0 (항상 최신 fetch)             |

**Response `data`:**

```typescript
{
  bundleSlug: string;
  bundleTitle: string;
  categoryCode: CategoryCode; // 카테고리 코드 (FE 테마 색상 적용용)
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

  // 각 질문별 실시간 투표 수 (대중 전체 기준)
  questionStats: Array<{
    electionId: string;
    title: string; // 질문 텍스트
    optionA: string; // 선택지 A 텍스트
    optionB: string; // 선택지 B 텍스트
    optionACount: number; // A 선택 투표 수
    optionBCount: number; // B 선택 투표 수
  }>;

  matchCount: number; // 같은 답 개수
  matchRate: number; // 일치율 0~100 (정수, matchCount/totalQuestions * 100)
}
```

**참고:**

- `me`/`target`은 **현재 로그인 유저 기준**으로 자동 배정 (생성자든 참여자든 자기가 "me")
- 링크 상태가 `COMPLETED`가 아니면 `404 NOT_FOUND`
- `questionStats`의 투표 수는 **실시간 변동**
- FE에서 비율 계산: optionACount / (optionACount + optionBCount) × 100

**FE에서 계산하는 항목 (서버에서 보내지 않음):**

- **커플 타입 (2×2 매트릭스):** 일치율(matchRate 50% 기준)과 대중성 평균(55% 기준)으로 4가지 유형 분류
  - 트렌드 쌍둥이 (일치↑ + 대중↑), 우리만의 세계 (일치↑ + 대중↓), 건강한 긴장감 (일치↓ + 대중↑), 평행우주 탐험가 (일치↓ + 대중↓)
- 대중성 지수: 각 질문에서 내 선택지의 득표율 평균 → 개인 캐릭터(사자왕/여우/판다/고양이/유니콘) 매핑
- 충격 포인트: 둘이 다른 답 중 대중 투표 비율 차이가 가장 큰 질문 선별
- "같은 편/갈린 순간" 스토리텔링: 일치/불일치 답변 분류 + 각 질문별 대중 투표율 표시

---

## Phase 3 API (그룹 비교)

### 9. 그룹 비교 결과 조회

| 항목      | 내용                                             |
| --------- | ------------------------------------------------ |
| Method    | `GET`                                            |
| URL       | `/api/v1/compare-links/{token}/group-result`     |
| 인증      | 로그인 필수                                      |
| 호출 시점 | 그룹 결과 페이지 (`/compare/group/{token}`) 진입 |
| 캐싱      | FE에서 staleTime 0 (항상 최신 fetch)             |

**Response `data`:**

```typescript
{
  bundleSlug: string;
  bundleTitle: string;
  totalQuestions: number;
  groupName: string;
  memberCount: number;

  /** 현재 로그인 유저의 userId (멤버 배열 내 매칭용) */
  myUserId: string;

  /** 번들 카테고리 코드 (FE 테마 색상 적용용) */
  categoryCode: CategoryCode; // 'LOVE' | 'MARRIAGE' | 'FINANCE' | 'WORK' | 'SPORTS' | 'FOOD' | 'GAME' | 'CAR' | 'HEALTH' | 'TREND'

  /** 이성 콘텐츠(이성궁합 랭킹, 성별 대결) 표시 여부 — 그룹 생성자가 설정 */
  showGenderContent: boolean;

  /** 그룹 생성자 userId — FE에서 설정 권한 판별에 사용 */
  creatorUserId: string;

  /** 그룹 멤버 답변 */
  members: Array<{
    userId: string;
    nickname: string;
    /** 그룹 참여 시 설정한 표시 이름. 없으면 nickname과 동일 */
    displayName?: string;
    /** 성별 (이성궁합/성별대결용, 없으면 해당 섹션에서 제외) */
    gender?: 'MALE' | 'FEMALE';
    answers: Array<{ electionId: string; selected: 'A' | 'B' }>;
  }>;

  /** 각 질문별 대중 투표 비율 (번들 전체 참여자 기준, 비율 단위) */
  questionStats: Array<{
    electionId: string;
    title: string;
    optionA: string;
    optionB: string;
    optionARate: number; // A 선택 비율 (0~100 정수)
    optionBRate: number; // B 선택 비율 (0~100 정수, = 100 - optionARate)
    totalVotes: number; // 전체 참여자 투표 수
  }>;

  /** 그룹 싱크율 (모든 멤버 쌍 일치율 평균, 0~100 정수) */
  groupSyncRate: number;
}
```

**참고:**

- `myUserId`는 현재 로그인 유저의 userId. FE에서 "나" 식별에 사용 (12시 방향 배치, "나" 뱃지 표시 등)
- `showGenderContent`가 `true`이면 이성궁합/성별대결 섹션 표시 (기존 `categoryCode` 기반 조건 대체)
- `creatorUserId`: FE에서 그룹 설정 모달의 편집 권한 판별에 사용 (생성자만 수정 가능, 참여자는 읽기 전용)
- `members.displayName`: 그룹 참여 시 입력한 표시 이름. FE에서 `displayName ?? nickname` 로직으로 우선 사용
- `members.gender`: 이성궁합 랭킹, 성별 대결에 사용
- `questionStats`는 **비율(Rate) 기반** 응답. 1:1 비교(Phase 2)의 `optionACount`/`optionBCount`와 다름
- `groupSyncRate`는 서버에서 계산 (모든 멤버 쌍의 답변 일치율 평균)
- 링크 타입이 `GROUP`이 아니면 `404 NOT_FOUND`
- 참여 인원이 1명 미만(0명)이면 `400 BAD_REQUEST` (결과를 생성할 수 없음)
- 1명일 때 서버는 정상 응답. FE에서 가상 멤버 3명을 주입하여 프리뷰 모드로 표시

**FE에서 계산하는 항목 (서버에서 보내지 않음):**

- **멤버 쌍 케미 (PairChemistry)**: 모든 C(n,2) 쌍에 대한 일치율, 등급(S/A/B/C/D)
- **케미 등급 기준**: 80%+ → S, 60~79% → A, 40~59% → B, 20~39% → C, ~19% → D
- **케미 네트워크 그래프**: 멤버 ≤15명이면 원형 네트워크 시각화, 16명 이상이면 케미 랭킹(등급별 아코디언 스택 UI)으로 전환
- **케미 랭킹 (16명 이상)**: 기준 멤버별 평균 궁합 + 등급 분포 바 + S/A/B/C/D 등급별 겹침 아바타 스택 → 탭 시 가로 스크롤 칩 펼침. 기준이 "나"일 때 칩 탭으로 1:1 비교 이동 (Phase 4 API 13번 사용)
- **그룹 어워드 6종**:
  - GROUP_LEADER: 평균 일치율이 가장 높은 멤버 (그룹의 중심)
  - GROUP_OUTSIDER: 평균 일치율이 가장 낮은 멤버 (그룹의 아웃사이더)
  - SOUL_CONNECTION: 일치율이 가장 높은 멤버 쌍
  - POLAR_OPPOSITES: 일치율이 가장 낮은 멤버 쌍
  - CONTROVERSY_MAKER: 그룹 내 소수 의견을 가장 많이 선택한 멤버 (동점자 복수 수상)
  - PEOPLES_CHAMPION: 대중성 지수(핫픽 전체 유저 대비 다수 의견 비율)가 가장 높은 멤버 (동점자 복수 수상)
- **대중성 스펙트럼**: 멤버별 대중성 점수 (답변 선택지의 대중 투표 비율 평균) → 등급(S/A/B/C/D) 매핑
- **논쟁 포인트**: 그룹 내 A/B 선택이 50:50에 가장 가까운 질문들 + 각 편 멤버 목록
- **Pick-a-Side**: 질문별 A/B 선택 멤버 진영 표시
- **이성궁합 랭킹** (LOVE/MARRIAGE 카테고리만): 남녀 쌍 중 일치율 TOP 3 / WORST 3
- **성별 대결** (LOVE/MARRIAGE 카테고리만): 질문별 남녀 선택 비율 차이 (성별 갭)
- ~~**관계 탐색기**~~ → 삭제됨 (그룹 내 1:1 비교 바로가기(Phase 4 API 13번)로 대체)

---

### 10. 그룹 설정 변경

| 항목      | 내용                                             |
| --------- | ------------------------------------------------ |
| Method    | `PATCH`                                          |
| URL       | `/api/v1/compare-links/{token}/settings`         |
| 인증      | 로그인 필수                                      |
| 호출 시점 | 그룹 결과 페이지에서 설정 아이콘 → 저장하기 클릭 |

**Request Body:**

```typescript
{
  groupName?: string;            // 새 그룹 이름 (1~20자, <>"'& 금지)
  showGenderContent?: boolean;   // 이성 콘텐츠 표시 여부
}
```

**Response `data`:** `null` (성공 시 별도 데이터 없음)

**BE 처리 사항:**

- 그룹 생성자만 변경 가능 (비생성자 → `403 FORBIDDEN`)
- GROUP 타입 링크만 대상 (ONE_TO_ONE → `404 NOT_FOUND`)
- 각 필드가 전송된 경우에만 해당 값 업데이트 (partial update)
- `groupName` 유효성 검사: 1~20자, `<>"'&` 문자 금지
- 변경 후 즉시 반영 (캐시 무효화는 FE에서 처리)

**참고 (기존 API 변경):**

- 기존 `PATCH /api/v1/compare-links/{token}/group-name` → 이 API로 통합
- `groupName`만 변경하던 것에서 `showGenderContent` 토글도 함께 변경 가능하도록 확장

---

### 11. 그룹 마감

| 항목      | 내용                                  |
| --------- | ------------------------------------- |
| Method    | `PATCH`                               |
| URL       | `/api/v1/compare-links/{token}/close` |
| 인증      | 로그인 필수                           |
| 호출 시점 | 그룹 생성자가 마감 버튼 클릭          |

**Request Body:** 없음

**Response `data`:**

```typescript
{
  closed: boolean; // true (마감 성공)
}
```

**BE 처리 사항:**

- 그룹 생성자만 마감 가능 (비생성자 → `403 FORBIDDEN`)
- GROUP 타입 링크만 대상 (ONE_TO_ONE → `404 NOT_FOUND`)
- 마감 후 새 멤버 참여 불가 (join 시 `BAD_REQUEST`)
- 기존 멤버의 결과 조회는 계속 가능

---

### 12. 그룹 재오픈

| 항목      | 내용                                      |
| --------- | ----------------------------------------- |
| Method    | `PATCH`                                   |
| URL       | `/api/v1/compare-links/{token}/reopen`    |
| 인증      | 로그인 필수                               |
| 호출 시점 | 마감된 그룹에서 생성자가 재오픈 버튼 클릭 |

**Request Body:** 없음

**Response `data`:**

```typescript
{
  closed: boolean; // false (재오픈 성공)
}
```

**BE 처리 사항:**

- 그룹 생성자만 재오픈 가능 (비생성자 → `403 FORBIDDEN`)
- GROUP 타입 링크만 대상 (ONE_TO_ONE → `404 NOT_FOUND`)
- 재오픈 후 새 멤버 참여 다시 가능

---

## Phase 3 FE 변경 사항 (API 무관, 참고용)

### URL 구조 변경

| 변경 전                   | 변경 후                  | 비고           |
| ------------------------- | ------------------------ | -------------- |
| `/compare/{token}/result` | `/compare/match/{token}` | 1:1 비교 결과  |
| `/compare/{token}/group`  | `/compare/group/{token}` | 그룹 비교 결과 |

### 케미 등급 기준 변경

| 등급 | 변경 전  | 변경 후  | 타이틀              |
| ---- | -------- | -------- | ------------------- |
| S    | 90% 이상 | 80% 이상 | 말 안 해도 통하는   |
| A    | 70~89%   | 60~79%   | 꽤 잘 맞는          |
| B    | 50~69%   | 40~59%   | 같을 때도 다를 때도 |
| C    | 30~49%   | 20~39%   | 각자의 세계         |
| D    | ~29%     | ~19%     | 정반대의 가치관     |

### `categoryCode` 필드 공통 안내

FE에서 카테고리별 액센트 컬러 테마를 적용합니다. 다음 API 응답에 `categoryCode` 필드가 필수로 포함되어야 합니다:

| API               | 엔드포인트                                | `categoryCode` |
| ----------------- | ----------------------------------------- | -------------- |
| 1. 번들 상세      | `GET /bundles/{slug}`                     | **필수**       |
| 4. 내 결과        | `GET /bundles/{slug}/my-result`           | **필수**       |
| 6. 비교 링크 정보 | `GET /compare-links/{token}`              | **필수**       |
| 8. 1:1 비교 결과  | `GET /compare-links/{token}/result`       | **필수**       |
| 9. 그룹 비교 결과 | `GET /compare-links/{token}/group-result` | **필수**       |

**`CategoryCode` 코드 목록:**

```
'LOVE' | 'MARRIAGE' | 'FINANCE' | 'WORK' | 'SPORTS' | 'FOOD' | 'GAME' | 'CAR' | 'HEALTH' | 'TREND'
```

**용도:**

- FE 카테고리별 액센트 컬러 테마 (배경 orb, CTA 버튼, 카드 테두리, 배지 색상 등)
- 그룹 생성 시 `showGenderContent` 기본값 결정: `LOVE`/`MARRIAGE` → `true`, 나머지 → `false`
- 이성 콘텐츠 표시 여부는 `categoryCode`가 아닌 `showGenderContent` 플래그로 제어 (Phase 3.1에서 변경)

---

## Phase 4 API (그룹 내 1:1 비교 바로가기)

### 13. 그룹 내 1:1 비교 링크 즉시 생성

| 항목      | 내용                                                |
| --------- | --------------------------------------------------- |
| Method    | `POST`                                              |
| URL       | `/api/v1/compare-links/{groupToken}/pair`           |
| 인증      | 로그인 필수                                         |
| 호출 시점 | 그룹 결과에서 특정 멤버 탭 → "1:1 비교하기" 클릭 시 |

**Request Body:**

```typescript
{
  targetUserId: string; // 비교 대상 멤버의 userId
}
```

**Response `data`:**

```typescript
{
  token: string; // 1:1 비교 결과를 볼 수 있는 compare token
}
```

**BE 처리 사항:**

- 요청자와 targetUserId 모두 해당 그룹의 멤버여야 함 (미참여 시 `BAD_REQUEST`)
- 요청자와 targetUserId가 동일하면 `BAD_REQUEST`
- 둘 다 이미 번들을 완료한 상태이므로, 즉시 `COMPLETED` 상태의 1:1 비교 링크 생성
- 기존 8번 API (`/result`)와 동일한 형식으로 결과 조회 가능
- **동일 쌍에 대한 중복 요청 시**: 기존 토큰 재사용 (A→B, B→A 모두 같은 토큰)
  - 이유: 그룹 결과에서 반복 탭할 때마다 토큰이 쌓이는 것 방지
- 기존 1:1 비교 링크와 동일한 토큰 형식, 동일한 결과 조회 API 사용

**FE 사용 흐름:**

1. 그룹 결과 케미 네트워크에서 멤버 탭 → 하단 패널 "1:1 비교하기" 클릭
2. `POST /api/v1/compare-links/{groupToken}/pair` 호출
3. 응답 `token`으로 `/compare/match/{token}` 페이지로 이동
4. 기존 1:1 비교 결과 페이지가 그대로 표시됨

---

## 미구현 예정 API (참고용)

| Method | Endpoint                                  | 설명                               | 상태   |
| ------ | ----------------------------------------- | ---------------------------------- | ------ |
| GET    | `/api/v1/bundles`                         | 번들 목록 (사이트맵 + 메인 피드용) | 미구현 |
| GET    | `/api/v1/bundles/{slug}/my-compare-links` | 내 비교 링크 목록                  | 미구현 |

### 번들 목록 API 참고 사항

**용도:**

- 사이트맵 동적 생성 (현재 slug 하드코딩 중: `sitemap.ts`)
- 메인 피드에서 번들 카드 표시 시 `completed` 상태 반영 (현재 `participated: false` 하드코딩)

**예상 Response `data`:**

```typescript
Array<{
  bundleId: number;
  slug: string;
  title: string;
  category: string;
  categoryCode: CategoryCode;
  questionCount: number;
  status: 'ACTIVE' | 'CLOSED';
  imageUrl?: string;
  participantCount: number;
  completed: boolean; // 로그인 유저의 완료 여부 (비로그인 시 false)
}>;
```
