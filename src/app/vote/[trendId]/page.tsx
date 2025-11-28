import { VoteContent } from '@/components/features/Vote/VoteContent';
import { serverDisplayApi } from '@/services/api/server/display';

import type { Metadata } from 'next';

interface VotePageProps {
  params: Promise<{
    trendId: string;
  }>;
}

export const revalidate = 60; // ISR: 60초마다 재검증

export async function generateStaticParams() {
  try {
    const mainData = await serverDisplayApi.getMainDisplay();

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!mainData?.trends) {
      console.warn('[generateStaticParams] No trends data available');
      return [];
    }

    return mainData.trends.map((trend) => ({
      trendId: trend.id.toString(),
    }));
  } catch (error) {
    console.error('[generateStaticParams] Failed to generate static params:', error);
    // 에러 발생 시 빈 배열 반환 (동적 렌더링으로 fallback)
    return [];
  }
}

export async function generateMetadata({ params }: VotePageProps): Promise<Metadata> {
  try {
    const { trendId } = await params;
    const trendData = await serverDisplayApi.getTrendDisplay(trendId);

    const firstItem = trendData.items[0];
    const title = firstItem.title;
    const description = firstItem.label;
    const imageUrl = firstItem.options[0]?.imageUrl;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: imageUrl ? [imageUrl] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: imageUrl ? [imageUrl] : [],
      },
    };
  } catch (error) {
    console.error('Failed to generate metadata:', error);
    return {
      title: '투표',
      description: '당신의 선택은?',
    };
  }
}

export default async function VotePage({ params }: VotePageProps) {
  const { trendId } = await params;

  const trendData = await serverDisplayApi.getTrendDisplay(trendId);

  return <VoteContent initialTrendData={trendData} trendId={trendId} />;
}
