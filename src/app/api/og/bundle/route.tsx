import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

import { getCategoryTheme } from '@/constants/categoryTheme';
import { BundleV3Stats } from '@/lib/og/bundleVariants';
import { buildFontsArray, loadOgFonts } from '@/lib/og/fonts';
import { OG_HEIGHT, OG_WIDTH } from '@/lib/og/shared';
import type { CategoryCode } from '@/types/hotpick';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = (searchParams.get('category') ?? 'TREND') as CategoryCode;
  const participants = Math.max(0, Number(searchParams.get('participants') ?? '0'));
  const questions = Math.max(0, Number(searchParams.get('questions') ?? '0'));
  const bundleTitleRaw = searchParams.get('bundleTitle') ?? undefined;
  const bundleTitle = bundleTitleRaw ? bundleTitleRaw.slice(0, 40) : undefined;

  try {
    const origin = new URL(request.url).origin;
    const fonts = await loadOgFonts(origin);
    const theme = getCategoryTheme(category);

    // Bundle은 V3(Tilted Card)로 확정. design 쿼리 무시.
    const element = (
      <BundleV3Stats
        participants={participants}
        questions={questions}
        theme={theme}
        bundleTitle={bundleTitle}
        origin={origin}
      />
    );

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
