import { AboutPage } from '@/components/features/About/AboutPage';
import { SITE_URL } from '@/lib/seo/constants';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: '핫픽은 애매한 고민을 대중 투표로 해결하는 실용 도구형 플랫폼입니다.',
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
  openGraph: {
    title: 'About | HotPick',
    description: '핫픽은 애매한 고민을 대중 투표로 해결하는 실용 도구형 플랫폼입니다.',
    url: `${SITE_URL}/about`,
  },
};

export default function About() {
  return <AboutPage />;
}
