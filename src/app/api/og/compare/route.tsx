import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

import { getChemistryByGrade } from '@/constants/bundle';
import { getCategoryTheme, type CategoryTheme } from '@/constants/categoryTheme';
import { GroupV2Invited, MatchV2Certificate, PendingV2Duel } from '@/lib/og/compareVariants';
import { buildFontsArray, loadOgFonts } from '@/lib/og/fonts';
import { OG_HEIGHT, OG_WIDTH, clampMatchRate } from '@/lib/og/shared';
import type { CategoryCode } from '@/types/hotpick';

export const runtime = 'edge';

type CompareType = 'ONE_TO_ONE' | 'GROUP';
type Status = 'PENDING' | 'DONE';

const HEX_RE = /^[0-9a-fA-F]{6}$/;

function hexToRgb(hex: string): string {
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

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
  const rawType = searchParams.get('type') ?? 'ONE_TO_ONE';
  const type: CompareType = rawType === 'GROUP' ? 'GROUP' : 'ONE_TO_ONE';
  const status: Status = searchParams.get('status') === 'DONE' ? 'DONE' : 'PENDING';

  // DONE 전용
  const grade = searchParams.get('grade') ?? 'B';
  const matchRate = clampMatchRate(Number(searchParams.get('matchRate') ?? '0'));

  // PENDING/GROUP/MATCH 공통 (자유 텍스트)
  const bundleTitleRaw = searchParams.get('bundleTitle') ?? undefined;
  const bundleTitle = bundleTitleRaw ? bundleTitleRaw.slice(0, 40) : undefined;
  const creatorNameRaw = searchParams.get('creatorName') ?? undefined;
  const creatorName = creatorNameRaw ? creatorNameRaw.slice(0, 20) : undefined;

  // MATCH 전용
  const participantNameRaw = searchParams.get('participantName') ?? undefined;
  const participantName = participantNameRaw ? participantNameRaw.slice(0, 20) : undefined;

  try {
    const origin = new URL(request.url).origin;
    const fonts = await loadOgFonts(origin);

    // BE categoryMeta에서 전달된 start/end 색상 우선. 없으면 categoryCode로 fallback (대소문자 정규화).
    const queryTheme = themeFromColorQuery(searchParams.get('start'), searchParams.get('end'));
    const categoryCode = (searchParams.get('category') ?? 'TREND').toUpperCase() as CategoryCode;
    const theme = queryTheme ?? getCategoryTheme(categoryCode);

    let element: React.ReactElement;

    if (type === 'GROUP') {
      // GROUP은 V2(편지/초대장)로 확정. 이미지는 번들 단위로 캐싱 — 그룹명/인원수 없음.
      element = <GroupV2Invited theme={theme} bundleTitle={bundleTitle} origin={origin} />;
    } else if (status === 'DONE') {
      // MATCH는 V2(Game Complete)로 확정
      const chemistry = getChemistryByGrade(grade);
      element = (
        <MatchV2Certificate
          theme={theme}
          chemistry={chemistry}
          matchRate={matchRate}
          bundleTitle={bundleTitle}
          creatorName={creatorName}
          participantName={participantName}
        />
      );
    } else {
      // PENDING은 V2(Challenge Letter)로 확정. design 쿼리 무시.
      element = (
        <PendingV2Duel
          theme={theme}
          origin={origin}
          bundleTitle={bundleTitle}
          creatorName={creatorName}
        />
      );
    }

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
    console.error('[OG Compare Error]', err);
    return new Response('Failed to generate compare OG image', { status: 500 });
  }
}
