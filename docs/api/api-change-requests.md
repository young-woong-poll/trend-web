# API 변경 요청서

> FE 닉네임 시스템 개편 및 그룹 비교(Phase 3) 도입에 따른 기존 API 변경사항 + 신규 필드 요청

---

### 2-3. 프로필 색상 확장 — `PATCH /api/v1/auth/me`

**현재 동작**: `profileColor` 필드에 8개 색상명 중 하나를 저장 (`purple`, `blue`, `green`, `amber`, `red`, `pink`, `cyan`, `indigo`)

**변경 요청**: 허용 색상값을 24개로 확장

**추가되는 색상명 (16개)**: `magenta`, `sky`, `gold`, `teal`, `grape`, `sunset`, `ocean`, `lime`, `coral`, `lavender`, `mint`, `peach`, `sapphire`, `rose`, `forest`, `flame`

**변경 사유**:

- 그룹 비교(최대 10명+)에서 멤버를 아바타 색으로 구분하는데 8개로는 부족
- 프로필 색상 = 그룹 비교 아바타 색상으로 통합하여 일관성 확보

**영향 범위 (profileColor validation이 필요한 모든 API)**:

| API                        | 용도                             | 필요 조치                             |
| -------------------------- | -------------------------------- | ------------------------------------- |
| `PATCH /api/v1/auth/me`    | 마이페이지 프로필 색상 변경      | `profileColor` validation에 24개 허용 |
| `POST /api/v1/auth/signup` | 회원가입 시 랜덤 배정 (2-9 참조) | 24개 중 랜덤 배정                     |

> 그라데이션은 FE에서만 렌더링하므로 BE는 색상명(string)만 저장/반환하면 됩니다.
> 읽기 전용 API (`GET /api/v1/auth/me`, 댓글 조회 등)는 string을 그대로 반환하므로 변경 불필요.

**FE 대응 완료**: `profileColors.ts` 24개 확장, 그룹 비교 컴포넌트 9개 통합, ProfileColorModal 그리드 24개 대응

---

### 2-9. 가입 시 profileColor 랜덤 배정 — `POST /api/v1/auth/signup`

**현재 동작**: 가입 시 `profileColor`를 설정하지 않아 모든 신규 유저가 기본값(`purple`)으로 생성됨

**변경 요청**: 가입 시 서버에서 24개 프로필 색상 중 하나를 랜덤으로 배정

**사용 가능한 색상 (24개)**:

`purple`, `blue`, `green`, `amber`, `red`, `pink`, `cyan`, `indigo`, `magenta`, `sky`, `gold`, `teal`, `grape`, `sunset`, `ocean`, `lime`, `coral`, `lavender`, `mint`, `peach`, `sapphire`, `rose`, `forest`, `flame`

**변경 사유**:

- 현재 가입 시 색상 선택 UI가 없어 모든 신규 유저가 보라색 프로필로 생성됨
- 그룹 비교에서 멤버 아바타 색상이 프로필 색상 기반이므로, 동일 색상 유저가 많으면 구분이 어려움
- 가입 퍼널에 색상 선택 단계를 추가하면 이탈률 증가 우려 → 서버 랜덤 배정이 최선

**영향 범위**:

- `POST /api/v1/auth/signup` — 가입 처리 시 `profileColor`를 24개 중 랜덤 선택하여 저장
- FE 변경 불필요 (기존 폴백 로직 유지)
