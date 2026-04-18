import { buildBundleOgImageUrl } from '@/app/bundle/[slug]/metadata';
import { BundleResult } from '@/components/features/Bundle/BundleResult/BundleResult';
import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';
import { getDetail1 } from '@/generated/api/server/bundle/bundle';
import { SITE_URL } from '@/lib/seo/constants';

import type { Metadata } from 'next';

type ResultPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ResultPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const response = await getDetail1(slug, { next: { revalidate: 300 } });
    const bundle = response.status === 200 ? response.data.data : null;

    if (bundle) {
      const ogImageUrl = buildBundleOgImageUrl(
        bundle.categoryCode,
        bundle.participantCount,
        bundle.questionCount
      );

      return {
        title: `${bundle.title} 결과`,
        description: '결과를 확인해보세요',
        openGraph: {
          title: `${bundle.title} 결과`,
          description: '결과를 확인해보세요',
          url: `${SITE_URL}/bundle/${slug}/result`,
          images: [{ url: ogImageUrl, width: 1200, height: 630 }],
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
    openGraph: { images: [{ url: buildBundleOgImageUrl(), width: 1200, height: 630 }] },
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
