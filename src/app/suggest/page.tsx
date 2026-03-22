import { SuggestPage } from '@/components/features/Suggest/SuggestPage';
import { SITE_URL } from '@/lib/seo/constants';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '핫픽 제안',
  description: '새로운 핫픽 투표 주제를 제안해주세요! 여러분의 아이디어가 핫픽이 됩니다.',
  alternates: {
    canonical: `${SITE_URL}/suggest`,
  },
  openGraph: {
    title: '핫픽 제안 | HotPick',
    description: '새로운 핫픽 투표 주제를 제안해주세요! 여러분의 아이디어가 핫픽이 됩니다.',
    url: `${SITE_URL}/suggest`,
  },
};

export default function Suggest() {
  return <SuggestPage />;
}
