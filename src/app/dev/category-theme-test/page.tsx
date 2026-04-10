'use client';

import { useState, type FC } from 'react';

import styles from '@/app/dev/category-theme-test/page.module.scss';

// ─── Types & Data ───

type OptionId = 'A' | 'B' | 'C';
type CategoryId = 'romance' | 'marriage' | 'friendship';

interface CategoryDef {
  id: CategoryId;
  name: string;
  emoji: string;
  title: string;
  subtitle: string;
}

const CATEGORIES: CategoryDef[] = [
  {
    id: 'romance',
    name: '연애',
    emoji: '💕',
    title: '연애 가치관 테스트',
    subtitle: '나의 연애 스타일은?',
  },
  {
    id: 'marriage',
    name: '결혼',
    emoji: '💍',
    title: '결혼 가치관 테스트',
    subtitle: '결혼에 대한 내 가치관',
  },
  {
    id: 'friendship',
    name: '우정',
    emoji: '🤝',
    title: '우정 케미 테스트',
    subtitle: '친구와의 케미 확인',
  },
];

const ACCENTS: Record<CategoryId, { start: string; end: string; tagBg: string }> = {
  romance: { start: '#FF6B9D', end: '#C850C0', tagBg: 'rgba(255, 107, 157, 0.15)' },
  marriage: { start: '#F7971E', end: '#FFD200', tagBg: 'rgba(247, 151, 30, 0.15)' },
  friendship: { start: '#667EEA', end: '#00D2FF', tagBg: 'rgba(102, 126, 234, 0.15)' },
};

const OPTIONS: Record<OptionId, { label: string; title: string; desc: string }> = {
  A: {
    label: 'A. 라벨+색상',
    title: 'A. 라벨 + 액센트 그라데이션',
    desc: '카테고리별 컬러 태그 + 카드 테두리·CTA·배경 Orb 색상을 모두 카테고리 톤으로 변경',
  },
  B: {
    label: 'B. 라벨+패턴',
    title: 'B. 라벨 + 추상 패턴',
    desc: '카테고리별 컬러 태그 + 카테고리에 맞는 기하학 SVG 패턴을 배경에 깔아줌',
  },
  C: {
    label: 'C. 꽃 배경',
    title: 'C. 꽃 오브제 배경',
    desc: '카테고리별 꽃 일러스트를 배경 곳곳에 은은하게 배치 (연애=벚꽃, 결혼=코스모스, 우정=수국)',
  },
};

// ─── Flower SVG Components (Option C) ───

const CherryBlossom: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 60 60" fill="none">
    <g transform="translate(30,30)">
      {[0, 72, 144, 216, 288].map((angle) => (
        <path
          key={angle}
          d="M0,-2 C3,-8 7,-16 0,-20 C-7,-16 -3,-8 0,-2Z"
          fill="rgba(255, 183, 197, 0.7)"
          transform={`rotate(${angle})`}
        />
      ))}
      <circle cx="0" cy="0" r="3.5" fill="rgba(255, 200, 210, 0.9)" />
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <circle
          key={`s${angle}`}
          cx={4.5 * Math.cos((angle * Math.PI) / 180)}
          cy={4.5 * Math.sin((angle * Math.PI) / 180)}
          r="0.8"
          fill="rgba(255, 140, 160, 0.7)"
        />
      ))}
    </g>
  </svg>
);

const CosmosFlower: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 60 60" fill="none">
    <g transform="translate(30,30)">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <ellipse
          key={angle}
          cx="0"
          cy="-12"
          rx="3"
          ry="11"
          fill="rgba(218, 165, 32, 0.55)"
          transform={`rotate(${angle})`}
        />
      ))}
      {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle) => (
        <ellipse
          key={`inner${angle}`}
          cx="0"
          cy="-8"
          rx="2"
          ry="7"
          fill="rgba(247, 151, 30, 0.35)"
          transform={`rotate(${angle})`}
        />
      ))}
      <circle cx="0" cy="0" r="4.5" fill="rgba(255, 210, 0, 0.8)" />
      <circle cx="0" cy="0" r="2.5" fill="rgba(180, 120, 20, 0.5)" />
    </g>
  </svg>
);

const HydrangeaCluster: FC<{ className?: string }> = ({ className }) => {
  const positions = [
    { x: 30, y: 18 },
    { x: 22, y: 24 },
    { x: 38, y: 24 },
    { x: 26, y: 32 },
    { x: 34, y: 32 },
    { x: 30, y: 27 },
    { x: 18, y: 30 },
    { x: 42, y: 30 },
    { x: 25, y: 39 },
    { x: 35, y: 39 },
  ];
  return (
    <svg className={className} viewBox="0 0 60 60" fill="none">
      {positions.map((pos, i) => (
        <g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse
              key={angle}
              cx="0"
              cy="-2.5"
              rx="1.8"
              ry="2.5"
              fill={i % 3 === 0 ? 'rgba(100, 149, 237, 0.55)' : 'rgba(135, 206, 235, 0.45)'}
              transform={`rotate(${angle})`}
            />
          ))}
          <circle cx="0" cy="0" r="1" fill="rgba(200, 230, 255, 0.7)" />
        </g>
      ))}
    </svg>
  );
};

const FLOWER_MAP: Record<CategoryId, FC<{ className?: string }>> = {
  romance: CherryBlossom,
  marriage: CosmosFlower,
  friendship: HydrangeaCluster,
};

// ─── Pattern SVG Components (Option B) ───

const WavePattern: FC<{ color: string }> = ({ color }) => (
  <svg className={styles.patternSvg} viewBox="0 0 400 280" preserveAspectRatio="none">
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <path
        key={i}
        d={`M-20,${80 + i * 35} Q80,${40 + i * 35} 200,${80 + i * 35} T420,${80 + i * 35}`}
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        opacity={0.12 - i * 0.015}
      />
    ))}
  </svg>
);

const DiamondPattern: FC<{ color: string; id: string }> = ({ color, id }) => (
  <svg className={styles.patternSvg} viewBox="0 0 400 280">
    <defs>
      <pattern id={id} x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
        <path
          d="M18,0 L36,18 L18,36 L0,18Z"
          fill="none"
          stroke={color}
          strokeWidth="0.7"
          opacity="0.14"
        />
        <circle cx="18" cy="18" r="1.5" fill={color} opacity="0.08" />
      </pattern>
    </defs>
    <rect width="400" height="280" fill={`url(#${id})`} />
  </svg>
);

const ConstellationPattern: FC<{ color: string }> = ({ color }) => {
  const dots = [
    { x: 40, y: 30 },
    { x: 120, y: 70 },
    { x: 200, y: 35 },
    { x: 280, y: 85 },
    { x: 360, y: 45 },
    { x: 70, y: 150 },
    { x: 150, y: 110 },
    { x: 230, y: 160 },
    { x: 310, y: 130 },
    { x: 380, y: 175 },
    { x: 25, y: 100 },
    { x: 140, y: 55 },
    { x: 260, y: 200 },
    { x: 100, y: 220 },
    { x: 340, y: 240 },
  ];
  const lines = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [5, 6],
    [6, 7],
    [7, 8],
    [8, 9],
    [0, 5],
    [2, 6],
    [4, 9],
    [10, 5],
    [11, 2],
    [12, 7],
    [13, 5],
    [14, 9],
  ];
  return (
    <svg className={styles.patternSvg} viewBox="0 0 400 280">
      {lines.map(([a, b], i) => (
        <line
          key={i}
          x1={dots[a].x}
          y1={dots[a].y}
          x2={dots[b].x}
          y2={dots[b].y}
          stroke={color}
          strokeWidth="0.6"
          opacity="0.1"
        />
      ))}
      {dots.map((d, i) => (
        <g key={`d${i}`}>
          <circle cx={d.x} cy={d.y} r={i % 3 === 0 ? 3 : 1.8} fill={color} opacity={0.2} />
          {i % 3 === 0 && <circle cx={d.x} cy={d.y} r="6" fill={color} opacity="0.04" />}
        </g>
      ))}
    </svg>
  );
};

// ─── Mock Card ───

function MockCard({ cat, option }: { cat: CategoryDef; option: OptionId }) {
  const accent = ACCENTS[cat.id];
  const useAccent = option === 'A' || option === 'B';
  const FlowerComp = FLOWER_MAP[cat.id];

  const borderGradient = useAccent
    ? `linear-gradient(180deg, ${accent.start}, ${accent.end})`
    : 'linear-gradient(90deg, #ff00ff, #ff4500)';

  const tagStyle = useAccent
    ? { background: accent.tagBg, color: accent.start }
    : { background: 'rgba(255, 0, 255, 0.15)', color: '#ff00ff' };

  const ctaGradient = useAccent
    ? `linear-gradient(90deg, ${accent.start}, ${accent.end})`
    : 'linear-gradient(90deg, #ff00ff, #ff4500)';

  return (
    <div className={styles.mockCard}>
      <div className={styles.mockAccent} style={{ background: borderGradient }} />

      {/* Option B: 카드 내부 패턴 */}
      {option === 'B' && (
        <div className={styles.cardPatternOverlay}>
          {cat.id === 'romance' && <WavePattern color={accent.start} />}
          {cat.id === 'marriage' && <DiamondPattern color={accent.start} id={`card-${cat.id}`} />}
          {cat.id === 'friendship' && <ConstellationPattern color={accent.start} />}
        </div>
      )}

      {/* Option C: 꽃 워터마크 */}
      {option === 'C' && <FlowerComp className={styles.cardFlowerWatermark} />}

      <div className={styles.mockContent}>
        <div className={styles.mockTopRow}>
          <span className={styles.mockTag} style={tagStyle}>
            {useAccent ? `${cat.emoji} ${cat.name}` : cat.name}
          </span>
        </div>
        <div className={styles.mockTitle}>{cat.title}</div>
        <div className={styles.mockSub}>{cat.subtitle}</div>
        <div className={styles.mockCta} style={{ background: ctaGradient }}>
          시작하기 →
        </div>
      </div>
    </div>
  );
}

// ─── Background Preview ───

function BgPreview({ cat, option }: { cat: CategoryDef; option: OptionId }) {
  const accent = ACCENTS[cat.id];
  const FlowerComp = FLOWER_MAP[cat.id];

  // Option A: orb 색상을 카테고리에 맞춤 / B,C: 기본 마젠타·오렌지
  const orbColor1 = option === 'A' ? accent.start : '#ff00ff';
  const orbColor2 = option === 'A' ? accent.end : '#ff4500';

  return (
    <div className={styles.bgPreview}>
      {/* Orbs */}
      <div className={styles.bgOrb1} style={{ background: orbColor1 }} />
      <div className={styles.bgOrb2} style={{ background: orbColor2 }} />

      {/* Option B: 패턴 오버레이 */}
      {option === 'B' && (
        <div className={styles.patternOverlay}>
          {cat.id === 'romance' && <WavePattern color={accent.start} />}
          {cat.id === 'marriage' && <DiamondPattern color={accent.start} id={`bg-${cat.id}`} />}
          {cat.id === 'friendship' && <ConstellationPattern color={accent.start} />}
        </div>
      )}

      {/* Option C: 꽃 오버레이 */}
      {option === 'C' && (
        <div className={styles.flowerOverlay}>
          <FlowerComp className={`${styles.flower} ${styles.flower1}`} />
          <FlowerComp className={`${styles.flower} ${styles.flower2}`} />
          <FlowerComp className={`${styles.flower} ${styles.flower3}`} />
          <FlowerComp className={`${styles.flower} ${styles.flower4}`} />
          <FlowerComp className={`${styles.flower} ${styles.flower5}`} />
        </div>
      )}

      {/* 목업 콘텐츠 */}
      <div className={styles.bgContent}>
        <div className={styles.bgTitle}>{cat.title}</div>
        <div className={styles.bgSync}>
          <span className={styles.bgSyncLabel}>그룹 싱크율</span>
          <span className={styles.bgSyncValue}>72%</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───

export default function CategoryThemeTestPage() {
  const [activeOption, setActiveOption] = useState<OptionId>('A');
  const info = OPTIONS[activeOption];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>카테고리 테마 비교</h1>
        <p>번들 주제별 시각 구분 방법 3가지를 비교합니다</p>
      </header>

      <nav className={styles.tabBar}>
        {(['A', 'B', 'C'] as OptionId[]).map((id) => (
          <button
            key={id}
            type="button"
            className={`${styles.tab} ${activeOption === id ? styles.tabActive : ''}`}
            onClick={() => setActiveOption(id)}
          >
            {OPTIONS[id].label}
          </button>
        ))}
      </nav>

      <div className={styles.optionInfo}>
        <h2>{info.title}</h2>
        <p>{info.desc}</p>
      </div>

      {CATEGORIES.map((cat) => (
        <section key={cat.id} className={styles.categorySection}>
          <h3 className={styles.categoryName}>
            {cat.emoji} {cat.name} 카테고리
          </h3>
          <div className={styles.demoArea}>
            <div className={styles.demoBlock}>
              <span className={styles.demoLabel}>메인 번들 카드</span>
              <MockCard cat={cat} option={activeOption} />
            </div>
            <div className={styles.demoBlock}>
              <span className={styles.demoLabel}>번들 배경 (플레이/결과 화면)</span>
              <BgPreview cat={cat} option={activeOption} />
            </div>
          </div>
        </section>
      ))}

      <div className={styles.summaryBox}>
        <h3>옵션별 특징 비교</h3>
        <strong>A. 라벨+색상</strong> — 에셋 비용 0, CSS만으로 구현, 카드~배경 전체 톤 변경
        <br />
        <strong>B. 라벨+패턴</strong> — SVG 코드 생성, 은은한 분위기, 카테고리 확장 용이
        <br />
        <strong>C. 꽃 배경</strong> — 감성적 차별화 최고, 에셋 제작 필요, 카테고리 매핑 주관적
      </div>
    </div>
  );
}
