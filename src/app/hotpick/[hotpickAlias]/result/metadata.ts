import { getDetail } from '@/generated/api/server/hotpick/hotpick';
import { SITE_NAME, SITE_URL, COMMON_METADATA, SITE_KEYWORDS } from '@/lib/seo/constants';

import type { Metadata } from 'next';

export const defaultMetadata: Metadata = {
  ...COMMON_METADATA,
  title: '나의 핫픽 결과는?',
  description: '투표 결과를 확인해보세요!',
};

/**
 * Result Metadata 생성 (티저 전략)
 * - getDetail API로 핫픽 선거 기반 메타데이터 생성
 * - 결과(유형, 대중성 지수)는 미노출하여 호기심 유발
 */
export async function createResultMetadata(hotpickAlias: string): Promise<Metadata> {
  const ogImage = {
    url: '/og-result.jpg',
    width: 1200,
    height: 630,
    alt: '애매하면? 핫픽 — 내 결과 확인하기',
  } as const;

  try {
    const response = await getDetail(hotpickAlias, { next: { revalidate: 60 } });
    const hotpickData = response.status === 200 ? response.data.data : null;

    if (!hotpickData) {
      return defaultMetadata;
    }

    const election = hotpickData.hotpick?.election;
    const items = election?.items ?? [];
    if (items.length < 2) {
      return defaultMetadata;
    }

    const questionTitle = election?.title ?? '';
    const optionA = items[0]?.title ?? '';
    const optionB = items[1]?.title ?? '';

    // 티저 전략: 핫픽 주제 + VS 대결구도
    const title = `${questionTitle} ${optionA} VS ${optionB}`;
    const description = `나는 어떤 유형일까? ${optionA} vs ${optionB} 결과 확인하기 →`;
    const canonicalUrl = `${SITE_URL}/hotpick/${hotpickAlias}/result`;

    return {
      title,
      description,
      keywords: SITE_KEYWORDS,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        type: 'website',
        siteName: SITE_NAME,
        images: [ogImage],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage.url],
      },
    };
  } catch (error) {
    console.error('[Metadata] Failed to create result metadata:', error);

    const title = '나의 핫픽 결과는?';
    const description = '투표 결과를 확인해보세요!';

    return {
      title,
      description,
      keywords: SITE_KEYWORDS,
      openGraph: {
        title,
        description,
        type: 'website',
        siteName: SITE_NAME,
        images: [ogImage],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage.url],
      },
    };
  }
}
