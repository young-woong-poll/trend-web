import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

import { getChemistryByGrade } from '@/constants/bundle';
import { getCategoryTheme } from '@/constants/categoryTheme';
import {
  GroupV2Invited,
  MatchV2Certificate,
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
      // GROUP은 V2(편지/초대장)로 확정. design 쿼리 무시.
      element = (
        <GroupV2Invited
          theme={theme}
          memberCount={memberCount}
          groupName={groupName}
          bundleTitle={bundleTitle}
          origin={origin}
        />
      );
    } else if (status === 'DONE') {
      // MATCH는 V2(Certificate)로 확정. design 쿼리 무시.
      const chemistry = getChemistryByGrade(grade);
      element = <MatchV2Certificate theme={theme} chemistry={chemistry} matchRate={matchRate} />;
    } else {
      // PENDING — V1 제거됨. V3(Bold Minimal) 또는 V2(Challenge Letter, 기본)
      const props = { theme, origin, bundleTitle, creatorName };
      element = design === 'v3' ? <PendingV3Minimal {...props} /> : <PendingV2Duel {...props} />;
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
