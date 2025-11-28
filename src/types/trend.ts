/**
 * Trend 관련 타입 정의
 */

/**
 * 메인 전시 Trend 아이템
 */
export interface MainTrendItem {
  id: string;
  title: string;
  label: string;
  imageUrl: string;
  participantsCount: number;
}

/**
 * 메인 전시 API 응답
 */
export interface MainDisplayResponse {
  trends: MainTrendItem[];
}

/**
 * Trend 옵션
 */
export interface TrendOption {
  id: string;
  title: string;
  imageUrl: string;
}

/**
 * Trend 아이템
 */
export interface TrendItem {
  id: string;
  title: string;
  label: string;
  options: TrendOption[];
}

/**
 * Trend 전시 조회 API 응답
 */
export interface TrendDisplayResponse {
  items: TrendItem[];
}

/**
 * Trend 투표 수 옵션
 */
export interface TrendVoteCountOption {
  id: string;
  count: number;
}

/**
 * Trend 현재 투표 수 조회 API 응답
 */
export interface TrendVoteCountResponse {
  options: TrendVoteCountOption[];
}

/**
 * Trend 항목 옵션 카운트 응답 (개별 item)
 */
export interface TrendItemOptionsResponse {
  options: TrendVoteCountOption[];
}

/**
 * Admin: Trend 생성 - 라벨 요청
 */
export interface LabelRequest {
  label: string;
}

/**
 * Admin: Trend 생성 - 결과 타입 요청
 */
export interface ResultTypeRequest {
  key: string;
  label: string;
}

/**
 * Admin: Trend 생성 - 메타 정보 요청
 */
export interface TrendMetaRequest {
  resultLabel: string;
  resultType: ResultTypeRequest[];
  answerType: LabelRequest[];
}

/**
 * Admin: Trend 생성 요청
 */
export interface CreateTrendRequest {
  title: string;
  label: string;
  imageUrl: string;
  electionIds: string[];
  meta: TrendMetaRequest;
}

/**
 * Admin: Trend 생성 응답
 */
export interface TrendResponse {
  id: string;
}
