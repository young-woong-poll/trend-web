import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

import { getChemistryByGrade } from '@/constants/bundle';
import { getCategoryTheme } from '@/constants/categoryTheme';
import {
  GroupV1Team,
  GroupV2Invited,
  GroupV3Count,
  MatchV1Trophy,
  MatchV2Certificate,
  MatchV3Split,
  PendingV1Boxing,
  PendingV2Duel,
  PendingV3Minimal,
} from '@/lib/og/compareVariants';
import { buildFontsArray, loadOgFonts } from '@/lib/og/fonts';
import { OG_HEIGHT, OG_WIDTH, roundMatchRate, roundMemberCount } from '@/lib/og/shared';
import type { CategoryCode } from '@/types/hotpick';

export const runtime = 'edge';

type Design = 'v1' | 'v2' | 'v3';
type CompareType = 'ONE_TO_ONE' | 'GROUP';
type Status = 'PENDING' | 'DONE';

function parseDesign(raw: string | null): Design {
  if (raw === 'v2' || raw === 'v3') {
    return raw;
  }
  return 'v1';
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = (searchParams.get('category') ?? 'TREND') as CategoryCode;
  const rawType = searchParams.get('type') ?? 'ONE_TO_ONE';
  const type: CompareType = rawType === 'GROUP' ? 'GROUP' : 'ONE_TO_ONE';
  const status: Status = searchParams.get('status') === 'DONE' ? 'DONE' : 'PENDING';
  const design = parseDesign(searchParams.get('design'));

  // DONE 전용
  const grade = searchParams.get('grade') ?? 'B';
  const matchRate = roundMatchRate(Number(searchParams.get('matchRate') ?? '0'));

  // GROUP 전용
  const memberCount = roundMemberCount(Number(searchParams.get('memberCount') ?? '1'));
  const groupNameRaw = searchParams.get('groupName') ?? undefined;
  const groupName = groupNameRaw ? groupNameRaw.slice(0, 20) : undefined;

  // PENDING V2 (편지 메타포) 전용
  const bundleTitleRaw = searchParams.get('bundleTitle') ?? undefined;
  const bundleTitle = bundleTitleRaw ? bundleTitleRaw.slice(0, 40) : undefined;
  const creatorNameRaw = searchParams.get('creatorName') ?? undefined;
  const creatorName = creatorNameRaw ? creatorNameRaw.slice(0, 20) : undefined;

  try {
    const origin = new URL(request.url).origin;
    const fonts = await loadOgFonts(origin);
    const theme = getCategoryTheme(category);

    let element: React.ReactElement;

    if (type === 'GROUP') {
      const props = { theme, memberCount, groupName, origin };
      element =
        design === 'v3' ? (
          <GroupV3Count {...props} />
        ) : design === 'v2' ? (
          <GroupV2Invited {...props} />
        ) : (
          <GroupV1Team {...props} />
        );
    } else if (status === 'DONE') {
      const chemistry = getChemistryByGrade(grade);
      const props = { theme, chemistry, matchRate };
      element =
        design === 'v3' ? (
          <MatchV3Split {...props} />
        ) : design === 'v2' ? (
          <MatchV2Certificate {...props} />
        ) : (
          <MatchV1Trophy {...props} />
        );
    } else {
      const props = { theme, origin, bundleTitle, creatorName };
      element =
        design === 'v3' ? (
          <PendingV3Minimal {...props} />
        ) : design === 'v2' ? (
          <PendingV2Duel {...props} />
        ) : (
          <PendingV1Boxing {...props} />
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
