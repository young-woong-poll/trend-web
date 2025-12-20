import { Header } from '@/components/common/Header/Header';
import { CompareLinkCard } from '@/components/features/Result/CompareLinkCard/CompareLinkCard';
import { ComparisonWithFriend } from '@/components/features/Result/ComparisonWithFriend/ComparisonWithFriend';
import { CopyUrlCard } from '@/components/features/Result/CopyUrlCard/CopyUrlCard';
import styles from '@/components/features/Result/ResultContent.module.scss';
import { TypeCard } from '@/components/features/Result/TypeCard/TypeCard';
import type { InviteeResultResponse, ResultDisplayResponse } from '@/types/result';

interface ResultContentProps {
  trendAlias: string;
  resultId: string;
  compareId?: string;
  myResult: ResultDisplayResponse;
  friendResults: InviteeResultResponse | null;
}

export const ResultContent = ({
  trendAlias,
  resultId,
  compareId,
  myResult,
  friendResults,
}: ResultContentProps) => (
  <div className={styles.container}>
    <Header />

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
