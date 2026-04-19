import { redirect } from 'next/navigation';

import { getInfo } from '@/generated/api/server/compare-link/compare-link';
import { buildCompareOgImageUrl } from '@/lib/seo/compareOgImage';
import { SITE_URL } from '@/lib/seo/constants';

import type { Metadata } from 'next';

type MatchPageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: MatchPageProps): Promise<Metadata> {
  const { token } = await params;

  // 캐시된 OG 이미지/공유 링크 호환을 위해 metadata 유지 (URL은 group으로)
  try {
    const response = await getInfo(token, { next: { revalidate: 60 } });
    const link = response.status === 200 ? response.data.data : null;

    if (link) {
      const creator = link.creatorNickname ?? '친구';
      const bundleTitle = link.bundleTitle ?? '가치관 테스트';
      const title = `${creator}님의 케미 결과 · ${bundleTitle}`;
      const description = '우리 케미가 얼마나 통하는지 확인해 보세요';
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
    // fallback
  }

  return {
    title: '케미 결과',
    description: '우리 케미가 얼마나 통하는지 확인해 보세요',
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
 * 1:1 비교 결과 라우트 deprecated.
 * 멤버별 1:1 비교는 그룹 결과 페이지의 MemberDetailSheet (바텀시트)로 대체.
 * 캐시된 외부 링크 호환을 위해 group 페이지로 redirect.
 */
export default async function CompareMatchPage({ params }: MatchPageProps) {
  const { token } = await params;
  redirect(`/compare/group/${token}`);
}
