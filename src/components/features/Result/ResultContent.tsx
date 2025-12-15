'use client';

import CheckIcon from '@/assets/icon/CheckIcon';
import { Header } from '@/components/common/Header/Header';
import { CompareLinkCard } from '@/components/features/Result/CompareLinkCard/CompareLinkCard';
import { ComparisonWithFriend } from '@/components/features/Result/ComparisonWithFriend/ComparisonWithFriend';
import { CopyUrlCard } from '@/components/features/Result/CopyUrlCard/CopyUrlCard';
import styles from '@/components/features/Result/ResultView.module.scss';
import { TypeCard } from '@/components/features/Result/TypeCard/TypeCard';
import { VOTE_LINK_COPIED_SUCCESS_FULL } from '@/constants/text';
import { useModal } from '@/contexts/ModalContext';
import type { InviteeResultResponse, ResultDisplayResponse } from '@/types/result';

interface ResultContentProps {
  trendAlias: string;
  resultId: string;
  compareId?: string;
  myResult: ResultDisplayResponse;
  friendResults: InviteeResultResponse | null;
}

export const ResultContent = ({
  resultId,
  compareId,
  myResult,
  friendResults,
}: ResultContentProps) => {
  const { showToast } = useModal();

  const handleCopyUrl = async () => {
    const currentUrl = window.location.href;
    await navigator.clipboard.writeText(currentUrl);
    showToast(VOTE_LINK_COPIED_SUCCESS_FULL, <CheckIcon width={16} height={16} />);
  };

  return (
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
            friendResults={friendResults.results}
            myResult={myResult}
            resultId={resultId}
          />
        )}

        {/* URL 복사 카드 */}
        <CopyUrlCard onCopyUrl={handleCopyUrl} />
      </div>
    </div>
  );
};
