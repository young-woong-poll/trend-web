/**
 * Bundle OG 디자인 variants (v1/v2/v3)
 *
 * 핵심 정보:
 *   - "{N}명이 참여한"  (사회적 증거)
 *   - "{bundle.title}"  (주제 · 주인공)
 *
 * 3가지 컨셉:
 *   - V1 "Magazine Cover": 풀 카테고리 그라데 + 타이포 중심
 *   - V2 "Ticket": 크림 배경 + 티켓 점선 외곽
 *   - V3 "Tilted Card": 카테고리 배경 + 기울어진 화이트 카드
 *
 * GROUP / PENDING V2 통일 요소:
 *   - Pretendard Black / Archivo Black 폰트
 *   - CTA 밴드 생략 (디자인 자체가 브랜드)
 *   - 카테고리 색 강조 지점(숫자/kicker)
 */
import type { ReactElement } from 'react';

import type { CategoryTheme } from '@/constants/categoryTheme';
import { OG_HEIGHT, OG_WIDTH, formatWithCommas } from '@/lib/og/shared';

export interface BundleOgProps {
  participants: number;
  questions: number;
  theme: CategoryTheme;
  bundleTitle?: string;
  origin?: string;
}

/**
 * V3 "Tilted Card" — 카테고리 그라데 배경 + 기울어진 흰 카드
 *
 * 카드 내부 요소:
 *   - 우측 상단: HotPick 로고(텍스트)
 *   - 중앙: 타이틀 (주인공)
 *   - 하단: {N}명이 참여한 (숫자와 텍스트 동일 크기, 색만 차별)
 */
export function BundleV3Stats({
  participants,
  theme,
  bundleTitle,
  origin,
}: BundleOgProps): ReactElement {
  const titleText = bundleTitle && bundleTitle.length > 0 ? bundleTitle : '가치관 테스트';
  const logoUrl = origin ? `${origin}/main-logo.png` : null;

  return (
    <div
      style={{
        width: OG_WIDTH,
        height: OG_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        background: `linear-gradient(135deg, ${theme.start}, ${theme.end})`,
        fontFamily: 'Pretendard',
      }}
    >
      {/* 중앙 기울어진 흰 카드 */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '44px',
          width: '960px',
          minHeight: '500px',
          paddingTop: '88px',
          paddingBottom: '80px',
          paddingLeft: '72px',
          paddingRight: '72px',
          background: '#FFFDF5',
          transform: 'rotate(-2deg)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.22)',
        }}
      >
        {/* 우측 상단 HotPick 로고 (PNG) */}
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt="HotPick"
            width={160}
            height={38}
            style={{
              position: 'absolute',
              top: '32px',
              right: '24px',
              objectFit: 'contain',
            }}
          />
        )}

        {/* 타이틀 */}
        <div
          style={{
            display: 'flex',
            fontSize: '110px',
            fontWeight: 900,
            color: '#1a1208',
            letterSpacing: '-3px',
            lineHeight: 1.08,
            textAlign: 'center',
            wordBreak: 'keep-all',
          }}
        >
          {titleText}
        </div>

        {/* 참여수 — 숫자와 텍스트 동일 크기, 색만 차별 */}
        <div
          style={{
            marginTop: '24px',
            display: 'flex',
            alignItems: 'baseline',
            gap: '12px',
          }}
        >
          <span
            style={{
              display: 'flex',
              fontSize: '64px',
              fontWeight: 900,
              color: theme.start,
              letterSpacing: '-1px',
              lineHeight: 1,
            }}
          >
            {formatWithCommas(participants)}
          </span>
          <span
            style={{
              display: 'flex',
              fontSize: '64px',
              fontWeight: 900,
              color: '#1a1208',
              lineHeight: 1,
            }}
          >
            명이 참여한
          </span>
        </div>
      </div>
    </div>
  );
}
