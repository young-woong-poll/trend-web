'use client';

import { type FC } from 'react';

import styles from '@/components/features/Compare/GroupResult/LockedSectionPreview.module.scss';

type SketchType = 'chemistry-network' | 'pick-a-side' | 'group-awards';

interface LockedSectionPreviewProps {
  /** 섹션 제목 (예: "케미 네트워크") */
  title: string;
  /** 섹션 설명 카피 — "참여하면 열려요" 아래 노출 */
  desc: string;
  /** 섹션별 스케치 종류 */
  sketchType: SketchType;
}

/**
 * 1명 그룹 + 비멤버 진입 시 비교 의존 섹션 자리에 노출되는 잠금 프리뷰.
 * 섹션별 스케치 SVG를 블러 처리 + 중앙 자물쇠 오버레이로 "참여하면 열려요" 유도.
 */
export const LockedSectionPreview: FC<LockedSectionPreviewProps> = ({
  title,
  desc,
  sketchType,
}) => (
  <article className={styles.card}>
    <h3 className={styles.cardTitle}>{title}</h3>

    <div className={styles.sketchFrame}>
      <div className={styles.sketchLayer} aria-hidden="true">
        {sketchType === 'chemistry-network' && <ChemistrySketch />}
        {sketchType === 'pick-a-side' && <PickASideSketch />}
        {sketchType === 'group-awards' && <GroupAwardsSketch />}
      </div>
      <div className={styles.vignette} aria-hidden="true" />
      <div className={styles.overlay}>
        <div className={styles.lockIcon} aria-hidden="true">
          <div className={styles.lockShackle} />
          <div className={styles.lockBody} />
        </div>
        <p className={styles.overlayTitle}>참여하면 열려요</p>
        <p className={styles.overlayDesc}>{desc}</p>
      </div>
    </div>
  </article>
);

// ─── Inline SVG Sketches ─────────────────────────────────────────────
// 블러 + opacity로 처리되어 구조만 암시. rgba 톤으로 다크모드 배경 위 은은하게.

function ChemistrySketch() {
  // 육각형 6개 노드 + 점선 연결선
  const nodes = [
    { cx: 150, cy: 30 },
    { cx: 232, cy: 65 },
    { cx: 248, cy: 128 },
    { cx: 150, cy: 156 },
    { cx: 52, cy: 128 },
    { cx: 68, cy: 65 },
  ];
  const links: Array<[number, number]> = [
    [0, 2],
    [0, 4],
    [1, 3],
    [1, 5],
    [2, 4],
  ];

  return (
    <svg viewBox="0 0 300 180" preserveAspectRatio="xMidYMid meet" role="presentation">
      <defs>
        <linearGradient id="lockedPreviewNodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 0, 255, 0.75)" />
          <stop offset="100%" stopColor="rgba(255, 69, 0, 0.75)" />
        </linearGradient>
      </defs>
      {links.map(([a, b], i) => (
        <line
          key={`link-${i}`}
          x1={nodes[a].cx}
          y1={nodes[a].cy}
          x2={nodes[b].cx}
          y2={nodes[b].cy}
          stroke="rgba(255, 255, 255, 0.35)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />
      ))}
      {nodes.map((n, i) => (
        <circle
          key={`node-${i}`}
          cx={n.cx}
          cy={n.cy}
          r={16}
          fill="url(#lockedPreviewNodeGrad)"
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth={1}
        />
      ))}
    </svg>
  );
}

function PickASideSketch() {
  return (
    <svg viewBox="0 0 300 160" preserveAspectRatio="xMidYMid meet" role="presentation">
      <rect
        x="20"
        y="20"
        width="120"
        height="50"
        rx="10"
        fill="rgba(255, 0, 255, 0.22)"
        stroke="rgba(255, 255, 255, 0.35)"
        strokeWidth="1"
      />
      <rect x="36" y="38" width="60" height="6" rx="3" fill="rgba(255, 255, 255, 0.55)" />
      <rect x="36" y="50" width="36" height="4" rx="2" fill="rgba(255, 255, 255, 0.3)" />
      <rect
        x="160"
        y="20"
        width="120"
        height="50"
        rx="10"
        fill="rgba(255, 69, 0, 0.22)"
        stroke="rgba(255, 255, 255, 0.35)"
        strokeWidth="1"
      />
      <rect x="176" y="38" width="72" height="6" rx="3" fill="rgba(255, 255, 255, 0.55)" />
      <rect x="176" y="50" width="48" height="4" rx="2" fill="rgba(255, 255, 255, 0.3)" />
      {[0, 1, 2].map((i) => (
        <circle
          key={`avA-${i}`}
          cx={45 + i * 22}
          cy={100}
          r={13}
          fill="rgba(255, 0, 255, 0.45)"
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth="1"
        />
      ))}
      <rect x="32" y="124" width="90" height="5" rx="2.5" fill="rgba(255, 255, 255, 0.3)" />
      {[0, 1].map((i) => (
        <circle
          key={`avB-${i}`}
          cx={185 + i * 22}
          cy={100}
          r={13}
          fill="rgba(255, 69, 0, 0.45)"
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth="1"
        />
      ))}
      <rect x="172" y="124" width="70" height="5" rx="2.5" fill="rgba(255, 255, 255, 0.3)" />
    </svg>
  );
}

function GroupAwardsSketch() {
  const cards = [40, 115, 190];
  return (
    <svg viewBox="0 0 300 140" preserveAspectRatio="xMidYMid meet" role="presentation">
      {cards.map((x, i) => (
        <g key={`award-${i}`}>
          <rect
            x={x}
            y={20}
            width={70}
            height={100}
            rx={12}
            fill="rgba(30, 30, 30, 0.55)"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="1"
          />
          <circle
            cx={x + 35}
            cy={48}
            r={14}
            fill="rgba(255, 0, 255, 0.4)"
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth="1"
          />
          <rect x={x + 30} y={60} width={10} height={10} fill="rgba(255, 69, 0, 0.45)" />
          <rect x={x + 22} y={70} width={26} height={4} rx={2} fill="rgba(255, 255, 255, 0.4)" />
          <rect x={x + 14} y={88} width={42} height={5} rx={2.5} fill="rgba(255, 255, 255, 0.35)" />
          <rect x={x + 20} y={100} width={30} height={4} rx={2} fill="rgba(255, 255, 255, 0.22)" />
        </g>
      ))}
    </svg>
  );
}
