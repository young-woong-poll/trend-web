/**
 * Result 관련 타입 정의
 */

/**
 * Result 생성 요청
 */
export interface CreateResultRequest {
  selectedItems: SelectedItem[];
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
 * Result 결과 - Trend 아이템
 */
export interface ResultTrendItem {
  title: string;
  options: ResultTrendOption[];
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
  selectedOptions?: string[];
  inviterSelectedOptions?: string[];
  nickname?: string;
  inviterNickname?: string;
  compareType?: string;
  matchCount?: number;
  totalCount?: number;
}

/**
 * 투표 선택된 응답들
 */
export interface SelectedItem {
  itemId: string;
  optionId: string;
}

/**
 * 초대한 친구 결과 목록 조회
 */
export interface InviteeResultResponse {
  results: InviteeResult[];
}

export interface InviteeResult {
  nickname: string;
  compareType: string;
  createdAt: string;
}
