import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

import { getCategoryTheme } from '@/constants/categoryTheme';
import { SITE_URL } from '@/lib/seo/constants';
import type { CategoryCode } from '@/types/hotpick';

export const runtime = 'edge';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

const fontBoldPromise = fetch(new URL('/fonts/NotoSansKR-Bold.ttf', SITE_URL)).then((res) =>
  res.arrayBuffer()
);
const fontRegularPromise = fetch(new URL('/fonts/NotoSansKR-Regular.ttf', SITE_URL)).then((res) =>
  res.arrayBuffer()
);

const logoUrl = `${SITE_URL}/main-logo.png`;

function formatWithCommas(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get('category') ?? 'TREND';
  const participants = Number(searchParams.get('participants') ?? '0');
  const questions = Number(searchParams.get('questions') ?? '0');

  try {
    const [fontBold, fontRegular] = await Promise.all([fontBoldPromise, fontRegularPromise]);
    const theme = getCategoryTheme(category as CategoryCode);

    const highlightBg = `linear-gradient(180deg, transparent 55%, rgba(${theme.startRgb}, 0.3) 55%)`;

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '"Noto Sans KR"',
            position: 'relative',
            background: `linear-gradient(135deg, #FFFBF7, rgba(${theme.startRgb}, 0.06))`,
          }}
        >
          {/* 로고 — 우측 상단 (2배 크기) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt="HotPick"
            width="300"
            height="60"
            style={{
              position: 'absolute',
              top: '32px',
              right: '40px',
              objectFit: 'contain',
              opacity: 0.85,
            }}
          />

          {/* 메인 텍스트 영역 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {/* 첫 줄: {참여수}명이 참여한 (0명이면 숨김) */}
            {participants > 0 && (
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span
                  style={{
                    fontSize: '52px',
                    fontWeight: 700,
                    color: '#222',
                    backgroundImage: highlightBg,
                    padding: '0 8px',
                    lineHeight: 1.7,
                  }}
                >
                  {formatWithCommas(participants)}명
                </span>
                <span
                  style={{
                    fontSize: '40px',
                    fontWeight: 400,
                    color: '#555',
                    marginLeft: '8px',
                  }}
                >
                  이 참여한
                </span>
              </div>
            )}

            {/* 둘째 줄: {질문수}개 질문 {카테고리} 가치관 테스트 */}
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span
                style={{
                  fontSize: '52px',
                  fontWeight: 700,
                  color: '#222',
                  backgroundImage: highlightBg,
                  padding: '0 8px',
                  lineHeight: 1.7,
                }}
              >
                {questions}개 질문
              </span>
              <span
                style={{
                  fontSize: '40px',
                  fontWeight: 400,
                  color: '#555',
                  marginLeft: '8px',
                }}
              >
                {theme.label} 가치관 테스트
              </span>
            </div>
          </div>

          {/* 하단 카테고리 스트립 */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '6px',
              background: `linear-gradient(90deg, ${theme.start}, ${theme.end})`,
            }}
          />
        </div>
      ),
      {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        fonts: [
          { name: 'Noto Sans KR', data: fontBold, style: 'normal' as const, weight: 700 as const },
          {
            name: 'Noto Sans KR',
            data: fontRegular,
            style: 'normal' as const,
            weight: 400 as const,
          },
        ],
        headers: {
          'Cache-Control': 'public, s-maxage=2592000, stale-while-revalidate=2592000',
        },
      }
    );
  } catch (err) {
    console.error('[OG Bundle Error]', err);
    return new Response('Failed to generate bundle OG image', { status: 500 });
  }
}
