import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

import { getCategoryTheme } from '@/constants/categoryTheme';
import { BundleV1Poster, BundleV2Badge, BundleV3Stats } from '@/lib/og/bundleVariants';
import { buildFontsArray, loadOgFonts } from '@/lib/og/fonts';
import { OG_HEIGHT, OG_WIDTH } from '@/lib/og/shared';
import type { CategoryCode } from '@/types/hotpick';

export const runtime = 'edge';

type Design = 'v1' | 'v2' | 'v3';

function parseDesign(raw: string | null): Design {
  if (raw === 'v2' || raw === 'v3') {
    return raw;
  }
  return 'v1';
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = (searchParams.get('category') ?? 'TREND') as CategoryCode;
  const participants = Math.max(0, Number(searchParams.get('participants') ?? '0'));
  const questions = Math.max(0, Number(searchParams.get('questions') ?? '0'));
  const design = parseDesign(searchParams.get('design'));
  const bundleTitleRaw = searchParams.get('bundleTitle') ?? undefined;
  const bundleTitle = bundleTitleRaw ? bundleTitleRaw.slice(0, 40) : undefined;

  try {
    const origin = new URL(request.url).origin;
    const fonts = await loadOgFonts(origin);
    const theme = getCategoryTheme(category);

    const props = { participants, questions, theme, bundleTitle, origin };
    const element =
      design === 'v3' ? (
        <BundleV3Stats {...props} />
      ) : design === 'v2' ? (
        <BundleV2Badge {...props} />
      ) : (
        <BundleV1Poster {...props} />
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
