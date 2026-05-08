# Teto-Egen 결과 페이지 리디자인 — MyResultView · FriendFlow

H3 검증 사이클 1차 콘텐츠 "테토/에겐"의 두 결과 화면(본인 결과 / 친구 평가 후 결과)을 캡처 가능한 한 컷의 선언형 결과 카드로 재설계. C4 "MBTI 수식어형" + 인터넷 용어 기반 수식어 라이브러리 + scroll-snap 두 페이지 인터랙션을 채택한다.

관련 문서:

- 리서치: [2026-05-08-teto-egen-result-redesign-research.md](2026-05-08-teto-egen-result-redesign-research.md) — 15개 후보 비교 + 3축 요약
- 비교 HTML: [2026-05-08-teto-egen-result-redesign-research.html](2026-05-08-teto-egen-result-redesign-research.html)
- 채택 mock: [2026-05-08-teto-egen-result-c4-mock.html](2026-05-08-teto-egen-result-c4-mock.html)
- 선례 스펙: [2026-04-24-bundle-result-redesign-design.md](2026-04-24-bundle-result-redesign-design.md) — 같은 진단·해결 패턴
- API 스펙: [docs/api/ask-teto-egen-api-spec.md](../../api/ask-teto-egen-api-spec.md)
- 도메인 타입: [src/types/ask-teto-egen.ts](../../../src/types/ask-teto-egen.ts)

## 배경

기존 결과 화면(`MyResultView`, `FriendFlow`)은 6개 블록(헤더·히어로·비교카드·토글·공유·보조 버튼)이 동일 weight로 수직 나열되어 시선 hierarchy가 약하고, 친구 분포(가장 흥미로운 데이터)가 토글 뒤에 숨겨져 80%+ 유저가 펼치지 않는다. 또한 캡처 한 컷으로 단톡방에 던질 만한 선언형 콘텐츠가 없어 H3 검증 사이클 콘텐츠임에도 바이럴 동력이 약하다. 자세한 진단은 리서치 문서 참조.

선례인 Bundle 결과 리디자인([2026-04-24](2026-04-24-bundle-result-redesign-design.md))에서 도출된 핵심 통찰을 그대로 적용한다:

- **"사람들은 남에 대해 관심 없다. 나에 대한 정보가 메인이어야 한다."** (MBTI 바이럴 원리)
- **"결과 카드를 캡처해 단톡방에 던질 만한 선언형 콘텐츠가 필요하다."**

## 채택 디자인 — C4 "쌉테토 / 쌉에겐" 형

15개 후보 중 mock으로 시연한 C4 (MBTI 수식어형) 채택. 결정 과정과 mock의 시각 디테일은 [채택 mock HTML](2026-05-08-teto-egen-result-c4-mock.html) 참조.

### 핵심 패턴

1. **단일 선언 카피**: "친구들이 본 [이름]님 / [수식어] / [테토 또는 에겐]"
2. **인터넷 용어 수식어**: "쌉" / "찐" / "은근" / "의외의" 등 친구들끼리 부르는 표현
3. **두 페이지 scroll-snap**: Hero(선언 카드) ↔ Detail(분포 + 친구 리스트 + CTA) 사이만 왔다갔다
4. **결과 색상 일관성**: Hero gradient·배경·메타 모두 결과(테토=파랑/에겐=빨강) 색에 맞춰 mirror
5. **캡처 친화**: Hero 한 장이 그대로 단톡방 캡처용

## UX 체크포인트 통과 기록

### Q1. 유저 목표 한 문장

친구들이 본 나의 정체성을 한 번에 알아채고, 그 결과를 캡처해서 단톡방·인스타에 공유한다.

### Q2. 상태 정의

| 상태                            | 처리                                                                                                                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 친구 0명 (empty)                | Hero에 빅워드 대신 "아직 친구가 평가하지 않았어요" + Detail 영역엔 "공유하면 결과가 채워져요" 일러스트 + CTA "투표 링크 복사하기" 강조                                                                        |
| 친구 1~2명 (sparse)             | 빅워드 유지 (수식어 미노출, bare 형태). Hero 하단에 안내 카피 "아직 초기 결과예요 — 더 물어보세요" + 즉시 링크 복사 CTA 노출 (Detail로 snap 이동 없이 Hero 자체에서 공유 유도). 카운트 작게 "n명만 답함" 노출 |
| 친구 정상 (3명+)                | mock 그대로                                                                                                                                                                                                   |
| 로딩                            | 기존 `TetoEgenLoading` 재사용                                                                                                                                                                                 |
| 에러 / 404                      | 현재 `MyResultView`의 처리 그대로 (랜딩 redirect)                                                                                                                                                             |
| variant: hit (자기평가 적중)    | 결과 색 hero (테토 결과면 파랑, 에겐 결과면 빨강)                                                                                                                                                             |
| variant: miss (자기평가 빗나감) | 색상은 동일, hero meta에 "예상: 빗나감"으로 표시. 빅워드는 항상 다수표 결과                                                                                                                                   |
| prefers-reduced-motion          | snap을 `proximity`로 약화 + 진입 모션 비활성 + 친구 셀 스태거 비활성                                                                                                                                          |
| 오프라인                        | HotPick 전반 미대응, 본 스펙에서도 이월                                                                                                                                                                       |

### Q3. 대안 경로

- 좌상단에 자체 백버튼 (mock에는 없으나 구현 시 추가). 기존 `SmartBackButton` 패턴 재사용 검토
- 친구 리스트 inner scroll: voter-list 끝까지 스크롤한 뒤 한 번 더 swipe → hero로 snap (`overscroll-behavior: contain`)
- 친구 0명일 때: snap의 두 번째 페이지가 비어 보이지 않도록 detail에 "아직 답이 없어요" 일러스트 + share CTA 노출
- snap 거부 사용자(reduce-motion 또는 OS 설정): scroll-snap-type을 `y proximity`로 fallback (강제 X)

### Q4. 카피 원칙

- 존댓말 유지
- 인터넷 용어 수식어 라이브러리 (FE에서 비율 기반 매핑) — 아래 "수식어 매핑" 섹션 참조
- "적중 / 빗나감" 단어 유지
- "테토 위크" 표기 안 씀 — 그냥 "테토" / "에겐" 단독
- 톤: 가볍고 친구들 사이의 농담스러운 표현 ("쌉테토", "찐에겐" 등)
- 섹션 라벨(영어 DISTRIBUTION/FRIENDS 등)은 사용하지 않음 — 한국어 타이틀만

### Q5. 회귀 영향

- 기존 `MyResultView`, `FriendFlow` 결과 부분 본격 재작성. URL 변경 없음
- BE 변경 없음 — `selfPrediction`, `voters[].votedAt` 모두 이미 응답에 포함
- 데드코드 제거 (외부 사용처 0 검증 완료):
  - `src/components/features/Result/{TypeCard, PickHistory, ResultHeader, ActionButtons}/` 4개 폴더
  - `src/components/features/Result/ResultContent.tsx`
  - 리디자인 후 추가 데드: `ResultHeroCard.tsx`, `FriendAnswersCollapse.tsx`
- `AnswerPairRow.tsx` 보존 — `LinkGenerateForm.tsx`에서 사용 중

## 수식어 매핑

비율 기반 자동 매핑(FE). BE 변경 없음. `src/lib/tetoEgenAdjective.ts` 신규 파일에 정의.

### 매핑 규칙

| 다수표 비율 | 수식어                    | 표시 형태             | 예시                                        |
| ----------- | ------------------------- | --------------------- | ------------------------------------------- |
| 85% 이상    | "쌉" (붙여 씀)            | 빅워드 한 단어        | 쌉테토 / 쌉에겐                             |
| 75~84%      | "찐" (붙여 씀)            | 빅워드 한 단어        | 찐테토 / 찐에겐                             |
| 60~74%      | (수식어 없음)             | 빅워드만              | 테토 / 에겐                                 |
| 50~59%      | "은근 [반대]인" (띄어 씀) | 수식어 줄 + 빅워드 줄 | 은근 에겐인 **테토** / 은근 테토인 **에겐** |
| 친구 1~2명  | (수식어 없음, 표본 부족)  | 빅워드만              | 테토 / 에겐                                 |

> 50% 미만 다수표 케이스는 수학적으로 발생하지 않음. 양분 50:50 동률 시 `selfAnswer`로 hit 처리되어 50%(=다수)로 계산되며, 이 경우 "은근 [반대]인" 룰이 적용된다.

### 디자인 의도

- "쌉테토 / 쌉에겐"은 친구들끼리 실제 쓰는 표현이라 캡처해서 던졌을 때 즉각적인 웃음 포인트
- 85%+ / 75%+는 임팩트가 가장 강한 구간 → 한 단어 응축 ("쌉" / "찐")
- 60-74%는 무난한 다수 → 결과 단어만으로 충분 (어설픈 수식어가 오히려 약화)
- 50-59%는 양분이 묘한 구간 → "은근 [반대답]인 [결과]" 형태로 양면 narrative ("당신 안에 양쪽이 다 있어" 뉘앙스)

### 표시 형태 분기

- **compound (붙여 씀)**: 빅워드 자리에 "쌉테토" 한 단어. 수식어 줄은 비움. 폰트 사이즈는 글자 수에 따라 동적 조정 (3글자 → ~92px, 4글자 → ~80px)
- **spaced (띄어 씀)**: mock의 기존 구조 그대로 — 수식어 줄("은근 에겐인") + 빅워드 줄("테토")
- **bare (수식어 없음)**: 수식어 줄 비움. 빅워드만. 60-74% / 표본 부족 케이스

### 함수 시그니처

```ts
// src/lib/tetoEgenAdjective.ts
import type { TetoEgenAnswer } from '@/types/ask-teto-egen';

export type AdjectiveResult = {
  modifier: string | null; // "쌉" | "찐" | "은근 에겐인" | null
  result: TetoEgenAnswer; // 다수표 결과 (동률 시 selfAnswer)
  display: 'compound' | 'spaced' | 'bare';
};

export function getResultAdjective(
  tetoCount: number,
  egenCount: number,
  selfAnswer: TetoEgenAnswer
): AdjectiveResult;
```

동률 시 `selfAnswer`가 우선되어 hit 처리되는 것은 기존 `MyResultView` 로직 동일.

### 단위 테스트 케이스

```
9/1 (90% T) + selfT → { modifier: '쌉', result: 'TETO', display: 'compound' }
8/2 (80% T) + selfT → { modifier: '찐', result: 'TETO', display: 'compound' }
7/3 (70% T) + selfT → { modifier: null, result: 'TETO', display: 'bare' }
6/4 (60% T) + selfT → { modifier: null, result: 'TETO', display: 'bare' }
5/5 (50% 동률) + selfT → { modifier: '은근 에겐인', result: 'TETO', display: 'spaced' }
4/6 (40% T) + selfE → { modifier: null, result: 'EGEN', display: 'bare' } // 60% E
1/0 (100% T) + selfT → { modifier: null, result: 'TETO', display: 'bare' } // 표본 부족
2/0 (100% T) + selfT → { modifier: null, result: 'TETO', display: 'bare' } // 표본 부족
0/0 (empty) → 별도 처리 (호출자가 empty 분기)
```

## FriendFlow 결과 화면 — 새 디자인

채택 mock: [2026-05-08-teto-egen-friend-result-mock.html](2026-05-08-teto-egen-friend-result-mock.html) (적중 케이스 시연 완료)

### 디자인 의도 — 정/오답 게임 X, 발견 + 호기심

초기 컨셉("정답!/땡!")은 "퀴즈가 아닌데 평가받는다"는 거부감 우려로 폐기. 대신 친구가 평가 후 보는 화면의 진짜 목적을 재정의:

> **"친구가 평가 후 자기도 받아보고 싶게 만드는 fishing 카드"** — H3 검증 사이클의 바이럴 동력

세 가지 hook을 결합한다:

- **A. 발견** — owner의 결과(친구들의 다수표 + 수식어)를 친구가 처음으로 알게 됨 ("헐 그래?")
- **C. 부드러운 게임성** — owner의 자기평가와 내 답이 같은지 평가 단어 없이 공감 카피로 표현 ("같은 생각이에요" / "조금 다르게 봤어요")
- **D. 호기심 자극** — Detail 하단 CTA에 "친구들은 나를 어떻게 볼까?" 한 줄로 본인 결과를 받고 싶게

### 정보 우선순위

1. **owner의 결과** (Hero 빅워드) — 친구가 평가에 기여한 결과 (수식어 적용 형태, 예: "쌉테토")
2. **내가 owner와 통했나?** (Hero 부제) — 내 답 vs ownerSelfAnswer
3. **내 답 vs owner 답** (Hero 메타, 작게)
4. **친구들 답 분포 + 친구 리스트** (Detail) — MyResult와 동일 패턴
5. **호기심 hook + CTA** (Detail 하단) — "나도 받아보고 싶다" 자극

### Hero 구성 (적중 케이스 = 내 답 == ownerSelfAnswer)

```
[ 라벨 ]    [ownerName]님은 친구들에게…
[ 빅워드 ]  쌉테토                       ← owner 결과 (다수표 + 수식어)
[ 부제 ]    [ownerName]님과 같은 생각이에요  ← 공감 뉘앙스
[ 메타 ]   내 답 [테토] · [ownerName] [테토]
```

색상: 결과(예: 테토)에 맞춘 톤 — Hero gradient·배경 ambient·me row 강조 모두 결과 색상으로 mirror.

### Hero 구성 (빗나감 케이스 = 내 답 != ownerSelfAnswer)

```
[ 라벨 ]    [ownerName]님은 친구들에게…
[ 빅워드 ]  쌉테토                              ← 동일 (owner 결과)
[ 부제 ]    [ownerName]님과 조금 다르게 봤어요   ← 공감 뉘앙스, 미스 표현
[ 메타 ]   내 답 [에겐] · [ownerName] [테토]
```

> 빅워드 컬러는 owner 결과 색상으로 일관 유지 (내 답이 다르더라도). 빗나감은 부제 카피로만 표현 — 시각 임팩트 분산 방지.

### "통했어요 / 살짝 다르네요" 카피 룰

| 케이스                   | 부제 카피                                |
| ------------------------ | ---------------------------------------- |
| 내 답 == ownerSelfAnswer | "[ownerName]님과 **같은 생각이에요**"    |
| 내 답 != ownerSelfAnswer | "[ownerName]님과 **조금 다르게 봤어요**" |
| ownerSelfAnswer 없음     | 부제 미노출 (Hero에 빅워드 + 메타만)     |

> "통했어요/살짝 다르네요" 대신 "같은 생각이에요/조금 다르게 봤어요"로 변경 — 정/오답 게임 뉘앙스를 더 약화하고 공감 뉘앙스를 강화. UX 리뷰 M6 반영 결과.

### Detail 구성 (MyResult와 동일 + me 행 강조)

- 분포 카드 (MyResult와 동일 — dist-q 미사용, 글자 양쪽 끝, 색상 구분)
- 친구 리스트 (내 답 행 강조: `highlightSelfId="me"` 패턴 유지)
  - me row: 흰색 미세 highlight (`rgba(255,255,255,0.05)`) — 정/오답 색상 X, 단순 "내 답" 식별
  - me 아바타: 결과 색상 그라데이션 + 글로우
  - "내 답" 칩: 회색 중립 (`rgba(255,255,255,0.08)` 배경)
- 호기심 hook 카피: "친구들은 나를 어떻게 볼까?"
- CTA 버튼:
  - 본인 링크 보유 시: "내 결과 보러 가기"
  - 본인 링크 미보유 시: "나도 평가 받아보기"

### owner의 자기평가 미공개 케이스

`ownerSelfAnswer`가 없는 경우: 부제 미노출 → Hero가 [라벨 / 빅워드 / 메타]로 단순화. 메타에서도 owner 칸 미노출. 빅워드(owner 결과)와 호기심 hook + CTA만으로 fishing은 여전히 작동.

## 디자인 디테일 (mock 확정 결과)

두 mock에서 확정된 카피 룰·레이아웃을 명시. 구현 시 이 표준을 따름.

### MyResult Hero 카피

| 영역              | 카피                                         | 비고                                                                          |
| ----------------- | -------------------------------------------- | ----------------------------------------------------------------------------- |
| 라벨              | `[displayName]님은 친구들이 보기에`          | hero-pre. 14px, $text-secondary. 이름 strong                                  |
| 빅워드 (compound) | `쌉테토` / `쌉에겐` / `찐테토` 등 한 단어    | 96px, 결과 색 그라데이션. 수식어 줄 없음                                      |
| 빅워드 (spaced)   | 수식어 줄 "은근 에겐인" + 빅워드 줄 "테토"   | 수식어 30px, 빅워드 96px                                                      |
| 빅워드 (bare)     | `테토` / `에겐` 단독                         | 108px (mock 기본). 수식어 줄 없음                                             |
| 메타              | 내 예측 [에겐] · 실제 [테토] · 예상 [빗나감] | 모두 흰색 통일. label 11px / val 14px / divider 1×28px. 데이터 원천은 아래 표 |

#### MyResult Hero 메타 데이터 원천

| 칸 라벨 | 값 표시              | 데이터 원천                                                      |
| ------- | -------------------- | ---------------------------------------------------------------- |
| 내 예측 | "에겐" 또는 "테토"   | `selfPrediction` — 친구들이 나를 X로 볼 거라는 내 예측           |
| 실제    | "에겐" 또는 "테토"   | `majorityAnswer` — 다수표 결과 (동률 시 `selfAnswer`로 hit 처리) |
| 예상    | "적중" 또는 "빗나감" | `selfPrediction === majorityAnswer` 비교 결과                    |

> 라벨 "내 예측"은 "친구들이 나를 X로 볼 거라는 내 예측"의 축약 표현. 짧은 표시를 위해 "예측"으로 줄였으나 의미상 자기평가(`selfAnswer`)가 아닌 `selfPrediction` 값임을 분명히 한다.

### FriendResult Hero 카피

| 영역   | 카피                                          | 비고                                              |
| ------ | --------------------------------------------- | ------------------------------------------------- |
| 라벨   | `[ownerName]님은 친구들에게…`                 | hero-pre. 14px                                    |
| 빅워드 | owner 결과 = MyResult와 동일 매핑 (쌉테토 등) | 96px, owner 결과 색상                             |
| 부제   | "통했어요" 또는 "살짝 다르네요" 또는 미노출   | 16px. "내 답 == ownerSelfAnswer" 분기             |
| 메타   | 내 답 [...] · [ownerName] [...]               | 통일 흰색. ownerSelfAnswer 없으면 owner 칸 미노출 |

### 분포 카드 (두 화면 공통)

```
┌────────────────────────────────────────────┐
│ ████████████████████░░░░░░░░░  ← 양분 막대 │
│                                             │
│ 테토       7명 · 70%   3명 · 30%       에겐 │
│ ↑좌측 끝                          ↑우측 끝  │
└────────────────────────────────────────────┘
```

- 카드 padding: `16px 18px`
- 막대 높이: `48px`, gap `6px`, 좌측 테토(파랑) / 우측 에겐(빨강), `border-radius: 8px`
- legend `display: flex; justify-content: space-between`:
  - 좌측 item: `[테토 굵은 파랑]` `[7명 · 70%]` (글자 좌측 끝)
  - 우측 item: `[3명 · 30%]` `[에겐 굵은 빨강]` (글자 우측 끝)
- dot 미사용 — 글자 색상으로만 결과 구분
- 카드 안 별도 질문 라벨 미사용 (섹션 타이틀 "친구들의 답 분포"가 이미 같은 의미)

### Detail flex 구조

```
.detail (height: 100dvh, flex column)
├ section title "친구들의 답 분포"          ← flex-shrink: 0
├ 분포 카드                                  ← flex-shrink: 0, margin-bottom: 24px
├ section head "친구들 답 · 10명"            ← flex-shrink: 0
├ voter-list                                 ← flex: 0 1 auto, max-height: 320px (MyResult) / 280px (Friend)
│  └ 자체 inner scroll, overscroll-behavior: contain
└ detail-cta                                 ← flex-shrink: 0, margin-top: auto, padding-top: 24px
   └ (FriendResult만) cta-hook 카피 + cta-primary 버튼
```

핵심:

- voter-list `max-height` 명시 → 친구 많을 때 inner scroll, 적을 때 카드가 너무 크게 늘어나지 않음
- detail-cta `margin-top: auto` → 친구 짧아도 CTA가 항상 화면 하단에 고정
- detail-cta `padding-top: 24px` → 리스트와 CTA 사이 여백 확보 (이전엔 16px이라 답답)

### 페이지 배경 (.page-bg)

결과 색에 따라 ambient 컬러 swap:

- 테토 결과 → 파란/시안 radial gradients
- 에겐 결과 → 핫핑크/빨강 radial gradients

3 layer radial-gradient 조합 (mock CSS 그대로). hero 강한 ambient → detail로 자연스럽게 페이드.

### me row 강조 (FriendResult 전용)

- background: `rgba(255, 255, 255, 0.05)` (좌우 -16px 확장)
- 아바타: 결과 색상 그라데이션 + 글로우 (`linear-gradient(135deg, var(--teto-blue), #00c2ff)` + `box-shadow`)
- "내 답" 칩: `rgba(255, 255, 255, 0.08)` 배경 + `$text-secondary` 글자 (정/오답 색상 X — 단순 식별용)

### 헤더 / 백버튼

mock에는 헤더 없음. 구현 시 좌상단에 자체 백버튼 1개만:

- Hero 영역에만 absolute 포지션 (Detail에선 미노출)
- 기존 `BackIcon` SVG 재사용
- 클릭 시 `router.back()` (FriendResult) 또는 `/` (MyResult)

## 컴포넌트 구조

### 신규 파일

| 경로                                                                            | 역할                                                                     |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `src/components/features/TetoEgen/MyResult/MyResultStage.tsx`                   | scroll-snap 컨테이너 (Hero + Detail)                                     |
| `src/components/features/TetoEgen/MyResult/MyResultStage.module.scss`           | snap·viewport·페이지 배경 그라데이션                                     |
| `src/components/features/TetoEgen/MyResult/MyResultHero.tsx`                    | 빅워드 + 수식어 + 메타 (예상/실제/예상결과)                              |
| `src/components/features/TetoEgen/MyResult/MyResultHero.module.scss`            | 빅워드 그라데이션·배경 ambient·진입 모션                                 |
| `src/components/features/TetoEgen/MyResult/MyResultDetail.tsx`                  | 분포 카드 + 친구 리스트 + CTA                                            |
| `src/components/features/TetoEgen/MyResult/MyResultDetail.module.scss`          | flex 구조·inner scroll·CTA                                               |
| `src/components/features/TetoEgen/MyResult/VoterRow.tsx`                        | 친구 1행 (avatar·이름·답 칩·시간)                                        |
| `src/components/features/TetoEgen/MyResult/VoterRow.module.scss`                |                                                                          |
| `src/components/features/TetoEgen/FriendResult/FriendResultStage.tsx`           | FriendFlow 결과 화면 (별도 디자인 — owner 결과 중심 + 부드러운 게임성)   |
| `src/components/features/TetoEgen/FriendResult/FriendResultHero.tsx` (+ SCSS)   | 빅워드(owner 결과) + 부제(통했어요/살짝 다르네요) + 메타(내 답·owner 답) |
| `src/components/features/TetoEgen/FriendResult/FriendResultDetail.tsx` (+ SCSS) | MyResultDetail과 동일 패턴 + me row 강조 + 호기심 hook 카피              |
| `src/lib/tetoEgenAdjective.ts`                                                  | 비율 → 수식어 매핑 함수                                                  |
| `src/lib/tetoEgenColor.ts`                                                      | 결과 → 색상 토큰 매핑 (TETO=파랑 토큰, EGEN=빨강 토큰)                   |

### 수정 파일

| 경로                                                | 변경                                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `src/components/features/TetoEgen/MyResultView.tsx` | 본격 재작성 — `MyResultStage` 사용. identityHeader/AnswerPairRow/FriendAnswersCollapse 제거 |
| `src/components/features/TetoEgen/FriendFlow.tsx`   | 결과 화면 부분만 `FriendResultStage`로 교체. 평가 진입 화면(`BinaryChoiceCard`)은 유지      |

### 제거 파일

| 경로                                                                  | 사유                                                                               |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/components/features/Result/TypeCard/`                            | 외부 사용처 0 (사전 검증 완료)                                                     |
| `src/components/features/Result/PickHistory/`                         | 동일                                                                               |
| `src/components/features/Result/ResultHeader/`                        | 동일                                                                               |
| `src/components/features/Result/ActionButtons/`                       | 동일                                                                               |
| `src/components/features/Result/ResultContent.tsx`                    | BUNDLE redirect만 — BE 미지원 상태 동일하므로 라우트에서 직접 redirect 처리로 대체 |
| `src/components/features/Result/`                                     | 폴더 자체                                                                          |
| `src/components/features/TetoEgen/ResultHeroCard.tsx` (+ SCSS)        | 신규 `MyResultHero`로 대체                                                         |
| `src/components/features/TetoEgen/FriendAnswersCollapse.tsx` (+ SCSS) | 신규 디자인엔 토글 펼침 패턴 미사용                                                |

### 보존 파일

- `src/components/features/TetoEgen/AnswerPairRow.tsx` — `LinkGenerateForm.tsx`에서 사용 중
- `src/components/features/TetoEgen/BinaryChoiceCard.tsx` — `FriendFlow` 평가 진입 화면 유지
- `src/components/features/TetoEgen/LandingHero.tsx`, `LinkShareCard.tsx`, `LinkGenerateForm.tsx`, `PrimaryFlow.tsx`, `TetoEgenLayout.tsx`, `TetoEgenLoading.tsx` — 무관

### `ResultContent.tsx` 제거 — 외부 사용처 없음 (검증 완료)

`src/app/` 전체에서 `ResultContent` import 0건 확인. 단순 데드코드. 함께 제거 가능.

## 모션 가이드

framer-motion(v12, 이미 설치됨) 사용. mock의 vanilla JS 모션을 다음 패턴으로 옮긴다.

### Hero 진입 (페이지 로드 시 1회) — 위→아래 순차 등장

> **사용자 피드백 반영**: 빅워드가 가장 먼저 등장하면 시선이 점프해 어색하므로, 위에서부터 마크업 순서대로 자연스럽게 등장.

| 순서 | 요소                                       | 모션                                   | delay  |
| ---- | ------------------------------------------ | -------------------------------------- | ------ |
| 1    | hero-pre 라벨 ("지영님은 친구들이 보기에") | fade + translateY(10→0)                | `0s`   |
| 2    | 빅워드 ("쌉테토")                          | fade + scale(0.85→1) + translateY(8→0) | `0.3s` |
| 3    | 부제 / hero-tag (필요한 경우)              | fade + translateY                      | `0.6s` |
| 4    | 메타 ("내 예측·실제·예상")                 | fade + translateY                      | `0.9s` |

framer-motion 패턴:

```tsx
const baseTransition = { duration: 0.7, ease: [0.16, 1, 0.3, 1] };

<motion.p
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={baseTransition}
>
  {displayName}님은 친구들이 보기에
</motion.p>

<motion.h1
  initial={{ opacity: 0, scale: 0.85, y: 8 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  transition={{ ...baseTransition, duration: 0.9, delay: 0.3 }}
>
  {bigword}
</motion.h1>

<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ ...baseTransition, delay: 0.9 }}
>
  {/* 메타 */}
</motion.div>
```

### Detail 진입 (snap 진입 시 1회)

`useInView({ once: true, root: frameRef })` 또는 mock의 IntersectionObserver 패턴. snap container를 `frameRef`로 잡아야 viewport와 frame이 다른 경우(데스크톱) 정상 동작.

### 분포 막대

`width: 0 → target%` 트랜지션. shimmer 효과 옵션.

### 친구 셀 스태거

`reveal.in .friend-cell:nth-child(N) { transition-delay: N*60ms }` → framer-motion에선 `staggerChildren: 0.06` 또는 `transition.delay: index * 0.06`.

### prefers-reduced-motion

```tsx
const shouldReduceMotion = useReducedMotion();
const transition = shouldReduceMotion ? { duration: 0 } : { duration: 1, ease: [...] };
```

## 다크모드 토큰 가이드

CLAUDE.md 다크모드 규칙 엄격 준수. 신규 색상 추가 금지(필요 시 사용자 확인). 매핑:

| Mock CSS 변수                             | HotPick SCSS 변수                                               |
| ----------------------------------------- | --------------------------------------------------------------- |
| `var(--bg-primary)`                       | `$bg-primary` (#121212)                                         |
| `var(--bg-secondary)`                     | `$bg-secondary` (#1e1e1e)                                       |
| `var(--bg-tertiary)`                      | `$bg-tertiary` (#2c2c2c)                                        |
| `var(--white)`                            | `$white`                                                        |
| `var(--text-secondary)`                   | `$text-secondary`                                               |
| `var(--text-tertiary)`                    | `$text-tertiary`                                                |
| `var(--attention)`                        | `$attention` (#DFFF00) — 사용 여부 검토                         |
| `var(--teto) = #4d8bff`                   | **신규 토큰 추가** — `$teto-blue: #4d8bff`                      |
| `var(--teto-dim) = rgba(77,139,255,0.18)` | **신규 토큰 추가** — `$teto-blue-dim: rgba(77, 139, 255, 0.18)` |
| `var(--egen) = #ff4d6d`                   | **신규 토큰 추가** — `$egen-red: #ff4d6d`                       |
| `var(--egen-dim) = rgba(255,77,109,0.18)` | **신규 토큰 추가** — `$egen-red-dim: rgba(255, 77, 109, 0.18)`  |
| Hero gradient `#4d8bff → #00c2ff` (테토)  | 직접 값 사용 (그라데이션 stop은 토큰화하지 않음)                |
| Hero gradient `#ff4d6d → #ff7a00` (에겐)  | 직접 값 사용                                                    |

테토/에겐 색상 토큰은 향후 다른 화면(랜딩, 평가 진입, 공유 미리보기 등)에서도 재사용될 도메인 컬러이므로 `_variables.scss`에 신설 (사용자 승인 완료).

### Border-radius

mock의 `12px / 14px / 16px / 999px` → 정의된 `$border-radius-md` (8px), `$border-radius-lg` (12px) 우선. 14/16/999는 직접 값 사용 (CLAUDE.md SCSS 변수 규칙).

### Font-size

mock의 `108px (빅워드)` → 정의된 변수에 없음. 직접 값 사용.
다른 사이즈는 정의 변수 매칭(`$font-size-22`, `$font-size-20`, `$font-size-14`, `$font-size-13`, `$font-size-12`, `$font-size-11`).

## 백버튼 처리

mock에는 헤더 자체가 없음. 사용자 요청대로 좌상단에 자체 백버튼 1개만 배치. 기존 패턴 검토:

- `SmartBackButton` 컴포넌트가 있는지 확인 후 재사용
- 없으면 `BackIcon` (이미 import 중) + 단순 `<button>`로 처리
- Hero scroll-snap 진입 시에만 보이고, Detail에서는 숨길지 / 항상 보일지 결정 — **결의 추천: Hero 영역에만 absolute 포지션. Detail에선 미노출.** 이유: Detail로 snap된 상태에서 백버튼 누르면 컨텍스트 혼동 가능

## 작업 순서 (구현 단계)

1. `src/lib/tetoEgenAdjective.ts` + 단위 테스트 (비율별 분기 검증)
2. `src/lib/tetoEgenColor.ts` (TETO=파랑, EGEN=빨강 매핑)
3. `MyResult/` 컴포넌트 4종 신규 작성
4. `MyResultView.tsx` 재작성 (구버전 코드 + import 정리)
5. `FriendResult/` 컴포넌트 작성 (또는 본격 mock 한 번 더 후 진행)
6. `FriendFlow.tsx` 결과 부분 교체
7. 데드코드 제거 (`Result/` 폴더 + `ResultHeroCard.tsx` + `FriendAnswersCollapse.tsx`)
8. `ResultContent.tsx` 사용처 라우트 처리
9. `pnpm start` 동작 확인 — 모든 variant·empty·sparse·hit·miss
10. `hp-ux-reviewer` + `hp-ui-reviewer` 병렬 호출 → 피드백 반영

## 진행 중

- **FriendFlow mock 별도 라운드 — 진행 중**: [2026-05-08-teto-egen-friend-result-mock.html](2026-05-08-teto-egen-friend-result-mock.html). 사용자 검토·확정 후 본 스펙의 "FriendFlow 결과 화면" 섹션에 본격 디자인 디테일 반영 예정.

## 결정 보류 / 후속 과제

- **공유 카드 다운로드** — 이번 PR 미포함 (사용자 결정). 후속 라운드에서 `html2canvas` 등으로 별도 도입 검토
- **수식어 라이브러리 확장** — 현재 단순 매핑. 추후 친구 답변 패턴(빠르게 답한 비율 등)이나 owner의 자기평가 패턴을 반영한 동적 매핑 가능
- **에겐 색상 톤** — 현재 mock의 빨강이 너무 강할 수 있음. 구현 단계에서 조정 가능
