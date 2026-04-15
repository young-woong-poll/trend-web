# 1:1 비교 프리뷰 모드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 1:1 비교 링크 생성 후 모달 대신 가상 상대("???")와의 프리뷰 결과 페이지로 바로 이동하여 공유 전환율을 높인다.

**Architecture:** CTA 버튼 클릭 시 `useCreateCompareLink`를 직접 호출하고 `/compare/match/{token}`으로 이동. CompareResult에서 결과가 없고 생성자인 경우 FE에서 가상 답변을 생성하여 프리뷰 모드를 렌더링. CompareLanding의 `isCreatorWaiting` 상태는 결과 페이지로 리다이렉트.

**Tech Stack:** Next.js 14 (App Router), TypeScript, SCSS Modules, React Query v5

---

## File Structure

| 파일                                                                      | 역할               | 변경                                                     |
| ------------------------------------------------------------------------- | ------------------ | -------------------------------------------------------- |
| `src/components/features/Compare/CompareLanding/CompareLanding.tsx`       | 1:1 랜딩 페이지    | `isCreatorWaiting` → `/compare/match/{token}` 리다이렉트 |
| `src/components/features/Compare/CompareResult/CompareResult.tsx`         | 1:1 결과 페이지    | 프리뷰 모드 분기, 가상 상대 생성, 배너, CTA 교체         |
| `src/components/features/Compare/CompareResult/CompareResult.module.scss` | 결과 페이지 스타일 | 프리뷰 배너, 프리뷰 CTA 스타일 추가                      |
| `src/components/features/Bundle/BundleResult/BundleResult.tsx`            | 번들 결과 페이지   | CreateCompareLink 모달 → 직접 링크 생성 + 이동           |
| `src/components/features/Compare/GroupResult/GroupResult.tsx`             | 그룹 결과 페이지   | CreateCompareLink 모달 → 직접 링크 생성 + 이동           |

---

### Task 1: CompareLanding — isCreatorWaiting 리다이렉트

**Files:**

- Modify: `src/components/features/Compare/CompareLanding/CompareLanding.tsx`

- [ ] **Step 1: `isCreatorWaiting` 상태에서 결과 페이지로 리다이렉트**

`src/components/features/Compare/CompareLanding/CompareLanding.tsx`에서 상태 분기 직후 (`const resultPath` 이후, `handleAction` 이전)에 리다이렉트 로직을 추가한다.

먼저 파일 상단의 import에 `useEffect`를 추가한다. 현재:

```typescript
import { useState, type FC } from 'react';
```

변경:

```typescript
import { useEffect, useState, type FC } from 'react';
```

그다음, `const resultPath = ...` 줄 아래에 다음 useEffect를 추가한다:

```typescript
// 생성자 대기 상태 → 프리뷰 결과 페이지로 리다이렉트
useEffect(() => {
  if (isCreatorWaiting) {
    router.replace(resultPath);
  }
}, [isCreatorWaiting, resultPath, router]);
```

- [ ] **Step 2: 봉투 대기 UI의 불필요한 코드 정리**

기존 `showWaiting` 관련 코드를 제거한다.

1. `const showWaiting = isCreatorWaiting;` 줄 삭제

2. JSX에서 봉투 섹션 전체를 삭제 (주석 `{/* ─── 생성자 대기 상태: 초대장 컨셉 ─── */}` 부터 닫는 `)}` 까지):

```tsx
{
  /* ─── 생성자 대기 상태: 초대장 컨셉 ─── */
}
{
  showWaiting && <div className={styles.envelopeSection}>...전체 삭제...</div>;
}
```

3. `getHeroMessage`에서 `isCreatorWaiting` 분기를 삭제:

```typescript
// 삭제:
if (isCreatorWaiting) {
  return '링크를 받은 상대방이 투표를 완료하면\n비교 결과를 확인할 수 있어요';
}
```

4. `getCtaText`에서 `isCreatorWaiting` 분기를 삭제:

```typescript
// 삭제:
if (isCreatorWaiting) {
  return '상대방 참여 대기 중...';
}
```

5. CTA 버튼의 `disabled` 조건에서 `isCreatorWaiting` 제거:

```typescript
// 변경 전:
disabled={isCreatorWaiting || joinMutation.isPending}
// 변경 후:
disabled={joinMutation.isPending}
```

6. `handleCopyLink` 함수와 `copied` state 삭제 (봉투 UI에서만 사용):

```typescript
// 삭제:
const [copied, setCopied] = useState(false);
// 삭제:
const handleCopyLink = async () => { ... };
```

7. 더 이상 사용하지 않는 `CopyIcon` import 삭제:

```typescript
// 삭제:
import CopyIcon from '@/assets/icon/CopyIcon';
```

- [ ] **Step 3: 타입 체크 확인**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/components/features/Compare/CompareLanding/CompareLanding.tsx
git commit -m "feat: isCreatorWaiting → /compare/match/{token} 리다이렉트, 봉투 대기 UI 제거"
```

---

### Task 2: CompareResult — 프리뷰 모드 추가

**Files:**

- Modify: `src/components/features/Compare/CompareResult/CompareResult.tsx`
- Modify: `src/components/features/Compare/CompareResult/CompareResult.module.scss`

- [ ] **Step 1: SCSS에 프리뷰 배너 + 프리뷰 CTA 스타일 추가**

`src/components/features/Compare/CompareResult/CompareResult.module.scss` 파일 끝에 다음을 추가한다:

```scss
// ─── 프리뷰 모드 ───

.previewBanner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 20px;
  background: rgba(#fff, 0.04);
  border: 1px dashed rgba(#fff, 0.12);
  border-radius: $border-radius-lg;
  margin-bottom: 8px;
  width: 100%;
}

.previewText {
  font-size: $font-size-12;
  color: $text-tertiary;
  line-height: 1.5;
  text-align: center;
}

.previewCta {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 20px calc(env(safe-area-inset-bottom, 0px) + 12px);
  background: linear-gradient(transparent, rgba(#121212, 0.95) 20%);
  animation: fadeSlideUp 0.5s ease-out 1s both;
}

.previewCtaButton {
  width: 100%;
  height: 52px;
  border: none;
  border-radius: 12px;
  font-size: $font-size-16;
  font-weight: 600;
  color: $white;
  cursor: pointer;
  background: $primary-gradient;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
}
```

- [ ] **Step 2: CompareResult 컴포넌트에 프리뷰 모드 로직 추가**

`src/components/features/Compare/CompareResult/CompareResult.tsx`를 수정한다.

**2-1. import 추가:**

기존 import 블록에 추가:

```typescript
import { FloatingCta } from '@/components/common/FloatingCta/FloatingCta';
import { useCompareLink } from '@/hooks/api/useCompare';
import { useBundleMyResult } from '@/hooks/api/useBundle';
import { useToast } from '@/hooks/useToast';
import { Toast } from '@/components/common/Toast/Toast';
```

기존 import 블록에서 삭제:

```typescript
import { CreateCompareLink } from '@/components/features/Bundle/BundleResult/CreateCompareLink';
```

**2-2. 가상 답변 생성 함수 추가 (컴포넌트 밖, import 아래):**

```typescript
/** 가상 상대 답변 생성 (시드 기반, ~40-60% matchRate) */
function generateGhostAnswers(
  myAnswers: Array<{ electionId: string; selected: 'A' | 'B' }>,
  seed: number
): Array<{ electionId: string; selected: 'A' | 'B' }> {
  return myAnswers.map((a, i) => ({
    electionId: a.electionId,
    selected: (seed + i) % 3 === 0 ? a.selected : a.selected === 'A' ? 'B' : 'A',
  }));
}
```

**2-3. 컴포넌트 내부 상태 변경:**

기존 상태 선언 부분:

```typescript
const { data: result, isLoading } = useCompareResult(token);
const router = useRouter();
const [showCompareModal, setShowCompareModal] = useState(false);
const [showGroupModal, setShowGroupModal] = useState(false);
```

변경:

```typescript
const { data: result, isLoading } = useCompareResult(token);
const { data: link } = useCompareLink(token);
const router = useRouter();
const { toast, showToast } = useToast();
const [showGroupModal, setShowGroupModal] = useState(false);

// 프리뷰 모드: 결과 없음 + 생성자
const isPreview = !result && !isLoading && !!link?.isCreator;
const { data: myBundleResult } = useBundleMyResult(isPreview ? (link?.bundleSlug ?? '') : '');
```

**2-4. 접근 제어 변경 — `result` 없을 때 리다이렉트 조건 수정:**

기존:

```typescript
// 접근제어: 결과 없음 → compare 랜딩
useEffect(() => {
  if (!isLoading && !result && isLoggedIn) {
    router.replace(`/compare/${token}`);
  }
}, [isLoading, result, isLoggedIn, token, router]);
```

변경 (생성자는 프리뷰를 볼 수 있으므로 리다이렉트하지 않음):

```typescript
// 접근제어: 결과 없음 + 비생성자 → compare 랜딩
useEffect(() => {
  if (!isLoading && !result && isLoggedIn && link && !link.isCreator) {
    router.replace(`/compare/${token}`);
  }
}, [isLoading, result, isLoggedIn, link, token, router]);
```

**2-5. 프리뷰 데이터 생성 (기존 `if (!result)` 블록 위에):**

```typescript
// ─── 프리뷰 모드: 가상 데이터 생성 ───
if (isPreview && myBundleResult) {
  const ghostAnswers = generateGhostAnswers(
    myBundleResult.myAnswers.map((a) => ({ electionId: a.electionId, selected: a.selected })),
    42
  );
  const myAnswers = myBundleResult.myAnswers.map((a) => ({
    electionId: a.electionId,
    selected: a.selected,
  }));
  let matchCount = 0;
  for (const my of myAnswers) {
    const ghost = ghostAnswers.find((g) => g.electionId === my.electionId);
    if (ghost && my.selected === ghost.selected) {
      matchCount++;
    }
  }
  const matchRate = Math.round((matchCount / myAnswers.length) * 100);

  const previewResult = {
    bundleSlug: myBundleResult.bundleSlug,
    bundleTitle: myBundleResult.bundleTitle,
    totalQuestions: myBundleResult.totalQuestions,
    categoryCode: link?.categoryCode,
    me: { nickname: link?.creatorNickname ?? '나', answers: myAnswers },
    target: { nickname: '???', answers: ghostAnswers },
    questionStats: myBundleResult.myAnswers.map((a) => {
      const stats = myBundleResult.questionStats.find((s) => s.electionId === a.electionId);
      return {
        electionId: a.electionId,
        title: a.title,
        optionA: a.optionA,
        optionB: a.optionB,
        optionACount: stats?.optionACount ?? 50,
        optionBCount: stats?.optionBCount ?? 50,
      };
    }),
    matchCount,
    matchRate,
  };

  const previewShockPoint = findShockPoint(previewResult);
  const previewStoryData = classifyAnswers(previewResult);

  const handleCopyInvite = async () => {
    const url = `${window.location.origin}/compare/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('초대 링크가 복사되었어요');
    } catch {
      showToast('복사에 실패했습니다');
    }
  };

  return (
    <BundleBackground categoryCode={previewResult.categoryCode}>
      <div className={styles.container}>
        <div className={styles.previewBanner}>
          <p className={styles.previewText}>
            가상 상대와의 미리보기예요.
            <br />
            상대방이 참여하면 진짜 결과를 볼 수 있어요!
          </p>
        </div>

        <div className={styles.resultHeader}>
          <CategoryBadge categoryCode={previewResult.categoryCode} />
          <h2 className={styles.resultTitle}>{previewResult.bundleTitle}</h2>
        </div>

        <ChemistryCard
          matchRate={previewResult.matchRate}
          myNickname={previewResult.me.nickname}
          targetNickname={previewResult.target.nickname}
          bundleTitle={previewResult.bundleTitle}
        />

        <AnswerComparison
          data={previewStoryData}
          myNickname={previewResult.me.nickname}
          targetNickname={previewResult.target.nickname}
        />

        {previewShockPoint && (
          <ShockPoint
            data={previewShockPoint}
            myNickname={previewResult.me.nickname}
            targetNickname={previewResult.target.nickname}
          />
        )}

        <PopularityCompare result={previewResult} />
      </div>

      <FloatingCta onClick={handleCopyInvite}>
        초대 링크 복사하기
      </FloatingCta>

      <Toast message={toast.message} isVisible={toast.isVisible} />
    </BundleBackground>
  );
}
```

**2-6. 기존 실제 결과 렌더링의 CTA 부분에서 CreateCompareLink 모달 제거:**

기존 `showCompareModal` state 삭제 (`useState(false)` 줄 — Step 2-3에서 이미 제거).

기존 floatingCta JSX에서 "다른 친구랑 비교하기" 버튼의 onClick을 변경:

```tsx
<button type="button" className={styles.ctaOneToOne} onClick={handleCreateCompare}>
  다른 친구랑 비교하기
</button>
```

`handleCreateCompare` 함수를 `useCreateCompareLink`를 활용하여 추가한다. 기존 import에서 `useCreateCompareLink`를 추가:

```typescript
import { useCompareLink, useCompareResult, useCreateCompareLink } from '@/hooks/api/useCompare';
```

컴포넌트 내부에 추가 (기존 hooks 선언 근처):

```typescript
const createCompareMutation = useCreateCompareLink(result?.bundleSlug ?? '');
```

핸들러 추가 (return 위):

```typescript
const handleCreateCompare = async () => {
  try {
    const res = await createCompareMutation.mutateAsync({ type: 'ONE_TO_ONE' });
    router.push(`/compare/match/${res.token}`);
  } catch {
    showToast('링크 생성에 실패했습니다');
  }
};
```

기존 CreateCompareLink 모달 JSX 삭제:

```tsx
// 삭제:
{
  showCompareModal && (
    <CreateCompareLink
      slug={result.bundleSlug}
      categoryCode={result.categoryCode}
      onClose={() => setShowCompareModal(false)}
    />
  );
}
```

실제 결과 렌더링에도 Toast를 추가 (기존 `</BundleBackground>` 직전):

```tsx
<Toast message={toast.message} isVisible={toast.isVisible} />
```

- [ ] **Step 3: 타입 체크 확인**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/components/features/Compare/CompareResult/CompareResult.tsx src/components/features/Compare/CompareResult/CompareResult.module.scss
git commit -m "feat: CompareResult에 프리뷰 모드 추가 — 가상 상대 '???' + 초대 링크 복사 CTA"
```

---

### Task 3: BundleResult — CreateCompareLink 모달 → 직접 이동

**Files:**

- Modify: `src/components/features/Bundle/BundleResult/BundleResult.tsx`

- [ ] **Step 1: import 변경**

1. `CreateCompareLink` import 삭제:

```typescript
// 삭제:
import { CreateCompareLink } from '@/components/features/Bundle/BundleResult/CreateCompareLink';
```

2. `useCreateCompareLink` import 추가. 기존:

```typescript
import { useJoinCompareLink } from '@/hooks/api/useCompare';
```

변경:

```typescript
import { useCreateCompareLink, useJoinCompareLink } from '@/hooks/api/useCompare';
```

- [ ] **Step 2: 상태 및 핸들러 변경**

1. `showCompareModal` state 삭제:

```typescript
// 삭제:
const [showCompareModal, setShowCompareModal] = useState(false);
```

2. `useCreateCompareLink` 훅 추가 (기존 hooks 근처):

```typescript
const createCompareMutation = useCreateCompareLink(slug);
```

3. 핸들러 함수 추가 (return 위):

```typescript
const handleCreateCompare = async () => {
  try {
    const res = await createCompareMutation.mutateAsync({ type: 'ONE_TO_ONE' });
    router.push(`/compare/match/${res.token}`);
  } catch {
    showToast('링크 생성에 실패했습니다');
  }
};
```

- [ ] **Step 3: JSX 변경**

1. CTA 버튼의 onClick 변경:

```tsx
// 변경 전:
onClick={() => setShowCompareModal(true)}
// 변경 후:
onClick={handleCreateCompare}
```

2. CreateCompareLink 모달 JSX 삭제:

```tsx
// 삭제:
{
  showCompareModal && (
    <CreateCompareLink
      slug={slug}
      categoryCode={bundle?.categoryCode}
      onClose={() => setShowCompareModal(false)}
    />
  );
}
```

- [ ] **Step 4: 타입 체크 확인**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/components/features/Bundle/BundleResult/BundleResult.tsx
git commit -m "feat: BundleResult 1:1 비교 CTA → 모달 없이 직접 링크 생성 + 이동"
```

---

### Task 4: GroupResult — CreateCompareLink 모달 → 직접 이동

**Files:**

- Modify: `src/components/features/Compare/GroupResult/GroupResult.tsx`

- [ ] **Step 1: import 변경**

1. `CreateCompareLink` import 삭제:

```typescript
// 삭제:
import { CreateCompareLink } from '@/components/features/Bundle/BundleResult/CreateCompareLink';
```

2. `useCreateCompareLink` import 추가. 기존 useCompare import에 추가:

```typescript
import {
  compareKeys,
  useCompareLink,
  useCreateCompareLink,
  useCreatePairCompare,
  useGroupCompareResult,
  useJoinCompareLink,
  useUpdateGroupSettings,
} from '@/hooks/api/useCompare';
```

- [ ] **Step 2: 상태 및 핸들러 변경**

1. `showCompareModal` state 삭제:

```typescript
// 삭제:
const [showCompareModal, setShowCompareModal] = useState(false);
```

2. `useCreateCompareLink` 훅 추가 (기존 hooks 근처):

```typescript
const createCompareMutation = useCreateCompareLink(result?.bundleSlug ?? '');
```

3. 핸들러 함수 추가 (return 위):

```typescript
const handleCreateCompare = async () => {
  try {
    const res = await createCompareMutation.mutateAsync({ type: 'ONE_TO_ONE' });
    router.push(`/compare/match/${res.token}`);
  } catch {
    showToast('링크 생성에 실패했습니다');
  }
};
```

- [ ] **Step 3: JSX 변경**

1. "친구랑 1:1 비교하기" 버튼의 onClick 변경:

```tsx
// 변경 전:
onClick={() => setShowCompareModal(true)}
// 변경 후:
onClick={handleCreateCompare}
```

2. CreateCompareLink 모달 JSX 삭제:

```tsx
// 삭제:
{
  showCompareModal && (
    <CreateCompareLink
      slug={result.bundleSlug}
      categoryCode={result.categoryCode}
      onClose={() => setShowCompareModal(false)}
    />
  );
}
```

- [ ] **Step 4: 타입 체크 확인**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/components/features/Compare/GroupResult/GroupResult.tsx
git commit -m "feat: GroupResult 1:1 비교 CTA → 모달 없이 직접 링크 생성 + 이동"
```

---

### Task 5: 최종 검증 & 정리

**Files:**

- Delete (optional): `src/components/features/Bundle/BundleResult/CreateCompareLink.tsx`
- Delete (optional): `src/components/features/Bundle/BundleResult/CreateCompareLink.module.scss`

- [ ] **Step 1: CreateCompareLink 사용처 확인**

Run: `grep -r "CreateCompareLink" src/ --include="*.tsx" --include="*.ts"`
Expected: `CompareLanding.tsx`에서만 참조 (isAlreadyTaken 상태에서 사용). 해당 사용처가 유일하다면 CompareLanding의 사용은 유지하고 파일은 삭제하지 않는다.

만약 `CompareLanding.tsx`에서도 참조한다면 — 이 파일은 `isAlreadyTaken` 상태에서 "이미 선점된 링크" 시나리오에서 새 비교 링크 생성 모달로 사용되므로 유지한다.

- [ ] **Step 2: 전체 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 빌드 체크**

Run: `npm run build 2>&1 | tail -5`
Expected: 빌드 성공

- [ ] **Step 4: 커밋 (정리 사항이 있는 경우만)**

```bash
git add -A
git commit -m "chore: 1:1 비교 프리뷰 모드 최종 정리"
```
