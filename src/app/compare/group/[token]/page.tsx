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

const FALLBACK_TITLE = '가치관 비교 초대';
const FALLBACK_DESCRIPTION = '친구들과 함께 가치관 비교해요';

function buildGroupDescription(groupName?: string | null, memberCount?: number | null): string {
  if (!groupName || memberCount === undefined || memberCount === null) {
    return FALLBACK_DESCRIPTION;
  }
  return `${groupName} · ${memberCount}명 참여 중`;
}

export async function generateMetadata({ params }: GroupPageProps): Promise<Metadata> {
  const { token } = await params;

  try {
    const response = await getInfo(token, { next: { revalidate: 60 } });
    const link = (response.status === 200 ? response.data.data : null) as
      | GroupCompareLinkInfo
      | null
      | undefined;

    if (link) {
      const title =
        link.bundleTitle && link.bundleTitle.length > 0 ? link.bundleTitle : FALLBACK_TITLE;
      const description = buildGroupDescription(link.groupName, link.participantCount);
      const ogImageUrl = buildCompareOgImageUrl({
        type: 'GROUP',
        categoryCode: link.categoryCode,
        categoryMeta: link.categoryMeta,
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
    title: FALLBACK_TITLE,
    description: FALLBACK_DESCRIPTION,
    openGraph: {
      title: FALLBACK_TITLE,
      description: FALLBACK_DESCRIPTION,
      images: [
        {
          url: buildCompareOgImageUrl({ type: 'GROUP' }),
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
