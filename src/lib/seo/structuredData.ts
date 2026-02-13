import type { DisplayMainResponse } from '@/generated/models';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo/constants';

/**
 * 메인 페이지의 JSON-LD 구조화 데이터를 생성합니다.
 */
export function generateMainStructuredData(data: DisplayMainResponse) {
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
      // NOTE: data.trends is a generated model field name (will be renamed after BE migration)
      itemListElement: (data.trends ?? []).map((hotpick, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Question',
          name: hotpick.title,
          text: hotpick.label,
          interactionStatistic: {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/VoteAction',
            userInteractionCount: hotpick.participantsCount ?? 0,
          },
        },
      })),
    },
  };
}
