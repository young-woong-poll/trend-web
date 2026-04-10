import { CompareResult } from '@/components/features/Compare/CompareResult/CompareResult';
import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';
import { OG_IMAGE_BUNDLE, SITE_URL } from '@/lib/seo/constants';

import type { Metadata } from 'next';

type MatchPageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: MatchPageProps): Promise<Metadata> {
  const { token } = await params;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/v1/compare-links/${token}`,
      { next: { revalidate: 60 } }
    );
    const json = await response.json();
    const link = json?.data;

    if (link) {
      const creator = link.creatorNickname;
      const participant = link.participantNickname;
      const title = participant ? `${creator} vs ${participant}` : `${creator}의 비교 결과`;

      return {
        title,
        description: link.bundleTitle,
        openGraph: {
          title,
          description: link.bundleTitle,
          url: `${SITE_URL}/compare/match/${token}`,
          images: [OG_IMAGE_BUNDLE],
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
    openGraph: { images: [OG_IMAGE_BUNDLE] },
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
