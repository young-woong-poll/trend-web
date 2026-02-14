/**
 * localStorage 관련 타입 정의
 */

/**
 * 투표 결과 히스토리 아이템
 * - hotpickAlias: 핫픽 식별자 (URL에서 사용)
 * - resultId: 결과 고유 ID
 * - viewedAt: 결과 조회 시간 (ISO 8601)
 * - hotpickTitle: 핫픽 제목 (선택적, UI 표시용)
 * - resultLabel: 결과 라벨 (선택적, UI 표시용)
 */
export interface HotpickResultHistoryItem {
  hotpickAlias: string;
  resultId: string;
  viewedAt: string;
  hotpickTitle?: string;
  resultLabel?: string;
}

/**
 * localStorage 키 상수
 */
export const STORAGE_KEYS = {
  VOTE_RESULT_HISTORY: 'vote_result_history',
} as const;

/**
 * 최대 저장 개수
 */
export const MAX_RESULT_HISTORY_ITEMS = 50;
