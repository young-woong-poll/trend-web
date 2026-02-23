import type { MainHotpickResponse } from '@/generated/models';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo/constants';

/**
 * 메인 페이지의 JSON-LD 구조화 데이터를 생성합니다.
 */
export function generateMainStructuredData(data: MainHotpickResponse) {
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
      itemListElement: (data.hotpicks ?? []).map((hotpick, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Question',
          name: hotpick.election?.title ?? hotpick.slug,
          interactionStatistic: {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/VoteAction',
            userInteractionCount: hotpick.election?.totalVoteCount ?? 0,
          },
        },
      })),
    },
  };
}
