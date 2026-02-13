import { getTrendDetail } from '@/generated/api/server/display/display';
import { COMMON_METADATA, OG_IMAGE, SITE_KEYWORDS, SITE_NAME } from '@/lib/seo/constants';

import type { Metadata } from 'next';

interface VotePageProps {
  params: Promise<{
    hotpickAlias: string;
  }>;
}

export async function generateMetadata({ params }: VotePageProps): Promise<Metadata> {
  try {
    const { hotpickAlias } = await params;

    const response = await getTrendDetail(hotpickAlias, { next: { revalidate: 60 } });
    const hotpickData = response.status === 200 ? response.data.data : null;

    if (!hotpickData) {
      return COMMON_METADATA;
    }

    const { title, label: description } = hotpickData;

    return {
      title,
      description,
      keywords: SITE_KEYWORDS,
      openGraph: {
        type: 'website',
        siteName: SITE_NAME,
        title,
        description,
        images: [OG_IMAGE],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [OG_IMAGE.url],
      },
    };
  } catch (error) {
    console.error('Failed to generate metadata:', error);
    return COMMON_METADATA;
  }
}
