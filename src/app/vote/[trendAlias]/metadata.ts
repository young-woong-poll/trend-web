import { COMMON_METADATA, OG_IMAGE, SITE_KEYWORDS, SITE_NAME } from '@/lib/seo/constants';
import { serverDisplayApi } from '@/services/api/server/display';

import type { Metadata } from 'next';

interface VotePageProps {
  params: Promise<{
    trendAlias: string;
  }>;
  searchParams: Promise<{
    compareId?: string;
  }>;
}

export async function generateMetadata({ params, searchParams }: VotePageProps): Promise<Metadata> {
  try {
    const { trendAlias } = await params;
    const { compareId } = await searchParams;

    const trendData = await serverDisplayApi.getTrendDisplay(trendAlias);
    // TODO : compareId 를 활용해서 nickname 조회 API
    const compareNickname = compareId ? '웅쓰' : undefined;

    const { title: trendTitle, label: description, imageUrl } = trendData;
    const title = compareNickname ? `${compareNickname}님과 비교하는 ${trendTitle}` : trendTitle;

    return {
      title,
      description,
      keywords: SITE_KEYWORDS,
      openGraph: {
        type: 'website',
        siteName: SITE_NAME,
        title,
        description,
        images: imageUrl ? [imageUrl] : [OG_IMAGE],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: imageUrl ? [imageUrl] : [OG_IMAGE.url],
      },
    };
  } catch (error) {
    console.error('Failed to generate metadata:', error);
    return COMMON_METADATA;
  }
}
