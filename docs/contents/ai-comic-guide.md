# AI 사연 만화 생성 가이드

> contents-mix.json의 사연을 시간순 손그림 만화(4~6컷)로 만들어 인스타그램 캐러셀/릴스로 활용하기 위한 AI 활용 전략

---

## 1. 목표

| 항목      | 내용                                                         |
| --------- | ------------------------------------------------------------ |
| 입력      | `contents-mix.json`의 story (1~3문장 사연)                   |
| 출력      | 4~6장 손그림 스타일 만화 이미지 (1080x1350px, 인스타 캐러셀) |
| 스타일    | 한국 감성 손그림/일러스트 (라인 드로잉 + 수채화 느낌)        |
| 핵심 요구 | **캐릭터 일관성** — 같은 인물이 모든 컷에 동일하게 등장      |

---

## 2. 추천 방법 비교

### ⭐ A안: GPT-4o (gpt-image-1) API — **최우선 추천**

| 항목          | 내용                                                                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 장점          | 텍스트 이해력 최고, 한국어 프롬프트 직접 지원, 대화 맥락으로 캐릭터 일관성 유지, 이미지 내 한글 텍스트 렌더링 가능, API로 자동화 파이프라인 구축 가능 |
| 단점          | 고해상도(high) 이미지는 장당 ~$0.19로 비용 높음, 확산모델 대비 스타일 세밀 제어 한계                                                                  |
| 비용          | low: ~$0.02/장, medium: ~$0.07/장, high: ~$0.19/장                                                                                                    |
| 캐릭터 일관성 | ★★★★☆ (같은 대화 세션 내 참조 이미지 전달로 유지)                                                                                                     |
| 자동화        | ★★★★★ (OpenAI API → Python 스크립트로 JSON 순회 가능)                                                                                                 |
| 한글 지원     | ★★★★★ (프롬프트 + 이미지 내 텍스트 모두 한글 가능)                                                                                                    |

**워크플로우:**

```
contents-mix.json
    ↓ Python 스크립트
    ↓ 사연별로 4~6컷 시나리오 생성 (GPT-4o 텍스트)
    ↓ 각 컷 이미지 생성 (gpt-image-1 API)
    ↓ 이전 컷 이미지를 참조로 전달 → 캐릭터 일관성 유지
    ↓ 1080x1350 이미지 × 4~6장 출력
```

**예상 비용 (100개 사연 기준):**

- 시나리오 생성: ~$2 (텍스트 토큰)
- 이미지 생성 (medium, 사연당 5컷): 100 × 5 × $0.07 = **~$35**
- 이미지 생성 (high, 사연당 5컷): 100 × 5 × $0.19 = **~$95**

---

### B안: FLUX Kontext (Pro) + ComfyUI — **품질/스타일 최적화 추천**

| 항목          | 내용                                                                                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 장점          | 캐릭터 일관성 최고 수준 (identity embedding), 손그림/수채화 등 세밀한 스타일 제어 가능, 오픈소스 기반으로 LoRA 학습 가능, ComfyUI로 배치 워크플로우 구축 |
| 단점          | 초기 세팅에 시간 소요, 한글 텍스트 렌더링은 별도 후처리 필요, GPU 서버 또는 클라우드 비용                                                                |
| 비용          | BFL API: ~$0.04~$0.05/장 (Kontext Pro), Together.ai / Replicate 경유 시 유사                                                                             |
| 캐릭터 일관성 | ★★★★★ (--cref 참조 이미지 + PuLID 얼굴 인식)                                                                                                             |
| 자동화        | ★★★★☆ (ComfyUI 워크플로우 or API 호출 스크립트)                                                                                                          |
| 한글 지원     | ★★☆☆☆ (프롬프트는 영어 필요, 이미지 내 한글은 후처리)                                                                                                    |

**워크플로우:**

```
contents-mix.json
    ↓ GPT-4o로 영어 패널 스크립트 생성
    ↓ FLUX Kontext Pro API / ComfyUI
    ↓ 캐릭터 참조 이미지 1장 → 모든 컷에 일관 적용
    ↓ PuLID로 얼굴 일관성 강화
    ↓ 후처리: 한글 대사/나레이션 오버레이
    ↓ 1080x1350 이미지 출력
```

**예상 비용 (100개 사연 기준):**

- 시나리오 생성 (GPT-4o): ~$2
- 이미지 생성 (사연당 5컷): 100 × 5 × $0.05 = **~$25**
- (선택) GPU 클라우드 사용 시: 시간당 $0.5~$2

---

### C안: Midjourney + 수동 워크플로우 — **최고 품질, 소량 생산**

| 항목          | 내용                                                                                                                              |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 장점          | 아트 퀄리티 최고, --cref (character reference) + --cw 파라미터로 캐릭터 일관성 우수, 다양한 아트 스타일 (손그림, 수채화, 만화 등) |
| 단점          | **공식 API 없음** — 자동화 불가능, Discord 또는 웹에서 수동 작업, 비공식 API($30~60/월)는 TOS 위반 가능                           |
| 비용          | Standard 플랜: $30/월 (15시간 Fast GPU), Pro 플랜: $60/월                                                                         |
| 캐릭터 일관성 | ★★★★★ (--cref + --cw 100으로 매우 높은 일관성)                                                                                    |
| 자동화        | ★☆☆☆☆ (공식 API 없음)                                                                                                             |
| 한글 지원     | ★★☆☆☆ (프롬프트는 영어, 이미지 내 텍스트는 후처리)                                                                                |

---

### D안: Dashtoon Studio — **올인원 만화 플랫폼**

| 항목          | 내용                                                                                                      |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| 장점          | 만화 전용 플랫폼, 캐릭터 학습 기능 내장, 패널 레이아웃/말풍선 자동 배치, 무료 100장/일                    |
| 단점          | 스타일이 웹툰에 특화 (손그림 느낌 약함), API 접근 제한적, 인스타 포맷(1080x1350) 직접 출력 어려울 수 있음 |
| 비용          | 무료 (100장/일) ~ Pro 유료                                                                                |
| 캐릭터 일관성 | ★★★★☆ (캐릭터 학습 1회/일 제한)                                                                           |

---

## 3. 최종 추천: A안 + B안 하이브리드

### 왜 하이브리드인가?

1. **A안(GPT-4o)으로 시나리오 + 프로토타입** 빠르게 생성
2. **B안(FLUX Kontext)으로 최종 이미지 품질 향상** (손그림 스타일 정밀 제어)
3. 또는 간편하게 **A안만으로 End-to-End** 처리 (충분히 좋은 품질)

### 추천 파이프라인 (End-to-End 자동화)

```
┌──────────────────────────────────────────────────────────┐
│  Phase 1: 시나리오 생성 (GPT-4o Text)                    │
│                                                          │
│  contents-mix.json → 사연 1개 선택                        │
│  → GPT-4o에게 시나리오 요청:                               │
│     ① 캐릭터 비주얼 시트 (머리색, 옷, 체형 — 고정)         │
│     ② 4~6컷 패널 스크립트                                  │
│        각 컷: { scene, narration, emotion }               │
│  → 모든 패널의 scene에 캐릭터 외모를 반복 기술              │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│  Phase 2: 캐릭터 시트 생성 (images.generate)              │
│                                                          │
│  "Character reference sheet of [캐릭터 설명],             │
│   front view and side view, hand-drawn style,            │
│   white background"                                      │
│  → 캐릭터 시트 이미지 1장 저장 (char_ref.png)             │
│  ※ 이 이미지가 모든 후속 패널의 참조가 됨                   │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│  Phase 3: 패널 이미지 생성 (images.edit)                  │
│                                                          │
│  컷 1: images.edit(image=[char_ref.png], prompt=컷1)      │
│  컷 2: images.edit(image=[char_ref.png, 컷1.png], ...)    │
│  컷 3~6: 캐릭터 시트 + 직전 컷 참조 → 일관성 유지          │
│                                                          │
│  또는 Responses API로 대화 맥락 활용 (더 높은 일관성)       │
│                                                          │
│  사이즈: 1024x1536 (인스타 4:5 비율에 근사)                │
│  품질: medium ($0.07/장) 또는 high ($0.19/장)              │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│  Phase 4: 후처리 + 조립                                   │
│                                                          │
│  → Sharp(Node.js) or ImageMagick으로:                     │
│     한글 대사/나레이션 오버레이                              │
│     HotPick 로고 + 투표 CTA 삽입                          │
│  → 마지막 컷: "당신의 선택은?" + 선택지 표시                │
│  → 캐러셀: 이미지 4~6장 그대로 업로드                       │
│  → 릴스: ffmpeg → 컷당 3초 슬라이드쇼 영상                  │
└──────────────────────────────────────────────────────────┘
```

### 캐릭터 일관성을 높이는 핵심 기법

1. **캐릭터 시트 먼저 생성**: 정면/측면 뷰가 포함된 레퍼런스 이미지를 첫 번째로 만들고, 이후 모든 패널에서 이 이미지를 `images.edit`의 참조로 전달
2. **프롬프트에 외모 반복 기술**: 매 패널마다 "a young Korean woman with short black bob hair, wearing a yellow cardigan and white t-shirt"처럼 캐릭터 외모를 명시적으로 반복
3. **Responses API 활용**: GPT-4o의 대화 맥락을 활용하면 "이전 이미지와 동일한 캐릭터를 유지해줘"라는 자연어 지시가 동작
4. **최근 2장 참조**: `images.edit`에 16장까지 참조 가능하나, 캐릭터 시트 + 직전 1컷을 참조하는 것이 가장 효과적

---

## 4. 구현 예시

### 4-1. 시나리오 생성 프롬프트

```
너는 인스타그램 바이럴 만화 작가야.
아래 사연을 4컷 만화 시나리오로 변환해줘.

[사연]
{story}

[투표 선택지]
{options}

[규칙]
- 각 컷은 시간순으로 진행
- 주인공은 20대 한국 청년 (성별: 사연에 맞게 설정)
- 캐릭터 외모를 구체적으로 묘사 (머리스타일, 옷 색깔, 체형 등) — 이후 모든 컷에서 동일 유지
- 1컷: 상황 설정 (일상적 장면)
- 2컷: 사건/갈등 발생
- 3컷: 고민하는 장면
- 4컷: "당신의 선택은?" + 투표 선택지 제시
- 각 컷에 짧은 한글 대사 또는 나레이션 포함
- 손그림 일러스트에 어울리는 따뜻한 톤

[캐릭터 시트]
첫 번째 오브젝트로 캐릭터 비주얼 시트를 별도 출력해줘:
{
  "characterSheet": "A character reference sheet of [캐릭터 설명], front view and side view,
   hand-drawn Korean illustration style, soft pencil lines, warm pastel tones, white background"
}

[패널 출력 형식]
JSON 배열로 출력:
[
  {
    "panel": 0,
    "scene": "캐릭터 시트 프롬프트 (영어)",
    "narration": "",
    "emotion": "neutral",
    "isCharacterSheet": true
  },
  {
    "panel": 1,
    "scene": "장면 설명 (영어, 이미지 생성용) — 반드시 캐릭터 외모를 동일하게 명시",
    "narration": "한글 나레이션/대사",
    "emotion": "감정 키워드"
  },
  ...
]
```

### 4-2. 이미지 생성 — 두 가지 방식

#### 방식 1: `images.generate` (첫 컷) + `images.edit` (후속 컷, 참조 이미지 전달)

```python
import openai, base64, json, pathlib

client = openai.OpenAI()

STYLE = (
    "Hand-drawn Korean slice-of-life illustration, soft pencil lines "
    "with light watercolor wash, warm pastel color palette, simple cute "
    "characters with expressive faces, minimal clean background, "
    "vertical 1024x1536 portrait format, single panel comic scene."
)

def generate_comic(story, panels_script, out_dir="output"):
    pathlib.Path(out_dir).mkdir(exist_ok=True)
    ref_paths = []  # 이전 컷 이미지 경로들

    for p in panels_script:
        prompt = f"{STYLE}\n\nScene: {p['scene']}\nEmotion: {p['emotion']}"

        if not ref_paths:
            # ── 첫 컷 (또는 캐릭터 시트): images.generate ──
            res = client.images.generate(
                model="gpt-image-1",
                prompt=prompt,
                size="1024x1536",
                quality="medium",
                output_format="png",
            )
        else:
            # ── 후속 컷: images.edit — 참조 이미지 전달로 캐릭터 일관성 유지 ──
            image_files = [open(path, "rb") for path in ref_paths[-2:]]  # 최근 2장 참조
            res = client.images.edit(
                model="gpt-image-1",
                image=image_files,
                prompt=f"Generate the NEXT panel. Keep the SAME character. {prompt}",
                size="1024x1536",
            )
            for f in image_files:
                f.close()

        # 저장
        img_bytes = base64.b64decode(res.data[0].b64_json)
        path = f"{out_dir}/panel_{p['panel']:02d}.png"
        pathlib.Path(path).write_bytes(img_bytes)
        ref_paths.append(path)
        print(f"  ✓ Panel {p['panel']} saved → {path}")

    return ref_paths
```

#### 방식 2: ChatGPT Responses API (대화 맥락 활용 — 더 높은 일관성)

```python
# Responses API를 사용하면 대화 맥락이 유지되어
# 캐릭터 일관성이 자연스럽게 보장됩니다.

res = client.responses.create(
    model="gpt-4o",
    input=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": f"""
Draw this comic panel in hand-drawn Korean illustration style.
Keep EXACTLY the same character design as the attached reference.

Scene: {panel['scene']}
Style: soft pencil lines, watercolor wash, warm pastel tones
Format: vertical 1024x1536, single panel
"""},
                # 이전 컷 이미지를 대화에 포함
                {"type": "input_image", "image_url": f"data:image/png;base64,{prev_b64}"}
            ]
        }
    ],
    tools=[{"type": "image_generation", "size": "1024x1536", "quality": "medium"}],
)
# 응답에서 이미지 추출
for block in res.output:
    if block.type == "image_generation_call":
        img_b64 = block.result  # base64 이미지
```

> **참고**: Responses API는 GPT-4o의 대화 맥락을 활용하므로
> "이 캐릭터를 그대로 유지해줘"라는 지시를 자연스럽게 이해합니다.
> 현재 가장 높은 캐릭터 일관성을 보여주는 방식입니다.

### 4-3. 후처리: 한글 오버레이 + 릴스 변환

```bash
# 한글 텍스트 오버레이 (ImageMagick 예시)
magick panel_01.png \
  -font "NanumSquareRound-Bold" \
  -pointsize 48 \
  -fill "#333333" \
  -gravity South \
  -annotate +0+80 "남자친구 폰에서 전 여자친구 사진을 발견했다" \
  panel_01_final.png

# Node.js (Sharp) 로도 가능 — 프로젝트에 더 적합
# npm install sharp
```

```javascript
// overlay-text.mjs
import sharp from 'sharp';

async function overlayNarration(inputPath, outputPath, text) {
  const svgText = `
    <svg width="1024" height="200">
      <rect x="0" y="0" width="1024" height="200" rx="16"
            fill="rgba(255,255,255,0.85)"/>
      <text x="512" y="110" text-anchor="middle"
            font-family="NanumSquareRound" font-size="42"
            fill="#333">${text}</text>
    </svg>`;

  await sharp(inputPath)
    .composite([
      {
        input: Buffer.from(svgText),
        gravity: 'south',
      },
    ])
    .toFile(outputPath);
}
```

```bash
# 릴스용 슬라이드쇼 변환 (ffmpeg)
ffmpeg -framerate 1/3 \
  -i output/panel_%02d_final.png \
  -c:v libx264 -r 30 -pix_fmt yuv420p \
  -vf "scale=1080:1350:force_original_aspect_ratio=decrease,pad=1080:1350:(ow-iw)/2:(oh-ih)/2" \
  -t 18 \
  story_reel.mp4
```

---

## 5. 스타일 프롬프트 레퍼런스

### 손그림 만화 스타일 (추천)

```
Hand-drawn Korean slice-of-life illustration, soft pencil sketch
with light watercolor wash, warm beige and pastel pink tones,
simple cute characters with big round eyes, cozy atmosphere,
minimal furniture and props, clean white margins
```

### 웹툰 스타일

```
Korean webtoon style, clean digital line art, bright flat colors,
anime-influenced character design, dynamic expressions,
speech bubbles with Korean text
```

### 감성 일러스트 스타일

```
Emotional Korean illustration, muted warm color palette,
soft gradient backgrounds, delicate line work,
characters with gentle expressions, story-driven composition
```

---

## 6. 인스타 콘텐츠 전략

### 캐러셀 구성 (4~6장)

| 슬라이드 | 내용                                                |
| -------- | --------------------------------------------------- |
| 1장      | 후킹 장면 + 제목 (예: "전 애인 사진 발견했는데...") |
| 2장      | 사건 전개 만화                                      |
| 3장      | 갈등/고민 장면                                      |
| 4장      | 절정 + 감정 표현                                    |
| 5장      | "당신의 선택은?" + 투표 선택지                      |
| 6장      | HotPick 브랜딩 + CTA ("앱에서 투표하기")            |

### 릴스 변환

- 각 컷을 3초씩 → 15~18초 릴스
- BGM: 감성 피아노 or lo-fi 비트
- 마지막에 투표 유도 텍스트 + HotPick 링크

---

## 7. 비용 요약

| 방법                      | 100개 사연 (각 5컷) | 월간 유지비         |
| ------------------------- | ------------------- | ------------------- |
| **A안: GPT-4o (medium)**  | ~$37 (≈5만원)       | 사연 수에 비례      |
| **A안: GPT-4o (high)**    | ~$97 (≈13만원)      | 사연 수에 비례      |
| **B안: FLUX Kontext Pro** | ~$27 (≈3.5만원)     | + GPU 클라우드비    |
| **C안: Midjourney**       | $30~60/월 정액      | 수동 작업 시간 비용 |
| **D안: Dashtoon**         | 무료~Pro 정액       | 스타일 제한         |

---

## 8. 즉시 시작 가이드

### Step 1: ChatGPT 웹에서 수동 테스트 (0원, 10분)

**가장 먼저 해볼 것**: ChatGPT Plus (월 $20)에서 바로 테스트.

아래 프롬프트를 ChatGPT에 붙여넣기:

```
너는 인스타그램 감성 만화 작가야. 아래 사연을 4컷 손그림 만화로 그려줘.

사연: "남자친구 폰에서 전 여자친구와 찍은 사진을 발견했어요.
바람이 아닌데 뭔가 배신감이 들어요."

규칙:
- 손그림 일러스트 스타일 (연필 드로잉 + 수채화 워시)
- 주인공: 20대 한국 여성, 단발 검은 머리, 노란 가디건
- 따뜻한 파스텔 톤 배경
- 세로형 (1024x1536)

1컷: 남자친구와 소파에서 행복하게 사진 보는 장면
→ 한글 나레이션: "오늘도 평화로운 주말..."

이 캐릭터를 기억하고, 나머지 3컷도 동일한 캐릭터로 그려줘.
```

→ 스타일/품질이 만족스러우면 Step 2로.

### Step 2: OpenAI API 키 준비

- https://platform.openai.com 에서 API 키 발급
- gpt-image-1 모델 접근 확인 (Tier 1 이상 필요)
- 예산 한도 설정 권장 ($50~100)

### Step 3: 파일럿 배치 (5개 사연)

- contents-mix.json에서 카테고리별 사연 5개 선택
- Python 또는 Node.js 스크립트로 자동 생성 테스트
- 캐릭터 일관성/스타일 품질 확인 후 프롬프트 튜닝

### Step 4: 자동화 스크립트 완성

- `docs/contents/generate-comic.js` 생성
- contents-mix.json 순회 → 시나리오 생성 → 이미지 생성 → 저장
- 에러 핸들링, 재시도, 진행률 표시 추가

### Step 5: 후처리 파이프라인

- Sharp(Node.js)로 한글 텍스트 오버레이
- HotPick 브랜딩 + 로고 삽입
- 릴스 변환 (ffmpeg)

### Step 6: 인스타 업로드

- 캐러셀 또는 릴스로 게시
- 캡션에 투표 링크 삽입
- 해시태그: #핫픽 #투표 #고민상담 #사연만화 #공감 #MZ세대

---

## 9. 실전 예시: 사연 #1 "전 애인 사진"

아래는 contents-mix.json의 첫 번째 사연으로 4컷 만화를 만드는 구체적 예시입니다.

### 입력 데이터

```json
{
  "title": "연인이 전 애인 사진 안 지우면?",
  "story": "남자친구 폰에서 전 여자친구와 찍은 사진을 발견했어요. 바람이 아닌데 뭔가 배신감이 들어요.",
  "options": ["지워야 한다", "상관없다"]
}
```

### 생성된 시나리오 (예시)

```json
[
  {
    "panel": 0,
    "scene": "Character reference sheet: a young Korean woman in her mid-20s with a short black bob haircut, wearing a cozy yellow cardigan over a white t-shirt, casual jeans. Front view and side view on white background.",
    "narration": "",
    "isCharacterSheet": true
  },
  {
    "panel": 1,
    "scene": "A young Korean woman with short black bob hair and yellow cardigan sitting on a cozy sofa, happily scrolling through photos on her boyfriend's phone. Warm living room with soft lighting. Hand-drawn illustration style.",
    "narration": "남자친구 폰으로 같이 사진 보는 중...",
    "emotion": "happy"
  },
  {
    "panel": 2,
    "scene": "Same young woman with short black bob hair, suddenly freezing with wide eyes, staring at the phone screen showing a photo of a couple (blurred). Her expression shifts to shock. Yellow cardigan, same living room.",
    "narration": "...어? 이 사진은 뭐지?",
    "emotion": "shocked"
  },
  {
    "panel": 3,
    "scene": "Same young woman sitting alone in bed at night, hugging a pillow, looking conflicted and sad. Phone placed face-down on the nightstand. Dark room with warm lamp light. Yellow cardigan draped on chair.",
    "narration": "바람 핀 건 아닌데... 왜 이렇게 마음이 복잡하지",
    "emotion": "conflicted"
  },
  {
    "panel": 4,
    "scene": "Split composition: left side shows a trash bin icon, right side shows a photo album icon. In the center, the same young woman with short black bob hair stands with arms crossed, thinking. Clean white background with soft pastel accents. Text space at bottom.",
    "narration": "당신의 선택은?\n\n지워야 한다 vs 상관없다",
    "emotion": "questioning"
  }
]
```

### 인스타 캐러셀 결과물

| 슬라이드 | 이미지                  | 나레이션                                  |
| -------- | ----------------------- | ----------------------------------------- |
| 1/5      | 소파에서 폰 보는 커플   | "남자친구 폰으로 같이 사진 보는 중..."    |
| 2/5      | 충격받은 표정 클로즈업  | "...어? 이 사진은 뭐지?"                  |
| 3/5      | 밤에 혼자 고민하는 장면 | "바람 핀 건 아닌데... 왜 이렇게 복잡하지" |
| 4/5      | 투표 선택지 장면        | "당신의 선택은?"                          |
| 5/5      | HotPick 브랜딩          | "앱에서 투표하기 → votebox.kr"            |

---

## 참고 자료

- [OpenAI Image Generation API](https://openai.com/index/image-generation-api/)
- [GPT-4o 이미지 생성 가이드](https://gptimage.ai/how-to-create-complete-ai-comic-or-storybook.html)
- [FLUX Kontext Pro (BFL)](https://bfl.ai/models/flux-kontext)
- [FLUX Kontext + ComfyUI 캐릭터 일관성](https://comfyui.org/en/solving-character-consistency-with-flux1-kontext)
- [Together.ai FLUX Kontext Pro API](https://www.together.ai/models/flux-1-kontext-pro)
- [Midjourney Character Reference 가이드](https://docs.midjourney.com/hc/en-us/articles/32162917505293-Character-Reference)
- [AI 만화 생성 자동화 파이프라인 (MindStudio)](https://www.mindstudio.ai/blog/build-ai-comic-strip-generator-flux-veo-3/)
- [LlamaGen AI 만화 생성](https://llamagen.ai/)
- [Dashtoon Studio](https://dashtoon.com/create)
- [15 Best AI Comic Generators 2026](https://autoppt.com/blog/best-ai-comic-generators/)
