# H3 "테토/에겐" (ask) API 스펙

> 작성일: 2026-04-26
> 상태: BE 구현 요청
> 관련 디자인 스펙: [docs/superpowers/specs/2026-04-26-h3-friend-evaluation-design.md](../superpowers/specs/2026-04-26-h3-friend-evaluation-design.md)
> 관련 전략: [docs/strategy/2026-04-25-h3-friend-evaluation.md](../strategy/2026-04-25-h3-friend-evaluation.md)
> 출시 목표: 2026-05-13

---

## 개요

H3 검증 사이클 1차 콘텐츠. 사용자가 자기 자신을 테토/에겐 중 하나로 평가하고, 친구들에게 링크를 공유해 친구가 본 자신의 모습을 받는 기능. **기존 `bundle` 도메인과 완전 분리한 신규 도메인** 으로 구현.

```
1차 공유자 (링크 소유자)
  /ask/teto-egen 진입
    → 카카오 로그인 강제
    → POST /api/v1/ask/teto-egen/links  (본인 링크 생성)
    → GET  /api/v1/ask/teto-egen/links/me  (본인 결과 + 친구 평가 집계)

2차 공유자 (친구)
  /ask/teto-egen/friend/{token} 진입
    → 카카오 로그인 강제
    → GET  /api/v1/ask/teto-egen/friend/{token}  (진입 메타)
    → POST /api/v1/ask/teto-egen/friend/{token}/vote  (친구 평가 제출)
```

---

## 정책 (코드에 반영 필요)

1. **1주제 1링크**: 한 사용자(`owner_user_id`)는 한 주제(`teto-egen`)에 평생 링크 1개만. 두 번째 생성 시도는 409로 차단.
2. **링크 생성 후 변경 불가**: `display_name`, `self_answer`, `self_prediction` 모두 수정 API 없음. 디자인에서도 사전 안내.
3. **자기 토큰 친구 평가 차단**: `voter_user_id == link.owner_user_id` 면 친구 평가 불가.
4. **1링크 1유저 중복 참여 차단**: 같은 사용자가 같은 링크에 두 번째 참여 불가.
5. **공유 링크로만 진입**: `friend/{token}` 엔드포인트는 토큰 알아야 접근. 토큰 추측 가능성 낮추기 위해 짧은 슬러그 + 충분한 엔트로피.

---

## 데이터 모델

### `ask_teto_egen_links`

| 컬럼              | 타입        | 제약                  | 설명                                                                                     |
| ----------------- | ----------- | --------------------- | ---------------------------------------------------------------------------------------- |
| `id`              | bigint      | PK                    |                                                                                          |
| `owner_user_id`   | bigint      | FK(user.id), NOT NULL | 링크 소유자                                                                              |
| `topic`           | varchar(64) | NOT NULL              | 향후 다른 주제 확장 대비                                                                 |
| `token`           | varchar(32) | UNIQUE, NOT NULL      | 공유 URL의 `{token}` 부분                                                                |
| `display_name`    | varchar(20) | NOT NULL              | 친구에게 보일 이름 (디폴트=닉네임)                                                       |
| `self_answer`     | enum        | NOT NULL              | `'TETO' \| 'EGEN'` (사용자 본인이 자신을 어떻게 보는지)                                  |
| `self_prediction` | enum        | NOT NULL              | `'TETO' \| 'EGEN'` (사용자가 예상한 친구들의 시선 — "친구들은 나를 어떻게 볼 것 같은지") |
| `created_at`      | timestamp   | NOT NULL              |                                                                                          |

**제약**:

- `UNIQUE(owner_user_id, topic)` ← 1주제 1링크 정책

### `ask_teto_egen_votes`

| 컬럼            | 타입      | 제약                       | 설명               |
| --------------- | --------- | -------------------------- | ------------------ |
| `id`            | bigint    | PK                         |                    |
| `link_id`       | bigint    | FK(ask_teto_egen_links.id) |                    |
| `voter_user_id` | bigint    | FK(user.id), NOT NULL      | 친구               |
| `vote`          | enum      | NOT NULL                   | `'TETO' \| 'EGEN'` |
| `voted_at`      | timestamp | NOT NULL                   |                    |

**제약**:

- `UNIQUE(link_id, voter_user_id)` ← 중복 참여 차단

---

## 1. 랜딩 카운트

| 항목      | 내용                                                             |
| --------- | ---------------------------------------------------------------- |
| Method    | `GET`                                                            |
| URL       | `/api/v1/ask/teto-egen/count`                                    |
| 인증      | 비로그인 OK                                                      |
| 호출 시점 | `/ask/teto-egen` 랜딩 진입 시                                    |
| 캐싱      | BE 60초 메모리 캐시 권장..? (실시간 부하 회피) -> FE 쿼리 캐싱도 |

**Response `data`:**

```typescript
{
  count: number; // 누적 참여자 수 (링크 생성자 + 친구 평가자, 중복 제거된 unique user 수)
}
```

**FE 표시**: 랜딩의 "{count.toLocaleString()}명 참여" 카피.

---

## 2. 본인 링크 생성

| 항목      | 내용                                             |
| --------- | ------------------------------------------------ |
| Method    | `POST`                                           |
| URL       | `/api/v1/ask/teto-egen/links`                    |
| 인증      | 로그인 필수                                      |
| 호출 시점 | 1차 공유자가 자기 평가 마치고 [링크 생성하기] 탭 |
| 캐싱      | 없음                                             |

**Request body:**

```typescript
{
  displayName: string; // 1~12자, trim 후 필수
  selfAnswer: 'TETO' | 'EGEN'; // 사용자 본인이 자신을 보는 답
  selfPrediction: 'TETO' | 'EGEN'; // 사용자가 예상한 친구들 시선 (UI에서는 "친구들도 ㅇㅇ라고 생각할까?" → 그렇다=같은 값, 아니다=반대 값으로 FE에서 변환)
}
```

**Response 201 `data`:**

```typescript
{
  token: string; // 공유 URL에 들어가는 토큰
  shareUrl: string; // 완성된 공유 URL (FE 편의)
}
```

**Response 409 (중복 생성):**

```typescript
{
  code: 'LINK_ALREADY_EXISTS';
  data: {
    token: string; // 이미 있는 본인 토큰 그대로 반환
    shareUrl: string;
  }
}
```

**Response 400 (validation):** `displayName` 길이 위반·빈 문자열·잘못된 enum 값.

**FE 처리:**

- 201 → S4 화면 (링크 생성 직후) 진입
- 409 → 모달 "이미 링크가 존재합니다 / 확인(새로고침)" → 새로고침 시 본인 결과 화면으로 자동 진입
- 그 외 → 모달 "일시적인 에러가 발생했습니다 / 확인(새로고침)"

---

## 3. 본인 링크 + 결과 조회

| 항목      | 내용                                                                 |
| --------- | -------------------------------------------------------------------- |
| Method    | `GET`                                                                |
| URL       | `/api/v1/ask/teto-egen/links/me`                                     |
| 인증      | 로그인 필수                                                          |
| 호출 시점 | `/ask/teto-egen/my` 진입 시 (직접 진입 + 친구 평가 갱신용 폴링 가능) |
| 캐싱      | FE staleTime 30초                                                    |

**Response 200 `data`:**

```typescript
{
  token: string;
  shareUrl: string;
  displayName: string;
  selfAnswer: 'TETO' | 'EGEN';
  selfPrediction: 'TETO' | 'EGEN';
  friendVotes: {
    total: number; // 친구 평가 총 수
    tetoCount: number;
    egenCount: number;
    voters: Array<{
      // 친구 명단 (Layer 2 펼침용)
      userId: string;
      displayName: string; // 카카오 닉네임 (또는 후속 displayName)
      vote: 'TETO' | 'EGEN';
      votedAt: string; // ISO 8601
    }>;
  }
}
```

**FE 처리:**

- null 응답 → 아직 본인 링크를 만들지 않음
- `friendVotes.total === 0` → S5-엠프티 ("아직 친구가 평가하지 않았어요")
- `friendVotes.total >= 1` → S5 토스 톤 결과 화면
  - 다수파 계산: `tetoCount > egenCount ? 'TETO' : 'EGEN'` (동률은 사용자 자기 답과 일치 시 적중 처리 권장 — 결정 필요)
  - 적중 판정: `selfAnswer === 다수파` 면 적중 + 👏, 아니면 의외 + 🎯
  - 큰 숫자 표시: `Math.round((max(tetoCount, egenCount) / total) * 100)%`

---

## 4. 친구 평가 진입 메타

| 항목      | 내용                                                         |
| --------- | ------------------------------------------------------------ |
| Method    | `GET`                                                        |
| URL       | `/api/v1/ask/teto-egen/friend/{token}`                       |
| 인증      | 비로그인 OK (랜딩만 보여주기 위함, 평가 제출 시 로그인 강제) |
| 호출 시점 | `/ask/teto-egen/friend/{token}` 진입 시                      |
| 캐싱      | FE staleTime 60초                                            |

**Response 200 `data`:**

```typescript
{
  token: string;
  displayName: string; // "{이름}님은 테토인가요?" 카피용
  isOwn: boolean; // 자신의 투표인지 확인
}
```

**보안 메모:**

- 사용자가 자기 링크 클릭 시 평가 화면은 보이지만 제출 시 모달 차단.
- 또는 isOwn 활용해서 자신의 투표시 비활성화? or FE 에서 차단
- `selfAnswer`/`selfPrediction`은 절대 응답에 포함 금지 — 친구가 보기 전에 정답 노출되면 안 됨.

**Response 404:** 토큰 없음 (잘못된 링크 / 폐기된 링크). FE는 "링크가 더 이상 유효하지 않아요" 안내.

---

## 5. 친구 평가 제출

| 항목      | 내용                                                  |
| --------- | ----------------------------------------------------- |
| Method    | `POST`                                                |
| URL       | `/api/v1/ask/teto-egen/friend/{token}/vote`           |
| 인증      | 로그인 필수                                           |
| 호출 시점 | 2차 공유자가 [테토] / [에겐] 선택 후 (로그인 후 제출) |
| 캐싱      | 없음                                                  |

**Request body:**

```typescript
{
  vote: 'TETO' | 'EGEN';
}
```

**Response 201 `data`:**

```typescript
{
  myVote: 'TETO' | 'EGEN';
  ownerDisplayName: string;
  friendVotes: {
    // 결과 화면용 집계 (3번 응답과 동일 구조)
    total: number;
    tetoCount: number;
    egenCount: number;
    voters: Array<{
      userId: string;
      displayName: string;
      vote: 'TETO' | 'EGEN';
      votedAt: string;
    }>;
  }
}
```

**Response 403 (자기 토큰):**

```typescript
{
  code: 'CANNOT_VOTE_SELF';
}
```

**Response 409 (중복 참여):**

```typescript
{
  code: 'ALREADY_VOTED';
  data: {
    // 이미 한 답을 보여줄 수 있도록
    myVote: 'TETO' | 'EGEN';
  }
}
```

**Response 400 (validation):** 잘못된 enum 값.

**FE 처리:**

- 201 → F1 결과 화면 (즉시 결과 공개, 본인 답 칩에 [내 선택] 라벨)
- 403 → 모달 "자신에게 투표할 수 없습니다"
- 409 → 모달 "이미 참여했습니다 / 확인(새로고침)" → 새로고침 시 같은 링크 다시 진입 (이전 답으로 결과 화면 표시 가능)
- 그 외 → 모달 "일시적인 에러가 발생했습니다 / 확인(새로고침)"

---

## 인증·세션

- 모든 보호된 엔드포인트는 **카카오 로그인 세션** 기반. 기존 `login-api-spec.md` 패턴 그대로.
- 로그인 안 된 상태로 보호 엔드포인트 호출 시 401 응답. FE는 LoginModal 노출.

---

## 결정 필요 (BE 동료에게)

1. **`token` 길이/포맷**: 짧은 슬러그(8-12자) vs UUID? 결의 추천: 짧은 영숫자 슬러그(예: `nanoid(10)`) — 공유 시 짧고 외우기 쉬움.
2. **카운트 정의**: 1번 카운트는 (a) 링크 생성자 + 친구 평가자 unique 합 "참여" 의미를 가장 넓게.

---

## FE-BE 인수인계 체크리스트

- [ ] 데이터 모델 마이그레이션 작성
- [ ] 5개 엔드포인트 구현
- [ ] FE에서 MSW mock 작성 (BE 구현 전 병렬 개발용)
- [ ] BE 배포 후 FE generated 타입 갱신 (`pnpm orval` 또는 동등 명령)
- [ ] FE에서 mock → 실제 API 전환
- [ ] QA: 정책 5개 (1주제 1링크 / 변경 불가 / 자기 토큰 차단 / 중복 참여 차단 / 공유로만 진입) 각각 검증
