# BE 요청: 1:1 비교 결과 Participant에 displayName / displayProfileColor 추가

## 요청 사항

`GET /api/v1/compare-links/{token}/result` 응답의 `Participant` 객체에 `displayName`과 `displayProfileColor` 필드를 추가해주세요.

## 배경

그룹 비교에서 "케미 상세보기"를 클릭하면 `POST /api/v1/compare-links/{groupToken}/pair`로 1:1 비교 토큰을 생성하고, `/compare/match/{token}?from=group`으로 이동합니다.

이때 1:1 비교 결과 페이지에서는 `Participant.nickname`(계정 닉네임)만 표시되는데, 그룹에서는 `displayName`(그룹용 닉네임)을 사용하고 있어 이름이 달라 보이는 문제가 있습니다.

## 현재 Participant 스키마

```json
{
  "nickname": "웅라기",
  "isWithdrawn": null,
  "answers": [...]
}
```

## 요청 스키마

```json
{
  "nickname": "웅라기",
  "displayName": "제이팍",
  "displayProfileColor": "SAPPHIRE",
  "isWithdrawn": null,
  "answers": [...]
}
```

| 필드                  | 타입      | 설명                                                |
| --------------------- | --------- | --------------------------------------------------- |
| `displayName`         | `string?` | 그룹 비교에서 설정한 표시 이름. 없으면 `null`       |
| `displayProfileColor` | `string?` | 프로필 색상 코드 (MINT, SAPPHIRE 등). 없으면 `null` |

## FE 대응

BE 구현 완료 시:

- `from=group`인 경우 `displayName ?? nickname` 으로 표시
- `displayProfileColor`로 프로필 아바타 색상 적용
- swagger 업데이트 후 orval 재생성하여 `Participant` 타입에 필드 추가

## 우선순위

그룹 비교 → 1:1 상세 전환 시 UX 불일치 이슈이므로 빠른 대응 부탁드립니다.
