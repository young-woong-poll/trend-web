import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

import { getCategoryTheme, type CategoryTheme } from '@/constants/categoryTheme';
import { BundleV3Stats } from '@/lib/og/bundleVariants';
import { buildFontsArray, loadOgFonts } from '@/lib/og/fonts';
import { OG_HEIGHT, OG_WIDTH } from '@/lib/og/shared';
import type { CategoryCode } from '@/types/hotpick';

export const runtime = 'edge';

const HEX_RE = /^[0-9a-fA-F]{6}$/;

function hexToRgb(hex: string): string {
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

/** URL 쿼리로 받은 start/end hex 값을 CategoryTheme으로 변환. 유효하지 않으면 undefined. */
function themeFromColorQuery(start: string | null, end: string | null): CategoryTheme | undefined {
  if (!start || !end || !HEX_RE.test(start) || !HEX_RE.test(end)) {
    return undefined;
  }
  return {
    start: `#${start.toUpperCase()}`,
    end: `#${end.toUpperCase()}`,
    startRgb: hexToRgb(start),
    endRgb: hexToRgb(end),
    emoji: '',
    label: '',
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const bundleTitleRaw = searchParams.get('bundleTitle') ?? undefined;
  const bundleTitle = bundleTitleRaw ? bundleTitleRaw.slice(0, 40) : undefined;

  try {
    const origin = new URL(request.url).origin;
    const fonts = await loadOgFonts(origin);

    // BE categoryMeta에서 전달된 start/end 색상 우선.
    // 없으면 categoryCode로 fallback (대소문자 관대하게 정규화).
    const queryTheme = themeFromColorQuery(searchParams.get('start'), searchParams.get('end'));
    const categoryCode = (searchParams.get('category') ?? 'TREND').toUpperCase() as CategoryCode;
    const theme = queryTheme ?? getCategoryTheme(categoryCode);

    // Bundle은 V3(Tilted Card)로 확정. slug당 1장 캐싱 전략 — 참여자 수는 metadata description으로만 노출.
    const element = <BundleV3Stats theme={theme} bundleTitle={bundleTitle} origin={origin} />;

    const isDev = process.env.NODE_ENV !== 'production';
    return new ImageResponse(element, {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      fonts: buildFontsArray(fonts),
      headers: {
        'Cache-Control': isDev
          ? 'no-store, no-cache, must-revalidate'
          : 'public, s-maxage=2592000, stale-while-revalidate=2592000',
      },
    });
  } catch (err) {
    console.error('[OG Bundle Error]', err);
    return new Response('Failed to generate bundle OG image', { status: 500 });
  }
}
