/**
 * Trend 관련 타입 정의
 */

/**
 * 메인 전시 Trend 아이템
 */
export interface MainTrendItem {
  id: string;
  alias: string;
  title: string;
  label: string;
  imageUrl: string;
  createdAt: string;
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
  trendId: string;
  alias: string;
  title: string;
  label: string;
  imageUrl: string;
  createdAt: string;
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
  alias: string;
  title: string;
  label?: string;
  imageUrl?: string;
  electionIds: string[];
  meta?: TrendMetaRequest;
  isVisible?: boolean;
}

/**
 * Admin: Trend 수정 요청
 */
export interface UpdateTrendRequest {
  alias: string;
  title: string;
  label?: string;
  imageUrl?: string;
  electionIds: string[];
  meta?: TrendMetaRequest;
  isVisible?: boolean;
}

/**
 * Admin: Trend 생성 응답
 */
export interface TrendResponse {
  id: number;
  alias: string;
}

/**
 * Trend 메타 정보
 */
export interface TrendMeta {
  resultLabel?: string;
  resultTypes?: TrendResultType[];
  compareTypes?: TrendCompareType[];
}

/**
 * Trend 결과 타입
 */
export interface TrendResultType {
  key: string;
  label: string;
}

/**
 * Trend 비교 타입
 */
export interface TrendCompareType {
  label: string;
}

/**
 * Admin: Trend 응답
 */
export interface AdminTrendResponse {
  id: number;
  alias: string;
  title: string;
  label?: string;
  imageUrl?: string;
  electionIds: string[];
  meta?: TrendMeta;
  visible: boolean;
  createdAt: string;
}

/**
 * Admin: Trend Alias 중복 체크 응답
 */
export interface TrendAliasCheckResponse {
  exists: boolean;
}
