// ──────────────────────────────────────────────────────────
// [DEPRECATED] 수동 정의 타입 — BE API 연동 후 Orval 생성 타입으로 교체 예정
//
// BE OpenAPI 스펙 확정 → `npx orval` 재생성 후:
// 1. 이 파일의 수동 타입들을 삭제
// 2. import를 Orval 생성 타입(src/generated/models)으로 교체
//
// 사용처:
// - src/services/api/election.ts
// - src/hooks/api/useElection.ts
// - src/types/display.ts (VoteType)
// - src/types/hotpick.ts (VoteType import)
// - Admin Election 컴포넌트들
// ──────────────────────────────────────────────────────────

export type VoteType = 'IMAGE' | 'TEXT';

export type ElectionStatus = 'OPEN' | 'CLOSED';

export interface ElectionOption {
  id: string;
  title: string;
  imageUrl?: string; // IMAGE 유형일 때 필수, TEXT 유형일 때 불필요
  order: number; // 옵션 순서 (0부터)
}

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

export interface CreateElectionRequest {
  title: string;
  voteType: VoteType;
  mainImageUrl?: string;
  options: Omit<ElectionOption, 'id'>[];
}

export type UpdateElectionRequest = CreateElectionRequest;

export interface ElectionListResponse {
  content: Election[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

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
