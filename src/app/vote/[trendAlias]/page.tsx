import { notFound } from 'next/navigation';

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

import { VoteContent } from '@/components/features/Vote/VoteContent';
import { createServerQueryClient } from '@/lib/react-query';
import { displayQueries } from '@/lib/react-query/queries';

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
    await queryClient.prefetchQuery(trendQuery);

    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <VoteContent trendAlias={trendAlias} />
      </HydrationBoundary>
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[VotePage] Failed to fetch trend data:', error);
    notFound();
  }
}
