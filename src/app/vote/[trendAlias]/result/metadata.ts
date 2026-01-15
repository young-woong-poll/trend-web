import { SITE_NAME, OG_IMAGE, COMMON_METADATA, SITE_KEYWORDS } from '@/lib/seo/constants';

import type { Metadata } from 'next';

export const defaultMetadata: Metadata = {
  ...COMMON_METADATA,
  title: '나의 핫픽 결과는?',
  description: '투표 결과를 확인해보세요!',
};

export function createResultMetadata(): Metadata {
  const title = '나의 핫픽 결과는?';
  const description = '투표 결과를 확인해보세요!';

  return {
    title,
    description,
    keywords: SITE_KEYWORDS,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: SITE_NAME,
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [OG_IMAGE.url],
    },
  };
}
