import { Suspense } from 'react';

import { notFound, redirect } from 'next/navigation';

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

import { createResultMetadata, defaultMetadata } from '@/app/vote/[trendAlias]/result/metadata';
import { ResultContent } from '@/components/features/Result/ResultContent';
import { createServerQueryClient } from '@/lib/react-query';
import { displayQueries } from '@/lib/react-query/queries';

interface ResultPageProps {
  params: Promise<{
    trendAlias: string;
  }>;
  searchParams: Promise<{
    id?: string;
  }>;
}

export async function generateMetadata({ searchParams }: ResultPageProps) {
  const { id: resultId } = await searchParams;

  if (!resultId) {
    return defaultMetadata;
  }

  return createResultMetadata();
}

export default async function ResultPage({ params, searchParams }: ResultPageProps) {
  const queryClient = createServerQueryClient();
  const { trendAlias } = await params;
  const { id: resultId } = await searchParams;

  if (!resultId) {
    redirect('/');
  }

  const resultQuery = displayQueries.result(resultId);
  const trendQuery = displayQueries.trend(trendAlias);

  try {
    await Promise.all([
      queryClient.prefetchQuery(resultQuery),
      queryClient.prefetchQuery(trendQuery),
    ]);

    return (
      <Suspense fallback={<LoadingFallback />}>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <ResultContent trendAlias={trendAlias} resultId={resultId} />
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
