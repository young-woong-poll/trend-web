import type { CategoryTabResponse } from './categoryTabResponse';
import type { HotpickCardResponse } from './hotpickCardResponse';

/**
 * 응답 데이터
 */
export interface MainHotpickResponse {
  categories?: CategoryTabResponse[];
  hotpicks?: HotpickCardResponse[];
  nextCursor?: string;
  hasMore?: boolean;
}
