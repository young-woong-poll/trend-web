import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

import { SingleDetailContent } from '@/components/features/Hotpick/SingleDetailView/SingleDetailContent';
import { HotpickContent } from '@/components/features/Hotpick/VoteContent';
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

    const hotpickType = hotpickData?.hotpick?.type;

    // SINGLE 타입: 단일 투표 상세페이지
    if (hotpickType === 'SINGLE') {
      return (
        <HydrationBoundary state={dehydrate(queryClient)}>
          <SingleDetailContent hotpickAlias={hotpickAlias} data={hotpickData ?? undefined} />
        </HydrationBoundary>
      );
    }

    // BUNDLE 타입: 5개 묶음 투표 (BE 미지원 — 현재 준비 중)
    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <HotpickContent hotpickAlias={hotpickAlias} data={hotpickData ?? undefined} />
      </HydrationBoundary>
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[HotpickPage] Failed to fetch hotpick data:', error);
  }

  // 실패 시 BUNDLE로 폴백 렌더링 (클라이언트에서 재시도)
  return <HotpickContent hotpickAlias={hotpickAlias} />;
}
