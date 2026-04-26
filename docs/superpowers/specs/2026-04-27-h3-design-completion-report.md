# H3 "테토/에겐" 디자인 정렬 마무리 보고

> 작성일: 2026-04-27
> 작성자: 결 (디자이너) → 병훈
> 관련 문서: [1차 정렬 노트](./2026-04-26-h3-visual-alignment-notes.md), [2차 토스 톤 plan](../plans/2026-04-26-h3-toss-tone-application.md), [BE 스펙](../../api/ask-teto-egen-api-spec.md)

---

## TL;DR

H3 1차 FE 구현 후 디자인 톤 미흡 피드백 받아 **2차 정렬을 마무리**했습니다.

- 1차: HotPick 기존 시각 어휘(BundleResult/BundlePlay) 정렬 — AI 클리셰 5종(이모지·그라데이션 텍스트·`$attention`·정적 페이드·중앙 정렬 일변도) 제거
- 2차: 토스 톤 부분 차용 — 좌측 정렬·큰 호흡·자동완성 chip·결과 카드 패턴·secondary 액션·강조어 inline gradient
- 구조 정리: 라우팅 분리, 공통 컴포넌트 추출, mock scenario 제거 후 BE 연동 준비
- **BE 측에 응답 명세 변경 요청 1건** (아래 "BE 측 작업 요청" 섹션 참고)

`pnpm tsc --noEmit` / `pnpm lint` / `pnpm build` 모두 통과 상태.

---

## 1. 시각 디자인 정렬

### 화면별 결과

| 화면                                | 1차 → 2차 핵심 변경                                                                                                                                                                                                                                   |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **랜딩** (`/ask/teto-egen`)         | 그라데이션 텍스트 제거 → `$white` / 이모지 🤔 제거 → 테토·에겐 캐릭터 PNG (140/168px 호흡 애니메이션) / 좌측 정렬 / max-height 720px (PC viewport cap)                                                                                                |
| **q1 / q2**                         | center → 좌측 정렬 헤드라인 / `$attention` 색 제거 / 카드 톤 BundlePlay 패턴 일치 (`$bg-secondary` solid + border-only `.activated` + glow shadow + scale 1.03) / 닉네임 inline gradient 강조 (`<strong>`) / 32px 호흡                                |
| **링크 생성 폼**                    | 좌측 정렬 / 입력 필드 좌측 / 글자수 카운터 (input 우측 안쪽) / 비활성 CTA 단색 회색 톤 / 10자 max-length                                                                                                                                              |
| **링크 공유 카드**                  | 이모지 👏 (56px) → CheckIcon indicator 칩 / hero 카드 (gradient halo) / 좌측 정렬 / shimmer CTA                                                                                                                                                       |
| **결과 화면** (`/ask/teto-egen/my`) | hero 카드 (gradient + radial halo) / 강조어 inline gradient (`@supports` fallback) / 큰 숫자 white 40px / **3 영역 위계 구분** (결과 hero / 친구 정보 그룹 / 액션 영역 + border-top 디바이더) / "홈으로 돌아가기" secondary 액션 / X 버튼 제거 (중복) |
| **친구 평가 진입**                  | 닉네임 inline gradient / BinaryChoiceCard 한 컨테이너로 통합 (my와 padding 일관)                                                                                                                                                                      |
| **친구 결과 화면**                  | `AnswerPairRow` 좌우 분할 (owner 답 / 내 답) — my의 SelfPredictionRow와 동일 컴포넌트 / "다음" CTA + secondary hint                                                                                                                                   |

### 공통 시각 어휘

- **카드**: `rgba($bg-secondary, 0.6)` + `backdrop-filter: blur(16px)` + `1px solid rgba(#fff, 0.06)` 테두리
- **CTA**: `$primary-gradient` + `$border-radius-lg` (12px) + padding 18px + shimmer 2.5s — BundlePlay submitButton과 동일 사양
- **헤드라인**: 24~28px / weight 700 / line-height 1.3~1.4 / letter-spacing -0.6px
- **secondary 액션**: transparent + `$text-tertiary` + 14px medium
- **Toast**: `padding 10px 16px` / `rgba(0,0,0,0.85)` / 테두리 없음 / `box-shadow 0 4px 12px rgba(0,0,0,0.4)` (MemberDetailSheet 패턴 일치)

---

## 2. 구조 / 코드 정리

### 라우팅 재구성

```
/ask/teto-egen           → 랜딩 (LandingHero 단독)
/ask/teto-egen/my        → my page에서 myLink fetch 1회 → 결과화면 OR 평가흐름 (q1→share)
/ask/teto-egen/friend/[token] → friend page에서 meta fetch 1회 → 평가/이미참여 결과
```

각 page.tsx가 **마운트 시점 1회만 분기 결정**(`decision: 'pending' | ...`)하고 그 결과를 고정. mutation 후 cache 변동에 영향받지 않아 LinkShareCard 등 중간 단계가 자연스럽게 노출됨.

### 공통 컴포넌트 추출

- **`TetoEgenLoading`** — 3-Dot Wave spinner (gradient + glow). my/friend page 양쪽에서 재사용.
- **`AnswerPairRow`** — 좌우 4-column key/value 카드. SelfPredictionRow를 일반화. my(내 선택/친구들 예상) + LinkGenerateForm + friend 결과(owner 답/내 답) 3곳 재사용.

### 인터랙션 정리

- **친구 칩 가로 스크롤** (FriendAnswersCollapse): 친구 수 많아져도 영역 높이 일정. 마우스 드래그 + 모바일 터치 모두 지원. **양방향 fade 마스크**가 scroll position에 따라 동적 토글 (양 끝에선 fade 사라짐).
- **Reload Alert 패턴**: "이미 참여했습니다" / "이미 링크가 존재합니다" / "에러 발생" 등 복구 불가 상황 → X 버튼 + dimmed click 모두 막힘 + 확인 누르면 `window.location.reload()` 강제.

### Mock 시나리오 정리

`useScenario` (`?mock=hit|miss|empty|tie`) 관련 코드 **전체 제거**:

- `useScenario.ts` 파일 삭제
- `getTetoEgenCount` / `useMyTetoEgenLink` / `useSubmitFriendVote` 시그니처에서 scenario 인자 제거
- `X-Mock-Scenario` 헤더 제거
- mock handlers의 `parseScenario` 제거 (default 동작만)
- `useSearchParams` 사용처가 사라져 prerender 빌드 통과

---

## 3. BE 측 작업 요청 (중요)

`docs/api/ask-teto-egen-api-spec.md` 업데이트 완료. 핵심 변경 2건:

### A. POST `/friend/{token}/vote` 응답에 `ownerSelfAnswer` 필드 **추가**

친구 평가 결과 화면에서 "{owner}님은 본인을 X로 답했어요" 노출용. 현재 응답엔 `ownerDisplayName`만 있음.

```typescript
{
  myVote: 'TETO' | 'EGEN';
  ownerDisplayName: string;
  ownerSelfAnswer: 'TETO' | 'EGEN'; // ← 신규
  friendVotes: { ... }
}
```

### B. GET `/friend/{token}` 응답에 옵션 필드 **3개 추가**

로그인 사용자가 이미 평가한 경우 결과 데이터를 함께 반환 → 클라이언트가 평가 화면을 건너뛰고 즉시 결과 화면 노출.

```typescript
{
  token: string;
  displayName: string;
  isOwn: boolean;
  // 아래 3개는 "로그인 사용자 + isOwn=false + 이전 vote 기록 있음" 일 때만 동봉
  myVote?: 'TETO' | 'EGEN';
  ownerSelfAnswer?: 'TETO' | 'EGEN';
  friendVotes?: { ... };
}
```

**보안 메모**: `ownerSelfAnswer`는 친구가 vote를 _이미 제출한_ 경우에만 노출 (평가 전 정답 누출 방지).

---

## 4. 점검 URL

로컬 dev 서버 (`pnpm start:msw` — MSW 기준):

| 화면                        | URL                                                                 |
| --------------------------- | ------------------------------------------------------------------- |
| 랜딩                        | `https://local-hotpick.votebox.kr/ask/teto-egen`                    |
| 자기평가 + 결과 (분기 자동) | `https://local-hotpick.votebox.kr/ask/teto-egen/my`                 |
| 친구 평가 (mock seed: 데모) | `https://local-hotpick.votebox.kr/ask/teto-egen/friend/demo-friend` |

---

## 5. 다음 단계

1. **병훈 점검** → OK/NG 피드백
2. **BE 동료에게 명세 변경 요청 전달** (위 3-A, 3-B)
3. BE 구현 완료 후 mock 핸들러 제거 가능
4. UX/UI 리뷰어 셀프체크 (선택) — `hp-ux-reviewer` + `hp-ui-reviewer` 병렬 호출

---

## 6. 검증

- `pnpm tsc --noEmit` → **EXIT 0**
- `pnpm lint` → **0 errors** (사전 warnings 106개는 결의 작업 외 영역)
- `pnpm build` → 통과 (prerender 이슈는 useScenario 제거로 해결)

## 7. 변경된 주요 파일 (참고)

```
src/app/ask/teto-egen/
  ├ page.tsx                                  (랜딩, 신규)
  ├ my/page.tsx                               (분기 게이트)
  └ friend/[token]/page.tsx                   (분기 게이트)

src/components/features/TetoEgen/
  ├ TetoEgenLoading.tsx + .module.scss        (공통 spinner, 신규)
  ├ AnswerPairRow.tsx + .module.scss          (좌우 분할 카드, SelfPredictionRow 일반화)
  ├ TetoEgenLayout.tsx + .module.scss         (X 버튼 fixed, body-compact 분기)
  ├ LandingHero.tsx + .module.scss            (캐릭터 PNG, max-height 720)
  ├ BinaryChoiceCard.tsx + .module.scss       (question: ReactNode, strong gradient)
  ├ LinkGenerateForm.tsx + .module.scss       (글자수 카운터, 비활성 톤)
  ├ LinkShareCard.tsx + .module.scss          (hero 카드, indicator 칩)
  ├ ResultHeroCard.tsx + .module.scss         (강조어 inline gradient + @supports fallback)
  ├ FriendAnswersCollapse.tsx + .module.scss  (가로 스크롤 + 양방향 fade + 드래그)
  ├ FriendFlow.tsx + .module.scss             (BinaryChoiceCard 흡수, AnswerPairRow 도입)
  ├ MyResultView.tsx + .module.scss           (3 영역 위계, secondary 액션, Alert reload)
  ├ PrimaryFlow.tsx + .module.scss            (Alert reload 패턴, 닉네임 강조)
  └ (제거됨) SelfPredictionRow, useScenario

src/api/ask-teto-egen.ts                      (scenario 인자 제거)
src/hooks/api/useAskTetoEgen.ts               (scenario 인자 제거, staleTime: 0)
src/types/ask-teto-egen.ts                    (ownerSelfAnswer 추가, FriendTetoEgenMetaResponse 확장)

src/mocks/data/ask-teto-egen.ts               (default 동작만, friendPool 30명)
src/mocks/handlers/ask-teto-egen.ts           (parseScenario 제거)

docs/api/ask-teto-egen-api-spec.md            (BE 명세 갱신)
```
