import { getDetail1 } from '@/generated/api/server/bundle/bundle';
import { SITE_URL } from '@/lib/seo/constants';

import type { Metadata } from 'next';

type MetadataProps = {
  params: Promise<{ slug: string }>;
};

/** Bundle OG 확정 디자인 — V3(Tilted Card) */
const BUNDLE_OG_DESIGN = 'v3';

/**
 * 참여 수를 구간별 **올림**하여 OG 이미지 캐시 키 안정화 + 마케팅 수치.
 *   - 1~10명    → 10 (초기에 "아무도 없음" 처럼 보이지 않도록)
 *   - ~100명    → 10 단위 올림
 *   - ~1,000명  → 50 단위 올림
 *   - ~10,000명 → 500 단위 올림
 *   - 그 외     → 1,000 단위 올림
 */
function roundParticipants(n: number): number {
  if (n === 0) {
    return 0;
  }
  if (n <= 10) {
    return 10;
  }
  if (n <= 100) {
    return Math.ceil(n / 10) * 10;
  }
  if (n <= 1000) {
    return Math.ceil(n / 50) * 50;
  }
  if (n <= 10000) {
    return Math.ceil(n / 500) * 500;
  }
  return Math.ceil(n / 1000) * 1000;
}

export function buildBundleOgImageUrl(
  categoryCode?: string,
  participantCount?: number,
  bundleTitle?: string
): string {
  const rounded = roundParticipants(participantCount ?? 0);
  const params = new URLSearchParams({
    design: BUNDLE_OG_DESIGN,
    category: categoryCode ?? 'TREND',
    participants: String(rounded),
  });
  if (bundleTitle) {
    params.set('bundleTitle', bundleTitle.slice(0, 40));
  }
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
        bundle.title
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
