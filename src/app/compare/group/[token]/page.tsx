import { GroupResult } from '@/components/features/Compare/GroupResult/GroupResult';
import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';
import { getInfo } from '@/generated/api/server/compare-link/compare-link';
import type { CompareLinkInfoResponse } from '@/generated/api/server/openAPIDefinition.schemas';
import { SITE_URL } from '@/lib/seo/constants';

import type { Metadata } from 'next';

type GroupPageProps = {
  params: Promise<{ token: string }>;
};

/** CompareLinkInfoResponse 확장 — 서버 실제 응답에 groupName이 포함됨 */
type GroupCompareLinkInfo = CompareLinkInfoResponse & {
  groupName?: string | null;
};

export async function generateMetadata({ params }: GroupPageProps): Promise<Metadata> {
  const { token } = await params;

  try {
    const response = await getInfo(token, { next: { revalidate: 60 } });
    const link = (response.status === 200 ? response.data.data : null) as
      | GroupCompareLinkInfo
      | null
      | undefined;

    if (link) {
      const groupName = link.groupName ?? '그룹';
      return {
        title: `'${groupName}' 가치관 비교에 참여하세요!`,
        description: link.bundleTitle,
        openGraph: {
          title: `'${groupName}' 가치관 비교에 참여하세요!`,
          description: link.bundleTitle,
          url: `${SITE_URL}/compare/group/${token}`,
          images: [
            {
              url: `${SITE_URL}/api/og/compare?category=${encodeURIComponent(link.categoryCode ?? 'TREND')}&type=GROUP`,
              width: 1200,
              height: 630,
            },
          ],
        },
        robots: { index: false },
      };
    }
  } catch {
    // fetch 실패 시 기본값
  }

  return {
    title: '가치관 비교에 참여하세요!',
    description: '우리 생각 얼마나 통할까?',
    openGraph: {
      images: [
        { url: `${SITE_URL}/api/og/compare?category=TREND&type=GROUP`, width: 1200, height: 630 },
      ],
    },
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
