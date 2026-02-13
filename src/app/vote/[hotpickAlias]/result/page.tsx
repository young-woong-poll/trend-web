import { Suspense } from 'react';

import { redirect } from 'next/navigation';

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

import { createResultMetadata, defaultMetadata } from '@/app/vote/[hotpickAlias]/result/metadata';
import { ResultContent } from '@/components/features/Result/ResultContent';
import { displayQueries } from '@/hooks/api/useDisplay';
import { createServerQueryClient } from '@/lib/react-query';

export const revalidate = 10;

interface ResultPageProps {
  params: Promise<{
    hotpickAlias: string;
  }>;
  searchParams: Promise<{
    id?: string;
  }>;
}

export async function generateMetadata({ params, searchParams }: ResultPageProps) {
  const { hotpickAlias } = await params;
  const { id: resultId } = await searchParams;

  if (!resultId) {
    return defaultMetadata;
  }

  return createResultMetadata(hotpickAlias);
}

export default async function ResultPage({ params, searchParams }: ResultPageProps) {
  const queryClient = createServerQueryClient();
  const { hotpickAlias } = await params;
  const { id: resultId } = await searchParams;

  if (!resultId) {
    redirect('/');
  }

  const resultQuery = displayQueries.result(resultId);
  const hotpickQuery = displayQueries.hotpick(hotpickAlias);

  try {
    await Promise.all([
      queryClient.prefetchQuery(resultQuery),
      queryClient.prefetchQuery(hotpickQuery),
    ]);

    return (
      <Suspense fallback={<LoadingFallback />}>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <ResultContent hotpickAlias={hotpickAlias} resultId={resultId} />
        </HydrationBoundary>
      </Suspense>
    );
  } catch (error) {
    console.error('[ResultPage] Result fetch error:', error);
  }
}

function LoadingFallback() {
  return null;
}
