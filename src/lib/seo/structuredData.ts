import type { HotpickCardResponse, MainHotpickResponse } from '@/generated/models';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo/constants';

/**
 * 메인 페이지의 JSON-LD 구조화 데이터를 생성합니다.
 * - WebSite + ItemList 구조
 * - 각 핫픽은 slug, title, totalVoteCount만 사용
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
          url: `${SITE_URL}/hotpick/${hotpick.slug}`,
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

/**
 * 핫픽 상세 페이지의 JSON-LD 구조화 데이터를 생성합니다.
 * - Question + suggestedAnswer 구조 (Google 리치 결과 대응)
 * - 각 선택지를 Answer로 마크업
 */
export function generateHotpickStructuredData(hotpick: HotpickCardResponse, hotpickAlias: string) {
  const election = hotpick.election;
  const items = election?.items ?? [];

  return {
    '@context': 'https://schema.org',
    '@type': 'Question',
    name: election?.title ?? hotpick.slug,
    url: `${SITE_URL}/hotpick/${hotpickAlias}`,
    answerCount: items.length,
    suggestedAnswer: items.map((item) => ({
      '@type': 'Answer',
      text: item.title,
      upvoteCount: item.voteCount ?? 0,
    })),
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/VoteAction',
      userInteractionCount: election?.totalVoteCount ?? 0,
    },
  };
}
