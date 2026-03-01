# 인스타 카드 가이드

## 목적

인스타를 통해 hotpick.votebox.kr 사이트로 유도한다.
논란이 있을만한 주제들을 카드 뉴스로 올려서 바이럴을 유도한다.

---

## 디자인 가이드

### 기본 사양

- **캔버스**: 1080 x 1350px (인스타 4:5)
- **포맷**: PNG
- **생성 방식**: HTML/CSS → Playwright 스크린샷

### 컬러

| 용도             | 값        |
| ---------------- | --------- |
| 배경             | `#FFFFFF` |
| 주 텍스트        | `#111111` |
| 스토리 텍스트    | `#555555` |
| 스토리 박스 배경 | `#F5F5F5` |
| VS 텍스트        | `#999999` |
| 이미지 테두리    | `#E0E0E0` |
| 하단 구분선      | `#E0E0E0` |
| 사연 라벨        | `#999999` |

### 폰트

Maplestory OTF Bold / Light 만 사용.

| 요소   | 굵기        | 사이즈                  |
| ------ | ----------- | ----------------------- |
| 제목      | Bold (700)  | 76px, line-height: 1.2  |
| 사연 라벨 | Bold (700)  | 26px                    |
| 사연 본문 | Light (300) | 34px, line-height: 1.55 |
| 옵션      | Light (300) | 52px                    |
| VS        | Light (300) | 34px                    |

### 로고

- `public/main-logo.png` 이미지 사용
- 높이 48px, 우측 하단 배치

### 짤 이미지

- contents-mix.json의 `image` 필드 URL 사용
- `object-fit: contain` + 회색 배경(`#F0F0F0`) — 이미지 짤림 방지
- 높이 540px 고정, 라운드 16px, 테두리 2px `#E0E0E0`

### 레이아웃

```
┌─────────────────────────────┐
│                             │ padding: 52px (좌우상), 40px (하)
│  제목 (76px Bold)            │
│  연인이 전 애인 사진          │
│  안 지우면?                  │
│                             │
│  ┌────────────────────────┐ │
│  │                        │ │ 짤 이미지 (540px)
│  │    (이미지 영역)         │ │ object-fit: contain
│  │                        │ │ border: 2px #E0E0E0
│  │                        │ │ border-radius: 16px
│  └────────────────────────┘ │
│                             │
│  ┌────────────────────────┐ │
│  │ 사연 (Bold, #999)       │ │ 배경: #F5F5F5
│  │ 본문 텍스트 (Light)      │ │ radius: 14px
│  │ "남자친구 폰에서..."     │ │
│  └────────────────────────┘ │
│                             │
│   지워야 한다  vs  상관없다   │ 가로 한 줄 배치
│                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━  │ 구분선 #E0E0E0
│                      [로고]  │ 로고 우측 정렬
└─────────────────────────────┘
```

### 옵션 영역 규칙

- **2개 옵션**: 가로 한 줄 배치 — `옵션A vs 옵션B`
- **3개 이상**: 세로 리스트 — 번호 없이 단순 나열, 가운데 정렬

### IMAGE 타입

- 옵션 영역을 좌우 분할 이미지로 대체
- 각 이미지에 하단 그라데이션 오버레이 + 옵션 텍스트
- 가운데 vs 텍스트

---

## 에이전트용 이미지 생성 가이드

### 폰트 로딩

```css
@font-face {
  font-family: 'Maplestory';
  src: url('https://cdn.jsdelivr.net/gh/fonts-archive/Maplestory/Maplestory-Bold.woff2')
    format('woff2');
  font-weight: 700;
  font-display: block;
}
@font-face {
  font-family: 'Maplestory';
  src: url('https://cdn.jsdelivr.net/gh/fonts-archive/Maplestory/Maplestory-Light.woff2')
    format('woff2');
  font-weight: 300;
  font-display: block;
}
```

### HTML 템플릿 (TEXT 2옵션 기본형)

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <style>
      @font-face {
        font-family: 'Maplestory';
        src: url('https://cdn.jsdelivr.net/gh/fonts-archive/Maplestory/Maplestory-Bold.woff2')
          format('woff2');
        font-weight: 700;
        font-display: block;
      }
      @font-face {
        font-family: 'Maplestory';
        src: url('https://cdn.jsdelivr.net/gh/fonts-archive/Maplestory/Maplestory-Light.woff2')
          format('woff2');
        font-weight: 300;
        font-display: block;
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        width: 1080px;
        height: 1350px;
        background: #ffffff;
        color: #111;
        font-family: 'Maplestory', sans-serif;
        display: flex;
        flex-direction: column;
      }

      .content {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 52px 52px 40px;
      }

      .title {
        font-size: 76px;
        font-weight: 700;
        line-height: 1.2;
        margin-bottom: 28px;
        word-break: keep-all;
      }

      .image-area {
        width: 100%;
        height: 540px;
        border-radius: 16px;
        overflow: hidden;
        margin-bottom: 28px;
        border: 2px solid #e0e0e0;
        flex-shrink: 0;
      }

      .image-area img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        background: #f0f0f0;
      }

      .story-box {
        background: #f5f5f5;
        border-radius: 14px;
        padding: 24px 28px;
        margin-bottom: 32px;
      }

      .story-label {
        font-size: 26px;
        font-weight: 700;
        color: #999;
        margin-bottom: 8px;
      }

      .story-text {
        font-size: 34px;
        font-weight: 300;
        color: #555;
        line-height: 1.55;
        word-break: keep-all;
      }

      .options {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 24px;
      }

      .option {
        font-size: 52px;
        font-weight: 300;
      }

      .vs {
        font-size: 34px;
        font-weight: 300;
        color: #999;
      }

      .footer {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        padding-top: 20px;
        border-top: 1px solid #e0e0e0;
        margin-top: auto;
      }

      .logo img {
        height: 48px;
        width: auto;
      }
    </style>
  </head>
  <body>
    <div class="content">
      <h1 class="title">{{TITLE}}</h1>
      <div class="image-area">
        <img src="{{IMAGE_URL}}" alt="" />
      </div>
      <div class="story-box">
        <div class="story-label">사연</div>
        <p class="story-text">{{STORY}}</p>
      </div>
      <div class="options">
        <div class="option">{{OPTION_A}}</div>
        <div class="vs">vs</div>
        <div class="option">{{OPTION_B}}</div>
      </div>
      <div class="footer">
        <div class="logo">
          <img src="../../../public/main-logo.png" alt="HotPick" />
        </div>
      </div>
    </div>
  </body>
</html>
```

### HTML 템플릿 (TEXT 3개 이상 옵션)

옵션 영역만 다름:

```html
<div class="options-list">
  <div class="option-item">{{OPTION_1}}</div>
  <div class="option-item">{{OPTION_2}}</div>
  <div class="option-item">{{OPTION_3}}</div>
</div>
```

추가 CSS:

```css
.options-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.option-item {
  font-size: 48px;
  font-weight: 700;
  text-align: center;
}
```

### HTML 템플릿 (IMAGE 타입)

옵션 영역을 이미지 분할로 대체 (짤 이미지 `.image-area` 는 제거):

```html
<div class="image-options">
  <div class="image-option">
    <img src="{{OPTION_A_IMAGE}}" alt="" />
    <div class="image-overlay"></div>
    <span class="image-label">{{OPTION_A}}</span>
  </div>
  <div class="image-vs">vs</div>
  <div class="image-option">
    <img src="{{OPTION_B_IMAGE}}" alt="" />
    <div class="image-overlay"></div>
    <span class="image-label">{{OPTION_B}}</span>
  </div>
</div>
```

추가 CSS:

```css
.image-options {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.image-option {
  flex: 1;
  height: 400px;
  position: relative;
  border-radius: 14px;
  overflow: hidden;
}

.image-option img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.6) 0%, transparent 50%);
}

.image-label {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 42px;
  font-weight: 700;
  color: #fff;
  z-index: 2;
}

.image-vs {
  font-size: 34px;
  font-weight: 300;
  color: #999;
  flex-shrink: 0;
}
```

---

## 에이전트에게 주는 프롬프트

```
docs/contents/contents-mix.json의 투표 항목들을 인스타 카드뉴스 이미지로 생성해줘.

## 참고 파일
- 디자인 가이드: docs/contents/insta-guide.md

## 작업 절차

1. docs/contents/insta-cards/ 디렉토리 생성
2. 각 항목별 HTML 파일 생성
   - 파일명: {id 3자리 패딩}-{slug}.html
   - insta-guide.md의 HTML 템플릿 사용
   - contents-mix.json의 title, story, options, image 데이터 매핑
3. 타입별 템플릿 적용:
   - TEXT + 옵션 2개 → 기본형 (가로 vs)
   - TEXT + 옵션 3개 이상 → 세로 리스트
   - IMAGE → 이미지 분할형 (짤 이미지 영역 제거)
4. 프로젝트 루트에서 HTTP 서버 실행 (로고 경로 때문)
5. Playwright로 각 HTML을 열어 스크린샷
   - 뷰포트: 1080x1350
   - 폰트 로딩 대기: document.fonts.ready
   - 저장: docs/contents/images/{id 3자리}-{slug}.png
```

### Playwright 주의사항

- 프로젝트 루트에서 HTTP 서버 실행 필수 (로고 상대경로)
- `document.fonts.ready` + 3초 대기로 폰트 로딩 보장
- 뷰포트: `{ width: 1080, height: 1350 }`
- 긴 제목(3줄 이상)은 font-size를 64px로 축소
