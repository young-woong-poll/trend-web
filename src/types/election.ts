/**
 * 선거 후보자
 */
export interface Candidate {
  id: number;
  name: string;
  description: string;
}

/**
 * 선거 기간
 */
export interface ElectionPeriod {
  startTime: string;
  endTime: string;
}

/**
 * 선거 종류
 */
export type ElectionKind = 'SINGLE';

/**
 * 선거 상태
 */
export type ElectionStatus = 'OPEN' | 'CLOSED';

/**
 * 선거 상세 정보
 */
export interface ElectionDetail {
  id: number;
  isUnlimted: boolean;
  title: string;
  description: string;
  status: ElectionStatus;
  kind: ElectionKind;
  allowMultipleVotes: boolean;
  period: ElectionPeriod;
  candidates: Candidate[];
}

/**
 * 선거 상세 조회 응답
 */
export interface ElectionDetailResponse {
  code: string;
  message: string;
  data: ElectionDetail;
}
