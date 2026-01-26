import { useCallback } from 'react';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  MAX_RESULT_HISTORY_ITEMS,
  STORAGE_KEYS,
  type VoteResultHistoryItem,
} from '@/types/localStorage';

/**
 * 투표 결과 히스토리 관리 훅
 * - localStorage에 결과 조회 기록을 저장/관리
 * - 중복 방지, 최대 개수 제한 적용
 */
export function useVoteResultHistory() {
  const [history, setHistory] = useLocalStorage<VoteResultHistoryItem[]>(
    STORAGE_KEYS.VOTE_RESULT_HISTORY,
    []
  );

  /**
   * 결과 히스토리에 추가 (중복 방지, 최대 개수 제한)
   * - 이미 존재하는 경우 타임스탬프 업데이트 후 최상단으로 이동
   */
  const addToHistory = useCallback(
    (item: Omit<VoteResultHistoryItem, 'viewedAt'>) => {
      setHistory((prev) => {
        // 중복 체크: 같은 trendAlias + resultId 조합이 있는지 확인
        const existingIndex = prev.findIndex(
          (h) => h.trendAlias === item.trendAlias && h.resultId === item.resultId
        );

        const newItem: VoteResultHistoryItem = {
          ...item,
          viewedAt: new Date().toISOString(),
        };

        let updated: VoteResultHistoryItem[];

        if (existingIndex !== -1) {
          // 이미 존재하면 해당 항목 제거 후 맨 앞에 추가 (최근 조회로 업데이트)
          updated = [newItem, ...prev.slice(0, existingIndex), ...prev.slice(existingIndex + 1)];
        } else {
          // 새 항목을 맨 앞에 추가
          updated = [newItem, ...prev];
        }

        // 최대 개수 제한
        return updated.slice(0, MAX_RESULT_HISTORY_ITEMS);
      });
    },
    [setHistory]
  );

  /**
   * 특정 결과가 히스토리에 있는지 확인
   */
  const isInHistory = useCallback(
    (trendAlias: string, resultId: string) =>
      history.some((h) => h.trendAlias === trendAlias && h.resultId === resultId),
    [history]
  );

  /**
   * 히스토리 전체 삭제
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  /**
   * 특정 항목 삭제
   */
  const removeFromHistory = useCallback(
    (trendAlias: string, resultId: string) => {
      setHistory((prev) =>
        prev.filter((h) => !(h.trendAlias === trendAlias && h.resultId === resultId))
      );
    },
    [setHistory]
  );

  return {
    history,
    addToHistory,
    isInHistory,
    clearHistory,
    removeFromHistory,
  };
}
