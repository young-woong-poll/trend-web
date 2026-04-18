import { CompareResult } from '@/components/features/Compare/CompareResult/CompareResult';
import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';
import { getChemistryByRate } from '@/constants/bundle';
import { getInfo } from '@/generated/api/server/compare-link/compare-link';
import type { CompareLinkInfoResponse } from '@/generated/api/server/openAPIDefinition.schemas';
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
      const creator = link.creatorNickname;
      const participant = link.participantNickname;
      const title = participant ? `${creator} vs ${participant}` : `${creator}의 비교 결과`;

      const chemistry = getChemistryByRate(link.matchRate ?? 0);
      const ogImageUrl = `${SITE_URL}/api/og/compare?category=${encodeURIComponent(link.categoryCode ?? 'TREND')}&type=MATCH&grade=${chemistry.grade}`;

      return {
        title,
        description: link.bundleTitle,
        openGraph: {
          title,
          description: link.bundleTitle,
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
    title: '비교 결과',
    description: '궁합 결과를 확인해보세요',
    openGraph: {
      images: [
        {
          url: `${SITE_URL}/api/og/compare?category=TREND&type=MATCH&grade=B`,
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
