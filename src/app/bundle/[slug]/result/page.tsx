import { BundleResult } from '@/components/features/Bundle/BundleResult/BundleResult';
import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';
import { OG_IMAGE_BUNDLE, SITE_URL } from '@/lib/seo/constants';

import type { Metadata } from 'next';

type ResultPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ResultPageProps): Promise<Metadata> {
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
        title: `${bundle.title} 결과`,
        description: '결과를 확인해보세요',
        openGraph: {
          title: `${bundle.title} 결과`,
          description: '결과를 확인해보세요',
          url: `${SITE_URL}/bundle/${slug}/result`,
          images: [OG_IMAGE_BUNDLE],
        },
        robots: { index: false },
      };
    }
  } catch {
    // fetch 실패 시 기본값
  }

  return {
    title: '테스트 결과',
    description: '결과를 확인해보세요',
    openGraph: { images: [OG_IMAGE_BUNDLE] },
    robots: { index: false },
  };
}

export default async function BundleResultPage({ params }: ResultPageProps) {
  const { slug } = await params;

  return (
    <>
      <MainHeader />
      <BundleResult slug={slug} />
    </>
  );
}
