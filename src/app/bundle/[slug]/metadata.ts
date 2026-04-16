import { SITE_URL } from '@/lib/seo/constants';

import type { Metadata } from 'next';

type MetadataProps = {
  params: Promise<{ slug: string }>;
};

/** 참여 수를 구간별 반올림하여 OG 이미지 캐시 키를 안정화 */
function roundParticipants(n: number): number {
  if (n < 10) {
    return 0;
  }
  if (n < 100) {
    return Math.floor(n / 10) * 10;
  }
  if (n < 1000) {
    return Math.floor(n / 100) * 100;
  }
  if (n < 10000) {
    return Math.floor(n / 1000) * 1000;
  }
  return Math.floor(n / 5000) * 5000;
}

function buildBundleOgImageUrl(
  categoryCode?: string,
  participantCount?: number,
  questionCount?: number
): string {
  const rounded = roundParticipants(participantCount ?? 0);
  return `${SITE_URL}/api/og/bundle?category=${encodeURIComponent(categoryCode ?? 'TREND')}&participants=${rounded}&questions=${questionCount ?? 0}`;
}

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
      const ogImageUrl = buildBundleOgImageUrl(
        bundle.categoryCode,
        bundle.participantCount,
        bundle.questionCount
      );

      return {
        title: bundle.title,
        description: '테스트하고 친구들과 가치관을 비교하세요!',
        openGraph: {
          title: bundle.title,
          description: '테스트하고 친구들과 가치관을 비교하세요!',
          url: `${SITE_URL}/bundle/${slug}`,
          images: [{ url: ogImageUrl, width: 1200, height: 630 }],
        },
      };
    }
  } catch {
    // fetch 실패 시 기본값 사용
  }

  return {
    title: '번들',
    description: '테스트하고 친구들과 가치관을 비교하세요!',
    openGraph: { images: [{ url: buildBundleOgImageUrl(), width: 1200, height: 630 }] },
  };
}
