import { AboutPage } from '@/components/features/About/AboutPage';
import { SITE_URL } from '@/lib/seo/constants';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: '핫픽은 대중의 생각부터 연인의 가치관까지, 숫자로 비교하는 플랫폼입니다.',
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
  openGraph: {
    title: 'About | HotPick',
    description: '핫픽은 대중의 생각부터 연인의 가치관까지, 숫자로 비교하는 플랫폼입니다.',
    url: `${SITE_URL}/about`,
  },
};

export default function About() {
  return <AboutPage />;
}
