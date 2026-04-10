import { GroupResult } from '@/components/features/Compare/GroupResult/GroupResult';
import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';
import { OG_IMAGE_BUNDLE, SITE_URL } from '@/lib/seo/constants';

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
        title: `${groupName} 그룹 초대`,
        description: link.bundleTitle,
        openGraph: {
          title: `${link.creatorNickname}님이 '${groupName}'에 초대했어요`,
          description: link.bundleTitle,
          url: `${SITE_URL}/compare/group/${token}`,
          images: [OG_IMAGE_BUNDLE],
        },
        robots: { index: false },
      };
    }
  } catch {
    // fetch ��패 시 기본값
  }

  return {
    title: '그룹 비교',
    description: '그룹 비교 결과를 확인해보세요',
    openGraph: { images: [OG_IMAGE_BUNDLE] },
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
