import { redirect } from 'next/navigation';

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

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

    // SINGLE 타입은 메인 피드 해시 스크롤로 리다이렉트
    // type 필드는 BE API 확장 후 Orval 타입에 반영 예정
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((hotpickData as any)?.type === 'SINGLE') {
      redirect(`/#${hotpickAlias}`);
    }

    // 첫 번째 선거의 commentCount를 prefetch
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

  // 실패 시 빈 데이터로 렌더링 (클라이언트에서 재시도)
  return <HotpickContent hotpickAlias={hotpickAlias} />;
}
