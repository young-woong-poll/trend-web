import { CompareResult } from '@/components/features/Compare/CompareResult/CompareResult';
import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';
import { getChemistryByRate } from '@/constants/bundle';
import { getInfo } from '@/generated/api/server/compare-link/compare-link';
import type { CompareLinkInfoResponse } from '@/generated/api/server/openAPIDefinition.schemas';
import { buildCompareOgImageUrl } from '@/lib/seo/compareOgImage';
import { SITE_URL } from '@/lib/seo/constants';

import type { Metadata } from 'next';

type MatchPageProps = {
  params: Promise<{ token: string }>;
};

/** CompareLinkInfoResponse 확장 — 서버 실제 응답에 matchRate이 포함됨 */
type MatchCompareLinkInfo = CompareLinkInfoResponse & {
  matchRate?: number;
};

export async function generateMetadata({ params }: MatchPageProps): Promise<Metadata> {
  const { token } = await params;

  try {
    const response = await getInfo(token, { next: { revalidate: 60 } });
    const link = (response.status === 200 ? response.data.data : null) as
      | MatchCompareLinkInfo
      | null
      | undefined;

    if (link) {
      const creator = link.creatorNickname ?? '친구';
      const participant = link.participantNickname;
      const bundleTitle = link.bundleTitle ?? '가치관 테스트';
      const matchRate = link.matchRate ?? 0;
      const chemistry = getChemistryByRate(matchRate);
      const vsTitle = participant ? `${creator} vs ${participant}` : `${creator}의 비교 결과`;
      const title = `🏆 ${vsTitle} · ${bundleTitle}`;
      const description = `매치율 ${matchRate}% · ${chemistry.title}`;
      const ogImageUrl = buildCompareOgImageUrl({
        type: 'ONE_TO_ONE',
        status: 'DONE',
        categoryCode: link.categoryCode,
        grade: chemistry.grade,
        matchRate,
        bundleTitle: link.bundleTitle,
        creatorName: link.creatorNickname,
        participantName: link.participantNickname,
      });

      return {
        title,
        description,
        openGraph: {
          title,
          description,
          url: `${SITE_URL}/compare/match/${token}`,
          images: [{ url: ogImageUrl, width: 1200, height: 630 }],
        },
        robots: { index: false },
      };
    }
  } catch {
    // fetch 실패 시 기본값
  }

  return {
    title: '🏆 가치관 비교 결과',
    description: '우리 궁합은 몇 점?',
    openGraph: {
      images: [
        {
          url: buildCompareOgImageUrl({
            type: 'ONE_TO_ONE',
            status: 'DONE',
            grade: 'B',
            matchRate: 50,
          }),
          width: 1200,
          height: 630,
        },
      ],
    },
    robots: { index: false },
  };
}

export default async function CompareMatchPage({ params }: MatchPageProps) {
  const { token } = await params;

  return (
    <>
      <MainHeader />
      <CompareResult token={token} />
    </>
  );
}
