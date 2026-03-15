# 오프라인 투표 (`/offline-vote`) QA 체크리스트

> 대응 스펙: [specs/pages/offline-vote.md](../../docs/specs/pages/offline-vote.md)
> 최종 QA: -

## 접근 제어

### Critical

- [ ] URL에 slug, serverMetaId가 없으면 에러 화면이 표시된다.
- [ ] serverMetaId가 유효하지 않으면 에러 화면이 표시된다.
- [ ] 유효한 URL로 접속하면 투표 화면이 정상 표시된다.

---

## 투표

### Critical

- [ ] 투표 시 serverMetaId가 함께 전송된다.
- [ ] 투표 결과가 정상 표시된다.

---

## UI

### Major

- [ ] ready 화면에 location 배지가 표시된다 (예: "서울특별시 강남구")
- [ ] from/to가 있으면 유효 기간이 표시된다.
- [ ] PWA 전체화면 모드가 정상 동작한다.
