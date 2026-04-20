# Bundle Compare 플로우 단순화 설계 (STEP 1)

1:1 비교 기능을 그룹 비교로 수렴하고 번들 결과·비교 플로우의 의사결정 피로와 바이럴 마찰을 제거해 K-factor를 끌어올린다. STEP 2(카카오 SDK) · STEP 3(그룹 고도화)로 이어지는 3단 계획의 1차.

## 배경

현재 HotPick 1:1·그룹 비교 플로우는 다음 구조적 문제를 안고 있다.

1. **결정 중복** — 번들 결과·비교 결과 페이지마다 CTA 2개 병렬 ("1:1/그룹", "다른 친구 케미/테스트 공유")로 의사결정 피로.
2. **Fake 결과 화면** — 생성자 대기 시 가상 데이터(`ghostAnswers`, `GHOST_NAMES`)로 "fake 케미 78%"를 렌더링해 기대치 왜곡. 실제 참여자 진입 시 실망감 유발.
3. **상태 분기 과다** — 비교 랜딩에 6가지 상태 분기(`needsLogin` / `isAlreadyTaken` / `canJoin` / `needsBundle` / `canViewResult` / `isCreatorReady`), CTA 텍스트 6종. 사용자 기대치 설정 어려움.
4. **1:1과 그룹의 기능 중복** — 본질적으로 "참여자 수만 다른 같은 기능"인데 UI·라우트(`/compare/[token]` vs `/compare/group/[token]`)·API가 분리되어 있음.
5. **죽은 코드** — `src/components/features/Compare/GroupResult/` 하위 9개 파일이 어디서도 import되지 않는 상태.

바이럴 K-factor 저조의 핵심 원인은 이 구조적 복잡도. "뾰족한 그룹 비교 기능 하나"로 수렴하면 단일 결정 원칙과 맞추면서 k를 빠르게 끌어올릴 여지가 있다.

## 레퍼런스 & 영감

### 폴리마켓 (polymarket.com)의 "Share" 단일 CTA

- 이분 선택 + 결과 시각화 플랫폼. 공유 CTA가 하나.
- **HotPick 맞춤 이유**: HotPick도 이분 선택 기반. 공유 CTA 단일화가 서비스 본질에 정확히 맞음.

### Polis (pol.is) 의 그룹 기본 단위

- 그룹 의견 시각화의 정점. 1:1 개념 없이 "그룹"이 유일한 참여 단위.
- **HotPick 맞춤 이유**: 그룹으로 수렴 후 그룹 결과 UI가 서비스의 얼굴. Polis의 "그룹 기본 단위" 접근을 차용.

### 토스 "한 번에 하나의 결정" 원칙

- UI 전반에서 결정 포인트 1개 유지. 모든 CTA는 단일 행동.
- **HotPick 맞춤 이유**: 번들 결과·그룹 결과 CTA 단일화 원칙 그대로 적용.

### 성공 사례 공통점: 단일 참여 모드

폴리마켓·Polis·Gas·Slay·Wordle 모두 "1:1 vs 그룹" 식 모드 선택 없음. 서비스 초기 단계에서 "뾰족한 칼 하나" 원칙이 검증됨.

## 방향성 결정 (Step 0)

설계 과정에서 다음 4가지 방향을 검토.

| 방향                            | 설명                                                             | 장점                                                        | 단점                            | 선택     |
| ------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------- | -------- |
| (A) 1:1·그룹 유지, CTA만 단일화 | 2개 페이지 각자 CTA 1개                                          | 변경 최소, 빠른 배포                                        | 1:1·그룹 존재 자체가 결정 피로  | 보류     |
| (B) 단일 URL 동적 분기          | /compare/[token] 하나, 참여자 수로 레이아웃 전환                 | 결정 제거                                                   | 레이아웃 급변 혼란, 구현 복잡   | 보류     |
| (C) "1:1 or 그룹" 선택 페이지   | 공유 전 모드 선택 화면 추가                                      | 의도 명확                                                   | 토스 원칙 역행                  | 탈락     |
| **(D) 그룹으로 수렴**           | 1:1 기능 제거, 그룹이 유일한 비교 모드. 2명 참여도 그룹으로 처리 | **단일 결정 원칙 최강 실현. 뾰족한 기능 집중. 코드 단순화** | 기존 1:1 링크 마이그레이션 필요 | **채택** |

**최종 선택**: **D — 1:1 기능 제거, 그룹 비교로 일원화**. "우리 둘" 감성은 UI/카피에서 자연어로 표현.

**Mock 사용**: 아니오 (정책·카피 결정이라 문장 스펙이 효율적)

## UX 체크포인트 통과 기록

- **Q1. 유저 목표 한 문장**: 받은 가치관 비교 초대를 즐기고, 다른 친구에게도 바로 보낸다.

- **Q2. 상태 정의**:
  - 엠프티:
    - 번들 결과: 답변 없음 → `/bundle/[slug]/play`로 자동 리다이렉트 (현재 구현 유지)
    - 비교 대기 (참여자 본인만 1명): 초대 유도 화면 (봉인 아이콘 + 샘플 등급 로테이션 + 단일 CTA "초대 링크 복사하기")
    - BundleRecommendSection: 추천 번들 0개 → 섹션 미노출 (현재 구현 유지)
  - 실패/에러: API 호출 실패 시 **"결과를 불러오지 못했어요. 다시 시도해 주세요"** + 재시도 버튼
  - 로딩: Skeleton (번들 결과) / Loading orbit + "케미를 분석하고 있어요" (비교 결과)
  - 오프라인: "네트워크 연결을 확인해 주세요" — **향후 작업**으로 이월 (HotPick 전반 오프라인 미대응)

- **Q3. 대안 경로**:
  - 모든 화면에서 뒤로가기·메인 이동 자유 보장. 플로우 강제 없음.
  - 결과 재확인은 URL 재방문 가능 (CTA 클릭 불필요).
  - 비교 링크 재공유 경로 취약점은 한계로 인정, STEP 3 "내 비교 관리" 페이지로 해결.
  - 카카오 로그인은 참여에 필수 (결과 저장·매칭 위해). 번들 인트로는 비로그인 열람 가능.

- **Q4. 카피**:
  - 주 용어: **케미 유지** (보조: 궁합, 싱크율은 정량 지표)
  - 톤: 케미/궁합 중심. 대결 톤은 OG 카드·초대 메시지에만 제한.
  - 대중성 카피 초강력 선언형 5개 (하단 "카피 전문" 섹션 참조)
  - "1:1" 용어 UI 전면 제거 (내부 API/테이블은 유지)
  - 번들 결과 CTA: **"친구들과 비교하기"**
  - 존댓말, 모바일 한 줄 내 수용 가능 길이.

- **Q5. 회귀 영향**:
  - 1:1 링크 마이그레이션: 서버 일회성 스크립트로 `type='ONE_TO_ONE'`을 `'GROUP'`으로 전환. 기존 1:1 링크도 그룹으로 완전 편입 (잠금 처리 없음, 50명 상한 동일 적용).
  - 배포 전략: **한 번에 전체 배포 (Feature Flag 없음)**.
  - 답변 리스트 접힘 **첫 방문 툴팁**으로 학습 비용 완화.
  - `/compare/[token]` → `/compare/group/[token]` 리다이렉트.
  - 가치관 지도(deprecated)는 이번 스펙 범위 밖. `docs/specs/bundle-compare.md` UPDATE NEEDED 박스로 추적.
  - 마이페이지(기획서 4.6) 미구현 상태, STEP 3 재설계 예고.

## 스코프

### STEP 1 포함 (12개 태스크)

1. **1:1 기능 완전 통합 제거 + CompareLanding/match 페이지 제거**
   - `/compare/[token]` → `/compare/group/[token]` 리다이렉트 (Next.js redirect)
   - `/compare/match/[token]` → `/compare/group/[token]` 리다이렉트. **match 라우트 deprecated**
   - **`CompareLanding` 페이지 완전 제거** — GroupResult 페이지를 "상태별 루트"로 확장해 초대장·대기·결과 모두 단일 페이지에서 렌더링
   - GroupResult 내부를 상태별 서브 뷰로 분리: `InviteView` (비멤버), `WaitingView` (멤버 + 참여자 1명), `FullGroupResultView` (멤버 + 참여자 2명+), `NotFoundView` (토큰 무효/에러)
   - **멤버별 1:1 상세를 바텀시트로 전환** — 기존 `CompareResult` 컴포넌트를 `MemberDetailSheet` (가칭) 바텀시트 내부 콘텐츠로 재활용. 그룹 결과 네트워크에서 멤버 탭 시 바텀시트 오픈. URL 변경 없음 (`/compare/group/[token]` 유지)
   - `/compare/group/[token]/page.tsx`의 `generateMetadata` 에서 상태별 OG 분기 (참여자 없음 → "초대장 OG", 참여자 있음 → "결과 카드 OG"). 기존 `/compare/[token]` 의 OG 생성 로직을 흡수
   - **마이그레이션 고지 배너**: 과거 1:1 링크(서버 `migratedFromOneToOne` 플래그)로 진입한 생성자에게 **첫 결과 접근 1회**만 배너 노출 — **"이 테스트는 이제 다른 친구도 참여할 수 있어요"**. localStorage 1회 기록 후 재노출 안 함

2. **서버 일회성 마이그레이션** (BE 팀 협의 완료)
   - `UPDATE compare_links SET type = 'GROUP', group_name = COALESCE(group_name, '{creatorNickname}의 케미 테스트') WHERE type = 'ONE_TO_ONE';`
   - `type` 필드는 당분간 스키마 유지하되 모든 값이 `GROUP`으로 수렴. 이후 자연 제거.
   - 마이그레이션 이후 기존 1:1 링크는 2인 그룹으로 동작

3. **CreateCompareLink / CreateGroupLink 통합**
   - 단일 모달 `CreateCompareLink`로 통합. 그룹 링크 생성에만 사용
   - `CreateGroupLink.tsx` + `.module.scss` 파일 삭제
   - 모달 제목: "케미 테스트 공유"

4. **번들 결과 화면 재구성** (`BundleResult.tsx`)
   - 대중성 히어로 강조 + 초강력 선언형 카피 5개
   - 플로팅 CTA 단일화: **"친구들과 비교하기"**
   - 답변 리스트 **기본 접힘** + "내 답변 N개 보기" 토글 + **첫 방문 툴팁** (1회 노출 후 localStorage 기록)
   - 답변 아코디언: 펼침 시 현재 구현 유지
   - "그룹 케미 보기" 버튼 삭제

5. **비교 결과 (그룹) 페이지 CTA 재정비** (`GroupResult.tsx`)
   - 플로팅 CTA: **"친구 초대하기"** 하나
   - 상단 메뉴 영역 (현재 SettingsIcon/LinkIcon 자리 옆): **"새 그룹 만들기"** 아이콘 버튼 추가. 툴팁 "다른 친구들과 새로 시작"
   - 기존 플로팅의 "새 그룹 만들기" 제거

6. **Fake 결과 화면 제거**
   - `CompareResult.tsx`의 `generateGhostAnswers` 로직 제거
   - `GroupResult.tsx`의 `GHOST_NAMES`/가상 멤버 합성 로직 제거
   - `isPreview` 상태의 대기 화면 전용 UI로 대체 (아래 "UI 디자인" 참조)

7. **BundleRecommendSection 맥락화**
   - `context?: { type: 'friend' | 'group'; name: string }` prop 추가
   - 상단 카피 동적 분기:
     - `{ type: 'group', name }`: "{name}과 이런 테스트도 해볼래요?"
     - `{ type: 'friend', name }`: "{name}과 이런 테스트도 해볼래요?" (2명 그룹 등에서 활용)
     - context 없음: 기본 "이런 테스트는 어때요?"
   - 호출부: `GroupResult.tsx` / `CompareResult.tsx` 에서 맥락 주입

8. **"1:1" 용어 UI 전면 제거 + 대결 톤 다운**
   - 아래 "카피 전문" 섹션의 매핑 표대로 일괄 교체
   - "가치관 대결 신청" → "케미 테스트 초대"
   - "대결 수락하기" → "참여하기" 또는 "결과 보기" (상태별)
   - "결과 개봉하기" → "결과 확인하기"

9. **죽은 코드 9개 삭제** (`src/components/features/Compare/GroupResult/`)
   - `FactionMap`, `GenderBadge`, `GenerationCluster`, `GroupStats`, `HiddenMatch`, `MemberList`, `MyRelationCard`, `RelationExplorer`, `ValueMap`
   - 각 `.tsx` + `.module.scss` 쌍 삭제 (총 18개 파일)

10. **OG 이미지 카피 업데이트**
    - `buildCompareOgImageUrl` 호출부에서 `type: 'ONE_TO_ONE'` 제거. 기본 GROUP 톤으로 단일화
    - OG 제목/부제 카피: 대결 톤 다운 (카피 전문 참조)

11. **번들 카드 재구성** (`BundleCard.tsx`)
    - 비교 어필 카피: "친구랑 1:1 비교, 그룹으로 비교 가능" → **"단톡방 친구들과 가치관 맞춰보기"** (가치관 + 단톡방 + 친구들 3개 키워드)
    - 메타 행: "N개 질문" → **"가치관 질문 N개"** ("가치관" 수식어 명시)
    - 그 외(카테고리/케미 테스트 뱃지/공유 버튼/소요시간/CTA) 현행 유지

12. **번들 인트로 재구성** (`BundleIntro.tsx`)
    - 기존 "1:1 케미" 프리뷰 섹션 **완전 제거** (그룹 수렴)
    - 제목 아래 메타 행 보강: 질문수 · 소요시간 · 참여자수 (소요시간 명시 추가)
    - **신규 섹션 "이렇게 진행돼요"** (숫자 뱃지 ①②③ + 짧은 카피):
      - ① 가치관 질문 N개에 답해요
      - ② 단톡방 친구들에게 링크를 보내요
      - ③ 친구들이 풀면 그룹 케미가 열려요
    - 그룹 프리뷰 섹션만 유지하되 라벨 **"그룹 케미" → "우리의 케미"** 로 변경
    - `GroupPreviewNetwork` 재활용, 기존 훅 카피(getCompareHook.group) 그대로 유지
    - `CompareOneIcon` 임포트 제거 (아이콘 파일 자체도 삭제 대상에 포함)

### STEP 2+ 제외

- 카카오 SDK 연동 + OG 이미지 템플릿 재디자인 (STEP 2)
- 바이럴 유도 UX 강화 — α/β/γ 동선 심화 (STEP 2)
- 1:1·그룹 결과 UI 섹션 구조 통합 및 결과 레이아웃 단일화 (STEP 2 또는 3)
- 마이페이지 비교 관리 페이지 (STEP 3)
- 인구통계 인사이트 고도화 (STEP 3)
- 질문 퀄리티 자동 플래그 (STEP 3)
- 오프라인 대응 (전역 숙제)

## UI 디자인

### 레이아웃 공통 원칙

- 다크 배경 `$bg-primary` (#121212)
- 모바일 퍼스트 (375px 기준), PC 레이아웃은 기존 `BundleBackground` 컨테이너 유지
- 이모지 금지, SVG 아이콘은 `src/assets/icon/` 사용
- 토큰 외 값 사용 금지

### 번들 결과 화면 재구성

현재 `BundleResult.tsx`의 섹션 순서를 유지하되 위계·접힘을 조정.

**섹션 순서**:

1. **뒤로가기 버튼** (좌상단, 현재 유지)
2. **카테고리 뱃지 + 번들 제목** (현재 유지)
3. **대중성 히어로 카드** — 크기·밀도 상향
   - 캐릭터 이미지 (220×220)
   - "대중성 지수" 라벨 + 도움말 아이콘 (현재 유지, 위치 미세 조정 가능)
   - 지수 숫자 (크게)
   - **캐릭터 타이틀** (예: "트렌드 여우")
   - **초강력 선언 카피** (예: "트렌드 여우의 눈.") — 지수 아래, 캐릭터 타이틀과 별도 줄
   - 참여자 수 힌트 ("\* 현재 N명 참여 기준")
4. **내 답변 N개** — **기본 접힘**
   - 헤더: "내 답변 N개 보기" + 펼침 아이콘 (▾)
   - 첫 방문 시 헤더 옆 말풍선 툴팁: "답변은 여기서 펼쳐볼 수 있어요" (localStorage `bundleResult.answerToggleToolTipSeen` 기록)
   - 펼침 후: 현재 `answerList` 구현 유지 (Q1..QN, 다수파/소수파 뱃지, 분리형 투표 바)
5. **플로팅 CTA**
   - 단일 버튼: **"친구들과 비교하기"**
   - 배경: `$primary-gradient`, 텍스트: `$white`, 높이: 48px, radius: 9999px
   - `position: fixed; bottom: 16px; left: 16px; right: 16px;` + safe-area 반영

**제거**: "그룹 케미 보기" 버튼, 플로팅 2개 구조.

### InviteView — 비멤버 자동 join 플로우 (상세)

비멤버가 `/compare/group/[token]` 에 진입한 상태별 전이·로딩·실패 복귀.

```
[비멤버 진입]
 │
 ├─ 로그인 여부?
 │    ├─ 비로그인 → needsLogin 상태
 │    │    ├─ CTA "참여하기" 탭
 │    │    ├─ `returnUrl` 쿼리에 현재 `/compare/group/[token]` 저장
 │    │    ├─ 카카오 OAuth → 콜백 → 회원가입 또는 로그인
 │    │    └─ returnUrl 로 복귀 → 아래 "로그인" 상태로 진입
 │    └─ 로그인 완료 → 다음 단계
 │
 ├─ 번들 완료 여부? (`myBundleCompleted`)
 │    ├─ 미완료 → needsBundle 상태
 │    │    ├─ 샘플 질문 미리보기 노출 (기존 `PreviewRotation` 또는 firstQuestion)
 │    │    ├─ CTA "참여하기" 탭
 │    │    ├─ `/bundle/[slug]/play?returnToken={token}` 로 이동 (returnToken 쿼리로 원 링크 기억)
 │    │    ├─ 번들 N개 풀이 완료 → 번들 결과 페이지(`/bundle/[slug]/result?returnToken={token}`)로 이동
 │    │    └─ 번들 결과 페이지에서 returnToken 감지 → **자동 join 호출** → 그룹 결과로 리다이렉트 → 아래 "참여 완료" 로 진입
 │    └─ 완료 → 다음 단계
 │
 ├─ 그룹 참여 여부? (`isMember`)
 │    ├─ 비멤버 (번들은 풀었으나 아직 join 안 함) → canJoin 상태
 │    │    ├─ CTA "결과 보기" 탭 → `POST /compare-links/{token}/join` 호출
 │    │    ├─ **로딩 중 문구**: "그룹에 합류하고 있어요..." (3초 이상 지속 시 재시도 안내)
 │    │    ├─ 성공 → 그룹 결과로 자동 전이 (FullGroupResultView)
 │    │    └─ 실패 (그룹 마감·50명 초과·네트워크) → 에러 토스트 "그룹에 합류하지 못했어요. 다시 시도해 주세요" + 재시도 CTA. 3회 실패 시 "잠시 후 다시 시도해 주세요" 안내 + 메인 이동 버튼
 │    └─ 멤버 → FullGroupResultView 진입 (정상 결과)
 │
 └─ 세션 소실 시나리오 (예: play 중 카카오 로그아웃)
      └─ returnToken 쿼리는 살아있으므로 로그인 후 복귀 지점 그대로. 단, 로그인 모달이 `returnUrl` 파라미터를 흘리지 않도록 주의
```

**상태별 CTA 문구** (카피 전문 "비교 랜딩 상태별 문구" 표 참조):

- needsLogin → "참여하기"
- needsBundle → "참여하기"
- canJoin → "결과 보기"
- canView / isCreatorReady → "결과 보기"

**로딩 문구**:

- 번들 결과 페이지의 auto-join 중: "그룹에 합류하고 있어요..."
- 그룹 결과 로딩: "그룹 케미를 분석하고 있어요" (기존 유지)

### 번들 카드 재구성 (메인 피드)

`BundleCard.tsx` 수정 범위 (레이아웃 구조 유지, 카피만 교체):

**상단 행**: `[카테고리 · 카테고리 · 케미 테스트]  [공유 아이콘]` (현행 유지)

**제목/부제**: 현행 유지

**메타 행 (text-sm, text-tertiary)**:

```
가치관 질문 N개 · 약 N분 · M명 참여
```

- "N개 질문" → "가치관 질문 N개" (순서 변경 + "가치관" 수식어 추가)
- 소요시간(약 N분) 현행 유지
- 참여자수 현행 유지

**비교 어필 카피** (메타 행 아래, text-base, font-medium):

```
단톡방 친구들과 가치관 맞춰보기
```

- 단톡방·친구들·가치관 3개 키워드 한 줄 내포
- "1:1 비교", "그룹으로 비교" 등 기능 모드 언급 제거
- 강조 색상(`$primary-gradient`)은 카피 전체 또는 "단톡방 친구들" 부분에 선택적으로 적용 (선택)

**CTA 버튼**: "시작하기" / "결과 보기" (현행 유지)

**하단 뱃지 영역**: 마감·참여 완료 뱃지 (현행 유지)

### 번들 인트로 재구성 (`/bundle/[slug]`)

#### 섹션 순서

1. **카테고리 + 제목** (현행 유지)
2. **메타 행**: `가치관 질문 N개 · 약 N분 · M명 참여` (소요시간 명시 추가)
3. **"이렇게 진행돼요" 섹션 (신규)** ← 핵심 추가
4. **"우리의 케미" 프리뷰 섹션** (기존 그룹 섹션에서 라벨 변경)
5. **플로팅 CTA "시작하기"** (현행 유지)

#### "이렇게 진행돼요" 섹션 — 숫자 뱃지 방식 (A안)

```
┌──────────────────────────────┐
│ 이렇게 진행돼요               │
│                              │
│ ① 가치관 질문 N개에 답해요    │
│ ② 단톡방 친구들에게 링크를    │
│    보내요                    │
│ ③ 친구들이 풀면 그룹 케미가   │
│    열려요                    │
└──────────────────────────────┘
```

**스타일**:

- 배경: `$bg-secondary` (#1e1e1e) 카드, `rounded-md` (8px), `$spacing-4` (16px) 패딩
- 섹션 제목: `text-base` + `font-semibold` + `$white`
- 숫자 뱃지: 원형 24×24px, 배경 `$primary-gradient`, 텍스트 `$white`, `text-sm` + `font-bold`
- 설명: `text-sm` + `font-regular` + `$text-secondary`
- 각 단계 간 간격: `$spacing-3` (12px)
- 번호-텍스트 간격: `$spacing-2` (8px)

**카피 확정**:

- ① "가치관 질문 N개에 답해요" (N은 동적 치환, 보통 5-10)
- ② "단톡방 친구들에게 링크를 보내요"
- ③ "친구들이 풀면 그룹 케미가 열려요"

#### "우리의 케미" 프리뷰 섹션

- 라벨: "그룹 케미" → **"우리의 케미"** 로 변경
- 아이콘: `CompareGroupIcon` (현행 유지)
- 훅 카피: `getCompareHook(slug).group` (현행 유지)
- 시각 프리뷰: `GroupPreviewNetwork embedded` (현행 유지)

#### "1:1 케미" 프리뷰 섹션 — 완전 제거

- `CompareOneIcon` 임포트 제거
- 관련 JSX·스타일 전부 삭제
- `getCompareHook(slug).oneToOne` 참조 제거 (함수 자체는 `constants/compare.ts` 에 남아있으면 dead code로 정리 대상, STEP 2 점진 정리)
- `PreviewRotation` 임포트는 **유지** — 비교 대기 화면에서 계속 사용되므로

### 비교 대기 화면 (참여자 1명, 생성자)

`CompareResult.tsx`의 `isPreview` 분기 및 `GroupResult.tsx`의 `members.length === 1` 분기 공통 적용.

**섹션 순서**:

1. **뒤로가기** (좌상단)
2. **카테고리 뱃지 + 번들 제목**
3. **봉인 히어로** (텍스트 2줄로 압축)
   - 중앙 봉인 아이콘 (기존 `lockBody` + `lockShackle` SVG 조합 재활용)
   - 제목: **"{nickname}님의 케미, 친구가 오면 열려요"** (text-2xl bold)
   - 힌트 (제목 아래 `text-sm` + `$text-tertiary`): **"친구가 링크를 누르면 바로 시작돼요"**
   - (기존 3줄 "제목/부제/힌트" → 제목+힌트 2줄로 축약. 같은 내용 변주 제거)
4. **샘플 등급 로테이션** — `PreviewRotation` 컴포넌트 재활용
   - 라벨: **"이런 결과가 나올 수 있어요"**
   - S/A/B/C/D 등급 카드 로테이션 (현재 구현 활용)
   - 실제 매치율은 표시하지 않음 (기대치 왜곡 방지)
5. **플로팅 CTA**: **"친구에게 링크 보내기"** (FloatingCta 컴포넌트)
   - 탭 시: URL 복사 + 토스트 **"링크가 복사됐어요. 단톡방·카톡·메시지에 붙여넣으면 친구가 바로 참여할 수 있어요"**
   - STEP 2에서 카카오 SDK 추가 시 CTA를 **"카톡으로 공유하기"** 로 좁히고 네이티브 시트 연결 (STEP 1은 URL 복사라 채널 중립 유지)

**제거**: fake `ChemistryCard`, fake `AnswerComparison`, fake `ShockPoint`, fake `PopularityCompare`.

### 그룹 결과 페이지 CTA 재정비

`GroupResult.tsx` 변경점만:

**상단 헤더 (groupNameRight 영역)**:

- 현재: SettingsIcon + LinkIcon (2개)
- 변경 후: **NewGroupIcon(신규) + SettingsIcon + LinkIcon** (3개, 순서는 좌→우)
- NewGroupIcon 탭 → 기존 `setShowGroupModal(true)` 호출 (CreateCompareLink 모달 오픈)
- 아이콘 사이즈: 기존 헤더 아이콘(SettingsIcon/LinkIcon)과 동일, 컬러: `$text-secondary`, 탭 영역 최소 44×44

**플로팅 CTA**:

- 현재 isMember 분기: "새 그룹 만들기" + "친구 초대하기" 2개
- 변경 후: **"친구 초대하기"** 1개 (현재 `ctaGroup` 스타일 계승, 링크 복사 동작)
- 그룹 생성 기능은 상단 NewGroupIcon에 이관

**isPreview/isMember 아닌 경우 CTA**: 기존 로직 유지 (참여하기 / 로그인 / 번들 풀기 등)

### BundleRecommendSection 맥락화

**Props 확장**:

```ts
interface BundleRecommendSectionProps {
  currentSlug: string;
  contextName?: string; // 이름만 받음. 타입 구분 없음 (카피 동일)
}
```

**섹션 헤더 카피 분기**:

- `contextName` 없음: `"이런 테스트는 어때요?"` (기존 유지)
- `contextName` 있음: `"{contextName}과(와) 이런 테스트도 해볼래요?"` — 한국어 조사 처리(받침 유무 자동 판정)

**호출부 변경**:

- `FullGroupResultView` (3명+ 그룹): `<BundleRecommendSection currentSlug={...} contextName={result.groupName} />`
- `FullGroupResultView` (2명 그룹, 자동 생성된 기본 groupName `"{creator}의 케미 테스트"` 감지 시): `contextName={otherMember.nickname}` 로 **다른 멤버 닉네임** 전달 — 기본값 그룹명의 어색함 회피
- `MemberDetailSheet` (바텀시트 내 멤버별 상세): `<BundleRecommendSection currentSlug={...} contextName={targetNickname} />`
- `BundleResult.tsx`: `contextName` 전달 없음 (기본 카피 유지)

**조사 처리 유틸**:

```ts
// src/lib/utils.ts 에 추가
export function withParticle(name: string): string {
  // 받침 있는 경우 "과", 없는 경우 "와"
  const lastChar = name.charCodeAt(name.length - 1);
  if (lastChar < 0xac00 || lastChar > 0xd7a3) return `${name}와`;
  const hasJongseong = (lastChar - 0xac00) % 28 !== 0;
  return `${name}${hasJongseong ? '과' : '와'}`;
}
```

### 사용 컴포넌트 (재사용)

| 컴포넌트                                                                                                                                               | 경로                                                                                                   | 변경 여부                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `BundleBackground`                                                                                                                                     | `src/components/features/Bundle/BundleBackground/`                                                     | 그대로                                                                     |
| `CategoryBadge`                                                                                                                                        | `src/components/common/CategoryBadge/`                                                                 | 그대로                                                                     |
| `FloatingCta`                                                                                                                                          | `src/components/common/FloatingCta/`                                                                   | 사용 위치 증가, 스타일 그대로                                              |
| `PreviewRotation`                                                                                                                                      | `src/components/features/Compare/PreviewRotation/`                                                     | 그대로 (대기 화면 재활용)                                                  |
| `BundleRecommendSection`                                                                                                                               | `src/components/common/BundleRecommendSection/`                                                        | **확장** (context prop 추가)                                               |
| `CreateCompareLink`                                                                                                                                    | `src/components/features/Bundle/BundleResult/`                                                         | **리팩터** (그룹 생성 단일 모달)                                           |
| `BundleResult`                                                                                                                                         | `src/components/features/Bundle/BundleResult/`                                                         | **재구성** (히어로 강조 + 답변 접힘 + CTA 단일화)                          |
| `BundleCard`                                                                                                                                           | `src/components/features/Main/BundleCard/`                                                             | **재구성** (카피 교체 — 가치관·단톡방·친구들 키워드)                       |
| `BundleIntro`                                                                                                                                          | `src/components/features/Bundle/BundleIntro/`                                                          | **재구성** (1:1 섹션 제거 + "이렇게 진행돼요" 신설 + "우리의 케미" 라벨)   |
| `CompareLanding`                                                                                                                                       | `src/components/features/Compare/CompareLanding/`                                                      | **삭제** (GroupResult가 InviteView 서브 뷰로 흡수)                         |
| `CompareResult`                                                                                                                                        | `src/components/features/Compare/CompareResult/`                                                       | **용도 변경** (페이지 → `MemberDetailSheet` 바텀시트 내부 콘텐츠로 재활용) |
| `/compare/match/[token]/page.tsx`                                                                                                                      | `src/app/compare/match/[token]/`                                                                       | **삭제** (라우트 deprecated, 리다이렉트만 유지)                            |
| `GroupResult`                                                                                                                                          | `src/components/features/Compare/GroupResult/`                                                         | **CTA 재배치** + fake 제거                                                 |
| `ChemistryNetwork`, `ChemistryRanking`, `PickASide`, `GroupAwards`, `PopularityBarGraph`, `PopularitySpectrum`, `CrossGenderChemistry`, `GenderBattle` | `src/components/features/Compare/GroupResult/` · `src/components/features/Compare/PopularityBarGraph/` | 그대로                                                                     |
| `ChemistryCard`, `AnswerComparison`, `ShockPoint`, `PopularityCompare`                                                                                 | `src/components/features/Compare/CompareResult/`                                                       | 그대로 (멤버별 상세에서 계속 사용)                                         |
| `DisplayNameModal`, `GroupSettingsModal`                                                                                                               | `src/components/features/Compare/`                                                                     | 그대로                                                                     |

### 삭제 컴포넌트·라우트 (24개 파일)

- `GroupResult/FactionMap.tsx`, `.module.scss`
- `GroupResult/GenderBadge.tsx`, `.module.scss`
- `GroupResult/GenerationCluster.tsx`, `.module.scss`
- `GroupResult/GroupStats.tsx`, `.module.scss`
- `GroupResult/HiddenMatch.tsx`, `.module.scss`
- `GroupResult/MemberList.tsx`, `.module.scss`
- `GroupResult/MyRelationCard.tsx`, `.module.scss`
- `GroupResult/RelationExplorer.tsx`, `.module.scss`
- `GroupResult/ValueMap.tsx`, `.module.scss`
- `BundleResult/CreateGroupLink.tsx`, `.module.scss`
- `CompareLanding/CompareLanding.tsx`, `.module.scss`
- `src/app/compare/match/[token]/page.tsx` (라우트 deprecated, 리다이렉트로 대체)
- `src/assets/icon/CompareOneIcon.tsx` (번들 인트로 1:1 섹션 제거로 사용처 없음)

### 신규 컴포넌트

- **GroupResult 하위 서브 뷰 (리팩터 내부 분할)**:
  - `InviteView.tsx` — 비멤버 (로그인/번들 미완료/번들 완료 + 아직 join 안 함 상태 모두 흡수)
  - `WaitingView.tsx` — 멤버 + 참여자 1명 (대기 화면, 봉인 히어로 + 샘플 로테이션)
  - `FullGroupResultView.tsx` — 멤버 + 참여자 2명+ (현재 GroupResult 렌더링 본문)
  - `GroupResult.tsx` 자체는 상태 감지 + 서브 뷰 선택만 담당 (얇은 라우터 역할)
- **MemberDetailSheet (신규)** — 그룹 결과 내 멤버별 1:1 상세 바텀시트. 기존 `CompareResult` 컴포넌트(ChemistryCard + AnswerComparison + ShockPoint + PopularityCompare)를 내부 콘텐츠로 임베드. 하단 플로팅 CTA `"이 케미 결과 공유하기"` 포함
- 필요 아이콘: **NewGroupIcon** (`src/assets/icon/NewGroupIcon.tsx`) — CLAUDE.md "아이콘 사용 규칙"에 따라 신규 생성. 사람 2명 + 플러스 사인 형태 권장. **사이즈는 기존 헤더 아이콘(SettingsIcon/LinkIcon)과 동일**하게 맞춤

### 토큰 사용 내역

- 컬러: `$bg-primary`, `$bg-secondary`, `$bg-tertiary`, `$primary-gradient`, `$attention`, `$white`, `$text-secondary`, `$text-tertiary`, `$error`
- 타이포 사이즈: `text-xs`(12px), `text-sm`(14px), `text-base`(16px), `text-lg`(18px), `text-xl`(20px), `text-2xl`(24px), `text-3xl`(32px)
- 타이포 weight: `font-regular`(400), `font-medium`(500), `font-semibold`(600), `font-bold`(700)
- 간격: `$spacing-1` ~ `$spacing-12`
- Radius: `rounded-sm`(4px), `rounded-md`(8px), `rounded-lg`(12px), `rounded-xl`(24px), `rounded-full`(9999px)
- Shadow: `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-top`
- Transition: `transition-fast`(0.2s ease), `transition-normal`(0.3s ease), `transition-slow`(0.5s)

### 카피 전문

#### 대중성 카피 5개 (초강력 선언형)

| 구간   | 캐릭터        | 카피                                  |
| ------ | ------------- | ------------------------------------- |
| 90%+   | 여론의 사자왕 | **"대세 감지기 그 자체."**            |
| 70-89% | 트렌드 여우   | **"트렌드 여우의 눈."**               |
| 50-69% | 밸런스 판다   | **"어느 편도 아니고 어느 편이기도."** |
| 30-49% | 소신 고양이   | **"남들과는 다른 길."**               |
| ~29%   | 유니콘        | **"세상 유일의 가치관."**             |

#### 주요 CTA 문구

| 위치                                   | 문구                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------- |
| **번들 카드 메타 행**                  | **"가치관 질문 N개 · 약 N분 · M명 참여"**                                             |
| **번들 카드 비교 어필**                | **"단톡방 친구들과 가치관 맞춰보기"**                                                 |
| **번들 인트로 메타 행**                | **"가치관 질문 N개 · 약 N분 · M명 참여"**                                             |
| **번들 인트로 "이렇게 진행돼요" 제목** | **"이렇게 진행돼요"**                                                                 |
| **번들 인트로 단계 ①**                 | **"가치관 질문 N개에 답해요"**                                                        |
| **번들 인트로 단계 ②**                 | **"단톡방 친구들에게 링크를 보내요"**                                                 |
| **번들 인트로 단계 ③**                 | **"친구들이 풀면 그룹 케미가 열려요"**                                                |
| **번들 인트로 그룹 프리뷰 라벨**       | **"우리의 케미"** (기존 "그룹 케미" 대체)                                             |
| 번들 결과 플로팅                       | **"친구들과 비교하기"**                                                               |
| 번들 결과 답변 토글                    | **"내 답변 N개 보기"**                                                                |
| 답변 토글 첫 방문 툴팁                 | **"답변은 여기서 펼쳐볼 수 있어요"**                                                  |
| 비교 대기 플로팅                       | **"친구에게 링크 보내기"**                                                            |
| 비교 대기 복사 토스트                  | **"링크가 복사됐어요. 단톡방·카톡·메시지에 붙여넣으면 친구가 바로 참여할 수 있어요"** |
| 비교 대기 히어로 (제목)                | **"{nickname}님의 케미, 친구가 오면 열려요"**                                         |
| 비교 대기 힌트 (제목 아래)             | **"친구가 링크를 누르면 바로 시작돼요"**                                              |
| 비교 대기 로테이션 라벨                | **"이런 결과가 나올 수 있어요"**                                                      |
| 마이그레이션 고지 배너 (1회)           | **"이 테스트는 이제 다른 친구도 참여할 수 있어요"**                                   |
| 그룹 결과 플로팅                       | **"친구들 초대하기"**                                                                 |
| 그룹 결과 상단 새 그룹 아이콘 툴팁     | **"다른 친구들과 새로 시작"**                                                         |
| 그룹 설정 모달 제목                    | 현재 유지                                                                             |
| BundleRecommendSection 기본            | **"이런 테스트는 어때요?"**                                                           |
| BundleRecommendSection 그룹            | **"{groupName}과 이런 테스트도 해볼래요?"**                                           |
| BundleRecommendSection 친구            | **"{friendName}과 이런 테스트도 해볼래요?"**                                          |
| 로딩 (비교 결과)                       | **"케미를 분석하고 있어요"**                                                          |
| 에러 (공통)                            | **"결과를 불러오지 못했어요. 다시 시도해 주세요"**                                    |
| 링크 복사 토스트                       | **"초대 링크가 복사되었어요"** (현재 유지)                                            |

#### 비교 랜딩 상태별 문구

| 상태                     | 헤드라인                                                    | CTA             |
| ------------------------ | ----------------------------------------------------------- | --------------- |
| needsLogin               | "{creator}님이 케미 테스트를 보냈어요"                      | **"참여하기"**  |
| needsBundle              | "{creator}님이 케미 테스트를 보냈어요 · 먼저 답변해 주세요" | **"참여하기"**  |
| canJoin (완료)           | "답변이 준비됐어요! 결과를 확인해 보세요"                   | **"결과 보기"** |
| canView / isCreatorReady | "케미 결과가 준비됐어요"                                    | **"결과 보기"** |

"대결 수락하기" / "결과 개봉하기" / "아쉽지만 한 발 늦었어요" 카피 삭제. 대결/봉인 은유는 제거.

#### "1:1" 용어 UI 전면 매핑

| 현재                           | 변경 후                       |
| ------------------------------ | ----------------------------- |
| "1:1 케미 테스트"              | **"케미 테스트"**             |
| "1:1 케미 테스트 공유"         | **"케미 테스트 공유"**        |
| "1:1 비교"                     | **"케미 비교"**               |
| "그룹 케미" / "그룹 케미 보기" | 삭제 (그룹 수렴으로 단일화)   |
| "다른 친구랑 케미 보기"        | **"다른 친구들과 케미 보기"** |
| "둘의 케미를 분석하고 있어요"  | **"케미를 분석하고 있어요"**  |
| "가치관 대결 신청"             | **"케미 테스트 초대"**        |
| "대결 수락하기"                | 상태별 대체 (위 표 참조)      |
| "결과 개봉하기"                | **"결과 보기"**               |

**내부 API/테이블의 `ONE_TO_ONE` / `GROUP` 식별자는 그대로 유지** (STEP 3 이후 점진적 정리).

#### 케미/궁합 어휘 사용 규칙 (톤 일관성)

- **제목/타이틀**: "케미" (예: "{nickname}님의 케미, 친구가 오면 열려요")
- **서술/부제**: "궁합" 또는 "통한다" (예: "우리 생각, 얼마나 통하는지 맞춰볼까요?")
- **정량 지표**: "싱크율" (그룹 싱크율, 기존 유지)
- **결과 등급**: "케미" 체계 유지 (SS~X)
- **혼용 금지 조항**: 한 섹션(히어로/바텀시트/결과 카드) 내에서 "케미"와 "궁합"을 **함께** 쓰지 않음. 한 단어로 톤 통일

#### OG / 공유 메시지

| 상태              | 변경 후                                                                 |
| ----------------- | ----------------------------------------------------------------------- |
| 초대 대기 OG 제목 | **"{nickname}님의 케미 테스트 초대 · {bundleTitle}"**                   |
| 초대 대기 OG 부제 | **"우리 케미, 얼마나 통하는지 맞춰볼까요?"**                            |
| 결과 완료 OG 제목 | **"{creator} × {participant}의 케미 · {matchRate}%"**                   |
| 결과 완료 OG 부제 | **"우리 케미 · {chemistry.title}"** ("케미" 1회 포함, 등급 타이틀 병기) |

기존 `⚔️`, `🏆` 등 이모지 제거. 시각 임팩트는 OG 이미지가 담당.

### 상호작용

- **번들 결과 답변 아코디언**: "내 답변 N개 보기" 헤더 탭 → 아래 답변 카드 펼쳐짐. transition: `transition-normal`. 재탭 시 접힘.
- **번들 결과 첫 방문 툴팁**: 페이지 mount 후 0.8s 딜레이 후 말풍선 페이드인. **사용자가 답변 헤더를 1회 탭할 때까지 유지** (자동 페이드아웃 없음). 탭 시 페이드아웃 + localStorage 기록. 여기에 보조로 답변 헤더 자체에 **"▾ 펼치기"** 텍스트 힌트 병기로 툴팁 놓친 사용자 대비.
- **비교 대기 샘플 로테이션**: 기존 `PreviewRotation` 회전 간격 유지 (약 3-4s).
- **그룹 결과 상단 새 그룹 아이콘**: 탭 → `CreateCompareLink` 모달 (전포트럴 + iOS 스크롤 잠금 패턴 유지).
- **플로팅 CTA**: 하단 고정, `$primary-gradient` 배경, 탭 시 scale(0.98) 피드백.

### 라우팅 변경

| 경로                     | 변경 내용                                                                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/compare/[token]`       | **`/compare/group/[token]`로 301 리다이렉트**. Next.js `next.config.js`의 `redirects()` 또는 페이지 내 `redirect()` 중 BE 팀과 조율 |
| `/compare/group/[token]` | **그룹 결과 통합 페이지 (상태별 루트)**. 초대장·대기·결과·멤버별 상세(바텀시트) 모두 흡수                                           |
| `/compare/match/[token]` | **deprecated** — `/compare/group/[token]`로 301 리다이렉트. 페이지 파일(`page.tsx`) 삭제. 멤버별 상세는 바텀시트로 제공             |
| `/bundle/[slug]/result`  | 재구성 (현재 경로 유지)                                                                                                             |
| 기타                     | 변경 없음                                                                                                                           |

### 서버 마이그레이션

**BE 팀 협의 완료 사항**:

1. **일회성 SQL 마이그레이션**

   ```sql
   -- 컬럼 추가 (마이그레이션 이력 추적)
   ALTER TABLE compare_links ADD COLUMN IF NOT EXISTS migrated_from_one_to_one BOOLEAN DEFAULT FALSE;

   -- type 전환 + 이력 기록
   UPDATE compare_links
   SET type = 'GROUP',
       group_name = COALESCE(group_name, creator_nickname || '의 케미 테스트'),
       migrated_from_one_to_one = TRUE
   WHERE type = 'ONE_TO_ONE';
   ```

   - `migrated_from_one_to_one = TRUE` 인 링크는 FE에서 **1회 고지 배너** 노출 조건으로 사용 (생성자가 처음 결과 진입 시 "이 테스트는 이제 다른 친구도 참여할 수 있어요" 표시, localStorage 기록 후 재노출 안 함)

2. **API 응답 정렬**: `GET /api/v1/compare-links/{token}` 응답의 `type` 필드는 모두 `GROUP`으로 통일. `type` 필드 자체는 스키마 유지 (STEP 3 이후 자연 제거).

3. **링크 생성 API**: `POST /api/v1/bundles/{slug}/compare-links` 의 `type` 파라미터 `'ONE_TO_ONE'`는 deprecated. `'GROUP'`만 수용. FE도 `type: 'GROUP'`만 송신하도록 변경.

4. **기존 링크 동작**: 마이그레이션 후 기존 1:1 링크는 2인 그룹으로 작동. 3번째 참여자 진입 시 그룹 확장 동일 로직 적용.

5. **OG 이미지 생성**: `buildCompareOgImageUrl`의 `type` 파라미터 deprecated. 호출부에서 전달 중단. 이미지 템플릿은 기본 GROUP 톤으로 단일화.

## 결정 근거 (Why)

### 그룹 수렴 (방향 D) 채택

1. **단일 결정 원칙 최강 실현** — 선택지 제거가 이론상 가장 단순
2. **뾰족한 칼 전략** — 서비스 초기 단계 자원 집중
3. **코드 베이스 단순화** — 22개 파일·라우트·API 정리
4. **레퍼런스 정합성** — 폴리마켓·Polis·Gas·Slay·Wordle 모두 단일 참여 모드

### CompareLanding 페이지 제거 + GroupResult 상태별 루트 통합

1. **같은 token + 다른 렌더링** — 랜딩·대기·결과 모든 상태가 동일 token 기준으로 결정되므로 페이지 분리가 역사적 구조일 뿐 기능적 필요 없음
2. **상태 로직 중복 제거** — CompareLanding의 6가지 상태 분기와 GroupResult의 멤버십 분기가 중복 → 한 곳에서 관리
3. **URL 단일화로 공유 URL 일관** — 단톡방/카톡 공유 링크가 `/compare/group/[token]` 으로 통일
4. **GroupResult.tsx 복잡도 대응** — 서브 뷰 (`InviteView`/`WaitingView`/`FullGroupResultView`) 분리로 각 파일 책임 명확, 복잡도 분산

### 공유 CTA "친구에게 링크 보내기" 채택 (채널 중립)

1. **STEP 1 실제 동작과 카피 일치** — STEP 1은 URL 복사만 제공. "단톡방"처럼 특정 채널을 지시하면 DM/이메일 사용자에게 혼란
2. **"링크"는 복사-붙여넣기 메커니즘을 암시** — 실제 동작과 연결된 직관
3. **"친구에게"로 초대 대상 명확** — 추상적 "공유"보다 액션 포인트 선명
4. **토스트로 다채널 안내** — "단톡방·카톡·메시지에 붙여넣으면 친구가 바로 참여할 수 있어요"로 채널 자유도 보완
5. **STEP 2 카카오 SDK 도입 시 자연 진화** — CTA를 "카톡으로 공유하기"로 좁히고 네이티브 시트 연결. STEP 1 → STEP 2 전환이 부드러움
6. **힌트 카피로 메커니즘 보완** — "친구가 링크를 누르면 바로 시작돼요"로 링크 동작 원리 자연어 설명

### match URL deprecated + 멤버 상세 바텀시트 전환

1. **URL 단일화 원칙 최강 실현** — 비교 기능 통합의 핵심 명분("/compare/[token]·/compare/group/[token]·/compare/match/[token] 난립 해소")을 match URL 제거로 완결
2. **멤버 상세는 그룹 결과의 일부** — URL 분리 없이 그룹 결과 맥락 안에서 열람되는 게 UX 자연. 바텀시트가 이 관계 시각화
3. **`?from=group` 접근 제어 모순 해소** — 쿼리 기반 가드는 위조 쉽고 URL 재방문 시 모순 (Q3 "URL 재방문 가능" 원칙). match URL 자체 제거로 원천 해결
4. **딥링크 필요성 없음** — 특정 멤버 상세를 외부에 공유하는 시나리오 실무 없음. 공유 단위는 그룹 URL 하나로 충분
5. **코드 보존** — 기존 `CompareResult.tsx` 컴포넌트는 `MemberDetailSheet` 내부 콘텐츠로 재활용. 로직 폐기 아님

### 마이그레이션 고지 배너 도입 (C1)

1. **완전 잠금 없이도 사생활 기대치 완화** — "잠금 처리는 혼란" 원칙은 유지하되, **기존 1:1 계약이었던 링크**가 그룹화되었다는 사실을 **1회 고지**로 투명화
2. **`migrated_from_one_to_one` 플래그를 신호로 활용** — 새 그룹은 고지 없음, 마이그레이션된 그룹만 1회 노출
3. **localStorage 기록으로 재노출 방지** — 첫 진입 시에만 배너. 이후는 일반 그룹 경험과 동일

### 번들 결과 첫 방문 툴팁 — 상호작용 종료형 전환

1. **3초 자동 페이드의 본질적 한계** — 스크롤/앱 전환 중 놓치면 영영 안 뜸. localStorage 기록까지 되면 다른 기회 없음
2. **사용자 탭 종료가 학습 완료 증거** — "사용자가 답변 헤더를 탭했다 = 툴팁 목적 달성". 그 시점에만 기록
3. **보조 힌트 "▾ 펼치기" 병기** — 툴팁 자체를 못 봐도 헤더 텍스트만으로 아코디언 학습 가능

### 번들 카드·인트로 재구성 (유입 직관성 + 그룹 단일화 일관성)

1. **진입점이 주요 기능을 설명해야 유입이 일어남** — 번들 카드와 인트로는 유저 첫 접점. 여기서 "가치관 질문 답하고 단톡방 친구들과 비교"라는 핵심 가치가 3초 안에 전달되어야 함
2. **"가치관 질문"이라는 키워드 명시** — "N개 질문"만으론 성격 테스트로 오해 가능. MBTI 대체재 포지셔닝을 카피 단위에서 강화
3. **"단톡방" 키워드로 유저 멘탈 모델 직접 매핑** — "공유"라는 추상 동사 대신 "단톡방"이라는 구체 채널 지시가 상상을 구체화
4. **그룹 단일화 일관성** — "1:1 비교, 그룹으로 비교 가능" 같이 모드를 설명하는 카피는 스펙의 그룹 수렴 원칙에 직접 배치. "가치관 맞춰보기"로 단순화
5. **"이렇게 진행돼요" 3단계 섹션** — 인트로에서 "5-10개 질문 답하기 → 단톡방 공유 → 친구 답변과 비교" 플로우를 명시적으로 안내. MBTI·성격 테스트와 달리 "그룹 비교"가 핵심임을 첫 화면에서 분명히
6. **숫자 뱃지 방식 (A안) 채택** — 아이콘·일러스트 대비 제작 비용 0에 가깝고, 가장 명료함. STEP 2에서 아이콘/일러스트로 업그레이드 가능한 확장 여지 유지
7. **"그룹 케미" → "우리의 케미"** — "그룹"은 기능 명칭, "우리"는 감정·소속감. 진입점에서는 "우리의 케미"가 더 초대감 있음

### 케미 등급 체계 현행 유지

1. **대중성 지수와의 시각·의미 분리 목적** 으로 알파벳 등급이 설계됨 — 기존 설계 의도 보존
2. **두 %가 공존 시 혼동 우려** 가 실제 근거 있음 (같은 페이지 내 "매치율 %" + "대중성 %")
3. **한글 타이틀 + 등급 배지 + 한줄평** 의 기존 구조는 감성 자산으로 유지 가치 있음
4. **STEP 2 이후 OG 이미지 재디자인 시 재검토** — 알파벳 노출 최소화 방향은 향후 고려 가능. 지금 변경 안 함

### 케미 용어 유지 (싱크 미도입)

- "케미"는 HotPick 기존 브랜드 자산, 사용자 학습 비용 0
- "싱크"는 1:1/그룹 대응성 강하나 신어 전환 비용
- "케미"도 "팀 케미"/"그룹 케미" 구어적 사용 자연스러움
- 정량 지표 "싱크율"은 기존대로 유지 (정량·감성 분리)

### 대중성 카피 초강력 선언형 채택

- 플로팅 CTA가 즉시 아래에 있어 유도 카피는 캐릭터 정체성 선언만으로 충분
- 5-10자 단문이 시각 여백과 임팩트를 동시에 달성
- 호기심 트리거는 CTA 버튼이 담당 (역할 분업)

### 한 번에 전체 배포 (Feature Flag 없음)

- 변경 규모가 크고 1:1/그룹 병존이 사용자 혼란 유발
- 단번 전환이 깔끔. 마이그레이션 후 일관된 경험 제공
- 배포 후 KPI 모니터링으로 대응

### 기존 1:1 링크 완전 전환 (잠금 처리 없음)

- 2명짜리 그룹도 자연스러운 경험 (섹션별 UI가 2명 대응 가능)
- 잠금 처리는 "기존 계약 보호" 취지지만 오히려 혼란
- 단순함이 더 큰 가치

### 포지셔닝 재확인

HotPick은 "과학적 가치관 진단"이 아니라 **"대화 소재를 제공하는 궁합·케미 테스트"**. 결과의 과학적 정확성보다 **재미·공감·소재력**이 신뢰의 본질. 향후 컨텐츠·기능 결정 기준으로 유지.

## 회귀 영향 및 배포 전략

### 회귀 점검 체크리스트

- [ ] `/compare/[token]` 리다이렉트 동작 확인 (단톡방·카톡 캐시 링크)
- [ ] `/compare/match/[token]` 리다이렉트 동작 확인 (북마크·공유 링크)
- [ ] 마이그레이션 후 기존 1:1 링크가 그룹 페이지에서 정상 작동
- [ ] **마이그레이션 고지 배너** — `migrated_from_one_to_one = TRUE` 링크 첫 진입 시 1회 노출, localStorage 기록 후 재노출 안 됨
- [ ] 멤버별 상세 바텀시트 — 그룹 네트워크 멤버 탭 시 오픈/닫기 정상
- [ ] 2인 그룹 결과 페이지 UI 가독성 (`ChemistryNetwork` 2명 케이스)
- [ ] `GroupAwards` 2명일 때 의미 약한 어워드 처리 (3명+ 활성화 확인)
- [ ] 번들 결과 첫 방문 툴팁 — 사용자 탭 시까지 유지, 기본 힌트 "▾ 펼치기" 노출 확인
- [ ] 비멤버 자동 join 플로우 각 상태(needsLogin/needsBundle/canJoin) 전이 정상
- [ ] BundleRecommendSection 조사 처리(`과/와`) — 받침 유무별 확인
- [ ] 번들 카드 메인 피드 내 렌더링 — 카피 "단톡방 친구들과 가치관 맞춰보기" 표시 확인
- [ ] 번들 카드 "1:1 비교/그룹으로 비교" 문구 완전 제거 확인
- [ ] 번들 인트로 "이렇게 진행돼요" 섹션 3단계 숫자 뱃지 렌더링 확인
- [ ] 번들 인트로 "1:1 케미" 섹션·`CompareOneIcon` 사용처 완전 제거 확인
- [ ] 번들 카드 클릭률·번들 인트로 진입 후 시작 전환율 GA4 이벤트 정상 기록
- [ ] OG 이미지 카톡 캐시 갱신 (카카오 디벨로퍼스 캐시 갱신 요청)
- [ ] 죽은 코드 삭제 후 빌드 무에러
- [ ] 타입 체크 무에러
- [ ] 기존 PR/Storybook/테스트 코드에서 삭제 컴포넌트 참조 없음 재확인

### 배포 후 1주 KPI 모니터링

기존 대비 변화 관찰 지표 (GA4 이벤트 기반):

- **비교 링크 생성율** (번들 결과 → 링크 생성): 목표 +20%p
- **공유 완료율** (링크 생성 → 외부 복사/공유 액션): 목표 +15%p
- **번들 완료율** (번들 인트로 → 결과 도달): 목표 유지 또는 상승
- **그룹 참여자 중위수**: 목표 2명 → 3명+
- **번들 결과 이탈율**: 답변 접힘 도입으로 초기 상승 가능. 1주 후 정상화 기대
- **에러 발생율**: 라우트 리다이렉트 관련 오류 0 수렴
- **자동 join 실패율** (canJoin → join 성공/실방): 5% 미만 유지
- **마이그레이션 배너 dismiss율**: 배너 노출 후 곧바로 뒤로가기 비율 — 10% 초과 시 카피/UX 재검토
- **번들 카드 → 인트로 전환율**: 카드 노출 대비 클릭. 카피 변경 효과 측정
- **번들 인트로 → 번들 시작 전환율**: 인트로 노출 대비 "시작하기" 클릭. "이렇게 진행돼요" 섹션이 이탈 방어 역할 하는지 관찰

**케미 등급 이해도 프록시 지표 (등급 현행 유지 결정의 검증용)**:

- **결과 페이지 스크롤 완료율** — ChemistryCard ~ BundleRecommendSection 전체 스크롤 비율
- **등급 영역 체류 시간** — ChemistryCard 스크롤 진입 후 이탈까지의 중위 시간
- **멤버별 상세 바텀시트 오픈율** — 그룹 네트워크에서 멤버 탭 전환율. 낮으면 등급 해석 난이도 의심 신호

**재검토 트리거 조건 (STEP 2 시점)**:

- 위 프록시 지표 중 2개 이상 기준치 미달 시 케미 등급 UI 재설계 검토
- 사용자 피드백 "등급 알기 어렵다" 재수집 여부 점검

### 롤백 플랜

- 클라이언트: 이전 커밋 revert + 재배포
- 서버: 마이그레이션 SQL은 역방향 스크립트 사전 준비 — **`migrated_from_one_to_one` 플래그 기준으로 엄격 분리**
  ```sql
  -- 역방향: 마이그레이션 플래그가 TRUE인 행만 되돌림. 신규 그룹 데이터는 절대 건드리지 않음
  UPDATE compare_links
  SET type = 'ONE_TO_ONE',
      group_name = NULL,
      migrated_from_one_to_one = FALSE
  WHERE migrated_from_one_to_one = TRUE;
  ```
  (이전 버전처럼 `group_name LIKE '%의 케미 테스트'` 로 긁는 위험 방식 회피)

## 향후 확장 (옵션)

- **STEP 2**: 카카오 SDK 연동 + OG 이미지 템플릿 재디자인 + 바이럴 유도 UX 강화 (α 동선 최대화)
- **STEP 3**: 마이페이지 비교 관리 페이지 + 질문 퀄리티 자동 플래그 (답변 분포 90:10 기반) + 인구통계 고도화
- **(장기)** 1:1·그룹 결과 UI 섹션 구조 통합 (현재 스펙은 라우트·모델 수준 통합만, UI 섹션은 단일 레이아웃 유지)
- **(장기)** 친구 연결 연계 (BeReal/Partiful 스타일 카카오 친구 API)
- **(전역)** 오프라인 대응 전반 도입

## 스펙 범위 외 관련 작업 (추적)

- `docs/specs/bundle-compare.md` 섹션 5.4, 10.3의 **가치관 지도 (4분면)** 내용 제거 — 기획서 정리 필요 (별도 작업)
- 기획서 4.6 **"내 번들/비교 관리"** 재설계 — STEP 3

## 참고

- 스타일 레퍼런스: [2026-04-15-bundle-recommend-section-design.md](./2026-04-15-bundle-recommend-section-design.md)
- 선행 스펙: [2026-04-06-compare-preview-mode-design.md](./2026-04-06-compare-preview-mode-design.md), [2026-04-13-compare-match-access-control-design.md](./2026-04-13-compare-match-access-control-design.md)
- 디자인 토큰: `docs/design-system/tokens.md`
- 다크모드 규칙: `CLAUDE.md` 디자인 시스템 섹션
- 외부 레퍼런스: `.claude/skills/hp-designer/references/design-inspirations.md`
- 상위 기획서: `docs/specs/bundle-compare.md`
- hp-designer 드라이브런 기록: `docs/superpowers/specs/2026-04-17-hp-designer-agent-design.md` (이 스펙은 결의 드라이브런 첫 산출물)
