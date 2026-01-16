import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

import { VoteContent } from '@/components/features/Vote/VoteContent';
import { createServerQueryClient } from '@/lib/react-query';
import { commentQueries, displayQueries } from '@/lib/react-query/queries';

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
  const queryClient = createServerQueryClient();
  const { trendAlias } = await params;

  const trendQuery = displayQueries.trend(trendAlias);

  try {
    const trendData = await queryClient.fetchQuery(trendQuery);

    // 첫 번째 아이템의 commentCount를 prefetch
    if (trendData?.items?.[0]) {
      const firstItem = trendData.items[0];
      await queryClient.prefetchQuery(
        commentQueries.count(Number(trendData.trendId), firstItem.id)
      );
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[VotePage] Failed to fetch trend data:', error);
    // 서버에서 실패해도 클라이언트에서 재시도
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <VoteContent trendAlias={trendAlias} />
    </HydrationBoundary>
  );
}
