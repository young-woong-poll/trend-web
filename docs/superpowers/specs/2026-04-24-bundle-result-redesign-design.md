# 번들 비교 결과 페이지 재설계 — MyResultView

비교에 참여한 유저가 "나는 여기서 어떤 사람인지"를 한눈에 파악하고 그 결과를 단톡방에 공유하도록 하는 결과 페이지 신규 구성안. 첫 번들(연애 가치관) 실험에서 바이럴 신호 0이 관찰된 이후, Phase 1 트랙 A의 A1 과업.

관련 문서:

- 전략 문서: [docs/strategy/2026-04-22-bundle-phase1.md](../../strategy/2026-04-22-bundle-phase1.md)
- 첫 번들 인터뷰: [docs/feedback/260422.md](../../feedback/260422.md)
- 이전 스펙(그룹 수렴 결정): [2026-04-19-bundle-compare-flow-simplification-design.md](2026-04-19-bundle-compare-flow-simplification-design.md)

## 배경

첫 번들(연애 가치관) 배포에서 참여율 55%를 기록했지만 단톡방 반응·2차 공유가 0건이었다. 4명 인터뷰에서 다음 3개 원인이 일관되게 도출됐다.

1. **정보 위계 역전** — "그룹 매칭 그래프"가 맨 위에 있어 "내 결과"가 눈에 들어오지 않음. 여자친구 인터뷰 핵심 인용: "사람들은 생각보다 남에 대해 관심 없다. 나에 대한 정보가 메인이어야 한다." MBTI가 "나 INFP래"로 바이럴된 원리와 동일.
2. **결과 자극 부족** — 결과 카드를 캡처해 단톡방에 던질 만한 "선언형 콘텐츠"가 없음. 염훈 인터뷰: "시그니처 컬러가 화려해서 오히려 복잡해 보인다."
3. **매칭 로직 신뢰도** — "같은 답 = 궁합" 단일 모델이 어색. 이 과업은 BE 트랙 B1에서 매칭 태깅(`matchType: 'same' | 'different'`)으로 해결 중. 본 스펙은 매칭 태깅 도입을 전제로 설계하되, 태깅 전에도 동작하도록 설계한다.

현재 `FullGroupResultView`는 기존 사용자 링크를 위해 보존하되, 신규 링크 및 향후 번들은 **`MyResultView`** 라는 신규 컴포넌트로 렌더링한다.

## 레퍼런스 & 영감

### 앤디 위어 "프로젝트 헤일메리"의 우주 항해 은유

- 출처: 유행 소설 (영화화 진행 중). 독자·대중에게 "혼자 우주에서 관계를 찾는다"는 은유가 높은 인지도.
- 해당 패턴: 궤도·거리·탐험을 통해 관계의 친밀도를 시각화.
- HotPick 맞춤 이유: "내 주변 사람과 얼마나 가까운가"를 물리적 거리(궤도)로 직관 표현. 가치관 비교의 추상성을 공간 메타포로 구체화.

### Polis (pol.is)의 그룹 의견 클러스터링

- 출처: [design-inspirations.md#polis](../../../.claude/skills/hp-designer/references/design-inspirations.md)
- 해당 패턴: 그룹 의견을 2D 좌표에 클러스터로 배치.
- HotPick 맞춤 이유: "나의 위치"를 2D 상대 좌표로 표현. 단 Polis가 "의견 축"을 사용하는 반면 본 스펙은 "나와의 거리(케미율)"를 반지름으로 치환.

### MBTI·사주의 단일 선언 바이럴 구조

- 해당 패턴: "나는 ○○이다"라는 1문장 라벨 + 캐릭터 이미지 → 캡처·공유 친화.
- HotPick 맞춤 이유: Layer 1에 "OO님은 이 비교에서 **트러블 메이커**예요" 선언형 카피로 MBTI식 자기 정체성 포지셔닝.

### Wordle 결과 공유

- 출처: [design-inspirations.md#wordle](../../../.claude/skills/hp-designer/references/design-inspirations.md)
- 해당 패턴: 스포 없는 미니멀 카드 → 복사·붙여넣기로 단톡방에 투하.
- HotPick 맞춤 이유: 공유 카드는 "내 훈장 + 좌표 조감도 + 싱크로율" 3요소로 압축, 1장 이미지 다운로드 제공.

## 방향성 결정 (Step 0)

Layer 1 "나"의 조립 방식 결정. Mock 3종 비교 후 결합안으로 수렴.

| 방향                              | 설명                                                                | 장점                                                        | 단점                                    | 선택      |
| --------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------- | --------- |
| (a) 나의 훈장 — 어워드 재해석형   | 기존 6종 어워드 중 내 수상만 모아 훈장 카드 3단                     | MBTI 바이럴 원리 정면 차용, 기존 이미지 자산 재활용         | 수상 0건 유저의 공백                    | 부분 채택 |
| (b) 나의 좌표 — 네트워크 재해석형 | 나 중심 미니 네트워크 + 소수답 Top 3                                | 관계·답변 어떤 유저도 보유, "프로필 클릭" 학습 문제 해결    | 기존 ChemistryNetwork와 역할 중복       | 부분 채택 |
| (c) 나의 한 줄 — 통합 선언형      | 한 줄 선언 + 수치 3개를 Hero Card 하나로                            | 캡처 1장 완결, 공유 최적                                    | 라벨 생성 로직 품질에 전적 의존         | 탈락      |
| **(a)+(b) 결합 + 헤일메리 궤도**  | 훈장 3단 + canvas 3겹 궤도(드래그/줌/탭 interactive) + 소수답 Top 3 | 자기 정체성 + 관계 탐험 둘 다 제공, 우주 은유로 시각 차별화 | Canvas 구현 공수, 캡처는 별도 카드 필요 | **채택**  |

**최종 선택**: (a)+(b) 결합안 + 헤일메리 풀스택 궤도.

**Mock 사용 여부**: 예. `.tmp/design-mocks/2026-04-24-bundle-result-layer1/` 참조.

- `option-a.html` / `option-b.html` / `option-c.html` — 원안 3종
- `option-ab.html` — 결합 후보 (궤도 스케일 대응 3패턴 비교)
- `option-orbit-1.html` — 헤일메리 풀스택 (최종 채택)
- `option-orbit-2.html` — 미니멀 궤도 (탈락)

드래그 줌 피벗은 "화면 중심" 기준으로 수정 완료(`zoomAtScreenCenter`).

## UX 체크포인트 통과 기록

- **Q1. 유저 목표 한 문장**: 나는 이 비교에서 어떤 사람인지 한 번에 파악하고, 그 결과를 단톡방에 공유한다.
  - 추후 확장: OG 태그 커스텀까지.

- **Q2. 상태 정의**:
  - 엠프티:
    - 참여자 1명(나 혼자): 기존 `LockedSectionPreview` 재활용. 훈장/궤도/소수답 3종 모두 잠김 프리뷰. CTA "친구들 초대하기". 궤도 sketch 타입 추가 필요(`orbit-map`).
    - 참여자 2명: 별도 기획 없이 일반 플로우 동일 적용. 2명만 있어도 궤도 3겹은 유지(겹은 공허해도 서사 일관성).
    - 수상 없는 유저: 훈장 3단 중 1단은 **성향 라벨(폴백)** 이 항상 채움. 엠프티 슬롯 미발생.
  - 실패/에러:
    - API 실패: `NotFoundView` 재활용("결과를 불러오지 못했어요" + 재시도).
    - 궤도 canvas 렌더 실패(저사양 디바이스): **정적 fallback 이미지** 렌더. 캡처·공유는 계속 가능.
  - 로딩:
    - 기존 orbit 애니메이션 로딩 유지("그룹 비교를 분석하고 있어요").
    - 데이터 도착 → 훈장 카드 fade-in → 0.3초 후 궤도 별 펼쳐짐(감각적 진입감).
  - 오프라인: HotPick 전반 미대응, 본 스펙에서도 이월.

- **Q3. 대안 경로**:
  - 뒤로가기·메인 이동 자유 보장. `SmartBackButton` 유지.
  - 궤도 인터랙션을 안 해도 결과 해석 가능(훈장 + 소수답만으로도 "나"가 읽힘). 궤도는 추가 탐색 레이어.
  - 캡처 어려운 유저용 "결과 캡처" 버튼 별도 제공 — canvas 스냅샷 + 훈장을 1장 이미지로 다운로드.
  - **비멤버(미참여자) 진입 시**: "나" 관점 컴포넌트 전체 잠김. 희미한 실루엣 + 잠금 오버레이. CTA "나도 참여하기". 궤도에서 "나" 자리도 비어 있는 실루엣.

- **Q4. 카피 원칙**:
  - **"그룹" 단어 전면 제거** — 2~3명 소수 비교에서도 자연스러운 톤.
  - 대체 표현: 명시적 대체어 추가 없이 그냥 뺀다. "이 비교의 트러블 메이커" 같이 수식어 추가도 지양 — 그냥 "트러블 메이커".
  - "싱크로율"은 기존 용어 유지.
  - "1/10명만 이 답을 골랐어요" 같은 강조 숫자는 유지.
  - 섹션 타이틀은 "나의 위치"로 통일(기존 "그룹에서 나의 위치"에서 축약).
  - 톤: 기존 존댓말.

- **Q5. 회귀 영향**:
  - **기존 `FullGroupResultView` 보존** — 라우트 전환으로 신규 `MyResultView`가 대체. 기존 컴포넌트는 코드상 존재(미사용), 향후 다른 기획에서 재활용 가능.
  - **기존 사용자 고려 불필요** — Phase 1 기준 기존 링크 유저 수가 작음. 회귀 리스크 낮음.
  - 제거 대상(MyResultView 내부에서 사용 안 함): `ChemistryNetwork`, `ChemistryRanking`, `PopularityBarGraph`, `PopularitySpectrum`.
  - 유지(MyResultView에서 재사용): `LockedSectionPreview`(엠프티), `PickASide`(Layer 2), `GroupAwards`(Layer 2, 나 중심 재구성), `CrossGenderChemistry`·`GenderBattle`(Layer 2 토글 ON 시), `BundleRecommendSection`(Layer 3 이후).
  - 새 계산 로직: 소수답 Top 3 추출, 성향 라벨 폴백 매핑.

## UI 디자인

### 레이아웃 (위→아래)

```
[Hero]
  그룹명 · 번들 메타 · Stats(참여·질문·싱크로율)

[Layer 1 — 나]
  Section Label "MY RESULT"
  선언 타이틀: "OOO님은 [하이라이트]○○[/하이라이트]예요"
  서브카피 (한 줄)

  [나의 훈장] — 카드 3단
    (1) TOP 수상 (그라디언트 보더, primary)
    (2) 케미 파트너 (SOUL_CONNECTION 또는 POLAR_OPPOSITES 중 내가 소속된 쌍)
    (3) 성향 라벨 (폴백, 항상 노출)

  [나의 위치] — canvas 궤도 (540px 높이)
    중앙 "나" 항해자 오브
    위성 (100% 매칭): INNER 안쪽 0.6배 거리
    ORBIT 1 · INNER (80–99%)
    ORBIT 2 · MID (40–79%)
    ORBIT 3 · OUTER (1–39%)
    소행성 (0%): OUTER 바깥 1.5배 거리
    HUD: "VOYAGER 1 / <내 닉네임>", "GROUP N=N / SYNC NN%"
    인터랙션: 드래그 팬, 핀치/휠 줌(화면 중심 피벗), 탭 → 멤버 디테일 패널

  [혼자만 다르게 고른 답 TOP 3]
    질문 문장 + 내 답 뱃지 + "N/N명만 이 답을 골랐어요"

  [공유 버튼 2개]
    "결과 캡처" — 공유 카드 이미지 다운로드
    "공유하기" — Web Share API (폴백: 링크 복사)

[Layer 2 — 나머지 지표]
  그룹 어워드 (기존 GroupAwards 재사용, 나 외 수상자 중심 재구성)
  투표 현황 (PickASide)
  CrossGenderChemistry · GenderBattle (이성 콘텐츠 토글 ON일 때만)

[Layer 3 — 펼침]
  "모든 멤버 결과 자세히 보기" 트리거
  펼치면: 전체 매칭 표 (기존 방식 재활용 가능)

[BundleRecommendSection]
  기존 섹션 그대로

[FloatingCta]
  멤버: "친구들 초대하기"
  비멤버: "나도 참여하기"
```

### 궤도 배치 규칙 (핵심)

| 매칭률 | 위치                 | 크기                    | 컬러                | 빈도 |
| ------ | -------------------- | ----------------------- | ------------------- | ---- |
| 100%   | 위성 (INNER × 0.6)   | 작은 흰 원 + 펄스       | WHITE · 글로우 PINK | 희소 |
| 80–99% | ORBIT 1 · INNER      | 큰 행성 (r=20)          | PINK/MAGENTA 계열   | 자주 |
| 60–79% | ORBIT 1 · INNER      | 큰 행성                 | GREEN/BLUE 계열     | 자주 |
| 40–59% | ORBIT 2 · MID        | 중간 행성 (r=17)        | YELLOW/WHITE        | 자주 |
| 20–39% | ORBIT 3 · OUTER      | 작은 행성 (r=15)        | ORANGE              | 가끔 |
| 1–19%  | ORBIT 3 · OUTER      | 작은 행성               | RED                 | 가끔 |
| 0%     | 소행성 (OUTER × 1.5) | 불규칙 점 + dashed 궤적 | RED                 | 희소 |

티어 판정은 기존 `getChemistryByRate()`(src/constants/bundle.ts:85) 재사용. 위성/소행성은 100/0 극단만 발동 — 희소성이 서사 강도 결정.

### 훈장 계층 구조

1. **TOP 수상 (primary, 그라디언트 보더)**
   - 내가 1위로 수상한 어워드 6종 중 any.
   - 부재 시: "최다 소수 의견" / "최다 다수 의견" / "극단 답변" 중 해당 있는 것으로 대체 생성.
2. **케미 파트너**
   - SOUL_CONNECTION(최고 케미) 또는 POLAR_OPPOSITES(최저 케미) 중 내가 쌍으로 포함된 어워드.
   - 2명 이상이면 SOUL_CONNECTION은 항상 존재 → 항상 채워짐.
3. **성향 라벨 (폴백)**
   - 답변 패턴으로 자동 생성되는 라벨. 매칭 태깅(same/different)을 활용해 답변 성향을 분류.
   - 연애 번들 예: "자유로운 탐험가" / "균형잡힌 현실주의자" / "안정 추구형" / "감정 표현형" 등.
   - 라벨 마스터 리스트는 **번들별 하드코딩**. 별도 상수 파일: `src/constants/bundle-persona-labels.ts`.
   - 향후 확장: BE에서 질문별 성향 태깅 → 집계 API로 전환.

### 사용 컴포넌트 (재사용)

| 컴포넌트                                | 경로                                                | 변경 여부                                     |
| --------------------------------------- | --------------------------------------------------- | --------------------------------------------- |
| `SmartBackButton`                       | src/components/common/SmartBackButton               | 그대로                                        |
| `CategoryBadge`                         | src/components/common/CategoryBadge                 | 그대로                                        |
| `FloatingCta`                           | src/components/common/FloatingCta                   | 그대로                                        |
| `BundleBackground`                      | src/components/features/Bundle/BundleBackground     | 그대로                                        |
| `LockedSectionPreview`                  | src/components/features/Compare/GroupResult         | sketchType에 `orbit-map` 추가                 |
| `DisplayNameModal`                      | src/components/features/Compare/DisplayNameModal    | 그대로                                        |
| `GroupSettingsModal`                    | src/components/features/Compare/GroupSettingsModal  | 그대로                                        |
| `MemberDetailSheet`                     | src/components/features/Compare/CompareResult       | 그대로(궤도 노드 탭 → 시트 열기)              |
| `CreateCompareLink`                     | src/components/features/Bundle/BundleResult         | 그대로                                        |
| `MyCompareLinksSheet`                   | src/components/features/Compare/MyCompareLinksSheet | 그대로                                        |
| `PickASide`                             | src/components/features/Compare/GroupResult         | 그대로(Layer 2)                               |
| `GroupAwards`                           | src/components/features/Compare/GroupResult         | `VISIBLE_AWARDS` 확장 + "나 수상분 제외" 필터 |
| `CrossGenderChemistry` · `GenderBattle` | src/components/features/Compare/GroupResult         | 그대로(Layer 2 토글 ON)                       |
| `BundleRecommendSection`                | src/components/common/BundleRecommendSection        | 그대로                                        |
| `Toast`                                 | src/components/common/Toast                         | 그대로                                        |

### 신규 컴포넌트

**`MyResultView`** (최상위)

- 경로: `src/components/features/Compare/MyResultView/MyResultView.tsx`
- 스타일: `MyResultView.module.scss`
- 역할: 현재 `FullGroupResultView`의 역할을 대체. 동일한 데이터 훅(`useGroupCompareResult`, `useCompareLink`, `useJoinCompareLink`, `useUpdateGroupSettings`, `useUpdateMyGroupProfile`) 그대로 사용.
- 라우팅: `GroupResult.tsx`에서 `FullGroupResultView` 대신 `MyResultView`를 렌더.

**`MyMedalSection`** (훈장 3단)

- 경로: `src/components/features/Compare/MyResultView/MyMedalSection.tsx`
- props: `{ awards, currentUserId, personaLabel, topShowcaseFallback }`
- 구조: 선언 타이틀 + 카드 3단 (primary 포함 1개, 일반 2개).
- 훈장 우선순위 로직: `getMyMedals(awards, currentUserId, result)` 유틸을 constants에 추가.

**`OrbitMap`** (canvas 궤도)

- 경로: `src/components/features/Compare/MyResultView/OrbitMap/OrbitMap.tsx`
- 스타일: `OrbitMap.module.scss`
- props:
  ```ts
  interface OrbitMapProps {
    members: Array<{
      userId: string;
      nickname: string;
      matchRate: number;
      profileColor?: string;
    }>;
    currentUserId: string;
    isMember: boolean; // 비멤버면 "나" 자리를 실루엣 처리
    onMemberTap?: (userId: string) => void;
  }
  ```
- 내부 구현:
  - Canvas 2D API.
  - DPR 보정, `requestAnimationFrame` 루프.
  - 별 parallax 레이어, 궤도 3겹, 멤버 노드, 중앙 "나" 오브.
  - 카메라 `cam = { x, y, scale }` 상태, 드래그 팬, 핀치 줌, 휠 줌, 화면 중심 피벗(`zoomAtScreenCenter`).
  - 탭 히트 테스트 → `onMemberTap(userId)` 호출.
  - Fallback: `<noscript>` 또는 feature detection 실패 시 궤도 대신 정적 이미지.
- 성능 목표: iPhone 12 Pro 기준 60fps (노드 ≤ 30명, 별 220개).

**`MyExtremeAnswersSection`** (소수답 Top 3)

- 경로: `src/components/features/Compare/MyResultView/MyExtremeAnswersSection.tsx`
- props: `{ result, currentUserId }`
- 구조: 타이틀 + 3개 아이템 (질문 + 내 답 뱃지 + "N/N명만" 캡션).
- 계산: `questionStats` 기반, 내가 답한 옵션 중 그룹 내 최소 비율 Top 3 추출.

**`ShareCardCanvas`** (공유 카드 이미지 생성)

- 경로: `src/components/features/Compare/MyResultView/ShareCardCanvas.tsx`
- 역할: "결과 캡처" 버튼 클릭 시 off-screen canvas로 1024×1792 이미지 렌더 → PNG 다운로드.
- 구조: 훈장 1등(TOP 수상) + 궤도 조감도 + 싱크로율 + HotPick 워터마크.
- 향후 확장: 서버 OG 이미지 라우트와 동일 구도 — `/api/og/compare` 재사용 검토.

### 토큰 사용 내역

- 컬러
  - 배경: `$bg-primary` (#121212), `$bg-secondary` (#1e1e1e), `$bg-tertiary` (#2c2c2c)
  - 텍스트: `$white`, `$text-secondary`, `$text-tertiary`
  - 강조: `$attention` (#dfff00), `$primary-gradient`
  - 궤도 — canvas 내부에서만 사용되므로 SCSS 변수 추출 불필요. 하드코딩 값은 `OrbitMap.tsx` 내부 상수로 고정:
    - INNER 라인: `rgba(255,0,255,0.35)`
    - MID 라인: `rgba(255,255,255,0.14)`
    - OUTER 라인: `rgba(239,68,68,0.25)`
    - 위성 글로우: `rgba(255,110,199,0.6)`
    - 소행성: `rgba(239,68,68,0.25)`
- 타이포
  - 선언 타이틀: `$font-size-20` bold
  - 훈장 타이틀: `$font-size-14` bold
  - 궤도 캡션: 12px
  - Section label: 11px, `$attention`, letter-spacing 0.5px
- 간격: `$spacing-4`, `$spacing-8`, `$spacing-16`, `$spacing-24`
- Radius: `$border-radius-md` (8px), `$border-radius-lg` (12px), `$border-rounded`
- Shadow: `0 10px 30px rgba(255, 69, 0, 0.35)` (Floating CTA, 기존 감각 유지)

### 상호작용

**궤도 (OrbitMap)**

| 제스처               | 응답                                                                         |
| -------------------- | ---------------------------------------------------------------------------- |
| 단일 포인터 드래그   | 카메라 팬 (`cam.x/y` 증가)                                                   |
| 두 손가락 핀치       | 화면 중심 기준 줌 (0.5 ~ 2.5x 클램프)                                        |
| 마우스 휠            | 화면 중심 기준 줌                                                            |
| 노드 탭              | 해당 멤버 `MemberDetailSheet` 열기 (기존 재사용)                             |
| `+` / `−` / `↻` 버튼 | 줌 인/아웃/리셋                                                              |
| 첫 방문 hint         | "드래그해서 외곽 궤도까지 탐험해 보세요" 문구, 2번째부터 localStorage로 숨김 |

**훈장 카드** — 탭 시 해당 어워드 설명 팝업(기존 `GroupAwards`와 동일 패턴 이식 가능).

**결과 캡처 버튼** — `ShareCardCanvas`로 이미지 생성 → 모바일 Web Share API 우선, 실패 시 다운로드 폴백.

**비멤버 모드** — 궤도 중앙 "나" 자리는 희미한 실루엣 + "여기에 당신이 들어올 수 있어요" 툴팁. 훈장 3카드는 잠금 오버레이(`LockedSectionPreview`와 동일 스타일). 소수답 Top 3도 잠금.

## 결정 근거 (Why)

- **기존 컴포넌트를 제거하지 않고 보존**: 결정은 사용자 지침. 다른 기획(친구 평가형 등)에서 재활용 가능성 확보.
- **궤도를 canvas로 구현**: SVG로도 가능하나 노드 30개 + 별 220개 + 드래그/줌 인터랙션 동시 처리 시 canvas가 렌더 성능 유리. 또한 공유 카드 이미지 생성 시 같은 canvas 그리기 로직 재사용 가능.
- **100% = 위성 / 0% = 소행성 (희소 발동)**: 90%+/10% 미만으로 넓히면 발생 빈도가 높아 희소성 약화. 서사 강도(= 공유 소재 가치) 우선.
- **"그룹" 단어 제거**: 2~3명 소수 비교에서도 "그룹"이라는 단어가 어색. 대체어 추가 없이 그냥 뺌(수식어 추가 지양).
- **비멤버 "나" 잠금**: "나도 참여하기" 동기 유지 + "이 결과에서 뭐가 기대되는지" 프리뷰. 기존 `LockedSectionPreview`와 동일 철학.

## 향후 확장 (옵션)

- **OG 태그 커스텀**: `/api/og/compare`가 현재 그룹 결과 기준으로 이미지를 생성 중. Phase 2에서 "내가 받은 TOP 훈장"을 OG 이미지에 렌더 → 링크 미리보기 자체가 바이럴 자산.
- **성향 라벨의 BE 태깅 전환**: 현재 FE 하드코딩 라벨 마스터. 번들 라인업 확장 시 BE 질문 태깅 API로 전환.
- **궤도의 "다른 사람 중심" 전환**: 궤도 노드 탭 시 `MemberDetailSheet` 열림 대신, "이 사람 중심으로 궤도 재구성"으로 확장. 여자친구 피드백("프로필 누르면 그 사람 기준으로 매칭 보인다") 완성형.
- **테토/에겐 번들(A2)**: 2축 스펙트럼 형식이라 궤도와 다른 표현이 필요할 수 있음. A2 스펙에서 본 페이지 구조를 재활용할지, 별도 구성할지 후속 결정.
- **공유 카드 자동 영상화**: 우주 테마 짧은 영상(2초 Zoom-in)으로 저장 — 인스타 릴스·쇼츠 포맷.

## 실행 순서 (FE 관점 참고)

본 스펙 실행의 권장 순서. 상세 PR 분할은 FE(웅일)가 결정.

1. `MyResultView` 골격 + 라우팅 스위치 (`GroupResult.tsx`에서 분기).
2. `MyMedalSection` — 훈장 로직 + 카피 + 카드 3단.
3. `OrbitMap` — canvas 기본 렌더(별·궤도·노드).
4. `OrbitMap` — 인터랙션(드래그/줌/탭).
5. `MyExtremeAnswersSection`.
6. `ShareCardCanvas` + 공유 버튼 연결.
7. 비멤버 잠금 상태.
8. `LockedSectionPreview`에 `orbit-map` sketch 추가 + 참여자 1명 케이스.
9. 성향 라벨 마스터 리스트(연애 번들 하드코딩).
10. QA + hp-ux-reviewer 셀프리뷰.

## 변경 이력

- 2026-04-24: 초안 작성. 방향 Mock 비교 후 결합안(A+B 결합 + 헤일메리 궤도) 확정.
