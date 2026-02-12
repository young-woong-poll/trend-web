# HotPick 디자인 토큰

## 컬러

### 메인 컬러

- primary-gradient: linear-gradient(90deg, $primary-start 0%, $primary-end 100%);
- primary-start: #ff00ff;
- primary-end: #ff4500;
- attention: #dfff00;

### 배경 및 글자 컬러

- bg-primary: #121212;
- bg-secondary: #1e1e1e;
- bg-tertiary: #2c2c2c;
- border or placeholder: #555555;
- text-secondary: #d1d1d1;
- text-tertiary: #8a8a8a;
- disabled: #474a4f;
- white : #fff;

### 상황별 컬러

- error: #ff2e2e;
- success: #636ae8;

## 타이포그래피

### Font Size

| 토큰      | 값   | 용도                    |
| --------- | ---- | ----------------------- |
| text-xs   | 12px | 상태 메시지, 타임스탬프 |
| text-sm   | 14px | 댓글, 서브텍스트        |
| text-base | 16px | 기본 텍스트, 버튼       |
| text-lg   | 18px | 모달 제목               |
| text-xl   | 20px | 카드 제목, 라벨         |
| text-2xl  | 24px | 큰 제목                 |
| text-3xl  | 32px | 가장 큰 텍스트          |

### Font Weight

| 토큰          | 값  | 용도                  |
| ------------- | --- | --------------------- |
| font-regular  | 400 | 기본 본문             |
| font-medium   | 500 | 중간 강조             |
| font-semibold | 600 | 탭, 버튼, 강조 텍스트 |
| font-bold     | 700 | 제목, 헤더            |

### Line Height

| 토큰            | 값   | 조합 예시      |
| --------------- | ---- | -------------- |
| leading-tight   | 1.25 | 제목용         |
| leading-snug    | 1.4  | 서브텍스트     |
| leading-normal  | 1.5  | 본문 (댓글 등) |
| leading-relaxed | 1.6  | 긴 설명 텍스트 |

### 사용 패턴

- **본문**: 14px / 400 / line-height 1.5
- **라벨**: 16px / 600 / line-height 24px
- **큰 제목**: 20px / 700 / line-height 28px
- **가장 큰 제목**: 32px / 700 / line-height 40px

## 간격 체계

### Spacing Scale

| 토큰       | 값   | 용도                                 |
| ---------- | ---- | ------------------------------------ |
| spacing-1  | 4px  | 최소 간격 (아이콘-텍스트 사이)       |
| spacing-2  | 8px  | 작은 간격 (탭 간격, 버튼 내부)       |
| spacing-3  | 12px | 컴포넌트 내부 간격 (옵션 카드 gap)   |
| spacing-4  | 16px | 표준 패딩/마진 (카드 내부, 컨테이너) |
| spacing-5  | 20px | 바텀시트 패딩, 버튼 상단 마진        |
| spacing-6  | 24px | 중간 간격 (섹션 패딩)                |
| spacing-8  | 32px | 큰 간격 (아이콘 마진)                |
| spacing-12 | 48px | 매우 큰 간격 (empty state)           |

### 주요 컴포넌트 간격

- **카드 내부 패딩**: 16px
- **카드 간 갭**: 30px (MainView)
- **옵션 카드 간 갭**: 12px
- **버튼 간 갭**: 12px
- **바텀시트 헤더 패딩**: 20px
- **댓글 목록 패딩**: 16px 20px

## 컴포넌트 기본 패턴

### Border Radius

| 토큰         | 값     | 용도                            |
| ------------ | ------ | ------------------------------- |
| rounded-sm   | 4px    | 입력 필드, 작은 버튼            |
| rounded-md   | 8px    | 카드, 일반 버튼, VoteOptionCard |
| rounded-lg   | 12px   | VoteOption                      |
| rounded-xl   | 24px   | 바텀시트 상단 모서리            |
| rounded-full | 9999px | 완전히 둥근 버튼 (CTA)          |

### Box Shadow

| 토큰       | 값                                 | 용도                |
| ---------- | ---------------------------------- | ------------------- |
| shadow-sm  | 0 2px 8px rgba(0, 0, 0, 0.08)      | VoteOption 기본     |
| shadow-md  | 0 4px 12px rgba(0, 0, 0, 0.08)     | PollCard, 호버 상태 |
| shadow-lg  | 0 4px 16px rgba(99, 106, 232, 0.3) | 강조된 카드         |
| shadow-top | 0 -4px 20px rgba(0, 0, 0, 0.15)    | 바텀시트            |

### 버튼 패턴

**Primary Button (CTA)**

- 배경: primary-gradient
- 높이: 40px ~ 48px
- border-radius: 9999px
- font: 16px bold, white
- 호버: scale(1.02)
- 클릭: scale(0.98)

**Secondary Button (다음 버튼)**

- 배경: attention (#dfff00)
- 높이: 48px
- border-radius: 9999px
- font: 16px bold
- 호버: brightness(1.03), translateY(-2px)

**Outline Button (댓글 버튼)**

- 배경: transparent
- border: 2px solid text-tertiary (#8a8a8a)
- 높이: 48px
- border-radius: 9999px

**Small Button (좋아요 버튼)**

- 배경: bg-tertiary (#2c2c2c)
- padding: 6px 12px
- border-radius: 20px

### 카드 패턴

**PollCard**

- 배경: bg-secondary (#1e1e1e)
- 크기: 296px 높이
- padding: 16px
- border-radius: 8px
- shadow: shadow-md

**VoteOptionCard**

- 배경: bg-secondary (#1e1e1e)
- 높이: 200px
- border-radius: 8px
- shadow: shadow-sm
- 선택 시: primary-gradient 테두리 + glow 애니메이션

**VoteOption**

- 배경: bg-secondary (#1e1e1e)
- 높이: 240px (SE: 200px)
- border-radius: 12px
- shadow: shadow-sm → 호버 시 shadow-md

### Transition & Animation

| 패턴              | 값                                  | 용도             |
| ----------------- | ----------------------------------- | ---------------- |
| transition-fast   | 0.2s ease                           | 호버, 버튼 클릭  |
| transition-normal | 0.3s ease                           | 슬라이더, 드래그 |
| transition-slow   | 0.5s cubic-bezier(0.19, 1, 0.22, 1) | 페이지 슬라이드  |
| transition-flip   | 0.6s cubic-bezier(0.4, 0, 0.2, 1)   | 카드 플립        |

**주요 애니메이션**

- slideUp: 바텀시트 등장 (0.3s ease-out)
- fadeIn: 오버레이 등장 (0.2s ease-in-out)
- skeleton-loading: 로딩 스켈레톤 (1.5s infinite)
- dotBounce: 로딩 도트 (1.4s infinite)
- bounce: 좋아요 아이콘 (0.3s ease)

### 고정 높이 컴포넌트

| 컴포넌트           | 높이 |
| ------------------ | ---- |
| VoteHeader         | 48px |
| ProgressBar        | 8px  |
| VoteBottomButtons  | 48px |
| CommentBottomSheet | 80vh |
