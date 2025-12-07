/**
 * 선거 후보자
 */
export interface Option {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
}

/**
 * 선거 종류
 */
export type ElectionKind = 'DEFAULT';

/**
 * 선거 상태
 */
export type ElectionStatus = 'READY' | 'OPEN' | 'CLOSED';

/**
 * 선거 상세 정보
 */
export interface ElectionDetail {
  id: number;
  title: string;
  description: string;
  kind: ElectionKind;
  allowMultipleVotes: boolean;
  status: ElectionStatus;
  startTime: string;
  endTime: string;
  createdAt: string;
  isUnlimited: boolean;
  options: Option[];
}
