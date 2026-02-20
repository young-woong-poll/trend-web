import { getTrendDetail } from '@/generated/api/server/display/display';
import { COMMON_METADATA, OG_IMAGE, SITE_KEYWORDS, SITE_NAME } from '@/lib/seo/constants';

import type { Metadata } from 'next';

interface HotpickPageProps {
  params: Promise<{
    hotpickAlias: string;
  }>;
}

export async function generateMetadata({ params }: HotpickPageProps): Promise<Metadata> {
  try {
    const { hotpickAlias } = await params;

    const response = await getTrendDetail(hotpickAlias, { next: { revalidate: 60 } });
    const hotpickData = response.status === 200 ? response.data.data : null;

    if (!hotpickData) {
      return COMMON_METADATA;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hotpickType = (hotpickData as any)?.type as string | undefined;
    const { title } = hotpickData;

    // SINGLE: 옵션 기반 description 생성
    let description = hotpickData.label ?? '';
    if (hotpickType === 'SINGLE') {
      const options = hotpickData.items?.[0]?.options ?? [];
      if (options.length >= 2) {
        const optionTexts = options.map((o) => o.title).join(' vs ');
        description = `${optionTexts} - 지금 바로 투표하세요!`;
      }
    }

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
