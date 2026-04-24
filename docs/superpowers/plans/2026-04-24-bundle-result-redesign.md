# 번들 비교 결과 페이지 재설계 (MyResultView) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 `FullGroupResultView`를 대체하는 `MyResultView` 신규 라우팅을 추가하고, 훈장 3단 / Canvas 궤도(헤일메리) / 소수답 Top 3 / 공유 카드 4개 섹션으로 "나" 중심 바이럴 구조를 구현한다.

**Architecture:** 기존 `FullGroupResultView`는 보존하고 `GroupResult.tsx` 라우터에서 렌더 대상을 `MyResultView`로 전환. Layer 1은 훈장·궤도·소수답으로 "나"를 선언적으로 표현, Layer 2는 기존 컴포넌트(`GroupAwards` 확장, `PickASide`, 성별 섹션) 재사용, Layer 3는 전체 멤버 자세히보기 토글. 궤도는 Canvas 2D로 구현하고 `ShareCardCanvas`가 같은 그리기 로직을 재사용해 공유 카드 PNG를 만든다.

**Tech Stack:** Next.js 14 App Router · TypeScript strict · SCSS Modules · React Query v5 · Canvas 2D API

---

## File Structure

### 신규 생성 파일

- `src/components/features/Compare/MyResultView/MyResultView.tsx` — 최상위 뷰
- `src/components/features/Compare/MyResultView/MyResultView.module.scss`
- `src/components/features/Compare/MyResultView/MyMedalSection.tsx` — 훈장 3단
- `src/components/features/Compare/MyResultView/MyMedalSection.module.scss`
- `src/components/features/Compare/MyResultView/OrbitMap/OrbitMap.tsx` — Canvas 궤도
- `src/components/features/Compare/MyResultView/OrbitMap/OrbitMap.module.scss`
- `src/components/features/Compare/MyResultView/OrbitMap/orbit-draw.ts` — 공유 가능한 그리기 함수
- `src/components/features/Compare/MyResultView/OrbitMap/orbit-hint.ts` — 첫방문 힌트 localStorage 헬퍼
- `src/components/features/Compare/MyResultView/MyExtremeAnswersSection.tsx` — 소수답 Top 3
- `src/components/features/Compare/MyResultView/MyExtremeAnswersSection.module.scss`
- `src/components/features/Compare/MyResultView/CaptureButton.tsx` — "결과 캡처" 단일 버튼 (Layer 1 내부)
- `src/components/features/Compare/MyResultView/CaptureButton.module.scss`
- `src/components/features/Compare/MyResultView/ShareCardCanvas.ts` — off-screen canvas 1024×1792 렌더러 (순수 함수)
- `src/components/features/Compare/MyResultView/MemberMoreSection.tsx` — Layer 3 "모든 멤버 결과 자세히 보기" 펼침
- `src/components/features/Compare/MyResultView/MemberMoreSection.module.scss`
- `src/constants/bundle-persona-labels.ts` — 번들별 성향 라벨 마스터
- `src/constants/my-medals.ts` — 훈장 우선순위 계산 유틸 (`getMyMedals`)
- `src/constants/my-extreme-answers.ts` — 소수답 Top 3 추출 유틸 (`getMyExtremeAnswers`)

### 수정 파일

- `src/components/features/Compare/GroupResult/GroupResult.tsx` — `FullGroupResultView` → `MyResultView`로 스위치
- `src/components/features/Compare/GroupResult/LockedSectionPreview.tsx` — `sketchType`에 `'orbit-map'`, `'my-medal'`, `'my-extreme'` 추가
- `src/components/features/Compare/GroupResult/LockedSectionPreview.module.scss` — 필요 시 신규 스케치 스타일 추가
- `src/components/features/Compare/GroupResult/GroupAwards.tsx` — `excludeUserId` prop 추가, `VISIBLE_AWARDS` 확장 옵션

---

## Self-Review (작성 후 체크)

### Spec coverage (스펙 → 태스크 매핑)

| 스펙 섹션                                        | 태스크                                              |
| ------------------------------------------------ | --------------------------------------------------- |
| Hero(그룹명/메타/Stats)                          | Task 1 (MyResultView 골격)                          |
| Layer 1 선언 타이틀 (파트너 포함형)              | Task 3 (MyMedalSection)                             |
| 훈장 3단 (TOP/케미/성향)                         | Task 2 + Task 3 + Task 10                           |
| TOP 수상 우선순위 + 부정 뉘앙스 제외             | Task 2                                              |
| 궤도 Canvas 540px                                | Task 4 + Task 5 + Task 6                            |
| 궤도 상호작용(드래그/줌/탭)                      | Task 6                                              |
| 첫방문 힌트 톤다운 ("탭해서 자세히 보기")        | Task 6                                              |
| 소수답 Top 3 + 엠프티 조건 숨김                  | Task 7                                              |
| 결과 캡처 단일 버튼 + ShareCardCanvas            | Task 8 + Task 9                                     |
| FloatingCta "공유하기" 라벨 변경                 | Task 1 (Hero/CTA 복제 시점에 처리)                  |
| Layer 2 (GroupAwards 필터/PickASide/성별)        | Task 11                                             |
| Layer 3 펼침                                     | Task 12                                             |
| 비멤버 Layer 1만 잠금 / Layer 2 공개 / 캡처 숨김 | Task 13                                             |
| 참여자 1명 잠김 프리뷰                           | Task 14 (`orbit-map` sketch 포함)                   |
| 성향 라벨 최대 8자                               | Task 10                                             |
| 로딩/실패 상태                                   | GroupResult.tsx 기존 분기 재사용 (Task 15에서 확인) |
| Fallback 이미지 (Canvas 실패)                    | Task 5                                              |
| `BundleRecommendSection`                         | Task 1                                              |

### 타입 일관성

- `Member`(궤도 노드용): `{ userId: string; nickname: string; matchRate: number; profileColor?: string }` — `MyResultView`에서 한 번 계산해 `OrbitMap`에 전달.
- `getMyMedals(awards, currentUserId, result)` → `{ top, chemistryPartner, personaLabel }`.
- `getMyExtremeAnswers(result, currentUserId)` → `Array<{ electionId; questionTitle; myOptionTitle; pickedCount; totalCount }>`.

### Placeholder scan

본 플랜에는 "TBD", "적절히 처리", "유사하게" 등의 플레이스홀더 없음. 모든 스텝에 코드/명령어 포함.

---

## Task 1 · `MyResultView` 골격 + 라우팅 스위치

**Files:**

- Create: `src/components/features/Compare/MyResultView/MyResultView.tsx`
- Create: `src/components/features/Compare/MyResultView/MyResultView.module.scss`
- Modify: `src/components/features/Compare/GroupResult/GroupResult.tsx:59` (렌더 대상 교체)

**의도:** 기존 `FullGroupResultView`와 동일한 데이터 훅/모달 조립을 그대로 옮겨오되, 본문 섹션 부분만 비워두고 이후 태스크에서 채운다. 이 단계에서도 페이지가 정상 동작해야 한다(블랭크 섹션 OK).

**스펙 변경(2026-04-25) 반영 포인트:**

- `FloatingCta` 멤버 모드 라벨을 **"친구들 초대하기" → "공유하기"** 로 변경(동작은 `handleCopyInvite` 그대로).
- 멤버 모드 `Toast` 메시지도 "초대 링크가 복사되었어요" 유지(카피 원칙 유지).

- [ ] **Step 1: `MyResultView.tsx` 골격 작성 (데이터 훅 + Hero + FloatingCta + 모달/시트)**

기존 `FullGroupResultView.tsx`를 기반으로 본문 섹션만 플레이스홀더로 둔 복제본을 만든다. 아래 구조를 그대로 사용:

```tsx
'use client';

import { useEffect, useMemo, useState, type FC } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import LinkIcon from '@/assets/icon/LinkIcon';
import PlusIcon from '@/assets/icon/PlusIcon';
import SettingsIcon from '@/assets/icon/SettingsIcon';
import { BundleRecommendSection } from '@/components/common/BundleRecommendSection/BundleRecommendSection';
import { CategoryBadge } from '@/components/common/CategoryBadge/CategoryBadge';
import { FloatingCta } from '@/components/common/FloatingCta/FloatingCta';
import { SmartBackButton } from '@/components/common/SmartBackButton/SmartBackButton';
import { Toast } from '@/components/common/Toast/Toast';
import { BundleBackground } from '@/components/features/Bundle/BundleBackground/BundleBackground';
import { CreateCompareLink } from '@/components/features/Bundle/BundleResult/CreateCompareLink';
import { MemberDetailSheet } from '@/components/features/Compare/CompareResult/MemberDetailSheet';
import { DisplayNameModal } from '@/components/features/Compare/DisplayNameModal/DisplayNameModal';
import {
  GroupSettingsModal,
  type GroupSettings,
} from '@/components/features/Compare/GroupSettingsModal/GroupSettingsModal';
import { MyCompareLinksSheet } from '@/components/features/Compare/MyCompareLinksSheet/MyCompareLinksSheet';
import {
  calcAllPairChemistry,
  calcGroupAwards,
  calcGroupSyncRate,
} from '@/constants/group-compare';
import { WITHDRAWN_NICKNAME } from '@/constants/profileColors';
import { useAuth } from '@/contexts/AuthContext';
import {
  compareKeys,
  useCompareLink,
  useGroupCompareResult,
  useJoinCompareLink,
  useUpdateGroupSettings,
  useUpdateMyGroupProfile,
} from '@/hooks/api/useCompare';
import { useMyCompareLinks } from '@/hooks/api/useMyCompareLinks';
import { useToast } from '@/hooks/useToast';
import { trackGroupResult } from '@/lib/analytics';

import styles from './MyResultView.module.scss';

interface MyResultViewProps {
  token: string;
}

export const MyResultView: FC<MyResultViewProps> = ({ token }) => {
  // === FullGroupResultView.tsx:76-167 와 동일한 훅/상태/useMemo/계산 ===
  // useGroupCompareResult / useCompareLink / useJoinCompareLink / useUpdateGroupSettings
  // / useUpdateMyGroupProfile / useAuth / useRouter / useSearchParams / useQueryClient
  // / useToast / useMyCompareLinks
  // 모달 상태 6개 (showCreateModal, showEditProfileModal, showSettingsModal,
  // showDisplayNameModal, showLinksSheet, memberSheetUserId)
  // joinAfter useEffect, GA4 useEffect, displayResult/groupSyncRate/pairs/awards useMemo
  // handleSaveSettings / handleEditProfileConfirm / handleMemberCompare / handleJoin
  // / handleDisplayNameConfirm / handleCopyInvite — 모두 그대로 복제
  //
  // currentUserId / members / isMember / participantCount / singleMember / isCreator / myMember / myGroupLinks 도 동일

  if (!result || !displayResult) {
    return null;
  }

  return (
    <BundleBackground categoryCode={result.categoryCode} categoryMeta={result.categoryMeta}>
      <div className={styles.container}>
        {/* Hero — FullGroupResultView.tsx:250-309 와 동일 */}
        <div className={styles.heroSection}>{/* groupNameRow, bundleTitle, heroStats */}</div>

        {/* Layer 1 — 이후 태스크에서 채움 */}
        <section className={styles.layer1} aria-label="나의 결과">
          {/* MyMedalSection (Task 3) */}
          {/* OrbitMap (Task 4~6) */}
          {/* MyExtremeAnswersSection (Task 7) */}
          {/* CaptureButton (Task 8) */}
        </section>

        {/* Layer 2 — 이후 태스크에서 채움 (Task 11) */}
        <section className={styles.layer2} aria-label="나머지 지표"></section>

        {/* Layer 3 — 이후 태스크에서 채움 (Task 12) */}

        {/* 멤버 CTA (기존 유지) — FullGroupResultView.tsx:411-430 */}
        {isMember && (
          <div className={styles.ctaSection}>{/* 새 비교링크 만들기 + 참여중 링크 버튼 */}</div>
        )}

        <BundleRecommendSection
          currentSlug={result.bundleSlug ?? ''}
          contextName={result.groupName ?? undefined}
        />
      </div>

      {/* FloatingCta — 멤버 모드 라벨을 "공유하기"로 변경.
          동작은 FullGroupResultView.tsx:438-445의 handleCopyInvite 그대로.
          비멤버 모드는 "나도 참여하기" 유지. */}
      {/* MemberDetailSheet / CreateCompareLink / DisplayNameModal ×2 /
          GroupSettingsModal / MyCompareLinksSheet / Toast — 동일 */}
    </BundleBackground>
  );
};
```

작성 팁: 실제 복제 시 빠진 조각이 없도록 `FullGroupResultView.tsx:1-513`을 줄 단위로 훑으며 옮긴다. 본문 섹션만 Layer 1/2/3 플레이스홀더로 치환.

- [ ] **Step 2: `MyResultView.module.scss` 생성**

초기에는 기존 `GroupResult.module.scss`를 import해서 Hero/ctaSection 스타일을 재사용한다. 신규 추가 스타일만 본 파일에 둔다.

```scss
@use '@/styles/variables' as *;
@use '@/components/features/Compare/GroupResult/GroupResult.module.scss' as gr;

// 본 컴포넌트에서만 쓰는 래퍼 스타일 — Hero 등 기존 스타일은 :global() wrapping 없이
// GroupResult.module.scss 의 클래스를 그대로 JSX에 꽂아 쓴다.
// (SCSS Modules는 import 해도 자동 inject가 아니므로, JSX에서는
//  `import grStyles from '.../GroupResult.module.scss'` 를 사용해
//  `grStyles.heroSection` 을 그대로 참조하도록 한다.)

.layer1 {
  display: flex;
  flex-direction: column;
  gap: $spacing-24;
  margin-bottom: $spacing-32;
}

.layer2 {
  display: flex;
  flex-direction: column;
  gap: $spacing-24;
  margin-bottom: $spacing-32;
}
```

`MyResultView.tsx` 상단에서 `import grStyles from '@/components/features/Compare/GroupResult/GroupResult.module.scss';` 형태로 기존 스타일을 가져와 JSX에 같이 사용.

- [ ] **Step 3: `GroupResult.tsx` 렌더 대상 교체**

수정 대상: `src/components/features/Compare/GroupResult/GroupResult.tsx:6`, `59`

```tsx
// before
import { FullGroupResultView } from '@/components/features/Compare/GroupResult/FullGroupResultView';
// ...
return <FullGroupResultView token={token} />;

// after
import { MyResultView } from '@/components/features/Compare/MyResultView/MyResultView';
// ...
return <MyResultView token={token} />;
```

`FullGroupResultView.tsx` 파일 자체는 삭제하지 않고 남긴다(스펙 Q5 결정).

- [ ] **Step 4: FloatingCta 멤버 라벨을 "공유하기"로 설정**

복제한 JSX에서 아래와 같이 적용 — `FullGroupResultView.tsx:439-445`의 `handleCopyInvite` 동작은 그대로 유지하고 라벨만 변경.

```tsx
{
  isMember ? (
    <FloatingCta onClick={handleCopyInvite}>공유하기</FloatingCta>
  ) : (
    <FloatingCta onClick={handleJoin} disabled={joinMutation.isPending}>
      {joinCtaText}
    </FloatingCta>
  );
}
```

`handleCopyInvite`의 토스트 메시지("초대 링크가 복사되었어요")는 Q4 원칙에 따라 그대로 유지.

- [ ] **Step 5: 타입·린트·빌드 확인**

```bash
pnpm run lint && pnpm exec tsc --noEmit
```

기대: 오류 없음. `FullGroupResultView`는 unused import가 되므로 `GroupResult.tsx`에서 참조가 완전히 빠졌는지 확인. (다른 파일에서 참조 중이면 남겨두되, 본 태스크에서는 참조 없는 상태가 정답.)

- [ ] **Step 6: 개발 서버로 수동 확인**

```bash
pnpm dev
```

`/compare/group/<token>` 접속 → Hero + FloatingCta("공유하기" 라벨) + 모달 동작만 정상이면 통과. Layer 1/2/3은 비어 있어야 한다. "공유하기" 클릭 시 링크 복사 + 기존 토스트 노출 확인.

- [ ] **Step 7: 커밋**

```bash
git add src/components/features/Compare/MyResultView/ \
        src/components/features/Compare/GroupResult/GroupResult.tsx
git commit -m "feat(compare): add MyResultView skeleton and switch GroupResult router"
```

---

## Task 2 · 훈장 우선순위 유틸 `getMyMedals`

**Files:**

- Create: `src/constants/my-medals.ts`

**의도:** 내가 수상한 어워드 목록에서 TOP/케미 파트너/성향 라벨 3단을 결정하는 순수 함수를 만든다. 스펙(2026-04-25 업데이트)의 우선순위 + 부정 뉘앙스 제외 + "케미 파트너 TOP과 중복 방지" 규칙 반영.

- [ ] **Step 1: `my-medals.ts` 작성**

```ts
// src/constants/my-medals.ts
import type { GroupAward, GroupAwardType } from '@/types/group-compare';

/**
 * TOP 슬롯 우선순위 (2026-04-25 스펙).
 *
 * 중립-긍정 뉘앙스 어워드만 노출 — 공유 거부 방지.
 * CONTROVERSY_MAKER(트러블 메이커), GROUP_OUTSIDER(그룹 이단아)는 부정 뉘앙스로 제외.
 * 제외된 어워드는 Layer 2 GroupAwards에서만 노출된다.
 */
const TOP_PRIORITY: GroupAwardType[] = [
  'SOUL_CONNECTION', // 소울 메이트 — 2명+ 발동, 파트너 이름 포함으로 2차 공유 트리거
  'PEOPLES_CHAMPION', // 대중의 왕
  'GROUP_LEADER', // 그룹 대장
  'POLAR_OPPOSITES', // 극과 극 — 중립 뉘앙스로 간주
];

/** TOP 수상 후보에서 영구 제외되는 어워드 타입 */
const TOP_EXCLUDED: GroupAwardType[] = ['CONTROVERSY_MAKER', 'GROUP_OUTSIDER'];

/**
 * 케미 파트너 슬롯 우선순위.
 * 스펙(2026-04-25): SOUL_CONNECTION을 기본 노출, TOP과 중복 시 POLAR_OPPOSITES로 대체.
 * POLAR_OPPOSITES도 중복이면 슬롯을 비운다.
 */
const PAIR_PRIORITY: GroupAwardType[] = ['SOUL_CONNECTION', 'POLAR_OPPOSITES'];

export interface MyMedal {
  awardType: GroupAwardType | 'PERSONA_LABEL' | 'TOP_FALLBACK';
  title: string;
  oneLiner: string;
  partnerNickname?: string;
}

export interface MyMedals {
  /** 1단: primary (그라디언트 보더) — 반드시 존재 */
  top: MyMedal;
  /** 2단: 케미 파트너 — TOP이 SOUL_CONNECTION인 경우 등 중복 시 null */
  chemistryPartner: MyMedal | null;
  /** 3단: 성향 라벨 (폴백, 항상 존재) */
  personaLabel: MyMedal;
}

/**
 * 특정 award의 winners에서 currentUserId를 제외한 파트너 닉네임을 돌려준다.
 * 쌍 어워드는 winners가 정확히 2개라고 가정.
 */
function findPartnerNickname(award: GroupAward, currentUserId: string): string | undefined {
  const idx = award.winners.findIndex((id) => id !== currentUserId);
  return idx >= 0 ? award.winnerNicknames[idx] : undefined;
}

function toMedal(award: GroupAward, currentUserId: string): MyMedal {
  const partner = findPartnerNickname(award, currentUserId);
  return {
    awardType: award.type,
    title: award.title,
    oneLiner: award.oneLiner,
    partnerNickname: partner,
  };
}

/**
 * 수상 어워드 기반 훈장 3단 계산.
 *
 * 규칙(2026-04-25 스펙):
 * - TOP: TOP_PRIORITY 순서로 내가 winners에 포함된 첫 어워드. TOP_EXCLUDED는 후보에서 제외.
 *   없으면 personaLabel을 TOP 자리로 승격(TOP_FALLBACK 마커).
 * - chemistryPartner: PAIR_PRIORITY 순서, 단 TOP과 같은 awardType은 스킵.
 * - personaLabel: 호출자가 넘긴 값 그대로.
 */
export function getMyMedals(
  awards: GroupAward[],
  currentUserId: string,
  personaLabel: MyMedal
): MyMedals {
  const mine = awards.filter((a) => a.winners.includes(currentUserId));

  const topAward =
    TOP_PRIORITY.map((t) => mine.find((a) => a.type === t && !TOP_EXCLUDED.includes(a.type))).find(
      Boolean
    ) ?? null;

  const top: MyMedal = topAward
    ? toMedal(topAward, currentUserId)
    : { ...personaLabel, awardType: 'TOP_FALLBACK' };

  // TOP과 중복 방지
  const pairAward =
    PAIR_PRIORITY.map((t) => mine.find((a) => a.type === t && a.type !== topAward?.type)).find(
      Boolean
    ) ?? null;

  const chemistryPartner: MyMedal | null = pairAward ? toMedal(pairAward, currentUserId) : null;

  return { top, chemistryPartner, personaLabel };
}

/** TOP이 폴백(성향 라벨)으로 채워졌는지 여부 */
export function isTopFallback(medals: MyMedals): boolean {
  return medals.top.awardType === 'TOP_FALLBACK';
}
```

- [ ] **Step 2: 타입·린트 체크**

```bash
pnpm exec tsc --noEmit
```

기대: 오류 없음.

- [ ] **Step 3: 커밋**

```bash
git add src/constants/my-medals.ts
git commit -m "feat(compare): add getMyMedals utility for medal 3-tier layout"
```

---

## Task 3 · `MyMedalSection` 구현

**Files:**

- Create: `src/components/features/Compare/MyResultView/MyMedalSection.tsx`
- Create: `src/components/features/Compare/MyResultView/MyMedalSection.module.scss`
- Modify: `src/components/features/Compare/MyResultView/MyResultView.tsx` (Layer 1 플레이스홀더에 마운트)

**의도:** 선언 타이틀 + 훈장 카드 3단을 렌더. 성향 라벨은 Task 10에서 실제 계산으로 교체하므로 지금은 하드코딩 stub을 사용한다.

- [ ] **Step 1: `MyMedalSection.tsx` 작성**

```tsx
'use client';

import { type FC } from 'react';

import { getMyMedals, type MyMedal, type MyMedals } from '@/constants/my-medals';
import type { GroupAward } from '@/types/group-compare';

import styles from './MyMedalSection.module.scss';

interface MyMedalSectionProps {
  myNickname: string;
  awards: GroupAward[];
  currentUserId: string;
  /** 성향 라벨 — Task 10에서 bundleSlug 기반 계산으로 교체 */
  personaLabel: MyMedal;
}

export const MyMedalSection: FC<MyMedalSectionProps> = ({
  myNickname,
  awards,
  currentUserId,
  personaLabel,
}) => {
  const medals: MyMedals = getMyMedals(awards, currentUserId, personaLabel);

  // 스펙(2026-04-25): 파트너 이름 포함형 선언 타이틀 허용.
  // TOP이 쌍 어워드(SOUL_CONNECTION / POLAR_OPPOSITES)이면 "OOO님은 유진님과 [라벨]예요" 포맷 사용.
  // 그 외(단독 어워드, 성향 라벨 폴백)는 "OOO님은 [라벨]예요" 포맷.
  const partner = medals.top.partnerNickname;

  return (
    <section className={styles.section} aria-labelledby="my-result-label">
      <p id="my-result-label" className={styles.sectionLabel}>
        MY RESULT
      </p>
      <h2 className={styles.title}>
        {partner ? (
          <>
            {myNickname}님은 {partner}님과{' '}
            <span className={styles.highlight}>{medals.top.title}</span>예요
          </>
        ) : (
          <>
            {myNickname}님은 <span className={styles.highlight}>{medals.top.title}</span>예요
          </>
        )}
      </h2>
      <p className={styles.subtitle}>{medals.top.oneLiner}</p>

      <div className={styles.medalList} role="list">
        {/* TOP 카드는 선언 타이틀이 이미 파트너 이름을 노출하므로 카드 내 with 라인은 숨김 */}
        <MedalCard medal={medals.top} variant="primary" showPartner={false} role="listitem" />
        {medals.chemistryPartner && (
          <MedalCard
            medal={medals.chemistryPartner}
            variant="secondary"
            showPartner
            role="listitem"
          />
        )}
        <MedalCard
          medal={medals.personaLabel}
          variant="secondary"
          showPartner={false}
          role="listitem"
        />
      </div>
    </section>
  );
};

interface MedalCardProps {
  medal: MyMedal;
  variant: 'primary' | 'secondary';
  showPartner: boolean;
  role?: string;
}

function MedalCard({ medal, variant, showPartner, role }: MedalCardProps) {
  return (
    <article className={`${styles.card} ${styles[variant]}`} role={role}>
      <h3 className={styles.cardTitle}>{medal.title}</h3>
      <p className={styles.cardOneLiner}>{medal.oneLiner}</p>
      {showPartner && medal.partnerNickname && (
        <p className={styles.cardPartner}>with {medal.partnerNickname}</p>
      )}
    </article>
  );
}
```

- [ ] **Step 2: `MyMedalSection.module.scss` 작성**

```scss
@use '@/styles/variables' as *;

.section {
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
}

.sectionLabel {
  font-size: 11px;
  color: $attention;
  font-weight: 700;
  letter-spacing: 1px;
  text-align: center;
}

.title {
  font-size: $font-size-20;
  font-weight: 800;
  color: $white;
  text-align: center;
  line-height: 1.3;
}

.highlight {
  background: $primary-gradient;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.subtitle {
  font-size: $font-size-14;
  color: $text-tertiary;
  text-align: center;
}

.medalList {
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
}

.card {
  padding: $spacing-16;
  border-radius: $border-radius-lg;
  background: $bg-secondary;
  border: 1px solid #333;
}

.primary {
  border: 1px solid transparent;
  background:
    linear-gradient($bg-secondary, $bg-secondary) padding-box,
    $primary-gradient border-box;
}

.cardTitle {
  font-size: $font-size-14;
  font-weight: 700;
  color: $white;
  margin-bottom: $spacing-4;
}

.cardOneLiner {
  font-size: 13px;
  color: $text-secondary;
  line-height: 1.5;
}

.cardPartner {
  margin-top: $spacing-8;
  font-size: $font-size-12;
  color: $text-tertiary;
}
```

- [ ] **Step 3: `MyResultView.tsx` Layer 1에 마운트**

내가 멤버일 때만 렌더 (비멤버는 Task 13에서 잠금 처리).

```tsx
// MyResultView.tsx 상단 import 추가
import { MyMedalSection } from './MyMedalSection';

// personaLabel 임시 stub — Task 10에서 교체. title은 8자 이하 유지.
const personaLabelStub = {
  awardType: 'PERSONA_LABEL' as const,
  title: '균형 타입',
  oneLiner: '양쪽 의견을 모두 이해하려 하는 타입',
};

// Layer 1 <section> 내부
{
  isMember && !singleMember && (
    <MyMedalSection
      myNickname={myMember?.displayName ?? myMember?.nickname ?? ''}
      awards={awards}
      currentUserId={currentUserId}
      personaLabel={personaLabelStub}
    />
  );
}
```

- [ ] **Step 4: 개발 서버로 확인**

```bash
pnpm dev
```

/compare/group/<token> (2명 이상 그룹) 접속 → 훈장 3단 카드 렌더 확인. Top 카드가 그라디언트 보더인지 시각 확인.

- [ ] **Step 5: 커밋**

```bash
git add src/components/features/Compare/MyResultView/MyMedalSection.tsx \
        src/components/features/Compare/MyResultView/MyMedalSection.module.scss \
        src/components/features/Compare/MyResultView/MyResultView.tsx
git commit -m "feat(compare): render MyMedalSection with 3-tier medals"
```

---

## Task 4 · `OrbitMap` — Canvas 기본 렌더 (별·궤도·노드)

**Files:**

- Create: `src/components/features/Compare/MyResultView/OrbitMap/OrbitMap.tsx`
- Create: `src/components/features/Compare/MyResultView/OrbitMap/OrbitMap.module.scss`
- Create: `src/components/features/Compare/MyResultView/OrbitMap/orbit-draw.ts`

**의도:** Mock(`option-orbit-1.html`)과 동일한 3겹 궤도 + 중앙 오브 + 멤버 노드를 Canvas 2D로 렌더. 이번 태스크는 정적 렌더만. 인터랙션은 Task 6에서.

- [ ] **Step 1: `orbit-draw.ts` 그리기 함수 분리**

공유 가능한 순수 함수로 분리 — 이후 `ShareCardCanvas`에서 재사용.

```ts
// src/components/features/Compare/MyResultView/OrbitMap/orbit-draw.ts
export interface OrbitMember {
  userId: string;
  nickname: string;
  matchRate: number;
  profileColor?: string;
}

export interface OrbitCam {
  x: number;
  y: number;
  scale: number;
}

export interface OrbitStar {
  x: number;
  y: number;
  depth: number;
  size: number;
  blink: number;
}

/** 매칭률 → orbit tier (1 inner / 2 mid / 3 outer / 'satellite' 100% / 'asteroid' 0%) */
export type OrbitTier = 1 | 2 | 3 | 'satellite' | 'asteroid';

export function getOrbitTier(matchRate: number): OrbitTier {
  if (matchRate === 100) return 'satellite';
  if (matchRate === 0) return 'asteroid';
  if (matchRate >= 60) return 1;
  if (matchRate >= 40) return 2;
  return 3;
}

export function getOrbitRadius(width: number, height: number, n: 1 | 2 | 3): number {
  const base = Math.min(width, height) * 0.18;
  return base * n;
}

export function getNodeColor(tier: OrbitTier, profileColor?: string): string {
  if (profileColor) return profileColor;
  switch (tier) {
    case 'satellite':
      return '#ffffff';
    case 1:
      return '#ff6ec7';
    case 2:
      return '#facc15';
    case 3:
    case 'asteroid':
      return '#ef4444';
  }
}

export function generateStars(count = 220): OrbitStar[] {
  const stars: OrbitStar[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      depth: 0.3 + Math.random() * 0.7,
      size: 0.3 + Math.random() * 1.4,
      blink: Math.random() * Math.PI * 2,
    });
  }
  return stars;
}

interface DrawOrbitParams {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
  cam: OrbitCam;
  stars: OrbitStar[];
  members: OrbitMember[];
  myNickname: string;
  /** 0~1 누적 각도 회전 (애니메이션) */
  rotation: number;
  /** 현재 탭으로 선택된 유저 — 없으면 null */
  selectedUserId: string | null;
  /** Mock과 달리 실제 데이터에는 angle이 없으므로 members 인덱스를 기반으로 고르게 분포 */
  memberAngles: Record<string, number>;
  /** 비멤버면 중앙 "나"를 실루엣으로 */
  isMember: boolean;
  /** 호출 후 세팅되는 멤버 스크린 좌표 — 히트 테스트용 */
  nodeHitBoxes: Map<string, { x: number; y: number; r: number }>;
}

export function drawOrbitScene(params: DrawOrbitParams): void {
  const {
    ctx,
    width,
    height,
    dpr,
    cam,
    stars,
    members,
    myNickname,
    rotation,
    selectedUserId,
    memberAngles,
    isMember,
    nodeHitBoxes,
  } = params;

  ctx.clearRect(0, 0, width, height);

  const cx = width / 2 + cam.x;
  const cy = height / 2 + cam.y;
  const s = cam.scale;

  // 별 parallax
  for (const star of stars) {
    const px = width / 2 + star.x * width * 0.7 + cam.x * star.depth * 0.4;
    const py = height / 2 + star.y * height * 0.7 + cam.y * star.depth * 0.4;
    const alpha = 0.3 + Math.sin(star.blink + performance.now() * 0.002) * 0.3;
    ctx.fillStyle = `rgba(255,255,255,${alpha * star.depth})`;
    ctx.beginPath();
    ctx.arc(px, py, star.size * dpr, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);

  // 궤도 3겹
  const orbitColors = ['rgba(255,0,255,0.35)', 'rgba(255,255,255,0.14)', 'rgba(239,68,68,0.25)'];
  const orbitDashes: number[][] = [[], [6, 8], [3, 10]];
  for (let i = 1; i <= 3; i++) {
    const r = getOrbitRadius(width, height, i as 1 | 2 | 3);
    ctx.beginPath();
    ctx.setLineDash(orbitDashes[i - 1]);
    ctx.strokeStyle = orbitColors[i - 1];
    ctx.lineWidth = 1.2 * dpr;
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // 중앙 "나" 오브
  const meRadius = 28 * dpr;
  if (isMember) {
    const grad = ctx.createRadialGradient(-meRadius * 0.3, -meRadius * 0.3, 0, 0, 0, meRadius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#ff6ec7');
    grad.addColorStop(1, '#7a2dff');
    ctx.fillStyle = grad;
    ctx.shadowBlur = 40 * dpr;
    ctx.shadowColor = 'rgba(255,110,199,0.6)';
    ctx.beginPath();
    ctx.arc(0, 0, meRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = `700 ${13 * dpr}px -apple-system, Pretendard, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(myNickname.slice(0, 2) || '나', 0, 0);
  } else {
    // 비멤버: 실루엣
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.arc(0, 0, meRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `600 ${11 * dpr}px -apple-system, Pretendard, sans-serif`;
    ctx.fillText('YOU', 0, 0);
  }

  // 멤버 노드
  nodeHitBoxes.clear();
  for (const m of members) {
    const tier = getOrbitTier(m.matchRate);
    let r: number;
    switch (tier) {
      case 'satellite':
        r = getOrbitRadius(width, height, 1) * 0.6;
        break;
      case 'asteroid':
        r = getOrbitRadius(width, height, 3) * 1.5;
        break;
      default:
        r = getOrbitRadius(width, height, tier);
    }
    const baseAngle = memberAngles[m.userId] ?? 0;
    const tierNum = tier === 'satellite' ? 1 : tier === 'asteroid' ? 3 : tier;
    const a = baseAngle + rotation * (4 - tierNum) * 0.3;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;

    // 엣지 (INNER, satellite, asteroid만)
    if (tier === 1 || tier === 'satellite') {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,110,199,0.45)';
      ctx.lineWidth = 1 * dpr;
      ctx.moveTo(0, 0);
      ctx.lineTo(px, py);
      ctx.stroke();
    } else if (tier === 3 || tier === 'asteroid') {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(239,68,68,0.25)';
      ctx.lineWidth = 0.8 * dpr;
      ctx.setLineDash([2, 6]);
      ctx.moveTo(0, 0);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 행성
    const pr = (tier === 1 ? 20 : tier === 2 ? 17 : tier === 'satellite' ? 12 : 15) * dpr;
    const color = getNodeColor(tier, m.profileColor);
    const pg = ctx.createRadialGradient(px - pr * 0.3, py - pr * 0.3, 0, px, py, pr);
    pg.addColorStop(0, '#fff');
    pg.addColorStop(0.4, color);
    pg.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = pg;
    ctx.shadowBlur = (selectedUserId === m.userId ? 30 : 12) * dpr;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 이니셜
    ctx.fillStyle = '#fff';
    ctx.font = `700 ${11 * dpr}px -apple-system, Pretendard, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(m.nickname.slice(0, 1), px, py);

    // 이름 + 케미율
    ctx.font = `600 ${10 * dpr}px -apple-system, Pretendard, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(m.nickname, px, py + pr + 14 * dpr);
    ctx.font = `700 ${9 * dpr}px -apple-system, Pretendard, sans-serif`;
    ctx.fillStyle = tier === 3 || tier === 'asteroid' ? '#ef4444' : '#dfff00';
    ctx.fillText(`${m.matchRate}%`, px, py + pr + 26 * dpr);

    // 히트박스 (스크린 좌표)
    nodeHitBoxes.set(m.userId, { x: cx + px * s, y: cy + py * s, r: pr * s });
  }

  ctx.restore();
}

/** 고르게 분포된 각도 생성 — useMemo로 members 고정 */
export function assignAngles(members: OrbitMember[]): Record<string, number> {
  const byTier: Record<string, OrbitMember[]> = {
    '1': [],
    '2': [],
    '3': [],
    satellite: [],
    asteroid: [],
  };
  for (const m of members) {
    const tier = getOrbitTier(m.matchRate);
    byTier[String(tier)].push(m);
  }
  const angles: Record<string, number> = {};
  for (const key of Object.keys(byTier)) {
    const group = byTier[key];
    group.forEach((m, idx) => {
      angles[m.userId] = (idx / Math.max(group.length, 1)) * Math.PI * 2;
    });
  }
  return angles;
}
```

- [ ] **Step 2: `OrbitMap.tsx` 컴포넌트 작성 (정적 렌더만)**

```tsx
'use client';

import { useEffect, useMemo, useRef, useState, type FC } from 'react';

import {
  assignAngles,
  drawOrbitScene,
  generateStars,
  type OrbitCam,
  type OrbitMember,
  type OrbitStar,
} from './orbit-draw';

import styles from './OrbitMap.module.scss';

export interface OrbitMapProps {
  members: OrbitMember[];
  myNickname: string;
  isMember: boolean;
  onMemberTap?: (userId: string) => void;
}

export const OrbitMap: FC<OrbitMapProps> = ({ members, myNickname, isMember }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderError, setRenderError] = useState(false);

  const stars = useMemo<OrbitStar[]>(() => generateStars(220), []);
  const memberAngles = useMemo(() => assignAngles(members), [members]);
  const camRef = useRef<OrbitCam>({ x: 0, y: 0, scale: 1 });
  const rotationRef = useRef(0);
  const selectedRef = useRef<string | null>(null);
  const nodeHitBoxesRef = useRef<Map<string, { x: number; y: number; r: number }>>(new Map());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setRenderError(true);
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function fit() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }
    fit();
    window.addEventListener('resize', fit);

    let rafId = 0;
    function loop() {
      drawOrbitScene({
        ctx: ctx!,
        width: canvas.width,
        height: canvas.height,
        dpr,
        cam: camRef.current,
        stars,
        members,
        myNickname,
        rotation: rotationRef.current,
        selectedUserId: selectedRef.current,
        memberAngles,
        isMember,
        nodeHitBoxes: nodeHitBoxesRef.current,
      });
      rotationRef.current += 0.0008;
      rafId = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', fit);
    };
  }, [stars, members, memberAngles, myNickname, isMember]);

  if (renderError) {
    return (
      <div className={styles.fallback} aria-label="궤도 정적 이미지">
        <img src="/images/orbit-fallback.svg" alt="" />
      </div>
    );
  }

  return (
    <div className={styles.wrap} aria-label="나의 위치 궤도">
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.hudTop} aria-hidden="true">
        <span className={styles.hudLeft}>VOYAGER 1 / {myNickname}</span>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: `OrbitMap.module.scss` 작성**

```scss
@use '@/styles/variables' as *;

.wrap {
  position: relative;
  width: 100%;
  height: 540px;
  background: radial-gradient(ellipse at 50% 50%, #1a1a2e 0%, #0a0a12 70%);
  overflow: hidden;
  border-radius: $border-radius-lg;
}

.canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
  cursor: grab;
}

.canvas:active {
  cursor: grabbing;
}

.hudTop {
  position: absolute;
  top: 14px;
  left: 14px;
  right: 14px;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 1px;
}

.fallback {
  width: 100%;
  height: 540px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-secondary;
  border-radius: $border-radius-lg;
}
```

- [ ] **Step 4: `MyResultView.tsx` Layer 1에 OrbitMap 마운트**

```tsx
import { OrbitMap } from './OrbitMap/OrbitMap';
import { getChemistryByRate } from '@/constants/bundle';

// members를 OrbitMember로 매핑 (currentUser 제외)
const orbitMembers = useMemo(() => {
  if (!displayResult) return [];
  return displayResult.members
    .filter((m) => m.userId !== currentUserId)
    .map((m) => {
      // 내 기준 매칭률 — pairs에서 계산
      const pair = pairs.find(
        (p) =>
          (p.memberA === currentUserId && p.memberB === m.userId) ||
          (p.memberB === currentUserId && p.memberA === m.userId)
      );
      return {
        userId: m.userId,
        nickname: m.nickname ?? '',
        matchRate: pair?.matchRate ?? 0,
        profileColor: m.displayProfileColor,
      };
    });
}, [displayResult, currentUserId, pairs]);

// Layer 1 내부
{
  !singleMember && (
    <OrbitMap
      members={orbitMembers}
      myNickname={myMember?.displayName ?? myMember?.nickname ?? '나'}
      isMember={isMember}
    />
  );
}
```

- [ ] **Step 5: 개발 서버 확인**

```bash
pnpm dev
```

그룹 결과 접속 → 별이 깜박이고, 궤도 3겹이 보이고, 멤버 행성이 궤도 위에 위치. 회전 애니메이션(아주 느리게) 확인.

- [ ] **Step 6: 커밋**

```bash
git add src/components/features/Compare/MyResultView/OrbitMap/ \
        src/components/features/Compare/MyResultView/MyResultView.tsx
git commit -m "feat(compare): render OrbitMap canvas with stars/orbits/members"
```

---

## Task 5 · `OrbitMap` Canvas 렌더 실패 시 정적 Fallback

**Files:**

- Modify: `src/components/features/Compare/MyResultView/OrbitMap/OrbitMap.tsx`
- Create: `public/images/orbit-fallback.svg`

**의도:** `getContext('2d')` 실패 또는 renderError 상태일 때 SVG 정적 이미지로 폴백. 공유·캡처는 차단(fallback UI엔 공유 버튼 disabled 상태 표시).

- [ ] **Step 1: `orbit-fallback.svg` 생성**

```bash
ls /Users/kimwoongil/Desktop/woongs/trend-web/public/images/ 2>/dev/null || mkdir -p /Users/kimwoongil/Desktop/woongs/trend-web/public/images
```

파일 생성: `public/images/orbit-fallback.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 540" fill="none" role="img" aria-label="궤도 정적 이미지">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#1a1a2e" />
      <stop offset="100%" stop-color="#0a0a12" />
    </radialGradient>
    <linearGradient id="me" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="60%" stop-color="#ff6ec7" />
      <stop offset="100%" stop-color="#7a2dff" />
    </linearGradient>
  </defs>
  <rect width="480" height="540" fill="url(#bg)" />
  <circle cx="240" cy="270" r="84" stroke="rgba(255,0,255,0.35)" stroke-width="1.2" />
  <circle cx="240" cy="270" r="168" stroke="rgba(255,255,255,0.14)" stroke-width="1.2" stroke-dasharray="6 8" />
  <circle cx="240" cy="270" r="252" stroke="rgba(239,68,68,0.25)" stroke-width="1.2" stroke-dasharray="3 10" />
  <circle cx="240" cy="270" r="28" fill="url(#me)" />
</svg>
```

- [ ] **Step 2: `OrbitMap.tsx` getContext 실패 경로 재확인**

이미 Task 4에서 `setRenderError(true)` 경로가 있음. 추가로 `try/catch`로 `drawOrbitScene` 첫 호출 실패 시에도 폴백 트리거:

```tsx
// loop() 내부 drawOrbitScene 호출을 try/catch로 감싼다
try {
  drawOrbitScene({...});
} catch (err) {
  console.error('[OrbitMap] draw failed', err);
  setRenderError(true);
  return;
}
```

- [ ] **Step 3: 개발 서버에서 수동 폴백 테스트**

`OrbitMap.tsx` 내에서 임시로 `setRenderError(true)` 호출 후 렌더 확인 → SVG 정적 이미지가 보이면 OK. 커밋 전 임시 코드 제거.

- [ ] **Step 4: 커밋**

```bash
git add src/components/features/Compare/MyResultView/OrbitMap/OrbitMap.tsx \
        public/images/orbit-fallback.svg
git commit -m "feat(compare): add static SVG fallback for OrbitMap render failures"
```

---

## Task 6 · `OrbitMap` 인터랙션 (드래그 · 핀치 · 휠 · 탭 · 버튼 · 힌트)

**Files:**

- Modify: `src/components/features/Compare/MyResultView/OrbitMap/OrbitMap.tsx`
- Create: `src/components/features/Compare/MyResultView/OrbitMap/orbit-hint.ts`

**의도:** Mock(`option-orbit-1.html:403-498`)의 제스처 처리와 동일. 핵심은 `zoomAtScreenCenter` 화면 중심 피벗.

- [ ] **Step 1: `orbit-hint.ts` 힌트 숨김 상태 헬퍼**

```ts
// src/components/features/Compare/MyResultView/OrbitMap/orbit-hint.ts
const HINT_KEY = 'hp:orbit-hint-dismissed';

export function wasOrbitHintDismissed(): boolean {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(HINT_KEY) === '1';
}

export function dismissOrbitHint(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(HINT_KEY, '1');
}
```

- [ ] **Step 2: `OrbitMap.tsx`에 제스처 핸들러 추가**

기존 컴포넌트를 확장 — 핸들러 전체:

```tsx
// OrbitMap.tsx — 기존 useEffect 아래 추가 useEffect

useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function zoomAtScreenCenter(factor: number) {
    const prev = camRef.current.scale;
    const nextScale = Math.max(0.5, Math.min(2.5, prev * factor));
    const realFactor = nextScale / prev;
    camRef.current = {
      x: camRef.current.x * realFactor,
      y: camRef.current.y * realFactor,
      scale: nextScale,
    };
  }

  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let pointerStart: { x: number; y: number } | null = null;

  function onPointerDown(e: PointerEvent) {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    pointerStart = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging) return;
    camRef.current = {
      ...camRef.current,
      x: camRef.current.x + (e.clientX - lastX) * dpr,
      y: camRef.current.y + (e.clientY - lastY) * dpr,
    };
    lastX = e.clientX;
    lastY = e.clientY;
  }

  function onPointerUp(e: PointerEvent) {
    dragging = false;
    if (pointerStart && Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y) < 6) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * dpr;
      const y = (e.clientY - rect.top) * dpr;
      for (const [userId, box] of nodeHitBoxesRef.current) {
        if (Math.hypot(x - box.x, y - box.y) < box.r + 6 * dpr) {
          selectedRef.current = userId;
          onMemberTap?.(userId);
          return;
        }
      }
      selectedRef.current = null;
    }
  }

  let pinchStart: { dist: number; scale: number; camX: number; camY: number } | null = null;
  function pinchDist(t: TouchList) {
    return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  }

  function onTouchStart(e: TouchEvent) {
    if (e.touches.length === 2) {
      pinchStart = {
        dist: pinchDist(e.touches),
        scale: camRef.current.scale,
        camX: camRef.current.x,
        camY: camRef.current.y,
      };
    }
  }
  function onTouchMove(e: TouchEvent) {
    if (e.touches.length === 2 && pinchStart) {
      e.preventDefault();
      const d = pinchDist(e.touches);
      const targetScale = Math.max(0.5, Math.min(2.5, pinchStart.scale * (d / pinchStart.dist)));
      const factor = targetScale / pinchStart.scale;
      camRef.current = {
        scale: targetScale,
        x: pinchStart.camX * factor,
        y: pinchStart.camY * factor,
      };
    }
  }
  function onTouchEnd() {
    pinchStart = null;
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    zoomAtScreenCenter(e.deltaY < 0 ? 1.08 : 0.92);
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('touchstart', onTouchStart);
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  return () => {
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('touchmove', onTouchMove);
    canvas.removeEventListener('touchend', onTouchEnd);
    canvas.removeEventListener('wheel', onWheel);
  };
}, [onMemberTap]);

// 추가: zoom 버튼 + 힌트 dismiss

const [hintVisible, setHintVisible] = useState(() => !wasOrbitHintDismissed());

function zoom(factor: number) {
  const prev = camRef.current.scale;
  const nextScale = Math.max(0.5, Math.min(2.5, prev * factor));
  const realFactor = nextScale / prev;
  camRef.current = {
    x: camRef.current.x * realFactor,
    y: camRef.current.y * realFactor,
    scale: nextScale,
  };
}

function reset() {
  camRef.current = { x: 0, y: 0, scale: 1 };
}

function handleHintDismiss() {
  dismissOrbitHint();
  setHintVisible(false);
}
```

JSX에 컨트롤 버튼·힌트 추가:

```tsx
<div className={styles.controls} aria-label="궤도 조작">
  <button type="button" onClick={() => zoom(1.2)} aria-label="확대">
    +
  </button>
  <button type="button" onClick={() => zoom(0.833)} aria-label="축소">
    −
  </button>
  <button type="button" onClick={reset} aria-label="원위치">
    ↻
  </button>
</div>;
{
  hintVisible && (
    <button
      type="button"
      className={styles.hudHint}
      onClick={handleHintDismiss}
      aria-label="힌트 닫기"
    >
      탭해서 자세히 보기
    </button>
  );
}
```

SCSS 추가 (`OrbitMap.module.scss` 하단):

```scss
.controls {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;

  button {
    width: 32px;
    height: 32px;
    border-radius: $border-rounded;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(10px);
    color: $white;
    border: 1px solid rgba(255, 255, 255, 0.15);
    font-size: $font-size-14;
    font-weight: 700;
  }
}

.hudHint {
  position: absolute;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  color: rgba(255, 255, 255, 0.75);
  background: rgba(0, 0, 0, 0.35);
  padding: 6px 14px;
  border-radius: $border-rounded;
  backdrop-filter: blur(10px);
  border: none;
}
```

- [ ] **Step 3: `MyResultView.tsx`에서 `onMemberTap` 연결 → `MemberDetailSheet` 열기**

```tsx
<OrbitMap
  members={orbitMembers}
  myNickname={myMember?.displayName ?? myMember?.nickname ?? '나'}
  isMember={isMember}
  onMemberTap={handleMemberCompare}
/>
```

- [ ] **Step 4: 개발 서버에서 제스처 QA**

```bash
pnpm dev
```

체크리스트:

- 드래그 팬 작동 (행성들이 따라옴)
- 마우스 휠 줌 (화면 중심 기준, "나"가 고정돼 보임)
- iOS/Android 핀치 줌
- 행성 탭 → `MemberDetailSheet` 열림
- 첫 방문 힌트 표시 → 탭 시 닫힘 → 새로고침 후에도 안 보임
- +/−/↻ 버튼 작동

- [ ] **Step 5: 커밋**

```bash
git add src/components/features/Compare/MyResultView/OrbitMap/
git commit -m "feat(compare): add drag/pinch/wheel/tap interactions to OrbitMap"
```

---

## Task 7 · `MyExtremeAnswersSection` — 소수답 Top 3

**Files:**

- Create: `src/constants/my-extreme-answers.ts`
- Create: `src/components/features/Compare/MyResultView/MyExtremeAnswersSection.tsx`
- Create: `src/components/features/Compare/MyResultView/MyExtremeAnswersSection.module.scss`
- Modify: `src/components/features/Compare/MyResultView/MyResultView.tsx`

**스펙 변경(2026-04-25) 반영:** 엠프티 상태 시 섹션 전체 숨김. 발동 조건 = **참여자 3명 이상** AND **내가 답한 옵션 중 그룹 내 비율 ≤ 33% 질문이 1개 이상**.

- [ ] **Step 1: `my-extreme-answers.ts` 계산 유틸**

```ts
// src/constants/my-extreme-answers.ts
import type { GroupCompareResult } from '@/types/group-compare';

/** 소수답 임계 비율 — 이 이하를 고른 답을 "소수답"으로 취급 */
const MINORITY_THRESHOLD = 1 / 3; // 33%
/** 섹션 노출 최소 참여자 수 */
const MIN_PARTICIPANTS = 3;

export interface MyExtremeAnswer {
  electionId: string;
  questionTitle: string;
  myOptionTitle: string;
  pickedCount: number;
  totalCount: number;
  /** pickedCount / totalCount 기반 오름차순 정렬 */
  ratio: number;
}

/**
 * 내가 답한 옵션 중 그룹 내 선택 비율이 낮은 소수답 Top 3.
 *
 * 스펙(2026-04-25):
 * - 참여자 수가 3명 미만이면 빈 배열 반환 (섹션 숨김 트리거).
 * - ratio ≤ 1/3 인 항목만 포함. 임계 초과 항목만 있으면 빈 배열 반환.
 * - 정렬: ratio 오름차순, 동률이면 pickedCount 오름차순.
 */
export function getMyExtremeAnswers(
  result: GroupCompareResult,
  currentUserId: string
): MyExtremeAnswer[] {
  const members = result.members ?? [];
  if (members.length < MIN_PARTICIPANTS) return [];

  const me = members.find((m) => m.userId === currentUserId);
  if (!me) return [];

  const myAnswers = me.answers ?? [];
  const questionStats = result.questionStats ?? [];

  const items: MyExtremeAnswer[] = [];

  for (const ans of myAnswers) {
    const stat = questionStats.find((s) => s.electionId === ans.electionId);
    if (!stat) continue;
    const option = (stat.optionStats ?? []).find((o) => o.electionItemId === ans.electionItemId);
    if (!option) continue;

    // 그룹 내에서 이 옵션을 고른 사람 수
    let pickedCount = 0;
    for (const m of members) {
      const ma = (m.answers ?? []).find((a) => a.electionId === ans.electionId);
      if (ma && ma.electionItemId === ans.electionItemId) pickedCount++;
    }
    const totalCount = members.filter((m) =>
      (m.answers ?? []).some((a) => a.electionId === ans.electionId)
    ).length;
    if (totalCount === 0) continue;

    const ratio = pickedCount / totalCount;
    if (ratio > MINORITY_THRESHOLD) continue; // 소수답 아님 — 제외

    items.push({
      electionId: ans.electionId,
      questionTitle: stat.title ?? '',
      myOptionTitle: option.title ?? '',
      pickedCount,
      totalCount,
      ratio,
    });
  }

  items.sort((a, b) => a.ratio - b.ratio || a.pickedCount - b.pickedCount);
  return items.slice(0, 3);
}
```

- [ ] **Step 2: `MyExtremeAnswersSection.tsx` 작성**

```tsx
'use client';

import { useMemo, type FC } from 'react';

import { getMyExtremeAnswers } from '@/constants/my-extreme-answers';
import type { GroupCompareResult } from '@/types/group-compare';

import styles from './MyExtremeAnswersSection.module.scss';

interface MyExtremeAnswersSectionProps {
  result: GroupCompareResult;
  currentUserId: string;
}

export const MyExtremeAnswersSection: FC<MyExtremeAnswersSectionProps> = ({
  result,
  currentUserId,
}) => {
  const items = useMemo(() => getMyExtremeAnswers(result, currentUserId), [result, currentUserId]);

  if (items.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="extreme-title">
      <h3 id="extreme-title" className={styles.title}>
        혼자만 다르게 고른 답 TOP 3
      </h3>
      <ul className={styles.list}>
        {items.map((it) => (
          <li key={it.electionId} className={styles.item}>
            <p className={styles.question}>{it.questionTitle}</p>
            <div className={styles.answer}>
              <span className={styles.badge}>{it.myOptionTitle}</span>
              <span className={styles.caption}>
                {it.totalCount}명 중 {it.pickedCount}명만 이 답을 골랐어요
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
```

- [ ] **Step 3: `MyExtremeAnswersSection.module.scss`**

```scss
@use '@/styles/variables' as *;

.section {
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
  padding: $spacing-24 $spacing-16;
  background: $bg-secondary;
  border: 1px solid #333;
  border-radius: $border-radius-lg;
}

.title {
  font-size: $font-size-16;
  font-weight: 700;
  color: $white;
}

.list {
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
  list-style: none;
  padding: 0;
}

.item {
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
}

.question {
  font-size: $font-size-14;
  color: $text-secondary;
  line-height: 1.5;
}

.answer {
  display: flex;
  align-items: center;
  gap: $spacing-8;
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: $spacing-4 $spacing-8;
  background: $primary-gradient;
  border-radius: 999px;
  font-size: $font-size-12;
  font-weight: 700;
  color: $white;
}

.caption {
  font-size: $font-size-12;
  color: $attention;
  font-weight: 600;
}
```

- [ ] **Step 4: `MyResultView.tsx` Layer 1에 마운트**

```tsx
import { MyExtremeAnswersSection } from './MyExtremeAnswersSection';

{
  isMember && !singleMember && (
    <MyExtremeAnswersSection result={displayResult} currentUserId={currentUserId} />
  );
}
```

- [ ] **Step 5: 개발 서버 확인 + 커밋**

```bash
pnpm dev  # 섹션이 렌더되고 숫자가 맞는지 확인
```

```bash
git add src/constants/my-extreme-answers.ts \
        src/components/features/Compare/MyResultView/MyExtremeAnswersSection.tsx \
        src/components/features/Compare/MyResultView/MyExtremeAnswersSection.module.scss \
        src/components/features/Compare/MyResultView/MyResultView.tsx
git commit -m "feat(compare): add MyExtremeAnswersSection for minority answers Top 3"
```

---

## Task 8 · `CaptureButton` — 결과 캡처 단일 버튼 (Layer 1 내부)

**Files:**

- Create: `src/components/features/Compare/MyResultView/CaptureButton.tsx`
- Create: `src/components/features/Compare/MyResultView/CaptureButton.module.scss`
- Modify: `src/components/features/Compare/MyResultView/MyResultView.tsx`

**의도 (스펙 2026-04-25 반영):**

- Layer 1 내부의 공유 버튼을 **"결과 캡처" 하나로 단일화** (기존 2버튼 구상 폐기).
- "공유하기"(링크 공유) 동선은 FloatingCta로 이관(Task 1 Step 4에서 이미 처리).
- 이 태스크는 UI + 공유 동작만. 실제 이미지 생성은 Task 9에서 연결(stub).

- [ ] **Step 1: `CaptureButton.tsx` 작성**

```tsx
'use client';

import { useState, type FC } from 'react';

import { Toast } from '@/components/common/Toast/Toast';
import { useToast } from '@/hooks/useToast';

import styles from './CaptureButton.module.scss';

interface CaptureButtonProps {
  /** 결과 캡처 시 호출 — PNG Blob 반환. 실패 시 null */
  onCaptureRequest: () => Promise<Blob | null>;
  /** Web Share API용 텍스트 — 파일 공유 실패 시 다운로드로 폴백 */
  shareTitle: string;
  shareText: string;
}

export const CaptureButton: FC<CaptureButtonProps> = ({
  onCaptureRequest,
  shareTitle,
  shareText,
}) => {
  const [capturing, setCapturing] = useState(false);
  const { toast, showToast } = useToast();

  async function handleCapture() {
    setCapturing(true);
    try {
      const blob = await onCaptureRequest();
      if (!blob) {
        showToast('캡처에 실패했어요');
        return;
      }
      const file = new File([blob], 'hotpick-result.png', { type: 'image/png' });
      // Web Share API(files) 우선 — 모바일에서 인스타 스토리/릴스로 직접 공유
      if (
        typeof navigator !== 'undefined' &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({ files: [file], title: shareTitle, text: shareText });
        return;
      }
      // 폴백: 다운로드
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hotpick-result.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('결과 이미지를 저장했어요');
    } catch {
      showToast('캡처에 실패했어요');
    } finally {
      setCapturing(false);
    }
  }

  return (
    <>
      <button type="button" className={styles.button} onClick={handleCapture} disabled={capturing}>
        {capturing ? '이미지 생성 중...' : '결과 캡처'}
      </button>
      {toast.isVisible && <Toast message={toast.message} />}
    </>
  );
};
```

- [ ] **Step 2: `CaptureButton.module.scss`**

```scss
@use '@/styles/variables' as *;

.button {
  width: 100%;
  padding: $spacing-16;
  border-radius: $border-radius-lg;
  font-size: $font-size-14;
  font-weight: 700;
  background: $bg-tertiary;
  color: $white;
  border: 1px solid $border-placeholder;
  cursor: pointer;
}

.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

- [ ] **Step 3: `MyResultView.tsx`에 stub 캡처 함수 연결**

```tsx
import { CaptureButton } from './CaptureButton';

async function handleCaptureStub(): Promise<Blob | null> {
  // Task 9에서 실제 ShareCardCanvas 호출로 교체
  return null;
}

{
  isMember && !singleMember && (
    <CaptureButton
      onCaptureRequest={handleCaptureStub}
      shareTitle={`${result.bundleTitle} 비교 결과`}
      shareText="HotPick에서 내 결과를 확인해봤어요"
    />
  );
}
```

비멤버 모드에서는 이 버튼을 노출하지 않는다(스펙: "결과 캡처 버튼 숨김").

- [ ] **Step 4: 개발 서버에서 버튼 렌더 확인**

`pnpm dev` → 2명+ 멤버로 접속 → Layer 1 하단에 "결과 캡처" 버튼 1개. 현재 stub이므로 클릭 시 "캡처에 실패했어요" 토스트가 정상(Task 9에서 해결).

- [ ] **Step 5: 커밋**

```bash
git add src/components/features/Compare/MyResultView/CaptureButton.tsx \
        src/components/features/Compare/MyResultView/CaptureButton.module.scss \
        src/components/features/Compare/MyResultView/MyResultView.tsx
git commit -m "feat(compare): add single CaptureButton for Layer 1 result image"
```

---

## Task 9 · `ShareCardCanvas` — off-screen PNG 생성

**Files:**

- Create: `src/components/features/Compare/MyResultView/ShareCardCanvas.ts`
- Modify: `src/components/features/Compare/MyResultView/MyResultView.tsx`

**의도:** 1024×1792 off-screen canvas에 훈장 1등 + 궤도 조감도 + 싱크로율 + 워터마크를 그려 PNG Blob으로 반환. 궤도 그리기는 Task 4의 `drawOrbitScene`을 재사용하되 `cam = {0,0,1}` 고정, `rotation=0`으로 스냅샷.

- [ ] **Step 1: `ShareCardCanvas.ts` 작성**

```ts
// src/components/features/Compare/MyResultView/ShareCardCanvas.ts
import {
  assignAngles,
  drawOrbitScene,
  generateStars,
  type OrbitMember,
} from './OrbitMap/orbit-draw';

interface RenderShareCardParams {
  members: OrbitMember[];
  myNickname: string;
  groupName: string;
  bundleTitle: string;
  syncRate: number;
  topMedalTitle: string;
  topMedalOneLiner: string;
  /** TOP이 쌍 어워드(SOUL_CONNECTION 등)일 때 파트너 닉네임 */
  topMedalPartner?: string;
}

const CARD_WIDTH = 1024;
const CARD_HEIGHT = 1792;
const ORBIT_BAND_HEIGHT = 1024;

/** 결과 공유 카드를 PNG Blob으로 생성. 실패 시 null. */
export async function renderShareCard(params: RenderShareCardParams): Promise<Blob | null> {
  const canvas =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(CARD_WIDTH, CARD_HEIGHT)
      : document.createElement('canvas');
  if (canvas instanceof HTMLCanvasElement) {
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;
  }
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;
  if (!ctx) return null;

  // 배경
  const bg = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
  bg.addColorStop(0, '#121212');
  bg.addColorStop(1, '#0a0a12');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // 상단 메타
  ctx.fillStyle = '#dfff00';
  ctx.font = '700 28px -apple-system, Pretendard, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MY RESULT', CARD_WIDTH / 2, 100);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 56px -apple-system, Pretendard, sans-serif';
  const heading = params.topMedalPartner
    ? `${params.myNickname}님은 ${params.topMedalPartner}님과`
    : `${params.myNickname}님은`;
  ctx.fillText(heading, CARD_WIDTH / 2, 200);

  // 그라디언트 훈장 타이틀
  const titleGrad = ctx.createLinearGradient(0, 250, CARD_WIDTH, 350);
  titleGrad.addColorStop(0, '#ff00ff');
  titleGrad.addColorStop(1, '#ff4500');
  ctx.fillStyle = titleGrad;
  ctx.font = '900 88px -apple-system, Pretendard, sans-serif';
  ctx.fillText(params.topMedalTitle, CARD_WIDTH / 2, 320);

  ctx.fillStyle = '#d1d1d1';
  ctx.font = '500 28px -apple-system, Pretendard, sans-serif';
  ctx.fillText(params.topMedalOneLiner, CARD_WIDTH / 2, 380);

  // 궤도 밴드 — drawOrbitScene 재사용
  ctx.save();
  ctx.translate(0, 440);
  ctx.beginPath();
  ctx.rect(0, 0, CARD_WIDTH, ORBIT_BAND_HEIGHT);
  ctx.clip();

  const orbitCtx = ctx; // 동일 ctx에 클립된 영역으로 그리기
  const orbitStars = generateStars(180);
  const orbitAngles = assignAngles(params.members);
  const hitBoxes = new Map<string, { x: number; y: number; r: number }>();

  try {
    drawOrbitScene({
      ctx: orbitCtx,
      width: CARD_WIDTH,
      height: ORBIT_BAND_HEIGHT,
      dpr: 2,
      cam: { x: 0, y: 0, scale: 1 },
      stars: orbitStars,
      members: params.members,
      myNickname: params.myNickname,
      rotation: 0,
      selectedUserId: null,
      memberAngles: orbitAngles,
      isMember: true,
      nodeHitBoxes: hitBoxes,
    });
  } catch {
    // 궤도 실패해도 카드 자체는 생성
  }
  ctx.restore();

  // 하단 스탯 · 워터마크
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 48px -apple-system, Pretendard, sans-serif';
  ctx.fillText(`싱크로율 ${params.syncRate}%`, CARD_WIDTH / 2, CARD_HEIGHT - 200);

  ctx.fillStyle = '#8a8a8a';
  ctx.font = '500 24px -apple-system, Pretendard, sans-serif';
  ctx.fillText(`${params.groupName} · ${params.bundleTitle}`, CARD_WIDTH / 2, CARD_HEIGHT - 150);

  ctx.fillStyle = '#dfff00';
  ctx.font = '800 32px -apple-system, Pretendard, sans-serif';
  ctx.fillText('HotPick', CARD_WIDTH / 2, CARD_HEIGHT - 80);

  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: 'image/png' });
  }
  return new Promise((resolve) => {
    (canvas as HTMLCanvasElement).toBlob((b) => resolve(b), 'image/png');
  });
}
```

- [ ] **Step 2: `MyResultView.tsx`에서 stub을 실제 호출로 교체**

```tsx
import { renderShareCard } from './ShareCardCanvas';

// 기존 handleCaptureStub 제거, 아래로 교체
const handleCapture = async (): Promise<Blob | null> => {
  const medals = getMyMedals(awards, currentUserId, personaLabelStub);
  return renderShareCard({
    members: orbitMembers,
    myNickname: myMember?.displayName ?? myMember?.nickname ?? '나',
    groupName: result.groupName ?? '',
    bundleTitle: result.bundleTitle ?? '',
    syncRate: groupSyncRate,
    topMedalTitle: medals.top.title,
    topMedalOneLiner: medals.top.oneLiner,
    topMedalPartner: medals.top.partnerNickname,
  });
};

<CaptureButton
  onCaptureRequest={handleCapture}
  /* ...나머지 props 동일 */
/>;
```

**참고**: ShareCardCanvas의 `renderShareCard` 파라미터에 `topMedalPartner?: string`를 추가해, TOP이 쌍 어워드일 때 공유 카드에도 "OOO님과 소울 메이트" 포맷을 반영한다. 아래 Step 1의 타이틀 렌더 블록을 아래와 같이 수정:

```ts
// ShareCardCanvas.ts — 파라미터 확장
interface RenderShareCardParams {
  members: OrbitMember[];
  myNickname: string;
  groupName: string;
  bundleTitle: string;
  syncRate: number;
  topMedalTitle: string;
  topMedalOneLiner: string;
  topMedalPartner?: string;
}

// "{myNickname}님은" 블록 교체
ctx.fillStyle = '#ffffff';
ctx.font = '800 56px -apple-system, Pretendard, sans-serif';
const heading = params.topMedalPartner
  ? `${params.myNickname}님은 ${params.topMedalPartner}님과`
  : `${params.myNickname}님은`;
ctx.fillText(heading, CARD_WIDTH / 2, 200);
```

- [ ] **Step 3: 개발 서버에서 캡처 QA**

"결과 캡처" 버튼 → 이미지 다운로드 또는 공유 시트 열림. 다운로드된 PNG 열어서 훈장 + 궤도 + 싱크로율 + 워터마크 확인.

- [ ] **Step 4: 커밋**

```bash
git add src/components/features/Compare/MyResultView/ShareCardCanvas.ts \
        src/components/features/Compare/MyResultView/MyResultView.tsx
git commit -m "feat(compare): render share card PNG via off-screen canvas"
```

---

## Task 10 · 성향 라벨 마스터 리스트 + 자동 매칭

**Files:**

- Create: `src/constants/bundle-persona-labels.ts`
- Modify: `src/components/features/Compare/MyResultView/MyResultView.tsx`

**의도:** `personaLabelStub`을 실제 로직으로 교체. 현 시점 `matchType` BE 태깅이 없을 수도 있으므로 "답변 패턴 해시 → 라벨 배열 인덱스" 방식의 단순 fallback을 붙인다.

- [ ] **Step 1: `bundle-persona-labels.ts` 작성**

```ts
// src/constants/bundle-persona-labels.ts
import type { MyMedal } from '@/constants/my-medals';

/**
 * 번들별 성향 라벨 마스터.
 * key: bundleSlug, value: 라벨 풀 (4~8개)
 *
 * 규칙 (스펙 2026-04-25):
 * - 라벨 title은 **최대 8자** — 모바일 카드 한 줄 수용.
 * - 중립-긍정 뉘앙스만. 부정 뉘앙스 라벨 지양.
 *
 * 라벨 선정 로직:
 * - BE 매칭 태깅(matchType: same/different)이 붙으면 sameCount/differentCount 비율로 라벨 결정.
 * - 현재는 답변 패턴 해시 기반 fallback — 같은 사용자는 항상 같은 라벨.
 */
const BUNDLE_PERSONA_LABELS: Record<string, MyMedal[]> = {
  // 연애 가치관 번들 (첫 번들) — 8자 이하
  'love-values': [
    {
      awardType: 'PERSONA_LABEL',
      title: '자유로운 탐험가', // 8자
      oneLiner: '관계보다 경험을 택하는 로맨틱 모험가',
    },
    {
      awardType: 'PERSONA_LABEL',
      title: '안정 추구형', // 6자
      oneLiner: '오래가는 관계의 가치를 아는 사람',
    },
    {
      awardType: 'PERSONA_LABEL',
      title: '감정 표현형', // 6자
      oneLiner: '마음을 숨기지 않고 다 꺼내는 직진파',
    },
    {
      awardType: 'PERSONA_LABEL',
      title: '신중한 로맨틱', // 7자
      oneLiner: '사랑에 진지한 자기 페이스 유지형',
    },
  ],
};

const DEFAULT_LABELS: MyMedal[] = [
  {
    awardType: 'PERSONA_LABEL',
    title: '균형 타입', // 5자
    oneLiner: '양쪽 의견을 모두 이해하려 하는 타입',
  },
  {
    awardType: 'PERSONA_LABEL',
    title: '뚝심 타입', // 5자
    oneLiner: '자신의 기준을 끝까지 지키는 타입',
  },
  {
    awardType: 'PERSONA_LABEL',
    title: '공감형', // 3자
    oneLiner: '분위기와 흐름을 읽는 타입',
  },
];

/** 라벨 title 최대 글자 수 (개발 중 가드용) */
export const PERSONA_LABEL_MAX_LENGTH = 8;

/** 문자열 → uint 해시 (djb2) */
function stringHash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
  }
  return h >>> 0;
}

export function getPersonaLabel(
  bundleSlug: string | undefined,
  currentUserId: string,
  answers: Array<{ electionId: string; electionItemId: string }>
): MyMedal {
  const pool = (bundleSlug && BUNDLE_PERSONA_LABELS[bundleSlug]) || DEFAULT_LABELS;
  const seed = answers
    .slice()
    .sort((a, b) => a.electionId.localeCompare(b.electionId))
    .map((a) => `${a.electionId}:${a.electionItemId}`)
    .join('|');
  const idx = stringHash(`${currentUserId}|${seed}`) % pool.length;
  return pool[idx];
}
```

- [ ] **Step 2: `MyResultView.tsx`에서 stub 제거, 실제 호출로 교체**

```tsx
import { getPersonaLabel } from '@/constants/bundle-persona-labels';

const personaLabel = useMemo(
  () => getPersonaLabel(result.bundleSlug ?? undefined, currentUserId, myMember?.answers ?? []),
  [result.bundleSlug, currentUserId, myMember?.answers]
);

// 이후 personaLabelStub을 personaLabel로 교체
<MyMedalSection
  myNickname={myMember?.displayName ?? myMember?.nickname ?? ''}
  awards={awards}
  currentUserId={currentUserId}
  personaLabel={personaLabel}
/>;

// handleCapture의 medals 계산에도 동일하게 반영
const medals = getMyMedals(awards, currentUserId, personaLabel);
```

- [ ] **Step 3: 개발 서버 확인**

연애 번들 슬러그로 진입 시 4종 라벨 중 하나가 일관되게 노출. 다른 번들은 DEFAULT_LABELS 사용.

- [ ] **Step 4: 커밋**

```bash
git add src/constants/bundle-persona-labels.ts \
        src/components/features/Compare/MyResultView/MyResultView.tsx
git commit -m "feat(compare): add bundle persona labels with deterministic hash fallback"
```

---

## Task 11 · Layer 2 (GroupAwards 필터 + PickASide + 성별 섹션)

**Files:**

- Modify: `src/components/features/Compare/GroupResult/GroupAwards.tsx`
- Modify: `src/components/features/Compare/MyResultView/MyResultView.tsx`

**의도:** 기존 `GroupAwards`를 재사용하되 "내가 이미 훈장으로 받은 어워드"는 제외하도록 prop을 추가. `PickASide`, `CrossGenderChemistry`, `GenderBattle`은 그대로 마운트.

- [ ] **Step 1: `GroupAwards.tsx`에 `excludeCurrentUserAwards` prop + `visibleAwards` prop 추가**

파일: `src/components/features/Compare/GroupResult/GroupAwards.tsx`

현재 `VISIBLE_AWARDS = ['CONTROVERSY_MAKER', 'PEOPLES_CHAMPION']` 고정이고, MyResultView는 "나 외 수상자 중심 재구성" + Layer 1에서 쓰지 않는 어워드도 포함해야 하므로 `visibleAwards` override prop을 추가한다. 기존 사용처(`FullGroupResultView`)는 prop 미지정 → 기존 상수 유지.

```tsx
// 기존 인터페이스 확장
interface GroupAwardsProps {
  awards: GroupAward[];
  currentUserId: string;
  /** 내가 수상한 어워드를 렌더 목록에서 제거 — MyResultView에서 훈장 중복 방지 */
  excludeCurrentUserAwards?: boolean;
  /** 표시할 어워드 타입 override. 미지정 시 기본 VISIBLE_AWARDS 사용. */
  visibleAwards?: readonly GroupAwardType[];
}

export const GroupAwards: FC<GroupAwardsProps> = ({
  awards,
  currentUserId,
  excludeCurrentUserAwards = false,
  visibleAwards,
}) => {
  const allowed = visibleAwards ?? VISIBLE_AWARDS;
  const visible = useMemo(() => {
    const base = awards.filter((a) => allowed.includes(a.type));
    if (!excludeCurrentUserAwards) return base;
    return base.filter((a) => !a.winners.includes(currentUserId));
  }, [awards, allowed, currentUserId, excludeCurrentUserAwards]);

  if (visible.length === 0) return null;
  // ... 기존 렌더 로직 (단, AWARD_IMAGES에 없는 타입은 placeholder 또는 이미지 생략 처리 필요 — Step 1a 참고)
};
```

- [ ] **Step 1a: `AWARD_IMAGES` 보강 (선택적)**

`AWARD_IMAGES`에는 현재 `CONTROVERSY_MAKER` / `PEOPLES_CHAMPION`만 있으므로, 다른 타입이 `visibleAwards`로 들어왔을 때 이미지 누락으로 런타임 오류가 나지 않도록 가드 추가.

```tsx
// 기존 <Image src={AWARD_IMAGES[award.type]} ... /> 위치에 가드
const img = AWARD_IMAGES[award.type];
{
  img ? (
    <Image src={img} alt={award.title} />
  ) : (
    <div className={styles.awardEmoji} aria-hidden>
      🏆
    </div>
  );
}
```

(이미지 누락 어워드는 Task 11에서 당장 확장해도 괜찮고, Phase 2로 미뤄도 무방. 본 태스크에서는 가드만 넣어 회귀를 막는다.)

(기본값 유지로 `FullGroupResultView`는 동작 불변. MyResultView가 Layer 2에서 `visibleAwards`를 넘겨 범위를 확장.)

- [ ] **Step 2: `MyResultView.tsx` Layer 2에 섹션 마운트**

스펙(2026-04-25): Layer 2는 **멤버/비멤버 모두 공개**. `excludeCurrentUserAwards`는 멤버 모드에서만(비멤버는 나 수상이 없으므로 필터 불필요하지만 prop 넘겨도 무해).

`visibleAwards`는 기본값 유지(`CONTROVERSY_MAKER` / `PEOPLES_CHAMPION`) — 스펙에 특별 확장 요구 없음. 필요하면 이후 튜닝.

```tsx
import { GroupAwards } from '@/components/features/Compare/GroupResult/GroupAwards';
import { PickASide } from '@/components/features/Compare/GroupResult/PickASide';
import { CrossGenderChemistry } from '@/components/features/Compare/GroupResult/CrossGenderChemistry';
import { GenderBattle } from '@/components/features/Compare/GroupResult/GenderBattle';

// Layer 2 <section> 내부 — 멤버/비멤버 모두 공개
{
  !singleMember && (
    <>
      <GroupAwards
        awards={awards}
        currentUserId={currentUserId}
        excludeCurrentUserAwards={isMember}
      />
      <PickASide result={displayResult} currentUserId={currentUserId} />
      {displayResult.showGenderContent && (
        <>
          <CrossGenderChemistry
            currentUserId={currentUserId}
            members={displayResult.members}
            pairs={pairs}
          />
          <GenderBattle result={displayResult} />
        </>
      )}
    </>
  );
}
```

- [ ] **Step 3: 개발 서버 QA**

- 내 훈장(예: CONTROVERSY_MAKER)이 `MyMedalSection`에 있을 때 `GroupAwards`에서 같은 항목이 빠졌는지 확인.
- PickASide/CrossGenderChemistry/GenderBattle 정상 렌더.

- [ ] **Step 4: 커밋**

```bash
git add src/components/features/Compare/GroupResult/GroupAwards.tsx \
        src/components/features/Compare/MyResultView/MyResultView.tsx
git commit -m "feat(compare): mount Layer 2 sections with GroupAwards excludeCurrentUser option"
```

---

## Task 12 · Layer 3 — "모든 멤버 결과 자세히 보기" 펼침

**Files:**

- Create: `src/components/features/Compare/MyResultView/MemberMoreSection.tsx`
- Create: `src/components/features/Compare/MyResultView/MemberMoreSection.module.scss`
- Modify: `src/components/features/Compare/MyResultView/MyResultView.tsx`

**의도:** 버튼 클릭 시 전체 멤버 카드 리스트(매칭률 정렬) 펼침. `ChemistryRanking`·`ChemistryNetwork`는 재사용하지 않기로 했으므로(스펙 Q5), 간단한 자체 리스트로 구현.

- [ ] **Step 1: `MemberMoreSection.tsx` 작성**

```tsx
'use client';

import { useState, type FC } from 'react';

import type { PairChemistry } from '@/types/group-compare';

import styles from './MemberMoreSection.module.scss';

interface MemberMoreSectionProps {
  currentUserId: string;
  members: Array<{ userId: string; nickname: string; displayProfileColor?: string }>;
  pairs: PairChemistry[];
  onMemberTap: (userId: string) => void;
}

export const MemberMoreSection: FC<MemberMoreSectionProps> = ({
  currentUserId,
  members,
  pairs,
  onMemberTap,
}) => {
  const [open, setOpen] = useState(false);

  const rows = members
    .filter((m) => m.userId !== currentUserId)
    .map((m) => {
      const p = pairs.find(
        (pp) =>
          (pp.memberA === currentUserId && pp.memberB === m.userId) ||
          (pp.memberB === currentUserId && pp.memberA === m.userId)
      );
      return { ...m, matchRate: p?.matchRate ?? 0 };
    })
    .sort((a, b) => b.matchRate - a.matchRate);

  if (rows.length === 0) return null;

  return (
    <section className={styles.section}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        모든 멤버 결과 자세히 보기 {open ? '▴' : '▾'}
      </button>
      {open && (
        <ul className={styles.list}>
          {rows.map((r) => (
            <li key={r.userId}>
              <button type="button" className={styles.row} onClick={() => onMemberTap(r.userId)}>
                <span
                  className={styles.avatar}
                  style={{ background: r.displayProfileColor ?? '#8a8a8a' }}
                  aria-hidden
                >
                  {r.nickname.slice(0, 1)}
                </span>
                <span className={styles.name}>{r.nickname}</span>
                <span className={styles.rate}>{r.matchRate}%</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
```

- [ ] **Step 2: `MemberMoreSection.module.scss`**

```scss
@use '@/styles/variables' as *;

.section {
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
  background: $bg-secondary;
  border: 1px solid #333;
  border-radius: $border-radius-lg;
  padding: $spacing-16;
}

.toggle {
  width: 100%;
  background: transparent;
  color: $text-secondary;
  font-size: $font-size-14;
  font-weight: 600;
  padding: $spacing-8;
  border: none;
  cursor: pointer;
  text-align: center;
}

.list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
}

.row {
  display: flex;
  align-items: center;
  gap: $spacing-16;
  width: 100%;
  padding: $spacing-8 $spacing-16;
  background: $bg-tertiary;
  border: 1px solid #333;
  border-radius: $border-radius-md;
  color: $white;
  cursor: pointer;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: $border-rounded;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-14;
  font-weight: 700;
}

.name {
  flex: 1;
  font-size: $font-size-14;
  text-align: left;
}

.rate {
  font-size: $font-size-14;
  font-weight: 700;
  color: $attention;
}
```

- [ ] **Step 3: `MyResultView.tsx`에 Layer 3 마운트**

```tsx
import { MemberMoreSection } from './MemberMoreSection';

{
  !singleMember && (
    <MemberMoreSection
      currentUserId={currentUserId}
      members={displayResult.members}
      pairs={pairs}
      onMemberTap={handleMemberCompare}
    />
  );
}
```

Layer 2 다음, `BundleRecommendSection` 앞에 배치.

- [ ] **Step 4: 개발 서버 확인**

토글 열림/닫힘, 매칭률 내림차순 정렬, 행 탭 시 `MemberDetailSheet` 열림.

- [ ] **Step 5: 커밋**

```bash
git add src/components/features/Compare/MyResultView/MemberMoreSection.tsx \
        src/components/features/Compare/MyResultView/MemberMoreSection.module.scss \
        src/components/features/Compare/MyResultView/MyResultView.tsx
git commit -m "feat(compare): add Layer 3 MemberMoreSection expandable list"
```

---

## Task 13 · 비멤버 잠금 상태

**Files:**

- Modify: `src/components/features/Compare/MyResultView/MyResultView.tsx`
- Modify: `src/components/features/Compare/GroupResult/LockedSectionPreview.tsx` (신규 sketch 추가 — Task 14에서 통합 처리 가능)

**의도(스펙 2026-04-25):**

- **Layer 1 잠금**: 훈장 3카드 / 궤도 / 소수답 Top 3 모두 `LockedSectionPreview`로 대체.
- **Layer 2 공개**: 그룹 어워드·투표 현황·이성 콘텐츠 토글은 멤버와 동일하게 노출(Task 11에서 이미 처리).
- **결과 캡처 버튼 숨김**: 비멤버는 공유할 "자기 결과"가 없음.
- **FloatingCta**: "나도 참여하기" 유지(Task 1에서 이미 처리).

- [ ] **Step 1: `LockedSectionPreview.tsx`에 `orbit-map` + `my-medal` + `my-extreme` sketchType 추가**

```tsx
type SketchType =
  | 'chemistry-network'
  | 'pick-a-side'
  | 'group-awards'
  | 'orbit-map'
  | 'my-medal'
  | 'my-extreme';

// JSX 분기에 세 개 추가
{
  sketchType === 'orbit-map' && <OrbitMapSketch />;
}
{
  sketchType === 'my-medal' && <MyMedalSketch />;
}
{
  sketchType === 'my-extreme' && <MyExtremeSketch />;
}
```

파일 하단에 세 스케치 추가:

```tsx
function OrbitMapSketch() {
  return (
    <svg viewBox="0 0 300 180" preserveAspectRatio="xMidYMid meet" role="presentation">
      <circle cx="150" cy="90" r="30" stroke="rgba(255,0,255,0.35)" strokeWidth="1" fill="none" />
      <circle
        cx="150"
        cy="90"
        r="60"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="1"
        fill="none"
        strokeDasharray="4 4"
      />
      <circle
        cx="150"
        cy="90"
        r="85"
        stroke="rgba(239,68,68,0.25)"
        strokeWidth="1"
        fill="none"
        strokeDasharray="2 6"
      />
      <circle cx="150" cy="90" r="14" fill="url(#lockedPreviewNodeGrad)" />
      {[0.3, 0.9, 1.6, 2.5, 4.2, 5.0].map((a, i) => {
        const r = [30, 60, 60, 85, 30, 85][i];
        return (
          <circle
            key={i}
            cx={150 + Math.cos(a) * r}
            cy={90 + Math.sin(a) * r}
            r={6}
            fill="rgba(255,110,199,0.6)"
            stroke="rgba(255,255,255,0.4)"
          />
        );
      })}
      <defs>
        <linearGradient id="lockedPreviewNodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,0,255,0.75)" />
          <stop offset="100%" stopColor="rgba(255,69,0,0.75)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function MyMedalSketch() {
  // 훈장 3단 카드 골격
  return (
    <svg viewBox="0 0 300 180" preserveAspectRatio="xMidYMid meet" role="presentation">
      {[24, 82, 140].map((y, i) => (
        <g key={i}>
          <rect
            x={30}
            y={y}
            width={240}
            height={40}
            rx={10}
            fill="rgba(30,30,30,0.55)"
            stroke={i === 0 ? 'rgba(255,0,255,0.5)' : 'rgba(255,255,255,0.15)'}
            strokeWidth={i === 0 ? 1.5 : 1}
          />
          <rect x={46} y={y + 14} width={100} height={6} rx={3} fill="rgba(255,255,255,0.45)" />
          <rect x={46} y={y + 26} width={60} height={4} rx={2} fill="rgba(255,255,255,0.25)" />
        </g>
      ))}
    </svg>
  );
}

function MyExtremeSketch() {
  return (
    <svg viewBox="0 0 300 180" preserveAspectRatio="xMidYMid meet" role="presentation">
      {[20, 70, 120].map((y, i) => (
        <g key={i}>
          <rect x={30} y={y} width={240} height={10} rx={2} fill="rgba(255,255,255,0.22)" />
          <rect
            x={30}
            y={y + 18}
            width={80}
            height={18}
            rx={9}
            fill="url(#lockedPreviewNodeGrad)"
          />
          <rect x={118} y={y + 22} width={100} height={5} rx={2} fill="rgba(223,255,0,0.45)" />
        </g>
      ))}
      <defs>
        <linearGradient id="lockedPreviewNodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,0,255,0.75)" />
          <stop offset="100%" stopColor="rgba(255,69,0,0.75)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
```

- [ ] **Step 2: `MyResultView.tsx`에서 비멤버 분기**

```tsx
import { LockedSectionPreview } from '@/components/features/Compare/GroupResult/LockedSectionPreview';

// Layer 1 내부를 isMember/비멤버로 분기 — 결과 캡처 버튼은 멤버만
{!singleMember && isMember && (
  <>
    <MyMedalSection ... />
    <OrbitMap ... />
    <MyExtremeAnswersSection ... />
    <CaptureButton ... />
  </>
)}

{!singleMember && !isMember && (
  <>
    <LockedSectionPreview
      title="나의 훈장"
      desc="참여하면 나만의 훈장 3단이 열려요"
      sketchType="my-medal"
    />
    <LockedSectionPreview
      title="나의 위치"
      desc="여기에 당신이 들어올 수 있어요"
      sketchType="orbit-map"
    />
    <LockedSectionPreview
      title="혼자만 다르게 고른 답"
      desc="참여하면 소수 의견 TOP 3가 공개돼요"
      sketchType="my-extreme"
    />
    {/* 결과 캡처 버튼은 비멤버에게 노출하지 않음 (공유할 자기 결과 없음) */}
  </>
)}
```

Layer 2는 이미 Task 11에서 `{!singleMember && ...}`로 멤버/비멤버 공통 노출하도록 설정됨 — 추가 작업 없음.

- [ ] **Step 3: 개발 서버에서 비멤버 QA**

비로그인 또는 비멤버 계정으로 접속 → 체크:

- Layer 1: 잠금 프리뷰 3종(훈장/궤도/소수답) 노출
- 결과 캡처 버튼 **미노출**
- Layer 2: `GroupAwards` + `PickASide` (+토글 시 성별) 정상 노출
- Layer 3: `MemberMoreSection` 정상 노출
- `FloatingCta` 라벨: "나도 참여하기"

- [ ] **Step 4: 커밋**

```bash
git add src/components/features/Compare/GroupResult/LockedSectionPreview.tsx \
        src/components/features/Compare/MyResultView/MyResultView.tsx
git commit -m "feat(compare): lock Layer 1 sections for non-members"
```

---

## Task 14 · 참여자 1명 잠김 프리뷰 적용

**Files:**

- Modify: `src/components/features/Compare/MyResultView/MyResultView.tsx`

**의도:** `singleMember === true`일 때 기존 `FullGroupResultView`의 1명 브랜치와 동일한 UX — 훈장/궤도/소수답 자리에 `LockedSectionPreview` 3종 + 안내 배너. Task 13의 sketchType을 그대로 재사용.

- [ ] **Step 1: `MyResultView.tsx`에 1명 분기 추가**

`FullGroupResultView.tsx:313-356`를 참고해 1명용 `singleMemberHint` + 잠금 프리뷰 3종을 MyResultView 레이아웃에 이식.

```tsx
{
  singleMember &&
    (() => {
      const firstMember = members[0];
      const singleMemberName = firstMember?.displayName ?? firstMember?.nickname ?? '참여자';
      const hintTitle = `아직 ${singleMemberName}님 혼자예요`;
      const hintText = isMember
        ? '친구가 참여하면 재미난 비교 결과를 볼 수 있어요'
        : '참여해서 비교하면 재미난 결과를 볼 수 있어요';
      return (
        <>
          {/* grStyles.singleMemberHint 스타일 재사용 */}
          <div className={grStyles.singleMemberHint} role="status">
            <p className={grStyles.singleMemberTitle}>{hintTitle}</p>
            <p className={grStyles.singleMemberText}>{hintText}</p>
            {isMember && (
              <button
                type="button"
                className={grStyles.singleMemberEditProfile}
                onClick={() => setShowEditProfileModal(true)}
              >
                참여 프로필 수정
              </button>
            )}
          </div>
          <LockedSectionPreview
            title="나의 훈장"
            desc={isMember ? '친구가 참여하면 훈장이 열려요' : '참여하면 나의 훈장이 열려요'}
            sketchType="my-medal"
          />
          <LockedSectionPreview
            title="나의 위치"
            desc={
              isMember
                ? '친구가 참여하면 궤도가 펼쳐져요'
                : '참여하면 궤도에서 나의 자리가 펼쳐져요'
            }
            sketchType="orbit-map"
          />
          <LockedSectionPreview
            title="혼자만 다르게 고른 답"
            desc="친구가 참여해야 소수답 비교가 가능해요"
            sketchType="my-extreme"
          />
        </>
      );
    })();
}
```

기존 레이어 렌더는 `!singleMember` 가드로 감싼다(Task 1에서 이미 적용됨).

- [ ] **Step 2: 개발 서버 QA**

혼자 있는 compare token으로 접속 → 안내 배너 + 프리뷰 3종 표시, 플로팅 CTA가 멤버일 때 "공유하기" / 비멤버일 때 "나도 참여하기"인지 확인.

- [ ] **Step 3: 커밋**

```bash
git add src/components/features/Compare/MyResultView/MyResultView.tsx
git commit -m "feat(compare): wire single-member locked previews for MyResultView"
```

---

## Task 15 · 전체 회귀 QA + hp-ux-reviewer 셀프 리뷰

**Files:**

- N/A (체크리스트 + 수정 사항 반영)

**의도:** 구현 완료 후 전체 플로우를 돌려 회귀 없는지 확인. 필요하면 hp-ux-reviewer에게 리뷰 의뢰.

- [ ] **Step 1: 수동 회귀 QA 체크리스트**

아래 시나리오를 개발 서버(`pnpm dev`)에서 직접 확인. (Hero/모달/FloatingCta는 `FullGroupResultView`에서 복제됐으므로 기존 동작과 동일해야 함.)

- [ ] 그룹 3명+ · 로그인 멤버: 훈장 3단 + 궤도 + 소수답(조건 만족 시) + "결과 캡처" 1버튼 + Layer2 + Layer3 모두 보임
- [ ] 그룹 2명 · 로그인 멤버: 훈장 3단(TOP = SOUL_CONNECTION 우선) + 궤도 + **소수답 미노출** + 결과 캡처 + Layer2 + Layer3
- [ ] 그룹 5명 · 로그인 멤버: 궤도에 모든 멤버가 각 궤도 레이어에 분산 배치
- [ ] 그룹 5명 · 비로그인(비멤버): Layer 1 잠금 프리뷰 3종, **결과 캡처 버튼 없음**, Layer2/3 그대로 공개, FloatingCta "나도 참여하기"
- [ ] 그룹 1명 · 생성자: 1명용 잠금 프리뷰 3종 + FloatingCta "공유하기"(링크 복사 동작)
- [ ] 그룹 1명 · 비멤버 진입: 1명용 잠금 프리뷰 3종 + FloatingCta "나도 참여하기"
- [ ] 선언 타이틀 검증:
  - [ ] 내가 SOUL_CONNECTION 수상자일 때 "OOO님은 유진님과 **소울 메이트**예요" 포맷
  - [ ] 내가 CONTROVERSY_MAKER만 수상했을 때 TOP은 성향 라벨 폴백(부정 뉘앙스 어워드 미노출)
  - [ ] TOP이 SOUL_CONNECTION일 때 케미 파트너 슬롯이 POLAR_OPPOSITES로 대체되거나 비어있음(중복 방지)
- [ ] 소수답 섹션 조건: 참여자 3명+ AND 비율 ≤ 33% 질문이 있을 때만 노출
- [ ] 성향 라벨 title 글자 수 ≤ 8자(번들별 마스터 / DEFAULT 모두)
- [ ] 그룹 설정 모달(설정 → 그룹명/이성 토글) 저장 → 새로고침 없이 반영
- [ ] displayName 편집 모달 저장 → 반영
- [ ] `joinAfter=true` 쿼리로 진입: displayName 모달 자동 열림
- [ ] 궤도 드래그/핀치/휠/탭 전부 동작, MemberDetailSheet 열림
- [ ] 궤도 첫방문 힌트: "탭해서 자세히 보기" 문구, 클릭 시 localStorage 저장되어 재진입 시 미노출
- [ ] "결과 캡처" → 모바일 share sheet 또는 PNG 다운로드, 공유 카드에 파트너 이름 포함(TOP이 쌍 어워드일 때)
- [ ] FloatingCta "공유하기" 클릭 → 링크 복사 + 토스트
- [ ] Bundle 플레이 후 복귀(`joinAfter`) 경로 정상
- [ ] `NotFoundView`: 잘못된 token으로 404 시 기존 동작 유지
- [ ] Canvas 폴백: 개발자도구에서 임시로 `setRenderError(true)` 강제 → SVG 폴백 노출, 복원 후 정상

- [ ] **Step 2: 린트 · 타입 체크**

```bash
pnpm run lint && pnpm exec tsc --noEmit
```

오류 없음.

- [ ] **Step 3: hp-ux-reviewer에게 셀프 리뷰 요청**

```text
/hp-ux-reviewer
경로: src/components/features/Compare/MyResultView/*
스펙: docs/superpowers/specs/2026-04-24-bundle-result-redesign-design.md
범위: Layer 1(훈장/궤도/소수답/공유) + 비멤버/1명 잠금 프리뷰 + Layer 2/3 회귀 영향
```

지적 사항이 있으면 해당 내용만 수정 후 Task 15 Step 1을 재수행.

- [ ] **Step 4: 최종 커밋 (수정 있을 때만)**

```bash
git add -p  # 수정 파일 선택적 스테이징
git commit -m "fix(compare): address hp-ux-reviewer feedback on MyResultView"
```

---

## 빌드 순서 요약

1. Task 1 — 골격 + 라우팅
2. Task 2, 3 — 훈장 로직 · 섹션 (성향 라벨은 stub)
3. Task 4, 5, 6 — 궤도 (정적 → 폴백 → 인터랙션)
4. Task 7 — 소수답
5. Task 8, 9 — 공유 버튼 · 이미지 캔버스
6. Task 10 — 성향 라벨 실제화
7. Task 11 — Layer 2
8. Task 12 — Layer 3
9. Task 13, 14 — 잠금 상태(비멤버 / 1명)
10. Task 15 — QA

각 태스크는 독립적으로 테스트 가능하고 롤백 가능하다. Task 2~3, Task 4~6, Task 8~9는 의존관계가 있으므로 순차 진행 권장.

---

## 변경 이력

- 2026-04-24: 초안 작성.
- 2026-04-25: hp-ux-reviewer 피드백 반영 (스펙 2026-04-25 업데이트 동기화).
  - Task 1: `FloatingCta` 멤버 라벨 "친구들 초대하기" → "공유하기" 변경 스텝 추가.
  - Task 2: TOP 수상 우선순위 재정의 (SOUL_CONNECTION > PEOPLES_CHAMPION > GROUP_LEADER > POLAR_OPPOSITES). CONTROVERSY_MAKER / GROUP_OUTSIDER 제외. 케미 파트너 TOP 중복 방지.
  - Task 3: 선언 타이틀 파트너 포함형 카피 ("OOO님은 유진님과 소울 메이트예요"). MedalCard에 `showPartner` prop 추가.
  - Task 6: 첫방문 힌트 문구 "탭해서 자세히 보기"로 톤 다운.
  - Task 7: 소수답 엠프티 조건 정의 — 참여자 3명+ AND 비율 ≤ 33% 질문 1개+, 미달 시 섹션 전체 숨김.
  - Task 8: `ShareButtons`(2버튼) → `CaptureButton`(1버튼)으로 구조 변경. 파일명/컴포넌트명도 변경.
  - Task 9: `renderShareCard`에 `topMedalPartner?: string` 필드 추가하여 공유 카드에도 파트너 포함형 카피 반영.
  - Task 10: 성향 라벨 최대 8자 규칙 명시, 라벨 마스터 문구 길이 조정. `personaLabelStub` 8자 이하로 갱신.
  - Task 11: Layer 2 비멤버 공개(`!singleMember` 단일 조건으로 분기). `GroupAwards`에 `visibleAwards` override prop + `AWARD_IMAGES` 가드 추가.
  - Task 13: 비멤버 분기 업데이트 — 결과 캡처 버튼 숨김, Layer 2 공개, 잠금 프리뷰 카피 튜닝.
  - Task 15: QA 체크리스트를 새 스펙에 맞춰 재구성 (2명/3명+ 분기, 선언 타이틀 검증, 8자 라벨 확인 등).
