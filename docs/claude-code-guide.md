# Claude Code 개발 지시 가이드

> HotPick Single(단일 투표) 기능 프론트엔드 개발을 Claude Code에게 지시하기 위한 가이드

---

## 1. 사전 준비: CLAUDE.md 작성

Claude Code는 프로젝트 루트의 `CLAUDE.md`를 자동으로 읽습니다. 이 파일에 프로젝트 컨텍스트를 넣어두면 매번 반복 설명할 필요가 없습니다.

프로젝트 루트에 아래 내용으로 `CLAUDE.md`를 생성하세요:

```markdown
# HotPick 프로젝트

## 기술 스택

- Next.js 14+ (App Router)
- TypeScript (strict mode)
- SCSS Modules (\*.module.scss)
- React Query (TanStack Query v5)

## 프로젝트 구조

- `src/app/` — App Router 페이지
- `src/components/` — UI 컴포넌트
- `src/hooks/` — 커스텀 훅
- `src/api/` — API 호출 함수
- `src/types/` — TypeScript 타입 정의

## 디자인 시스템

- 다크 테마 (#121212 배경)
- Primary Gradient: #ff00ff → #ff4500
- Attention: #DFFF00
- 상세 토큰: `docs/design-system/tokens.md` 참조

## 기획서

- `docs/specs/00-overview.md` — 서비스 개요
- `docs/specs/01-main-page.md` — Main 페이지 (탭 네비게이션 포함)
- `docs/specs/02-vote-page.md` — Vote 페이지
- `docs/specs/06-single-page.md` — Single(단일 투표) 상세 기획서
- `docs/specs/new-hotpick-election-system.md` — 선거 시스템 내재화 설계서
- `docs/design-system/tokens.md` — 디자인 토큰
- `docs/api/election-crud-api-request.md` — Election CRUD API 명세

## 코딩 컨벤션

- 컴포넌트: PascalCase (SingleCard.tsx)
- 훅: camelCase (useSingleList.ts)
- 스타일: 컴포넌트명.module.scss
- API 응답 타입: 기획서 섹션 13 참조
- 서버 API 미구현 시: MSW 또는 하드코딩 mock 데이터로 대체
```

---

## 2. 개발 순서 (권장)

한 번에 전부 시키지 말고, 아래 순서대로 **단계별로** 지시하세요.

### Phase 1: 타입 + API + 훅 (기반 레이어)

### Phase 2: Main 페이지 탭 네비게이션

### Phase 3: Single 탭 콘텐츠 (SingleCard 목록)

### Phase 4: Single 전용 페이지 (투표 + 결과)

### Phase 5: Admin Election CRUD + HotPick CRUD

### Phase 6: 통합 + 반응형 + 최적화

---

## 3. 각 Phase별 프롬프트 예시

### Phase 1: 타입 + API + 훅

```
docs/specs/06-single-page.md의 섹션 13(데이터 엔티티)과 섹션 12(API 명세)를 읽고,
아래 파일들을 생성해줘:

1. src/types/election.ts 수정
   - docs/specs/new-hotpick-election-system.md의 섹션 4.1 Election 엔티티 참조
   - VoteType, ElectionStatus, ElectionOption, Election 인터페이스 구현

2. src/types/hotpick.ts 수정
   - HotpickType, CategoryCode 추가
   - CreateHotpickRequest에 type, categoryCode, deadline 필드 추가

3. src/services/api/admin.ts 확장
   - Election CRUD API 함수 추가 (docs/api/election-crud-api-request.md 참조)
   - 서버가 아직 없으므로 mock 데이터를 반환하는 형태로 작성
   - 나중에 실제 fetch로 교체할 수 있도록 함수 시그니처는 실제 API 스펙대로

4. src/hooks/api/useAdmin.ts 확장
   - useElections — Election 목록 조회 (useQuery)
   - useCreateElection — Election 생성 (useMutation)
   - useUpdateElection — Election 수정 (useMutation)
   - useDeleteElection — Election 삭제 (useMutation)

React Query v5 문법 사용. queryKey 네이밍은 ['election', 'list', params] 패턴.
```

### Phase 2: Main 페이지 탭 네비게이션

```
docs/specs/01-main-page.md의 섹션 3.0(MainTabNavigation)과
docs/specs/06-single-page.md의 섹션 10(Main 페이지 탭 구조)을 읽고,
Main 페이지에 탭 네비게이션을 추가해줘.

구현할 파일:
1. src/hooks/useMainTab.ts
   - useSearchParams로 URL 쿼리(?tab=single)와 동기화
   - 기본 탭: trend (URL에서 생략)

2. src/components/main/MainTabNavigation.tsx + .module.scss
   - "트렌드" | "⚡Single" 두 개 탭
   - 활성 탭 하단 인디케이터 (primary-gradient)
   - 모바일 좌우 스와이프 지원
   - 스타일은 docs/design-system/tokens.md 참조

3. src/components/main/TrendTabContent.tsx
   - 기존 Main 페이지의 PollCard 목록을 이 컴포넌트로 추출

4. src/components/main/SingleTabContent.tsx
   - 일단 빈 "Single 탭입니다" placeholder로 생성

5. src/app/page.tsx 수정
   - MainTabNavigation + 활성 탭에 따라 TrendTabContent 또는 SingleTabContent 렌더링
   - 탭 전환 시 스크롤 위치 각각 보존
```

### Phase 3: Single 탭 콘텐츠

```
docs/specs/06-single-page.md의 섹션 4.1(SingleCard)을 읽고,
Single 탭에 카드 목록을 구현해줘.

구현할 컴포넌트:
1. src/components/single/SingleBadge.tsx — ⚡SINGLE 배지 (attention #DFFF00)
2. src/components/single/DeadlineBadge.tsx — 마감 카운트다운 (D-N 표시, D-3이내 빨간색)
3. src/components/single/SingleCard.tsx — IMAGE 유형 + TEXT 유형 둘 다 지원
4. src/components/single/SingleCardSkeleton.tsx — 로딩 스켈레톤

5. src/components/main/SingleTabContent.tsx 업데이트
   - useSingleList 훅 사용
   - SingleCard 목록 렌더링
   - 무한스크롤 (Intersection Observer)
   - 빈 상태: "아직 진행중인 Single이 없어요"

스타일 참조: docs/design-system/tokens.md
카드 스타일: bg-secondary(#1E1E1E), rounded-md(8px), shadow-md, padding 16px
호버: translateY(-4px), shadow 강화
```

### Phase 4: Single 전용 페이지

```
docs/specs/06-single-page.md의 섹션 3.1(전용 페이지 레이아웃), 4.2(SingleHeader),
4.3(SingleVoteCard), 7(인터랙션 & 애니메이션), 8(투표 중복 방지)를 읽고,
Single 전용 투표 페이지를 구현해줘.

구현할 파일:
1. src/app/single/[alias]/page.tsx — 페이지 컴포넌트
2. src/components/single/SingleHeader.tsx — 뒤로가기 + ⚡ + 제목
3. src/components/single/SingleVoteCard.tsx — 핵심 투표 카드
   - 앞면(투표 전) / 뒷면(투표 후) 두 상태
   - Y축 180도 3D Flip 애니메이션 (0.6s)
   - IMAGE 유형: 2개는 좌우 분할, 3~4개는 2x2 그리드
   - TEXT 유형: 메인 이미지 1장 + 텍스트 버튼
4. src/components/single/SingleImageOptions.tsx — IMAGE 유형 옵션 렌더러
5. src/components/single/SingleTextOptions.tsx — TEXT 유형 옵션 렌더러
6. src/components/single/SingleImageResult.tsx — IMAGE 유형 결과 렌더러
7. src/components/single/SingleTextResult.tsx — TEXT 유형 결과 렌더러
8. src/components/single/SingleBottomButtons.tsx — 댓글 + 공유 버튼

투표 중복 방지:
- localStorage에 hotpick_single_votes 키로 투표 기록 저장
- 재방문 시 localStorage 체크 → 이미 투표했으면 뒷면(결과) 표시

3D Flip은 기존 VoteCard의 flip 로직을 참고하되, Single용으로 독립 구현.
```

### Phase 5: Admin Election CRUD + HotPick CRUD

```
docs/specs/new-hotpick-election-system.md의 섹션 5(Admin 관리 구조)를 읽고,
Admin Election 관리 페이지 + HotPick 생성 폼 개선을 구현해줘.

Election CRUD:
1. src/app/admin/election/page.tsx — Election 목록 (테이블)
2. src/app/admin/election/create/page.tsx — Election 생성 폼
3. src/app/admin/election/edit/[electionId]/page.tsx — Election 수정 폼

생성/수정 폼 구성:
- voteType 토글 (IMAGE ↔ TEXT) — 토글 시 옵션 UI 변경
- 제목 입력
- 옵션 동적 추가/삭제 (2~4개)
- IMAGE일 때: 각 옵션에 이미지 업로드
- TEXT일 때: 메인 이미지 1장 업로드

HotPick 폼 개선:
- 기존 ElectionListSection.tsx → 선거 목록 검색/선택 UI로 교체
- type 선택 (BUNDLE/SINGLE) 추가
- categoryCode 드롭다운 추가
- deadline DateTimePicker 추가

기존 Admin Trend 페이지 스타일을 따라가되, 확장된 구조로 조정.
```

### Phase 6: 통합 + 반응형

```
docs/specs/06-single-page.md의 섹션 18(반응형 디자인), 19(성능 최적화)를 읽고,
전체 Single 기능을 마무리해줘.

1. 반응형 적용
   - mobile(~767px): SingleVoteCard 100% 너비, 좌우 여백 16px
   - tablet(768~1023px): SingleVoteCard 최대 480px, 중앙 정렬
   - pc(1024px~): SingleVoteCard 최대 480px, 중앙 정렬

2. 성능 최적화
   - SingleCard 이미지 lazy loading (Intersection Observer)
   - Single 관련 컴포넌트 dynamic import (next/dynamic)
   - Admin 페이지 별도 chunk 분리

3. 탭 전환 최적화
   - 비활성 탭 첫 페이지 prefetch
   - 각 탭 스크롤 위치 독립 보존 (useRef)

4. SEO 메타데이터
   - Single 전용 페이지: title, og:image, og:url 설정
```

---

## 4. 지시 팁

### DO (이렇게 하세요)

- **기획서 파일 경로를 직접 알려주세요**
  "docs/specs/06-single-page.md의 섹션 12를 읽고..."

- **기존 코드 참조를 명시하세요**
  "기존 VoteCard 컴포넌트의 3D flip 로직을 참고해서..."
  "기존 PollCard.module.scss 스타일 패턴을 따라서..."

- **한 번에 1 Phase씩 지시하세요**
  Phase 끝나면 확인 → 다음 Phase 진행

- **Mock 데이터 전략을 명시하세요**
  "서버 API가 아직 없으므로 mock 데이터로 동작하게 해줘.
  나중에 실제 API로 교체할 수 있도록 api/ 레이어만 수정하면 되게."

- **디자인 토큰을 참조시키세요**
  "색상, 폰트, 간격은 docs/design-system/tokens.md를 따라줘"

### DON'T (이렇게 하지 마세요)

- ❌ "Single 기능 전체를 만들어줘" → 범위가 너무 넓어서 품질 저하
- ❌ 기획서 내용을 프롬프트에 복사 붙여넣기 → 파일 경로를 알려주면 Claude Code가 직접 읽음
- ❌ 디자인 토큰 값을 프롬프트에 직접 입력 → tokens.md 파일을 참조시키세요
- ❌ 여러 Phase를 한 번에 지시 → 컨텍스트가 길어지면 정확도 하락

---

## 5. 검증 프롬프트

각 Phase 완료 후 아래 프롬프트로 검증하세요:

```
방금 만든 코드가 docs/specs/06-single-page.md의 기획서와 일치하는지 검증해줘.
특히:
1. TypeScript 타입이 섹션 13과 일치하는지
2. API 함수 시그니처가 섹션 12와 일치하는지
3. 컴포넌트 구조가 섹션 14와 일치하는지
4. 디자인 토큰 값이 docs/design-system/tokens.md와 일치하는지
불일치하는 부분이 있으면 수정해줘.
```

---

## 6. 파일 참조 요약

| 참조 대상                      | 파일 경로                                        |
| ------------------------------ | ------------------------------------------------ |
| 서비스 개요                    | `docs/specs/00-overview.md`                      |
| Main 페이지 (탭 포함)          | `docs/specs/01-main-page.md`                     |
| Single 상세 기획서             | `docs/specs/06-single-page.md`                   |
| 선거 시스템 내재화 설계서      | `docs/specs/new-hotpick-election-system.md`      |
| Election CRUD API 명세         | `docs/api/election-crud-api-request.md`          |
| 디자인 토큰                    | `docs/design-system/tokens.md`                   |
| 디자인 스크린샷                | `docs/design-system/screenshots/`                |
| 기존 Vote 페이지               | `docs/specs/02-vote-page.md`                     |
| 기존 Admin 페이지              | `docs/specs/04-admin-page.md`                    |
