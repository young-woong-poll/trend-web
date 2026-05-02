# H3 토스 톤 2차 적용 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 1차 정렬(BundleResult/BundlePlay 패턴 일치)이 끝난 H3 화면에 토스 디자인의 핵심 어휘(좌측 정렬·큰 호흡·미니멀·자연스러운 의문형 카피·secondary 액션·자동완성 chip·결과 카드 패턴)를 부분 차용해 톤을 한 단계 더 끌어올린다.

**Architecture:** 토스 캡처 16장 정독 결과, 토스 톤의 본질은 "**좌측 정렬 + 큰 호흡 + 미니멀**"이다. 다만 100% 토스화는 HotPick 시그니처(primary gradient, 다크 글로우, BundleResult의 게이트 카드 톤)와 충돌하므로 **부분 차용** 원칙으로 간다. 가져올 것 7가지(좌측 정렬 헤드라인, 의문형 카피, 큰 헤드라인 호흡, 자동완성 chip, 4-column key/value 결과 카드, secondary 액션 텍스트, 상단 빈 공간)와 가져오지 않을 것 4가지(토스 블루 단색 CTA, 체크리스트형 옵션, 하단 sticky CTA, 반원 게이지)를 미리 못 박아둔다.

**Tech Stack:** Next.js 14 / TypeScript / SCSS Modules / 기존 토큰만 사용 (`docs/design-system/tokens.md`, `src/styles/_variables.scss`).

---

## 토스 패턴 분석 요약 (16장 종합)

### 가져올 7가지 (Apply)

| #   | 패턴                                                                                  | 토스 캡처 근거                    | H3 적용 위치                                    |
| --- | ------------------------------------------------------------------------------------- | --------------------------------- | ----------------------------------------------- |
| 1   | **좌측 정렬 헤드라인**                                                                | 002, 003, 004, 006, 007, 015, 016 | 랜딩, q1/q2, 폼, 공유, 결과 hero                |
| 2   | **자연스러운 의문형 카피** ("~할까요?", "~인가요?")                                   | 002, 003, 011, 012, 014, 015, 016 | 모든 헤드라인 카피 검토                         |
| 3   | **큰 헤드라인 호흡** (24~28 / weight 700 / line-height 1.3~1.4 / letter-spacing -0.6) | 모든 화면                         | 헤드라인 일관                                   |
| 4   | **자동완성 chip** ("잔액 · 2,330,966원 입력")                                         | 014                               | LinkGenerateForm 닉네임 자동입력                |
| 5   | **4-column key/value 결과 카드** ("예상 최대 한도 / 5,602만원 │ 예상 금리 / 4.08%")   | 004, 005                          | SelfPredictionRow는 이미 비슷 — 강화            |
| 6   | **CTA 아래 secondary 텍스트 액션** ("다음에 하기")                                    | 004, 008                          | LinkGenerateForm `.notice`, MyResultView "닫기" |
| 7   | **헤드라인 위 큰 빈 공간** (~60~80px)                                                 | 모든 화면                         | 랜딩, q1/q2, 폼 상단 padding 확대               |

### 가져오지 않을 4가지 (Skip)

| #   | 패턴                                       | 이유                                                            |
| --- | ------------------------------------------ | --------------------------------------------------------------- |
| 1   | 토스 블루 단색 CTA `#3182F7`               | HotPick은 `$primary-gradient`가 시그니처 — 절대 양보 X          |
| 2   | 체크리스트형 미니멀 옵션 (003번 패턴)      | H3 q1/q2는 2개 옵션 → 큰 카드가 더 명확 (Bundle/Play 패턴 유지) |
| 3   | 하단 sticky CTA                            | H3 화면은 1 viewport에 다 들어가므로 inline CTA가 자연스러움    |
| 4   | 005번 반원 게이지 / 011번 3D 코인 일러스트 | H3 결과 hero 위계에 과함                                        |

### 결정 근거 (Why) — 핵심

**왜 좌측 정렬인가?**: 토스 16장 중 14장이 헤드라인 좌측 정렬. center 정렬은 002번 결과 카드 내부 정도 한정. 좌측 정렬이 토스 톤의 가장 큰 시그니처. 1차 정렬 시 `BundlePlay.QuestionCard`는 center를 따랐지만, BundlePlay는 *짧은 1줄 질문 카드*고 H3는 _시작/입력/결과 화면_ — 위계가 달라 토스의 좌측 정렬을 따르는 게 자연스럽다.

**왜 그라데이션 CTA를 유지하는가?**: 토스는 단색 블루지만, HotPick의 `$primary-gradient`(magenta→orange)는 1차 정렬 노트에서 "Bundle CTA 패턴"으로 못 박혔고 사용자가 명시적으로 통일을 요청했다. 톤보다 브랜드 일관성이 우선.

---

## File Structure

본 작업은 **SCSS Modules + 일부 TSX 카피·구조 수정**만 다룬다. 새 컴포넌트는 만들지 않는다 — 기존 컴포넌트의 스타일/카피만 토스 톤으로 재정렬.

| 파일                                                                 | 변경 유형                                                 | 범위                                      |
| -------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------- |
| `src/components/features/TetoEgen/LandingHero.tsx`                   | 카피 수정 + 좌측 정렬 구조                                | 헤드라인 카피, eyebrow 칩 위치 검토       |
| `src/components/features/TetoEgen/LandingHero.module.scss`           | 정렬 + 호흡 + secondary 액션                              | text-align center→left, 상단 padding 확대 |
| `src/components/features/TetoEgen/BinaryChoiceCard.tsx`              | 카피 검토                                                 | helper prop 활용 강화                     |
| `src/components/features/TetoEgen/BinaryChoiceCard.module.scss`      | 헤드라인 좌측 정렬 + 사이즈 22→24 + 호흡                  | text-align center→left, 상단 padding 확대 |
| `src/components/features/TetoEgen/LinkGenerateForm.tsx`              | 자동완성 chip 추가 + 좌측 정렬                            | defaultName 있으면 chip 노출              |
| `src/components/features/TetoEgen/LinkGenerateForm.module.scss`      | 좌측 정렬 + 입력 정렬 + chip 스타일 + secondary notice 톤 | titleArea center→left, input center→left  |
| `src/components/features/TetoEgen/LinkShareCard.tsx`                 | 카피 + 좌측 정렬 + secondary 액션                         | "투표 링크" → "공유 링크" 토스 톤         |
| `src/components/features/TetoEgen/LinkShareCard.module.scss`         | hero 카드 left 정렬 강화, indicator 위치                  | align-items 명확화                        |
| `src/components/features/TetoEgen/ResultHeroCard.tsx`                | 카피 검토 (이미 left 정렬)                                | 헤드라인 1줄→2줄 호흡                     |
| `src/components/features/TetoEgen/ResultHeroCard.module.scss`        | 헤드라인 호흡 강화                                        | line-height 1.3→1.35, padding 확대        |
| `src/components/features/TetoEgen/SelfPredictionRow.module.scss`     | 4-column key/value 패턴 강화                              | 라벨 톤 정리, value 정렬                  |
| `src/components/features/TetoEgen/FriendAnswersCollapse.module.scss` | toggle 좌측 정렬 보강                                     | 텍스트 정렬 정리 (소폭)                   |
| `src/components/features/TetoEgen/MyResultView.tsx`                  | shareArea에 secondary 액션 "닫기" 추가                    | onClose 콜백 활용                         |
| `src/components/features/TetoEgen/MyResultView.module.scss`          | secondary 액션 스타일                                     | `.secondaryAction` 추가                   |

**문서 업데이트** (필수):

- `docs/superpowers/specs/2026-04-26-h3-visual-alignment-notes.md` — 2차 작업 완료 기록 추가

---

## Task 1: LandingHero 좌측 정렬 + 헤드라인 호흡

**Files:**

- Modify: `src/components/features/TetoEgen/LandingHero.tsx`
- Modify: `src/components/features/TetoEgen/LandingHero.module.scss`

**근거**: 토스 002, 015, 016 모두 진입 화면 헤드라인 좌측. 현재 H3 LandingHero는 center.

- [ ] **Step 1: LandingHero.tsx 카피 + 구조 수정**

eyebrow 칩 제거 + 헤드라인 카피를 토스 의문형으로. visual은 헤드라인 아래로 위치 정리:

```tsx
'use client';

import { type FC } from 'react';

import styles from '@/components/features/TetoEgen/LandingHero.module.scss';
import { useScenario } from '@/components/features/TetoEgen/useScenario';
import { useTetoEgenCount } from '@/hooks/api/useAskTetoEgen';

type LandingHeroProps = {
  onStart: () => void;
};

const LandingHero: FC<LandingHeroProps> = ({ onStart }) => {
  const scenario = useScenario();
  const { data, isLoading } = useTetoEgenCount(scenario);

  return (
    <section className={styles.root}>
      <div className={styles.titleArea}>
        <h1 className={styles.title}>
          나는 테토일까,
          <br />
          에겐일까?
        </h1>
        <p className={styles.subtitle}>
          내 생각과 친구들 생각이 얼마나 같은지 1분 만에 확인해볼게요
        </p>
      </div>

      <div className={styles.visual} aria-hidden>
        <svg viewBox="0 0 280 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="landingHeroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--primary-start)" />
              <stop offset="100%" stopColor="var(--primary-end)" />
            </linearGradient>
            <radialGradient id="landingHeroGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--primary-end)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--primary-end)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="140" cy="100" r="80" fill="url(#landingHeroGlow)" />
          <circle cx="140" cy="100" r="34" fill="url(#landingHeroGrad)" />
          <g stroke="rgba(255, 255, 255, 0.18)" strokeWidth="1.2" fill="none">
            <line x1="140" y1="100" x2="50" y2="48" strokeDasharray="3 3" />
            <line x1="140" y1="100" x2="230" y2="48" strokeDasharray="3 3" />
            <line x1="140" y1="100" x2="50" y2="152" strokeDasharray="3 3" />
            <line x1="140" y1="100" x2="230" y2="152" strokeDasharray="3 3" />
          </g>
          <g fill="rgba(255, 255, 255, 0.85)">
            <circle cx="50" cy="48" r="6" />
            <circle cx="230" cy="48" r="6" />
            <circle cx="50" cy="152" r="6" />
            <circle cx="230" cy="152" r="6" />
          </g>
        </svg>
      </div>

      <div className={styles.bottomArea}>
        <p className={styles.count}>
          {isLoading || !data
            ? '— 명이 함께했어요'
            : `지금까지 ${data.count.toLocaleString()}명이 함께했어요`}
        </p>
        <button type="button" className={styles.cta} onClick={onStart}>
          시작하기
        </button>
      </div>
    </section>
  );
};

export default LandingHero;
```

- [ ] **Step 2: LandingHero.module.scss 좌측 정렬 + 호흡 적용**

```scss
@use '@/styles/variables' as *;

@keyframes landingFadeUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes landingShimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes nodePulse {
  0%,
  100% {
    opacity: 0.55;
  }
  50% {
    opacity: 1;
  }
}

.root {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: calc(100dvh - 56px);
  padding: 64px 0 $spacing-16;
}

.titleArea {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  text-align: left;
  animation: landingFadeUp 0.4s ease-out both;
}

.title {
  margin: 0;
  font-size: $font-size-28;
  font-weight: $font-weight-bold;
  color: $white;
  line-height: 1.3;
  letter-spacing: -0.6px;
  word-break: keep-all;
}

.subtitle {
  margin: 0;
  font-size: $font-size-16;
  font-weight: $font-weight-medium;
  color: $text-secondary;
  line-height: 1.55;
  letter-spacing: -0.2px;
  word-break: keep-all;
  max-width: 320px;
}

.visual {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 160px;
  animation: landingFadeUp 0.5s ease-out 0.1s both;

  svg {
    width: 100%;
    max-width: 280px;
    height: auto;
    display: block;

    line[stroke-dasharray='3 3'] {
      animation: nodePulse 2.6s ease-in-out infinite;
    }

    circle[fill='url(#landingHeroGrad)'] {
      filter: drop-shadow(0 0 20px rgba(var(--primary-end-rgb), 0.5));
    }
  }
}

.bottomArea {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
  padding-top: $spacing-24;
  animation: landingFadeUp 0.55s ease-out 0.15s both;
}

.count {
  margin: 0;
  text-align: center;
  font-size: $font-size-12;
  font-weight: $font-weight-medium;
  color: $text-tertiary;
  letter-spacing: -0.1px;
  font-variant-numeric: tabular-nums;
}

.cta {
  position: relative;
  width: 100%;
  padding: 18px;
  background: var(--primary-gradient);
  border: none;
  border-radius: $border-radius-lg;
  color: $white;
  font-size: $font-size-18;
  font-weight: $font-weight-semibold;
  letter-spacing: -0.4px;
  cursor: pointer;
  overflow: hidden;
  transition:
    transform 0.15s ease,
    opacity 0.15s ease;

  &:hover {
    opacity: 0.92;
  }
  &:active {
    transform: scale(0.98);
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba($white, 0.15) 50%, transparent 100%);
    transform: translateX(-100%);
    animation: landingShimmer 2.5s ease-in-out infinite;
    pointer-events: none;
  }
}
```

- [ ] **Step 3: tsc 통과 확인**

Run: `pnpm tsc --noEmit`
Expected: EXIT 0

- [ ] **Step 4: 브라우저 점검**

`pnpm start` 후 `https://local-hotpick.votebox.kr/ask/teto-egen` 접속.
헤드라인이 좌측 정렬로 떨어지는지, 상단 빈 공간이 토스처럼 호흡 큰지, eyebrow 칩이 사라졌는지 확인.

---

## Task 2: BinaryChoiceCard 헤드라인 좌측 정렬 + 호흡

**Files:**

- Modify: `src/components/features/TetoEgen/BinaryChoiceCard.tsx`
- Modify: `src/components/features/TetoEgen/BinaryChoiceCard.module.scss`

**근거**: q1/q2 헤드라인을 토스 002, 003 패턴(좌측 정렬, 큰 호흡)으로. 카드 자체(2-column grid)는 유지 — Bundle/Play 패턴 일치는 1차 약속.

- [ ] **Step 1: BinaryChoiceCard.module.scss 좌측 정렬 적용**

```scss
@use '@/styles/variables' as *;

@keyframes choiceFadeUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.root {
  display: flex;
  flex-direction: column;
  gap: $spacing-32;
  padding-top: 48px;
}

.question {
  margin: 0;
  font-size: $font-size-24;
  font-weight: $font-weight-bold;
  color: $white;
  line-height: 1.35;
  letter-spacing: -0.6px;
  text-align: left;
  word-break: keep-all;
  animation: choiceFadeUp 0.4s ease-out both;
}

.helper {
  margin: -$spacing-24 0 0;
  font-size: $font-size-14;
  font-weight: $font-weight-medium;
  color: $text-secondary;
  line-height: 1.55;
  letter-spacing: -0.2px;
  text-align: left;
  word-break: keep-all;
  animation: choiceFadeUp 0.45s ease-out 0.05s both;
}

.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  animation: choiceFadeUp 0.5s ease-out 0.1s both;
}

.card {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  padding: $spacing-24;
  background: $bg-secondary;
  border: 1px solid rgba($white, 0.08);
  border-radius: $border-radius-lg;
  color: $text-secondary;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover:not(:disabled) {
    border-color: rgba($white, 0.2);
    color: $white;
  }

  &:active:not(:disabled) {
    transform: scale(0.96);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.activated {
  border-color: var(--primary-start);
  background: rgba(var(--primary-start-rgb), 0.08);
  color: $white;
  box-shadow: 0 0 24px rgba(var(--primary-start-rgb), 0.1);
  transform: scale(1.03);
}

.label {
  font-size: $font-size-28;
  font-weight: $font-weight-bold;
  letter-spacing: -0.6px;
}
```

- [ ] **Step 2: PrimaryFlow에서 q1/q2 helper prop 카피 검토**

`PrimaryFlow.tsx`의 q1/q2 BinaryChoiceCard 호출에 helper를 자연스럽게 추가:

```tsx
{
  step === 'q1' && (
    <BinaryChoiceCard
      question="당신은 테토인가요? 에겐인가요?"
      helper="첫 인상으로 골라도 괜찮아요"
      left={{ value: 'TETO', label: '테토' }}
      right={{ value: 'EGEN', label: '에겐' }}
      onSelect={(v) => handleQ1(v as TetoEgenAnswer)}
    />
  );
}

{
  step === 'q2' && selfAnswer && (
    <BinaryChoiceCard
      question={`친구들도 ${labelOf(selfAnswer)}라고 생각할까요?`}
      helper="다음 단계에서 친구들이 직접 답할 거예요"
      left={{ value: 'NO', label: '아니다' }}
      right={{ value: 'YES', label: '그렇다' }}
      onSelect={(v) => handleQ2(v as 'YES' | 'NO')}
    />
  );
}
```

`PrimaryFlow.tsx`의 q1/q2 블록만 위 코드로 교체. 다른 부분 건드리지 않음.

- [ ] **Step 3: tsc 통과 확인**

Run: `pnpm tsc --noEmit`
Expected: EXIT 0

- [ ] **Step 4: 브라우저 점검**

q1/q2 단계 진입 후 헤드라인 좌측 정렬, helper 노출, 카드 선택 인터랙션(border만 변경) 확인.

---

## Task 3: LinkGenerateForm 좌측 정렬 + 자동완성 chip

**Files:**

- Modify: `src/components/features/TetoEgen/LinkGenerateForm.tsx`
- Modify: `src/components/features/TetoEgen/LinkGenerateForm.module.scss`

**근거**: 토스 014번 "잔액 · 2,330,966원 입력" chip 패턴 차용. defaultName(카카오 닉네임)이 있으면 "닉네임 사용 · OOO" chip을 보여주고 탭 시 자동 입력. 토스 015번처럼 입력 필드도 좌측 정렬.

- [ ] **Step 1: LinkGenerateForm.tsx 자동완성 chip + 좌측 정렬**

```tsx
'use client';

import { type FC, useState } from 'react';

import styles from '@/components/features/TetoEgen/LinkGenerateForm.module.scss';
import SelfPredictionRow from '@/components/features/TetoEgen/SelfPredictionRow';
import type { TetoEgenAnswer, TetoEgenPrediction } from '@/types/ask-teto-egen';

type LinkGenerateFormProps = {
  defaultName: string;
  selfAnswer: TetoEgenAnswer;
  selfPrediction: TetoEgenPrediction;
  onSubmit: (displayName: string) => void;
  isSubmitting?: boolean;
};

const LinkGenerateForm: FC<LinkGenerateFormProps> = ({
  defaultName,
  selfAnswer,
  selfPrediction,
  onSubmit,
  isSubmitting,
}) => {
  const [name, setName] = useState(defaultName);

  const trimmed = name.trim();
  const isValid = trimmed.length > 0 && trimmed.length <= 12;
  // 카카오 닉네임이 있고 현재 입력값과 다를 때만 chip 노출
  const showAutofillChip = defaultName.length > 0 && defaultName !== trimmed;

  return (
    <div className={styles.root}>
      <SelfPredictionRow selfAnswer={selfAnswer} selfPrediction={selfPrediction} />

      <div className={styles.titleArea}>
        <h2 className={styles.title}>친구들에게 어떤 이름으로 물어볼까요?</h2>
        <p className={styles.helper}>친구들에게 보일 이름이에요</p>
      </div>

      <div className={styles.inputArea}>
        <input
          className={styles.input}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름을 입력해주세요"
          maxLength={12}
          aria-label="친구들에게 보일 이름"
        />
        {showAutofillChip && (
          <button
            type="button"
            className={styles.autofillChip}
            onClick={() => setName(defaultName)}
          >
            카카오 닉네임 · {defaultName}
          </button>
        )}
      </div>

      <button
        type="button"
        className={styles.cta}
        onClick={() => onSubmit(trimmed)}
        disabled={!isValid || isSubmitting}
      >
        {isSubmitting ? '생성 중...' : '링크 생성하기'}
      </button>

      <p className={styles.notice}>링크가 생성되면 변경이 어려워요</p>
    </div>
  );
};

export default LinkGenerateForm;
```

- [ ] **Step 2: LinkGenerateForm.module.scss 좌측 정렬 + chip 스타일**

```scss
@use '@/styles/variables' as *;

@keyframes formFadeUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.root {
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
  padding-top: $spacing-16;
}

.titleArea {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
  text-align: left;
  margin-top: $spacing-16;
  animation: formFadeUp 0.45s ease-out 0.05s both;
}

.title {
  margin: 0;
  font-size: $font-size-24;
  font-weight: $font-weight-bold;
  color: $white;
  line-height: 1.35;
  letter-spacing: -0.6px;
  word-break: keep-all;
}

.helper {
  margin: 0;
  font-size: $font-size-14;
  font-weight: $font-weight-medium;
  color: $text-secondary;
  line-height: 1.55;
  letter-spacing: -0.2px;
}

.inputArea {
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
  animation: formFadeUp 0.5s ease-out 0.1s both;
}

.input {
  width: 100%;
  padding: 14px $spacing-16;
  background: $bg-tertiary;
  border: 1px solid #3a3a3a;
  border-radius: $border-radius-md;
  color: $white;
  font-size: $font-size-18;
  font-weight: $font-weight-medium;
  letter-spacing: -0.3px;
  text-align: left;
  outline: none;
  transition: border-color 0.15s ease;

  &::placeholder {
    color: $text-tertiary;
    font-weight: $font-weight-regular;
  }

  &:focus {
    border-color: $text-tertiary;
  }
}

.autofillChip {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  background: rgba($white, 0.06);
  border: 1px solid rgba($white, 0.08);
  border-radius: $border-rounded;
  color: $text-secondary;
  font-size: 13px;
  font-weight: $font-weight-medium;
  letter-spacing: -0.2px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    background: rgba($white, 0.1);
    color: $white;
    border-color: rgba($white, 0.16);
  }

  &:active {
    transform: scale(0.97);
  }
}

.cta {
  position: relative;
  width: 100%;
  padding: 18px;
  background: var(--primary-gradient);
  border: none;
  border-radius: $border-radius-lg;
  color: $white;
  font-size: $font-size-18;
  font-weight: $font-weight-semibold;
  letter-spacing: -0.4px;
  cursor: pointer;
  overflow: hidden;
  transition:
    transform 0.15s ease,
    opacity 0.15s ease;
  animation: formFadeUp 0.55s ease-out 0.15s both;

  &:hover:not(:disabled) {
    opacity: 0.92;
  }
  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
    &::after {
      animation: none;
    }
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba($white, 0.15) 50%, transparent 100%);
    transform: translateX(-100%);
    animation: shimmer 2.5s ease-in-out infinite;
    pointer-events: none;
  }
}

.notice {
  margin: 0;
  text-align: center;
  font-size: $font-size-12;
  font-weight: $font-weight-medium;
  color: $text-tertiary;
  letter-spacing: -0.2px;
  animation: formFadeUp 0.6s ease-out 0.2s both;
}
```

- [ ] **Step 3: tsc 통과 확인**

Run: `pnpm tsc --noEmit`
Expected: EXIT 0

- [ ] **Step 4: 브라우저 점검**

q2 통과 후 폼 진입 → 입력 필드 좌측 정렬, 카카오 닉네임이 있으면 chip 노출, chip 탭 시 자동 입력 확인. 입력값을 비우면 chip 다시 노출되는지도.

---

## Task 4: LinkShareCard 카피 토스화 + 좌측 정렬 강화

**Files:**

- Modify: `src/components/features/TetoEgen/LinkShareCard.tsx`
- Modify: `src/components/features/TetoEgen/LinkShareCard.module.scss`

**근거**: 토스 011번 "내 입출금통장으로 1원을 옮겼어요" 패턴 — 큰 헤드라인 + 강조 inline blue. H3 공유 카드도 더 풍성한 결과형 카피로.

- [ ] **Step 1: LinkShareCard.tsx 카피 + 강조 처리**

```tsx
'use client';

import { type FC } from 'react';

import CheckIcon from '@/assets/icon/CheckIcon';
import CopyIcon from '@/assets/icon/CopyIcon';
import styles from '@/components/features/TetoEgen/LinkShareCard.module.scss';

type LinkShareCardProps = {
  shareUrl: string;
  onCopy: () => void;
  headline?: string;
  sub?: string;
};

const LinkShareCard: FC<LinkShareCardProps> = ({
  shareUrl,
  onCopy,
  headline = '공유 링크가 준비됐어요',
  sub = '친구들에게 보내고 결과를 받아보세요',
}) => (
  <div className={styles.root}>
    <div className={styles.header}>
      <span className={styles.indicator}>
        <CheckIcon width={14} height={14} />
        <span>생성 완료</span>
      </span>
      <h2 className={styles.headline}>{headline}</h2>
      <p className={styles.sub}>{sub}</p>
    </div>

    <div className={styles.linkBox}>
      <span className={styles.linkText}>{shareUrl}</span>
    </div>

    <button type="button" className={styles.cta} onClick={onCopy}>
      <CopyIcon className={styles.copyIcon} />
      <span className={styles.ctaLabel}>링크 복사하기</span>
    </button>
  </div>
);

export default LinkShareCard;
```

- [ ] **Step 2: LinkShareCard.module.scss — header 좌측 정렬 강화**

기존 SCSS의 `.header`만 수정 (나머지는 그대로):

```scss
.header {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  width: 100%;
  padding: 32px $spacing-24 $spacing-24;
  border-radius: 20px;
  background: linear-gradient(
    160deg,
    rgba(var(--primary-start-rgb), 0.12) 0%,
    rgba(var(--primary-end-rgb), 0.08) 55%,
    rgba($bg-secondary, 0.65) 100%
  );
  border: 1px solid rgba(var(--primary-start-rgb), 0.22);
  overflow: hidden;
  animation: shareFadeUp 0.4s ease-out both;

  &::before {
    content: '';
    position: absolute;
    top: -60px;
    right: -40px;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(var(--primary-end-rgb), 0.18) 0%, transparent 65%);
    pointer-events: none;
    z-index: 0;
  }
}

.headline {
  position: relative;
  z-index: 1;
  margin: 0;
  font-size: $font-size-24;
  font-weight: $font-weight-bold;
  color: $white;
  line-height: 1.35;
  letter-spacing: -0.6px;
  word-break: keep-all;
  text-align: left;
}

.sub {
  position: relative;
  z-index: 1;
  margin: 0;
  font-size: $font-size-14;
  font-weight: $font-weight-medium;
  color: $text-secondary;
  line-height: 1.55;
  letter-spacing: -0.2px;
  word-break: keep-all;
  text-align: left;
}
```

위 3개 selector(`.header`, `.headline`, `.sub`)만 기존 파일에서 찾아 교체. 나머지(`.indicator`, `.linkBox`, `.cta` 등)는 손대지 않음.

- [ ] **Step 3: tsc 통과 확인**

Run: `pnpm tsc --noEmit`
Expected: EXIT 0

- [ ] **Step 4: 브라우저 점검**

이름 입력 후 공유 카드 진입 → 헤드라인이 좌측 정렬로 떨어지는지, 카피가 자연스러운지.

---

## Task 5: ResultHeroCard 헤드라인 호흡 강화

**Files:**

- Modify: `src/components/features/TetoEgen/ResultHeroCard.tsx`
- Modify: `src/components/features/TetoEgen/ResultHeroCard.module.scss`

**근거**: 이미 좌측 정렬 OK. 토스 011 패턴(헤드라인 강조어 inline 강조 + 큰 호흡)으로 한 단계 더.

- [ ] **Step 1: ResultHeroCard.tsx 헤드라인 카피 다듬기**

`displayName` 처리를 더 자연스럽게:

```tsx
'use client';

import { type FC } from 'react';

import CheckIcon from '@/assets/icon/CheckIcon';
import ShareIcon from '@/assets/icon/ShareIcon';
import SparkleIcon from '@/assets/icon/SparkleIcon';
import styles from '@/components/features/TetoEgen/ResultHeroCard.module.scss';

type ResultHeroCardProps = {
  variant: 'hit' | 'miss' | 'empty';
  majorityAnswer?: 'TETO' | 'EGEN';
  majorityPercent?: number;
  totalFriends?: number;
  majorityCount?: number;
  displayName?: string;
};

const labelOf = (a?: 'TETO' | 'EGEN') => (a === 'TETO' ? '테토' : a === 'EGEN' ? '에겐' : '');

const ResultHeroCard: FC<ResultHeroCardProps> = ({
  variant,
  majorityAnswer,
  majorityPercent,
  totalFriends,
  majorityCount,
  displayName,
}) => {
  if (variant === 'empty') {
    return (
      <section className={styles.root}>
        <span className={styles.indicator}>
          <ShareIcon className={styles.indicatorIcon} />
          <span>공유 대기</span>
        </span>
        <h1 className={styles.headline}>
          아직 친구가
          <br />
          평가하지 않았어요
        </h1>
        <p className={styles.summary}>친구들에게 공유하고 결과를 받아보세요</p>
      </section>
    );
  }

  const isHit = variant === 'hit';
  const subject = displayName ? `${displayName}님` : '나';

  return (
    <section className={styles.root}>
      <span className={`${styles.indicator} ${isHit ? styles.indicatorHit : ''}`}>
        {isHit ? (
          <CheckIcon width={14} height={14} />
        ) : (
          <SparkleIcon className={styles.indicatorIcon} />
        )}
        <span>{isHit ? '적중' : '의외'}</span>
      </span>
      <h1 className={styles.headline}>
        친구들은 {subject}을
        <br />
        <strong>{labelOf(majorityAnswer)}</strong>로 봤어요
      </h1>
      <p className={styles.summary}>
        총 {totalFriends}명 중 {majorityCount}명이 같은 답을 골랐어요
      </p>
      <div className={styles.bigNumberRow}>
        <span className={styles.bigNumber}>{majorityPercent}</span>
        <span className={styles.bigUnit}>%</span>
        <span className={styles.bigLabel}>· {labelOf(majorityAnswer)}</span>
      </div>
    </section>
  );
};

export default ResultHeroCard;
```

- [ ] **Step 2: ResultHeroCard.module.scss 호흡 강화**

`.root` padding과 `.headline` line-height만 조정 (나머지 그대로):

```scss
.root {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 32px $spacing-24 $spacing-24;
  border-radius: 20px;
  background: linear-gradient(
    160deg,
    rgba(var(--primary-start-rgb), 0.12) 0%,
    rgba(var(--primary-end-rgb), 0.08) 55%,
    rgba($bg-secondary, 0.65) 100%
  );
  border: 1px solid rgba(var(--primary-start-rgb), 0.22);
  overflow: hidden;
  animation: heroFadeUp 0.4s ease-out both;

  &::before {
    content: '';
    position: absolute;
    top: -60px;
    right: -40px;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(var(--primary-end-rgb), 0.18) 0%, transparent 65%);
    pointer-events: none;
    z-index: 0;
  }
}

.headline {
  position: relative;
  z-index: 1;
  margin: 0;
  font-size: $font-size-24;
  font-weight: $font-weight-bold;
  color: $white;
  line-height: 1.35;
  letter-spacing: -0.6px;
  word-break: keep-all;
  animation: heroFadeUp 0.45s ease-out 0.05s both;

  strong {
    color: $white;
    font-weight: $font-weight-bold;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
  }
}
```

위 두 selector만 교체. `<strong>`에 inline gradient 적용 — 토스 011 "내 입출금통장으로" 강조어 inline blue 패턴 차용. 단 토스는 단색 blue, H3는 brand gradient.

- [ ] **Step 3: tsc 통과 확인**

Run: `pnpm tsc --noEmit`
Expected: EXIT 0

- [ ] **Step 4: 브라우저 점검**

`/ask/teto-egen/my?mock=hit`, `?mock=miss`, `?mock=empty` 세 변형 모두 헤드라인 2줄 호흡 + 강조어 gradient 확인.

---

## Task 6: SelfPredictionRow 4-column key/value 패턴 강화

**Files:**

- Modify: `src/components/features/TetoEgen/SelfPredictionRow.module.scss`

**근거**: 토스 004번 "예상 최대 한도 / 5,602만원 │ 예상 금리 / 4.08%" 카드 패턴. 이미 비슷하지만 라벨 톤·정렬을 더 토스스럽게.

- [ ] **Step 1: SelfPredictionRow.module.scss 라벨/값 톤 정리**

```scss
@use '@/styles/variables' as *;

@keyframes selfPredictionFadeUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.root {
  display: flex;
  align-items: stretch;
  gap: $spacing-16;
  padding: $spacing-16;
  background: rgba($bg-secondary, 0.6);
  backdrop-filter: blur(16px);
  border: 1px solid rgba($white, 0.06);
  border-radius: $border-radius-lg;
  animation: selfPredictionFadeUp 0.5s ease-out 0.15s both;
}

.cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}

.divider {
  width: 1px;
  background: rgba($white, 0.06);
}

.label {
  font-size: $font-size-12;
  font-weight: $font-weight-medium;
  color: $text-tertiary;
  letter-spacing: -0.1px;
}

.chip {
  display: inline-flex;
  align-items: center;
  font-size: $font-size-18;
  font-weight: $font-weight-bold;
  color: $white;
  letter-spacing: -0.4px;
}
```

핵심 변경: `.label`을 uppercase/letter-spacing 0.6 톤(이전 1차 정렬) → 토스 004번 라벨 톤(소문자, weight 500, color text-tertiary). `.chip`을 알약 박스 → 그냥 큰 텍스트(토스 004 "5,602만원" 패턴).

- [ ] **Step 2: tsc 통과 확인**

Run: `pnpm tsc --noEmit`
Expected: EXIT 0

- [ ] **Step 3: 브라우저 점검**

결과 화면(`?mock=hit`)에서 SelfPredictionRow가 더 차분한 토스 결과 카드 톤으로 떨어지는지 확인.

---

## Task 7: MyResultView shareArea에 secondary 액션 "닫기" 추가

**Files:**

- Modify: `src/components/features/TetoEgen/MyResultView.tsx`
- Modify: `src/components/features/TetoEgen/MyResultView.module.scss`

**근거**: 토스 004, 005, 008번 모두 메인 CTA 아래 "다음에 하기", "닫기" secondary 텍스트 액션. H3 결과 화면에도 "홈으로 돌아가기" secondary 액션 추가.

- [ ] **Step 1: MyResultView.tsx에 secondary 액션 추가**

기존 `shareArea` 블록을 찾아 buttom 아래 secondary action 추가:

```tsx
import { useRouter } from 'next/navigation';
// ...

// (기존 useRouter 이미 있음)

// shareArea 블록만 교체
<div className={styles.shareArea}>
  <div className={styles.linkBox}>
    <span className={styles.linkText}>{data.shareUrl}</span>
  </div>
  <button type="button" className={styles.cta} onClick={handleCopy}>
    <CopyIcon className={styles.copyIcon} />
    <span className={styles.ctaLabel}>링크 복사하기</span>
  </button>
  <button type="button" className={styles.secondaryAction} onClick={() => router.push('/')}>
    홈으로 돌아가기
  </button>
</div>;
```

- [ ] **Step 2: MyResultView.module.scss에 `.secondaryAction` 추가**

기존 SCSS 끝에 추가:

```scss
.secondaryAction {
  align-self: center;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: $text-tertiary;
  font-size: $font-size-14;
  font-weight: $font-weight-medium;
  letter-spacing: -0.2px;
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover {
    color: $text-secondary;
  }
}
```

- [ ] **Step 3: tsc 통과 확인**

Run: `pnpm tsc --noEmit`
Expected: EXIT 0

- [ ] **Step 4: 브라우저 점검**

`/ask/teto-egen/my?mock=hit` 화면 하단 "링크 복사하기" 아래 "홈으로 돌아가기" secondary 액션 확인. 클릭 시 홈 이동.

---

## Task 8: FriendAnswersCollapse toggle 좌측 정렬 보강

**Files:**

- Modify: `src/components/features/TetoEgen/FriendAnswersCollapse.module.scss`

**근거**: 1차 정렬에서 toggle은 이미 좌측 텍스트 + 우측 chevron. 토스 톤으로 letter-spacing/weight 미세 조정 정도.

- [ ] **Step 1: `.toggleText`만 미세 조정**

```scss
.toggleText {
  font-size: $font-size-14;
  font-weight: $font-weight-semibold;
  letter-spacing: -0.2px;
  color: inherit;
}
```

이미 비슷하므로 letter-spacing 1px 줄이고 color inherit 명시. 큰 변경 없음.

- [ ] **Step 2: tsc 통과 확인**

Run: `pnpm tsc --noEmit`
Expected: EXIT 0

---

## Task 9: 1차 정렬 노트에 2차 작업 완료 기록 추가

**Files:**

- Modify: `docs/superpowers/specs/2026-04-26-h3-visual-alignment-notes.md`

**근거**: 인수인계 노트의 "변경 이력" 섹션에 2차 토스 톤 적용 완료를 남긴다. 다음 결이 헷갈리지 않도록.

- [ ] **Step 1: 노트 끝에 2차 작업 기록 추가**

`docs/superpowers/specs/2026-04-26-h3-visual-alignment-notes.md` 파일 맨 아래 `## 변경 이력` 섹션에 한 줄 추가:

```markdown
- 2026-04-26 (2차): 토스 캡처 16장 분석 후 H3 전 화면에 좌측 정렬 헤드라인·자동완성 chip·큰 호흡·secondary 액션 적용. 상세 plan: `docs/superpowers/plans/2026-04-26-h3-toss-tone-application.md`
```

기존 문서를 통째로 갈아엎지 말고 마지막 줄 뒤에 추가만.

- [ ] **Step 2: 커밋**

```bash
git add src/components/features/TetoEgen/ docs/superpowers/specs/2026-04-26-h3-visual-alignment-notes.md docs/superpowers/plans/2026-04-26-h3-toss-tone-application.md
git commit -m "feat(ask-teto-egen): apply Toss tone (left-align headlines, autofill chip, secondary actions)

H3 2차 시각 정렬. 토스 캡처 16장 분석 후 좌측 정렬 헤드라인·자동완성 chip·큰 호흡·secondary 액션 패턴을 부분 차용.

- LandingHero: eyebrow 칩 제거, 좌측 정렬, 상단 padding 64px
- BinaryChoiceCard: 헤드라인 좌측 정렬 + helper prop 활용
- LinkGenerateForm: 카카오 닉네임 자동완성 chip + 입력 좌측 정렬
- LinkShareCard: header 좌측 정렬 + 카피 토스화
- ResultHeroCard: 헤드라인 강조어 inline gradient + line-height 1.35
- SelfPredictionRow: label/value 패턴(토스 004번) 톤 정리
- MyResultView: shareArea에 '홈으로 돌아가기' secondary 액션 추가

Refs: docs/superpowers/plans/2026-04-26-h3-toss-tone-application.md"
```

---

## Task 10: 사용자 점검 요청 + 리뷰어 제안

- [ ] **Step 1: 전체 흐름 통과 점검**

`pnpm start` 후:

1. `https://local-hotpick.votebox.kr/ask/teto-egen` — 랜딩 좌측 정렬, eyebrow 제거 확인
2. "시작하기" → q1 → 좌측 정렬 헤드라인 + helper 확인
3. q1 답 후 → q2 → 좌측 정렬 헤드라인 + helper 확인
4. q2 답 후 → 폼 → 좌측 정렬 + 카카오 닉네임 chip 확인
5. 이름 입력 → 링크 생성 → 공유 카드 좌측 정렬 + "공유 링크가 준비됐어요" 카피 확인
6. `/ask/teto-egen/my?mock=hit`, `?mock=miss`, `?mock=empty` — 헤드라인 inline gradient 강조어, "홈으로 돌아가기" secondary 액션 확인

- [ ] **Step 2: 리뷰어 제안**

사용자에게:

> "토스 톤 2차 적용 완료. `hp-ux-reviewer`와 `hp-ui-reviewer`를 병렬로 호출해 셀프체크 돌릴까요?"

승인받으면 Task 도구로 두 서브에이전트 병렬 호출:

```
Task(subagent_type="hp-ux-reviewer", description="UX 리뷰", prompt="H3 토스 톤 2차 적용 결과 리뷰. 변경 파일은 src/components/features/TetoEgen/* 7개. plan: docs/superpowers/plans/2026-04-26-h3-toss-tone-application.md")
Task(subagent_type="hp-ui-reviewer", description="UI 리뷰", prompt="H3 토스 톤 2차 적용 결과 리뷰. 좌측 정렬·자동완성 chip·secondary 액션·강조어 inline gradient가 다크모드 규칙·토큰 준수 안에서 제대로 작동하는지 확인.")
```

---

## Self-Review

**1. Spec coverage**: 분석 요약 표의 7가지 Apply 패턴이 모두 Task에 반영되었는가?

- [x] 좌측 정렬 헤드라인 → Task 1, 2, 3, 4, 5
- [x] 자연스러운 의문형 카피 → Task 1 (랜딩 sub), Task 2 (helper), Task 4 (공유 카피)
- [x] 큰 헤드라인 호흡 → Task 1 (padding 64px), Task 2 (padding-top 48px), Task 5 (padding 32px / line-height 1.35)
- [x] 자동완성 chip → Task 3
- [x] 4-column key/value 결과 카드 → Task 6
- [x] CTA 아래 secondary 액션 → Task 7 (Task 3의 .notice는 이미 있음)
- [x] 헤드라인 위 큰 빈 공간 → Task 1 (padding 64px), Task 2 (padding-top 48px)

**2. Skip 확인**: 가져오지 않을 4가지가 plan에 들어가지 않았는가?

- [x] 토스 블루 단색 CTA → 어디에도 없음, primary gradient 유지
- [x] 체크리스트형 미니멀 옵션 → BinaryChoiceCard 큰 카드 유지
- [x] 하단 sticky CTA → 모든 CTA inline 유지
- [x] 반원 게이지 / 3D 코인 → 어디에도 없음

**3. Placeholder scan**: TODO/TBD/"appropriate"/"similar to Task N" 등 없음. 모든 Step에 실제 코드 또는 명령 포함.

**4. Type consistency**:

- `displayName` prop 타입 string (모든 Task에서 일관)
- `selfAnswer`, `selfPrediction` `'TETO' | 'EGEN'` (Task 3에서 변경 없음)
- `onClose` 콜백은 사용 안 함, `useRouter().push('/')` 직접 사용 (Task 7)

**5. 의존성**: Task 1~8은 모두 독립적으로 진행 가능 (서로 다른 파일). Task 9, 10은 모든 Task 완료 후 마지막에.

**6. 1차 정렬 약속 충돌 검토**:

- 1차에서 BundlePlay 패턴(CTA `$border-radius-lg`, `padding 18`, weight 600, shimmer)을 따르기로 합의 → 2차에서 그대로 유지 ✓
- 1차에서 `.activated` border-only 패턴 → 2차 BinaryChoiceCard에서 그대로 유지 ✓
- 1차에서 모든 카드 `rgba+blur` 톤 → 2차에서 BinaryChoiceCard만 `$bg-secondary` solid (Bundle/Play 패턴) 유지, 나머지는 rgba+blur ✓

---

## 변경 이력

- 2026-04-26: 초안 작성. 토스 캡처 16장 분석 후 7가지 Apply / 4가지 Skip 결정. 10개 Task로 분해.
