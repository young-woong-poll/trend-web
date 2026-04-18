import { CompareLanding } from '@/components/features/Compare/CompareLanding/CompareLanding';
import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';
import { getInfo } from '@/generated/api/server/compare-link/compare-link';
import { buildCompareOgImageUrl } from '@/lib/seo/compareOgImage';
import { SITE_URL } from '@/lib/seo/constants';

import type { Metadata } from 'next';

type ComparePageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: ComparePageProps): Promise<Metadata> {
  const { token } = await params;

  try {
    const response = await getInfo(token, { next: { revalidate: 60 } });
    const link = response.status === 200 ? response.data.data : null;

    if (link) {
      const creator = link.creatorNickname ?? '친구';
      const bundleTitle = link.bundleTitle ?? '가치관 테스트';
      const title = `⚔️ ${creator}님이 "${bundleTitle}"를 신청했어요`;
      const description = '받아들이고 우리 생각 맞춰볼래요?';
      const ogImageUrl = buildCompareOgImageUrl({
        type: 'ONE_TO_ONE',
        status: 'PENDING',
        categoryCode: link.categoryCode,
        bundleTitle: link.bundleTitle,
        creatorName: link.creatorNickname,
      });

      return {
        title,
        description,
        openGraph: {
          title,
          description,
          url: `${SITE_URL}/compare/${token}`,
          images: [{ url: ogImageUrl, width: 1200, height: 630 }],
        },
        robots: { index: false },
      };
    }
  } catch {
    // fetch 실패 시 기본값
  }

  return {
    title: '⚔️ 가치관 대결을 신청했어요!',
    description: '우리 생각 얼마나 통할까?',
    openGraph: {
      images: [
        {
          url: buildCompareOgImageUrl({ type: 'ONE_TO_ONE', status: 'PENDING' }),
          width: 1200,
          height: 630,
        },
      ],
    },
    robots: { index: false },
  };
}

export default async function ComparePage({ params }: ComparePageProps) {
  const { token } = await params;

  return (
    <>
      <MainHeader />
      <CompareLanding token={token} />
    </>
  );
}
