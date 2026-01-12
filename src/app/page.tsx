import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

import { StructuredData } from '@/components/common/StructuredData/StructuredData';
import { MainContent } from '@/components/features/Main/MainContent';
import { createServerQueryClient } from '@/lib/react-query';
import { displayQueries } from '@/lib/react-query/queries';
import { generateMainStructuredData } from '@/lib/seo/structuredData';
import type { MainDisplayResponse } from '@/types/trend';

export const revalidate = 60;

export default async function Home() {
  const queryClient = createServerQueryClient();
  const mainQuery = displayQueries.main();

  try {
    await queryClient.prefetchQuery(mainQuery);
    const data = queryClient.getQueryData<MainDisplayResponse>(mainQuery.queryKey);

    return (
      <>
        {data && <StructuredData data={generateMainStructuredData(data)} />}
        <HydrationBoundary state={dehydrate(queryClient)}>
          <MainContent />
        </HydrationBoundary>
      </>
    );
  } catch (error) {
    console.error('[Home] Failed to fetch main display:', error);
    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <MainContent />
      </HydrationBoundary>
    );
  }
}
