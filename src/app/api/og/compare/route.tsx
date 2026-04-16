import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

import { getChemistryByGrade } from '@/constants/bundle';
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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get('category') ?? 'TREND';
  const type = searchParams.get('type') ?? 'ONE_TO_ONE';
  const grade = searchParams.get('grade');

  if (type === 'MATCH' && !grade) {
    return new Response('Missing grade parameter for MATCH type', { status: 400 });
  }

  try {
    const [fontBold, fontRegular] = await Promise.all([fontBoldPromise, fontRegularPromise]);
    const theme = getCategoryTheme(category as CategoryCode);
    const highlightBg = `linear-gradient(180deg, transparent 55%, rgba(${theme.startRgb}, 0.3) 55%)`;

    let centerContent: React.ReactElement;

    if (type === 'ONE_TO_ONE') {
      centerContent = (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* VS 크게 + 형광펜 */}
          <span
            style={{
              fontSize: '96px',
              fontWeight: 900,
              color: '#222',
              backgroundImage: highlightBg,
              padding: '0 16px',
              lineHeight: 1.5,
            }}
          >
            VS
          </span>
          {/* 서브 텍스트 형광펜 */}
          <span
            style={{
              fontSize: '44px',
              fontWeight: 700,
              color: '#222',
              backgroundImage: highlightBg,
              padding: '0 12px',
              lineHeight: 1.7,
              marginTop: '8px',
            }}
          >
            1:1 가치관 대결
          </span>
          <span style={{ fontSize: '28px', color: '#888', marginTop: '12px' }}>
            우리 생각 얼마나 같을까?
          </span>
        </div>
      );
    } else if (type === 'GROUP') {
      centerContent = (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span
              style={{
                fontSize: '72px',
                fontWeight: 900,
                color: '#222',
                backgroundImage: highlightBg,
                padding: '0 12px',
                lineHeight: 1.5,
              }}
            >
              그룹
            </span>
            <span
              style={{
                fontSize: '48px',
                fontWeight: 400,
                color: '#555',
                marginLeft: '8px',
              }}
            >
              가치관 비교
            </span>
          </div>
          <span
            style={{
              fontSize: '36px',
              fontWeight: 700,
              color: '#333',
              backgroundImage: highlightBg,
              padding: '0 10px',
              lineHeight: 1.7,
              marginTop: '12px',
            }}
          >
            친구들과 생각을 비교해보세요
          </span>
        </div>
      );
    } else {
      // MATCH — 큰 등급 + 형광펜 타이틀
      const chemistry = getChemistryByGrade(grade!);
      centerContent = (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* 큰 등급 글자 */}
          <span
            style={{
              fontSize: '160px',
              fontWeight: 900,
              lineHeight: 1,
              backgroundImage: chemistry.gradient,
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {chemistry.grade}
          </span>
          {/* 타이틀 형광펜 */}
          <span
            style={{
              fontSize: '44px',
              fontWeight: 900,
              color: '#222',
              backgroundImage: highlightBg,
              padding: '0 12px',
              lineHeight: 1.7,
              marginTop: '8px',
            }}
          >
            {chemistry.title}
          </span>
          {/* 서브 설명 */}
          <span style={{ fontSize: '26px', color: '#888', marginTop: '8px' }}>
            {chemistry.description}
          </span>
        </div>
      );
    }

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

          {centerContent}

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
    console.error('[OG Compare Error]', err);
    return new Response('Failed to generate compare OG image', { status: 500 });
  }
}
