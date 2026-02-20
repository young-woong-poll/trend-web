import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

import { SingleDetailContent } from '@/components/features/Hotpick/SingleDetailView/SingleDetailContent';
import { HotpickContent } from '@/components/features/Hotpick/VoteContent';
import { commentQueries } from '@/hooks/api/useComment';
import { displayQueries } from '@/hooks/api/useDisplay';
import { createServerQueryClient } from '@/lib/react-query';

interface HotpickPageProps {
  params: Promise<{
    hotpickAlias: string;
  }>;
}

export const revalidate = 60;

export const dynamicParams = true;

export { generateStaticParams } from '@/app/hotpick/[hotpickAlias]/params';
export { generateMetadata } from '@/app/hotpick/[hotpickAlias]/metadata';

export default async function HotpickPage({ params }: HotpickPageProps) {
  const queryClient = createServerQueryClient();
  const { hotpickAlias } = await params;

  const hotpickQuery = displayQueries.hotpick(hotpickAlias);

  try {
    const hotpickData = await queryClient.fetchQuery(hotpickQuery);

    // type 필드는 BE API 확장 후 Orval 타입에 반영 예정
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hotpickType = (hotpickData as any)?.type as string | undefined;

    // SINGLE 타입: 단일 투표 상세페이지
    if (hotpickType === 'SINGLE') {
      const firstElection = hotpickData?.items?.[0];
      if (hotpickData?.trendId && firstElection?.id) {
        const countQuery = commentQueries.count(Number(hotpickData.trendId), firstElection.id);
        await queryClient.prefetchQuery(countQuery);
      }

      return (
        <HydrationBoundary state={dehydrate(queryClient)}>
          <SingleDetailContent hotpickAlias={hotpickAlias} data={hotpickData ?? undefined} />
        </HydrationBoundary>
      );
    }

    // BUNDLE 타입: 5개 묶음 투표
    const firstElectionId = hotpickData?.items?.[0]?.id;
    if (hotpickData?.trendId && firstElectionId) {
      const countQuery = commentQueries.count(Number(hotpickData.trendId), firstElectionId);
      await queryClient.prefetchQuery(countQuery);
    }

    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <HotpickContent hotpickAlias={hotpickAlias} data={hotpickData ?? undefined} />
      </HydrationBoundary>
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[HotpickPage] Failed to fetch hotpick data:', error);
    // 서버에서 실패해도 클라이언트에서 재시도
  }

  // 실패 시 BUNDLE로 폴백 렌더링 (클라이언트에서 재시도)
  return <HotpickContent hotpickAlias={hotpickAlias} />;
}
