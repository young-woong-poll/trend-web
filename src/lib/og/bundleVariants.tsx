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
 * V1 "Magazine Cover" — 풀 카테고리 그라데 + 타이포 중심
 * 매거진 커버. 타이틀이 주인공. 배경이 강렬.
 */
export function BundleV1Poster({ participants, theme, bundleTitle }: BundleOgProps): ReactElement {
  const titleText = bundleTitle && bundleTitle.length > 0 ? bundleTitle : '가치관 테스트';

  return (
    <div
      style={{
        width: OG_WIDTH,
        height: OG_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        background: `linear-gradient(135deg, ${theme.start}, ${theme.end})`,
        fontFamily: 'Pretendard',
      }}
    >
      {/* 상단 kicker */}
      <div
        style={{
          position: 'absolute',
          top: '56px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          fontSize: '22px',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.88)',
          letterSpacing: '12px',
        }}
      >
        HOTPICK · {theme.label.toUpperCase()}
      </div>

      {/* 중앙 타이틀 (주인공) */}
      <div
        style={{
          display: 'flex',
          fontSize: '100px',
          fontWeight: 900,
          color: '#ffffff',
          letterSpacing: '-2.5px',
          lineHeight: 1.08,
          textAlign: 'center',
          wordBreak: 'keep-all',
          maxWidth: '1000px',
          textShadow: '0 6px 24px rgba(0,0,0,0.22)',
        }}
      >
        {titleText}
      </div>

      {/* 하단 참여수 */}
      <div
        style={{
          position: 'absolute',
          bottom: '72px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'baseline',
          gap: '10px',
          color: '#ffffff',
        }}
      >
        <span
          style={{
            display: 'flex',
            fontSize: '68px',
            fontWeight: 900,
            fontFamily: 'Archivo Black',
            letterSpacing: '-1px',
            lineHeight: 1,
          }}
        >
          {formatWithCommas(participants)}
        </span>
        <span
          style={{
            display: 'flex',
            fontSize: '36px',
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          명이 참여한
        </span>
      </div>
    </div>
  );
}

/**
 * V2 "Ticket" — 크림 배경 + 티켓 점선 외곽
 * 입장권/쿠폰 느낌. GROUP V2 편지지 크림 톤과 페어.
 */
export function BundleV2Badge({ participants, theme, bundleTitle }: BundleOgProps): ReactElement {
  const titleText = bundleTitle && bundleTitle.length > 0 ? bundleTitle : '가치관 테스트';

  return (
    <div
      style={{
        width: OG_WIDTH,
        height: OG_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '110px',
        paddingBottom: '110px',
        position: 'relative',
        background: '#FDFBF2',
        fontFamily: 'Pretendard',
      }}
    >
      {/* 외곽 점선 테두리 (티켓 모서리 느낌) */}
      <div
        style={{
          position: 'absolute',
          top: '40px',
          left: '40px',
          right: '40px',
          bottom: '40px',
          display: 'flex',
          border: `2px dashed ${theme.start}88`,
          borderRadius: '12px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '52px',
          left: '52px',
          right: '52px',
          bottom: '52px',
          display: 'flex',
          border: `1px solid ${theme.start}33`,
          borderRadius: '8px',
        }}
      />

      {/* 상단 kicker */}
      <div
        style={{
          display: 'flex',
          fontSize: '22px',
          fontWeight: 700,
          color: theme.start,
          letterSpacing: '14px',
        }}
      >
        HOTPICK TEST · {theme.label.toUpperCase()}
      </div>

      {/* 중앙 타이틀 */}
      <div
        style={{
          display: 'flex',
          fontSize: '96px',
          fontWeight: 900,
          color: '#1a1208',
          letterSpacing: '-2.5px',
          lineHeight: 1.08,
          textAlign: 'center',
          wordBreak: 'keep-all',
          maxWidth: '960px',
        }}
      >
        {titleText}
      </div>

      {/* 하단 참여수 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '10px',
        }}
      >
        <span
          style={{
            display: 'flex',
            fontSize: '68px',
            fontWeight: 900,
            fontFamily: 'Archivo Black',
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
            fontSize: '36px',
            fontWeight: 700,
            color: '#1a1208',
            lineHeight: 1.1,
          }}
        >
          명이 참여 중
        </span>
      </div>
    </div>
  );
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
