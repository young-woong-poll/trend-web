/**
 * SEO 관련 상수 정의
 * 모든 metadata와 structured data에서 사용되는 문구를 중앙에서 관리합니다.
 */

import type { Metadata } from 'next';

/** 사이트 기본 정보 */
export const SITE_NAME = '핫픽 (HotPick)';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hotpick.votebox.kr';

/** 타이틀 */
export const SITE_TITLE = {
  default: '핫픽',
  short: '핫픽',
  og: '애매하면? 핫픽',
} as const;

/** 설명 (Description) */
export const SITE_DESCRIPTION = {
  /** 메인 설명 (슬로건 + 행동 유도) */
  main: '애매하면? 핫픽 🔥 투표하고 사람들의 생각을 확인하세요!',
  /** OpenGraph/Twitter 설명 (공유 시 노출) */
  og: '애매한 고민, 사람들의 생각을 확인하세요!',
  /** Structured Data 설명 (간결) */
  structured: '애매하면? 핫픽 — 투표하고 사람들의 생각을 확인하세요!',
} as const;

/** 키워드 */
export const SITE_KEYWORDS = [
  '핫픽',
  'HotPick',
  '애매하면 핫픽',
  '트렌드 투표',
  '대중 투표',
  '이지선다',
  '밸런스 게임',
  'A vs B',
  '대중 의견',
  '실시간 투표',
  '취향 테스트',
  '연애 투표',
  '직장인 투표',
  '논란',
];

/** OpenGraph 이미지 정보 */
export const OG_IMAGE = {
  url: '/og-vote.jpg',
  width: 1200,
  height: 630,
  alt: '애매하면? 핫픽 — 투표하고 사람들의 생각을 확인하세요!',
} as const;

/** 공통 Metadata 설정 */
export const COMMON_METADATA: Omit<Metadata, 'metadataBase'> = {
  title: {
    default: SITE_TITLE.default,
    template: `%s | 핫픽`,
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
