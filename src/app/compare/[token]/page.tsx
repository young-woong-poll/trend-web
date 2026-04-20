import { redirect } from 'next/navigation';

import { getInfo } from '@/generated/api/server/compare-link/compare-link';
import { buildCompareOgImageUrl } from '@/lib/seo/compareOgImage';
import { SITE_URL } from '@/lib/seo/constants';

import type { Metadata } from 'next';

type ComparePageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: ComparePageProps): Promise<Metadata> {
  const { token } = await params;

  // 캐시된 OG 이미지 호환을 위해 metadata는 유지 (단, URL은 group으로)
  try {
    const response = await getInfo(token, { next: { revalidate: 60 } });
    const link = response.status === 200 ? response.data.data : null;

    if (link) {
      const creator = link.creatorNickname ?? '친구';
      const bundleTitle = link.bundleTitle ?? '가치관 테스트';
      const title = `${creator}님의 가치관 비교 초대 · ${bundleTitle}`;
      const description = '우리 가치관, 얼마나 통하는지 맞춰볼까요?';
      const ogImageUrl = buildCompareOgImageUrl({
        type: 'GROUP',
        categoryCode: link.categoryCode,
        memberCount: 1,
        bundleTitle: link.bundleTitle ?? undefined,
      });

      return {
        title,
        description,
        openGraph: {
          title,
          description,
          url: `${SITE_URL}/compare/group/${token}`,
          images: [{ url: ogImageUrl, width: 1200, height: 630 }],
        },
        robots: { index: false },
      };
    }
  } catch {
    // fallback to default
  }

  return {
    title: '가치관 비교 초대',
    description: '우리 가치관, 얼마나 통하는지 맞춰볼까요?',
    openGraph: {
      images: [
        {
          url: buildCompareOgImageUrl({ type: 'GROUP', memberCount: 1 }),
          width: 1200,
          height: 630,
        },
      ],
    },
    robots: { index: false },
  };
}

/**
 * 1:1 비교 라우트 deprecated — 모든 토큰이 그룹으로 마이그레이션됨.
 * 서버 사이드 redirect로 SEO/캐시된 링크 호환.
 */
export default async function ComparePage({ params }: ComparePageProps) {
  const { token } = await params;
  redirect(`/compare/group/${token}`);
}
