# H3 시각 정렬 노트 — 1차 구현 후 디자인 수정 가이드

본 노트는 H3 ("테토/에겐") 1차 FE 구현이 끝난 시점에서 작성됨. 웅일이 화면을 보고 **"AI가 만든 디자인 같다 / 통일감 부족"** 피드백을 주어, 결이 HotPick 기존 디자인(번들 결과 + 싱글 헤더) 시각 어휘를 정독해 **위반 항목과 수정 계획**을 정리한 것.

**다음 작업자(또는 새 PC 결)는 본 노트 + [디자인 스펙](./2026-04-26-h3-friend-evaluation-design.md)을 같이 로드해서 결과 화면(`/ask/teto-egen/my`)부터 수정 시작한다.**

---

## 배경 (왜 다시 손대는가)

1차 구현은 [디자인 스펙](./2026-04-26-h3-friend-evaluation-design.md) 따라 토스 톤 + 토큰만 가져다 썼는데, 다음 문제가 발견됨:

- **HotPick 기존 시각 어휘를 안 봤음** — 토큰(색·간격)만 가져다 썼고, 번들·싱글이 쓰는 시각 언어(typography 위계, 카드 모서리, 그라데이션 사용 빈도, 여백 리듬) 미반영
- **토스 톤을 카피로만 이해** — "큰 숫자 + 한 줄"만 적용, 정작 토스의 좌측 정렬·여백 큰 호흡·낮은 채도·그라데이션 자제·문장형 카피는 미반영
- **AI 디자인 클리셰 박힘** — 그라데이션 텍스트, 큰 이모지, 가운데 정렬, 👏/🎯 남용 (HotPick 어디에도 없는 패턴)

웅일 합의 사항 (대화에서):

1. **번들·싱글 디자인 정렬이 1순위** (통일감이 토스 톤보다 먼저)
2. **토스 캡처는 웅일이 별도 제공** — 1차는 HotPick 정렬, 2차에 토스 톤
3. **결과 화면 → 자기평가 → 랜딩 → 친구평가 순으로 한 영역씩** 수정 → 점검 → 다음

---

## HotPick 시각 규칙 인벤토리 (정독 결과)

정독 대상:

- [src/components/features/Bundle/BundleResult/BundleResult.tsx](../../../src/components/features/Bundle/BundleResult/BundleResult.tsx)
- [src/components/features/Bundle/BundleResult/BundleResult.module.scss](../../../src/components/features/Bundle/BundleResult/BundleResult.module.scss)
- [src/components/features/Hotpick/VoteHeader/VoteHeader.module.scss](../../../src/components/features/Hotpick/VoteHeader/VoteHeader.module.scss)
- [src/components/features/Hotpick/ResultVoteOption/ResultVoteOption.module.scss](../../../src/components/features/Hotpick/ResultVoteOption/ResultVoteOption.module.scss)

다크 톤 화면(번들 결과)이 H3와 톤 매칭 — 본 노트는 번들 결과 어휘를 1차 reference로 삼는다.

### 1. 화면 구조 — 위계 패턴

| 영역             | HotPick 패턴                                             | H3 1차 구현           | 위반          |
| ---------------- | -------------------------------------------------------- | --------------------- | ------------- |
| 컨테이너 padding | `56px + 32px` 상단, `40px` 하단 (호흡 큼)                | `16px 24px 32px` 좁음 | ✗ 여백 부족   |
| 정렬             | center 정렬, gap 16px 리듬                               | left-center 혼합      | ✗ 통일 부족   |
| 진입 애니메이션  | `fadeSlideUp 0.4-0.5s, stagger 0.05-0.4s` 전 영역        | 없음                  | ✗ 정적        |
| 백 버튼          | `position: absolute, top: 56+12px, left: 16px` 자유 부유 | sticky header 안 박힘 | ✗ 스타일 다름 |

### 2. 카드 시스템 — 다크 톤 통일 어휘

| 속성          | HotPick 패턴                                                       | H3 1차 구현              |
| ------------- | ------------------------------------------------------------------ | ------------------------ |
| 배경          | **`rgba($bg-secondary, 0.5~0.6)` + `backdrop-filter: blur(16px)`** | `$bg-secondary` solid    |
| 테두리        | **`1px solid rgba(#fff, 0.04~0.06)`**                              | `1px solid #2a2a2a~#333` |
| 모서리        | `$border-radius-lg` (12px) 또는 `20px` (큰 카드)                   | `$border-radius-lg` ✓    |
| 그림자        | 없음 (다크)                                                        | 없음 ✓                   |
| inner padding | `18px` 또는 `10px 14px`                                            | `16px`                   |

→ **결의 H3는 카드가 너무 "딱딱". blur + 반투명이 HotPick 톤.**

### 3. 타이포그래피 — 위계 4단

| 역할                     | 폰트                                                                 | 색                              |
| ------------------------ | -------------------------------------------------------------------- | ------------------------------- |
| **H1 / 게이트 헤드라인** | `$font-size-24, weight 700, line-height 1.35, letter-spacing -0.6px` | `$white`                        |
| **H2 / 섹션 강조**       | `$font-size-16, weight 600~700, letter-spacing -0.3px`               | `$white` 또는 `$text-secondary` |
| **본문**                 | `$font-size-14, weight 500, line-height 1.55`                        | `$text-secondary`               |
| **레이블 / 캡션**        | `$font-size-12, weight 500~700, letter-spacing 1px (대문자 톤)`      | `$text-tertiary`                |
| **숫자 강조**            | `$font-size-22, weight 700` (싱글 voteCount 정도)                    | `$white`                        |

H3 위반:

- ✗ 결과 화면 큰 숫자 **72px** (HotPick 어디에도 이만큼 큰 숫자 없음 — 토스 톤이지 HotPick 톤 아님)
- ✗ `letter-spacing` 거의 안 잡힘 (HotPick은 `-0.3 ~ -0.6px` 일관)
- ✗ `line-height 1.55` 본문 리듬 안 지킴

### 4. 색·강조 사용 — 그라데이션의 위치

HotPick의 `$primary-gradient` 사용 **규칙**:

- ✓ **최상위 CTA 배경 1개** (gateCta — `height 52px, $border-rounded`)
- ✓ **로고 텍스트** (gradient text-fill)
- ✓ **장식 SVG 중심 노드** (게이트 visual 가운데 큰 원)
- ✗ **본문 큰 숫자 / 결과 강조 텍스트 — 안 함** (`resultTextStrong`은 그냥 `$white`)

H3 위반:

- ✗ 큰 숫자(`62%`)에 그라데이션 텍스트 — **HotPick 어디에도 안 함**. 큰 숫자 강조는 `$white + bold + 큰 사이즈`로
- ✗ 랜딩 제목 그라데이션 — 로고 톤이 아니라 헤드라인이라 과함
- ✗ 적중 카피 `$attention` 색 — `$attention`은 HotPick에서 거의 안 씀

### 5. CTA 버튼 어휘 (정확한 사양)

```scss
.gateCta {
  height: 52px;
  border-radius: $border-rounded; // 9999px (완전 알약)
  background: $primary-gradient;
  font-size: $font-size-18;
  font-weight: 700;
  letter-spacing: -0.4px;
  box-shadow:
    0 6px 20px rgba($primary-start, 0.32),
    0 0 36px rgba($primary-end, 0.18);
  hover: scale(1.01);
  active: scale(0.98);

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba($white, 0.18) 50%, transparent 100%);
    transform: translateX(-100%);
    animation: shimmer 3s ease-in-out infinite 1.5s;
  }
}
```

H3 위반:

- ✗ `padding: $spacing-16` 만 — height 명시 없음
- ✗ box-shadow 없음
- ✗ shimmer 애니메이션 없음

### 6. 보조 버튼·링크 어휘

```scss
.gateSecondary {
  padding: 6px 8px;
  background: transparent;
  color: $text-secondary;
  font-size: $font-size-12; weight 500;
  letter-spacing: -0.2px;
  hover: color: $white;
}
```

H3 위반:

- ✗ 보조 버튼 사실상 없음 — "다음" 외 모두 1차 CTA로 취급해서 그라데이션 남발

### 7. 이모지 vs SVG 아이콘 — 사용 정책

번들 결과 화면 **이모지 0개**. 강조 시각은 **SVG 일러스트** (`gateVisual` — 4개 노드 + 중심 그라데이션 원). 결과 캐릭터도 **PNG 이미지** (`popularity.imagePath`).

H3 위반:

- ✗ 👏 / 🎯 / 🤔 / 🪄 — **이모지 4개**. HotPick에 없는 패턴
- ✗ 큰 이모지 56px — AI 디자인 클리셰

### 8. 여백 리듬

```
container gap: 16px (기본)
section 간 gap: 16~24px
카드 inner gap: 8~16px
헤더 gap: 6px (작은 위계)
```

H3 위반:

- ✗ section gap 24px 일관 — HotPick은 16px 기본, 24는 가끔
- ✗ section padding-top 32px — HotPick은 padding 없이 gap으로 처리

### 9. 진입 애니메이션 (결이 완전 빠뜨림)

```scss
@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section1 {
  animation: fadeSlideUp 0.4s ease-out both;
}
.section2 {
  animation: fadeSlideUp 0.45s ease-out 0.05s both;
} /* stagger */
.section3 {
  animation: fadeSlideUp 0.5s ease-out 0.4s both;
}
```

H3는 정적 페이드만, stagger 없음.

### 10. 막대바 / 진행도 시각 (BundleResult.optionBar 패턴)

```scss
.optionBarTrack {
  background: rgba(#fff, low);
}
.optionBarFill {
  transform-origin: left;
  animation: barGrow 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both;
}
.myFill {
  background: $primary-gradient;
} // "내 답"만 그라데이션
.optionPercent {
  /* 막대 안에 텍스트 — 숫자가 차오르듯 보임 */
}
```

H3 위반:

- 단순 가로 바, 애니메이션 없음
- 다수파/소수파 구분 없이 둘 다 같은 그라데이션 → "내가 어디 속했는지" 즉시 인지 어려움

---

## H3가 위반한 핵심 (요약)

### A. AI 클리셰 박힌 곳 (반드시 제거)

1. 큰 숫자에 그라데이션 텍스트 (HotPick 안 함)
2. 이모지 4종 남발 (HotPick 0개)
3. 랜딩 헤드라인 그라데이션
4. `$attention` 색 사용 (HotPick 거의 안 씀)
5. 진입 애니메이션 없음

### B. 토스 톤이라 했는데 토스도 아닌 곳

1. 큰 숫자 72px — 토스도 이렇게 안 함 (토스는 보통 28~42px)
2. center 정렬 과함 — 토스는 좌측 정렬 기본

### C. HotPick 통일감 깨진 곳

1. 카드 배경 solid `$bg-secondary` — HotPick은 `rgba + blur`
2. 테두리 `1px solid #333` — HotPick은 `1px solid rgba(#fff, 0.04)`
3. CTA height 명시 없음 + shimmer 없음
4. 여백 padding으로 잡음 — HotPick은 gap으로

---

## 1차 수정 계획 — 결과 화면 (`/ask/teto-egen/my`)

대상 컴포넌트:

- [src/components/features/TetoEgen/MyResultView.tsx](../../../src/components/features/TetoEgen/MyResultView.tsx) + `.module.scss`
- [src/components/features/TetoEgen/ResultHeroCard.tsx](../../../src/components/features/TetoEgen/ResultHeroCard.tsx) + `.module.scss`
- [src/components/features/TetoEgen/SelfPredictionRow.tsx](../../../src/components/features/TetoEgen/SelfPredictionRow.tsx) + `.module.scss`
- [src/components/features/TetoEgen/FriendAnswersCollapse.tsx](../../../src/components/features/TetoEgen/FriendAnswersCollapse.tsx) + `.module.scss`

### 수정 항목 (체크리스트)

- [ ] `ResultHeroCard` 그라데이션 텍스트 제거 → `$white + 큰 사이즈` (32~40px 정도, 토스+HotPick 절충)
- [ ] 이모지 👏/🎯 → SVG 아이콘 또는 텍스트 강조로 (필요 시 `src/assets/icon/`에 신규 SVG 생성)
- [ ] 모든 카드 배경 `rgba($bg-secondary, 0.5) + backdrop-filter: blur(16px)` 통일
- [ ] 모든 카드 테두리 `1px solid rgba(#fff, 0.04~0.06)` 통일
- [ ] CTA 버튼 → `height: 52px` + box-shadow + shimmer 애니메이션 추가 (BundleResult `.gateCta` 그대로 차용)
- [ ] `fadeSlideUp` keyframe + 영역별 stagger 적용 (0.05s 간격)
- [ ] FriendAnswersCollapse 막대바 → `barGrow` 애니메이션 + 내 답(`myFill` = 그라데이션) vs 다른 답(평이) 시각 구분
- [ ] 정렬: center 일변도 → 적당한 좌측+center 혼합 (BundleResult 패턴 — `.resultLine`은 left-start, `.gateSection`은 center)
- [ ] `$attention` 색 사용 검토 → 제거 또는 최소화
- [ ] `letter-spacing: -0.3 ~ -0.6px` 모든 헤드라인에 일관 적용
- [ ] section padding 제거 → `container gap: 16px` 으로 리듬 통일
- [ ] 폰트 weight 검토 — 본문 500, 강조 600~700 (현재 H3는 weight 400~bold 일관성 없음)

### 작업 순서 (한 번에 다 하지 말 것)

1. **ResultHeroCard 갈아엎기** (큰 숫자 색·사이즈, 이모지 → SVG 또는 제거, 정렬, fadeSlideUp)
2. **MyResultView 컨테이너 + 카드들 통일** (rgba+blur 배경, 테두리, gap, padding)
3. **FriendAnswersCollapse 막대바 애니메이션 + myFill 차별화**
4. **CTA 버튼 (`.linkBox` 영역 하단)** — height 52px + shimmer
5. **저장 후 웅일에게 점검 요청** — OK 받으면 다음 영역(자기평가)으로

각 단계 끝나고 `pnpm tsc --noEmit && pnpm lint` 통과 확인 필수.

---

## 다음 영역 작업 순서 (1차 결과 화면 OK 후)

2. **자기평가 흐름** (`PrimaryFlow` 의 q1/q2 단계 + `BinaryChoiceCard` + `LinkGenerateForm` + `LinkShareCard`)
3. **랜딩** (`LandingHero`)
4. **친구평가 흐름** (`FriendFlow`)

각 영역도 같은 시각 규칙 적용. **AI 클리셰 5개(이모지·그라데이션 텍스트·`$attention`·정적 페이드·중앙 정렬 일변도) 제거가 공통 1순위.**

---

## 다음 세션 컨텍스트 (새 PC / 새 결이 첫 메시지로 받을 것)

**현재 위치**: H3 1차 FE 구현 + BAPI/MSW/스펙 모두 정합 완료. 화면이 동작하지만 디자인이 AI 클리셰로 가득함.

**진행 중 작업**: 시각 디자인 1차 정렬. 결과 화면(`/ask/teto-egen/my`)부터 한 영역씩 갈아엎는 단계.

**즉시 로드해야 할 문서 3개**:

1. [디자인 스펙](./2026-04-26-h3-friend-evaluation-design.md) — 화면 구조·컴포넌트·UX 결정
2. **본 시각 정렬 노트** — 위반 항목과 수정 계획 (현재 보고 있는 파일)
3. [BAPI 스펙](../../api/ask-teto-egen-api-spec.md) — 데이터 모델·정책 (UI 변경 시 데이터 흐름 확인용)

**reference로 정독해야 할 코드**:

- [BundleResult.tsx](../../../src/components/features/Bundle/BundleResult/BundleResult.tsx) + `.module.scss` — 다크 톤 시각 어휘 1차 reference

**대기 중인 외부 input**:

- 토스 캡처 3-4장 (웅일이 직접 공유 예정) — 1차 수정 끝낼 때쯤 도착해도 충분. 1차는 HotPick 정렬 위주.

**다음 즉시 액션**:

1. 본 노트의 "1차 수정 계획" 체크리스트 위에서부터 진행
2. ResultHeroCard부터 갈아엎기
3. 한 단계씩 끝날 때마다 웅일에게 화면 점검 요청 (`pnpm start` 후 `https://local-hotpick.votebox.kr/ask/teto-egen/my?mock=hit` 등)

**금지**:

- 한 번에 다 갈아엎지 말 것 (한 영역씩)
- 새 시각 어휘 만들지 말 것 — BundleResult를 1차 reference로 따라갈 것
- 이모지·그라데이션 텍스트·`$attention` 다시 박지 말 것

---

## 변경 이력

- 2026-04-26: 초안 작성. PC 전환 직전 인수인계 노트 + 시각 정렬 가이드.
