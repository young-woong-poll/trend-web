---
name: qa-test
description: >
  Sync E2E tests with QA checklists. Use when the user says "/qa-test",
  "sync tests", "generate e2e tests", "update e2e from checklist", or after
  updating QA checklist files in qa/. Reads checklist files and ensures
  corresponding Playwright E2E test files cover all checklist items.
metadata:
  author: hotpick
  version: '1.0.0'
---

# QA Test — 체크리스트 ↔ E2E 테스트 동기화

QA 체크리스트(`qa/{name}/checklist.md`)를 읽고, 대응하는 E2E 테스트(`qa/{name}/*.spec.ts`)가 체크리스트 항목을 커버하는지 점검하고 동기화한다.

## 사용법

```
/qa-test              → 전체 페이지 점검
/qa-test main         → 메인 페이지만 점검
/qa-test detail       → 상세 페이지만 점검
```

## 파일 매핑

```
qa/{name}/checklist.md  ←→  qa/{name}/*.spec.ts
qa/helpers/             ←   Page Object 헬퍼 클래스
```

## 실행 절차

### Step 1: 대상 결정

인자가 있으면 해당 페이지만, 없으면 `qa/` 하위 모든 페이지 디렉토리를 대상으로 한다.

### Step 2: 체크리스트 읽기

`qa/{name}/checklist.md`를 읽고 모든 체크리스트 항목을 추출한다.
각 항목의 섹션, 우선순위(Critical/Major/Minor), 내용을 파싱한다.

### Step 3: 기존 테스트 파일 분석

`qa/{name}/*.spec.ts` 파일들을 읽고 어떤 동작을 테스트하고 있는지 분석한다.

분석 대상:

- `test('...')` 또는 `test.describe('...')` 의 설명 텍스트
- 테스트 내부의 assertion (`expect`) 대상
- Page Object 헬퍼의 locator/메서드 사용

### Step 4: 커버리지 리포트

체크리스트 항목별로 E2E 테스트 커버 여부를 보고한다:

```
## QA Test 커버리지 리포트

### main (12/18 커버, 67%)

#### 미커버 항목 (Critical)
- [ ] 낙관적 업데이트: 캐시 스냅샷 +1 반영 → 딜레이 없이 결과 표시
- [ ] 카테고리 변경 시 피드 리셋/재조회

#### 미커버 항목 (Major)
- [ ] TopComment 미리보기 표시
- [ ] 투표 에러 시 캐시 롤백 + 에러 토스트

#### 이미 커버됨 ✅
- [x] 투표시 애니메이션과 함께 결과가 표시된다 → main.spec.ts:L45
- [x] 카테고리 필터링 → main.spec.ts:L78
...
```

### Step 5: 테스트 생성/수정

사용자가 승인하면 미커버 항목에 대한 테스트를 생성한다.

**생성 규칙:**

1. 기존 테스트 파일의 패턴을 따른다 (같은 페이지의 기존 spec 파일 참조)
2. Page Object 패턴을 사용한다 (`qa/helpers/{name}.ts`)
3. 필요한 locator가 없으면 헬퍼에 추가한다
4. `data-testid` 셀렉터를 우선 사용한다
5. MSW mock 데이터 환경에서 동작해야 한다

**테스트 작성 시 따르는 프로젝트 패턴:**

```typescript
// 1. import
import { test, expect } from '@playwright/test';
import { PageHelper } from '../helpers/page-helper';

// 2. describe 그룹은 체크리스트 섹션에 대응
test.describe('섹션명', () => {
  let page: PageHelper;

  test.beforeEach(async ({ page: p }) => {
    page = new PageHelper(p);
    await page.goto();
  });

  // 3. 테스트명은 체크리스트 항목을 그대로 사용
  test('체크리스트 항목 문구 그대로', async () => {
    // ...
  });
});
```

**테스트 파일 분리 기준:**

- 한 spec 파일이 200줄을 넘으면 섹션별로 분리
- 예: `qa/main/main.spec.ts`, `qa/main/comment.spec.ts`

### Step 6: 인덱스 업데이트

새 spec 파일이 생성되면 `qa/_index.md`의 E2E 테스트 열에 링크를 추가한다.

## 주의사항

- 기존 테스트를 절대 삭제하지 않는다. 추가만 한다.
- 기존 테스트의 assertion을 변경하지 않는다.
- 체크리스트에서 제거된 항목의 테스트는 사용자에게 보고만 하고 삭제하지 않는다.
- E2E로 테스트하기 어려운 항목(SSR, SEO 등)은 리포트에서 "E2E 부적합" 으로 표시하고 스킵한다.
- 새 헬퍼 locator를 추가할 때, 컴포넌트에 `data-testid`가 없으면 사용자에게 알린다.
