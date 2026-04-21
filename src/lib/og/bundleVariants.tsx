/**
 * Bundle OG 디자인 V3 "Tilted Card"
 *
 * slug당 1장 S3 캐싱 전략 — 이미지 자체는 번들 아이덴티티(타이틀)만 담는다.
 * 참여자 수는 OG metadata의 description에서 동적으로 노출한다.
 */
import type { ReactElement } from 'react';

import type { CategoryTheme } from '@/constants/categoryTheme';
import { OG_HEIGHT, OG_WIDTH } from '@/lib/og/shared';

export interface BundleOgProps {
  theme: CategoryTheme;
  bundleTitle?: string;
  origin?: string;
}

/**
 * V3 "Tilted Card" — 카테고리 그라데 배경 + 기울어진 흰 카드 + 중앙 타이틀
 */
export function BundleV3Stats({ theme, bundleTitle, origin }: BundleOgProps): ReactElement {
  const titleText = bundleTitle && bundleTitle.length > 0 ? bundleTitle : '가치관 비교 테스트';
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
          width: '960px',
          minHeight: '500px',
          padding: '88px 72px',
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
      </div>
    </div>
  );
}
