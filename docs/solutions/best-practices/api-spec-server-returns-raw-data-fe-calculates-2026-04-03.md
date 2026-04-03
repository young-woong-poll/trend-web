---
title: API 스펙 원칙 — 서버는 원시 데이터, FE는 계산
date: 2026-04-03
category: best-practices
module: Bundle/Compare API
problem_type: best_practice
component: documentation
severity: medium
applies_when:
  - 번들/비교 API 스펙 설계 시
  - 서버-FE 역할 분리 결정 시
  - 새로운 투표/비율 관련 필드 추가 시
tags:
  - api-spec
  - server-fe-separation
  - voting-rate
  - bundle
  - compare
---

# API 스펙 원칙 — 서버는 원시 데이터, FE는 계산

## Context

번들/비교 API 스펙을 리뷰하면서 서버 응답에 불필요한 필드가 포함되어 있거나, 서버에서 계산할 필요 없는 값을 리턴하고 있는 부분들이 발견됨. 세 가지 구체적 케이스를 정리하여 향후 API 설계 시 참조.

## Guidance

### 1. 정렬 순서는 배열 순서로 — `order` 필드 불필요

서버가 정렬된 순서대로 배열을 리턴하면, 별도 `order` 필드가 필요 없다.

```typescript
// Before — 불필요한 order 필드
Array<{
  electionId: string;
  title: string;
  optionA: string;
  optionB: string;
  order: number; // ← 배열 순서와 중복
}>;

// After — 배열 순서가 곧 순서
Array<{
  electionId: string;
  title: string;
  optionA: string;
  optionB: string;
}>;
```

### 2. 비율이 아닌 원시 투표 수를 리턴 — 부동소수점 문제 방지

서버에서 비율(%)을 계산해서 보내면 반올림 차이, 부동소수점 문제가 발생할 수 있다. 원시 투표 수를 보내고 FE에서 계산.

```typescript
// Before — 서버에서 비율 계산
questionStats: Array<{
  electionId: string;
  optionARate: number; // 0~100
  optionBRate: number; // 0~100
  totalVotes: number;
}>;

// After — 원시 투표 수만 리턴
questionStats: Array<{
  electionId: string;
  optionACount: number; // 투표 수
  optionBCount: number; // 투표 수
}>;
// FE에서: rate = Math.round(count / (aCount + bCount) * 100)
```

### 3. URL은 FE에서 생성 — 서버는 토큰만 리턴

공유 URL은 FE의 도메인/경로 구조에 의존하므로 FE에서 생성하는 것이 맞다.

```typescript
// Before — 서버가 URL 생성
{
  token: string;
  shareUrl: string;
}

// After — 토큰만 리턴
{
  token: string;
}
// FE에서: `${window.location.origin}/compare/${token}`
```

## Why This Matters

- **서버-FE 결합도 감소**: 서버가 FE의 URL 구조나 표시 방식을 알 필요 없음
- **부동소수점 정확성**: 정수 투표 수 기반 계산은 오차 없음
- **스펙 간결성**: 불필요한 필드를 줄이면 API 문서와 타입 정의가 단순해짐
- **유지보수성**: FE에서 비율 계산 로직을 변경해도 서버 수정 불필요

## When to Apply

- 번들/비교 관련 새 API 엔드포인트 추가 시
- 투표 비율, 통계 관련 응답 필드 설계 시
- 공유 링크, 리다이렉트 URL 관련 응답 설계 시
- `docs/api/bundle-api-spec.md` 업데이트 시

## Examples

적용된 파일들:

- `docs/api/bundle-api-spec.md` — API 요청서 업데이트
- `src/types/bundle.ts` — `BundleElection.order` 제거, `BundleMyResult.questionStats` count 기반으로 변경
- `src/types/compare.ts` — `CompareResult.questionStats` count 기반, `CreateCompareLinkResponse.shareUrl` 제거
- `src/constants/bundle.ts` — `calcPopularityScore` count에서 비율 계산
- `src/constants/compare.ts` — `findShockPoint`, `classifyAnswers` count에서 비율 계산

## Related

- `docs/api/bundle-api-spec.md` — 번들 API 개발 요청서
- `docs/specs/bundle-compare.md` 섹션 7.1 — "서버는 숫자, FE는 매핑" 원칙
