import type { HotpickCardResponse } from './hotpickCardResponse';

/**
 * 응답 데이터
 */
export interface HotpickDetailResponse {
  hotpick?: HotpickCardResponse;
  relatedHotpicks?: HotpickCardResponse[];
}
