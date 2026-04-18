# Workflows — 루틴 B/C + 방향성 결정 & Mock 생성 플레이북

결(Designer)이 모든 모드에서 공통으로 따르는 운영 루틴. 루틴 A는 `knowledge-sources.md` 참조.

## 루틴 B: 문서-코드 불일치 감지 시 보고

### 언제 발동하나

- `tokens.md`의 값이 `_variables.scss`에 없음
- `CLAUDE.md` UI 규칙과 실제 컴포넌트 구현이 다름
- 과거 스펙에 "이렇게 한다"고 명시된 내용이 현재 코드에 없음
- 컴포넌트 이름/시그니처가 문서와 다름

### 어떻게 동작하나

1. **작업 일시 중지** — 임의로 판단하지 않는다.
2. **사용자에게 보고** — 다음 포맷으로:

```
[불일치 감지]

- 문서: <경로>#<섹션> → "<값/규칙>"
- 코드: <경로>#<라인 또는 정의 없음>

어떻게 처리할까요?
  ① 코드를 문서에 맞춰 수정
  ② 문서를 코드에 맞춰 수정
  ③ 지금은 유지 (TODO 기록)
```

3. **사용자 선택 후 재개**
   - **①** 선택 → 해당 코드 수정 진행
   - **②** 선택 → 해당 문서 수정 진행
   - **③** 선택 → 관련 스펙 또는 `docs/design-system/components.md`에 TODO 항목 추가

### 보고 포맷 예시

```
[불일치 감지]

- 문서: docs/design-system/tokens.md#box-shadow → "shadow-lg = 0 4px 16px rgba(99,106,232,0.3)"
- 코드: src/styles/_variables.scss → shadow-lg 변수 정의 없음

어떻게 처리할까요?
  ① _variables.scss에 $shadow-lg 추가
  ② tokens.md의 shadow-lg 항목 삭제 또는 수정
  ③ 지금은 유지 (TODO로 기록)
```

## 루틴 C: 지식 점진 축적 (components.md 업데이트)

### 언제 발동하나

- 스펙 모드 종료 시 (새 컴포넌트 스펙이 확정됨)
- 구현 모드 종료 시 (새 컴포넌트가 실제로 생성됨)
- 상담 모드에서 재사용 가능한 새 패턴이 확정됐을 때 (드물지만 가능)

### 어떻게 동작하나

1. 이번 대화에서 **새로 정의되거나 확정된** 컴포넌트/패턴을 수집
2. 사용자에게 제안:

```
이번 작업에서 다음 항목이 새로 확정되었습니다. docs/design-system/components.md에 추가할까요?

- <컴포넌트명> — <한 줄 설명>
- <패턴명> — <한 줄 설명>

Y / N:
```

3. 승인 시 `components.md`에 다음 포맷으로 추가:

```markdown
## <컴포넌트명>

- **용도**: ...
- **사용 위치**: ...
- **토큰**: ...
- **SCSS 파일**: `src/components/<컴포넌트명>.module.scss`
- **관련 스펙**: `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
```

4. 추가 후에는 간단 요약만 출력 — 전체 파일 내용 재인쇄 금지.

## 방향성 결정 플레이북

### 언제 발동하나

- **스펙 모드 Step 0** 진입 시 (레이아웃/인터랙션 모델/정보 구조의 중대 결정)
- **상담 모드**에서 방향성 질문 감지 시 ("어떤 ~이 좋을까", "이 화면을 어떻게 구성할까")

### 진행 절차

1. **3개 방향 구상** — 각 방향의 핵심 아이디어를 한 문장으로 요약. 3개가 모두 유의미해야 함 (단순 허수아비 옵션 금지).
2. **Trade-off 제시** — 각 방향의 장점 3개 + 단점 2-3개.
3. **레퍼런스 연결** — `design-inspirations.md`에서 해당 방향을 뒷받침하는 서비스/패턴 인용.
4. **Mock 필요성 판단** — 시각 비교가 유의미하면 Mock 생성 제안 (아래 플레이북).
5. **사용자 선택 대기** — 선택 후 그 방향으로 진행 (스펙 모드의 경우 Step 1 체크포인트로 넘어감).

### 제시 포맷

```markdown
## 방향 후보

### (a) <방향 A 이름>

- 요약: <한 문장>
- 장점: 1) ... 2) ... 3) ...
- 단점: 1) ... 2) ...
- 레퍼런스: <design-inspirations.md의 서비스명> — "<패턴 설명>"

### (b) <방향 B 이름>

(동일 구조)

### (c) <방향 C 이름>

(동일 구조)

---

HTML Mock을 만들어서 브라우저로 비교해 볼까요?
(기본: 방식 A, .tmp/design-mocks/<date>-<topic>/ 하위 정적 HTML)
```

## Mock 생성 플레이북

### 방식 A: 정적 HTML (기본, v1)

**폴더 구조**:

```
.tmp/design-mocks/<YYYY-MM-DD>-<topic>/
├── option-a.html
├── option-b.html
├── option-c.html
└── compare.html   — 세 옵션을 iframe으로 나란히 비교
```

**HTML 작성 규칙**:

- 다크 배경 `#121212` 기본
- `docs/design-system/tokens.md`의 컬러/타이포/간격 값을 인라인 `<style>`로 반영
- **이모지 금지** — SVG 아이콘 인라인 (`src/assets/icon/*.tsx`에서 SVG 마크업 추출 후 `<svg>...</svg>` 직접 삽입)
- 폰트: `font-family: -apple-system, BlinkMacSystemFont, "Pretendard Variable", "Pretendard", system-ui, sans-serif;`
- 폰트 사이즈/굵기는 tokens.md `### Font Size` / `### Font Weight` 준수

**option-\*.html 최소 템플릿**:

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Option A — <topic></title>
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      body {
        background: #121212;
        color: #ffffff;
        font-family: -apple-system, 'Pretendard Variable', 'Pretendard', system-ui, sans-serif;
        min-height: 100vh;
        padding: 16px;
      }
      /* option-specific styles here */
    </style>
  </head>
  <body>
    <!-- mock content here -->
  </body>
</html>
```

**compare.html 템플릿**:

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <title>Compare — <topic></title>
    <style>
      body {
        margin: 0;
        padding: 16px;
        background: #121212;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 16px;
        min-height: 100vh;
      }
      .col {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .label {
        color: #ffffff;
        font-family: -apple-system, system-ui, sans-serif;
        font-size: 14px;
        font-weight: 600;
      }
      iframe {
        width: 100%;
        height: calc(100vh - 48px);
        border: 1px solid #2c2c2c;
        border-radius: 8px;
        background: #121212;
      }
    </style>
  </head>
  <body>
    <div class="col">
      <div class="label">(a) <방향 A 이름></div>
      <iframe src="./option-a.html"></iframe>
    </div>
    <div class="col">
      <div class="label">(b) <방향 B 이름></div>
      <iframe src="./option-b.html"></iframe>
    </div>
    <div class="col">
      <div class="label">(c) <방향 C 이름></div>
      <iframe src="./option-c.html"></iframe>
    </div>
  </body>
</html>
```

**사용자 안내 문구**:

```
Mock이 생성되었습니다. 브라우저로 열어 비교해 주세요:

  open .tmp/design-mocks/<YYYY-MM-DD>-<topic>/compare.html

비교 후 선호하는 방향(a/b/c) 또는 혼합 의견을 알려 주시면, 그 방향으로 스펙 모드를 진행하겠습니다.
```

### 방식 B: Next.js 임시 라우트 (옵트인)

실제 React 컴포넌트·토큰·상호작용 감각이 꼭 필요한 경우에만 결이 사용자에게 제안한다.

**생성 위치**: `src/app/design-preview/<topic>/page.tsx`

**사용자 안내**:

```
방식 A(정적 HTML)로는 감이 잘 안 옵니다 — 실제 React 감각이 필요해 보입니다.
src/app/design-preview/<topic>/ 임시 라우트를 만들어도 될까요?

- 접속: pnpm start 후 https://local-hotpick.votebox.kr/design-preview/<topic>
- 확인 후 route를 정리하거나 실제 페이지로 전환합니다.

Y / N:
```

**주의 사항**:

- 방식 B 사용 후 결은 반드시 **정리 여부를 사용자에게 확인**해야 한다.
- 정리 옵션: ① 디렉토리 삭제, ② 실제 페이지 위치로 이동, ③ 당분간 유지 (TODO 기록)
- `design-preview` 라우트를 커밋하지 않도록 주의 — .gitignore 대상은 아니지만 스펙 확정 후 제거

## 모드별 루틴 적용 요약

| 모드 | 루틴 A | 루틴 B  | 루틴 C  | 방향성         | Mock                |
| ---- | ------ | ------- | ------- | -------------- | ------------------- |
| 상담 | 항상   | 감지 시 | 드물게  | 방향성 질문 시 | 시각 비교 유의미 시 |
| 스펙 | 항상   | 감지 시 | 종료 시 | Step 0         | Step 0에서 필요 시  |
| 구현 | 항상   | 감지 시 | 종료 시 | 거의 없음      | 거의 없음           |
