# OG 이미지 B 에셋 제작 스펙

OG 이미지 프로토타입의 placeholder 영역을 실제 SVG/PNG로 교체하기 위한 제작 명세.

프리뷰: `/dev/og-preview`

---

## 파일 위치 규칙

- 저장 경로: `public/og/`
- 포맷: SVG 우선, 복잡한 일러스트는 PNG (2x retina, 투명 배경 권장)
- 네이밍: `og-{스코프}-{식별자}.{svg|png}` (예: `og-grade-s.svg`, `og-category-love.svg`)

---

## 우선순위 1: MATCH 카드용 등급 엠블럼 (7종)

**목적**: MATCH OG의 주인공. 결과 공유 시 핵심 임팩트 요소.

| 파일명            | 등급 | 사용처                | 제안 모티프         |
| ----------------- | ---- | --------------------- | ------------------- |
| `og-grade-ss.svg` | SS   | "도플갱어"            | 왕관 + 아우라/광선  |
| `og-grade-s.svg`  | S    | "말 안 해도 통하는"   | 골드 별 메달        |
| `og-grade-a.svg`  | A    | "꽤 잘 맞는"          | 실버 트로피         |
| `og-grade-b.svg`  | B    | "같을 때도 다를 때도" | 양면 하트/균형 저울 |
| `og-grade-c.svg`  | C    | "각자의 세계"         | 퍼즐 조각 2개       |
| `og-grade-d.svg`  | D    | "정반대의 가치관"     | 반전 화살표         |
| `og-grade-x.svg`  | X    | "완벽한 반대"         | 거울 반사 · 양극    |

**스펙**

- 크기: **400×400px** (viewBox="0 0 400 400")
- 색상: 흰색 버전 + 컬러 버전 2개 (Match V1은 풀 등급 배경에 흰색 엠블럼, Match V2는 흰 배경에 컬러 엠블럼)
- 주의: Satori는 SVG filter/mask 일부 미지원 → **filter·feGaussianBlur·mask 요소 사용 금지**. 단순 path + linearGradient·radialGradient만.
- 예: `og-grade-s-white.svg`, `og-grade-s-color.svg`

---

## 우선순위 2: VS 엠블럼 (ONE_TO_ONE PENDING)

**목적**: 신청 링크의 핵심 비주얼. 긴장감/도발 요소.

| 파일명            | 사용처                     | 제안 모티프                                                  |
| ----------------- | -------------------------- | ------------------------------------------------------------ |
| `og-vs-gold.svg`  | Pending V1 "Boxing Poster" | 골드 그라데이션 VS 엠블럼 (권투 포스터 스타일, 광선 효과 OK) |
| `og-vs-white.svg` | Pending V2 "Duel Card"     | 흰색 VS (심플, 두꺼운 세리프)                                |

**스펙**

- 크기: **400×400px** (V1용), **320×320px** (V2용) — 하나의 SVG에서 viewBox로 대응 가능
- 색상 버전별 파일 분리 권장 (위 목록대로)

---

## 우선순위 3: 카테고리 심볼 (10종)

**목적**: Bundle 카드 및 일부 Compare 카드에서 카테고리 아이덴티티 표현. 현재 코드상 `[연애 심볼 이미지]` 형태로 placeholder.

| 파일명                     | 카테고리         | 제안 모티프                       |
| -------------------------- | ---------------- | --------------------------------- |
| `og-category-love.svg`     | LOVE (연애)      | 손잡은 두 사람 실루엣 / 하트 링크 |
| `og-category-marriage.svg` | MARRIAGE (결혼)  | 쌍반지 / 베일                     |
| `og-category-finance.svg`  | FINANCE (재테크) | 동전 + 상승 차트                  |
| `og-category-work.svg`     | WORK (직장)      | 노트북 + 서류 / 빌딩              |
| `og-category-sports.svg`   | SPORTS (스포츠)  | 트로피 + 공 조합                  |
| `og-category-food.svg`     | FOOD (음식)      | 숟가락 + 젓가락 + 그릇            |
| `og-category-game.svg`     | GAME (게임)      | 게임 컨트롤러 / 조이스틱          |
| `og-category-car.svg`      | CAR (자동차)     | 스티어링휠 / 차량 실루엣          |
| `og-category-health.svg`   | HEALTH (건강)    | 아령 / 심전도 + 하트              |
| `og-category-trend.svg`    | TREND (트렌드)   | 불꽃 / 바이럴 파동                |

**스펙**

- 크기: **420×420px** (Bundle V1), **260×260px** (Bundle V2 뱃지 내부), **360×360px** (Bundle V3)
- 하나의 SVG에서 viewBox로 대응. 내부 padding 여유 있게(약 10%).
- **2-3색 이내** 플랫 일러스트 (브랜드 컬러와 조화 — 너무 화려하면 카테고리 그라데 배경과 충돌)
- 배경 투명

---

## 우선순위 4: GROUP 인물 실루엣

**목적**: Group V1 카드의 중앙 비주얼.

| 파일명                 | 사용처                | 제안 모티프                          |
| ---------------------- | --------------------- | ------------------------------------ |
| `og-group-cluster.svg` | Group V1 "Team Badge" | 5명 정도의 다양한 실루엣 (앞뒤 겹침) |
| `og-group-invite.svg`  | Group V2 "Invited"    | 편지 봉투 + 리본                     |

**스펙**

- `og-group-cluster.svg`: **560×300px** 가로형
- `og-group-invite.svg`: **140×140px** 정방형
- 단색 또는 2색 (카테고리 테마색과 호환되도록 흰색/중성색 권장)

---

## 제작하지 않아도 되는 것 (FE 자체 처리)

- ✅ 배경 그라데이션 — CSS linear-gradient로 처리
- ✅ CTA 밴드 (하단) — 텍스트만 사용
- ✅ HotPick 로고 — 기존 `/main-logo.png` 재사용
- ✅ VS 텍스트 (Pending V3) — Archivo Black 폰트로 직접 렌더

---

## 확인 순서

1. `/dev/og-preview` 접속 → 12개 variant 확인
2. 카톡 썸네일 시뮬레이션(344×164)에서 핵심 요소 가독성 점검
3. 최종 variant (Bundle/Pending/Match/Group 각 1개) 확정
4. 확정된 variant에서만 사용되는 placeholder → 에셋 제작
5. `public/og/`에 업로드
6. `src/lib/og/{bundleVariants,compareVariants}.tsx`의 해당 `<PlaceholderBox />`를 `<img src="/og/og-...">` 또는 인라인 `<svg>`로 교체
7. `src/lib/seo/compareOgImage.ts`의 `COMPARE_OG_DESIGN`과 `src/app/bundle/[slug]/metadata.ts`의 `BUNDLE_OG_DESIGN`을 확정 값으로 업데이트

---

## Satori(next/og) 렌더링 제약 (에셋 제작 시 주의)

- ✅ 지원: `path`, `rect`, `circle`, `polygon`, `linearGradient`, `radialGradient`, `stop`, `g`, `defs`
- ❌ 미지원/불안정: `filter`, `feGaussianBlur`, `mask`, `clipPath` 일부, CSS 애니메이션
- 🟡 주의: 외부 폰트(`<text>` 대신 Pretendard/Archivo 폰트 사용), 복잡한 blend mode

**안전 체크리스트**:

- [ ] SVG 파일 크기 200KB 이하 (인라인 시 OG 생성 시간에 영향)
- [ ] filter/mask 없음
- [ ] viewBox 명시
- [ ] path 좌표 유효 (NaN 금지)
- [ ] 색상은 hex 또는 rgba (named color 피할 것)
