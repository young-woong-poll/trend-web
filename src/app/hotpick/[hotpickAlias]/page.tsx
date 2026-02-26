import { notFound } from 'next/navigation';

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

    if (!hotpickData?.hotpick) {
      notFound();
    }

    const hotpickType = hotpickData.hotpick.type;

    // SINGLE 타입: 단일 투표 상세페이지
    if (hotpickType === 'SINGLE') {
      return (
        <HydrationBoundary state={dehydrate(queryClient)}>
          <SingleDetailContent hotpickAlias={hotpickAlias} data={hotpickData} />
        </HydrationBoundary>
      );
    }

    // BUNDLE 타입: 5개 묶음 투표 (BE 미지원 — 현재 준비 중)
    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <HotpickContent hotpickAlias={hotpickAlias} data={hotpickData} />
      </HydrationBoundary>
    );
  } catch (error) {
    // notFound()는 내부적으로 에러를 throw하므로 그대로 전파
    if (error instanceof Error && error.message === 'NEXT_NOT_FOUND') {
      throw error;
    }
    // eslint-disable-next-line no-console
    console.error('[HotpickPage] Failed to fetch hotpick data:', error);
    notFound();
  }
}
