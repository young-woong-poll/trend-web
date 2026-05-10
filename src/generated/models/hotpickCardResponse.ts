import type { ElectionViewResponse } from './electionViewResponse';
import type { HotpickCardResponseTag } from './hotpickCardResponseTag';
import type { HotpickCategoryResponse } from './hotpickCategoryResponse';
import type { TopCommentResponse } from './topCommentResponse';

export interface HotpickCardResponse {
  hotpickId?: number;
  type?: string;
  slug?: string;
  imageUrl?: string;
  expiredAt?: string;
  isExpired?: boolean;
  /** 메인 노출 태그. main(sort)에서만 값이 내려가며 상세/연관 목록에서는 null일 수 있음 */
  tag?: HotpickCardResponseTag;
  likeCount?: number;
  liked?: boolean;
  categories?: HotpickCategoryResponse[];
  topComment?: TopCommentResponse;
  election?: ElectionViewResponse;
}
