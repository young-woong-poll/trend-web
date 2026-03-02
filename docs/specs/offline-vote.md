# 오프라인 투표 페이지 개발 방향성

## 1. 개요

오프라인 현장에서 태블릿PC를 들고 돌아다니며 사람들에게 투표를 받는 기능.
투표 데이터에 **장소(location)** 등의 메타데이터를 함께 전송하여, 어디서 수집된 투표인지 서버에서 추적 가능하도록 한다.

---

## 2. Server Meta 시스템 이해

### 2.1 핵심 개념

BE에서 **ServerMeta** 개념을 도입했다. (커밋 `6060755`)

- **ServerMeta**: 어드민이 사전에 생성하는 메타데이터 (장소, 시간대 등)
- 생성 시 **UUID(`id`)** 가 발급됨
- FE는 투표(vote) 시 이 `serverMetaId`를 함께 전송
- 서버가 투표 데이터와 메타를 매핑하여 저장

### 2.2 API 엔드포인트

| API | Method | 용도 |
|-----|--------|------|
| `/admin/api/v1/server-metas` | POST | ServerMeta 생성 (어드민) |
| `/admin/api/v1/server-metas` | GET | ServerMeta 목록 조회 (어드민) |
| `/admin/api/v1/server-metas/{id}` | GET/PUT/DELETE | ServerMeta 상세/수정/삭제 (어드민) |
| `/api/v1/server-metas/{id}` | GET | ServerMeta 조회 (공개) |
| `/api/v1/hotpicks/{slug}/votes` | POST | 투표 (serverMetaId 포함 가능) |

### 2.3 데이터 구조

```typescript
// 어드민이 생성하는 메타 (예시)
CreateServerMetaRequest {
  meta: {
    location: {
      code: "1168000000",        // 법정동코드 10자리
      sido: "서울특별시",
      sigungu: "강남구",
      eupmyeondong: ""           // 시군구 단위 선택 시 비어있음
    },
    from: "2026-03-01 10:00:00",
    to: "2026-03-01 18:00:00"
  }
}

// 생성 결과 → UUID 발급
CreateServerMetaResponse {
  id: "a1b2c3d4-e5f6-..." // 이 ID를 투표 시 사용
}

// 투표 요청 (확장된 CreateVoteRequest)
CreateVoteRequest {
  electionItemId: number       // 필수: 선택한 옵션
  serverMetaId?: string        // 선택: 서버 메타 UUID
  clientMeta?: JsonNode        // 선택: 클라이언트측 추가 메타
}
```

### 2.4 위치 데이터: 법정동코드 기반 주소 체계

장소 정보를 자유 텍스트("강남", "강남구" 등)로 입력하면 불일치가 발생한다.
이를 방지하기 위해 **대한민국 법정동코드** 표준 체계를 사용한다.

#### 법정동코드 10자리 구조

```
1  1  6  8  0  1  0  1  0  0
├──┤  ├─────┤  ├─────┤  ├──┤
시도   시군구    읍면동    리
(2)    (3)      (3)     (2)
```

| 코드 | 의미 |
|------|------|
| `1100000000` | 서울특별시 |
| `1168000000` | 서울특별시 강남구 |
| `1168010100` | 서울특별시 강남구 역삼동 |

#### 코드 기반의 장점

| 문제 | 코드 기반 해결 |
|------|---------------|
| "강남" vs "강남구" 불일치 | 코드 `1168000000`으로 통일 |
| "서울시" 통계에 "강남구" 포함? | SQL `WHERE code LIKE '11%'`로 서울 전체 조회 |
| 오타/축약어 | 드롭다운 선택이므로 입력 오류 없음 |
| 행정구역 변경 | 법정동코드는 행정안전부가 관리하며 이력 추적 가능 |

#### 법정동코드 조회 API (juso.dev)

어드민 페이지에서 장소를 설정할 때 [juso.dev](https://juso.dev/docs/reg-code-api/) API를 사용한다.
인증키 없이 무료로 사용 가능하며, 행정표준코드관리시스템 데이터를 매일 동기화한다.

```
GET https://grpc-proxy-server-mkvo6j4wsq-du.a.run.app/v1/regcodes?regcode_pattern={pattern}
```

| 조회 대상 | pattern | 설명 |
|----------|---------|------|
| 시도 목록 | `*00000000` | 서울, 부산, 대구, ... |
| 서울의 구 목록 | `11*00000` | 종로구, 중구, 강남구, ... |
| 강남구의 동 목록 | `1168*&is_ignore_zero=true` | 역삼동, 삼성동, ... |

#### 어드민 UI: 시도 → 시군구 → 읍면동 3단계 드롭다운

```
[시도 선택 ▼]  →  [시군구 선택 ▼]  →  [읍면동 선택 ▼] (선택)
 서울특별시         강남구              (전체)

→ 선택 결과:
  code: "1168000000"
  sido: "서울특별시"
  sigungu: "강남구"
```

- 시도 선택 → 해당 시도의 시군구 목록 로드
- 시군구 선택 → 해당 시군구의 읍면동 목록 로드 (선택 사항)
- 읍면동까지 선택하지 않아도 시군구 단위로 설정 가능

---

## 3. 오프라인 페이지 접근 제어

### 3.1 URL 기반 접근 제어

오프라인 투표 페이지는 **어드민이 발급한 `serverMetaId`가 쿼리파라미터로 있어야만 동작**하는 구조로 설계한다.

```
/offline-vote?slug=my-hotpick&serverMetaId=a1b2c3d4-e5f6-...
```

- `serverMetaId`가 없거나 유효하지 않으면 → 에러 화면
- 유효한 경우 → 투표 화면 진입

### 3.2 접근 흐름

```
[어드민 페이지]
  1. 장소 선택: 시도 → 시군구 드롭다운 (법정동코드 API 활용)
  2. ServerMeta 생성: { location: { code: "1168000000", sido: "서울특별시", sigungu: "강남구" } }
  3. UUID 발급: a1b2c3d4-...
  4. 투표 URL 생성: /offline-vote?slug=xxx&serverMetaId=a1b2c3d4-...
  5. QR 코드 또는 태블릿 브라우저에 직접 입력

[오프라인 태블릿]
  6. URL 접속 → serverMetaId 검증 (GET /api/v1/server-metas/{id})
  7. 유효하면 → 투표 화면 표시 (location 정보 상단에 배지로 표시, 예: "서울특별시 강남구")
  8. 투표 시 → vote API에 serverMetaId 함께 전송
```

### 3.3 보안 고려사항

- `serverMetaId`는 UUID이므로 추측이 어려움 (brute-force 방지)
- 어드민만 생성 가능 → URL을 모르면 접근 불가
- 추가로 `from`/`to` 시간대가 있으면 FE에서 유효 기간 체크 가능

---

## 4. FE 개발 방향

### 4.1 현재 상태 (1차 개발 완료)

- `/offline-vote` 페이지, PWA manifest, Fullscreen API 훅 구현 완료
- slug를 직접 입력하는 setup 화면 → preview → fullscreen 투표 흐름

### 4.2 변경 방향 (2차 개발)

**기존 setup 화면을 제거**하고, URL 쿼리파라미터 기반으로 자동 진입하는 방식으로 전환한다.

#### 페이지 진입 흐름 변경

```
기존: setup(slug 수동 입력) → ready → voting → result
변경: URL 파라미터 자동 파싱 → 검증 → ready → voting → result
```

#### URL 파라미터

| 파라미터 | 필수 | 설명 |
|---------|:----:|------|
| `slug` | O | 핫픽 slug |
| `serverMetaId` | O | 서버 메타 UUID |

#### 진입 시 처리

1. URL에서 `slug`, `serverMetaId` 추출
2. `GET /api/v1/server-metas/{serverMetaId}` 호출 → 유효성 검증
3. `GET /api/v1/hotpicks/{slug}` 호출 → 투표 데이터 로드
4. 두 API 모두 성공하면 → ready 화면 (location 배지 + 투표 미리보기)
5. 실패하면 → 에러 화면 (잘못된 링크 안내)

#### 투표 시 serverMetaId 전송

```typescript
// 변경 전
vote(slug, { electionItemId: optionId }, { headers: { 'x-tku-id': tkuId } })

// 변경 후
vote(slug, {
  electionItemId: optionId,
  serverMetaId: serverMetaId,   // 서버 메타 UUID 추가
}, { headers: { 'x-tku-id': tkuId } })
```

### 4.3 UI 변경사항

#### 에러 화면 (신규)

- 유효하지 않은 URL 접근 시 표시
- "유효하지 않은 투표 링크입니다" 메시지
- 어드민에게 문의하라는 안내

#### ready 화면 변경

- 상단에 **location 배지** 표시 (예: "서울특별시 강남구")
- `from`/`to`가 있으면 **유효 기간** 표시
- setup 화면 제거 → URL에서 자동 로드

#### 투표 화면 변경

- 상단 바에 location 표시 (예: "강남구", 시군구 단위로 축약)
- 나머지는 동일

### 4.4 파일 변경 계획

| 파일 | 변경 |
|------|------|
| `src/app/offline-vote/page.tsx` | searchParams에서 slug, serverMetaId 추출 |
| `src/components/features/OfflineVote/OfflineVotePage.tsx` | setup 제거, serverMeta 검증 로직 추가, vote에 serverMetaId 전송 |
| `src/components/features/OfflineVote/OfflineVotePage.module.scss` | location 배지, 에러 화면 스타일 추가 |

### 4.5 clientMeta 활용 (선택)

`CreateVoteRequest.clientMeta`를 통해 FE에서 추가 데이터를 보낼 수 있다.
현재 단계에서는 사용하지 않지만, 추후 필요 시 아래와 같은 데이터를 넣을 수 있다:

```typescript
clientMeta: {
  userAgent: navigator.userAgent,
  screenSize: `${screen.width}x${screen.height}`,
  timestamp: new Date().toISOString(),
}
```

---

## 5. 어드민 페이지 연동 (별도 작업)

오프라인 투표를 위한 어드민 작업 흐름:

1. 어드민 > 장소 선택 (시도 → 시군구 → 읍면동 드롭다운, 법정동코드 API 활용)
2. 어드민 > ServerMeta 생성 → UUID 발급
3. 어드민 > 투표 URL 복사: `/offline-vote?slug=xxx&serverMetaId=yyy`
4. 태블릿 브라우저에 URL 입력 또는 QR 스캔
5. PWA 홈 화면 추가 → 전체화면 투표 시작

어드민 페이지에서 ServerMeta CRUD UI는 별도 작업으로 진행한다.

### 5.1 통계 활용 예시

법정동코드 기반이므로 BE에서 다양한 단위의 통계 집계가 가능하다:

```sql
-- 서울시 전체 투표 통계
WHERE meta->'location'->>'code' LIKE '11%'

-- 강남구 투표 통계
WHERE meta->'location'->>'code' LIKE '1168%'

-- 강남구 역삼동 투표 통계
WHERE meta->'location'->>'code' = '1168010100'
```

---

## 6. 정리

| 항목 | 내용 |
|------|------|
| 접근 제어 | URL의 `serverMetaId` 파라미터로 제어 (UUID = 추측 불가) |
| 메타 전송 | `vote()` 호출 시 `serverMetaId`를 `CreateVoteRequest`에 포함 |
| 메타 내용 | `location`은 법정동코드 기반 (코드+시도+시군구+읍면동), `from`/`to` 등 확장 가능 |
| 기존 난수 | ServerMeta의 `id`(UUID)로 대체됨 |
| FE 역할 | URL에서 serverMetaId 파싱 → 검증 → 투표 시 전송 |
| BE 역할 | 투표 데이터와 serverMeta 매핑 저장 |
