/**
 * Hotpick 관련 FE 전용 타입 정의
 *
 * Generated 타입(src/generated/models)과 충돌하지 않도록
 * CreateHotpickRequest, UpdateHotpickRequest는 제거됨.
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
 * 투표 표시 유형
 * 옵션에 이미지가 있으면 IMAGE, 없으면 TEXT
 */
export type VoteType = 'IMAGE' | 'TEXT';

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
