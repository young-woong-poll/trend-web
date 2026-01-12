import { Suspense } from 'react';

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { notFound, redirect } from 'next/navigation';

import { createResultMetadata, defaultMetadata } from '@/app/vote/[trendAlias]/result/metadata';
import { ResultContent } from '@/components/features/Result/ResultContent';
import { ResultSkeleton } from '@/components/features/Result/ResultSkeleton/ResultSkeleton';
import { createServerQueryClient } from '@/lib/react-query';
import { displayQueries } from '@/lib/react-query/queries';
import { serverDisplayApi } from '@/services/api/server/display';

interface ResultPageProps {
  params: Promise<{
    trendAlias: string;
  }>;
  searchParams: Promise<{
    id?: string;
    compareId?: string;
  }>;
}

export async function generateMetadata({ searchParams }: ResultPageProps) {
  const { id: resultId, compareId } = await searchParams;

  if (!resultId) {
    return defaultMetadata;
  }

  try {
    const { nickname, compareNickname } = await serverDisplayApi.getResultDisplay({
      resultId,
      compareId,
    });

    return createResultMetadata({ nickname, compareNickname });
  } catch (_error) {
    return defaultMetadata;
  }
}

export default async function ResultPage({ params, searchParams }: ResultPageProps) {
  const queryClient = createServerQueryClient();
  const { trendAlias } = await params;
  const { id: resultId, compareId } = await searchParams;

  if (!resultId) {
    redirect('/');
  }

  // 쿼리 옵션 객체들 - 어떤 쿼리키를 사용하는지 명확함
  const resultQuery = displayQueries.result(resultId, compareId);
  const inviteeQuery = displayQueries.resultInvitee(resultId);

  try {
    // 병렬로 prefetch - 쿼리 옵션 객체를 직접 전달
    await Promise.all([
      queryClient.prefetchQuery(resultQuery),
      queryClient.prefetchQuery(inviteeQuery).catch(() => {
        console.warn('[ResultPage] Failed to prefetch invitee results');
      }),
    ]);

    return (
      <Suspense fallback={<LoadingFallback />}>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <ResultContent trendAlias={trendAlias} resultId={resultId} compareId={compareId} />
        </HydrationBoundary>
      </Suspense>
    );
  } catch (error) {
    console.error('[ResultPage] Result fetch error:', error);
    notFound();
  }
}

function LoadingFallback() {
  return <ResultSkeleton />;
}
