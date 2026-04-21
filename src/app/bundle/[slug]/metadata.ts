import { parseCategoryMeta } from '@/constants/categoryTheme';
import { getDetail1 } from '@/generated/api/server/bundle/bundle';
import { SITE_URL } from '@/lib/seo/constants';

import type { Metadata } from 'next';

type MetadataProps = {
  params: Promise<{ slug: string }>;
};

const FALLBACK_TITLE = '가치관 비교 테스트';
const FALLBACK_DESCRIPTION = '최근 핫한 주제 모음';

/** URL 쿼리용 hex 변환 — "#FF6B9D" → "FF6B9D" */
function stripHash(hex: string): string {
  return hex.replace(/^#/, '');
}

/**
 * 번들 OG 이미지 URL.
 *
 * BE `categoryMeta`(JSON 문자열)가 테마의 SSoT. 파싱해서 start/end 색상 값을 URL에 직접 전달.
 * categoryMeta가 없으면 categoryCode로 fallback.
 *
 * Edge runtime의 응답 캐시(`s-maxage=2592000`, 30일)가 slug당 1장을 유지.
 */
export function buildBundleOgImageUrl(
  categoryCode?: string,
  categoryMeta?: string | null,
  bundleTitle?: string
): string {
  const params = new URLSearchParams();

  const theme = parseCategoryMeta(categoryMeta);
  if (theme) {
    params.set('start', stripHash(theme.start));
    params.set('end', stripHash(theme.end));
  } else if (categoryCode) {
    params.set('category', categoryCode);
  }

  if (bundleTitle) {
    params.set('bundleTitle', bundleTitle.slice(0, 40));
  }

  return `${SITE_URL}/api/og/bundle?${params.toString()}`;
}

function buildBundleDescription(participantCount?: number, questionCount?: number): string {
  if (participantCount === undefined || participantCount === null) {
    return FALLBACK_DESCRIPTION;
  }
  if (questionCount === undefined || questionCount === null) {
    return FALLBACK_DESCRIPTION;
  }
  return `${participantCount.toLocaleString()}명 참여 · ${questionCount}문항 가치관 테스트`;
}

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const response = await getDetail1(slug, { next: { revalidate: 300 } });
    const bundle = response.status === 200 ? response.data.data : null;

    if (bundle) {
      const title = bundle.title && bundle.title.length > 0 ? bundle.title : FALLBACK_TITLE;
      const description = buildBundleDescription(bundle.participantCount, bundle.questionCount);
      const ogImageUrl = buildBundleOgImageUrl(
        bundle.categoryCode,
        bundle.categoryMeta,
        bundle.title ?? undefined
      );

      return {
        title,
        description,
        openGraph: {
          title,
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
    title: FALLBACK_TITLE,
    description: FALLBACK_DESCRIPTION,
    openGraph: {
      title: FALLBACK_TITLE,
      description: FALLBACK_DESCRIPTION,
      images: [{ url: buildBundleOgImageUrl(), width: 1200, height: 630 }],
    },
  };
}
