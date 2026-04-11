# 오프라인 투표 페이지 (`/offline-vote`)

> 최종 업데이트: 2026-03-14

## 개요

오프라인 현장에서 태블릿PC를 들고 돌아다니며 사람들에게 투표를 받는 기능.
투표 데이터에 장소(location) 등의 메타데이터를 함께 전송하여, 어디서 수집된 투표인지 서버에서 추적 가능.

---

## 1. 접근 제어

### URL 기반 접근

```
/offline-vote?slug=my-hotpick&serverMetaId=a1b2c3d4-e5f6-...
```

- `slug`, `serverMetaId` 필수
- 유효하지 않으면 에러 화면
- `serverMetaId`는 UUID (추측 불가)
- 어드민만 생성 가능 -> URL을 모르면 접근 불가

### 진입 흐름

1. URL에서 `slug`, `serverMetaId` 추출
2. `GET /api/v1/server-metas/{serverMetaId}` -> 유효성 검증
3. `GET /api/v1/hotpicks/{slug}` -> 투표 데이터 로드
4. 두 API 모두 성공 -> ready 화면
5. 실패 -> 에러 화면 (잘못된 링크 안내)

---

## 2. Server Meta 시스템

### 데이터 구조

```typescript
CreateServerMetaRequest {
  meta: {
    location: {
      code: "1168000000",        // 법정동코드 10자리
      sido: "서울특별시",
      sigungu: "강남구",
      eupmyeondong: ""
    },
    from: "2026-03-01 10:00:00",
    to: "2026-03-01 18:00:00"
  }
}
```

### 위치 데이터: 법정동코드 기반

- 시도(2) + 시군구(3) + 읍면동(3) + 리(2) = 10자리
- 드롭다운 선택 -> 입력 오류 없음
- SQL `WHERE code LIKE '11%'`로 서울 전체 조회 가능

---

## 3. 화면 구성

### 페이지 흐름

```
URL 파라미터 자동 파싱 → 검증 → ready → voting → result
```

### ready 화면

- location 배지 표시 (예: "서울특별시 강남구")
- `from`/`to`가 있으면 유효 기간 표시

### 투표 화면

- 상단 바에 location 표시 (시군구 단위 축약)
- 투표 시 `serverMetaId` 함께 전송

### 에러 화면

- "유효하지 않은 투표 링크입니다"
- 어드민에게 문의 안내

### PWA

- manifest, Fullscreen API 지원
- 홈 화면 추가 -> 전체화면 투표

---

## 4. 투표 전송

```typescript
vote(
  slug,
  {
    electionItemId: optionId,
    serverMetaId: serverMetaId, // 서버 메타 UUID 추가
  },
  { headers: { 'x-tku-id': tkuId } }
);
```

---

## API 요약

| Method | Endpoint                        | 설명                     |
| ------ | ------------------------------- | ------------------------ |
| GET    | `/api/v1/server-metas/{id}`     | ServerMeta 조회 (공개)   |
| GET    | `/api/v1/hotpicks/{slug}`       | 핫픽 상세                |
| POST   | `/api/v1/hotpicks/{slug}/votes` | 투표 (serverMetaId 포함) |

## Changelog

- 2026-03-14: URL 파라미터 기반 접근 제어로 변경 (기존 setup 화면 제거)
- 2026-03-01: 초기 작성
