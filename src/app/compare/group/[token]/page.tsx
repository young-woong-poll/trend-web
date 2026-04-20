import { GroupResult } from '@/components/features/Compare/GroupResult/GroupResult';
import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';
import { getInfo } from '@/generated/api/server/compare-link/compare-link';
import type { CompareLinkInfoResponse } from '@/generated/api/server/openAPIDefinition.schemas';
import { buildCompareOgImageUrl } from '@/lib/seo/compareOgImage';
import { SITE_URL } from '@/lib/seo/constants';

import type { Metadata } from 'next';

type GroupPageProps = {
  params: Promise<{ token: string }>;
};

/** CompareLinkInfoResponse 확장 — 서버 실제 응답에 groupName이 포함됨 */
type GroupCompareLinkInfo = CompareLinkInfoResponse & {
  groupName?: string | null;
  memberCount?: number | null;
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
      const bundleTitle = link.bundleTitle ?? '가치관 테스트';
      const memberCount = link.memberCount ?? 1;
      const title = `'${groupName}' · ${bundleTitle}`;
      const description = '우리 가치관, 얼마나 통하는지 맞춰볼까요?';
      const ogImageUrl = buildCompareOgImageUrl({
        type: 'GROUP',
        categoryCode: link.categoryCode,
        memberCount,
        groupName: link.groupName ?? undefined,
        bundleTitle: link.bundleTitle ?? undefined,
      });

      return {
        title,
        description,
        openGraph: {
          title,
          description,
          url: `${SITE_URL}/compare/group/${token}`,
          images: [{ url: ogImageUrl, width: 1200, height: 630 }],
        },
        robots: { index: false },
      };
    }
  } catch {
    // fetch 실패 시 기본값
  }

  return {
    title: '가치관 비교 초대',
    description: '우리 가치관, 얼마나 통하는지 맞춰볼까요?',
    openGraph: {
      images: [
        {
          url: buildCompareOgImageUrl({ type: 'GROUP', memberCount: 1 }),
          width: 1200,
          height: 630,
        },
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
