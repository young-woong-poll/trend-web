import { SITE_NAME, OG_IMAGE, COMMON_METADATA, SITE_KEYWORDS } from '@/lib/seo/constants';

import type { Metadata } from 'next';

export const defaultMetadata: Metadata = {
  ...COMMON_METADATA,
  title: '나의 🔥 핫픽 결과는?',
  description: '투표 결과를 확인하고 친구들과 비교해보세요!',
};

interface GenerateResultMetadataParams {
  nickname?: string;
  compareNickname?: string;
}

export function createResultMetadata({
  nickname,
  compareNickname,
}: GenerateResultMetadataParams): Metadata {
  const title = `${nickname ? `${nickname}님` : '나'}의 🔥 핫픽 결과는?`;
  const description = compareNickname
    ? `${compareNickname}님과 나의 취향이 얼마나 같을까? 지금 바로 비교해보세요!`
    : '투표 결과를 확인하고 친구들과 비교해보세요!';

  return {
    title, // template에 의해 자동으로 "| HotPick" 추가됨
    description,
    keywords: SITE_KEYWORDS,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: SITE_NAME,
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [OG_IMAGE.url],
    },
  };
}
