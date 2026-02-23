/**
 * Hotpick 관련 FE 전용 타입 정의
 *
 * Generated 타입(src/generated/models)과 충돌하지 않도록
 * CreateHotpickRequest, UpdateHotpickRequest는 제거됨.
 * Admin API 타입은 generated AdminHotpickSummaryResponse / AdminHotpickDetailResponse 사용.
 */

/**
 * 핫픽 유형
 */
export type HotpickType = 'BUNDLE' | 'SINGLE';

/**
 * 핫픽 상태
 */
export type HotpickStatus = 'OPEN' | 'CLOSED';

/**
 * 카테고리 코드 (FE 전용, 기존 호환)
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

// ── BUNDLE 전용 타입 (FE only, BE 개발 보류) ──

/**
 * Admin: Hotpick 생성 - 결과 타입 요청 (BUNDLE 전용)
 */
export interface ResultTypeRequest {
  key: string;
  label: string;
  description?: string;
  imageUrl?: string;
  tags?: string[];
}

/**
 * Admin: Hotpick 생성 - 메타 정보 요청 (BUNDLE 전용)
 */
export interface HotpickMetaRequest {
  resultLabel?: string;
  resultType?: ResultTypeRequest[];
}

/**
 * Hotpick 메타 정보 (BUNDLE 전용)
 */
export interface HotpickMeta {
  resultLabel?: string;
  resultTypes?: HotpickResultType[];
}

/**
 * Hotpick 결과 타입 (BUNDLE 전용)
 */
export interface HotpickResultType {
  key: string;
  label: string;
  description?: string;
  imageUrl?: string;
  tags?: string[];
}

/**
 * Admin: Hotpick Alias 중복 체크 응답
 */
export interface HotpickAliasCheckResponse {
  exists: boolean;
}
