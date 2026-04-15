import { GroupResult } from '@/components/features/Compare/GroupResult/GroupResult';
import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';
import { OG_IMAGE_COMPARE, SITE_URL } from '@/lib/seo/constants';

import type { Metadata } from 'next';

type GroupPageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: GroupPageProps): Promise<Metadata> {
  const { token } = await params;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/v1/compare-links/${token}`,
      { next: { revalidate: 60 } }
    );
    const json = await response.json();
    const link = json?.data;

    if (link) {
      const groupName = link.groupName ?? '그룹';
      return {
        title: `'${groupName}' 가치관 비교에 참여하세요!`,
        description: link.bundleTitle,
        openGraph: {
          title: `'${groupName}' 가치관 비교에 참여하세요!`,
          description: link.bundleTitle,
          url: `${SITE_URL}/compare/group/${token}`,
          images: [OG_IMAGE_COMPARE],
        },
        robots: { index: false },
      };
    }
  } catch {
    // fetch ��패 시 기본값
  }

  return {
    title: '가치관 비교에 참여하세요!',
    description: '우리 생각 얼마나 통할까?',
    openGraph: { images: [OG_IMAGE_COMPARE] },
    robots: { index: false },
  };
}

export default async function GroupResultPage({ params }: GroupPageProps) {
  const { token } = await params;

  return (
    <>
      <MainHeader />
      <GroupResult token={token} />
    </>
  );
}
