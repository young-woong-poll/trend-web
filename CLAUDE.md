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

- 다크 테마 (#121212 배경)
- Primary Gradient: #ff00ff → #ff4500
- Attention: #DFFF00
- 상세 토큰: `docs/design-system/tokens.md` 참조

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
