import { notFound } from 'next/navigation';

import { VoteContent } from '@/components/features/Vote/VoteContent';
import { serverDisplayApi } from '@/services/api/server/display';

interface VotePageProps {
  params: Promise<{
    trendAlias: string;
  }>;
}

export const revalidate = 60;

export const dynamicParams = true;

export { generateStaticParams } from '@/app/vote/[trendAlias]/params';
export { generateMetadata } from '@/app/vote/[trendAlias]/metadata';

export default async function VotePage({ params }: VotePageProps) {
  try {
    const { trendAlias } = await params;
    const trendData = await serverDisplayApi.getTrendDisplay(trendAlias);

    return <VoteContent trendData={trendData} />;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[VotePage] Failed to fetch trend data:', error);
    // 에러 발생 시 404 페이지로 처리
    notFound();
  }
}
