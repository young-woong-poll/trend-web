/**
 * Result 관련 타입 정의
 */

/**
 * Result 생성 요청
 */
export interface CreateResultRequest {
  hotpickId: number;
  selectedElections: SelectedElection[];
}

/**
 * Result 생성 응답
 */
export interface CreateResultResponse {
  resultId: string;
}

/**
 * 투표 선택된 응답들
 */
export interface SelectedElection {
  electionId: string;
  optionId: string;
}

/**
 * Result 타입 정보
 */
export interface ResultType {
  label: string;
  description: string;
  imageUrl: string;
  tags: string[];
}

/**
 * 선택된 옵션 정보
 */
export interface SelectedOption {
  electionId: string;
  electionTitle: string;
  optionId: string;
  optionTitle: string;
  optionImageUrl: string;
  percent: number;
}

/**
 * Result 전시 조회 API 응답
 */
export interface ResultDisplayResponse {
  resultId: string;
  resultLabel: string;
  resultType: ResultType;
  selectedOptions: SelectedOption[];
}

/**
 * Result 존재 여부 확인 응답
 */
export interface ResultExistsResponse {
  exists: boolean;
}
