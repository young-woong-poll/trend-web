import { Suspense } from 'react';

import { notFound, redirect } from 'next/navigation';

import { createResultMetadata, defaultMetadata } from '@/app/vote/[trendAlias]/result/metadata';
import { ResultContent } from '@/components/features/Result/ResultContent';
import { ResultSkeleton } from '@/components/features/Result/ResultSkeleton/ResultSkeleton';
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
  const { trendAlias } = await params;
  const { id: resultId, compareId } = await searchParams;

  if (!resultId) {
    redirect('/');
  }

  try {
    const [myResult, friendResults] = await Promise.all([
      serverDisplayApi.getResultDisplay({ resultId, compareId }),
      serverDisplayApi.getResultDisplayInvitee(resultId).catch(() => null), // 실패해도 계속 진행
    ]);

    return (
      <Suspense fallback={<LoadingFallback />}>
        <ResultContent
          trendAlias={trendAlias}
          resultId={resultId}
          compareId={compareId}
          myResult={myResult}
          friendResults={friendResults}
        />
      </Suspense>
    );
  } catch (error) {
    console.error('Result fetch error:', error);
    notFound();
  }
}

// 로딩 UI
function LoadingFallback() {
  return <ResultSkeleton />;
}
