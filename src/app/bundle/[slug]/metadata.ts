import { getDetail1 } from '@/generated/api/server/bundle/bundle';
import { SITE_URL } from '@/lib/seo/constants';

import type { Metadata } from 'next';

type MetadataProps = {
  params: Promise<{ slug: string }>;
};

/** Bundle OG 확정 디자인. 현재는 프로토타입 검토 중 — 확정 후 업데이트. */
const BUNDLE_OG_DESIGN = 'v1';

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

export function buildBundleOgImageUrl(
  categoryCode?: string,
  participantCount?: number,
  questionCount?: number
): string {
  const rounded = roundParticipants(participantCount ?? 0);
  const params = new URLSearchParams({
    design: BUNDLE_OG_DESIGN,
    category: categoryCode ?? 'TREND',
    participants: String(rounded),
    questions: String(questionCount ?? 0),
  });
  return `${SITE_URL}/api/og/bundle?${params.toString()}`;
}

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const response = await getDetail1(slug, { next: { revalidate: 300 } });
    const bundle = response.status === 200 ? response.data.data : null;

    if (bundle?.title) {
      const ogImageUrl = buildBundleOgImageUrl(
        bundle.categoryCode,
        bundle.participantCount,
        bundle.questionCount
      );
      const participantText = bundle.participantCount
        ? `${bundle.participantCount.toLocaleString()}명이 답한 `
        : '';
      const description = `${participantText}${bundle.questionCount ?? 0}문항 가치관 테스트`;

      return {
        title: `🔥 ${bundle.title}`,
        description,
        openGraph: {
          title: `🔥 ${bundle.title}`,
          description,
          url: `${SITE_URL}/bundle/${slug}`,
          images: [{ url: ogImageUrl, width: 1200, height: 630 }],
        },
      };
    }
  } catch {
    // fetch 실패 시 기본값 사용
  }

  return {
    title: '🔥 가치관 테스트',
    description: '테스트하고 친구들과 가치관을 비교하세요!',
    openGraph: { images: [{ url: buildBundleOgImageUrl(), width: 1200, height: 630 }] },
  };
}
