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
  const infiniteMainQuery = displayQueries.infiniteMain({ size: 20, sort: 'popular' });

  try {
    await queryClient.prefetchInfiniteQuery(infiniteMainQuery);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Home] Failed to fetch main display:', error);
    // 서버에서 실패해도 클라이언트에서 재시도
  }

  // 첫 페이지 데이터 추출 (SEO용)
  const infiniteData = queryClient.getQueryData<{ pages: MainDisplayResponse[] }>(
    infiniteMainQuery.queryKey
  );
  const firstPageData = infiniteData?.pages[0];

  return (
    <>
      {firstPageData && <StructuredData data={generateMainStructuredData(firstPageData)} />}
      <HydrationBoundary state={dehydrate(queryClient)}>
        <MainContent data={firstPageData} />
      </HydrationBoundary>
    </>
  );
}
