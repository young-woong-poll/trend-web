import { CompareLanding } from '@/components/features/Compare/CompareLanding/CompareLanding';
import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';
import { OG_IMAGE_COMPARE, SITE_URL } from '@/lib/seo/constants';

import type { Metadata } from 'next';

type ComparePageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: ComparePageProps): Promise<Metadata> {
  const { token } = await params;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/v1/compare-links/${token}`,
      { next: { revalidate: 60 } }
    );
    const json = await response.json();
    const link = json?.data;

    if (link) {
      return {
        title: `${link.creatorNickname}님이 가치관 대결을 신청했어요!`,
        description: link.bundleTitle,
        openGraph: {
          title: `${link.creatorNickname}님이 가치관 대결을 신청했어요!`,
          description: link.bundleTitle,
          url: `${SITE_URL}/compare/${token}`,
          images: [OG_IMAGE_COMPARE],
        },
        robots: { index: false },
      };
    }
  } catch {
    // fetch 실패 시 기본값
  }

  return {
    title: '가치관 대결을 신청했어요!',
    description: '우리 생각 얼마나 통할까?',
    openGraph: { images: [OG_IMAGE_COMPARE] },
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
