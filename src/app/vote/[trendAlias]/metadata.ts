import { COMMON_METADATA, OG_IMAGE, SITE_KEYWORDS, SITE_NAME } from '@/lib/seo/constants';
import { serverDisplayApi } from '@/services/api/server/display';

import type { Metadata } from 'next';

interface VotePageProps {
  params: Promise<{
    trendAlias: string;
  }>;
}

export async function generateMetadata({ params }: VotePageProps): Promise<Metadata> {
  try {
    const { trendAlias } = await params;

    const trendData = await serverDisplayApi.getTrendDisplay(trendAlias);

    const { title, label: description, imageUrl1, imageUrl2 } = trendData;

    // 두 이미지가 모두 있으면 합성 OG 이미지 사용
    const ogImageUrl =
      imageUrl1 && imageUrl2
        ? `/api/og?img1=${encodeURIComponent(imageUrl1)}&img2=${encodeURIComponent(imageUrl2)}`
        : OG_IMAGE.url;

    return {
      title,
      description,
      keywords: SITE_KEYWORDS,
      openGraph: {
        type: 'website',
        siteName: SITE_NAME,
        title,
        description,
        images: [ogImageUrl],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl],
      },
    };
  } catch (error) {
    console.error('Failed to generate metadata:', error);
    return COMMON_METADATA;
  }
}
