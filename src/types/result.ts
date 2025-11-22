/**
 * Result 관련 타입 정의
 */

/**
 * Result 생성 요청
 */
export interface CreateResultRequest {
  selectedItems: { itemId: string; optionId: string }[];
  invitationId?: string;
  nickname?: string;
}

/**
 * Result 생성 응답
 */
export interface CreateResultResponse {
  resultId: string;
}

/**
 * Result 전시 - Trend 옵션
 */
export interface ResultTrendOption {
  id: string;
  title: string;
}

/**
 * Result 전시 - Trend 아이템
 */
export interface ResultTrendItem {
  title: string;
  options: ResultTrendOption[];
  selected: string;
  inviterSelected?: string;
}

/**
 * Result 전시 - Trend 정보
 */
export interface ResultTrend {
  items: ResultTrendItem[];
}

/**
 * Result 전시 조회 API 응답
 */
export interface ResultDisplayResponse {
  resultLabel: string;
  resultType: string;
  trend: ResultTrend;
  nickname?: string;
  inviterNickname?: string;
  compareType?: string;
  matchCount?: number;
  totalCount?: number;
}
