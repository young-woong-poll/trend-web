import { MainContent } from '@/components/features/Main/MainContent';
import { serverDisplayApi } from '@/services/api/server/display';

import type { Metadata } from 'next';

export const revalidate = 60; // ISR: 60초마다 재검증

export const metadata: Metadata = {
  title: '트렌드 투표',
  description: '지금 뜨는 트렌드에 투표하세요',
  openGraph: {
    title: '트렌드 투표',
    description: '지금 뜨는 트렌드에 투표하세요',
    type: 'website',
  },
};

export default async function Home() {
  const data = await serverDisplayApi.getMainDisplay();
  return <MainContent initialData={data} />;
}
