# HotPick

애매한 고민을 대중 투표로 해결하는 실용 도구형 플랫폼.
싱글 핫픽(인라인 투표) + 번들 핫픽(5개 묶음, BE 미구현).
타겟: 20-40대 한국 청년, 모바일 우선

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

- **다크 테마 전용** (#121212 배경) — 라이트 모드 없음
- Primary Gradient: #ff00ff → #ff4500
- Attention: #DFFF00
- 상세 토큰: `docs/design-system/tokens.md` 참조

### 다크 모드 UI 규칙 (필수 준수)

이 프로젝트는 **다크 모드 전용**입니다. 모든 UI 컴포넌트 생성/수정 시 아래 규칙을 반드시 따르세요.

#### 팝업/모달 (Modal, Alert, Confirm)

| 요소        | 값                                                                  |
| ----------- | ------------------------------------------------------------------- |
| 배경        | `$bg-secondary` (#1e1e1e)                                           |
| 테두리      | 1px solid #333                                                      |
| 그림자      | `0 20px 40px rgba(0, 0, 0, 0.5)`                                    |
| 제목 텍스트 | `$white` (#ffffff)                                                  |
| 본문 텍스트 | `$text-secondary` (#d1d1d1)                                         |
| 보조 텍스트 | `$text-tertiary` (#8a8a8a)                                          |
| 닫기 버튼   | `$text-tertiary`, hover 시 `$white` + `rgba(255,255,255,0.05)` 배경 |

#### 입력 필드 (Input)

| 요소          | 값                         |
| ------------- | -------------------------- |
| 배경          | `$bg-tertiary` (#2c2c2c)   |
| 테두리        | 1px solid #3a3a3a          |
| 텍스트        | `$white`                   |
| 플레이스홀더  | `$text-tertiary` (#8a8a8a) |
| 포커스 테두리 | `$text-tertiary` (#8a8a8a) |
| 에러 테두리   | `$error` (#ff2e2e)         |

#### 버튼

| variant          | 배경                     | 텍스트            | 테두리                          |
| ---------------- | ------------------------ | ----------------- | ------------------------------- |
| primary (확인)   | `$bg-tertiary` (#2c2c2c) | `$white`          | 1px solid `$border-placeholder` |
| secondary (취소) | transparent              | `$text-secondary` | 1px solid #333                  |
| gradient (CTA)   | `$primary-gradient`      | `$white`          | none                            |

#### 절대 사용 금지

- `$white` (#ffffff)를 배경으로 사용
- `$neutral-900`, `$neutral-600` 등 라이트 테마 텍스트 색상
- `$neutral-200`, `$neutral-300` 등 라이트 테마 테두리/배경 색상

## 문서 위치

- 기획서: /docs/specs/
- 디자인 가이드: /docs/design/
- BE 개발요청서: /docs/api/
- 디자인 시스템: /design-system/
- 콘텐츠 자동화: ../hotpick-content/ (별도 레포)

## 상세 기획서

- `docs/specs/00-overview.md` — 서비스 기술 개요 (페이지 구성, API, 투표/댓글 시스템)
- `docs/specs/hotpick.md` — 서비스 전체 기획서 (비전, 콘텐츠 전략, 성장 전략, 로드맵)
- `docs/specs/branding.md` — 브랜딩 전략
- `docs/design-system/tokens.md` — 디자인 토큰

## 코딩 컨벤션

- 컴포넌트: PascalCase (SingleCard.tsx)
- 훅: camelCase (useSingleList.ts)
- 스타일: 컴포넌트명.module.scss
- API 응답 타입: 기획서 섹션 13 참조
- 서버 API 미구현 시: MSW 또는 하드코딩 mock 데이터로 대체

## 팀 구성

- 기획 + FE: 웅일
- BE: 동료 2명

## Git 작업 규칙

### 필수 확인 사항

다음 Git 명령어를 실행하기 **전에 반드시 사용자에게 확인**을 받아야 합니다:

- `git add`
- `git commit`
- `git push`
- `git reset`
- `git rebase`
- `git revert`
- `git cherry-pick`
- `git merge`
- `git stash`
- 기타 Git 히스토리를 수정하는 모든 명령어

### 확인 절차

1. 변경사항을 완료한 후
2. 커밋할 파일 목록과 변경 내용 요약을 사용자에게 제시
3. 사용자의 명시적 승인을 받은 후에만 Git 명령어 실행

### 예외

- `git status`
- `git log`
- `git diff`
- `git show`
  등 조회만 하는 명령어는 확인 없이 실행 가능합니다.

## 작업 흐름

1. 코드 작성/수정
2. 린트 및 타입 체크 실행
3. **사용자에게 변경사항 확인 요청**
4. 승인 후 커밋
5. **사용자에게 푸시 확인 요청**
6. 승인 후 푸시

## 아이콘 사용 규칙

### SVG 아이콘 파일 위치

- 모든 SVG 아이콘은 `src/assets/icon/` 디렉토리에 `.tsx` 파일로 정의합니다.
- 파일명은 PascalCase로 작성합니다. (예: `LikeIcon.tsx`, `ClockIcon.tsx`)

### 아이콘 컴포넌트 작성 규칙

```tsx
import type { FC, SVGProps } from 'react';

interface IconNameProps extends SVGProps<SVGSVGElement> {
  // 필요한 추가 props 정의 (예: filled, size 등)
}

const IconName: FC<IconNameProps> = (props) => <svg {...props}>{/* SVG 내용 */}</svg>;

export default IconName;
```

### 사용 방법

```tsx
import IconName from '@/assets/icon/IconName';

// 컴포넌트에서 사용
<IconName className={styles.icon} />;
```

## gstack

웹 브라우징은 반드시 `/browse` skill을 사용합니다. `mcp__claude-in-chrome__*` 도구는 절대 사용하지 마세요.

### 사용 가능한 skills

- `/office-hours` — 오피스 아워
- `/plan-ceo-review` — CEO 리뷰 플랜
- `/plan-eng-review` — 엔지니어링 리뷰 플랜
- `/plan-design-review` — 디자인 리뷰 플랜
- `/design-consultation` — 디자인 컨설팅
- `/design-shotgun` — 디자인 샷건
- `/design-html` — 디자인 HTML
- `/review` — 코드 리뷰
- `/ship` — 배포
- `/land-and-deploy` — 랜딩 & 디플로이
- `/canary` — 카나리 배포
- `/benchmark` — 벤치마크
- `/browse` — 웹 브라우징 (모든 웹 브라우징에 사용)
- `/connect-chrome` — 크롬 연결
- `/qa` — QA
- `/qa-only` — QA only
- `/design-review` — 디자인 리뷰
- `/setup-browser-cookies` — 브라우저 쿠키 설정
- `/setup-deploy` — 배포 설정
- `/retro` — 회고
- `/investigate` — 조사
- `/document-release` — 릴리스 문서화
- `/codex` — 코덱스
- `/cso` — CSO
- `/autoplan` — 자동 플랜
- `/careful` — 신중 모드
- `/freeze` — 프리즈
- `/guard` — 가드
- `/unfreeze` — 언프리즈
- `/gstack-upgrade` — gstack 업그레이드
- `/learn` — 학습
