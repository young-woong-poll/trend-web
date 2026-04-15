# BE 요청: GET /v1/bundles sort=popular 파라미터

## 요청 사항

`GET /v1/bundles` 엔드포인트에 `sort` 쿼리 파라미터를 추가해주세요.

## 상세

| 파라미터 | 값                | 설명                             |
| -------- | ----------------- | -------------------------------- |
| `sort`   | `popular`         | `participantCount` 내림차순 정렬 |
| `sort`   | `latest` (기본값) | 생성일 내림차순 정렬             |

## 현재 상태

- FE에서 전체 번들 목록을 가져온 후 `participantCount` 기준 클라이언트 정렬 중
- TOP 탭 > 케미 유형 필터에서 사용

## 필요 이유

- 번들 수가 늘어나면 전체 목록을 받아서 클라이언트 정렬하는 것이 비효율적
- BE에서 정렬하면 향후 페이지네이션도 가능

## 요청 예시

```
GET /v1/bundles?sort=popular
```

## FE 대응

BE 구현 완료 시 FE에서 클라이언트 정렬 제거하고 `sort=popular` 파라미터 전달로 교체 예정.
