# E2E 테스트 가이드 (Playwright + MSW)

## 테스트 아키텍처

### MSW (Mock Service Worker) 기반

- **모든 API는 MSW mock**으로 대체됩니다. 실제 백엔드 의존 없이 테스트 가능.
- Playwright config에서 `NEXT_PUBLIC_ENABLE_MSW=true ENABLE_MSW=true`로 서버/브라우저 양쪽 MSW 활성화.
- Mock 데이터: `src/mocks/data/` 디렉토리 참조.
- Mock 핸들러: `src/mocks/handlers.ts` 참조.

### Page Object 패턴

- `e2e/helpers/` 디렉토리에 페이지별 Page Object 클래스를 정의합니다.
- 모든 Locator는 Page Object 내에서 선언하고 테스트에서 직접 Locator를 만들지 않습니다.
- `data-testid` 속성을 우선 사용하고, 불가능한 경우 `getByRole`, `getByText`, CSS class 순으로 선택합니다.

## 테스트 작성 규칙

### 1. 테스트 단위

| 단위                 | 설명                           | 예시                        |
| -------------------- | ------------------------------ | --------------------------- |
| **페이지 렌더링**    | 핵심 UI 요소가 표시되는지 확인 | 카드, 버튼, 배지 노출       |
| **사용자 플로우**    | 사용자 행동 시나리오 검증      | 투표 → 결과 확인 → 공유     |
| **상태 전환**        | 조건에 따른 UI 변화 확인       | 마감 → 결과만 표시          |
| **에러/엣지 케이스** | 비정상 입력 처리 확인          | 잘못된 URL, 누락된 파라미터 |

### 2. 네이밍 컨벤션

```
e2e/
├── {page-name}.spec.ts        # 테스트 파일
└── helpers/
    └── {page-name}.ts         # Page Object
```

- `test.describe`: 한글로 기능 그룹명 (`'공유하기 바텀시트'`)
- `test`: 한글로 행동 + 기대 결과 (`'링크 복사 시 토스트가 표시된다'`)

### 3. MSW 활용 규칙

- **새 API 엔드포인트**를 테스트하려면 반드시 `src/mocks/handlers.ts`에 핸들러를 추가합니다.
- **Mock 데이터**는 `src/mocks/data/`에 별도 파일로 관리합니다.
- MSW는 `onUnhandledRequest: 'bypass'`이므로 핸들러 미등록 API는 실제 서버로 요청됩니다.

### 4. 대기 전략

```typescript
// BAD: 하드코딩된 시간 대기
await page.waitForTimeout(2000);

// GOOD: 요소 기반 대기
await element.waitFor({ state: 'visible', timeout: 10_000 });

// GOOD: 함수 기반 대기 (MSW 초기 로딩 등)
await page.waitForFunction(() => document.querySelector('[data-testid="xxx"]'));
```

- `waitForTimeout`은 최소한으로 사용합니다 (카테고리 필터 등 네트워크 재요청 대기만).
- 요소 가시성 기반 대기를 우선 사용합니다.

### 5. Page Object 작성 규칙

```typescript
export class SomePage {
  readonly page: Page;
  readonly someElement: Locator;

  constructor(page: Page) {
    this.page = page;
    this.someElement = page.getByTestId('some-element');
  }

  async goto() {
    await this.page.goto('/some-path');
    // MSW 데이터 로딩 대기
    await this.someElement.waitFor({ state: 'visible', timeout: 15_000 });
  }
}
```

- `goto()`에서 MSW 데이터 로딩까지 대기하도록 구현합니다.
- MSW Service Worker 레이스 컨디션이 발생할 수 있으므로 `catch → reload` 패턴을 사용합니다.

### 6. 선택자 우선순위

1. `data-testid` — 가장 안정적, 리팩터링에 강함
2. `getByRole` — 접근성 기반, 의미 있는 선택
3. `getByText` — 텍스트 기반 (한글 정확 매칭)
4. CSS class 패턴 (`[class*="resultBar"]`) — 스타일 기반, 최후 수단

### 7. 테스트 격리

- 각 테스트는 독립적이어야 합니다 (다른 테스트 결과에 의존 금지).
- `test.beforeEach`에서 페이지 초기화 + 필요 시 투표 등 선행 조건을 설정합니다.
- MSW의 인메모리 투표 상태는 세션마다 리셋됩니다.

## 프로젝트 설정

- **디바이스**: `Pixel 5` (모바일 우선)
- **포트**: 로컬 `3099`, CI `3002`
- **타임아웃**: 테스트 30초, 서버 시작 120초
- **권한**: `clipboard-write`, `clipboard-read` (공유 기능)

## 테스트 실행

```bash
# 전체 실행
pnpm playwright test

# 특정 파일
pnpm playwright test e2e/share-bottom-sheet.spec.ts

# UI 모드
pnpm playwright test --ui

# 디버그
pnpm playwright test --debug
```
