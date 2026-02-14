'use client';

import { useEffect, useRef } from 'react';

import { useQuery } from '@tanstack/react-query';

import { ActionButtons } from '@/components/features/Result/ActionButtons/ActionButtons';
import { PickHistory } from '@/components/features/Result/PickHistory/PickHistory';
import styles from '@/components/features/Result/ResultContent.module.scss';
import { ResultHeader } from '@/components/features/Result/ResultHeader/ResultHeader';
import { TypeCard } from '@/components/features/Result/TypeCard/TypeCard';
import { displayQueries } from '@/hooks/api/useDisplay';
import { useHotpickResultHistory } from '@/hooks/useVoteResultHistory';
import type { SelectedOption } from '@/types/result';

interface ResultContentProps {
  hotpickAlias: string;
  resultId: string;
}

/**
 * 결과 페이지 컨텐츠
 */
export const ResultContent = ({ hotpickAlias, resultId }: ResultContentProps) => {
  const { data: resultData } = useQuery(displayQueries.result(resultId));
  const { data: hotpickData } = useQuery(displayQueries.hotpick(hotpickAlias));

  // 결과 히스토리 저장
  const { addToHistory } = useHotpickResultHistory();
  const hasStoredRef = useRef(false);

  // 결과 페이지 조회 시 히스토리에 저장 (최초 1회만)
  useEffect(() => {
    if (resultData && hotpickData && !hasStoredRef.current) {
      hasStoredRef.current = true;
      addToHistory({
        hotpickAlias,
        resultId,
        hotpickTitle: hotpickData.title ?? '',
        resultLabel: resultData.resultLabel ?? '',
      });
    }
  }, [hotpickAlias, resultId, resultData, hotpickData, addToHistory]);

  // 서버에서 prefetch되므로 data는 항상 존재
  if (!resultData || !hotpickData) {
    return null;
  }

  // Orval 생성 타입을 로컬 타입으로 변환
  // NOTE: opt.itemId/opt.itemTitle are generated model field names (will be renamed after BE migration)
  const selectedOptions: SelectedOption[] = (resultData.selectedOptions ?? []).map((opt) => ({
    electionId: opt.itemId ?? '',
    electionTitle: opt.itemTitle ?? '',
    optionId: opt.optionId ?? '',
    optionTitle: opt.optionTitle ?? '',
    optionImageUrl: opt.optionImageUrl ?? '',
    percent: opt.percent ?? 0,
  }));

  return (
    <div className={styles.container}>
      <ResultHeader title={hotpickData.title ?? ''} />

      <div className={styles.content}>
        {/* 유형 카드 (대중성 지수 포함) */}
        <TypeCard selectedOptions={selectedOptions} />

        {/* MY PICK HISTORY */}
        <PickHistory selectedOptions={selectedOptions} />

        {/* 하단 버튼 영역 */}
        <ActionButtons hotpickAlias={hotpickAlias} />

        {/* 서비스 문의 및 피드백 */}
        <footer className={styles.feedback}>
          <p className={styles.feedbackText}>서비스 문의 및 피드백</p>
          <a href="mailto:voteboxxxxx@gmail.com" className={styles.feedbackEmail}>
            voteboxxxxx@gmail.com
          </a>
        </footer>
      </div>
    </div>
  );
};
