# Claude Code 개발 지시 가이드

> HotPick Shorts 기능 프론트엔드 개발을 Claude Code에게 지시하기 위한 가이드

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
- `docs/specs/06-shorts-page.md` — Shorts 상세 기획서
- `docs/design-system/tokens.md` — 디자인 토큰
- `docs/api/shorts-api.md` - API 명세

## 코딩 컨벤션

- 컴포넌트: PascalCase (ShortsCard.tsx)
- 훅: camelCase (useShortsList.ts)
- 스타일: 컴포넌트명.module.scss
- API 응답 타입: 기획서 섹션 13 참조
- 서버 API 미구현 시: MSW 또는 하드코딩 mock 데이터로 대체
```

---

## 2. 개발 순서 (권장)

한 번에 전부 시키지 말고, 아래 순서대로 **단계별로** 지시하세요.

### Phase 1: 타입 + API + 훅 (기반 레이어)

### Phase 2: Main 페이지 탭 네비게이션

### Phase 3: Shorts 탭 콘텐츠 (ShortsCard 목록)

### Phase 4: Shorts 전용 페이지 (투표 + 결과)

### Phase 5: Admin Shorts CRUD

### Phase 6: 통합 + 반응형 + 최적화

---

## 3. 각 Phase별 프롬프트 예시

### Phase 1: 타입 + API + 훅

```
docs/specs/06-shorts-page.md의 섹션 13(데이터 엔티티)과 섹션 12(API 명세)를 읽고,
아래 파일들을 생성해줘:

1. src/types/shorts.ts
   - 기획서 섹션 13의 Shorts, ShortsOption, ShortsComment 인터페이스 그대로 구현

2. src/api/shorts.ts
   - 기획서 섹션 12.1, 12.2, 12.3의 모든 API 엔드포인트를 함수로 구현
   - 서버가 아직 없으므로 mock 데이터를 반환하는 형태로 작성
   - 나중에 실제 fetch로 교체할 수 있도록 함수 시그니처는 실제 API 스펙대로

3. src/hooks/useShortsList.ts — Shorts 목록 조회 (useQuery)
4. src/hooks/useShortsDetail.ts — Shorts 상세 조회 (useQuery)
5. src/hooks/useShortsVote.ts — 투표 mutation (useMutation)
6. src/hooks/useShortsComments.ts — 댓글 조회/작성

React Query v5 문법 사용. queryKey 네이밍은 ['shorts', 'list', params] 패턴.
```

### Phase 2: Main 페이지 탭 네비게이션

```
docs/specs/01-main-page.md의 섹션 3.0(MainTabNavigation)과
docs/specs/06-shorts-page.md의 섹션 10(Main 페이지 탭 구조)을 읽고,
Main 페이지에 탭 네비게이션을 추가해줘.

구현할 파일:
1. src/hooks/useMainTab.ts
   - 기획서 섹션 20.5의 코드 참조
   - useSearchParams로 URL 쿼리(?tab=shorts)와 동기화
   - 기본 탭: trend (URL에서 생략)

2. src/components/main/MainTabNavigation.tsx + .module.scss
   - "트렌드" | "⚡Shorts" 두 개 탭
   - 활성 탭 하단 인디케이터 (primary-gradient)
   - 모바일 좌우 스와이프 지원
   - 스타일은 docs/design-system/tokens.md 참조

3. src/components/main/TrendTabContent.tsx
   - 기존 Main 페이지의 PollCard 목록을 이 컴포넌트로 추출

4. src/components/main/ShortsTabContent.tsx
   - 일단 빈 "Shorts 탭입니다" placeholder로 생성

5. src/app/page.tsx 수정
   - MainTabNavigation + 활성 탭에 따라 TrendTabContent 또는 ShortsTabContent 렌더링
   - 탭 전환 시 스크롤 위치 각각 보존
```

### Phase 3: Shorts 탭 콘텐츠

```
docs/specs/06-shorts-page.md의 섹션 4.1(ShortsCard)을 읽고,
Shorts 탭에 카드 목록을 구현해줘.

구현할 컴포넌트:
1. src/components/shorts/ShortsBadge.tsx — ⚡SHORTS 배지 (attention #DFFF00)
2. src/components/shorts/DeadlineBadge.tsx — 마감 카운트다운 (D-N 표시, D-3이내 빨간색)
3. src/components/shorts/ShortsCard.tsx — IMAGE 유형 + TEXT 유형 둘 다 지원
4. src/components/shorts/ShortsCardSkeleton.tsx — 로딩 스켈레톤

5. src/components/main/ShortsTabContent.tsx 업데이트
   - useShortsList 훅 사용
   - ShortsCard 목록 렌더링
   - 무한스크롤 (Intersection Observer)
   - 빈 상태: "아직 진행중인 Shorts가 없어요"

스타일 참조: docs/design-system/tokens.md
카드 스타일: bg-secondary(#1E1E1E), rounded-md(8px), shadow-md, padding 16px
호버: translateY(-4px), shadow 강화
```

### Phase 4: Shorts 전용 페이지

```
docs/specs/06-shorts-page.md의 섹션 3.1(전용 페이지 레이아웃), 4.2(ShortsHeader),
4.3(ShortsVoteCard), 7(인터랙션 & 애니메이션), 8(투표 중복 방지)를 읽고,
Shorts 전용 투표 페이지를 구현해줘.

구현할 파일:
1. src/app/shorts/[alias]/page.tsx — 페이지 컴포넌트
2. src/components/shorts/ShortsHeader.tsx — 뒤로가기 + ⚡ + 제목
3. src/components/shorts/ShortsVoteCard.tsx — 핵심 투표 카드
   - 앞면(투표 전) / 뒷면(투표 후) 두 상태
   - Y축 180도 3D Flip 애니메이션 (0.6s)
   - IMAGE 유형: 2개는 좌우 분할, 3~4개는 2x2 그리드
   - TEXT 유형: 메인 이미지 1장 + 텍스트 버튼
4. src/components/shorts/ShortsImageOptions.tsx — IMAGE 유형 옵션 렌더러
5. src/components/shorts/ShortsTextOptions.tsx — TEXT 유형 옵션 렌더러
6. src/components/shorts/ShortsImageResult.tsx — IMAGE 유형 결과 렌더러
7. src/components/shorts/ShortsTextResult.tsx — TEXT 유형 결과 렌더러
8. src/components/shorts/ShortsBottomButtons.tsx — 댓글 + 공유 버튼

투표 중복 방지:
- localStorage에 hotpick_shorts_votes 키로 투표 기록 저장
- 재방문 시 localStorage 체크 → 이미 투표했으면 뒷면(결과) 표시

3D Flip은 기존 VoteCard의 flip 로직을 참고하되, Shorts용으로 독립 구현.
```

### Phase 5: Admin Shorts CRUD

```
docs/specs/06-shorts-page.md의 섹션 11(Admin 관리)을 읽고,
Admin Shorts 관리 페이지를 구현해줘.

1. src/app/admin/shorts/page.tsx — Shorts 목록 (테이블)
2. src/app/admin/shorts/create/page.tsx — Shorts 생성 폼
3. src/app/admin/shorts/edit/[shortsId]/page.tsx — Shorts 수정 폼

생성/수정 폼 구성:
- voteType 토글 (IMAGE ↔ TEXT) — 토글 시 옵션 UI 변경
- alias 입력 + 중복 확인 버튼
- 제목, 카테고리, 마감일(optional)
- 옵션 동적 추가/삭제 (2~4개)
- IMAGE일 때: 각 옵션에 이미지 업로드
- TEXT일 때: 메인 이미지 1장 업로드

기존 Admin Trend 페이지 스타일을 따라가되, Shorts용으로 조정.
```

### Phase 6: 통합 + 반응형

```
docs/specs/06-shorts-page.md의 섹션 18(반응형 디자인), 19(성능 최적화)를 읽고,
전체 Shorts 기능을 마무리해줘.

1. 반응형 적용
   - mobile(~767px): ShortsVoteCard 100% 너비, 좌우 여백 16px
   - tablet(768~1023px): ShortsVoteCard 최대 480px, 중앙 정렬
   - pc(1024px~): ShortsVoteCard 최대 480px, 중앙 정렬

2. 성능 최적화
   - ShortsCard 이미지 lazy loading (Intersection Observer)
   - Shorts 관련 컴포넌트 dynamic import (next/dynamic)
   - Admin 페이지 별도 chunk 분리

3. 탭 전환 최적화
   - 비활성 탭 첫 페이지 prefetch
   - 각 탭 스크롤 위치 독립 보존 (useRef)

4. SEO 메타데이터
   - Shorts 전용 페이지: title, og:image, og:url 설정
```

---

## 4. 지시 팁

### DO (이렇게 하세요)

- **기획서 파일 경로를 직접 알려주세요**
  "docs/specs/06-shorts-page.md의 섹션 12를 읽고..."

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

- ❌ "Shorts 기능 전체를 만들어줘" → 범위가 너무 넓어서 품질 저하
- ❌ 기획서 내용을 프롬프트에 복사 붙여넣기 → 파일 경로를 알려주면 Claude Code가 직접 읽음
- ❌ 디자인 토큰 값을 프롬프트에 직접 입력 → tokens.md 파일을 참조시키세요
- ❌ 여러 Phase를 한 번에 지시 → 컨텍스트가 길어지면 정확도 하락

---

## 5. 검증 프롬프트

각 Phase 완료 후 아래 프롬프트로 검증하세요:

```
방금 만든 코드가 docs/specs/06-shorts-page.md의 기획서와 일치하는지 검증해줘.
특히:
1. TypeScript 타입이 섹션 13과 일치하는지
2. API 함수 시그니처가 섹션 12와 일치하는지
3. 컴포넌트 구조가 섹션 14와 일치하는지
4. 디자인 토큰 값이 docs/design-system/tokens.md와 일치하는지
불일치하는 부분이 있으면 수정해줘.
```

---

## 6. 파일 참조 요약

| 참조 대상                   | 파일 경로                         |
| --------------------------- | --------------------------------- |
| 서비스 개요                 | `docs/specs/00-overview.md`       |
| Main 페이지 (탭 포함)       | `docs/specs/01-main-page.md`      |
| Shorts 상세 기획서          | `docs/specs/06-shorts-page.md`    |
| Shorts API 명세 (BE 전달용) | `docs/api/shorts-api.md`          |
| 디자인 토큰                 | `docs/design-system/tokens.md`    |
| 디자인 스크린샷             | `docs/design-system/screenshots/` |
| 기존 Vote 페이지            | `docs/specs/02-vote-page.md`      |
| 기존 Admin 페이지           | `docs/specs/04-admin-page.md`     |
