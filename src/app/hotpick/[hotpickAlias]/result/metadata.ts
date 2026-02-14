import { getTrendDetail } from '@/generated/api/server/display/display';
import { SITE_NAME, COMMON_METADATA, SITE_KEYWORDS } from '@/lib/seo/constants';

import type { Metadata } from 'next';

export const defaultMetadata: Metadata = {
  ...COMMON_METADATA,
  title: '나의 핫픽 결과는?',
  description: '투표 결과를 확인해보세요!',
};

/**
 * Result Metadata 생성 (티저 전략)
 * - getTrendDetail API로 핫픽 첫 번째 주제 기반 메타데이터 생성
 * - 결과(유형, 대중성 지수)는 미노출하여 호기심 유발
 *
 * 예시)
 * items[0].title = "대한민국 월드컵 현실 목표는?"
 * items[0].options[0].title = "16강"
 * items[0].options[1].title = "8강"
 * → title: "대한민국 월드컵 현실 목표는? 16강 VS 8강"
 */
export async function createResultMetadata(hotpickAlias: string): Promise<Metadata> {
  /** OpenGraph 이미지 정보 */
  const ogImage = {
    url: '/og-result.jpg',
    width: 1200,
    height: 630,
    alt: 'HotPick - 오늘 대한민국은 이걸로 싸운다',
  } as const;

  try {
    const response = await getTrendDetail(hotpickAlias, { next: { revalidate: 60 } });
    const hotpickData = response.status === 200 ? response.data.data : null;

    if (!hotpickData) {
      return defaultMetadata;
    }

    // 첫 번째 주제와 선택지 가져오기
    const firstElection = hotpickData.items?.[0];
    if (!firstElection || (firstElection.options?.length ?? 0) < 2) {
      return defaultMetadata;
    }

    const questionTitle = firstElection.title ?? '';
    const optionA = firstElection.options?.[0]?.title ?? '';
    const optionB = firstElection.options?.[1]?.title ?? '';

    // 티저 전략: 핫픽 주제 + VS 대결구도
    const title = `${questionTitle} ${optionA} VS ${optionB}`;
    const description = 'HotPick 테스트를 완료했어요! 결과 보러가기 →';

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
  } catch (error) {
    console.error('[Metadata] Failed to create result metadata:', error);

    // 에러 시 기본 메타데이터 반환
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
