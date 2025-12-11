import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo/constants';
import type { MainDisplayResponse } from '@/types/trend';

/**
 * 메인 페이지의 JSON-LD 구조화 데이터를 생성합니다.
 */
export function generateMainStructuredData(data: MainDisplayResponse) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    description: SITE_DESCRIPTION.structured,
    url: SITE_URL,
    potentialAction: {
      '@type': 'VoteAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: SITE_URL,
      },
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: data.trends.map((trend, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Question',
          name: trend.title,
          text: trend.label,
          image: trend.imageUrl,
          interactionStatistic: {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/VoteAction',
            userInteractionCount: trend.participantsCount,
          },
        },
      })),
    },
  };
}
