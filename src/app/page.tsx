import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

import { StructuredData } from '@/components/common/StructuredData/StructuredData';
import { MainContent } from '@/components/features/Main/MainContent';
import { displayQueries } from '@/hooks/api/useDisplay';
import { createServerQueryClient } from '@/lib/react-query';
import { generateMainStructuredData } from '@/lib/seo/structuredData';

export const revalidate = 60;

export default async function Home() {
  const queryClient = createServerQueryClient();

  try {
    // 서버에서 pre-fetch (queryOptions의 queryFn이 서버 API 호출)
    const mainData = await queryClient.fetchQuery(displayQueries.main({ size: 20 }));

    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        {mainData && <StructuredData data={generateMainStructuredData(mainData)} />}
        <MainContent data={mainData ?? undefined} />
      </HydrationBoundary>
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Home] Failed to fetch main display:', error);
  }

  // 실패 시 빈 데이터로 렌더링 (클라이언트에서 재시도)
  return <MainContent />;
}
