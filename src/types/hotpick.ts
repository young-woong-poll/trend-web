/**
 * Hotpick 관련 타입 정의
 */

import type { VoteType } from '@/types/election';

/**
 * 핫픽 유형
 */
export type HotpickType = 'BUNDLE' | 'SINGLE';

/**
 * 핫픽 상태
 */
export type HotpickStatus = 'OPEN' | 'CLOSED';

/**
 * 카테고리 코드 (DB 10개)
 * - 화면 필터에는 6개만 노출: 연애/결혼, 재테크, 직장, 스포츠, 음식, 트렌드
 */
export type CategoryCode =
  | 'LOVE'
  | 'MARRIAGE'
  | 'FINANCE'
  | 'WORK'
  | 'SPORTS'
  | 'FOOD'
  | 'GAME'
  | 'CAR'
  | 'HEALTH'
  | 'TREND';

/**
 * 메인 전시 Hotpick 아이템
 */
export interface MainHotpickItem {
  id: string;
  alias: string;
  title: string;
  label: string;
  type?: HotpickType;
  categoryCodes?: CategoryCode[];
  deadline?: string;
  status?: HotpickStatus;
  imageUrls: string[];
  createdAt: string;
  participantsCount: number;
}

/**
 * 메인 전시 API 응답 (페이지네이션 포함)
 */
export interface MainDisplayResponse {
  hotpicks: MainHotpickItem[];
  hasMore: boolean;
  nextPage: number | null;
  totalCount: number;
}

/**
 * Hotpick 옵션
 */
export interface HotpickOption {
  id: string;
  title: string;
  imageUrl?: string; // TEXT 유형일 때 불필요
}

/**
 * Hotpick 선거 (Election)
 */
export interface HotpickElection {
  id: string;
  title: string;
  label: string;
  voteType?: VoteType;
  mainImageUrl?: string;
  options: HotpickOption[];
}

/**
 * Hotpick 전시 조회 API 응답
 */
export interface HotpickDisplayResponse {
  hotpickId: string;
  alias: string;
  title: string;
  label: string;
  type?: HotpickType;
  categoryCodes?: CategoryCode[];
  deadline?: string;
  status?: HotpickStatus;
  imageUrls: string[];
  createdAt: string;
  elections: HotpickElection[];
}

/**
 * Hotpick 투표 수 옵션
 */
export interface HotpickVoteCountOption {
  id: string;
  count: number;
}

/**
 * Hotpick 현재 투표 수 조회 API 응답
 */
export interface HotpickVoteCountResponse {
  options: HotpickVoteCountOption[];
}

/**
 * Hotpick 선거 옵션 카운트 응답 (개별 election)
 */
export interface HotpickElectionOptionsResponse {
  options: HotpickVoteCountOption[];
}

/**
 * Admin: Hotpick 생성 - 라벨 요청
 */
export interface LabelRequest {
  label: string;
}

/**
 * Admin: Hotpick 생성 - 결과 타입 요청
 */
export interface ResultTypeRequest {
  key: string;
  label: string;
  description?: string;
  imageUrl?: string;
  tags?: string[];
}

/**
 * Admin: Hotpick 생성 - 메타 정보 요청
 */
export interface HotpickMetaRequest {
  resultLabel?: string;
  resultType?: ResultTypeRequest[];
}

/**
 * Admin: Hotpick 생성 요청
 */
export interface CreateHotpickRequest {
  alias: string;
  title: string;
  label?: string;
  type: HotpickType;
  imageUrls?: string[];
  electionIds: string[];
  categoryCodes?: CategoryCode[];
  deadline?: string;
  meta?: HotpickMetaRequest;
  isVisible?: boolean;
}

/**
 * Admin: Hotpick 수정 요청
 */
export interface UpdateHotpickRequest {
  alias: string;
  title: string;
  label?: string;
  type: HotpickType;
  imageUrls?: string[];
  electionIds: string[];
  categoryCodes?: CategoryCode[];
  deadline?: string;
  meta?: HotpickMetaRequest;
  isVisible?: boolean;
}

/**
 * Admin: Hotpick 생성 응답
 */
export interface HotpickResponse {
  id: number;
  alias: string;
}

/**
 * Hotpick 메타 정보
 */
export interface HotpickMeta {
  resultLabel?: string;
  resultTypes?: HotpickResultType[];
}

/**
 * Hotpick 결과 타입
 */
export interface HotpickResultType {
  key: string;
  label: string;
  description?: string;
  imageUrl?: string;
  tags?: string[];
}

/**
 * Admin: Hotpick 응답
 */
export interface AdminHotpickResponse {
  id: number;
  alias: string;
  title: string;
  label?: string;
  type?: HotpickType;
  categoryCodes?: CategoryCode[];
  deadline?: string;
  status?: HotpickStatus;
  imageUrls?: string[];
  electionIds: string[];
  meta?: HotpickMeta;
  visible: boolean;
  totalVotes?: number;
  createdAt: string;
}

/**
 * Admin: Hotpick Alias 중복 체크 응답
 */
export interface HotpickAliasCheckResponse {
  exists: boolean;
}
