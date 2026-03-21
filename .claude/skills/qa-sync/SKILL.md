---
name: qa-sync
description: >
  Sync QA checklists with spec documents. Use when the user says "/qa-sync",
  "sync QA", "update QA checklist", "check spec-QA alignment", or after updating
  spec files in docs/specs/pages/. Reads page-level spec files and ensures
  corresponding QA checklist files are complete and up to date.
metadata:
  author: hotpick
  version: '2.0.0'
---

# QA Sync — 스펙 ↔ QA 체크리스트 동기화

페이지별 스펙 문서(`docs/specs/pages/*.md`)를 읽고, 대응하는 QA 체크리스트(`qa/{name}/checklist.md`)를 동기화한다.

## 사용법

```
/qa-sync              → 전체 페이지 점검 + 동기화
/qa-sync main         → 특정 페이지만 점검 + 동기화
/qa-sync offline-vote → 특정 페이지만 점검 + 동기화
```

## 파일 매핑

```
docs/specs/pages/{name}.md  ←→  qa/{name}/checklist.md
```

## 실행 절차

### Step 1: 대상 파일 결정

인자가 있으면 해당 페이지만, 없으면 `docs/specs/pages/` 디렉토리의 모든 `.md` 파일을 대상으로 한다.

### Step 2: 스펙 파일 읽기

각 대상 스펙 파일을 읽고, **테스트 가능한 동작(behavior)**을 모두 추출한다.

추출 기준:

- "~한다", "~된다", "~표시된다" 등 동작을 기술하는 문장
- 테이블의 각 행 (UI 상태, API 동작 등)
- 조건부 동작 ("~인 경우 ~한다")
- 에러/엣지케이스 처리

추출하지 않는 것:

- 구현 상세 (컴포넌트 구조, 코드 패턴 등)
- API 엔드포인트 목록 (동작이 아닌 참조 정보)
- Changelog

### Step 3: 기존 QA 파일과 비교

대응하는 체크리스트 파일(`qa/{name}/checklist.md`)이 있으면 읽고, 스펙에서 추출한 동작과 비교한다.

비교 결과를 세 가지로 분류:

- **누락**: 스펙에 있으나 QA에 없는 항목
- **불일치**: 스펙과 QA의 내용이 다른 항목 (예: 글자수 제한 값이 다름)
- **고아**: QA에 있으나 스펙에 근거가 없는 항목 (삭제 후보이나 확인 필요)

### Step 4: 리포트 출력

변경 사항을 사용자에게 보고한다:

```
## QA Sync 리포트

### main
- 누락 3건: (항목 나열)
- 불일치 1건: (항목 나열)
- 고아 0건

### detail
- 변경 없음 ✅
```

### Step 5: QA 파일 업데이트

리포트를 확인한 사용자가 승인하면 QA 파일을 업데이트한다.
**사용자 확인 없이 자동으로 수정하지 않는다.**

QA 파일이 없으면 `qa/{name}/` 디렉토리와 함께 새로 생성한다.

### Step 6: 인덱스 동기화

`docs/specs/_index.md`와 `qa/_index.md`를 확인하여:

- 스펙 파일은 있으나 인덱스에 없는 페이지 감지
- QA 파일은 있으나 인덱스에 없는 페이지 감지
- 필요 시 인덱스에 행 추가

## QA 파일 형식

새로 생성하거나 갱신할 때 아래 형식을 따른다:

```markdown
# {페이지명} (`{경로}`) QA 체크리스트

> 대응 스펙: [specs/pages/{name}.md](../../docs/specs/pages/{name}.md)
> 최종 QA: -

## {섹션명}

### Critical

- [ ] {배포 차단 수준의 핵심 동작}

### Major

- [ ] {배포 가능하나 빠른 수정 필요}

### Minor

- [ ] {다음 스프린트에서 수정}
```

### 우선순위 분류 기준

- **Critical**: 핵심 사용자 여정이 깨지는 항목 (투표 불가, 데이터 미표시, 접근 제어 실패 등)
- **Major**: 기능은 동작하나 UX/정합성에 문제가 있는 항목 (정렬 오류, 로딩 상태 미표시, 애니메이션 등)
- **Minor**: 엣지케이스, 반응형, 글자수 제한 등 보조적 항목

### 섹션 구분

스펙의 섹션 구조(`## 1. 피드`, `## 2. 인라인 투표` 등)를 그대로 따른다.

## 주의사항

- QA 체크리스트의 체크 상태(`[x]`)는 절대 건드리지 않는다. 이미 체크된 항목을 수정하면 QA 이력이 망가진다.
- 기존 항목의 문구를 임의로 변경하지 않는다. 누락 항목 추가와 불일치 수정만 한다.
- 고아 항목은 삭제하지 않고 사용자에게 보고만 한다 (스펙에 없더라도 실제 필요한 QA일 수 있음).
