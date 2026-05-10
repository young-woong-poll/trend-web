/**
 * 메인 노출 태그. main(sort)에서만 값이 내려가며 상세/연관 목록에서는 null일 수 있음
 */
export type HotpickCardResponseTag =
  (typeof HotpickCardResponseTag)[keyof typeof HotpickCardResponseTag];

export const HotpickCardResponseTag = {
  RECOMMENDED: 'RECOMMENDED',
  HOT_THIS_WEEK: 'HOT_THIS_WEEK',
  LATEST: 'LATEST',
  POPULAR: 'POPULAR',
  HOT_NOW: 'HOT_NOW',
} as const;
