# 공유하기 개선 & Single 상세페이지 기획서

> 작성일: 2026-02-20
> 상태: Draft

---

## 1. 개선 배경

### 1.1 현재 공유하기의 문제점

현재 공유하기는 `origin/#alias` 형태의 해시 URL을 복사하고, 메인 피드에서 해당 카드 위치로 스크롤하는 방식이다.

| 문제 | 설명 |
|------|------|
| UX 품질 저하 | 메인 피드 중간에 갑자기 착지 → 위아래 맥락 없는 콘텐츠에 둘러싸여 혼란 |
| 바이럴 효과 약함 | 공유 링크를 받은 사람이 보는 화면이 "메인 피드"와 동일 → 해당 콘텐츠에 집중시키지 못함 |
| 개발 복잡도 | 양방향 무한스크롤, 앵커 기반 API 호출, 음수 커서 인코딩 등 유지보수 부담 |
| SEO 불리 | 해시(#) URL은 서버에서 인식 불가 → OG 메타태그 개별 생성 불가 |

### 1.2 개선 방향 요약

| 타입 | AS-IS | TO-BE |
|------|-------|-------|
| BUNDLE | `origin/#alias` → 메인 피드 스크롤 | `origin/hotpick/{alias}` → 기존 상세페이지 (변경 없음) |
| SINGLE | `origin/#alias` → 메인 피드 스크롤 | `origin/hotpick/{alias}` → **동일 경로, type에 따라 뷰 분기** |

> **설계 근거**: SINGLE도 HotPick(type=SINGLE)이므로 `/hotpick/{alias}` 하위에서 type으로 분기하는 것이 자연스럽다. 별도 라우트(`/single/`)를 만들면 라우팅/메타데이터/SSR 로직이 중복되며, 기존 `hotpick/[hotpickAlias]`의 인프라(metadata.ts, params.ts, not-found.tsx)를 그대로 활용할 수 있다.

---

## 2. 폐지 범위 (해시 기반 공유하기)

### 2.1 삭제 대상 코드

| 파일 | 삭제 대상 | 설명 |
|------|----------|------|
| `src/hooks/useHashAnchor.ts` | 파일 전체 | 해시 읽기/클리어 훅 |
| `src/components/features/Main/MainView.tsx` | `handleShare` 함수 | `origin/#alias` URL 생성 로직 |
| `src/components/features/Main/MainView.tsx` | 해시 스크롤/하이라이트 useEffect | anchor 기반 scrollIntoView + highlight |
| `src/components/features/Main/MainView.tsx` | `topObserverTarget` + 상단 IntersectionObserver | 위쪽 무한스크롤 전체 |
| `src/components/features/Main/MainView.tsx` | `anchorRef`, `scrolledRef`, `highlightedAlias` 상태 | anchor 관련 상태 일체 |
| `src/hooks/api/useDisplay.ts` | `anchor` 파라미터 관련 로직 | `queryFn` 내 anchor 조건 분기 |
| `src/components/features/Main/SingleCard/SingleCard.tsx` | `isHighlighted` prop | 하이라이트 스타일 관련 |
| `src/components/features/Main/SingleCard/SingleCard.module.scss` | `.highlighted` 클래스 | 하이라이트 box-shadow |

### 2.2 변경 대상 코드

| 파일 | 변경 내용 |
|------|----------|
| `MainView.tsx` | `handleShare`를 타입별 분기 로직으로 교체 (섹션 3 참조) |
| `BundleCard.tsx` | `onShare` 콜백 유지, 동작만 변경 |
| `SingleCard.tsx` | `onShare` 콜백 유지, 동작만 변경 |
| `useDisplay.ts` | `useInfiniteMainDisplay`에서 anchor 관련 파라미터 제거, 양방향 페이지네이션 제거 |

---

## 3. 새로운 공유하기 로직

### 3.1 MainView.handleShare 변경

```
handleShare(alias: string)
  → 복사: origin/hotpick/{alias}
  → 토스트: "링크가 복사되었습니다"
```

> BUNDLE과 SINGLE 모두 `/hotpick/{alias}`로 통일되므로 type 분기가 불필요해진다. 기존 `onShare(alias)` 시그니처를 그대로 유지할 수 있다.

### 3.2 각 카드 컴포넌트 변경

- `BundleCard.onShare(alias)` → `handleShare(alias)` (URL만 변경, 시그니처 동일)
- `SingleCard.onShare(alias)` → `handleShare(alias)` (URL만 변경, 시그니처 동일)

### 3.3 결과 페이지 공유하기 (변경 없음)

[ActionButtons.tsx](src/components/features/Result/ActionButtons/ActionButtons.tsx)의 "투표 공유하기"는 이미 `origin/hotpick/{alias}` 형태이므로 변경 없음.

---

## 4. Single 상세페이지 기획

### 4.1 페이지 목적

> **"하나의 투표에 집중하여 참여하고, 의견을 나누고, 다음 투표로 이어지게 한다"**

| 목적 | 근거 |
|------|------|
| **투표 전환율 극대화** | 공유 링크로 진입한 사용자가 즉시 투표할 수 있는 전용 화면 제공. 메인 피드 대비 전환율 향상 |
| **댓글을 통한 체류시간 확대** | SINGLE은 1개 투표 → 투표 후 이탈 가능성 높음. 댓글 영역을 인라인으로 노출하여 "결과 보기 → 댓글 읽기 → 댓글 쓰기" 자연 흐름 유도 |
| **바이럴 재순환** | "내가 투표한 결과"를 공유할 수 있는 CTA → 공유받은 사람이 다시 투표 → 바이럴 루프 |
| **리텐션 확보** | 하단에 "다른 Single" 추천으로 다음 콘텐츠 소비 유도 → 메인 피드 회귀 |

### 4.2 경로

```
/hotpick/[alias]  (기존 BUNDLE 상세페이지와 동일 경로)
```

> 기존 `hotpick/[hotpickAlias]/page.tsx`에서 `type === 'SINGLE'`이면 `/#alias`로 리다이렉트하던 로직을 **Single 상세 뷰 렌더링으로 교체**한다. type에 따라 `HotpickView`(BUNDLE) 또는 `SingleDetailView`(SINGLE)를 분기 렌더링.

### 4.3 화면 구조 (와이어프레임)

```
┌─────────────────────────────────────┐
│         FlexibleLayout (568px)       │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  VoteHeader (로고 + "HotPick") │  │  ← 클릭 시 메인("/")으로 이동
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  카테고리 태그      마감 배지   │  │
│  │  ┌──────────────────────────┐  │  │
│  │  │  [로고]  투표 질문 제목   │  │  │  ← 기존 SingleCard의 questionRow 동일
│  │  └──────────────────────────┘  │  │
│  │                                │  │
│  │  ┌──── 투표 영역 ────────────┐ │  │
│  │  │                           │ │  │
│  │  │  [ 옵션 A ]  [ 옵션 B ]   │ │  │  ← 투표 전: 옵션 버튼
│  │  │                           │ │  │
│  │  │  ═══ 결과 바 A  72% ═══   │ │  │  ← 투표 후: 결과 바 + 애니메이션
│  │  │  ═══ 결과 바 B  28% ═══   │ │  │
│  │  │                           │ │  │
│  │  └───────────────────────────┘ │  │
│  │                                │  │
│  │  참여자 1.2K · 마감 D-3        │  │
│  │                                │  │
│  │  ┌──────────────────────────┐  │  │
│  │  │  🔗 투표 공유하기         │  │  │  ← 그라데이션 CTA 버튼
│  │  └──────────────────────────┘  │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  💬 댓글  (142)    인기순|최신순│ │  │  ← 인라인 댓글 섹션 (바텀시트 X)
│  │  ──────────────────────────────│  │
│  │  닉네임A · 2시간 전            │  │
│  │  "A가 맞지 B는 말도 안돼"      │  │
│  │  ❤️ 23                         │  │
│  │  ──────────────────────────────│  │
│  │  닉네임B · 5시간 전            │  │
│  │  "B 선택한 사람 손들어"        │  │
│  │  ❤️ 15                         │  │
│  │  ──────────────────────────────│  │
│  │  ... (무한스크롤)              │  │
│  │  ──────────────────────────────│  │
│  │  [닉네임]  [비밀번호]          │  │
│  │  [댓글을 남겨보세요...      ]  │  │
│  │  [등록]                        │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  🔥 다른 Single도 투표해보세요  │  │  ← 추천 섹션
│  │  ──────────────────────────────│  │
│  │  [ SingleCard (이전) ]         │  │
│  │  [ SingleCard (다음) ]         │  │
│  │                                │  │
│  │  [더 많은 투표 보기 →]         │  │  ← 메인 피드로 이동
│  └────────────────────────────────┘  │
│                                      │
└─────────────────────────────────────┘
```

### 4.4 섹션별 상세 스펙

#### 4.4.1 VoteHeader (기존 컴포넌트 재사용)

기존 [VoteHeader](src/components/features/Hotpick/VoteHeader/VoteHeader.tsx) 컴포넌트를 그대로 사용한다.

| 요소 | 설명 |
|------|------|
| 로고 | HotPick 로고 (클릭 시 "/" 이동) |
| 스타일 | 그라데이션 텍스트, 높이 48px |

#### 4.4.2 투표 카드 섹션

기존 SingleCard의 투표 UI를 **확대**하여 상세페이지에 맞게 렌더링한다. 기존 카드(피드)와의 차이점:

| 항목 | 메인 피드 (SingleCard) | 상세페이지 |
|------|----------------------|-----------|
| 카드 배경 | `#1e1e1e` + border | `#1e1e1e` + border (동일) |
| 패딩 | 16px | 20px (여유 확보) |
| 옵션 버튼 높이 | 44px | 52px (터치 영역 확대) |
| 결과 바 높이 | 40px | 48px |
| 질문 폰트 | 16px bold | 20px bold (강조) |
| 공유 버튼 | 카드 내 아이콘 | 카드 하단 CTA 버튼으로 분리 |
| 댓글 | 아이콘 + 카운트 (탭하면 바텀시트) | 인라인 섹션으로 전환 |

**투표 인터랙션**: 기존 SingleCard와 동일한 3-phase 애니메이션 (`voteAnimations.ts`) 유지.

- Phase 1 (0-150ms): 버튼 탭 피드백
- Phase 2 (150-400ms): 버튼 → 결과 바 전환
- Phase 3 (400-700ms): 바 채움 + 퍼센트 카운트업

**투표 API**: 기존 `useSingleVote` 훅 재사용. `POST /api/v1/single/{hotpickId}/vote`

**마감 상태**: `status === 'CLOSED'` 시 옵션 버튼 비활성화 + "마감된 투표입니다" 안내 (기존 로직 동일)

#### 4.4.3 공유 CTA 버튼

투표 완료 후 활성화되는 공유 버튼. 카드 하단에 풀 너비로 배치.

| 상태 | 표시 | 스타일 |
|------|------|--------|
| 투표 전 | "투표하고 결과 확인하기" (비활성 텍스트) | 텍스트만, `$text-tertiary` |
| 투표 후 | "🔗 투표 공유하기" | `$primary-gradient` 배경, white 텍스트, 48px 높이, rounded-full |

**클릭 동작**: 현재 페이지 URL (`origin/hotpick/{alias}`) 클립보드 복사 + 토스트 "링크가 복사되었습니다"

**UX 근거**: 투표를 완료한 사용자가 "내 결과를 자랑하고 싶다"는 심리를 활용. 투표 직후가 공유 의향이 가장 높은 시점이므로 바로 눈에 들어오는 CTA 배치.

#### 4.4.4 인라인 댓글 섹션

**바텀시트가 아닌 인라인으로 배치하는 이유:**

| 근거 | 설명 |
|------|------|
| 페이지 목적 부합 | 상세페이지는 "해당 투표에 집중"하는 공간. 댓글도 콘텐츠의 일부로 자연스럽게 노출 |
| 체류시간 극대화 | 스크롤하면 자연스럽게 댓글이 보임 → 별도 탭 필요 없이 소비 유도 |
| BUNDLE과의 차별화 | BUNDLE은 5개 투표 순회 중 바텀시트가 적합. SINGLE은 1개 투표 → 인라인이 자연스러움 |

**댓글 헤더:**

```
💬 댓글 (142)         [인기순] [최신순]
```

- 댓글 수: `useCommentCount` 훅 사용
- 정렬: 인기순(기본) / 최신순 탭 전환
- 스타일: `$white` 텍스트, 16px semibold

**댓글 목록:**

기존 [CommentList](src/components/features/Hotpick/CommentModal/CommentList.tsx), [CommentItem](src/components/features/Hotpick/CommentModal/CommentItem.tsx) 컴포넌트를 재사용한다.

| 항목 | 스펙 |
|------|------|
| 초기 로드 | 5개 |
| 더보기 | "댓글 더보기" 버튼 (IntersectionObserver 대신) |
| 좋아요 | 기존 좋아요 기능 동일 |
| 수정/삭제 | 비밀번호 인증 후 수정/삭제 (기존 로직 동일) |

> 인라인 배치이므로 초기에는 5개만 보여주고 "댓글 더보기" 버튼으로 확장. 무한스크롤 시 페이지 전체 스크롤과 충돌 방지.

**댓글 작성 폼:**

기존 [CommentForm](src/components/features/Hotpick/CommentModal/CommentForm.tsx) 재사용.

```
┌─────────────────────────────────────┐
│  [닉네임    ]  [비밀번호    ]       │
│  [댓글을 남겨보세요...           ]  │
│                           [등록]    │
└─────────────────────────────────────┘
```

| 필드 | 규칙 |
|------|------|
| 닉네임 | 필수, 2-10자 |
| 비밀번호 | 필수, 4자 이상 (수정/삭제 시 인증용) |
| 댓글 | 필수, 1-200자 |

**투표 전 댓글 제한:**

- 투표 전: 댓글 목록은 **블러 처리** + "투표 후 댓글을 확인할 수 있습니다" 오버레이
- 투표 후: 블러 해제, 댓글 작성 가능

**근거**: BUNDLE 상세페이지에서도 투표 전 댓글 비활성화(`commentDisabled`) 패턴을 사용 중. 동일한 원칙을 적용하되, 상세페이지에서는 "댓글이 있다"는 것 자체가 투표 유인이 되도록 블러로 엿볼 수 있게 함.

#### 4.4.5 추천 섹션 (동일 카테고리 핫픽)

투표 + 댓글 이후 이탈 방지를 위한 추천 영역. **동일 카테고리** 기준으로 추천한다.

```
┌─────────────────────────────────────┐
│  🔥 이런 투표는 어때요?              │
│  ──────────────────────────────────  │
│  [ SingleCard (같은 카테고리 1) ]   │
│  [ SingleCard (같은 카테고리 2) ]   │
│                                     │
│  [더 많은 투표 보기 →]              │
└─────────────────────────────────────┘
```

| 항목 | 스펙 |
|------|------|
| 추천 로직 | 현재 Single과 **동일 카테고리**의 다른 핫픽 (최신순, 본인 제외) |
| 폴백 | 동일 카테고리 핫픽이 부족할 경우(0~1개) → 전체 최신순으로 보충 |
| 노출 개수 | 최대 2개 |
| 카드 형태 | 기존 SingleCard 컴포넌트 재사용 (투표 가능) |
| CTA | "더 많은 투표 보기 →" 버튼 → `/?tab=single` 이동 |

**근거**: 동일 카테고리 기반 추천이 단순 시간순 이전/다음보다 유리한 이유:

| 비교 | 시간순 이전/다음 | 동일 카테고리 기반 |
|------|-----------------|------------------|
| 관심사 연속성 | 맥락 단절 가능 ("치킨 vs 피자" → "아이폰 vs 갤럭시") | 자연스러운 흐름 ("치킨 vs 피자" → "짜장 vs 짬뽕") |
| 투표 전환율 | 관심 없는 주제면 이탈 | 이미 해당 카테고리에 관심 → 전환율 높음 |
| 바이럴 효과 | 약함 | 같은 관심사 그룹 내 순환 소비 유도 |

> BUNDLE 결과 페이지([ActionButtons.tsx](src/components/features/Result/ActionButtons/ActionButtons.tsx))의 "이전/다음 투표" 패턴과 레이아웃 통일성은 유지하되, 추천 로직만 카테고리 기반으로 변경.

### 4.5 데이터 페칭

#### 서버 사이드 (page.tsx 변경)

기존 [hotpick/[hotpickAlias]/page.tsx](src/app/hotpick/[hotpickAlias]/page.tsx)를 수정한다.

```
1. createServerQueryClient()
2. displayQueries.hotpick(alias) → 트렌드 상세 데이터
3. type 확인:
   - BUNDLE → 기존 HotpickView 렌더링 (변경 없음)
   - SINGLE → SingleDetailView 렌더링 (신규)
4. SINGLE인 경우: 첫 번째 election의 댓글 카운트 프리페치
5. HydrationBoundary로 감싸서 클라이언트 전달
```

> 기존에 `type === 'SINGLE'`이면 `/#alias`로 리다이렉트하던 로직을 **제거**하고, SingleDetailView를 렌더링하도록 변경.

#### 클라이언트 사이드

| 훅 | 용도 |
|----|------|
| `useQuery(displayQueries.hotpick(alias))` | Single 상세 데이터 (HydrationBoundary에서 초기 데이터 수신) |
| `useSingleVote()` | 투표 mutation (옵티미스틱 업데이트) |
| `useInfiniteComments(electionId)` | 댓글 목록 (인피니트 쿼리) |
| `useCommentCount(electionId)` | 댓글 수 |
| `useCommentMutations()` | 댓글 CRUD |
| `useRecommendSingles(alias, categoryCode)` | 동일 카테고리 기반 추천 Single (신규 또는 기존 API 활용) |

### 4.6 SEO / OG 메타태그

기존 [metadata.ts](src/app/hotpick/[hotpickAlias]/metadata.ts)를 **그대로 사용**한다. 경로가 동일하므로 추가 작업 불필요.

| 메타태그 | 값 |
|----------|-----|
| title | `{투표 제목} - HotPick` |
| description | SINGLE일 때: `{옵션A} vs {옵션B} - 지금 바로 투표하세요!` |
| og:image | Single의 mainImageUrl 또는 기본 OG 이미지 |
| og:type | `website` |
| og:url | `origin/hotpick/{alias}` |

**SEO 근거**: 해시(#) URL은 서버가 인식할 수 없어 OG 태그 생성이 불가능했음. `/hotpick/{alias}` 경로를 사용하면 카카오톡, 트위터 등에서 프리뷰 카드가 정상 렌더링됨 → **바이럴 효과 극대화**.

> metadata.ts에서 SINGLE 타입일 때 description을 옵션 기반으로 생성하도록 분기 추가가 필요할 수 있음. 기존 BUNDLE용 description 로직 확인 후 판단.

### 4.7 라우팅 구조 (기존 활용)

```
src/app/hotpick/[hotpickAlias]/       ← 기존 경로 그대로
  page.tsx           ← type 분기 추가 (BUNDLE → HotpickView, SINGLE → SingleDetailView)
  metadata.ts        ← SINGLE용 description 분기 추가 (필요 시)
  not-found.tsx      ← 변경 없음
```

> 별도 라우트를 생성하지 않으므로 params.ts, not-found.tsx, metadata.ts 등 기존 인프라를 100% 재활용.

### 4.8 상태별 화면

| 상태 | 표시 |
|------|------|
| 로딩 | 스켈레톤 UI (투표 영역 + 댓글 영역) |
| 에러 | "투표를 불러올 수 없습니다. 잠시 후 다시 시도해주세요." + 재시도 버튼 |
| 404 | not-found.tsx → "존재하지 않는 투표입니다" + 메인으로 가기 버튼 |
| 투표 전 | 옵션 버튼 활성, 댓글 블러 |
| 투표 후 | 결과 바 표시, 공유 CTA 활성, 댓글 해제 |
| 마감 | 결과 바 표시 (투표 불가), "마감된 투표입니다" 배지 |

---

## 5. 디자인 상세

### 5.1 컬러 & 토큰 (기존 디자인 시스템 준수)

| 요소 | 토큰 | 값 |
|------|------|----|
| 페이지 배경 | `$bg-primary` | `#121212` |
| 카드 배경 | `$bg-secondary` | `#1e1e1e` |
| 카드 보더 | `$border-placeholder` | `#555555` |
| 카드 radius | `$border-radius-lg` | `12px` |
| 질문 텍스트 | `$white`, 20px, `$font-weight-bold` | `#ffffff` |
| 옵션 버튼 | transparent + `$border-placeholder` border | — |
| 결과 바 (선택) | `$primary-gradient` at 30% opacity | `#ff00ff → #ff4500` |
| 결과 바 (미선택) | `rgba($white, 0.08)` | — |
| 공유 CTA | `$primary-gradient` | `#ff00ff → #ff4500` |
| 카테고리 태그 | `rgba($primary-start, 0.12)` bg + `$primary-start` text | — |
| 댓글 섹션 배경 | `$bg-secondary` | `#1e1e1e` |
| 댓글 블러 오버레이 | `backdrop-filter: blur(8px)` + 반투명 배경 | — |
| 추천 섹션 제목 | `$white`, 16px, `$font-weight-bold` | — |

### 5.2 타이포그래피

| 요소 | 크기 | 굵기 | 색상 |
|------|------|------|------|
| 질문 제목 | 20px | 700 | `$white` |
| 옵션 텍스트 | 16px | 500 | `$white` |
| 옵션 라벨 (A, B) | 16px | 700 | `$primary-start` |
| 결과 퍼센트 | 16px | 700 (선택) / 500 (미선택) | `$text-secondary` |
| 참여자 수 | 12px | 400 | `$text-tertiary` |
| 댓글 헤더 | 16px | 600 | `$white` |
| 댓글 본문 | 14px | 400 | `$text-secondary` |
| 추천 섹션 헤더 | 16px | 700 | `$white` |
| 공유 CTA | 16px | 700 | `$white` |

### 5.3 간격

| 요소 | 간격 |
|------|------|
| 투표 카드 내부 패딩 | 20px |
| 투표 카드 ↔ 댓글 섹션 | 24px |
| 댓글 섹션 ↔ 추천 섹션 | 32px |
| 댓글 항목 간 | 16px |
| 추천 카드 간 | 16px |
| 섹션 좌우 마진 | 0px (FlexibleLayout이 max-width: 568px 처리) |

### 5.4 인터랙션 & 애니메이션

| 인터랙션 | 애니메이션 |
|----------|-----------|
| 투표 선택 | 기존 3-phase 애니메이션 (700ms) — `voteAnimations.ts` |
| 공유 CTA 등장 | 투표 완료 후 `fadeIn` 0.3s ease |
| 댓글 블러 해제 | `backdrop-filter: blur(8px) → blur(0)` 0.5s ease |
| 좋아요 아이콘 | 기존 `bounce` 0.3s ease |
| 추천 카드 호버 | 기존 SingleCard 호버 효과 없음 (클릭만) |
| 페이지 진입 | 카드 영역 `fadeIn` + `translateY(10px → 0)` 0.4s ease |

---

## 6. BUNDLE 타입 공유하기 변경 (간단)

BUNDLE은 이미 `/hotpick/{alias}` 상세페이지가 존재하므로 URL만 변경하면 된다.

| 항목 | 변경 |
|------|------|
| MainView.handleShare | 모든 타입에서 `origin/hotpick/{alias}` 복사 (타입 분기 불필요) |
| hotpick/[alias]/page.tsx | `type === 'SINGLE'`일 때 `/#alias` 리다이렉트 → SingleDetailView 렌더링으로 교체 |

---

## 7. 컴포넌트 재사용 매트릭스

신규 개발이 필요한 컴포넌트와 재사용 가능한 컴포넌트를 정리한다.

### 7.1 재사용 (변경 없이)

| 컴포넌트 | 원본 경로 |
|----------|----------|
| FlexibleLayout | `src/components/common/FlexibleLayout/` |
| VoteHeader | `src/components/features/Hotpick/VoteHeader/` |
| DeadlineBadge | `src/components/common/DeadlineBadge/` |
| CommentItem | `src/components/features/Hotpick/CommentModal/CommentItem` |
| CommentItemSkeleton | `src/components/features/Hotpick/CommentModal/CommentItemSkeleton` |
| CommentPasswordModal | `src/components/features/Hotpick/CommentModal/CommentPasswordModal` |
| CommentEditModal | `src/components/features/Hotpick/CommentModal/CommentEditModal` |
| Button | `src/components/common/Button/` |

### 7.2 재사용 (약간의 수정/확장)

| 컴포넌트 | 수정 내용 |
|----------|----------|
| CommentForm | 인라인 배치에 맞게 스타일 조정 (바텀시트 의존 제거) |
| CommentList | IntersectionObserver → "더보기" 버튼 옵션 추가 |
| SingleCard (추천 영역용) | 기존 그대로 사용 가능 |

### 7.3 신규 개발

| 컴포넌트 | 위치 | 설명 |
|----------|------|------|
| `SingleDetailView` | `src/components/features/Hotpick/SingleDetailView/` | 상세페이지 메인 클라이언트 컴포넌트 (오케스트레이터) |
| `SingleVoteSection` | `src/components/features/Hotpick/SingleDetailView/` | 확대된 투표 UI (옵션 버튼 + 결과 바 + 공유 CTA) |
| `InlineCommentSection` | `src/components/features/Hotpick/SingleDetailView/` | 인라인 댓글 영역 (헤더 + 리스트 + 폼 + 블러 오버레이) |
| `SingleRecommendSection` | `src/components/features/Hotpick/SingleDetailView/` | 추천 섹션 (이전/다음 Single + CTA) |
| `SingleDetailView.module.scss` | `src/components/features/Hotpick/SingleDetailView/` | 상세페이지 전용 스타일 |

> 기존 Hotpick 컴포넌트들과 같은 `features/Hotpick/` 디렉토리 하위에 배치하여 구조적 통일성 유지.

---

## 8. API 영향도

### 8.1 기존 API 사용 (변경 없음)

| API | 용도 |
|-----|------|
| `GET /api/v1/display/trend/{alias}` | Single 상세 데이터 (`displayQueries.hotpick`) |
| `POST /api/v1/single/{hotpickId}/vote` | 투표 |
| `GET /api/v1/comments` | 댓글 목록 |
| `POST /api/v1/comments` | 댓글 작성 |
| `PUT /api/v1/comments/{id}` | 댓글 수정 |
| `DELETE /api/v1/comments/{id}` | 댓글 삭제 |
| `POST /api/v1/comments/{id}/like` | 댓글 좋아요 |
| `GET /api/v1/comments/count` | 댓글 수 |

### 8.2 BE 요청 사항

| 요청 | 설명 | 우선순위 |
|------|------|---------|
| 동일 카테고리 추천 API | `GET /api/v1/display/recommend?alias={alias}&categoryCode={code}&size=2` — 동일 카테고리의 다른 핫픽 반환 (본인 제외, 최신순). 부족 시 전체에서 보충. | 중 |
| `anchor` 파라미터 폐기 고려 | `GET /api/v1/display/main`의 `anchor`, `direction` 파라미터 → 더 이상 FE에서 사용하지 않으므로 BE에서도 폐기 가능 (필수는 아님) | 낮 |

> 추천 API가 별도 엔드포인트 없이 기존 `GET /api/v1/display/main`에 `categoryCodes` + `excludeAlias` 파라미터로 대체 가능하다면 신규 API 불필요. BE와 협의 필요.

---

## 9. 바이럴 & 리텐션 효과 분석

### 9.1 바이럴 루프 설계

```
[사용자 A] 메인 피드에서 Single 투표
     ↓
투표 완료 → 공유 CTA 클릭
     ↓
/hotpick/{alias} URL 클립보드 복사
     ↓
카카오톡/SNS 공유 (OG 프리뷰 카드 표시!)
     ↓
[사용자 B] 공유 링크 클릭
     ↓
/hotpick/{alias} → type=SINGLE → Single 상세 뷰 → 즉시 투표 가능
     ↓
투표 완료 → 결과 확인 → 댓글 읽기/쓰기
     ↓
공유 CTA or 추천 섹션 → 다시 바이럴 or 리텐션
```

### 9.2 개선 기대 효과

| 지표 | AS-IS (해시 공유) | TO-BE (상세페이지 공유) | 근거 |
|------|------------------|----------------------|------|
| OG 프리뷰 | 불가 (해시 URL) | 가능 (SSR) | 카카오톡 등에서 프리뷰 카드 → CTR 향상 |
| 공유→투표 전환율 | 낮음 (피드 중간 착지) | 높음 (즉시 투표 가능) | 전용 페이지 → 인지 부하 ↓ |
| 체류시간 | 짧음 (피드 이탈) | 증가 (댓글 + 추천) | 인라인 댓글 + 추천 카드 |
| 재방문율 | 낮음 | 증가 | 추천 섹션 → 메인 피드 유입 |

---

## 10. 구현 우선순위

| 순서 | 작업 | 난이도 | 비고 |
|------|------|--------|------|
| 1 | 해시 기반 공유하기 폐지 (코드 제거) | 낮 | 섹션 2 참조 |
| 2 | 공유 URL 변경 (`origin/hotpick/{alias}`로 통일) | 낮 | handleShare 한 줄 수정 |
| 3 | `hotpick/[alias]/page.tsx` type 분기 추가 | 중 | SINGLE 리다이렉트 → SingleDetailView 렌더링 |
| 4 | SingleDetailView 컴포넌트 개발 | 중 | 투표 섹션 (기존 로직 재활용) |
| 5 | InlineCommentSection 개발 | 중 | 기존 Comment 컴포넌트 재사용 |
| 6 | SingleRecommendSection 개발 | 낮 | Result ActionButtons 패턴 참조 |
| 7 | metadata.ts SINGLE 대응 (필요 시) | 낮 | description 분기 |

---

## 11. 기획서에 반영할 변경사항

| 문서 | 변경 |
|------|------|
| `docs/specs/00-overview.md` 섹션 7 | Single 전용 경로(`/single/{alias}`) 삭제, `/hotpick/{alias}`로 통합된 것 반영 |
| `docs/specs/01-main-page.md` 섹션 5.2 | Single 플로우: "Single 전용 페이지로 이동 (/single/{alias})" → "상세 페이지로 이동 (/hotpick/{alias})" |
| 본 문서 (`07-share-improvement-and-single-detail.md`) | 최종 확정 후 `06-single-page.md`로 통합 고려 |
