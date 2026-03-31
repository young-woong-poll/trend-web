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
        title: `${bundle.title} | HotPick`,
        description: bundle.subtitle ?? '우리 생각 얼마나 통할까? 가치관을 비교해보세요.',
        openGraph: {
          title: `${bundle.title} - 우리 생각 얼마나 통할까?`,
          description: bundle.subtitle ?? '가치관을 비교해보세요.',
          url: `https://hotpick.kr/bundle/${slug}`,
          images: bundle.imageUrl ? [{ url: bundle.imageUrl }] : undefined,
        },
      };
    }
  } catch {
    // fetch 실패 시 기본값 사용
  }

  return {
    title: '번들 | HotPick',
    description: '우리 생각 얼마나 통할까? 가치관을 비교해보세요.',
    openGraph: {
      title: '번들 | HotPick',
      description: '우리 생각 얼마나 통할까?',
      url: `https://hotpick.kr/bundle/${slug}`,
    },
  };
}
