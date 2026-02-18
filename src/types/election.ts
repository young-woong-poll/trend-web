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

// ── 연결된 핫픽 정보 ──

export interface LinkedHotpick {
  id: number;
  alias: string;
}

// ── 옵션 (Discriminated by Election voteType) ──

export interface ElectionOptionBase {
  id: string;
  title: string;
  order: number; // 옵션 순서 (0부터)
}

export interface ImageElectionOption extends ElectionOptionBase {
  imageUrl: string; // IMAGE 유형에서는 필수
}

export type TextElectionOption = ElectionOptionBase; // TEXT 유형에서는 imageUrl 없음

// ── Election (Discriminated Union) ──

interface ElectionBase {
  id: string;
  title: string;
  linkedHotpicks?: LinkedHotpick[];
  createdAt: string;
  updatedAt: string;
}

export interface ImageElection extends ElectionBase {
  voteType: 'IMAGE';
  options: ImageElectionOption[];
}

export interface TextElection extends ElectionBase {
  voteType: 'TEXT';
  mainImageUrl: string; // TEXT 유형에서는 필수
  options: TextElectionOption[];
}

export type Election = ImageElection | TextElection;

// ── Request (Discriminated Union) ──

export interface CreateImageElectionRequest {
  title: string;
  voteType: 'IMAGE';
  options: Omit<ImageElectionOption, 'id'>[];
}

export interface CreateTextElectionRequest {
  title: string;
  voteType: 'TEXT';
  mainImageUrl: string;
  options: Omit<TextElectionOption, 'id'>[];
}

export type CreateElectionRequest = CreateImageElectionRequest | CreateTextElectionRequest;

export type UpdateElectionRequest = CreateElectionRequest;

// ── List 관련 ──

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
  page?: number;
  size?: number;
}

// ──────────────────────────────────────────────────────────
// Legacy types (console 기반) — Phase 3 마이그레이션 후 제거 예정
// ──────────────────────────────────────────────────────────

/**
 * @deprecated console 선거 후보자. ImageElectionOption 또는 TextElectionOption을 사용하세요.
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
