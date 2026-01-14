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
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Home] Failed to fetch main display:', error);
    // 서버에서 실패해도 클라이언트에서 재시도
  }

  const data = queryClient.getQueryData<MainDisplayResponse>(mainQuery.queryKey);

  return (
    <>
      {data && <StructuredData data={generateMainStructuredData(data)} />}
      <HydrationBoundary state={dehydrate(queryClient)}>
        <MainContent data={data} />
      </HydrationBoundary>
    </>
  );
}
