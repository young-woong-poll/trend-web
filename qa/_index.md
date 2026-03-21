# QA 현황 대시보드

> 최종 업데이트: 2026-03-14

## 페이지별 QA

| 페이지        | 경로              | 체크리스트                                | E2E 테스트                                                                                                                                                     | 대응 스펙                                              | 최종 QA |
| ------------- | ----------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------- |
| 메인          | `/`               | [checklist.md](main/checklist.md)         | [main.spec.ts](main/main.spec.ts), [share.spec.ts](main/share.spec.ts), [comment.spec.ts](main/comment.spec.ts), [responsive.spec.ts](main/responsive.spec.ts) | [main.md](../docs/specs/pages/main.md)                 | -       |
| 상세          | `/hotpick/{slug}` | [checklist.md](detail/checklist.md)       | [detail.spec.ts](detail/detail.spec.ts)                                                                                                                        | [detail.md](../docs/specs/pages/detail.md)             | -       |
| 오프라인 투표 | `/offline-vote`   | [checklist.md](offline-vote/checklist.md) | [offline-vote.spec.ts](offline-vote/offline-vote.spec.ts)                                                                                                      | [offline-vote.md](../docs/specs/pages/offline-vote.md) | -       |
| 검색          | `/search`         | [checklist.md](search/checklist.md)       | [search.spec.ts](search/search.spec.ts), [recent-search.spec.ts](search/recent-search.spec.ts), [search-pc.spec.ts](search/search-pc.spec.ts)                  | [search.md](../docs/specs/pages/search.md)             | -       |
| 관리자        | `/admin/*`        | [checklist.md](admin/checklist.md)        | -                                                                                                                                                              | [admin.md](../docs/specs/pages/admin.md)               | -       |

## 우선순위 기준

- **Critical** — 배포 차단. 이 항목이 실패하면 배포 불가
- **Major** — 배포 가능하나 빠른 수정 필요
- **Minor** — 다음 스프린트에서 수정
