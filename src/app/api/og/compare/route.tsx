import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

import { getChemistryByGrade } from '@/constants/bundle';
import { getCategoryTheme } from '@/constants/categoryTheme';
import {
  GroupV2Invited,
  MatchV1Trophy,
  MatchV2Certificate,
  MatchV3Split,
  PendingV2Duel,
} from '@/lib/og/compareVariants';
import { buildFontsArray, loadOgFonts } from '@/lib/og/fonts';
import { OG_HEIGHT, OG_WIDTH, roundMatchRate, roundMemberCount } from '@/lib/og/shared';
import type { CategoryCode } from '@/types/hotpick';

export const runtime = 'edge';

type CompareType = 'ONE_TO_ONE' | 'GROUP';
type Status = 'PENDING' | 'DONE';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = (searchParams.get('category') ?? 'TREND') as CategoryCode;
  const rawType = searchParams.get('type') ?? 'ONE_TO_ONE';
  const type: CompareType = rawType === 'GROUP' ? 'GROUP' : 'ONE_TO_ONE';
  const status: Status = searchParams.get('status') === 'DONE' ? 'DONE' : 'PENDING';
  // MATCH는 현재 프로토타입 단계 (V1/V2/V3). GROUP/PENDING은 V2 확정이라 design 무시.
  const rawDesign = searchParams.get('design');
  const design: 'v1' | 'v2' | 'v3' = rawDesign === 'v1' || rawDesign === 'v3' ? rawDesign : 'v2';

  // DONE 전용
  const grade = searchParams.get('grade') ?? 'B';
  const matchRate = roundMatchRate(Number(searchParams.get('matchRate') ?? '0'));

  // GROUP 전용
  const memberCount = roundMemberCount(Number(searchParams.get('memberCount') ?? '1'));
  const groupNameRaw = searchParams.get('groupName') ?? undefined;
  const groupName = groupNameRaw ? groupNameRaw.slice(0, 20) : undefined;

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
      // MATCH — V1/V2/V3 프로토타입. design 쿼리로 분기.
      const chemistry = getChemistryByGrade(grade);
      const matchProps = {
        theme,
        chemistry,
        matchRate,
        bundleTitle,
        creatorName,
        participantName,
        origin,
      };
      element =
        design === 'v1' ? (
          <MatchV1Trophy {...matchProps} />
        ) : design === 'v3' ? (
          <MatchV3Split {...matchProps} />
        ) : (
          <MatchV2Certificate {...matchProps} />
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
