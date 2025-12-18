import { Suspense } from 'react';

import { notFound } from 'next/navigation';

import { ResultContent } from '@/components/features/Result/ResultContent';
import { ResultSkeleton } from '@/components/features/Result/ResultSkeleton/ResultSkeleton';
import { SITE_NAME, OG_IMAGE } from '@/lib/seo/constants';
import { serverDisplayApi } from '@/services/api/server/display';

import type { Metadata } from 'next';

interface ResultPageProps {
  params: Promise<{
    trendAlias: string;
  }>;
  searchParams: Promise<{
    id?: string;
    compareId?: string;
  }>;
}

// 메타데이터 생성
export async function generateMetadata({ searchParams }: ResultPageProps): Promise<Metadata> {
  const { id: resultId, compareId } = await searchParams;

  if (!resultId) {
    return {
      title: '투표 결과',
      description:
        '이번 주 대한민국은 이걸로 싸운다 🔥 투표 결과를 확인하고 친구들과 비교해보세요!',
    };
  }

  try {
    const result = await serverDisplayApi.getResultDisplay({ resultId, compareId });

    // 닉네임과 결과 타입 추출
    const nickname = result.nickname || '익명';
    const resultType = result.resultType || '알 수 없는 유형';

    // 비교 링크인 경우와 일반 링크인 경우 구분
    if (compareId) {
      // 비교 링크: "{닉네임}님의 결과는 {타입}"
      const title = `${nickname}님의 결과는 ${resultType}`;
      const description = `${nickname}님과 나의 취향이 같을까? 🔥 지금 바로 비교해보세요!`;

      return {
        title, // template에 의해 자동으로 "| HotPick" 추가됨
        description,
        openGraph: {
          title,
          description,
          type: 'website',
          siteName: SITE_NAME,
          images: [OG_IMAGE],
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [OG_IMAGE.url],
        },
      };
    } else {
      // 일반 링크: "내 결과는 {타입}"
      const title = `내 결과는 ${resultType}`;
      const description = `나의 투표 결과를 확인하고 친구들과 비교해보세요! 🔥 너랑 나랑 뇌 구조가 같을까?`;

      return {
        title, // template에 의해 자동으로 "| HotPick" 추가됨
        description,
        openGraph: {
          title,
          description,
          type: 'website',
          siteName: SITE_NAME,
          images: [OG_IMAGE],
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [OG_IMAGE.url],
        },
      };
    }
  } catch (_error) {
    return {
      title: '투표 결과',
      description: '이번 주 대한민국은 이걸로 싸운다 🔥',
    };
  }
}

export default async function ResultPage({ params, searchParams }: ResultPageProps) {
  // params와 searchParams 추출
  const { trendAlias } = await params;
  const { id: resultId, compareId } = await searchParams;

  // resultId 필수 체크
  if (!resultId) {
    notFound();
  }

  try {
    // 서버에서 초기 데이터 페칭 (병렬 처리)
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
    // 에러 처리 - 에러 페이지로 이동
    console.error('Result fetch error:', error);
    notFound();
  }
}

// 로딩 UI
function LoadingFallback() {
  return <ResultSkeleton />;
}
