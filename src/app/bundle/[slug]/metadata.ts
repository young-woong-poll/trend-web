import { OG_IMAGE_BUNDLE, SITE_URL } from '@/lib/seo/constants';

import type { Metadata } from 'next';

type MetadataProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/v1/bundles/${slug}`,
      { next: { revalidate: 300 } }
    );
    const json = await response.json();
    const bundle = json?.data;

    if (bundle) {
      return {
        title: bundle.title,
        description: '테스트하고 친구들과 가치관을 비교하세요!',
        openGraph: {
          title: bundle.title,
          description: '테스트하고 친구들과 가치관을 비교하세요!',
          url: `${SITE_URL}/bundle/${slug}`,
          images: [OG_IMAGE_BUNDLE],
        },
      };
    }
  } catch {
    // fetch 실패 시 기본값 사용
  }

  return {
    title: '번들',
    description: '테스트하고 친구들과 가치관을 비교하세요!',
    openGraph: { images: [OG_IMAGE_BUNDLE] },
  };
}
