/**
 * SEO 관련 상수 정의
 * 모든 metadata와 structured data에서 사용되는 문구를 중앙에서 관리합니다.
 */

import type { Metadata } from 'next';

/** 사이트 기본 정보 */
export const SITE_NAME = 'HotPick (핫픽)';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hotpick.votebox.kr';

/** 타이틀 */
export const SITE_TITLE = {
  default: '핫픽',
  short: '핫픽',
  og: '핫픽',
} as const;

/** 설명 (Description) */
export const SITE_DESCRIPTION = {
  /** 메인 설명 (FOMO 강조) */
  main: '오늘 대한민국은 이걸로 싸운다 🔥 요즘 가장 핫한 논란거리에 투표하세요!',
  /** OpenGraph/Twitter 설명 (서브 슬로건 강조) */
  og: '요즘 가장 핫한 논란거리에 투표하세요!',
  /** Structured Data 설명 (간결) */
  structured: '오늘 대한민국은 이걸로 싸운다 🔥 요즘 가장 핫한 논란거리에 투표하세요!',
} as const;

/** 키워드 */
export const SITE_KEYWORDS = [
  '핫픽',
  'HotPick',
  '트렌드 투표',
  '논란',
  '밸런스 게임',
  '여론조사',
  '주간 투표',
  '취향 테스트',
  '논쟁',
  '투표',
];

/** OpenGraph 이미지 정보 */
export const OG_IMAGE = {
  url: '/og-vote.jpg',
  width: 1200,
  height: 630,
  alt: 'HotPick - 오늘 대한민국은 이걸로 싸운다',
} as const;

/** 공통 Metadata 설정 */
export const COMMON_METADATA: Omit<Metadata, 'metadataBase'> = {
  title: {
    default: SITE_TITLE.default,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION.main,
  keywords: SITE_KEYWORDS,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_TITLE.og,
    description: SITE_DESCRIPTION.og,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE.og,
    description: SITE_DESCRIPTION.og,
    images: [OG_IMAGE.url],
  },
};
