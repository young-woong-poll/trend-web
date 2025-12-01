# Claude Code 작업 지침

이 문서는 Claude Code가 이 프로젝트에서 작업할 때 따라야 할 지침을 정의합니다.

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
