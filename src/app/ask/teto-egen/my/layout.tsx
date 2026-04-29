import { SITE_NAME, SITE_URL } from '@/lib/seo/constants';

import type { Metadata } from 'next';

const TITLE = '내 테토/에겐 결과';
const DESCRIPTION = '친구들이 보는 나의 모습';
// 본인 결과 페이지는 외부 공유 시 랜딩 OG로 fallback (별도 이미지 미제작).
const OG_IMAGE = `${SITE_URL}/api/og/teto-egen?variant=landing`;
const PAGE_URL = `${SITE_URL}/ask/teto-egen/my`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  // 본인 전용 페이지 — 검색엔진 인덱싱 차단
  robots: { index: false, follow: false },
};

export default function TetoEgenMyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
