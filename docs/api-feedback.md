# API 피드백 처리 결과

> 원본 피드백을 검토 후 bundle-api-spec.md 반영 및 코드 수정 완료 (2026-04-06)

- [x] 전체 API
  - 카테고리코드 이거 Single-Bundle 에서 사용하는 카테고리의 인터페이스와 동일한가요? 혹시 신규로 생성된거면 기존 API 와 맞추고 수정해야합니다
  - **→ 동일함.** `src/types/hotpick.ts`의 `CategoryCode` 타입 사용. 문서에 "싱글 핫픽과 동일한 카테고리 코드" 명시 완료
- [x] 질문 목록조회 API
  - 요 API 에서 이미 답변했는지 유저 상태를 내려줘야 play 페이지에서 접근제어가 가능하지 않을까요? 혹은 이미 답변한 유저가 접근하면 아래 제출과 동일한 에러처리가 필요할 것 같네요
  - **→ 재검토: 현행 유지.** play 페이지에서 번들 상세 API(`useBundleDetail`)를 이미 호출하여 `bundle.completed`로 접근제어 중. elections API에 `completed`를 추가하면 번들 상세 호출을 줄일 수 있으나, 번들 상세는 play 외 다른 페이지에서도 사용하여 React Query 캐시가 활용되므로 실질적 이득이 적음. elections API 응답 구조 변경 없이 현행 유지
- [x] 답변제출 API
  - 중복 제출에러인 경우 결과페이지로 보내도록 FE 에서 처리가 되어있나요?
  - **→ 미구현이었음. 코드 수정 완료.** `BundlePlay.tsx`에서 400 에러 수신 시 `/bundle/{slug}/result`로 리다이렉트 처리 추가. 문서에도 FE 처리 방식 명시 완료
- [x] 결과조회 API
  - 미완료 유저인 경우 404인데 404가 맞을까요? 미완료 유저를 의미하는 다른 에러코드 없나요? 가능하면 공통된 에러코드로 변경해서 홈으로 보내도록 FE 에서 에러처리 해야합니다.
  - **→ 문서에 에러코드 개선 제안 추가.** `400 BAD_REQUEST` + `code: 'BUNDLE_NOT_COMPLETED'` 같은 명시적 코드 사용 권장. FE에서는 에러 수신 시 `/bundle/{slug}`(인트로)로 리다이렉트 처리 구현 완료
- [x] 비교링크 생성
  - 그럴리 없지만 미완료 유저 호출시 에러안내를 넣으면 좋을 것 같네요. 예상치 못한 에러이므로 단순 토스트로도 충분할 것 같습니다.
  - **→ 문서에 FE 처리 방식 명시 완료.** 정상 흐름에서 발생하지 않는 케이스이므로 예상치 못한 에러 발생 시 토스트 안내
- [x] compare-links/{token} API
  - GROUP 타입은 이제 compare/group/{token} 페이지를 모든 진입점으로 사용합니다. GROUP 관련 정보는 사용하는 곳이 있는지 확인후에 제거해도 되지 않을까요?
  - **→ 제거 가능. group-result API에 `myBundleCompleted`, `isClosed` 필드를 추가하면 그룹 결과 페이지에서 `compare-links/{token}` API 호출 자체를 제거할 수 있음.** `isCreator`는 `creatorUserId === myUserId`로, `isParticipant`는 `members` 배열에 `myUserId` 포함 여부로 FE에서 판별 가능. bundle-api-spec.md에 group-result 응답 필드 추가 및 compare-links GROUP 전용 필드 제거 가능 표기 완료
  - FE 상태분기표도 현재 스펙에 맞게 업데이트해주세요
  - **→ 이미 업데이트 완료.** GROUP 분기표는 `/compare/group/{token}` 기준으로 6가지 상태 (0명 엣지케이스, 프리뷰, 정상, 비멤버 3가지) 반영됨
- [x] 비교 링크 참여
  - 참여할때 displayName 말고도 보여질 프로필 색상도 정할 수 있는데 이 값도 추가해주시고 응답에도 추가해주세요
  - **→ join body에 `profileColor` 필드 추가 완료.** 현재 FE는 `updateProfileColor` API를 별도 호출하지만, join body 지원 시 한 번의 요청으로 처리 가능. 문서에 양쪽 방식 모두 기술
- [x] 그룹 비교 결과 조회
  - displayName 에 추가로 displayProfileColor? 도 추가로 받아야하지 않을까요?
  - **→ `displayProfileColor` 필드 추가 완료.** members 배열에 `displayProfileColor?: string` 추가. FE에서 `displayProfileColor ?? user.profileColor` 로직으로 아바타 색상 결정
  - 이 API 가 하는 일이 많은데 병렬로 요청하도록 적절하게 분리하는게 좋을까요?
  - **→ 문서에 API 분리 검토 의견 추가.** members와 questionStats 별도 엔드포인트 분리하여 병렬 요청 가능하도록 BE 검토 요청
  - 1:1 비교 결과 조회에서는 questionStats.optionACount: number; 값을 받아서 직접 대중성 지수를 계산했는데요 여기서도 동일하게 FE 에서 계산하는게 좋지 않을까요?
  - **→ 1:1과 동일하게 `optionACount`/`optionBCount`(투표 수)로 통일 완료.** 문서 및 코드 모두 수정. FE에서 동일 로직으로 비율 및 대중성 지수 계산
  - groupSyncRate 도 FE 에서 계산가능하면 FE 에서 계산해주세요. 어렵다면 어떻게 계산하는지 서버에 알려주세요
  - **→ API 응답에서 제거, FE 계산으로 전환 완료.** `calcGroupSyncRate()` 함수 구현 (`src/constants/group-compare.ts`). 계산 방식: 모든 C(n,2) 멤버 쌍의 답변 일치율 평균
- [x] 미구현 예정 API 는 뭔가요? 서버에 요청해야하는거 아닌가요?
  - **→ 정리 완료.** `GET /api/v1/bundles` (번들 목록)만 실제 필요 — sitemap.ts slug 하드코딩 해소, 메인 피드 participated 하드코딩 해소에 사용. `my-compare-links`는 사용처 없어 문서에서 제거
