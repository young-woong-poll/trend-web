/**
 * 투표 UI 유형
 */
export type VoteType = 'IMAGE' | 'TEXT';

/**
 * 선거 상태
 */
export type ElectionStatus = 'OPEN' | 'CLOSED';

/**
 * 선거 옵션 (후보)
 */
export interface ElectionOption {
  id: string;
  title: string;
  imageUrl?: string; // IMAGE 유형일 때 필수, TEXT 유형일 때 불필요
  order: number; // 옵션 순서 (0부터)
}

/**
 * HotPick 선거 엔티티
 */
export interface Election {
  id: string;
  title: string;
  voteType: VoteType;
  mainImageUrl?: string; // TEXT 유형일 때 메인 이미지
  options: ElectionOption[];
  status: ElectionStatus;
  linkedHotpickCount?: number; // Admin 목록/상세에서 사용
  createdAt: string;
  updatedAt: string;
}

/**
 * Admin: 선거 생성 요청
 */
export interface CreateElectionRequest {
  title: string;
  voteType: VoteType;
  mainImageUrl?: string;
  options: Omit<ElectionOption, 'id'>[];
}

/**
 * Admin: 선거 수정 요청
 */
export type UpdateElectionRequest = CreateElectionRequest;

/**
 * Admin: 선거 목록 응답 (페이지네이션)
 */
export interface ElectionListResponse {
  content: Election[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/**
 * Admin: 선거 목록 조회 파라미터
 */
export interface ElectionListParams {
  keyword?: string;
  voteType?: VoteType;
  status?: ElectionStatus;
  page?: number;
  size?: number;
}

// ──────────────────────────────────────────────────────────
// Legacy types (console 기반) — Phase 3 마이그레이션 후 제거 예정
// ──────────────────────────────────────────────────────────

/**
 * @deprecated console 선거 후보자. ElectionOption을 사용하세요.
 */
export interface Option {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
}

/**
 * @deprecated console 선거 종류. 더 이상 사용하지 않습니다.
 */
export type ElectionKind = 'DEFAULT';

/**
 * @deprecated console 선거 상세 정보. Election을 사용하세요.
 */
export interface ElectionDetail {
  id: number;
  title: string;
  description: string;
  kind: ElectionKind;
  allowMultipleVotes: boolean;
  status: 'READY' | 'OPEN' | 'CLOSED';
  startTime: string;
  endTime: string;
  createdAt: string;
  isUnlimited: boolean;
  options: Option[];
}
