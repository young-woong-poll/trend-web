import { getDetail } from '@/generated/api/server/hotpick/hotpick';
import { COMMON_METADATA, SITE_KEYWORDS, SITE_NAME, SITE_URL } from '@/lib/seo/constants';

import type { Metadata } from 'next';

interface HotpickPageProps {
  params: Promise<{
    hotpickAlias: string;
  }>;
}

export async function generateMetadata({ params }: HotpickPageProps): Promise<Metadata> {
  try {
    const { hotpickAlias } = await params;

    const response = await getDetail(hotpickAlias, { next: { revalidate: 60 } });
    const hotpickData = response.status === 200 ? response.data.data : null;

    if (!hotpickData) {
      return COMMON_METADATA;
    }

    const hotpick = hotpickData.hotpick;
    const election = hotpick?.election;
    const title = election?.title ?? hotpick?.slug ?? '';

    // SINGLE: 옵션 기반 description 생성
    let description = '';
    const items = election?.items ?? [];
    if (items.length >= 2) {
      const optionTexts = items.map((item) => item.title).join(' vs ');
      description = `${optionTexts} - 지금 바로 투표하세요!`;
    }

    const canonicalUrl = `${SITE_URL}/hotpick/${hotpickAlias}`;

    return {
      title,
      description,
      keywords: SITE_KEYWORDS,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        type: 'website',
        siteName: SITE_NAME,
        title,
        description,
        url: canonicalUrl,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
    };
  } catch (error) {
    console.error('Failed to generate metadata:', error);
    return COMMON_METADATA;
  }
}
