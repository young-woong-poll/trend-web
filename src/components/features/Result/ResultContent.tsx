'use client';

import { useQuery } from '@tanstack/react-query';

import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';
import { CompareLinkCard } from '@/components/features/Result/CompareLinkCard/CompareLinkCard';
import { ComparisonWithFriend } from '@/components/features/Result/ComparisonWithFriend/ComparisonWithFriend';
import { CopyUrlCard } from '@/components/features/Result/CopyUrlCard/CopyUrlCard';
import styles from '@/components/features/Result/ResultContent.module.scss';
import { TypeCard } from '@/components/features/Result/TypeCard/TypeCard';
import { displayQueries } from '@/lib/react-query/queries';

interface ResultContentProps {
  trendAlias: string;
  resultId: string;
  compareId?: string;
}

/**
 * 결과 페이지 컨텐츠
 * - 서버에서 prefetch한 데이터를 캐시에서 읽음
 */
export const ResultContent = ({ trendAlias, resultId, compareId }: ResultContentProps) => {
  // 서버에서 prefetch한 데이터를 캐시에서 읽음
  const { data: myResult } = useQuery(displayQueries.result(resultId, compareId));
  const { data: friendResults } = useQuery(displayQueries.resultInvitee(resultId));

  // 서버에서 prefetch되므로 data는 항상 존재
  if (!myResult) {
    return null; // 또는 Skeleton UI
  }

  return (
    <div className={styles.container}>
      <MainHeader />

      <div className={styles.content}>
        {/* 비교 링크인 경우 비교 결과 표시, 아니면 내 성향 카드 */}
        {compareId ? (
          <ComparisonWithFriend resultWithCompareId={myResult} compareId={compareId} />
        ) : (
          <TypeCard
            questions={myResult.trend}
            selectedOptions={myResult.selectedOptions}
            resultType={myResult.resultType}
          />
        )}

        {/* 친구와 비교하기 - 친구 결과 있을 때만 */}
        {friendResults && (
          <CompareLinkCard
            trendAlias={trendAlias}
            friendResults={friendResults.results}
            myResult={myResult}
            resultId={resultId}
          />
        )}

        {/* URL 복사 카드 */}
        <CopyUrlCard />
      </div>
    </div>
  );
};
