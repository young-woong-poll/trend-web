import { SITE_NAME, SITE_URL } from '@/lib/seo/constants';

import type { Metadata, Viewport } from 'next';

const TITLE = '나는 테토일까, 에겐일까?';
const DESCRIPTION = '친구들한테 물어보자';
const OG_IMAGE = `${SITE_URL}/api/og/teto-egen?variant=landing`;
const PAGE_URL = `${SITE_URL}/ask/teto-egen`;

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
  alternates: { canonical: PAGE_URL },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
};

export default function TetoEgenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
