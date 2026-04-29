/**
 * 테토/에겐 OG 이미지 (1200×630)
 *
 * Variants:
 *   - ?variant=landing  → /ask/teto-egen 랜딩 ("남이 보는 나는 / 테토일까, / 에겐일까?")
 *   - ?variant=friend   → /ask/teto-egen/friend/[token] ("저는 / 테토인가요? / 에겐인가요?")
 *
 * displayName은 이미지에 넣지 않음(캐싱). 이름은 OG title 메타데이터가 처리.
 */
import { ImageResponse } from 'next/og';
import { type NextRequest } from 'next/server';

import { buildFontsArray, loadOgFonts } from '@/lib/og/fonts';

export const runtime = 'edge';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

const COLORS = {
  bg: '#0a0a0a',
  white: '#ffffff',
  textSecondary: '#d1d1d1',
  tetoStart: '#ff00ff',
  tetoEnd: '#ff66cc',
  egenStart: '#ff7a3d',
  egenEnd: '#ff4500',
};

const sharedBg =
  `radial-gradient(ellipse at 85% 25%, rgba(255, 0, 255, 0.18) 0%, transparent 45%), ` +
  `radial-gradient(ellipse at 90% 80%, rgba(255, 69, 0, 0.16) 0%, transparent 45%), ${COLORS.bg}`;

type LineSpec = {
  highlight: string;
  highlightColors: { from: string; to: string };
  trailing: string;
};

function renderCharacters(origin: string) {
  return (
    <div
      style={{
        display: 'flex',
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 440,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img
        src={`${origin}/og/teto-egen/egen.png`}
        alt=""
        width={270}
        style={{
          position: 'absolute',
          top: 180,
          right: 210,
          width: 270,
          transform: 'rotate(-10deg)',
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img
        src={`${origin}/og/teto-egen/teto.png`}
        alt=""
        width={240}
        style={{
          position: 'absolute',
          top: 195,
          right: 30,
          width: 240,
          transform: 'rotate(10deg)',
        }}
      />
    </div>
  );
}

function renderBigLine(spec: LineSpec) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 12,
        fontSize: 124,
        fontWeight: 900,
        letterSpacing: -5,
        lineHeight: 1.05,
      }}
    >
      <span
        style={{
          backgroundImage: `linear-gradient(90deg, ${spec.highlightColors.from} 0%, ${spec.highlightColors.to} 100%)`,
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        {spec.highlight}
      </span>
      <span style={{ color: COLORS.white }}>{spec.trailing}</span>
    </div>
  );
}

function renderVariant(variant: 'landing' | 'friend', origin: string) {
  const pretitle = variant === 'landing' ? '남이 보는 나는' : '저는';
  const trailing = variant === 'landing' ? '일까,' : '인가요?';
  const trailingEgen = variant === 'landing' ? '일까?' : '인가요?';

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        backgroundImage: sharedBg,
        backgroundColor: COLORS.bg,
        padding: '80px 96px',
        flexDirection: 'column',
        justifyContent: 'center',
        color: COLORS.white,
        position: 'relative',
        fontFamily: 'Pretendard',
      }}
    >
      {renderCharacters(origin)}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxWidth: 720,
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: -2,
            color: COLORS.textSecondary,
            marginBottom: 12,
            lineHeight: 1.1,
          }}
        >
          {pretitle}
        </div>

        {renderBigLine({
          highlight: '테토',
          highlightColors: { from: COLORS.tetoStart, to: COLORS.tetoEnd },
          trailing,
        })}
        {renderBigLine({
          highlight: '에겐',
          highlightColors: { from: COLORS.egenStart, to: COLORS.egenEnd },
          trailing: trailingEgen,
        })}
      </div>
    </div>
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const variant = searchParams.get('variant') === 'friend' ? 'friend' : 'landing';

  try {
    const origin = new URL(request.url).origin;
    const fonts = await loadOgFonts(origin);

    return new ImageResponse(renderVariant(variant, origin), {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      fonts: buildFontsArray(fonts),
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable, s-maxage=31536000',
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Teto-Egen OG Error]', err);
    return new Response('Failed to generate OG image', { status: 500 });
  }
}
