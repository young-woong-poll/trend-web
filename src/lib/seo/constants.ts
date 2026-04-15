/**
 * SEO 관련 상수 정의
 * 모든 metadata와 structured data에서 사용되는 문구를 중앙에서 관리합니다.
 */

import type { Metadata } from 'next';

/** 사이트 기본 정보 */
export const SITE_NAME = '핫픽';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hotpick.votebox.kr';

/** 타이틀 */
export const SITE_TITLE = {
  default: '핫픽 - 생각을 비교하다',
  short: '핫픽',
  og: '핫픽 - 생각을 비교하다',
} as const;

/** 설명 (Description) */
export const SITE_DESCRIPTION = {
  /** 메인 설명 (슬로건 + 행동 유도) */
  main: '생각을 비교하다, 핫픽 🔥 대중의 생각부터 연인의 가치관까지',
  /** OpenGraph/Twitter 설명 (공유 시 노출) */
  og: '대중의 생각부터 연인의 가치관까지, 숫자로 비교하세요',
  /** Structured Data 설명 (간결) */
  structured: '생각을 비교하다, 핫픽 — 대중의 생각부터 연인의 가치관까지',
} as const;

/** 키워드 */
export const SITE_KEYWORDS = [
  '핫픽',
  'HotPick',
  '가치관 비교',
  '커플 테스트',
  '연애 가치관 테스트',
  '케미 테스트',
  '생각 비교',
  '대중 의견',
  '커플 궁합',
  '가치관 테스트',
  '밸런스 게임',
  '연인 비교',
];

/** OpenGraph 이미지 정보 */
export const OG_IMAGE = {
  url: '/main-og2.png',
  width: 1200,
  height: 630,
  alt: '핫픽 - 생각을 비교하다. 대중의 생각부터 연인의 가치관까지',
} as const;

// TODO: S3 업로드 후 CDN URL로 교체 (scripts/upload-og-image.js 사용)
export const OG_IMAGE_BUNDLE = {
  url: '/main-og2.png',
  width: 1200,
  height: 630,
  alt: '핫픽 번들 - 5개 질문으로 가치관 비교',
} as const;

// TODO: compare 전용 OG 이미지 제작 후 교체
export const OG_IMAGE_COMPARE = {
  url: '/main-og2.png',
  width: 1200,
  height: 630,
  alt: '핫픽 비교 - 우리 생각 얼마나 통할까?',
} as const;

/** 공통 Metadata 설정 */
export const COMMON_METADATA: Omit<Metadata, 'metadataBase'> = {
  title: {
    default: SITE_TITLE.default,
    template: `%s | HotPick`,
  },
  description: SITE_DESCRIPTION.main,
  keywords: SITE_KEYWORDS,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_TITLE.og,
    description: SITE_DESCRIPTION.og,
    url: SITE_URL,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE.og,
    description: SITE_DESCRIPTION.og,
    images: [OG_IMAGE.url],
  },
};
