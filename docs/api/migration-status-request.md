# 익명 활동 마이그레이션 상태 조회 — API 신규 요청

> 작성: 2026-05-05 / 작성자: FE 웅일

## 1. 배경 (Why)

현재 회원가입 마지막 단계에서 "이전 활동을 연결할까요?" 마이그레이션 prompt가
노출되는데, 이게 **TKUID 단순 존재**(`localStorage.hp_tkuid`)를 기준으로 분기됩니다.

문제는 `getTKUID()`가 디스플레이 조회(메인 피드, 검색, 핫픽 상세, 댓글 목록 등)
시점에도 자동 생성되기 때문에, **실제로는 투표/좋아요/댓글을 한 번도 한 적이
없는 브라우저에서도 prompt가 항상 뜬다**는 거예요. 새 사용자가 가입할 때
"이전 활동? 난 처음인데?" 하고 헷갈리는 케이스가 발생합니다.

FE에서 로컬 플래그(`hp_has_activity`)로 임시 처리하는 방안도 고려했지만, 다음
이유로 채택하지 않았습니다:

- **다중 디바이스/브라우저 분리** — 같은 TKUID여도 한 쪽 활동이 다른 쪽에 안 보임
- **시크릿 모드/캐시 청소 시 손실**
- **로컬 ↔ 서버 상태 불일치 가능성** (예: TKUID에 묶인 BE 데이터는 있는데 로컬
  플래그는 없는 케이스 — 새 디바이스에서 로그인 직전 가입할 때)

**서버가 "TKUID에 묶인 마이그레이션 가능한 데이터가 실제로 있는가"의 단일
진실 원천(SoT)이어야 합니다.** 본 BE 작업이 완료되기 전까지는 현재의
`hasTKUID()` 체크가 유지되어 false positive(활동 없는 사용자에게도 prompt 노출)
가 계속 발생합니다.

## 2. 신규 API

### `GET /api/v1/auth/migration-status`

| 항목   | 값                                                                               |
| ------ | -------------------------------------------------------------------------------- |
| 인증   | 불필요 — 다른 TKUID write 엔드포인트(vote/like/comment)와 동일한 권한 모델       |
| Header | `x-tku-id: {tkuid}` — 클라이언트의 현재 TKUID. 없거나 빈 문자열이면 `false` 반환 |
| Body   | 없음                                                                             |
| 호출   | FE는 SignupForm 마운트 시 prefetch 또는 onSubmit 직전에 호출                     |

**Response 200 OK**

```typescript
{
  data: {
    hasMigratableData: boolean;  // 핵심 — 이거 하나로 prompt 분기
    // 선택: 좀 더 풍부한 prompt UI 위해 (BE 부담 적으면)
    voteCount?: number;          // 익명 투표 수
    likeCount?: number;          // 익명 좋아요 수
    commentCount?: number;       // 익명 댓글 수 (답글 포함)
  },
  status: 200,
  message: 'OK'
}
```

**`hasMigratableData = true` 조건 (제안)**

- TKUID와 연결된 익명 데이터가 1개 이상 존재 (vote / like / comment / reply 어느
  쪽이라도)
- 이 정의는 BE 동료가 익명 데이터 모델을 가장 잘 알고 있으니 자유롭게 조정 가능

**Error**

- `200 OK + hasMigratableData: false` — TKUID 헤더가 비어있거나, 매칭되는 익명
  데이터 없음 (4xx 대신 정상 응답으로 통일 — FE 분기 단순화)
- 권한 거부 케이스 자체가 없음 — 응답 데이터가 본인 TKUID 활동 여부에 한정되므로
  타인의 TKUID로 조회하더라도 정보 누출 위험이 미미함 (TKUID는 UUID라 enumeration도
  비현실적)

## 3. FE 개발 스펙

### 3-1. 신규 훅 — `useMigrationStatus`

`src/hooks/api/useAuthApi.ts`에 추가:

```ts
export const useMigrationStatus = (enabled: boolean) =>
  useQuery({
    queryKey: ['auth', 'migrationStatus'],
    queryFn: async () => {
      const tkuId = getTKUID({ readOnly: true }); // 자동 생성 X
      const res = await getMigrationStatus({
        headers: tkuId ? { 'x-tku-id': tkuId } : undefined,
      });
      return res; // { hasMigratableData, voteCount?, likeCount?, commentCount? }
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 가입 세션 동안 유효
    retry: 1,
  });
```

> `getTKUID({ readOnly: true })` 옵션은 FE에서 추가 예정. 현재 `getTKUID()`는
> 호출 시 자동 생성하기 때문에, "조회 전용" 모드를 추가해 활동 없는 사용자에게
> 새 TKUID가 생성되지 않도록 함 (BE 호출 결과의 정확도 향상).

### 3-2. SignupForm 통합

현재 `hasTKUID()` 로컬 체크를 `useMigrationStatus`로 대체:

```tsx
const { data: migrationStatus, isFetched } = useMigrationStatus(isAuthorized);

const onSubmit = (data: SignupFormValues) => {
  if (nicknameChecked !== 'available') {
    setError('nickname', { message: '닉네임 중복확인을 해주세요' });
    setFocus('nickname');
    return;
  }

  // 마이그레이션 상태가 아직 로딩 중이면 보수적으로 prompt 노출 (false negative 방지)
  if (!isFetched) {
    setPendingFormData(data);
    setShowMigration(true);
    return;
  }

  if (migrationStatus?.hasMigratableData) {
    setPendingFormData(data);
    setShowMigration(true);
    return;
  }
  void doSignup(data);
};
```

또는 더 깔끔하게: 마운트 시 prefetch해 두고, onSubmit 시점엔 이미 도착 보장.

### 3-3. 영향 범위

- 신규 파일 0개 (orval 생성물 제외)
- 검색엔진 인덱싱 영향 없음 (가입 페이지는 noindex)
- 가입 latency: prefetch 패턴이면 사실상 0; 아니면 가입 onSubmit에 1-RTT 추가
  (BE 가벼운 count 쿼리라 < 100ms 예상)

## 4. 검증 시나리오

1. **활동 없는 새 브라우저** (TKUID 자동 생성됐지만 vote/like/comment 없음)
   - Response: `hasMigratableData: false`
   - 가입 시 prompt 미노출 → 바로 가입 진행

2. **익명 투표 1회 후 가입**
   - Response: `hasMigratableData: true`, `voteCount: 1`
   - prompt 노출 → 연결 시 vote 데이터 계정 이전

3. **TKUID 헤더 누락**
   - Response: `hasMigratableData: false` (200 OK)
   - 가입 시 prompt 미노출

4. **이미 다른 계정으로 마이그레이션된 TKUID**
   - 이 케이스가 BE에 어떻게 처리되는지 확인 필요 — TKUID 재사용 가능성?
   - 일반적으로 한 번 마이그레이션된 데이터는 더 이상 익명이 아니므로
     `hasMigratableData: false` 가 자연스러움

5. **TKUID 헤더 누락 (비정상 케이스)**
   - 200 OK + `hasMigratableData: false` 반환 → FE는 prompt 미노출 (안전한 default)

## 5. 출시 순서

1. **BE PR**: 본 endpoint 추가 + swagger.json 갱신
2. **FE follow-up PR**:
   - `npm run swagger && npm run orval` 갱신
   - `useMigrationStatus` 훅 추가
   - `getTKUID({ readOnly: true })` 옵션 추가
   - SignupForm의 `hasTKUID()` 분기를 `useMigrationStatus()` 응답 기반으로 교체
   - 검증 시나리오 1~5 수동 테스트

## 6. 미해결 결정 / Open questions

- **응답에 카운트(`voteCount` 등) 포함 여부** — `hasMigratableData`만으로 충분
  하지만, prompt 카피에 "투표 N개 / 좋아요 M개"를 노출하면 사용자가 더 명확하게
  결정할 수 있음. BE 부담이 크면 boolean만 내려도 OK
- **`hasMigratableData` 정의** — vote/like/comment 중 하나라도 있으면 true 가
  현재 안. BE가 더 나은 기준 알고 있으면 조정 가능
- **TKUID 재사용 정책** — 한 번 마이그레이션된 TKUID로 다시 호출 시 동작
  (현재 안: false 반환)

원하는 결정이 다르면 BE 작업 시 본 문서 업데이트해 주세요.
