import { COMMON_METADATA } from '@/lib/seo/constants';
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

    const { title, label: description, imageUrl } = trendData;

    return {
      title,
      description,
      keywords: COMMON_METADATA.keywords,
      openGraph: {
        type: 'website',
        siteName: COMMON_METADATA.openGraph?.siteName,
        title,
        description,
        images: imageUrl ? [imageUrl] : COMMON_METADATA.openGraph?.images,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: imageUrl ? [imageUrl] : COMMON_METADATA.openGraph?.images,
      },
    };
  } catch (error) {
    console.error('Failed to generate metadata:', error);
    return {
      title: '투표',
      description: '당신의 선택은?',
    };
  }
}
