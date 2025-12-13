import { notFound } from 'next/navigation';

import { VoteContent } from '@/components/features/Vote/VoteContent';
import { serverDisplayApi } from '@/services/api/server/display';

import type { Metadata } from 'next';

interface VotePageProps {
  params: Promise<{
    trendAlias: string;
  }>;
}

// ISR: 60초마다 재검증
export const revalidate = 60;

//빌드 시 생성되지 않은 경로도 런타임에 동적으로 생성 가능
//사용자가 처음 접근할 때 서버에서 렌더링하고, 이후 캐시됨 (ISR)
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const mainData = await serverDisplayApi.getMainDisplay();

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!mainData?.trends) {
      console.warn('[generateStaticParams] No trends data available');
      return [];
    }

    // API 에러가 있는 trend는 제외하고 유효한 trend만 반환
    const validTrends = await Promise.all(
      mainData.trends.map(async (trend) => {
        try {
          await serverDisplayApi.getTrendDisplay(trend.alias);
          return trend.alias;
        } catch {
          console.warn(`[generateStaticParams] Skipping trend ${trend.alias} due to API error`);
          return null;
        }
      })
    );

    return validTrends
      .filter((alias): alias is string => alias !== null)
      .map((trendAlias) => ({ trendAlias }));
  } catch (error) {
    console.error('[generateStaticParams] Failed to generate static params:', error);
    // 에러 발생 시 빈 배열 반환 (동적 렌더링으로 fallback)
    return [];
  }
}

export async function generateMetadata({ params }: VotePageProps): Promise<Metadata> {
  try {
    const { trendAlias } = await params;
    const trendData = await serverDisplayApi.getTrendDisplay(trendAlias);

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
  try {
    const { trendAlias } = await params;
    const trendData = await serverDisplayApi.getTrendDisplay(trendAlias);

    return <VoteContent initialTrendData={trendData} trendId={trendData.trendId} />;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[VotePage] Failed to fetch trend data:', error);
    // 에러 발생 시 404 페이지로 처리
    notFound();
  }
}
