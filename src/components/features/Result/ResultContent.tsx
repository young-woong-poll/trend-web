'use client';

import { useQuery } from '@tanstack/react-query';

import { ActionButtons } from '@/components/features/Result/ActionButtons/ActionButtons';
import { PickHistory } from '@/components/features/Result/PickHistory/PickHistory';
import styles from '@/components/features/Result/ResultContent.module.scss';
import { ResultHeader } from '@/components/features/Result/ResultHeader/ResultHeader';
import { TypeCard } from '@/components/features/Result/TypeCard/TypeCard';
import { displayQueries } from '@/lib/react-query/queries';

interface ResultContentProps {
  trendAlias: string;
  resultId: string;
}

/**
 * 결과 페이지 컨텐츠
 * - 서버에서 prefetch한 데이터를 캐시에서 읽음
 */
export const ResultContent = ({ trendAlias, resultId }: ResultContentProps) => {
  // 서버에서 prefetch한 데이터를 캐시에서 읽음
  const { data: resultData } = useQuery(displayQueries.result(resultId));
  const { data: trendData } = useQuery(displayQueries.trend(trendAlias));

  // 서버에서 prefetch되므로 data는 항상 존재
  if (!resultData || !trendData) {
    return null;
  }

  return (
    <div className={styles.container}>
      <ResultHeader title={trendData.title} />

      <div className={styles.content}>
        {/* 유형 카드 (대중성 지수 포함) */}
        <TypeCard resultType={resultData.resultType} selectedOptions={resultData.selectedOptions} />

        {/* MY PICK HISTORY */}
        <PickHistory selectedOptions={resultData.selectedOptions} />

        {/* 하단 버튼 영역 */}
        <ActionButtons trendAlias={trendAlias} />
      </div>
    </div>
  );
};
